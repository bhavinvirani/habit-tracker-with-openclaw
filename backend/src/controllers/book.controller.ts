import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as bookService from '../services/book.service';
import { sendSuccess } from '../utils/response';
import { BookQueryInput, ReadingStatsQueryInput } from '../validators/book.validator';

// ============ GET ALL BOOKS ============
export const getBooks = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await bookService.getBooks(req.userId!, req.query as unknown as BookQueryInput);
    sendSuccess(res, result, 'Books retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// ============ GET BOOK BY ID ============
export const getBookById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const book = await bookService.getBookById(req.userId!, req.params.id as string);
    sendSuccess(res, book, 'Book retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// ============ CREATE BOOK ============
export const createBook = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const book = await bookService.createBook(req.userId!, req.body);
    sendSuccess(res, book, 'Book created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// ============ UPDATE BOOK ============
export const updateBook = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const book = await bookService.updateBook(req.userId!, req.params.id as string, req.body);
    sendSuccess(res, book, 'Book updated successfully');
  } catch (error) {
    next(error);
  }
};

// ============ DELETE BOOK ============
export const deleteBook = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await bookService.deleteBook(req.userId!, req.params.id as string);
    sendSuccess(res, null, 'Book deleted successfully');
  } catch (error) {
    next(error);
  }
};

// ============ UPDATE PROGRESS ============
export const updateProgress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const book = await bookService.updateProgress(req.userId!, req.params.id as string, req.body);
    sendSuccess(res, book, 'Progress updated successfully');
  } catch (error) {
    next(error);
  }
};

// ============ LOG READING ============
export const logReading = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await bookService.logReading(req.userId!, req.params.id as string, req.body);
    sendSuccess(res, result, 'Reading logged successfully');
  } catch (error) {
    next(error);
  }
};

// ============ GET READING LOGS ============
export const getReadingLogs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const logs = await bookService.getReadingLogs(req.userId!, req.params.id as string);
    sendSuccess(res, { logs }, 'Reading logs retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// ============ GET READING STATS ============
export const getReadingStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await bookService.getReadingStats(
      req.userId!,
      req.query as unknown as ReadingStatsQueryInput
    );
    sendSuccess(res, stats, 'Reading stats retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// ============ GET CURRENTLY READING ============
export const getCurrentlyReading = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const book = await bookService.getCurrentlyReading(req.userId!);
    sendSuccess(res, { book }, 'Currently reading book retrieved successfully');
  } catch (error) {
    next(error);
  }
};
