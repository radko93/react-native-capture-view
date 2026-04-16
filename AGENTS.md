# AGENTS

This file is the maintainer and coding-agent guide for this repository.

## What This Repo Is

`react-native-capture-view` is a New Architecture-only React Native library for
capturing:

- views explicitly wrapped in a Fabric host component (`CaptureView`)
- the current screen via a TurboModule (`captureScreen`)

The library is intentionally **not** built around arbitrary ref/tag capture
across the React tree.

## Source Of Truth

- Public API: [src/index.ts](./src/index.ts), [src/types.ts](./src/types.ts),
  [README.md](./README.md)
- JS implementation: [src/](./src/)
- Android native implementation: [android/](./android/)
- iOS native implementation: [ios/](./ios/)
- Example app and device-level verification surface: [example/](./example/)

`lib/` is generated build output. Do not edit it by hand.

## Repo Map

- `src/CaptureView.tsx`: JS wrapper around the Fabric host component
- `src/CaptureViewNativeComponent.ts`: codegen host component + native command
- `src/NativeCaptureModule.ts`: TurboModule spec used by JS
- `src/captureScreen.ts`: JS screen capture entry point
- `src/resolveCaptureOptions.ts`: option validation and defaults
- `src/__tests__/`: unit tests for the JS API
- `ios/CaptureViewView.*`: iOS view capture implementation
- `ios/CaptureModule.*`: iOS TurboModule and pending-callback registry
- `android/src/main/java/com/captureview/CaptureModule.kt`: Android
  TurboModule and pending-callback registry

## Current Capture Flow

### `CaptureView` flow

1. JS validates options in `resolveCaptureOptions`.
2. JS generates a `callbackId`.
3. JS registers `NativeCaptureModule.waitForCapture(callbackId)` first.
4. JS dispatches `Commands.capture(...)` to the native Fabric view.
5. Native capture code resolves or rejects the pending promise through
   `CaptureModule`.

The ordering in steps 3 and 4 is important. Tests cover it.

### `captureScreen()` flow

1. JS validates options in `resolveCaptureOptions`.
2. JS calls `NativeCaptureModule.captureScreen(...)`.
3. Native code captures the current window/decor view, encodes the image, and
   returns metadata plus either `uri` or `base64`.

## Naming Caveat

The public JS API and the codegen/native command interface both use:

- `output`
- `fullContent`

When changing this area, treat `src/types.ts` and `README.md` as the
user-facing contract.

## Editing Guardrails

- Do not edit `lib/`; regenerate it with `yarn prepare`.
- Keep the library New Architecture-only unless the change explicitly expands
  scope.
- When changing options or result shapes, update JS types, README, tests, and
  both native platforms together.
- Preserve the explicit `CaptureView` ownership model unless the product
  direction intentionally changes.
- Prefer updating the example app when adding new behavior so the repo keeps a
  runnable verification surface.

## Validation

Fast checks:

```sh
yarn lint
yarn typecheck
yarn test
yarn prepare
```

Example app:

```sh
yarn example start
yarn example android
yarn example ios
```

Visual regression harness:

```sh
yarn workspace react-native-capture-view-example test:harness:ios
yarn workspace react-native-capture-view-example test:harness:android
```

## Reading Order For New Contributors Or Agents

1. [README.md](./README.md)
2. [AGENTS.md](./AGENTS.md)
3. [docs/architecture.md](./docs/architecture.md)
4. [src/types.ts](./src/types.ts)
5. Relevant platform files under `ios/` or `android/`
