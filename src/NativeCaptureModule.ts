import { TurboModuleRegistry, type TurboModule } from 'react-native';

export interface Spec extends TurboModule {
  captureScreen(options: {
    format: string;
    quality: number;
    result: string;
  }): Promise<{
    uri?: string;
    base64?: string;
    width: number;
    height: number;
    format: string;
  }>;

  /**
   * Registers a pending capture promise keyed by callbackId.
   * The native CaptureViewView command handler resolves this promise
   * when the capture is complete.
   */
  waitForCapture(callbackId: string): Promise<{
    uri?: string;
    base64?: string;
    width: number;
    height: number;
    format: string;
  }>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeCaptureModule');
