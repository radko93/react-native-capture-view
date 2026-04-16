import NativeCaptureModule from './NativeCaptureModule';
import type { CaptureFormat, CaptureOptions, CaptureResult } from './types';
import { resolveCaptureOptions } from './resolveCaptureOptions';

export async function captureScreen(
  options: CaptureOptions = {}
): Promise<CaptureResult> {
  const { format, quality, output } = resolveCaptureOptions(options);

  const raw = await NativeCaptureModule.captureScreen({
    format,
    quality,
    result: output,
  });

  return {
    uri: raw.uri,
    base64: raw.base64,
    width: raw.width,
    height: raw.height,
    format: raw.format as CaptureFormat,
  };
}
