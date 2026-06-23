// Pip-Boy sound effects — synthesized with the Web Audio API (no asset files).
// All playback respects the soundEnabled flag in game state.
import { useGameState } from '../store/gameState';

let ctx: AudioContext | null = null;

const audio = (): AudioContext | null => {
  if (!useGameState.getState().soundEnabled) return null;
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
};

const tone = (
  freq: number,
  duration: number,
  type: OscillatorType = 'square',
  volume = 0.08,
  delay = 0
) => {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, ac.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + delay + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(ac.currentTime + delay);
  osc.stop(ac.currentTime + delay + duration);
};

const noise = (duration: number, volume = 0.05, delay = 0) => {
  const ac = audio();
  if (!ac) return;
  const buffer = ac.createBuffer(1, ac.sampleRate * duration, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(volume, ac.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + delay + duration);
  src.connect(gain).connect(ac.destination);
  src.start(ac.currentTime + delay);
};

export const sfx = {
  /** Short UI blip — buttons, tab changes. */
  pip: () => tone(880, 0.05, 'square', 0.04),

  /** Geiger counter burst — radiation exposure. Intensity scales the clicks. */
  geiger: (intensity = 3) => {
    for (let i = 0; i < intensity * 3; i++) {
      noise(0.015, 0.06, Math.random() * 0.6);
    }
  },

  /** Dice rattle — rolling 2d20. */
  diceRoll: () => {
    for (let i = 0; i < 6; i++) {
      tone(200 + Math.random() * 400, 0.04, 'triangle', 0.05, i * 0.12 + Math.random() * 0.05);
    }
  },

  /** Test passed — rising chime. */
  success: () => {
    tone(523, 0.1, 'square', 0.06);
    tone(659, 0.1, 'square', 0.06, 0.1);
    tone(784, 0.2, 'square', 0.06, 0.2);
  },

  /** Test failed — descending buzz. */
  failure: () => {
    tone(220, 0.15, 'sawtooth', 0.06);
    tone(165, 0.3, 'sawtooth', 0.06, 0.15);
  },

  /** Taking damage — harsh thud. */
  damage: () => {
    noise(0.15, 0.1);
    tone(80, 0.2, 'sawtooth', 0.1);
  },

  /** Foe defeated — punchy resolve. */
  defeat: () => {
    tone(330, 0.08, 'square', 0.07);
    tone(440, 0.15, 'square', 0.07, 0.08);
  },

  /** Level up / quest complete — triumphant arpeggio. */
  levelUp: () => {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.15, 'square', 0.06, i * 0.12));
  },

  /** Item consumed — gulp. */
  consume: () => {
    tone(300, 0.08, 'sine', 0.08);
    tone(200, 0.12, 'sine', 0.08, 0.08);
  },

  /** Terminal typing tick — journal keystrokes. */
  type: () => tone(1200 + Math.random() * 400, 0.015, 'square', 0.02)
};
