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

router.get(
  '/',
  readLimiter,
  validateQuery(challengeQuerySchema),
  challengeController.getChallenges
);

router.get(
  '/:id',
  readLimiter,
  validateParams(challengeIdParamSchema),
  challengeController.getChallengeById
);

router.post(
  '/',
  writeLimiter,
  validate(createChallengeSchema),
  challengeController.createChallenge
);

router.put(
  '/:id',
  writeLimiter,
  validateParams(challengeIdParamSchema),
  validate(updateChallengeSchema),
  challengeController.updateChallenge
);

router.delete(
  '/:id',
  writeLimiter,
  validateParams(challengeIdParamSchema),
  challengeController.deleteChallenge
);

// ============ CHALLENGE PROGRESS ============

router.post(
  '/:id/sync',
  writeLimiter,
  validateParams(challengeIdParamSchema),
  validate(syncProgressSchema),
  challengeController.syncProgress
);

router.get(
  '/:id/progress',
  readLimiter,
  validateParams(challengeIdParamSchema),
  challengeController.getChallengeProgress
);

export default router;
