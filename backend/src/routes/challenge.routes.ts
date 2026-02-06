import { Router } from 'express';
import * as challengeController from '../controllers/challenge.controller';
import { authenticate } from '../middleware/auth';
import { readLimiter, writeLimiter } from '../middleware/rateLimiter';
import { validate, validateQuery, validateParams } from '../middleware/validate';
import {
  createChallengeSchema,
  updateChallengeSchema,
  challengeQuerySchema,
  challengeIdParamSchema,
  syncProgressSchema,
} from '../validators/challenge.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============ CHALLENGE CRUD ============

// GET /challenges - Get all challenges
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get(
  '/',
  readLimiter as any,
  validateQuery(challengeQuerySchema),
  challengeController.getChallenges
);

// GET /challenges/:id - Get challenge by ID
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get(
  '/:id',
  readLimiter as any,
  validateParams(challengeIdParamSchema),
  challengeController.getChallengeById
);

// POST /challenges - Create new challenge
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post(
  '/',
  writeLimiter as any,
  validate(createChallengeSchema),
  challengeController.createChallenge
);

// PUT /challenges/:id - Update challenge
router.put(
  '/:id',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  writeLimiter as any,
  validateParams(challengeIdParamSchema),
  validate(updateChallengeSchema),
  challengeController.updateChallenge
);

// DELETE /challenges/:id - Delete challenge
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.delete(
  '/:id',
  writeLimiter as any,
  validateParams(challengeIdParamSchema),
  challengeController.deleteChallenge
);

// ============ CHALLENGE PROGRESS ============

// POST /challenges/:id/sync - Sync challenge progress for a date
router.post(
  '/:id/sync',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  writeLimiter as any,
  validateParams(challengeIdParamSchema),
  validate(syncProgressSchema),
  challengeController.syncProgress
);

// GET /challenges/:id/progress - Get detailed challenge progress
router.get(
  '/:id/progress',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readLimiter as any,
  validateParams(challengeIdParamSchema),
  challengeController.getChallengeProgress
);

export default router;
