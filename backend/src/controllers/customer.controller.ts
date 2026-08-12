import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { Prisma } from '@prisma/client';
import { CustomerType, CustomerStatus, AuthenticatedRequest } from '../types';
import {
  createCustomerSchema,
  updateCustomerSchema,
  createFollowUpSchema,
} from '../validators/customer.validator';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export async function getCustomers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
    const skip = (page - 1) * limit;

    const search = (req.query.search as string)?.trim();
    const customerType = req.query.customerType as CustomerType;
    const status = req.query.status as CustomerStatus;

    const where: Prisma.CustomerWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } },
        { businessName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (customerType && Object.values(CustomerType).includes(customerType)) {
      where.customerType = customerType;
    }

    if (status && Object.values(CustomerStatus).includes(status)) {
      where.status = status;
    }

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              followUpNotes: true,
              salesChallans: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return sendSuccess(
      res,
      customers,
      'Customers retrieved successfully',
      200,
      { page, limit, total, totalPages }
    );
  } catch (error) {
    next(error);
  }
}

export async function getCustomerById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        followUpNotes: {
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: {
              select: { id: true, name: true, role: true },
            },
          },
        },
        salesChallans: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            challanNumber: true,
            totalQuantity: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!customer) {
      return sendError(res, 'Customer not found', 404);
    }

    return sendSuccess(res, customer, 'Customer fetched successfully');
  } catch (error) {
    next(error);
  }
}

export async function createCustomer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = createCustomerSchema.parse(req.body);

    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        mobile: data.mobile,
        email: data.email.toLowerCase().trim(),
        businessName: data.businessName,
        gstNumber: data.gstNumber || null,
        customerType: data.customerType,
        address: data.address,
        status: data.status,
        followUpDate: data.followUpDate,
        notes: data.notes || null,
      },
    });

    // If initial notes were provided, also record an initial follow-up note
    if (data.notes && req.user) {
      await prisma.followUpNote.create({
        data: {
          customerId: customer.id,
          note: `Initial Note: ${data.notes}`,
          followUpDate: data.followUpDate || new Date(),
          createdById: req.user.userId,
        },
      });
    }

    return sendSuccess(res, customer, 'Customer created successfully', 201);
  } catch (error) {
    next(error);
  }
}

export async function updateCustomer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = updateCustomerSchema.parse(req.body);

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'Customer not found', 404);
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        ...data,
        email: data.email ? data.email.toLowerCase().trim() : undefined,
      },
    });

    return sendSuccess(res, updated, 'Customer updated successfully');
  } catch (error) {
    next(error);
  }
}

export async function deleteCustomer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const existing = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: { salesChallans: true },
        },
      },
    });

    if (!existing) {
      return sendError(res, 'Customer not found', 404);
    }

    if (existing._count.salesChallans > 0) {
      return sendError(
        res,
        'Cannot delete customer with existing sales challans. Consider marking customer status as INACTIVE instead.',
        400
      );
    }

    await prisma.customer.delete({ where: { id } });

    return sendSuccess(res, { id }, 'Customer deleted successfully');
  } catch (error) {
    next(error);
  }
}

export async function getFollowUps(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const followUps = await prisma.followUpNote.findMany({
      where: { customerId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return sendSuccess(res, followUps, 'Follow-up notes retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function addFollowUp(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { note, followUpDate } = createFollowUpSchema.parse(req.body);

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return sendError(res, 'Customer not found', 404);
    }

    if (!req.user) {
      return sendError(res, 'Unauthenticated', 401);
    }

    const [newNote] = await prisma.$transaction([
      prisma.followUpNote.create({
        data: {
          customerId: id,
          note,
          followUpDate,
          createdById: req.user.userId,
        },
        include: {
          createdBy: {
            select: { id: true, name: true, role: true },
          },
        },
      }),
      prisma.customer.update({
        where: { id },
        data: {
          followUpDate,
        },
      }),
    ]);

    return sendSuccess(res, newNote, 'Follow-up note added successfully', 201);
  } catch (error) {
    next(error);
  }
}
