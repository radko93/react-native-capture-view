import * as React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { CaptureOptions, CaptureResult, CaptureViewRef } from './types';
import type { CaptureFormat } from './types';
import NativeCaptureModule from './NativeCaptureModule';
import CaptureViewNativeComponent, {
  Commands,
} from './CaptureViewNativeComponent';
import { resolveCaptureOptions } from './resolveCaptureOptions';

interface Props {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

function CaptureViewImpl(props: Props, ref: React.Ref<CaptureViewRef>) {
  const nativeRef = React.useRef<
    React.ComponentRef<typeof CaptureViewNativeComponent>
  >(null!);

  React.useImperativeHandle(ref, () => ({
    capture(options: CaptureOptions = {}): Promise<CaptureResult> {
      if (!nativeRef.current) {
        return Promise.reject(new Error('CaptureView is not mounted'));
      }

      let resolvedOptions;
      try {
        resolvedOptions = resolveCaptureOptions(options);
      } catch (error) {
        return Promise.reject(
          error instanceof Error ? error : new Error('Invalid capture options')
        );
      }

      const {
        format,
        quality,
        output: resultType,
        fullContent,
      } = resolvedOptions;
      const callbackId = Math.random().toString(36).slice(2);

      const resultPromise = NativeCaptureModule.waitForCapture(callbackId);

      Commands.capture(
        // @ts-ignore RN#54272: ComponentRef<HostComponent<>> resolves to never in React 19
        nativeRef.current,
        callbackId,
        format,
        String(quality),
        resultType,
        fullContent
      );

      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('CaptureView capture timed out'));
        }, 30_000);
      });

      return Promise.race([resultPromise, timeoutPromise])
        .then((raw) => ({
          uri: raw.uri,
          base64: raw.base64,
          width: raw.width,
          height: raw.height,
          format: raw.format as CaptureFormat,
        }))
        .finally(() => {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
        });
    },
  }));

  return (
    <CaptureViewNativeComponent
      ref={nativeRef}
      style={props.style}
      collapsable={false}
    >
      {props.children}
    </CaptureViewNativeComponent>
  );
}

export const CaptureView = React.forwardRef(CaptureViewImpl);
