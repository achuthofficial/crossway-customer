import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Haptics are a bonus, never a requirement: every call is fire-and-forget and silent on failure.
const safe = (p: () => Promise<unknown> | undefined) => {
  try {
    p()?.catch?.(() => {});
  } catch {}
};

export const haptics = {
  /** Light tick, e.g. a swipe crossing its threshold or a tab change. */
  tick: () => safe(() => (Platform.OS === 'android' ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Segment_Tick) : Haptics.selectionAsync())),
  /** Medium thump for committing a gesture (save, skip, back). */
  commit: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  /** Success pattern for apply / confirm. */
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  error: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
