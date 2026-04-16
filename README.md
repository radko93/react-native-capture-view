# react-native-capture-view

[![npm version](https://img.shields.io/npm/v/react-native-capture-view.svg)](https://www.npmjs.com/package/react-native-capture-view)

Capture a React Native view, screen, or `ScrollView` as an image on iOS and Android. Built for the New Architecture (Fabric + TurboModules).

Use this library when you need:

- React Native screenshot capture for a specific view
- full `ScrollView` content capture
- full screen capture
- a Fabric-compatible alternative to older view-shot libraries

Choose the API based on what you want to capture:

| API | Use when |
|-----|----------|
| `CaptureView` | Capture a specific rendered view subtree |
| `CaptureScrollView` | Capture the full content of a plain `ScrollView` |
| `captureScreen()` | Capture the currently visible screen |

## Requirements

- React Native >= 0.82
- New Architecture enabled
- iOS and Android
- Works with Expo (dev builds / EAS builds, not Expo Go)

## Installation

```sh
npm install react-native-capture-view
```

or

```sh
yarn add react-native-capture-view
```

iOS requires pod install:

```sh
cd ios && pod install
```

For Expo, use a dev build or EAS build (`npx expo prebuild` handles autolinking). Not compatible with Expo Go.

## Usage

### Capture a View

Wrap your content in `CaptureView` and capture it via ref:

```tsx
import { useRef } from 'react';
import { CaptureView, type CaptureViewRef } from 'react-native-capture-view';

function Example() {
  const ref = useRef<CaptureViewRef>(null);

  const handleCapture = async () => {
    const result = await ref.current?.capture({ format: 'png' });
    console.log(result?.uri, result?.width, result?.height);
  };

  return (
    <CaptureView ref={ref} style={{ flex: 1 }}>
      {/* your content */}
    </CaptureView>
  );
}
```

### Capture the Screen

```tsx
import { captureScreen } from 'react-native-capture-view';

const result = await captureScreen({ format: 'jpg', quality: 0.8 });
console.log(result.uri);
```

### Capture Full Scroll Content

Use `CaptureScrollView` to capture the entire scrollable content:

```tsx
import { useRef } from 'react';
import { CaptureScrollView, type CaptureScrollViewRef } from 'react-native-capture-view';

function ScrollExample() {
  const ref = useRef<CaptureScrollViewRef>(null);

  const handleCapture = async () => {
    const result = await ref.current?.capture({ format: 'png' });
    // result.height will be the full content height
    console.log(result?.uri, result?.width, result?.height);
  };

  return (
    <CaptureScrollView ref={ref} captureStyle={{ height: 300 }}>
      {/* scrollable content */}
    </CaptureScrollView>
  );
}
```

`CaptureScrollView` is a thin JS wrapper that composes `CaptureView` with a real RN `ScrollView`. It accepts all `ScrollViewProps` (forwarded to the inner `ScrollView`) and adds `capture()` on its ref. Use `captureStyle` for the outer capture boundary and standard `style`/`contentContainerStyle` for scroll layout.

The ref only exposes `capture()`, not scroll imperative methods like `scrollTo`. If you need programmatic scroll control, use a separate `ScrollView` ref inside a `CaptureView`.

## API

### `<CaptureView>`

Captures its children as an image. For non-scrollable content.

| Prop | Type | Description |
|------|------|-------------|
| `ref` | `CaptureViewRef` | Ref to call `capture()` on |
| `style` | `ViewStyle` | Standard view style |
| `children` | `ReactNode` | Content to capture |

### `<CaptureScrollView>`

A convenience wrapper that composes `CaptureView` + RN `ScrollView`. Captures the full scroll content.

| Prop | Type | Description |
|------|------|-------------|
| `ref` | `CaptureScrollViewRef` | Ref with `capture()` |
| `captureStyle` | `ViewStyle` | Style for the outer capture boundary |
| `ScrollComponent` | `ComponentType` | Custom scroll component (default: `ScrollView`). Must render all children — virtualized lists like `FlatList` will only capture mounted items. |
| `...ScrollViewProps` | | All standard ScrollView props forwarded to the inner scroll component |

### `ref.capture(options?)`

Captures the view/scroll content. Returns `Promise<CaptureResult>`.

### `captureScreen(options?)`

Captures the entire screen. Returns `Promise<CaptureResult>`.

### `CaptureOptions`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `format` | `'png' \| 'jpg'` | `'png'` | Image format |
| `quality` | `number` | `1.0` | JPEG quality (0.0 - 1.0), only affects `jpg` |
| `output` | `'tmpfile' \| 'base64'` | `'tmpfile'` | Output type |

### `CaptureResult`

| Field | Type | Description |
|-------|------|-------------|
| `uri` | `string?` | File URI (when `output: 'tmpfile'`) |
| `base64` | `string?` | Base64 string (when `output: 'base64'`) |
| `width` | `number` | Image width in points |
| `height` | `number` | Image height in points |
| `format` | `'png' \| 'jpg'` | The format used |

## Error Codes

| Code | Description |
|------|-------------|
| `E_CAPTURE_FAILED` | The native capture operation failed |
| `E_NO_WINDOW` | Could not find the key window (iOS) |
| `E_NO_ACTIVITY` | No current activity (Android) |
| `E_INVALID_SIZE` | View has zero dimensions |
| `E_BITMAP_TOO_LARGE` | Capture dimensions exceed the safe limit |
| `E_ENCODE_FAILED` | Image encoding failed |
| `E_FILE_WRITE` | Could not write temp file |
| `E_OOM` | Out of memory (Android) |
| `E_NO_CONTENT` | CaptureScrollView has no content |

## Supported Scenarios

- Standard views rendered by Fabric (Text, Image, View, etc.)
- Full scroll content capture via `CaptureScrollView`
- `TextureView` children on Android
- PNG and JPG output
- Temp file and base64 output

## Known Limitations

- `SurfaceView` content (camera, video, GL) -- renders as black on Android
- `WKWebView` / `WebView` -- may produce blank output
- System modals, alerts, or overlays outside the view hierarchy
- Multi-window / multi-scene configurations
- Maps (MapKit, Google Maps) -- compositor-based rendering
- `FlatList` / `SectionList` full-content capture only captures mounted (visible) items, not the full list — use `CaptureScrollView` with plain `ScrollView` children for full-content capture
- Web, Windows, macOS platforms

## Notes

- Temp files are written to the OS cache/tmp directory and may be cleaned up automatically by the system
- Prefer `tmpfile` over `base64` for large captures -- base64 encoding spikes memory
- Use `jpg` with lower `quality` when file size matters
- Very large scroll content captures may hit memory limits

## License

MIT
