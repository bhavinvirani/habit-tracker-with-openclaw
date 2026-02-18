import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { NotFoundError, BadRequestError } from '../utils/AppError';

class AdminService {
  async getAllUsers({
    page = 1,
    limit = 20,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  }: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<{ users: unknown[]; total: number }> {
    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.UserOrderByWithRelationInput =
      sortBy === 'habitCount'
        ? { habits: { _count: sortOrder as Prisma.SortOrder } }
        : { [sortBy]: sortOrder as Prisma.SortOrder };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          isAdmin: true,
          createdAt: true,
          _count: {
            select: { habits: true, habitLogs: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  async updateUserRole(
    userId: string,
    isAdmin: boolean,
    requestingAdminId: string
  ): Promise<unknown> {
    if (userId === requestingAdminId && !isAdmin) {
      throw new BadRequestError('You cannot remove your own admin privileges');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User', userId);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isAdmin },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    return updated;
  }

  async getApplicationStats(): Promise<Record<string, unknown>> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalHabits,
      totalHabitLogs,
      adminCount,
      activeUsersLast7Days,
      activeUsersLast30Days,
      newRegistrationsLast7Days,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.habit.count(),
      prisma.habitLog.count(),
      prisma.user.count({ where: { isAdmin: true } }),
      prisma.habitLog
        .findMany({
          where: { createdAt: { gte: sevenDaysAgo } },
          select: { userId: true },
          distinct: ['userId'],
        })
        .then((r) => r.length),
      prisma.habitLog
        .findMany({
          where: { createdAt: { gte: thirtyDaysAgo } },
          select: { userId: true },
          distinct: ['userId'],
        })
        .then((r) => r.length),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    ]);

    // Calculate average completion rate
    let avgCompletionRate = 0;
    if (totalHabits > 0) {
      const completedLogs = await prisma.habitLog.count({
        where: { completed: true },
      });
      avgCompletionRate =
        totalHabitLogs > 0 ? Math.round((completedLogs / totalHabitLogs) * 100) : 0;
    }

    return {
      totalUsers,
      totalHabits,
      totalHabitLogs,
      adminCount,
      activeUsersLast7Days,
      activeUsersLast30Days,
      newRegistrationsLast7Days,
      avgCompletionRate,
    };
  }
}

export const adminService = new AdminService();
