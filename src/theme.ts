import { useColorScheme } from 'react-native';

// Colour tokens, light and dark. Text on accent and muted text keep at least WCAG AA contrast.
const light = {
  background: '#f4f6f3',
  surface: '#ffffff',
  surfaceAlt: '#eef2ec',
  border: '#dde3da',
  text: '#17201a',
  muted: '#566159',
  accent: '#1e7a46',
  accentText: '#ffffff',
  accentSoft: '#e2f1e7',
  danger: '#b3261e',
  dangerSoft: '#fbe9e7',
  camera: '#0d120f',
};

const dark: typeof light = {
  background: '#0f1411',
  surface: '#18201b',
  surfaceAlt: '#212b25',
  border: '#2c3830',
  text: '#e8efe9',
  muted: '#a3b0a7',
  accent: '#5cc98a',
  accentText: '#08210f',
  accentSoft: '#1f3a2a',
  danger: '#ffb4ab',
  dangerSoft: '#3d1d1a',
  camera: '#000000',
};

export type Colors = typeof light;

export function useColors(): Colors {
  return useColorScheme() === 'dark' ? dark : light;
}
