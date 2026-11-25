// Phone builds (Android, iOS): expo-camera reads the barcode itself. The web version is Scanner.web.tsx.
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { t } from '../i18n';
import { useColors } from '../theme';
import type { ScannerProps } from './types';

export function Scanner({ onCode }: ScannerProps) {
  const c = useColors();
  const [permission, requestPermission] = useCameraPermissions();
  const [on, setOn] = useState(false);
  const done = useRef(false);

  const start = async () => {
    const p = permission?.granted ? permission : await requestPermission();
    if (p.granted) {
      done.current = false;
      setOn(true);
    }
  };

  if (on) {
    return (
      <View style={[styles.frame, { backgroundColor: c.camera }]}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
          onBarcodeScanned={({ data }) => {
            if (done.current) return;
            done.current = true;
            setOn(false);
            onCode(data);
          }}
        />
        <View style={styles.guide} />
        <Pressable accessibilityRole="button" onPress={() => setOn(false)} style={styles.stop}>
          <Text style={styles.stopText}>{t.stopCamera}</Text>
        </Pressable>
      </View>
    );
  }

  const denied = permission != null && !permission.granted && !permission.canAskAgain;
  return (
    <View style={{ gap: 8 }}>
      <Pressable
        accessibilityRole="button"
        onPress={start}
        disabled={denied}
        style={[styles.button, { backgroundColor: denied ? c.surfaceAlt : c.accent }]}
      >
        <Text style={[styles.buttonText, { color: denied ? c.muted : c.accentText }]}>{t.useCamera}</Text>
      </Pressable>
      {denied && <Text style={{ color: c.muted }}>{t.cameraDenied}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', aspectRatio: 4 / 3, borderRadius: 16, overflow: 'hidden' },
  guide: {
    position: 'absolute',
    left: '10%',
    right: '10%',
    top: '50%',
    height: 2,
    backgroundColor: '#ff5a4e',
  },
  stop: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  stopText: { color: '#fff', fontWeight: '600' },
  button: { minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  buttonText: { fontSize: 16, fontWeight: '700' },
});
