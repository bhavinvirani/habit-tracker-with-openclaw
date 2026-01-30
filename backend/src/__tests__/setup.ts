import prisma from '../config/database';

// Global test timeout
jest.setTimeout(30000);

// Suppress console logs during tests
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
  jest.spyOn(console, 'debug').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

// Clean up after all tests
afterAll(async () => {
  await prisma.$disconnect();
});
