/**
 * log 单元测试
 */
import { logDebug, logInfo, logWarn, logError } from '../log';

describe('log', () => {
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    errorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('logInfo 输出到 console.log', () => {
    logInfo('Test', 'hello');
    expect(logSpy).toHaveBeenCalledWith('[Test]', 'hello');
  });

  it('logInfo 支持附加数据', () => {
    logInfo('Test', 'msg', { key: 'value' });
    expect(logSpy).toHaveBeenCalledWith('[Test]', 'msg', { key: 'value' });
  });

  it('logWarn 输出到 console.warn', () => {
    logWarn('Test', 'warning');
    expect(warnSpy).toHaveBeenCalledWith('[Test]', 'warning');
  });

  it('logError 输出到 console.error', () => {
    logError('Test', 'failed');
    expect(errorSpy).toHaveBeenCalledWith('[Test]', 'failed');
  });

  it('logError 支持错误对象', () => {
    logError('Test', 'error', { code: 'ECONNREFUSED' });
    expect(errorSpy).toHaveBeenCalledWith('[Test]', 'error', { code: 'ECONNREFUSED' });
  });

  it('TAG 格式正确', () => {
    logInfo('ApiService', 'request');
    expect(logSpy.mock.calls[0][0]).toBe('[ApiService]');
  });
});
