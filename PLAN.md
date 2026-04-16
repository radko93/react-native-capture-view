# react-native-capture-view Plan

## Status Note

As of April 16, 2026, this is a historical planning document, not the primary
source of truth for the current API.

The shipped API uses:

- `output` instead of `result`
- `fullContent` instead of `snapshotContentContainer`

For the current contract, use [README.md](./README.md) and
[src/types.ts](./src/types.ts).

## Goal

Build a new library from scratch called `react-native-capture-view`:

- React Native `>= 0.82`
- New Architecture only
- Fabric-first design
- TurboModule + Fabric host component
- iOS and Android only for v0
- No old bridge compatibility layer
- No `UIBlock` interop
- No `findNodeHandle`-driven generic capture path as the primary API

This project is intended to replace the common `react-native-view-shot` use case with a library designed specifically for the New Architecture.

## Product Direction

The library should capture views it explicitly owns or wraps.

That means the primary API is a native-backed `CaptureView` host component plus a `captureScreen()` TurboModule API.

The architecture should not center on resolving arbitrary React tags from arbitrary refs across the tree.

## Public API

### Primary API

```tsx
import {CaptureView, captureScreen} from 'react-native-capture-view';

function Example() {
  const ref = useRef<CaptureViewRef>(null);

  const onCapture = async () => {
    const result = await ref.current?.capture({
      format: 'png',
      result: 'tmpfile',
    });
    console.log(result);
  };

  return (
    <CaptureView ref={ref} style={{flex: 1}}>
      {/* content */}
    </CaptureView>
  );
}
```

### JS Surface

- `<CaptureView ref>`
- `ref.capture(options): Promise<CaptureResult>`
- `captureScreen(options): Promise<CaptureResult>`

### Optional Later API

- `captureRef(hostRef, options)` only if the ref is known to resolve to a supported host component

## Initial Option Shape

```ts
export type CaptureFormat = 'png' | 'jpg';
export type CaptureResultType = 'tmpfile' | 'base64';

export interface CaptureOptions {
  format?: CaptureFormat;
  quality?: number;
  result?: CaptureResultType;
  width?: number;
  height?: number;
  snapshotContentContainer?: boolean;
}

export interface CaptureResult {
  uri?: string;
  base64?: string;
  width: number;
  height: number;
  format: CaptureFormat;
}
```

Notes:

- `tmpfile` should be the default result type.
- `base64` is secondary and should be documented as less efficient.
- `png` and `jpg` are enough for v0.
- `raw`, `zip-base64`, and other advanced encodings should be deferred.

## Core Architecture

### 1. Fabric Host Component

Create a native Fabric component called `CaptureViewNativeComponent` wrapped by a JS `CaptureView` component.

Responsibilities:

- Own a stable native view boundary under Fabric
- Ensure the capture target is explicit and library-controlled
- Expose a typed ref API to JS
- Set `collapsable={false}` or equivalent behavior where needed

This should be the primary capture path.

### 2. TurboModule

Create a TurboModule called `NativeCaptureModule`.

Responsibilities:

- `captureScreen(options)`
- capture a mounted `CaptureView` by native handle / component-owned identity
- validate options and return structured result metadata

The TurboModule should be new-arch-only and codegen-backed.

### 3. No Legacy Compatibility Layer

Do not implement:

- old bridge fallback
- `NativeModules` fallback
- legacy `UIManager.addUIBlock`
- old-arch package registration paths beyond what RN 0.82+ requires

## Platform Implementation

### iOS

Use modern UIKit rendering.

Preferred direction:

- `UIGraphicsImageRenderer`
- `drawViewHierarchyInRect` as the default path
- `renderInContext` only as a controlled fallback if necessary
- encode off the main thread where possible
- write temp files and return file URL/path plus dimensions

Scroll support:

- Support wrapped `UIScrollView` content capture for `snapshotContentContainer`
- Do not assume legacy `RCTScrollView` internals
- Keep Fabric-safe view traversal

### Android

Use standard view rasterization with targeted special-case support.

Preferred direction:

- `View.draw(Canvas)` for standard views
- `TextureView` support
- optional `PixelCopy` path for `SurfaceView`
- bitmap pooling / reuse to reduce churn
- compression off the main/UI thread
- write temp files and return URI/path plus dimensions

Scroll support:

- Support wrapped `ScrollView` content capture for `snapshotContentContainer`
- Avoid brittle assumptions about arbitrary Fabric wrappers when possible

## Non-Goals for v0

Do not optimize for these yet:

- Web support
- Windows support
- macOS support
- arbitrary random ref/tag capture across the app tree
- guaranteed correct capture for video/maps/GL/camera views
- fully virtualized full-content capture for every list implementation
- advanced encoding formats
- old architecture support

