// Web: the browser camera (getUserMedia, needs HTTPS and the user's permission) and a barcode reader:
// the browser's own BarcodeDetector where there is one (Chrome on Android), otherwise ZXing in JavaScript
// (Safari on iPhone, Firefox). The camera starts only on a tap, and stops after a read.
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { isBarcode } from '../food';
import { t } from '../i18n';
import { useColors } from '../theme';
import type { ScannerProps } from './types';

type State = 'idle' | 'starting' | 'scanning' | 'denied' | 'missing' | 'error';
type Detect = (video: HTMLVideoElement) => Promise<string | null>;

const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];

type BarcodeDetectorLike = {
  new (options: { formats: string[] }): { detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]> };
  getSupportedFormats(): Promise<string[]>;
};

async function makeDetector(): Promise<Detect> {
  const native = (globalThis as { BarcodeDetector?: BarcodeDetectorLike }).BarcodeDetector;
  if (native) {
    try {
      const supported = await native.getSupportedFormats();
      const formats = FORMATS.filter((f) => supported.includes(f));
      if (formats.length > 0) {
        const detector = new native({ formats });
        return async (video) => (await detector.detect(video))[0]?.rawValue ?? null;
      }
    } catch {
      // fall back to ZXing
    }
  }
  const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
    import('@zxing/browser'),
    import('@zxing/library'),
  ]);
  const hints = new Map<number, unknown>([
    [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E]],
    [DecodeHintType.TRY_HARDER, true],
  ]);
  const reader = new BrowserMultiFormatReader(hints as Map<never, unknown>);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  return async (video) => {
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!ctx || !w || !h) return null;
    // the middle band of the picture, at most 960 px wide: enough for a barcode, cheap to decode
    const band = h * 0.6;
    const scale = Math.min(1, 960 / w);
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(band * scale);
    ctx.drawImage(video, 0, (h - band) / 2, w, band, 0, 0, canvas.width, canvas.height);
    try {
      return reader.decodeFromCanvas(canvas).getText();
    } catch {
      return null; // nothing readable in this frame
    }
  };
}

function failure(e: unknown): State {
  const name = (e as { name?: string })?.name;
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'missing';
  return 'error';
}

export function Scanner({ onCode }: ScannerProps) {
  const c = useColors();
  const [state, setState] = useState<State>(() =>
    typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia ? 'missing' : 'idle',
  );
  const video = useRef<HTMLVideoElement | null>(null);
  const stopRef = useRef<() => void>(() => {});
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;

  useEffect(() => {
    // the camera goes off with the page: switching app on the phone must not leave it on
    const hidden = () => {
      if (document.hidden) {
        stopRef.current();
        setState((s) => (s === 'starting' || s === 'scanning' ? 'idle' : s));
      }
    };
    document.addEventListener('visibilitychange', hidden);
    return () => {
      document.removeEventListener('visibilitychange', hidden);
      stopRef.current();
    };
  }, []);

  const start = async () => {
    setState('starting');
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
    } catch (e) {
      setState(failure(e));
      return;
    }
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stop = () => {
      stopped = true;
      clearTimeout(timer);
      stream.getTracks().forEach((track) => track.stop());
      if (video.current) video.current.srcObject = null;
    };
    stopRef.current = stop;
    try {
      const el = video.current!;
      el.srcObject = stream;
      await el.play();
      setState('scanning');
      const detect = await makeDetector();
      const tick = async () => {
        if (stopped) return;
        const code = await detect(el).catch(() => null);
        if (stopped) return;
        if (code && isBarcode(code)) {
          stop();
          setState('idle');
          onCodeRef.current(code);
          return;
        }
        timer = setTimeout(tick, 150);
      };
      tick();
    } catch (e) {
      stop();
      setState(failure(e));
    }
  };

  const stopByUser = () => {
    stopRef.current();
    setState('idle');
  };

  const live = state === 'starting' || state === 'scanning';
  const message =
    state === 'denied' ? t.cameraDenied : state === 'missing' ? t.cameraMissing : state === 'error' ? t.cameraError : null;

  return (
    <View style={{ gap: 8 }}>
      {/* the video stays mounted, so that play() can start in the same tap */}
      <View style={[styles.frame, { backgroundColor: c.camera }, !live && styles.hidden]}>
        <video ref={video} muted playsInline autoPlay style={videoStyle} aria-label={t.pointCamera} />
        <View style={styles.guide} pointerEvents="none" />
        <View style={styles.hint} pointerEvents="none">
          <Text style={styles.hintText}>{state === 'starting' ? t.startingCamera : t.pointCamera}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={stopByUser} style={styles.stop}>
          <Text style={styles.stopText}>{t.stopCamera}</Text>
        </Pressable>
      </View>
      {!live && state !== 'missing' && (
        <Pressable
          accessibilityRole="button"
          onPress={start}
          style={({ pressed }) => [styles.button, { backgroundColor: c.accent, opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={[styles.buttonText, { color: c.accentText }]}>
            {state === 'denied' ? t.allowCamera : t.useCamera}
          </Text>
        </Pressable>
      )}
      {message && <Text style={{ color: c.muted, lineHeight: 20 }}>{message}</Text>}
    </View>
  );
}

const videoStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
} as const;

const styles = StyleSheet.create({
  frame: { width: '100%', aspectRatio: 4 / 3, maxHeight: 420, borderRadius: 16, overflow: 'hidden' },
  hidden: { display: 'none' },
  guide: {
    position: 'absolute',
    left: '8%',
    right: '8%',
    top: '50%',
    height: 2,
    backgroundColor: '#ff5a4e',
    boxShadow: '0 0 8px rgba(255,90,78,0.9)',
  },
  hint: { position: 'absolute', top: 12, left: 12, right: 12, alignItems: 'center' },
  hintText: {
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
    fontSize: 14,
  },
  stop: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  stopText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  button: { minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  buttonText: { fontSize: 16, fontWeight: '700' },
});
