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
router.get('/', readLimiter, validateQuery(getTemplatesQuerySchema), getTemplates);

// Get single template
router.get('/:id', readLimiter, getTemplateById);

// Create habit from template
router.post('/:id/use', writeLimiter, validateBody(useTemplateSchema), useTemplate);

export default router;
