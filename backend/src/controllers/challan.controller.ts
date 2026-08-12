import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { Prisma } from '@prisma/client';
import { ChallanStatus, MovementType, AuthenticatedRequest } from '../types';
import { createChallanSchema, updateChallanSchema } from '../validators/challan.validator';
import { generateChallanNumber } from '../utils/challanNumber';
import { sendSuccess, sendError } from '../utils/response';

export async function getChallans(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
    const skip = (page - 1) * limit;

    const status = req.query.status as ChallanStatus;
    const customerId = req.query.customerId as string;
    const search = (req.query.search as string)?.trim();

    const where: Prisma.SalesChallanWhereInput = {};

    if (status && Object.values(ChallanStatus).includes(status)) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (search) {
      where.OR = [
        { challanNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { businessName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, challans] = await Promise.all([
      prisma.salesChallan.count({ where }),
      prisma.salesChallan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              businessName: true,
              mobile: true,
              email: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
          items: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return sendSuccess(
      res,
      challans,
      'Sales challans retrieved successfully',
      200,
      { page, limit, total, totalPages }
    );
  } catch (error) {
    next(error);
  }
}

export async function getChallanById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                currentStock: true,
                location: true,
              },
            },
          },
        },
      },
    });

    if (!challan) {
      return sendError(res, 'Sales challan not found', 404);
    }

    return sendSuccess(res, challan, 'Sales challan retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function createChallan(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = createChallanSchema.parse(req.body);

    if (!req.user) {
      return sendError(res, 'Unauthenticated', 401);
    }

    // 1. Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    });

    if (!customer) {
      return sendError(res, `Customer with ID '${data.customerId}' not found`, 404);
    }

    // 2. Fetch all products to create snapshots and validate IDs
    const productIds = data.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== new Set(productIds).size) {
      return sendError(res, 'One or more specified products do not exist', 400);
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // 3. Compute total quantity and prepare snapshots
    let totalQuantity = 0;
    const itemsData = data.items.map((item) => {
      const product = productMap.get(item.productId)!;
      totalQuantity += item.quantity;

      return {
        productId: product.id,
        productNameSnapshot: product.name,
        skuSnapshot: product.sku,
        unitPriceSnapshot: product.unitPrice,
        quantity: item.quantity,
      };
    });

    // 4. Generate unique challan number
    const challanNumber = await generateChallanNumber(prisma);

    // 5. Create Draft Challan (NO STOCK CHANGES)
    const challan = await prisma.salesChallan.create({
      data: {
        challanNumber,
        customerId: customer.id,
        totalQuantity,
        status: ChallanStatus.DRAFT,
        createdById: req.user.userId,
        items: {
          create: itemsData,
        },
      },
      include: {
        customer: true,
        createdBy: {
          select: { id: true, name: true, role: true },
        },
        items: true,
      },
    });

    return sendSuccess(
      res,
      challan,
      `Draft Sales Challan '${challan.challanNumber}' created successfully. Note: Stock has not been deducted.`,
      201
    );
  } catch (error) {
    next(error);
  }
}

export async function updateChallan(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = updateChallanSchema.parse(req.body);

    const existing = await prisma.salesChallan.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existing) {
      return sendError(res, 'Sales challan not found', 404);
    }

    if (existing.status !== ChallanStatus.DRAFT) {
      return sendError(
        res,
        `Cannot update a challan with status '${existing.status}'. Only DRAFT challans can be modified.`,
        400
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      let totalQuantity = existing.totalQuantity;

      if (data.customerId) {
        const customer = await tx.customer.findUnique({ where: { id: data.customerId } });
        if (!customer) {
          throw new Error('Specified customer not found');
        }
      }

      if (data.items) {
        // Delete old items and insert new ones
        await tx.salesChallanItem.deleteMany({ where: { challanId: id } });

        const productIds = data.items.map((i) => i.productId);
        const products = await tx.product.findMany({ where: { id: { in: productIds } } });
        if (products.length !== new Set(productIds).size) {
          throw new Error('One or more specified products do not exist');
        }

        const productMap = new Map(products.map((p) => [p.id, p]));
        totalQuantity = 0;

        const itemsToCreate = data.items.map((item) => {
          const product = productMap.get(item.productId)!;
          totalQuantity += item.quantity;
          return {
            challanId: id,
            productId: product.id,
            productNameSnapshot: product.name,
            skuSnapshot: product.sku,
            unitPriceSnapshot: product.unitPrice,
            quantity: item.quantity,
          };
        });

        await tx.salesChallanItem.createMany({ data: itemsToCreate });
      }

      const updatedChallan = await tx.salesChallan.update({
        where: { id },
        data: {
          customerId: data.customerId || existing.customerId,
          totalQuantity,
        },
        include: {
          customer: true,
          createdBy: { select: { id: true, name: true, role: true } },
          items: true,
        },
      });

      return updatedChallan;
    });

    return sendSuccess(res, result, 'Sales challan updated successfully');
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return sendError(res, error.message, 400);
    }
    next(error);
  }
}

