import { jest } from '@jest/globals';
import { I2C } from '../../src/sysfs/i2c.js';
import * as i2cBus from 'i2c-bus';
import type { I2CBus } from 'i2c-bus';

// Mock i2c-bus module
const mockOpenSync = jest.mocked(i2cBus.openSync);

// Create a mock I2CBus object
const mockI2cBus: jest.Mocked<I2CBus> = {
  i2cWriteSync: jest.fn(),
  i2cReadSync: jest.fn(),
  readI2cBlockSync: jest.fn(),
  closeSync: jest.fn()
} as any;

describe('I2C', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOpenSync.mockReturnValue(mockI2cBus);
  });

  describe('constructor', () => {
    it('should create I2C instance with bus number', () => {
      const i2c = new I2C(1);
      
      expect(mockOpenSync).toHaveBeenCalledWith(1);
      expect(i2c.bus).toBe(mockI2cBus);
    });
  });

  describe('tx', () => {
    let i2c: I2C;
    
    beforeEach(() => {
      i2c = new I2C(1);
    });

    it('should throw error for invalid address', () => {
      expect(() => i2c.tx(0x400)).toThrow('Invalid address');
    });

    it('should return 0 for empty buffers', () => {
      const result = i2c.tx(0x48, Buffer.alloc(0), Buffer.alloc(0));
      expect(result).toBe(0);
    });

    it('should perform write operation', () => {
      const writeBuffer = Buffer.from([0x01, 0x02]);
      mockI2cBus.i2cWriteSync.mockReturnValue(2);
      
      const result = i2c.tx(0x48, writeBuffer);
      
      expect(mockI2cBus.i2cWriteSync).toHaveBeenCalledWith(0x48, 2, writeBuffer);
      expect(result).toBe(2);
    });

    it('should perform read operation', () => {
      const readBuffer = Buffer.alloc(4);
      mockI2cBus.i2cReadSync.mockReturnValue(4);
      
      const result = i2c.tx(0x48, undefined, readBuffer);
      
      expect(mockI2cBus.i2cReadSync).toHaveBeenCalledWith(0x48, 4, readBuffer);
      expect(result).toBe(4);
    });

    it('should perform write then read operation', () => {
      const writeBuffer = Buffer.from([0x01]);
      const readBuffer = Buffer.alloc(2);
      mockI2cBus.i2cWriteSync.mockReturnValue(1);
      mockI2cBus.i2cReadSync.mockReturnValue(2);
      
      const result = i2c.tx(0x48, writeBuffer, readBuffer);
      
      expect(mockI2cBus.i2cWriteSync).toHaveBeenCalledWith(0x48, 1, writeBuffer);
      expect(mockI2cBus.i2cReadSync).toHaveBeenCalledWith(0x48, 2, readBuffer);
      expect(result).toBe(2); // Returns result of last operation
    });
  });

  describe('i2cReadSync', () => {
    it('should call bus i2cReadSync', () => {
      const i2c = new I2C(1);
      const readBuffer = Buffer.alloc(4);
      mockI2cBus.i2cReadSync.mockReturnValue(4);
      
      const result = i2c.i2cReadSync(0x48, 4, readBuffer);
      
      expect(mockI2cBus.i2cReadSync).toHaveBeenCalledWith(0x48, 4, readBuffer);
      expect(result).toBe(4);
    });
  });

  describe('write', () => {
    it('should call tx with write buffer only', () => {
      const i2c = new I2C(1);
      const writeBuffer = Buffer.from([0x10, 0x20]);
      mockI2cBus.i2cWriteSync.mockReturnValue(2);
      
      const result = i2c.write(0x48, writeBuffer);
      
      expect(mockI2cBus.i2cWriteSync).toHaveBeenCalledWith(0x48, 2, writeBuffer);
      expect(result).toBe(2);
    });
  });

  describe('blockRead', () => {
    it('should call readI2cBlockSync', () => {
      const i2c = new I2C(1);
      const readBuffer = Buffer.alloc(8);
      mockI2cBus.readI2cBlockSync.mockReturnValue(8);
      
      const result = i2c.blockRead(0x48, 0x10, readBuffer);
      
      expect(mockI2cBus.readI2cBlockSync).toHaveBeenCalledWith(0x48, 0x10, 8, readBuffer);
      expect(result).toBe(8);
    });
  });

  describe('close', () => {
    it('should close the bus', () => {
      const i2c = new I2C(1);
      
      i2c.close();
      
      expect(mockI2cBus.closeSync).toHaveBeenCalled();
    });
  });
});