import { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import {
  CaptureView,
  CaptureScrollView,
  captureScreen,
} from 'react-native-capture-view';
import type {
  CaptureViewRef,
  CaptureScrollViewRef,
  CaptureResult,
} from 'react-native-capture-view';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function App() {
  const captureRef = useRef<CaptureViewRef>(null);
  const scrollCaptureRef = useRef<CaptureScrollViewRef>(null);
  const [result, setResult] = useState<CaptureResult | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  const showResult = (r: CaptureResult) => {
    setResult(r);
    setPreviewVisible(true);
  };

  const onCaptureView = async () => {
    try {
      const r = await captureRef.current?.capture({
        format: 'png',
        output: 'tmpfile',
      });
      if (r) showResult(r);
    } catch (e) {
      console.error('Capture view failed:', e);
    }
  };

  const onCaptureScreen = async () => {
    try {
      const r = await captureScreen({ format: 'jpg', output: 'tmpfile' });
      showResult(r);
    } catch (e) {
      console.error('Capture screen failed:', e);
    }
  };

  const onCaptureScroll = async () => {
    try {
      const r = await scrollCaptureRef.current?.capture({
        format: 'png',
        output: 'tmpfile',
      });
      if (r) showResult(r);
    } catch (e) {
      console.error('Scroll capture failed:', e);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>react-native-capture-view</Text>

        <CaptureView ref={captureRef} style={styles.captureArea}>
          <View style={styles.contentBox}>
            <Text style={styles.title}>Hello from CaptureView</Text>
            <Text style={styles.subtitle}>This area will be captured</Text>
          </View>
          <TouchableOpacity
            style={styles.overlay}
            onPress={() => console.log('Overlay tapped')}
          >
            <Text style={styles.overlayText}>Overlay</Text>
          </TouchableOpacity>
        </CaptureView>

        <View style={styles.buttons}>
          <TouchableOpacity
            testID="btn-capture-view"
            style={styles.btn}
            onPress={onCaptureView}
          >
            <Text style={styles.btnText}>Capture View</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="btn-capture-screen"
            style={styles.btn}
            onPress={onCaptureScreen}
          >
            <Text style={styles.btnText}>Capture Screen</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Scroll Content Capture</Text>
        <CaptureScrollView
          ref={scrollCaptureRef}
          captureStyle={styles.scrollArea}
          nestedScrollEnabled
        >
          {Array.from({ length: 20 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.colorBox,
                { backgroundColor: `hsl(${i * 18}, 70%, 50%)` },
              ]}
            >
              <Text style={styles.boxText}>Item {i + 1}</Text>
            </View>
          ))}
        </CaptureScrollView>

        <View style={{ height: 16 }} />

        <TouchableOpacity
          testID="btn-capture-scroll"
          style={styles.btn}
          onPress={onCaptureScroll}
        >
          <Text style={styles.btnText}>Capture Full Scroll</Text>
        </TouchableOpacity>

        {result ? (
          <View style={styles.resultSection}>
            <Text style={styles.sectionTitle}>Result</Text>
            <Text testID="result-meta" style={styles.meta}>
              {result.width}x{result.height} {result.format}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <Modal
        visible={previewVisible}
        animationType="fade"
        statusBarTranslucent
        testID="preview-modal"
      >
        <View style={styles.previewContainer}>
          {result?.uri ? (
            <Image
              testID="preview-image"
              source={{ uri: result.uri }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          ) : null}
          <Text testID="preview-meta" style={styles.previewMeta}>
            {result?.width}x{result?.height} {result?.format}
          </Text>
          <TouchableOpacity
            testID="btn-close-preview"
            style={styles.closeBtn}
            onPress={() => setPreviewVisible(false)}
          >
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16 },
  heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  captureArea: {
    height: 150,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  contentBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '600' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  buttons: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 12,
  },
  btn: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '600' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  scrollArea: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  colorBox: {
    height: 60,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  boxText: { color: '#fff', fontWeight: '600' },
  overlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  overlayText: { color: '#fff', fontSize: 12 },
  resultSection: { marginTop: 16 },
  meta: { fontSize: 13, color: '#666', marginBottom: 8 },
  // Full-screen preview modal
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.75,
  },
  previewMeta: {
    color: '#fff',
    fontSize: 14,
    marginTop: 12,
  },
  closeBtn: {
    marginTop: 16,
    backgroundColor: '#333',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  closeBtnText: { color: '#fff', fontWeight: '600' },
});
