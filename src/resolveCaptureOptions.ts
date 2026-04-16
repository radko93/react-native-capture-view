import type { CaptureFormat, CaptureOptions, CaptureOutput } from './types';

export interface ResolvedCaptureOptions {
  format: CaptureFormat;
  quality: number;
  output: CaptureOutput;
  fullContent: boolean;
}

export function resolveCaptureOptions(
  options: CaptureOptions = {}
): ResolvedCaptureOptions {
  const format = options.format ?? 'png';
  const quality = options.quality ?? 1.0;
  const output = options.output ?? 'tmpfile';

  if (quality < 0 || quality > 1) {
    throw new Error(`quality must be between 0.0 and 1.0, got ${quality}`);
  }
  if (format !== 'png' && format !== 'jpg') {
    throw new Error(`format must be 'png' or 'jpg', got '${format}'`);
  }
  if (output !== 'tmpfile' && output !== 'base64') {
    throw new Error(`output must be 'tmpfile' or 'base64', got '${output}'`);
  }

  return {
    format,
    quality,
    output,
    fullContent: options.fullContent ?? false,
  };
}
