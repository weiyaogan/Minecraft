import { BlockType } from '../world/blocks';

let audioCtx: AudioContext | null = null;
let lastDigTime = 0;
let lastPickupTime = 0;
let pickupStreak = 0;
let lastDropTime = 0;
let lastInvClickTime = 0;
let lastJumpTime = 0;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      audioCtx = new AudioCtx();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function initAudio() {
  getAudioContext();
}

/**
 * Generate a short noise buffer for tactile texture
 */
function createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

/**
 * Mining dig strike sound.
 * STONE: Hard, dense, dry rock strike with tool click transient.
 * DIRT: Soft, dry, muffled, earthy.
 * GRASS: Softer, earthy with subtle foliage texture.
 * SAND: Soft, granular grit.
 */
export function playDigSound(type: BlockType) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = performance.now();
  // Prevent excessive overlapping sounds during continuous mining (200ms cadence)
  if (now - lastDigTime < 200) {
    return;
  }
  lastDigTime = now;

  try {
    const t = ctx.currentTime;
    // Slight random pitch and volume variation per strike to avoid robotic repetition
    const pitchMod = 0.92 + Math.random() * 0.16; // 92% to 108%
    const volMod = 0.90 + Math.random() * 0.20;

    if (type === 'stone' || type === 'bedrock') {
      // STONE: Dry, gritty strike with high pick transient & dense resonant thud
      const duration = 0.07;
      
      // High-frequency transient (tool hitting hard stone)
      const clickOsc = ctx.createOscillator();
      const clickGain = ctx.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime((1400 + Math.random() * 300) * pitchMod, t);
      clickOsc.frequency.exponentialRampToValueAtTime(300, t + 0.025);
      clickGain.gain.setValueAtTime(0.14 * volMod, t);
      clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
      clickOsc.connect(clickGain);
      clickGain.connect(ctx.destination);
      clickOsc.start(t);
      clickOsc.stop(t + 0.025);

      // Gritty filtered noise burst
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, duration);
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime((2100 + Math.random() * 200) * pitchMod, t);
      bandpass.Q.setValueAtTime(3.0, t);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.16 * volMod, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      noise.connect(bandpass);
      bandpass.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(t);
      noise.stop(t + duration);

      // Low-end dense stone body resonance
      const lowOsc = ctx.createOscillator();
      const lowGain = ctx.createGain();
      lowOsc.type = 'sine';
      lowOsc.frequency.setValueAtTime((130 + Math.random() * 25) * pitchMod, t);
      lowOsc.frequency.exponentialRampToValueAtTime(45, t + duration);
      lowGain.gain.setValueAtTime(0.12 * volMod, t);
      lowGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      lowOsc.connect(lowGain);
      lowGain.connect(ctx.destination);
      lowOsc.start(t);
      lowOsc.stop(t + duration);

    } else if (type === 'dirt') {
      // DIRT: Soft, dry, earthy, muffled, noticeably different from stone
      const duration = 0.065;

      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, duration);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime((550 + Math.random() * 100) * pitchMod, t);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.13 * volMod, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(t);
      noise.stop(t + duration);

      const lowOsc = ctx.createOscillator();
      const lowGain = ctx.createGain();
      lowOsc.type = 'triangle';
      lowOsc.frequency.setValueAtTime((85 + Math.random() * 15) * pitchMod, t);
      lowOsc.frequency.exponentialRampToValueAtTime(30, t + duration);
      lowGain.gain.setValueAtTime(0.10 * volMod, t);
      lowGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      lowOsc.connect(lowGain);
      lowGain.connect(ctx.destination);
      lowOsc.start(t);
      lowOsc.stop(t + duration);

    } else if (type === 'grass') {
      // GRASS: Softer, earthy with gentle rustle texture
      const duration = 0.07;

      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, duration);
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime((750 + Math.random() * 120) * pitchMod, t);
      filter.Q.setValueAtTime(1.4, t);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.13 * volMod, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(t);
      noise.stop(t + duration);

      const lowOsc = ctx.createOscillator();
      const lowGain = ctx.createGain();
      lowOsc.type = 'sine';
      lowOsc.frequency.setValueAtTime((90 + Math.random() * 15) * pitchMod, t);
      lowOsc.frequency.exponentialRampToValueAtTime(32, t + duration);
      lowGain.gain.setValueAtTime(0.09 * volMod, t);
      lowGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      lowOsc.connect(lowGain);
      lowGain.connect(ctx.destination);
      lowOsc.start(t);
      lowOsc.stop(t + duration);

    } else {
      // SAND: Granular sift
      const duration = 0.07;
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, duration);
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime((1100 + Math.random() * 150) * pitchMod, t);
      filter.Q.setValueAtTime(2.2, t);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.12 * volMod, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(t);
      noise.stop(t + duration);
    }
  } catch {
    // Audio safe fallback
  }
}

/**
 * Distinct break sound when a block is destroyed.
 * STONE: Louder, crisp rock shatter crunch.
 * DIRT: Earthy crumble.
 * GRASS: Soft earthy shatter with foliage crumble.
 */
