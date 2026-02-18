import prisma from '../config/database';
import logger from '../utils/logger';

interface FeatureFlagRegistration {
  key: string;
  name: string;
  description?: string;
  category?: string;
  defaultEnabled?: boolean;
  metadata?: Record<string, unknown>;
}

interface FeatureFlagData {
  key: string;
  name: string;
  description: string | null;
  category: string;
  enabled: boolean;
  metadata: unknown;
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
        metadata: reg.metadata ?? undefined,
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
    data: { enabled?: boolean; metadata?: Record<string, unknown> }
  ): Promise<FeatureFlagData> {
    const flag = await prisma.featureFlag.update({
      where: { key },
      data,
    });
    await this.loadAll();
    return flag;
  }
}

export const featureFlagService = new FeatureFlagService();
