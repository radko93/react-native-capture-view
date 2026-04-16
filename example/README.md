# Example App

This app is the local verification surface for `react-native-capture-view`.
It is wired to the library in the repository root, so JS and native changes can
be exercised here before publishing.

## Common Commands

Run these from the repository root:

```sh
yarn example start
yarn example android
yarn example ios
```

If native iOS dependencies changed, install pods from `example/`:

```sh
cd example
bundle install
bundle exec pod install
```

## What To Verify Here

- `CaptureView` can capture a wrapped view
- `captureScreen()` captures the current screen
- `fullContent` captures an entire scroll container
- result metadata and output mode match the public API

The demo UI lives in [src/App.tsx](./src/App.tsx) and exposes stable `testID`
hooks for automated flows.

## Visual Harness

Image-based regression tests live in [__tests__](./__tests__). Run them from
the repository root:

```sh
yarn workspace react-native-capture-view-example test:harness:ios
yarn workspace react-native-capture-view-example test:harness:android
```

Baseline snapshots are stored under:

```text
example/__tests__/__image_snapshots__/<platform>/
```

## Notes

- This example app is for development and verification, not package
  documentation.
- For the public package API, use the repository root
  [README.md](../README.md).
