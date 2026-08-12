import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { Prisma } from '@prisma/client';
import { MovementType, AuthenticatedRequest } from '../types';
import { createProductSchema, updateProductSchema } from '../validators/product.validator';
import { sendSuccess, sendError } from '../utils/response';

export async function getProducts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
    const skip = (page - 1) * limit;

    const search = (req.query.search as string)?.trim();
    const category = (req.query.category as string)?.trim();
    const lowStock = req.query.lowStock === 'true';

    const where: Prisma.ProductWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (lowStock) {
      const lowStockRecords = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM products WHERE "currentStock" <= "minimumStock"
      `;
      const lowStockIds = lowStockRecords.map((r) => r.id);
      where.id = { in: lowStockIds };
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Enhance products with lowStock boolean flag for convenient frontend consumption
    const enrichedProducts = products.map((p) => ({
      ...p,
      isLowStock: p.currentStock <= p.minimumStock,
    }));

    const totalPages = Math.ceil(total / limit) || 1;

    return sendSuccess(
      res,
      enrichedProducts,
      'Products retrieved successfully',
      200,
      { page, limit, total, totalPages }
    );
  } catch (error) {
    next(error);
  }
}

export async function getCategories(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const categories = await prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    return sendSuccess(
      res,
      categories.map((c) => c.category),
      'Categories fetched successfully'
    );
  } catch (error) {
    next(error);
  }
}

export async function getProductById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockMovements: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: {
              select: { id: true, name: true, role: true },
            },
          },
        },
      },
    });

    if (!product) {
      return sendError(res, 'Product not found', 404);
    }

    return sendSuccess(
      res,
      {
        ...product,
        isLowStock: product.currentStock <= product.minimumStock,
      },
      'Product fetched successfully'
    );
  } catch (error) {
    next(error);
  }
}

export async function createProduct(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = createProductSchema.parse(req.body);

    const existingSku = await prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (existingSku) {
      return sendError(res, `A product with SKU '${data.sku}' already exists`, 409);
    }

    if (!req.user) {
      return sendError(res, 'Unauthenticated', 401);
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: data.name,
          sku: data.sku,
          category: data.category,
          unitPrice: data.unitPrice,
          currentStock: data.currentStock,
          minimumStock: data.minimumStock,
          location: data.location,
        },
      });

      // If initial stock was provided, create an initial IN movement record for auditability
      if (data.currentStock > 0) {
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            quantity: data.currentStock,
            type: MovementType.IN,
            reason: 'Initial inventory intake upon product creation',
            createdById: req.user!.userId,
          },
        });
      }

      return product;
    });

    return sendSuccess(
      res,
      {
        ...result,
        isLowStock: result.currentStock <= result.minimumStock,
      },
      'Product created successfully',
      201
    );
  } catch (error) {
    next(error);
  }
}

export async function updateProduct(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = updateProductSchema.parse(req.body);

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'Product not found', 404);
    }

    if (data.sku && data.sku !== existing.sku) {
      const duplicateSku = await prisma.product.findUnique({
        where: { sku: data.sku },
      });
      if (duplicateSku) {
        return sendError(res, `A product with SKU '${data.sku}' already exists`, 409);
      }
    }

    // Direct editing of currentStock without a StockMovement record is prohibited by business rules
    const updatePayload: Prisma.ProductUpdateInput = {
      name: data.name,
      sku: data.sku,
      category: data.category,
      unitPrice: data.unitPrice,
      minimumStock: data.minimumStock,
      location: data.location,
    };

    const updated = await prisma.product.update({
      where: { id },
      data: updatePayload,
    });

    return sendSuccess(
      res,
      {
        ...updated,
        isLowStock: updated.currentStock <= updated.minimumStock,
      },
      'Product updated successfully'
    );
  } catch (error) {
    next(error);
  }
}

export async function deleteProduct(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const existing = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            challanItems: true,
            stockMovements: true,
          },
        },
      },
    });

    if (!existing) {
      return sendError(res, 'Product not found', 404);
    }

    if (existing._count.challanItems > 0) {
      return sendError(
        res,
        'Cannot delete product because it is referenced in sales challans. Archive or zero-out stock instead.',
        400
      );
    }

    await prisma.product.delete({ where: { id } });

    return sendSuccess(res, { id }, 'Product deleted successfully');
  } catch (error) {
    next(error);
  }
}
