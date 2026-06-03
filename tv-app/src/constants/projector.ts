// Projector-aware display tuning.
//
// Projectors differ from panels in two ways that hurt a lean-back UI:
//  1. Overscan — many projectors (and the throw/keystone setup) crop ~3–5% off
//     every edge, so nav, player controls, and subtitles near the border get
//     cut off.
//  2. Dimmer, lower-contrast image — washed-out blacks and soft focus make thin
//     low-opacity text hard to read.
//
// Projector Mode insets the whole app so nothing important lands in the cropped
// border, and exposes scale/contrast hints callers can use to make text pop.

export const PROJECTOR_STORAGE_KEY = '@projectorMode';

// Fraction of each edge to pull content inward. 4% clears typical projector
// overscan while barely shrinking the picture.
export const PROJECTOR_OVERSCAN_FRACTION = 0.04;

// Bump font sizes / weights this much in Projector Mode for soft-focus optics.
export const PROJECTOR_FONT_SCALE = 1.12;

export function projectorInset(width: number, height: number) {
  return {
    paddingHorizontal: Math.round(width * PROJECTOR_OVERSCAN_FRACTION),
    paddingVertical: Math.round(height * PROJECTOR_OVERSCAN_FRACTION),
  };
}
