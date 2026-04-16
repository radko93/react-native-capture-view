import { Buffer } from 'buffer';
import { describe, test, expect } from 'react-native-harness';
import { captureScreen } from 'react-native-capture-view';

const decodeBase64 = (base64: string): Uint8Array =>
  new Uint8Array(Buffer.from(base64, 'base64'));

describe('captureScreen', () => {
  test('returns a valid file URI for PNG', async () => {
    const result = await captureScreen({ format: 'png', output: 'tmpfile' });

    expect(result.uri).toBeTruthy();
    expect(result.uri).toMatch(/^file:\/\//);
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
    expect(result.format).toBe('png');
  });

  test('returns a valid file URI for JPG', async () => {
    const result = await captureScreen({ format: 'jpg', output: 'tmpfile' });

    expect(result.uri).toBeTruthy();
    expect(result.uri).toMatch(/^file:\/\//);
    expect(result.format).toBe('jpg');
  });

  test('returns base64 when requested', async () => {
    const result = await captureScreen({ format: 'png', output: 'base64' });

    expect(result.base64).toBeTruthy();
    expect(result.base64!.length).toBeGreaterThan(100);
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
  });

  test('base64 output is well-formed (no line breaks)', async () => {
    // view-shot #478: iOS returned base64 with line breaks
    const result = await captureScreen({ format: 'png', output: 'base64' });

    expect(result.base64).toBeTruthy();
    expect(result.base64).not.toMatch(/\n/);
    expect(result.base64).not.toMatch(/\r/);
  });

  test('respects quality parameter for JPG', async () => {
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

    // Lower quality should produce smaller base64 output
    expect(lowQ.base64!.length).toBeLessThan(highQ.base64!.length);
  });

  test('PNG output matches committed visual baseline', async () => {
    const result = await captureScreen({ format: 'png', output: 'base64' });

    expect(result.base64).toBeTruthy();
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);

    await expect({
      data: decodeBase64(result.base64!),
      width: result.width,
      height: result.height,
    }).toMatchImageSnapshot({
      name: 'capture-screen-output',
      failureThreshold: 0,
      failureThresholdType: 'pixel',
    });
  });
});
