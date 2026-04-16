import {
  codegenNativeComponent,
  codegenNativeCommands,
  type HostComponent,
  type ViewProps,
} from 'react-native';

export interface NativeProps extends ViewProps {}

type CaptureViewViewComponent = HostComponent<NativeProps>;

interface NativeCommands {
  capture: (
    viewRef: React.ComponentRef<CaptureViewViewComponent>,
    callbackId: string,
    format: string,
    quality: string,
    output: string,
    fullContent: boolean
  ) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['capture'],
});

export default codegenNativeComponent<NativeProps>('CaptureViewView');
