import prisma from '../config/database';
import { NotFoundError, BadRequestError } from '../utils/AppError';
import {
  CreateBookInput,
  UpdateBookInput,
  UpdateProgressInput,
  LogReadingInput,
  BookQueryInput,
  ReadingStatsQueryInput,
} from '../validators/book.validator';
import { BookStatus } from '@prisma/client';
import { format, parseISO, startOfYear, endOfYear, eachMonthOfInterval } from 'date-fns';

// ============ GET ALL BOOKS ============
export const getBooks = async (userId: string, query: BookQueryInput) => {
  const { status, search, limit, offset } = query;

  const where: {
    userId: string;
    status?: BookStatus;
    OR?: Array<{
      title?: { contains: string; mode: 'insensitive' };
      author?: { contains: string; mode: 'insensitive' };
    }>;
  } = { userId };

  if (status) {
    where.status = status as BookStatus;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { author: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [books, total] = await Promise.all([
    prisma.book.findMany({
      where,
      orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
      take: limit,
      skip: offset,
    }),
    prisma.book.count({ where }),
  ]);

  return { books, total, limit, offset };
};

// ============ GET BOOK BY ID ============
export const getBookById = async (userId: string, bookId: string) => {
  const book = await prisma.book.findFirst({
    where: { id: bookId, userId },
    include: {
      readingLogs: {
        orderBy: { date: 'desc' },
        take: 30,
      },
    },
  });

  if (!book) {
    throw new NotFoundError('Book not found');
  }

  // Calculate progress percentage
  const progress = book.totalPages ? Math.round((book.currentPage / book.totalPages) * 100) : null;

  return { ...book, progress };
};

// ============ CREATE BOOK ============
export const createBook = async (userId: string, data: CreateBookInput) => {
  const book = await prisma.book.create({
    data: {
      userId,
      title: data.title,
      author: data.author,
      coverUrl: data.coverUrl,
      totalPages: data.totalPages,
      status: (data.status as BookStatus) || 'WANT_TO_READ',
      notes: data.notes,
      startedAt: data.status === 'READING' ? new Date() : null,
    },
  });

  return book;
};

// ============ UPDATE BOOK ============
export const updateBook = async (userId: string, bookId: string, data: UpdateBookInput) => {
  // Verify ownership
  const existing = await prisma.book.findFirst({
    where: { id: bookId, userId },
  });

  if (!existing) {
    throw new NotFoundError('Book not found');
  }

  // Handle status transitions
  const updateData: Record<string, unknown> = { ...data };

  // Auto-set startedAt when starting to read
  if (data.status === 'READING' && existing.status === 'WANT_TO_READ' && !existing.startedAt) {
    updateData.startedAt = new Date();
  }

  // Auto-set finishedAt when finishing
  if (data.status === 'FINISHED' && existing.status !== 'FINISHED' && !data.finishedAt) {
    updateData.finishedAt = new Date();
  }

  // Parse dates if provided as strings
  if (data.startedAt) {
    updateData.startedAt = parseISO(data.startedAt);
  }
  if (data.finishedAt) {
    updateData.finishedAt = parseISO(data.finishedAt);
  }

  const book = await prisma.book.update({
    where: { id: bookId },
    data: updateData,
  });

  return book;
};

// ============ DELETE BOOK ============
export const deleteBook = async (userId: string, bookId: string) => {
  const existing = await prisma.book.findFirst({
    where: { id: bookId, userId },
  });

  if (!existing) {
    throw new NotFoundError('Book not found');
  }

  await prisma.book.delete({
    where: { id: bookId },
  });

  return { deleted: true };
};

// ============ UPDATE READING PROGRESS ============
export const updateProgress = async (userId: string, bookId: string, data: UpdateProgressInput) => {
  const book = await prisma.book.findFirst({
    where: { id: bookId, userId },
  });

  if (!book) {
    throw new NotFoundError('Book not found');
  }

  // Calculate pages read today
  const pagesRead = data.currentPage - book.currentPage;

  if (pagesRead < 0) {
    throw new BadRequestError('Current page cannot be less than previous page');
  }

  const today = format(new Date(), 'yyyy-MM-dd');

  // Update book and log reading in transaction
  const [updatedBook] = await prisma.$transaction([
    prisma.book.update({
      where: { id: bookId },
      data: {
        currentPage: data.currentPage,
        status: book.status === 'WANT_TO_READ' ? 'READING' : book.status,
        startedAt: book.startedAt || new Date(),
        // Auto-finish if reached total pages
        ...(book.totalPages && data.currentPage >= book.totalPages
          ? { status: 'FINISHED', finishedAt: new Date() }
          : {}),
      },
    }),
    // Create or update today's reading log
    ...(pagesRead > 0
      ? [
          prisma.readingLog.upsert({
            where: {
              bookId_date: {
                bookId,
                date: parseISO(today),
              },
            },
            create: {
              bookId,
              date: parseISO(today),
              pagesRead,
              notes: data.notes,
            },
            update: {
              pagesRead: { increment: pagesRead },
              notes: data.notes,
            },
          }),
        ]
      : []),
  ]);

  return updatedBook;
};

// ============ LOG READING SESSION ============
export const logReading = async (userId: string, bookId: string, data: LogReadingInput) => {
  const book = await prisma.book.findFirst({
    where: { id: bookId, userId },
  });

  if (!book) {
    throw new NotFoundError('Book not found');
  }

  const date = data.date ? parseISO(data.date) : new Date();
  const dateStr = format(date, 'yyyy-MM-dd');

  // Update book and create log in transaction
  const [updatedBook, log] = await prisma.$transaction([
    prisma.book.update({
      where: { id: bookId },
      data: {
        currentPage: { increment: data.pagesRead },
        status: book.status === 'WANT_TO_READ' ? 'READING' : book.status,
        startedAt: book.startedAt || new Date(),
      },
    }),
    prisma.readingLog.upsert({
      where: {
        bookId_date: {
          bookId,
          date: parseISO(dateStr),
        },
      },
      create: {
        bookId,
        date: parseISO(dateStr),
        pagesRead: data.pagesRead,
        notes: data.notes,
      },
      update: {
        pagesRead: { increment: data.pagesRead },
        notes: data.notes,
      },
    }),
  ]);

  // Check if book is finished
  if (updatedBook.totalPages && updatedBook.currentPage >= updatedBook.totalPages) {
    await prisma.book.update({
      where: { id: bookId },
      data: { status: 'FINISHED', finishedAt: new Date() },
    });
  }

  return { book: updatedBook, log };
};

// ============ GET READING LOGS ============
export const getReadingLogs = async (userId: string, bookId: string) => {
  const book = await prisma.book.findFirst({
    where: { id: bookId, userId },
    select: { id: true },
  });

  if (!book) {
    throw new NotFoundError('Book not found');
  }

  const logs = await prisma.readingLog.findMany({
    where: { bookId },
    orderBy: { date: 'desc' },
  });

  return logs;
};

// ============ GET READING STATS ============
export const getReadingStats = async (userId: string, query: ReadingStatsQueryInput) => {
  const year = query.year || new Date().getFullYear();
  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(new Date(year, 0, 1));

  // Get all books for the user
  const books = await prisma.book.findMany({
    where: { userId },
    include: {
      readingLogs: {
        where: {
          date: { gte: yearStart, lte: yearEnd },
        },
      },
    },
  });

  // Calculate stats
  const finishedThisYear = books.filter(
    (b) =>
      b.status === 'FINISHED' &&
      b.finishedAt &&
      b.finishedAt >= yearStart &&
      b.finishedAt <= yearEnd
  );

  const currentlyReading = books.filter((b) => b.status === 'READING');
  const wantToRead = books.filter((b) => b.status === 'WANT_TO_READ');

  // Total pages read this year
  const totalPagesRead = books.reduce((sum, book) => {
    return sum + book.readingLogs.reduce((logSum, log) => logSum + log.pagesRead, 0);
  }, 0);

  // Monthly breakdown
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
  const monthlyPages = months.map((month) => {
    const monthStr = format(month, 'yyyy-MM');
    const pagesInMonth = books.reduce((sum, book) => {
      return (
        sum +
        book.readingLogs
          .filter((log) => format(log.date, 'yyyy-MM') === monthStr)
          .reduce((logSum, log) => logSum + log.pagesRead, 0)
      );
    }, 0);

    const booksFinishedInMonth = finishedThisYear.filter(
      (b) => b.finishedAt && format(b.finishedAt, 'yyyy-MM') === monthStr
    ).length;

    return {
      month: format(month, 'MMM'),
      pages: pagesInMonth,
      booksFinished: booksFinishedInMonth,
    };
  });

  return {
    year,
    booksFinished: finishedThisYear.length,
    currentlyReading: currentlyReading.length,
    wantToRead: wantToRead.length,
    totalBooks: books.length,
    totalPagesRead,
    averagePagesPerDay: Math.round(totalPagesRead / 365),
    monthlyBreakdown: monthlyPages,
    recentlyFinished: finishedThisYear
      .sort((a, b) => (b.finishedAt?.getTime() || 0) - (a.finishedAt?.getTime() || 0))
      .slice(0, 5)
      .map((b) => ({
        id: b.id,
        title: b.title,
        author: b.author,
        rating: b.rating,
        finishedAt: b.finishedAt,
      })),
  };
};

// ============ GET CURRENTLY READING (for Dashboard) ============
export const getCurrentlyReading = async (userId: string) => {
  const book = await prisma.book.findFirst({
    where: { userId, status: 'READING' },
    orderBy: { updatedAt: 'desc' },
    include: {
      readingLogs: {
        orderBy: { date: 'desc' },
        take: 7,
      },
    },
  });

  if (!book) {
    return null;
  }

  const progress = book.totalPages ? Math.round((book.currentPage / book.totalPages) * 100) : null;

  const pagesReadThisWeek = book.readingLogs.reduce((sum, log) => sum + log.pagesRead, 0);
  const avgPagesPerDay =
    book.readingLogs.length > 0 ? Math.round(pagesReadThisWeek / book.readingLogs.length) : 0;

  // Estimate days to finish
  const pagesRemaining = book.totalPages ? book.totalPages - book.currentPage : null;
  const estimatedDaysToFinish =
    pagesRemaining && avgPagesPerDay > 0 ? Math.ceil(pagesRemaining / avgPagesPerDay) : null;

  return {
    id: book.id,
    title: book.title,
    author: book.author,
    coverUrl: book.coverUrl,
    currentPage: book.currentPage,
    totalPages: book.totalPages,
    progress,
    pagesReadThisWeek,
    avgPagesPerDay,
    estimatedDaysToFinish,
    startedAt: book.startedAt,
  };
};
