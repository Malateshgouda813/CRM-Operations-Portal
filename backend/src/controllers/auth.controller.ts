import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { ENV } from '../config/env';
import { loginSchema } from '../validators/auth.validator';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest, JwtPayload, Role } from '../types';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return sendError(res, 'Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password', 401);
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as Role,
      name: user.name,
    };

    const token = jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: '7d' });

    return sendSuccess(
      res,
      {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as Role,
        },
      },
      'Login successful'
    );
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthenticated', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, user, 'Current user profile fetched successfully');
  } catch (error) {
    next(error);
  }
}
