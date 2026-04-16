# Architecture

## Overview

This library has two public capture paths:

- `CaptureView`, a Fabric host component that captures content it explicitly
  wraps
- `captureScreen()`, a TurboModule method that captures the current screen

The design is intentionally New Architecture-first:

- Fabric host component for view capture
- TurboModule for screen capture and pending promise resolution
- no old bridge fallback
- no `UIBlock`-driven generic capture path

## Directory Responsibilities

- [src/](../src/): user-facing JS and TS API
- [ios/](../ios/): iOS native capture implementation
- [android/](../android/): Android native capture implementation
- [example/](../example/): local app used to manually verify behavior and run
  image-based harness tests
- [lib/](../lib/): generated package output

## JS Layer

### Public API

The public API is exported from [src/index.ts](../src/index.ts):

- `CaptureView`
- `captureScreen`
- `CaptureOptions`
- `CaptureResult`
- `CaptureViewRef`

The canonical user-facing option names are defined in
[src/types.ts](../src/types.ts):

- `format`
- `quality`
- `output`
- `fullContent`

### `CaptureView`

[src/CaptureView.tsx](../src/CaptureView.tsx) does four important things:

1. Owns a stable Fabric-backed native view boundary.
2. Validates options via `resolveCaptureOptions`.
3. Registers a pending promise with `NativeCaptureModule.waitForCapture`.
4. Dispatches the native `capture` command on the host component.

The pending-promise registration must happen before dispatching the native
command. This ordering prevents a native completion from racing ahead of JS.

### `captureScreen()`

[src/captureScreen.ts](../src/captureScreen.ts) is a thin wrapper:

1. validate options
2. call `NativeCaptureModule.captureScreen`
3. normalize the native result to `CaptureResult`

## Codegen Boundary

The repo uses React Native codegen inputs in `src/` and `package.json`:

- [src/CaptureViewNativeComponent.ts](../src/CaptureViewNativeComponent.ts)
- [src/NativeCaptureModule.ts](../src/NativeCaptureModule.ts)
- `codegenConfig` in [package.json](../package.json)

When adding props, commands, or TurboModule methods, update the codegen-facing
TS definitions and both native platforms together.

## Native Flow

### View Capture

`CaptureView.capture()` follows this flow:

1. JS generates a `callbackId`.
2. JS calls `waitForCapture(callbackId)`.
3. JS dispatches `Commands.capture(...)`.
4. Native view code performs the capture.
5. Native code resolves or rejects the pending promise stored in the module.

On iOS, the native view implementation lives in
[ios/CaptureViewView.mm](../ios/CaptureViewView.mm).

On Android, the module stores the pending callbacks in
[android/src/main/java/com/captureview/CaptureModule.kt](../android/src/main/java/com/captureview/CaptureModule.kt),
while the native view command path is coordinated through the generated Fabric
component.

### Screen Capture

Screen capture does not go through `CaptureView`.

- iOS captures the current key window from `CaptureModule.mm`
- Android captures the current activity decor view from `CaptureModule.kt`

Both platforms encode either:

- a temp file URI
- a base64 payload

along with `width`, `height`, and `format`.

## Tests

Unit tests:

- [src/__tests__/CaptureView.test.tsx](../src/__tests__/CaptureView.test.tsx)
- [src/__tests__/captureScreen.test.ts](../src/__tests__/captureScreen.test.ts)

These cover:

- option validation
- promise registration before command dispatch
- result normalization
- timeout behavior
- native error propagation

Device-level visual verification lives in [example/__tests__/](../example/__tests__/).

## Common Change Patterns

### Add a new capture option

Update all of:

1. `src/types.ts`
2. `src/resolveCaptureOptions.ts`
3. `README.md`
4. JS callers (`CaptureView.tsx` and/or `captureScreen.ts`)
5. codegen-facing specs if the option crosses the JS/native boundary
6. iOS implementation
7. Android implementation
8. relevant tests

### Change result shape

Keep JS, native, tests, and README in sync. The published contract is the
combination of `src/types.ts` and `README.md`, not stale repo notes.
