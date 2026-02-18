import { AuditAction, Prisma } from '@prisma/client';
import prisma from '../config/database';
import logger from '../utils/logger';
import { ConflictError, NotFoundError } from '../utils/AppError';

interface FeatureFlagRegistration {
  key: string;
  name: string;
  description?: string;
  category?: string;
  defaultEnabled?: boolean;
  metadata?: Record<string, unknown>;
}

export interface FeatureFlagData {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  enabled: boolean;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}

class FeatureFlagService {
  private cache = new Map<string, FeatureFlagData>();
  private loaded = false;

  async loadAll(): Promise<void> {
    const flags = await prisma.featureFlag.findMany();
    this.cache.clear();
    for (const flag of flags) {
      this.cache.set(flag.key, flag);
    }
    this.loaded = true;
    logger.info(`Loaded ${flags.length} feature flags`);
  }

  async register(reg: FeatureFlagRegistration): Promise<void> {
    const existing = await prisma.featureFlag.findUnique({ where: { key: reg.key } });
    if (existing) return; // No-op if already exists — preserves admin toggle state

    await prisma.featureFlag.create({
      data: {
        key: reg.key,
        name: reg.name,
        description: reg.description ?? null,
        category: reg.category ?? 'general',
        enabled: reg.defaultEnabled ?? false,
        metadata: (reg.metadata as Prisma.InputJsonValue) ?? undefined,
      },
    });
    await this.loadAll();
    logger.info(`Registered feature flag: ${reg.key}`);
  }

  async isEnabled(key: string): Promise<boolean> {
    if (!this.loaded) await this.loadAll();
    return this.cache.get(key)?.enabled ?? false;
  }

  async getAll(): Promise<FeatureFlagData[]> {
    if (!this.loaded) await this.loadAll();
    return Array.from(this.cache.values());
  }

  async getEnabledKeys(): Promise<string[]> {
    if (!this.loaded) await this.loadAll();
    return Array.from(this.cache.values())
      .filter((f) => f.enabled)
      .map((f) => f.key);
  }

  async updateFlag(
    key: string,
    data: {
      enabled?: boolean;
      name?: string;
      description?: string;
      category?: string;
      metadata?: Record<string, unknown>;
    },
    adminUserId?: string
  ): Promise<FeatureFlagData> {
    const existing = await prisma.featureFlag.findUnique({ where: { key } });
    if (!existing) throw new NotFoundError('Feature flag', key);

    const flag = await prisma.featureFlag.update({
      where: { key },
      data: {
        ...data,
        metadata: data.metadata as Prisma.InputJsonValue | undefined,
      },
    });

    if (adminUserId) {
      const changes: Record<string, { old: unknown; new: unknown }> = {};
      if (data.enabled !== undefined && data.enabled !== existing.enabled) {
        changes.enabled = { old: existing.enabled, new: data.enabled };
      }
      if (data.name !== undefined && data.name !== existing.name) {
        changes.name = { old: existing.name, new: data.name };
      }
      if (data.description !== undefined && data.description !== existing.description) {
        changes.description = { old: existing.description, new: data.description };
      }
      if (data.category !== undefined && data.category !== existing.category) {
        changes.category = { old: existing.category, new: data.category };
      }
      if (data.metadata !== undefined) {
        changes.metadata = { old: existing.metadata, new: data.metadata };
      }

      const onlyEnabledChanged = Object.keys(changes).length === 1 && changes.enabled !== undefined;
      const action: AuditAction = onlyEnabledChanged ? 'TOGGLED' : 'UPDATED';

      await this.writeAuditEntry(key, action, changes, adminUserId);
    }

    await this.loadAll();
    return flag;
  }

  async createFlag(
    data: {
      key: string;
      name: string;
      description?: string;
      category?: string;
      enabled?: boolean;
      metadata?: Record<string, unknown>;
    },
    adminUserId: string
  ): Promise<FeatureFlagData> {
    try {
      const flag = await prisma.featureFlag.create({
        data: {
          key: data.key,
          name: data.name,
          description: data.description ?? null,
          category: data.category ?? 'general',
          enabled: data.enabled ?? false,
          metadata: (data.metadata as Prisma.InputJsonValue) ?? undefined,
        },
      });

      await this.writeAuditEntry(
        data.key,
        'CREATED',
        { flag: { old: null, new: data } },
        adminUserId
      );
      await this.loadAll();
      return flag;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictError(`Feature flag with key '${data.key}' already exists`);
      }
      throw error;
    }
  }

  async deleteFlag(key: string, adminUserId: string): Promise<void> {
    const existing = await prisma.featureFlag.findUnique({ where: { key } });
    if (!existing) throw new NotFoundError('Feature flag', key);

    await prisma.featureFlag.delete({ where: { key } });
    await this.writeAuditEntry(key, 'DELETED', { flag: { old: existing, new: null } }, adminUserId);
    await this.loadAll();
  }

  async getAuditLog({
    flagKey,
    page = 1,
    limit = 20,
  }: {
    flagKey?: string;
    page?: number;
    limit?: number;
  }): Promise<{ entries: unknown[]; total: number }> {
    const where: Prisma.FeatureFlagAuditWhereInput = {};
    if (flagKey) where.flagKey = flagKey;

    const [entries, total] = await Promise.all([
      prisma.featureFlagAudit.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.featureFlagAudit.count({ where }),
    ]);

    return { entries, total };
  }

  private async writeAuditEntry(
    flagKey: string,
    action: AuditAction,
    changes: Record<string, unknown>,
    adminUserId: string
  ): Promise<void> {
    await prisma.featureFlagAudit.create({
      data: {
        flagKey,
        action,
        changes: changes as Prisma.InputJsonValue,
        performedBy: adminUserId,
      },
    });
  }
}

export const featureFlagService = new FeatureFlagService();
