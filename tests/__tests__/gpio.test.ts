import { jest } from '@jest/globals';
import { GPIO, Direction } from '../../src/sysfs/gpio.js';
import * as fs from 'node:fs';
import * as utils from '../../src/utils/utils.js';

// Mock the file system operations
const mockExistsSync = jest.mocked(fs.existsSync);
const mockReadFileSync = jest.mocked(fs.readFileSync);
const mockWriteFileSync = jest.mocked(fs.writeFileSync);

// Mock utils
jest.mock('../../src/utils/utils.js', () => ({
  msleep: jest.fn()
}));
const mockMsleep = jest.mocked(utils.msleep);

describe('GPIO', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create GPIO instance with existing pin', () => {
      mockExistsSync.mockReturnValue(true);
      
      const gpio = new GPIO(18, Direction.OUT);
      
      expect(gpio.pin).toBe(18);
      expect(gpio.direction).toBe(Direction.OUT);
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/sys/class/gpio/gpio18/direction',
        Direction.OUT
      );
    });

    it('should export pin if it does not exist', () => {
      mockExistsSync.mockReturnValueOnce(false).mockReturnValue(true);
      
      const gpio = new GPIO(18, Direction.OUT);
      
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/sys/class/gpio/export',
        '18'
      );
      expect(gpio.pin).toBe(18);
    });

    it('should throw error if export fails after timeout', () => {
      mockExistsSync.mockReturnValue(false);
      
      expect(() => new GPIO(18, Direction.OUT)).toThrow(
        'Failed to export pin number 18'
      );
      
      expect(mockMsleep).toHaveBeenCalledTimes(20);
    });
  });

  describe('export', () => {
    it('should export pin successfully', () => {
      mockExistsSync.mockReturnValueOnce(false).mockReturnValue(true);
      
      const gpio = new GPIO(18, Direction.OUT);
      
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/sys/class/gpio/export',
        '18'
      );
    });
  });

  describe('unexport', () => {
    it('should unexport pin', () => {
      mockExistsSync.mockReturnValue(true);
      
      const gpio = new GPIO(18, Direction.OUT);
      gpio.unexport();
      
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/sys/class/gpio/unexport',
        '18'
      );
    });
  });

  describe('setDirection', () => {
    it('should set direction', () => {
      mockExistsSync.mockReturnValue(true);
      
      const gpio = new GPIO(18, Direction.OUT);
      gpio.setDirection(Direction.IN);
      
      expect(gpio.direction).toBe(Direction.IN);
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/sys/class/gpio/gpio18/direction',
        Direction.IN
      );
    });
  });

  describe('getDirection', () => {
    it('should get current direction', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(Buffer.from('out'));
      
      const gpio = new GPIO(18, Direction.OUT);
      const direction = gpio.getDirection();
      
      expect(direction).toBe('out');
      expect(mockReadFileSync).toHaveBeenCalledWith(
        '/sys/class/gpio/gpio18/direction'
      );
    });
  });

  describe('setValue', () => {
    it('should set value', () => {
      mockExistsSync.mockReturnValue(true);
      
      const gpio = new GPIO(18, Direction.OUT);
      gpio.setValue(1);
      
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/sys/class/gpio/gpio18/value',
        '1'
      );
    });
  });

  describe('getValue', () => {
    it('should get current value', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(Buffer.from('1'));
      
      const gpio = new GPIO(18, Direction.IN);
      const value = gpio.getValue();
      
      expect(value).toBe(1);
      expect(mockReadFileSync).toHaveBeenCalledWith(
        '/sys/class/gpio/gpio18/value'
      );
    });
  });

  describe('setActiveLow', () => {
    it('should set active low to true', () => {
      mockExistsSync.mockReturnValue(true);
      
      const gpio = new GPIO(18, Direction.OUT);
      gpio.setActiveLow(true);
      
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/sys/class/gpio/gpio18/active_low',
        '1'
      );
    });

    it('should set active low to false', () => {
      mockExistsSync.mockReturnValue(true);
      
      const gpio = new GPIO(18, Direction.OUT);
      gpio.setActiveLow(false);
      
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/sys/class/gpio/gpio18/active_low',
        '0'
      );
    });
  });
});