import {
  androidPlatform,
  androidEmulator,
} from '@react-native-harness/platform-android';
import {
  applePlatform,
  appleSimulator,
} from '@react-native-harness/platform-apple';

export default {
  entryPoint: './index.js',
  appRegistryComponentName: 'CaptureViewExample',

  runners: [
    androidPlatform({
      name: 'android',
      device: androidEmulator('Pixel_6a', {
        apiLevel: 34,
        profile: 'pixel_6a',
        diskSize: '4096m',
        heapSize: '512m',
      }),
      bundleId: 'captureview.example',
    }),
    applePlatform({
      name: 'ios',
      device: appleSimulator('iPhone 17', '26.2'),
      bundleId: 'captureview.example',
    }),
  ],

  defaultRunner: 'ios',
  resetEnvironmentBetweenTestFiles: true,
  detectNativeCrashes: true,

  coverage: {
    root: '..',
  },
};
