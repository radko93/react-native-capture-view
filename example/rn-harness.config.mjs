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
      device: androidEmulator('Pixel_6a'),
      bundleId: 'captureview.example',
    }),
    applePlatform({
      name: 'ios',
      device: appleSimulator('iPhone 17', '26.4'),
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
