const mockNativeCaptureScreen = jest.fn();

jest.mock('../NativeCaptureModule', () => ({
  __esModule: true,
  default: {
    captureScreen: (...args: any[]) => mockNativeCaptureScreen(...args),
  },
}));

import { captureScreen } from '../captureScreen';

describe('captureScreen', () => {
  beforeEach(() => {
    mockNativeCaptureScreen.mockReset();
    mockNativeCaptureScreen.mockResolvedValue({
      uri: 'file:///tmp/test.png',
      width: 375,
      height: 812,
      format: 'png',
    });
  });

  it('uses png + tmpfile defaults', async () => {
    const result = await captureScreen();
    expect(mockNativeCaptureScreen).toHaveBeenCalledWith({
      format: 'png',
      quality: 1,
      result: 'tmpfile',
    });
    expect(result.format).toBe('png');
    expect(result.uri).toBe('file:///tmp/test.png');
    expect(result.width).toBe(375);
    expect(result.height).toBe(812);
  });

  it('forwards explicit native options', async () => {
    mockNativeCaptureScreen.mockResolvedValue({
      base64: 'abc123',
      width: 640,
      height: 480,
      format: 'jpg',
    });

    const result = await captureScreen({
      format: 'jpg',
      quality: 0.4,
      output: 'base64',
    });

    expect(mockNativeCaptureScreen).toHaveBeenCalledWith({
      format: 'jpg',
      quality: 0.4,
      result: 'base64',
    });
    expect(result).toEqual({
      uri: undefined,
      base64: 'abc123',
      width: 640,
      height: 480,
      format: 'jpg',
    });
  });

  it('throws on invalid quality (> 1)', async () => {
    await expect(captureScreen({ quality: 2 })).rejects.toThrow(
      'quality must be between 0.0 and 1.0'
    );
  });

  it('throws on invalid quality (< 0)', async () => {
    await expect(captureScreen({ quality: -0.5 })).rejects.toThrow(
      'quality must be between 0.0 and 1.0'
    );
  });

  it('throws on invalid format', async () => {
    await expect(captureScreen({ format: 'webp' as any })).rejects.toThrow(
      "format must be 'png' or 'jpg'"
    );
  });

  it('throws on invalid output type', async () => {
    await expect(captureScreen({ output: 'file' as any })).rejects.toThrow(
      "output must be 'tmpfile' or 'base64'"
    );
  });

  it('accepts quality boundaries (0 and 1)', async () => {
    await expect(captureScreen({ quality: 0 })).resolves.toBeDefined();
    await expect(captureScreen({ quality: 1 })).resolves.toBeDefined();
  });

  it('propagates native capture failures', async () => {
    // Mirrors the upstream "Failed to snapshot view tag" reports on captureScreen().
    mockNativeCaptureScreen.mockRejectedValue(
      new Error('Failed to snapshot view tag 2730')
    );

    await expect(captureScreen()).rejects.toThrow(
      'Failed to snapshot view tag 2730'
    );
  });
});
