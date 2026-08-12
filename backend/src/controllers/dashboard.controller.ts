import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { ChallanStatus, AuthenticatedRequest } from '../types';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export async function getDashboardStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const [
      totalCustomers,
      totalProducts,
      draftChallans,
      confirmedChallans,
      lowStockRecords,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.product.count(),
      prisma.salesChallan.count({ where: { status: ChallanStatus.DRAFT } }),
      prisma.salesChallan.count({ where: { status: ChallanStatus.CONFIRMED } }),
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*) as count FROM products WHERE "currentStock" <= "minimumStock"
      `,
    ]);

    const lowStockProductsCount = Number(lowStockRecords[0]?.count || 0);

    return sendSuccess(
      res,
      {
        totalCustomers,
        totalProducts,
        lowStockProducts: lowStockProductsCount,
        draftChallans,
        confirmedChallans,
      },
      'Dashboard statistics fetched successfully'
    );
  } catch (error) {
    next(error);
  }
}

export async function getDashboardActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const [recentChallans, lowStockProducts, recentMovements] = await Promise.all([
      prisma.salesChallan.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, name: true, businessName: true },
          },
          createdBy: {
            select: { id: true, name: true, role: true },
          },
        },
      }),
      prisma.$queryRaw<any[]>`
        SELECT id, name, sku, category, "currentStock", "minimumStock", location
        FROM products
        WHERE "currentStock" <= "minimumStock"
        ORDER BY "currentStock" ASC
        LIMIT 5
      `,
      prisma.stockMovement.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { id: true, name: true, sku: true },
          },
          createdBy: {
            select: { id: true, name: true, role: true },
          },
        },
      }),
    ]);

    return sendSuccess(
      res,
      {
        recentChallans,
        lowStockProducts: lowStockProducts.map((p) => ({
          ...p,
          isLowStock: true,
        })),
        recentMovements,
      },
      'Dashboard activity fetched successfully'
    );
  } catch (error) {
    next(error);
  }
}
