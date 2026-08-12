import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { Prisma } from '@prisma/client';
import { MovementType, AuthenticatedRequest } from '../types';
import { createStockMovementSchema } from '../validators/inventory.validator';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export async function getStockMovements(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 15));
    const skip = (page - 1) * limit;

    const productId = req.query.productId as string;
    const type = req.query.type as MovementType;

    const where: Prisma.StockMovementWhereInput = {};

    if (productId) {
      where.productId = productId;
    }

    if (type && Object.values(MovementType).includes(type)) {
      where.type = type;
    }

    const [total, movements] = await Promise.all([
      prisma.stockMovement.count({ where }),
      prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              category: true,
              currentStock: true,
              minimumStock: true,
              location: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return sendSuccess(
      res,
      movements,
      'Stock movements retrieved successfully',
      200,
      { page, limit, total, totalPages }
    );
  } catch (error) {
    next(error);
  }
}

export async function createStockMovement(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = createStockMovementSchema.parse(req.body);

    if (!req.user) {
      return sendError(res, 'Unauthenticated', 401);
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch product
      const product = await tx.product.findUnique({
        where: { id: data.productId },
      });

      if (!product) {
        throw new Error(`Product with ID '${data.productId}' not found`);
      }

      // 2. Validate OUT movement against current stock
      if (data.type === MovementType.OUT && product.currentStock < data.quantity) {
        throw new Error(
          `Insufficient stock for '${product.name}'. Available: ${product.currentStock}, Requested: ${data.quantity}`
        );
      }

      // 3. Calculate new stock
      const newStock =
        data.type === MovementType.IN
          ? product.currentStock + data.quantity
          : product.currentStock - data.quantity;

      // 4. Update product current stock
      const updatedProduct = await tx.product.update({
        where: { id: product.id },
        data: { currentStock: newStock },
      });

      // 5. Create stock movement record
      const movement = await tx.stockMovement.create({
        data: {
          productId: product.id,
          quantity: data.quantity,
          type: data.type,
          reason: data.reason,
          createdById: req.user!.userId,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              category: true,
              currentStock: true,
              minimumStock: true,
              location: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

      return { movement, updatedProduct };
    });

    return sendSuccess(
      res,
      result.movement,
      `Stock movement recorded successfully. Updated stock: ${result.updatedProduct.currentStock}`,
      201
    );
  } catch (error: any) {
    if (
      error.message.includes('Insufficient stock') ||
      error.message.includes('not found')
    ) {
      return sendError(res, error.message, 400);
    }
    next(error);
  }
}
