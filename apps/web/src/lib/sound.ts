/**
 * Zero-asset sound layer. All cues are synthesized with WebAudio at
 * runtime, so nothing is downloaded and the whole thing weighs ~2KB.
 * Mute preference persists per device. The AudioContext is created
 * lazily on the first cue after a user gesture, per autoplay policy.
 */

const MUTE_KEY = 'fraud-iq:muted';

let ctx: AudioContext | null = null;
let muted: boolean = (() => {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
})();

/**
 * Background music bed: one low-volume looping track. Playback only ever
 * starts inside a real user gesture (unlock runs on every press), fades in
 * and out so it never startles, pauses when the tab is hidden, and stays
 * subordinate to the master mute. Its own on/off preference persists
 * separately. If the audio file is missing or blocked, everything fails
 * silently and retries on the next gesture.
 */
const MUSIC_KEY = 'fraud-iq:music:v1';
const MUSIC_SRC = `${import.meta.env.BASE_URL}audio/theme.mp3`;
const MUSIC_VOLUME = 0.16;
const MUSIC_FADE_IN_MS = 1800;
const MUSIC_FADE_OUT_MS = 500;

let musicOn: boolean = (() => {
  try {
    return localStorage.getItem(MUSIC_KEY) !== '0';
  } catch {
    return true;
  }
})();
let musicEl: HTMLAudioElement | null = null;
let fadeTimer: number | null = null;

function fadeTo(target: number, ms: number, onDone?: () => void) {
  const el = musicEl;
  if (!el) return;
  if (fadeTimer !== null) window.clearInterval(fadeTimer);
  const from = el.volume;
  const steps = Math.max(1, Math.round(ms / 60));
  let i = 0;
  fadeTimer = window.setInterval(() => {
    i += 1;
    el.volume = Math.min(1, Math.max(0, from + (target - from) * (i / steps)));
    if (i >= steps) {
      if (fadeTimer !== null) window.clearInterval(fadeTimer);
      fadeTimer = null;
      onDone?.();
    }
  }, 60);
}

function musicShouldPlay(): boolean {
  return (
    musicOn &&
    !muted &&
    typeof document !== 'undefined' &&
    document.visibilityState === 'visible'
  );
}

/**
 * Reconcile actual playback with intent. viaGesture gates CREATING the
 * element and the first play(): those must happen inside a user gesture
 * per autoplay policy. Later resumes (visibility change) reuse the
 * already-unlocked element.
 */
function syncMusic(viaGesture: boolean) {
  if (!musicShouldPlay()) {
    if (musicEl && !musicEl.paused) {
      fadeTo(0, MUSIC_FADE_OUT_MS, () => {
        musicEl?.pause();
      });
    }
    return;
  }
  if (!musicEl) {
    if (!viaGesture || typeof Audio === 'undefined') return;
    try {
      musicEl = new Audio(MUSIC_SRC);
    } catch {
      return;
    }
    musicEl.loop = true;
    musicEl.volume = 0;
    musicEl.preload = 'auto';
  }
  if (musicEl.paused) {
    const p = musicEl.play();
    if (p) {
      p.then(() => {
        // Intent may have flipped while play() was pending (quick toggle
        // off, master mute, tab hidden). A stale fulfillment must not
        // stomp the fade-out and start the bed against current intent.
        if (musicShouldPlay()) {
          fadeTo(MUSIC_VOLUME, MUSIC_FADE_IN_MS);
        } else if (musicEl) {
          if (fadeTimer !== null) {
            window.clearInterval(fadeTimer);
            fadeTimer = null;
          }
          musicEl.pause();
          musicEl.volume = 0;
        }
      }).catch(() => {
        /* autoplay blocked or file missing: stay silent, retry next gesture */
      });
    }
  } else if (musicEl.volume < MUSIC_VOLUME) {
    // Also cancels a pending fade-out (and its pause) on a quick re-enable.
    fadeTo(MUSIC_VOLUME, MUSIC_FADE_IN_MS);
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => syncMusic(false));
}

function ensureCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

function tone(
  c: AudioContext,
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType = 'sine',
  gain = 0.07
) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

export type SoundName = 'correct' | 'wrong' | 'tick' | 'streak' | 'levelup' | 'boss' | 'press';

export const sound = {
  /**
   * Create/resume the AudioContext synchronously inside a real user
   * gesture (click or keydown), so later cues fired from effects are
   * not blocked by autoplay policy on Safari/iOS.
   */
  unlock() {
    ensureCtx();
    syncMusic(true);
  },
  isMuted(): boolean {
    return muted;
  },
  setMuted(m: boolean) {
    muted = m;
    try {
      localStorage.setItem(MUTE_KEY, m ? '1' : '0');
    } catch {
      /* private mode etc, preference just does not persist */
    }
    // Master mute always wins over the music bed too.
    syncMusic(true);
  },
  /** flips mute and returns the NEW muted value */
  toggle(): boolean {
    this.setMuted(!muted);
    return muted;
  },
  musicIsOn(): boolean {
    return musicOn;
  },
  setMusicOn(on: boolean) {
    musicOn = on;
    try {
      localStorage.setItem(MUSIC_KEY, on ? '1' : '0');
    } catch {
      /* preference just does not persist */
    }
    syncMusic(true);
  },
  /** flips the music bed and returns the NEW on value */
  toggleMusic(): boolean {
    this.setMusicOn(!musicOn);
    return musicOn;
  },
  play(name: SoundName) {
    if (muted) return;
    const c = ensureCtx();
    if (!c) return;
    const t = c.currentTime;
    switch (name) {
      case 'correct':
        tone(c, 660, t, 0.09, 'sine', 0.07);
        tone(c, 880, t + 0.08, 0.16, 'sine', 0.07);
        break;
      case 'wrong':
        tone(c, 180, t, 0.2, 'square', 0.045);
        tone(c, 120, t + 0.11, 0.26, 'square', 0.045);
        break;
      case 'tick':
        tone(c, 1000, t, 0.03, 'square', 0.02);
        break;
      case 'streak':
        [523, 659, 784, 1047].forEach((f, i) => tone(c, f, t + i * 0.07, 0.13, 'sine', 0.065));
        break;
      case 'levelup':
        [392, 523, 659, 784, 1047].forEach((f, i) => tone(c, f, t + i * 0.09, 0.2, 'sine', 0.075));
        break;
      case 'boss':
        /* low ominous two-step */
        tone(c, 110, t, 0.32, 'sawtooth', 0.04);
        tone(c, 82.4, t + 0.24, 0.55, 'sawtooth', 0.045);
        break;
      case 'press':
        /* soft mechanical thock on button-down, quieter than outcome cues */
        tone(c, 320, t, 0.035, 'triangle', 0.04);
        tone(c, 150, t, 0.05, 'sine', 0.03);
        break;
    }
  },
  /**
   * Haptic tap where the device supports it. Follows the mute toggle,
   * so muting the game also stills the phone.
   */
  buzz(pattern: number | number[]) {
    if (muted) return;
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {
      /* some browsers throw on vibrate without user activation, ignore */
    }
  },
};
