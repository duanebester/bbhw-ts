// Global test setup
import { jest } from '@jest/globals';

// Mock file system operations globally
jest.mock('node:fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  statSync: jest.fn(),
  truncateSync: jest.fn()
}));

// Mock i2c-bus module
jest.mock('i2c-bus', () => ({
  openSync: jest.fn()
}));