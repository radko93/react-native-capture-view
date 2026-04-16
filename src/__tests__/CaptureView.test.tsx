import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { CaptureView } from '../CaptureView';
import type { CaptureViewRef } from '../types';

const mockWaitForCapture = jest.fn();
const mockCaptureCommand = jest.fn();
let mockNativeRefAttached = true;
const mockNativeHandle = { __nativeTag: 1 };

jest.mock('../NativeCaptureModule', () => ({
  __esModule: true,
  default: {
    waitForCapture: (...args: any[]) => mockWaitForCapture(...args),
  },
}));

jest.mock('../CaptureViewNativeComponent', () => {
  const React = require('react');
  const { View } = require('react-native');

  const MockNativeComponent = React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () =>
      mockNativeRefAttached ? mockNativeHandle : null
    );

    return React.createElement(View, props, props.children);
  });

  return {
    __esModule: true,
    default: MockNativeComponent,
    Commands: {
      capture: (...args: any[]) => mockCaptureCommand(...args),
    },
  };
});

function renderCaptureView() {
  const ref = React.createRef<CaptureViewRef>();
  let renderer!: ReactTestRenderer;

  act(() => {
    renderer = create(<CaptureView ref={ref} />);
  });

  return { ref, renderer };
}

describe('CaptureView', () => {
  beforeEach(() => {
    mockNativeRefAttached = true;
    mockWaitForCapture.mockReset();
    mockCaptureCommand.mockReset();
  });

  it('registers the native promise before dispatching capture', async () => {
    const callOrder: string[] = [];
    mockWaitForCapture.mockImplementation((callbackId: string) => {
      callOrder.push(`wait:${callbackId}`);
      return Promise.resolve({
        uri: 'file:///tmp/view.png',
        width: 240,
        height: 120,
        format: 'png',
      });
    });
    mockCaptureCommand.mockImplementation(
      (
        nativeHandle: unknown,
        callbackId: string,
        format: string,
        quality: string,
        output: string,
        fullContent: boolean
      ) => {
        callOrder.push(`command:${callbackId}`);
        expect(nativeHandle).toBe(mockNativeHandle);
        expect(format).toBe('png');
        expect(quality).toBe('1');
        expect(output).toBe('tmpfile');
        expect(fullContent).toBe(false);
      }
    );

    const { ref } = renderCaptureView();

    const result = await ref.current!.capture();

    expect(callOrder).toHaveLength(2);
    const [waitCall, commandCall] = callOrder;
    expect(waitCall!.startsWith('wait:')).toBe(true);
    expect(commandCall).toBe(waitCall!.replace('wait:', 'command:'));
    expect(result).toEqual({
      uri: 'file:///tmp/view.png',
      base64: undefined,
      width: 240,
      height: 120,
      format: 'png',
    });
  });

  it('forwards explicit capture options', async () => {
    mockWaitForCapture.mockResolvedValue({
      base64: 'encoded',
      width: 320,
      height: 1280,
      format: 'jpg',
    });

    const { ref } = renderCaptureView();

    const result = await ref.current!.capture({
      format: 'jpg',
      quality: 0.4,
      output: 'base64',
    });

    expect(mockCaptureCommand).toHaveBeenCalledWith(
      mockNativeHandle,
      expect.any(String),
      'jpg',
      '0.4',
      'base64',
      false
    );
    expect(result).toEqual({
      uri: undefined,
      base64: 'encoded',
      width: 320,
      height: 1280,
      format: 'jpg',
    });
  });

  it('passes fullContent to native command when set', async () => {
    mockWaitForCapture.mockResolvedValue({
      uri: 'file:///tmp/scroll.png',
      width: 320,
      height: 1200,
      format: 'png',
    });

    const { ref } = renderCaptureView();
    await ref.current!.capture({ fullContent: true });

    expect(mockCaptureCommand).toHaveBeenCalledWith(
      mockNativeHandle,
      expect.any(String),
      'png',
      '1',
      'tmpfile',
      true
    );
  });

  it('rejects when the capture view is not mounted', async () => {
    mockNativeRefAttached = false;
    const { ref } = renderCaptureView();

    await expect(ref.current!.capture()).rejects.toThrow(
      'CaptureView is not mounted'
    );
    expect(mockWaitForCapture).not.toHaveBeenCalled();
    expect(mockCaptureCommand).not.toHaveBeenCalled();
  });

  it('rejects invalid format and skips native capture', async () => {
    const { ref } = renderCaptureView();

    await expect(
      ref.current!.capture({ format: 'webp' as any })
    ).rejects.toThrow("format must be 'png' or 'jpg'");
    expect(mockWaitForCapture).not.toHaveBeenCalled();
    expect(mockCaptureCommand).not.toHaveBeenCalled();
  });

  it('rejects invalid output type and skips native capture', async () => {
    const { ref } = renderCaptureView();

    await expect(
      ref.current!.capture({ output: 'file' as any })
    ).rejects.toThrow("output must be 'tmpfile' or 'base64'");
    expect(mockWaitForCapture).not.toHaveBeenCalled();
    expect(mockCaptureCommand).not.toHaveBeenCalled();
  });

  it('propagates native capture failures', async () => {
    // Covers the upstream "No view found with reactTag" / "Failed to snapshot view tag" class of failures.
    mockWaitForCapture.mockRejectedValue(
      new Error('No view found with reactTag: 772')
    );

    const { ref } = renderCaptureView();

    await expect(ref.current!.capture()).rejects.toThrow(
      'No view found with reactTag: 772'
    );
  });

  it('times out stalled native captures', async () => {
    jest.useFakeTimers();
    mockWaitForCapture.mockReturnValue(new Promise(() => {}));

    const { ref } = renderCaptureView();
    const capturePromise = ref.current!.capture();

    jest.advanceTimersByTime(30_000);

    await expect(capturePromise).rejects.toThrow(
      'CaptureView capture timed out'
    );
    jest.useRealTimers();
  });

  it('clears the timeout after a successful capture', async () => {
    jest.useFakeTimers();
    mockWaitForCapture.mockResolvedValue({
      uri: 'file:///tmp/view.png',
      width: 100,
      height: 50,
      format: 'png',
    });

    const { ref } = renderCaptureView();
    const result = await ref.current!.capture();

    expect(result.uri).toBe('file:///tmp/view.png');
    expect(jest.getTimerCount()).toBe(0);
    jest.useRealTimers();
  });
});
