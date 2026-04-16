export type CaptureFormat = 'png' | 'jpg';
export type CaptureOutput = 'tmpfile' | 'base64';

export interface CaptureOptions {
  format?: CaptureFormat;
  quality?: number;
  output?: CaptureOutput;
  fullContent?: boolean;
}

export interface CaptureResult {
  uri?: string;
  base64?: string;
  width: number;
  height: number;
  format: CaptureFormat;
}

export interface CaptureViewRef {
  capture(options?: CaptureOptions): Promise<CaptureResult>;
}

export interface CaptureScrollViewRef {
  capture(
    options?: Omit<CaptureOptions, 'fullContent'>
  ): Promise<CaptureResult>;
}