export async function confirmChallan(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    if (!req.user) {
      return sendError(res, 'Unauthenticated', 401);
    }

    // 1. Fetch the Challan
    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: {
        items: true,
        customer: true,
      },
    });

    if (!challan) {
      return sendError(res, 'Sales challan not found', 404);
    }

    // 2. Validate current status
    if (challan.status === ChallanStatus.CONFIRMED) {
      return sendError(
        res,
        `Challan '${challan.challanNumber}' is already CONFIRMED. Duplicate confirmation is prevented.`,
        400
      );
    }

    if (challan.status === ChallanStatus.CANCELLED) {
      return sendError(
        res,
        `Cannot confirm CANCELLED challan '${challan.challanNumber}'.`,
        400
      );
    }

    if (challan.items.length === 0) {
      return sendError(res, 'Cannot confirm a challan with no line items', 400);
    }

    // 3. Execute Atomic Prisma Transaction
    // Steps:
    // a. Check stock for EVERY item
    // b. If any stock is insufficient, abort completely
    // c. Reduce currentStock for all items
    // d. Create OUT StockMovement records
    // e. Mark challan CONFIRMED
    const confirmedChallan = await prisma.$transaction(async (tx) => {
      // Step A & B: Stock verification
      for (const item of challan.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error(`Product '${item.productNameSnapshot}' (ID: ${item.productId}) no longer exists`);
        }

        if (product.currentStock < item.quantity) {
          throw new Error(
            `Insufficient stock for '${product.name}' (SKU: ${product.sku}). Available: ${product.currentStock}, Required: ${item.quantity}. Confirmation aborted without changing stock.`
          );
        }
      }

      // Step C & D: Deduct stock and record movements
      for (const item of challan.items) {
        // Decrement product stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: {
              decrement: item.quantity,
            },
          },
        });

        // Record OUT StockMovement
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            type: MovementType.OUT,
            reason: `Dispatched against Sales Challan ${challan.challanNumber}`,
            createdById: req.user!.userId,
          },
        });
      }

      // Step E: Update Challan Status to CONFIRMED
      const updated = await tx.salesChallan.update({
        where: { id },
        data: {
          status: ChallanStatus.CONFIRMED,
        },
        include: {
          customer: true,
          createdBy: {
            select: { id: true, name: true, role: true },
          },
          items: true,
        },
      });

      return updated;
    });

    return sendSuccess(
      res,
      confirmedChallan,
      `Sales Challan '${confirmedChallan.challanNumber}' confirmed successfully! Inventory has been updated.`
    );
  } catch (error: any) {
    if (
      error.message.includes('Insufficient stock') ||
      error.message.includes('no longer exists')
    ) {
      return sendError(res, error.message, 400);
    }
    next(error);
  }
}

export async function cancelChallan(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const challan = await prisma.salesChallan.findUnique({
      where: { id },
    });

    if (!challan) {
      return sendError(res, 'Sales challan not found', 404);
    }

    if (challan.status === ChallanStatus.CANCELLED) {
      return sendError(res, 'Challan is already cancelled', 400);
    }

    if (challan.status === ChallanStatus.CONFIRMED) {
      return sendError(
        res,
        'Cannot cancel a CONFIRMED challan directly as goods have already been dispatched. To adjust inventory, record a stock IN movement in the Inventory module.',
        400
      );
    }

    // Status is DRAFT: allow safe cancellation
    const cancelled = await prisma.salesChallan.update({
      where: { id },
      data: {
        status: ChallanStatus.CANCELLED,
      },
      include: {
        customer: true,
        items: true,
      },
    });

    return sendSuccess(
      res,
      cancelled,
      `Draft Challan '${cancelled.challanNumber}' cancelled successfully`
    );
  } catch (error) {
    next(error);
  }
}
