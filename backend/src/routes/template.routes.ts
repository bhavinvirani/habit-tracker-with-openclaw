import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { readLimiter, writeLimiter } from '../middleware/rateLimiter';
import { validateBody, validateQuery } from '../middleware/validate';
import { useTemplateSchema, getTemplatesQuerySchema } from '../validators/template.validator';
import { getTemplates, getTemplateById, useTemplate } from '../controllers/template.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all templates
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/', readLimiter as any, validateQuery(getTemplatesQuerySchema), getTemplates);

// Get single template
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/:id', readLimiter as any, getTemplateById);

// Create habit from template
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post('/:id/use', writeLimiter as any, validateBody(useTemplateSchema), useTemplate);

export default router;
