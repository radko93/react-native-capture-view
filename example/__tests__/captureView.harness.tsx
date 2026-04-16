import { describe, test, expect } from 'react-native-harness';
import { captureScreen } from 'react-native-capture-view';

// CaptureView.capture() requires a mounted component which needs
// the full app render context. These tests validate the capture
// pipeline via captureScreen() which exercises the same native
// encoding/file-writing path without needing component rendering.

describe('capture pipeline', () => {
  test('PNG tmpfile has valid URI and dimensions', async () => {
    const result = await captureScreen({ format: 'png', output: 'tmpfile' });

    expect(result.uri).toBeTruthy();
    expect(result.uri).toMatch(/^file:\/\//);
    expect(result.uri).toMatch(/\.png$/);
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
    expect(result.format).toBe('png');
  });

  test('JPG tmpfile has valid URI', async () => {
    const result = await captureScreen({ format: 'jpg', output: 'tmpfile' });

    expect(result.uri).toBeTruthy();
    expect(result.uri).toMatch(/\.jpg$/);
    expect(result.format).toBe('jpg');
  });

  test('base64 output is non-empty', async () => {
    const result = await captureScreen({ format: 'png', output: 'base64' });

    expect(result.base64).toBeTruthy();
    expect(result.base64!.length).toBeGreaterThan(100);
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
  });

  test('JPG quality affects output size', async () => {
    const highQ = await captureScreen({
      format: 'jpg',
      output: 'base64',
      quality: 1.0,
    });
    const lowQ = await captureScreen({
      format: 'jpg',
      output: 'base64',
      quality: 0.1,
    });

    expect(lowQ.base64!.length).toBeLessThan(highQ.base64!.length);
  });

  test('consecutive captures produce different file URIs', async () => {
    const a = await captureScreen({ format: 'png', output: 'tmpfile' });
    const b = await captureScreen({ format: 'png', output: 'tmpfile' });

    expect(a.uri).not.toBe(b.uri);
  });
});
