import request from 'supertest';
import { createTestApp, registerTestUser } from '../helpers';
import prisma from '../../config/database';

const app = createTestApp();

describe('Books API', () => {
  let authToken: string;
  let userId: string;
  let bookId: string;

  // Setup: Create test user
  beforeAll(async () => {
    const testAuth = await registerTestUser(app);
    if (!testAuth) return;
    authToken = testAuth.token;
    userId = testAuth.userId;
  });

  // Cleanup
  afterAll(async () => {
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
  });

  describe('POST /api/books', () => {
    it('should create a new book', async () => {
      if (!authToken) return;
      const res = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Atomic Habits',
          author: 'James Clear',
          totalPages: 320,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Atomic Habits');
      expect(res.body.data.author).toBe('James Clear');
      expect(res.body.data.totalPages).toBe(320);
      expect(res.body.data.status).toBe('WANT_TO_READ');
      expect(res.body.data.currentPage).toBe(0);

      bookId = res.body.data.id;
    });

    it('should create a book with READING status', async () => {
      if (!authToken) return;
      const res = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Deep Work',
          author: 'Cal Newport',
          totalPages: 304,
          status: 'READING',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('READING');
      expect(res.body.data.startedAt).not.toBeNull();
    });

    it('should reject book without title', async () => {
      if (!authToken) return;
      const res = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          author: 'Unknown',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/books', () => {
    it('should return all books', async () => {
      if (!authToken) return;
      const res = await request(app).get('/api/books').set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.books)).toBe(true);
      expect(res.body.data.books.length).toBeGreaterThan(0);
    });

    it('should filter by status', async () => {
      if (!authToken) return;
      const res = await request(app)
        .get('/api/books?status=WANT_TO_READ')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      res.body.data.books.forEach((book: { status: string }) => {
        expect(book.status).toBe('WANT_TO_READ');
      });
    });

    it('should support search', async () => {
      if (!authToken) return;
      const res = await request(app)
        .get('/api/books?search=Atomic')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.books.length).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      if (!authToken) return;
      const res = await request(app)
        .get('/api/books?limit=1&offset=0')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.books.length).toBe(1);
      expect(res.body.data).toHaveProperty('total');
    });
  });

  describe('GET /api/books/:id', () => {
    it('should return a specific book', async () => {
      if (!authToken) return;
      const res = await request(app)
        .get(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(bookId);
      expect(res.body.data.title).toBe('Atomic Habits');
      expect(res.body.data).toHaveProperty('readingLogs');
      expect(res.body.data).toHaveProperty('progress');
    });

    it('should return 404 for non-existent book', async () => {
      if (!authToken) return;
      const res = await request(app)
        .get('/api/books/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/books/:id', () => {
    it('should update book details', async () => {
      if (!authToken) return;
      const res = await request(app)
        .put(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 5,
          notes: 'Great book on habit formation',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.rating).toBe(5);
      expect(res.body.data.notes).toBe('Great book on habit formation');
    });

    it('should update book status', async () => {
      if (!authToken) return;
      const res = await request(app)
        .put(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'READING',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('READING');
      expect(res.body.data.startedAt).not.toBeNull();
    });
  });

  describe('PUT /api/books/:id/progress', () => {
    it('should update reading progress', async () => {
      if (!authToken) return;
      const res = await request(app)
        .put(`/api/books/${bookId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPage: 50,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.currentPage).toBe(50);
    });

    it('should reject decreasing page number', async () => {
      if (!authToken) return;
      const res = await request(app)
        .put(`/api/books/${bookId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPage: 30,
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/books/:id/log', () => {
    it('should log reading session', async () => {
      if (!authToken) return;
      const res = await request(app)
        .post(`/api/books/${bookId}/log`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          pagesRead: 25,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('book');
      expect(res.body.data).toHaveProperty('log');
      expect(res.body.data.log.pagesRead).toBeGreaterThanOrEqual(25);
    });

    it('should log reading for specific date', async () => {
      if (!authToken) return;
      const res = await request(app)
        .post(`/api/books/${bookId}/log`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          pagesRead: 15,
          date: '2026-01-25',
        });

      expect(res.status).toBe(200);
    });

    it('should reject zero or negative pages', async () => {
      if (!authToken) return;
      const res = await request(app)
        .post(`/api/books/${bookId}/log`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          pagesRead: 0,
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/books/:id/logs', () => {
    it('should return reading logs', async () => {
      if (!authToken) return;
      const res = await request(app)
        .get(`/api/books/${bookId}/logs`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('logs');
      expect(Array.isArray(res.body.data.logs)).toBe(true);
    });
  });

  describe('GET /api/books/stats', () => {
    it('should return reading statistics', async () => {
      if (!authToken) return;
      const res = await request(app)
        .get('/api/books/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('year');
      expect(res.body.data).toHaveProperty('booksFinished');
      expect(res.body.data).toHaveProperty('currentlyReading');
      expect(res.body.data).toHaveProperty('totalPagesRead');
      expect(res.body.data).toHaveProperty('monthlyBreakdown');
    });

    it('should support year filter', async () => {
      if (!authToken) return;
      const res = await request(app)
        .get('/api/books/stats?year=2026')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.year).toBe(2026);
    });
  });

  describe('DELETE /api/books/:id', () => {
    it('should delete a book', async () => {
      if (!authToken) return;
      // Create a book to delete
      const createRes = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Book to Delete' });

      const deleteId = createRes.body.data.id;

      const res = await request(app)
        .delete(`/api/books/${deleteId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);

      // Verify deletion
      const getRes = await request(app)
        .get(`/api/books/${deleteId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getRes.status).toBe(404);
    });
  });
});
