import { Router } from 'express';
import * as challengeController from '../controllers/challenge.controller';
import { authenticate } from '../middleware/auth';
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
router.get('/', validateQuery(challengeQuerySchema), challengeController.getChallenges);

// GET /challenges/:id - Get challenge by ID
router.get('/:id', validateParams(challengeIdParamSchema), challengeController.getChallengeById);

// POST /challenges - Create new challenge
router.post('/', validate(createChallengeSchema), challengeController.createChallenge);

// PUT /challenges/:id - Update challenge
router.put(
  '/:id',
  validateParams(challengeIdParamSchema),
  validate(updateChallengeSchema),
  challengeController.updateChallenge
);

// DELETE /challenges/:id - Delete challenge
router.delete('/:id', validateParams(challengeIdParamSchema), challengeController.deleteChallenge);

// ============ CHALLENGE PROGRESS ============

// POST /challenges/:id/sync - Sync challenge progress for a date
router.post(
  '/:id/sync',
  validateParams(challengeIdParamSchema),
  validate(syncProgressSchema),
  challengeController.syncProgress
);

// GET /challenges/:id/progress - Get detailed challenge progress
router.get(
  '/:id/progress',
  validateParams(challengeIdParamSchema),
  challengeController.getChallengeProgress
);

export default router;
