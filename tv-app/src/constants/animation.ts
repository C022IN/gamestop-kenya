// Shared animation configs used across all focusable components.
// Centralised so a single tweak propagates everywhere without drift.

export const SPRING_CFG = {
  damping: 18,
  stiffness: 220,
  mass: 0.6,
  useNativeDriver: true,
} as const;

export const FADE_CFG = {
  duration: 200,
  useNativeDriver: true,
} as const;

export const CROSSFADE_CFG = {
  duration: 600,
  useNativeDriver: true,
} as const;
