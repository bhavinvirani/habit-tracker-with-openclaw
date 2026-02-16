import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Habit Tracker API',
      version: '1.0.0',
      description:
        'A comprehensive habit tracking API with analytics, insights, book tracking, challenges, and integrations.',
      license: {
        name: 'MIT',
        url: 'https://github.com/bhavinvirani/habit-tracker/blob/main/LICENSE',
      },
      contact: {
        name: 'Bhavin Virani',
        url: 'https://github.com/bhavinvirani/habit-tracker',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API v1',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token obtained from /auth/login',
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'API key for bot integrations',
        },
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            error: { type: 'string' },
            meta: { type: 'object' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' },
          },
        },
        Habit: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Morning Meditation' },
            description: { type: 'string' },
            frequency: {
              type: 'string',
              enum: ['DAILY', 'WEEKLY', 'CUSTOM'],
            },
            color: { type: 'string', example: '#4F46E5' },
            icon: { type: 'string' },
            category: { type: 'string' },
            isArchived: { type: 'boolean' },
            isPaused: { type: 'boolean' },
            sortOrder: { type: 'integer' },
            currentStreak: { type: 'integer' },
            longestStreak: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Book: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            author: { type: 'string' },
            status: {
              type: 'string',
              enum: ['WANT_TO_READ', 'READING', 'COMPLETED', 'DROPPED'],
            },
            totalPages: { type: 'integer' },
            currentPage: { type: 'integer' },
            rating: { type: 'integer', minimum: 1, maximum: 5 },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Challenge: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
            status: {
              type: 'string',
              enum: ['UPCOMING', 'ACTIVE', 'COMPLETED', 'FAILED'],
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/docs/*.yaml'],
};

export const swaggerSpec = swaggerJsdoc(options);