## Repo Layout

Suggested initial structure:

```text
react-native-capture-view/
├── PLAN.md
├── README.md
├── package.json
├── tsconfig.json
├── react-native.config.js
├── react-native-capture-view.podspec
├── android/
├── ios/
├── src/
│   ├── index.ts
│   ├── CaptureView.tsx
│   ├── CaptureViewNativeComponent.ts
│   ├── NativeCaptureModule.ts
│   ├── types.ts
│   └── specs/
│       ├── NativeCaptureModule.ts
│       └── CaptureViewNativeComponent.ts
├── example/
└── .github/workflows/
```

## Milestones

### Milestone 1: Scaffold

Set up:

- package metadata
- TypeScript build
- codegen config
- podspec
- Android Gradle config
- Fabric component codegen inputs
- TurboModule codegen inputs
- example app
- CI skeleton

Deliverable:

- repo builds its JS package
- example app can install the package

### Milestone 2: JS API

Implement:

- `CaptureView`
- `CaptureViewRef`
- `captureScreen()`
- option validation
- result typing

Deliverable:

- stable JS API shape ready for native wiring

### Milestone 3: iOS MVP

Implement:

- capture a wrapped `CaptureView`
- `captureScreen()`
- `png` / `jpg`
- `tmpfile`
- dimensions in result

Deliverable:

- example app works on iOS in Fabric

### Milestone 4: Android MVP

Implement:

- capture a wrapped `CaptureView`
- `captureScreen()`
- `png` / `jpg`
- `tmpfile`
- dimensions in result

Deliverable:

- example app works on Android in Fabric

### Milestone 5: Scroll Content Support

Implement:

- `snapshotContentContainer` for wrapped scroll views on iOS
- `snapshotContentContainer` for wrapped scroll views on Android

Deliverable:

- full scroll-content capture works for supported wrapped scroll views

### Milestone 6: Hardening

Add:

- temp file lifecycle handling
- better error messages
- integration tests
- documentation of supported / unsupported cases
- benchmarks or at least timing logs for common scenarios

Deliverable:

- ready for `0.1.0`

## Example App Requirements

Create a minimal example app with screens for:

- basic capture
- image-heavy content
- long scroll view content
- `captureScreen()`
- large layout stress test

The example app should be Fabric-enabled and used as the primary validation harness.

## Testing Strategy

Tests should prioritize functional confidence over brittle pixel-perfect assertions.

### JS Tests

- option validation
- API shape
- error behavior
- result typing and default handling

### Integration Tests

Validate:

- output file exists
- output dimensions are correct
- image is non-empty
- capture does not fail under Fabric
- scroll content capture works for wrapped scroll views

Avoid making visual snapshot diffing the main quality gate in early versions.

## Acceptance Criteria

The first publishable version should satisfy:

- Works in a React Native `>= 0.82` Fabric app on iOS and Android
- No legacy architecture support included
- No `No view found with reactTag`-style arbitrary lookup failures in the primary API path
- `CaptureView` capture works reliably
- `captureScreen()` works reliably
- `snapshotContentContainer` works for supported wrapped scroll views
- Produces valid image files with correct dimensions
- README clearly documents supported and unsupported scenarios

## Suggested First Release Scope

Target `0.1.0` with:

- `CaptureView`
- `captureScreen()`
- iOS + Android
- `png` / `jpg`
- `tmpfile` default
- optional `base64`
- scroll content support for wrapped scroll views only

Anything beyond that should wait until the core path is stable.

## Handoff Prompt For Another Agent

```text
Build a new library from scratch called `react-native-capture-view`.

Requirements:
- React Native >= 0.82 only
- New Architecture only
- Fabric-first design
- TurboModule + Fabric host component
- No old bridge compatibility code
- No `findNodeHandle`-driven generic capture path as the primary API
- iOS and Android only for v0

Deliver:
1. Package scaffold with codegen, podspec, Android config, CI, and example app
2. Public API:
   - `<CaptureView ref>`
   - `ref.capture(options)`
   - `captureScreen(options)`
3. iOS native implementation using modern UIKit rendering
4. Android native implementation using `View.draw(Canvas)`, with optional `TextureView` / `PixelCopy` support
5. Temp-file-first result flow, `png` and `jpg` first
6. Example app screens and Fabric-focused integration tests
7. README documenting supported and unsupported cases

Important design rule:
The library should capture views it explicitly owns or wraps. Do not center the architecture on resolving arbitrary React tags from arbitrary refs.

Success criteria:
- Works in a Fabric-enabled RN >= 0.82 example app on iOS and Android
- No `No view found with reactTag` class of failure in the main API
- ScrollView content capture works for wrapped scroll views
- `captureScreen()` works
- Produces valid image files with correct dimensions
```
