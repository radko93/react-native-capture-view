import * as React from 'react';
import {
  ScrollView,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { CaptureView } from './CaptureView';
import type {
  CaptureOptions,
  CaptureResult,
  CaptureScrollViewRef,
  CaptureViewRef,
} from './types';

interface Props extends ScrollViewProps {
  children?: React.ReactNode;
  /** Style for the outer capture boundary. */
  captureStyle?: StyleProp<ViewStyle>;
  /** Custom scroll component. Defaults to RN ScrollView. Must render all children (virtualized lists like FlatList will only capture mounted items). */
  ScrollComponent?: React.ComponentType<any>;
}

function CaptureScrollViewImpl(
  {
    captureStyle,
    children,
    ScrollComponent = ScrollView,
    ...scrollProps
  }: Props,
  ref: React.Ref<CaptureScrollViewRef>
) {
  const captureRef = React.useRef<CaptureViewRef>(null);

  React.useImperativeHandle(ref, () => ({
    capture(
      options: Omit<CaptureOptions, 'fullContent'> = {}
    ): Promise<CaptureResult> {
      if (!captureRef.current) {
        return Promise.reject(new Error('CaptureScrollView is not mounted'));
      }
      return captureRef.current.capture({ ...options, fullContent: true });
    },
  }));

  return (
    <CaptureView ref={captureRef} style={captureStyle}>
      <ScrollComponent {...scrollProps}>{children}</ScrollComponent>
    </CaptureView>
  );
}

export const CaptureScrollView = React.forwardRef(CaptureScrollViewImpl);
