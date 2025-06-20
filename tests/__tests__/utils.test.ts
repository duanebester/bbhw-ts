import { msleep } from '../../src/utils/utils.js';

describe('Utils', () => {
  describe('msleep', () => {
    it('should call Atomics.wait with correct parameters', () => {
      // Mock Atomics.wait
      const originalWait = Atomics.wait;
      const mockWait = jest.fn();
      (Atomics as any).wait = mockWait;
      
      msleep(100);
      
      expect(mockWait).toHaveBeenCalledWith(
        expect.any(Int32Array),
        0,
        0,
        100
      );
      
      // Restore original
      Atomics.wait = originalWait;
    });
  });
});