export function playBreakSound(type: BlockType) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    const pitchMod = 0.94 + Math.random() * 0.12;

    if (type === 'stone' || type === 'bedrock') {
      const duration = 0.18;
      // Stone shatter: aggressive crisp crunch + rock fracture
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, duration);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2800 * pitchMod, t);
      filter.frequency.exponentialRampToValueAtTime(350, t + duration);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.26, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(t);
      noise.stop(t + duration);

      // Low rock fracture body
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180 * pitchMod, t);
      osc.frequency.exponentialRampToValueAtTime(38, t + duration);

      oscGain.gain.setValueAtTime(0.18, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + duration);

    } else if (type === 'grass') {
      const duration = 0.14;
      // Grass: soft earthy break with subtle foliage crumble
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, duration);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200 * pitchMod, t);
      filter.frequency.exponentialRampToValueAtTime(220, t + duration);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.18, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(t);
      noise.stop(t + duration);

      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120 * pitchMod, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + duration);

      oscGain.gain.setValueAtTime(0.12, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + duration);

    } else {
      // DIRT / SAND: Earthy crumble pop
      const duration = 0.15;
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, duration);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000 * pitchMod, t);
      filter.frequency.exponentialRampToValueAtTime(180, t + duration);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.19, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(t);
      noise.stop(t + duration);

      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(135 * pitchMod, t);
      osc.frequency.exponentialRampToValueAtTime(32, t + duration);

      oscGain.gain.setValueAtTime(0.13, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + duration);
    }
  } catch {
    // Audio safe fallback
  }
}

/**
 * Short, satisfying placement sound appropriate to the material.
 * Only occurs on valid placement.
 */
export function playPlaceSound(type: BlockType) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    const duration = 0.085;
    const pitchMod = 0.95 + Math.random() * 0.10;

    if (type === 'stone' || type === 'bedrock') {
      // STONE PLACEMENT: Harder, dense, solid snap & thud
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320 * pitchMod, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + duration);

      oscGain.gain.setValueAtTime(0.20, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + duration);

      // Crisp stone contact click
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 0.02);
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400 * pitchMod, t);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.16, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(t);
      noise.stop(t + 0.02);

    } else {
      // DIRT / GRASS / SAND PLACEMENT: Softer, earthy, warm thud
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      const startFreq = type === 'grass' ? 240 : 210;
      osc.frequency.setValueAtTime(startFreq * pitchMod, t);
      osc.frequency.exponentialRampToValueAtTime(65, t + duration);

      oscGain.gain.setValueAtTime(0.16, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + duration);

      // Soft muted rustle/dust tap
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 0.025);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900 * pitchMod, t);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.11, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(t);
      noise.stop(t + 0.025);
    }
  } catch {
    // Audio safe fallback
  }
}

/**
 * Item pickup sound: Short, pleasant pop / chime.
 * Slightly increases pitch when multiple items are collected in quick succession.
 */
export function playPickupSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = performance.now();
  if (now - lastPickupTime < 70) {
    return; // Rate limit to avoid audio flooding
  }

  if (now - lastPickupTime < 600) {
    pickupStreak = Math.min(pickupStreak + 1, 8);
  } else {
    pickupStreak = 0;
  }
  lastPickupTime = now;

  try {
    const t = ctx.currentTime;
    const duration = 0.06;

    // Pitch rises slightly per streak tier like Minecraft (semitone steps)
    const baseFreq = 580 * Math.pow(1.06, pickupStreak);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.4, t + duration);

    gain.gain.setValueAtTime(0.14, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration);
  } catch {
    // Audio safe fallback
  }
}

/**
 * Item drop / throw sound: subtle soft pop/whoosh when Q is pressed or item tossed.
 */
export function playItemDropSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = performance.now();
  if (now - lastDropTime < 80) return;
  lastDropTime = now;

  try {
    const t = ctx.currentTime;
    const duration = 0.055;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(380 + Math.random() * 40, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + duration);

    gain.gain.setValueAtTime(0.09, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration);
  } catch {
    // Audio safe fallback
  }
}

/**
 * Subtle click when picking up, dropping, or swapping items in the inventory.
 */
export function playInventoryClickSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = performance.now();
  if (now - lastInvClickTime < 40) return;
  lastInvClickTime = now;

  try {
    const t = ctx.currentTime;
    const duration = 0.02;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(650 + Math.random() * 80, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + duration);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration);
  } catch {
    // Audio safe fallback
  }
}

/**
 * Subtle jump puff sound when player jumps from ground.
 */
export function playJumpSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = performance.now();
  if (now - lastJumpTime < 250) return;
  lastJumpTime = now;

  try {
    const t = ctx.currentTime;
    const duration = 0.08;

    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, duration);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, t);
    filter.frequency.exponentialRampToValueAtTime(120, t + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.07, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(t);
    noise.stop(t + duration);
  } catch {
    // Audio safe fallback
  }
}
