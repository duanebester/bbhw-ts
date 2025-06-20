import { jest } from '@jest/globals';
import { PWM } from '../../src/sysfs/pwm.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as utils from '../../src/utils/utils.js';

// Mock the file system operations
const mockExistsSync = jest.mocked(fs.existsSync);
const mockReadFileSync = jest.mocked(fs.readFileSync);
const mockWriteFileSync = jest.mocked(fs.writeFileSync);
const mockStatSync = jest.mocked(fs.statSync);
const mockTruncateSync = jest.mocked(fs.truncateSync);

// Mock path operations
jest.mock('node:path', () => ({
  join: jest.fn()
}));
const mockJoin = jest.mocked(path.join);

// Mock utils
jest.mock('../../src/utils/utils.js', () => ({
  msleep: jest.fn()
}));
const mockMsleep = jest.mocked(utils.msleep);

describe('PWM', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockJoin.mockImplementation((...args) => args.join('/'));
    mockStatSync.mockReturnValue({ isDirectory: () => true } as any);
  });

  describe('constructor', () => {
    it('should create PWM instance for valid pin', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValueOnce(Buffer.from('0')); // enable status
      
      const pwm = new PWM('P9_22');
      
      expect(pwm.pwmChip).toEqual({ chip: 3, pwm: 0 });
      expect(pwm.pwmPath).toBe('/sys/class/pwm/pwmchip3/pwm0');
    });

    it('should throw error for invalid pin', () => {
      expect(() => new PWM('INVALID_PIN')).toThrow(
        'Bad PWM pin, needs to be something like: P9_22'
      );
    });

    it('should export PWM if it does not exist', () => {
      mockExistsSync.mockReturnValueOnce(false).mockReturnValue(true);
      mockReadFileSync.mockReturnValueOnce(Buffer.from('0')); // enable status
      
      const pwm = new PWM('P9_22');
      
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/sys/class/pwm/pwmchip3/export',
        '0'
      );
    });

    it('should throw error if PWM chip directory not found', () => {
      mockStatSync.mockReturnValue({ isDirectory: () => false } as any);
      
      expect(() => new PWM('P9_22')).toThrow(
        'Unable to find pwm chip directory for chip id 3'
      );
    });

    it('should throw error if export fails after timeout', () => {
      mockExistsSync.mockReturnValue(false);
      
      expect(() => new PWM('P9_22')).toThrow(
        'Failed to export pwm: [object Object]'
      );
      
      expect(mockMsleep).toHaveBeenCalledTimes(20);
    });
  });

  describe('pin mapping', () => {
    it('should map P9_22 to correct PWM chip', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(Buffer.from('0'));
      
      const pwm = new PWM('P9_22');
      expect(pwm.pwmChip).toEqual({ chip: 3, pwm: 0 });
    });

    it('should map P8_19 to correct PWM chip', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(Buffer.from('0'));
      
      const pwm = new PWM('P8_19');
      expect(pwm.pwmChip).toEqual({ chip: 7, pwm: 0 });
    });

    it('should map P9_42 to correct PWM chip', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(Buffer.from('0'));
      
      const pwm = new PWM('P9_42');
      expect(pwm.pwmChip).toEqual({ chip: 0, pwm: 0 });
    });
  });

  describe('isEnabled', () => {
    it('should return true when enabled', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync
        .mockReturnValueOnce(Buffer.from('0')) // constructor enable check
        .mockReturnValueOnce(Buffer.from('1')); // isEnabled check
      
      const pwm = new PWM('P9_22');
      const enabled = pwm.isEnabled();
      
      expect(enabled).toBe(true);
      expect(mockReadFileSync).toHaveBeenCalledWith('/sys/class/pwm/pwmchip3/pwm0/enable');
    });

    it('should return false when disabled', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync
        .mockReturnValueOnce(Buffer.from('0')) // constructor enable check
        .mockReturnValueOnce(Buffer.from('0 ')); // isEnabled check with whitespace
      
      const pwm = new PWM('P9_22');
      const enabled = pwm.isEnabled();
      
      expect(enabled).toBe(false);
    });
  });

  describe('enable', () => {
    it('should enable PWM', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(Buffer.from('0'));
      
      const pwm = new PWM('P9_22');
      pwm.enable();
      
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/sys/class/pwm/pwmchip3/pwm0/enable',
        '1'
      );
    });
  });

  describe('disable', () => {
    it('should disable PWM', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(Buffer.from('0'));
      
      const pwm = new PWM('P9_22');
      pwm.disable();
      
      expect(mockTruncateSync).toHaveBeenCalledWith(
        '/sys/class/pwm/pwmchip3/pwm0/duty_cycle',
        0
      );
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/sys/class/pwm/pwmchip3/pwm0/duty_cycle',
        '0'
      );
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/sys/class/pwm/pwmchip3/pwm0/enable',
        '0'
      );
    });
  });

  describe('setPolarity', () => {
    it('should set normal polarity', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(Buffer.from('0'));
      
      const pwm = new PWM('P9_22');
      pwm.setPolarity('normal');
      
      expect(mockTruncateSync).toHaveBeenCalledWith(
        '/sys/class/pwm/pwmchip3/pwm0/polarity',
        0
      );
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/sys/class/pwm/pwmchip3/pwm0/polarity',
        'normal'
      );
    });

    it('should set inversed polarity', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(Buffer.from('0'));
      
      const pwm = new PWM('P9_22');
      pwm.setPolarity('inversed');
      
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/sys/class/pwm/pwmchip3/pwm0/polarity',
        'inversed'
      );
    });
  });

  describe('setPwmFrequencyAndValue', () => {
    it('should set frequency and value correctly', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(Buffer.from('0'));
      
      const pwm = new PWM('P9_22');
      pwm.setPwmFrequencyAndValue({ frequency: 1000, value: 0.5 });
      
      const expectedPeriod = Math.round(1.0e9 / 1000); // 1000000 ns
      const expectedDuty = Math.round(expectedPeriod * 0.5); // 500000 ns
      
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/sys/class/pwm/pwmchip3/pwm0/duty_cycle',
        '0'
      );
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/sys/class/pwm/pwmchip3/pwm0/period',
        expectedPeriod.toString()
      );
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/sys/class/pwm/pwmchip3/pwm0/duty_cycle',
        expectedDuty.toString()
      );
    });
  });

  describe('getPwmFrequencyAndValue', () => {
    it('should get current frequency and value', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync
        .mockReturnValueOnce(Buffer.from('0')) // constructor enable check
        .mockReturnValueOnce(Buffer.from('1000000')) // period
        .mockReturnValueOnce(Buffer.from('500000')); // duty_cycle
      
      const pwm = new PWM('P9_22');
      const result = pwm.getPwmFrequencyAndValue();
      
      expect(result.frequency).toBe(1000);
      expect(result.value).toBe(0.5);
      expect(mockReadFileSync).toHaveBeenCalledWith(
        '/sys/class/pwm/pwmchip3/pwm0/period'
      );
      expect(mockReadFileSync).toHaveBeenCalledWith(
        '/sys/class/pwm/pwmchip3/pwm0/duty_cycle'
      );
    });
  });
});