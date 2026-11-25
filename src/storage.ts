import AsyncStorage from '@react-native-async-storage/async-storage';
import { type Entry, parseDiary } from './food';

// The diary lives only on this device (localStorage on the web): no account, nothing on the server.
const KEY = 'foodcalc.diary.v1';

export async function loadDiary(): Promise<Entry[]> {
  try {
    return parseDiary(await AsyncStorage.getItem(KEY));
  } catch {
    return [];
  }
}

export async function saveDiary(entries: Entry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    // private window or storage full: the diary still works until the page is closed
  }
}
