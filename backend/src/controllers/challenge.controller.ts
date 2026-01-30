import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as challengeService from '../services/challenge.service';
import { sendSuccess } from '../utils/response';
import { ChallengeQueryInput } from '../validators/challenge.validator';

// ============ GET ALL CHALLENGES ============
export const getChallenges = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Check and update expired challenges
    await challengeService.checkChallengeStatus(req.userId!);

    const result = await challengeService.getChallenges(
      req.userId!,
      req.query as unknown as ChallengeQueryInput
    );
    sendSuccess(res, result, 'Challenges retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// ============ GET CHALLENGE BY ID ============
export const getChallengeById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const challenge = await challengeService.getChallengeById(req.userId!, req.params.id as string);
    sendSuccess(res, challenge, 'Challenge retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// ============ CREATE CHALLENGE ============
export const createChallenge = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const challenge = await challengeService.createChallenge(req.userId!, req.body);
    sendSuccess(res, challenge, 'Challenge created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// ============ UPDATE CHALLENGE ============
export const updateChallenge = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const challenge = await challengeService.updateChallenge(
      req.userId!,
      req.params.id as string,
      req.body
    );
    sendSuccess(res, challenge, 'Challenge updated successfully');
  } catch (error) {
    next(error);
  }
};

// ============ DELETE CHALLENGE ============
export const deleteChallenge = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await challengeService.deleteChallenge(req.userId!, req.params.id as string);
    sendSuccess(res, null, 'Challenge deleted successfully');
  } catch (error) {
    next(error);
  }
};

// ============ SYNC PROGRESS ============
export const syncProgress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const progress = await challengeService.syncProgress(
      req.userId!,
      req.params.id as string,
      req.body
    );
    sendSuccess(res, progress, 'Progress synced successfully');
  } catch (error) {
    next(error);
  }
};

// ============ GET CHALLENGE PROGRESS ============
export const getChallengeProgress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const progress = await challengeService.getChallengeProgress(
      req.userId!,
      req.params.id as string
    );
    sendSuccess(res, progress, 'Challenge progress retrieved successfully');
  } catch (error) {
    next(error);
  }
};
