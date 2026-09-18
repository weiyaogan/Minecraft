import { BlockType } from '../world/blocks';

let audioCtx: AudioContext | null = null;
let lastDigTime = 0;

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
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

/**
 * Subtle repeated digging sound while mining
 */
export function playDigSound(type: BlockType) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = performance.now();
  // Prevent excessive overlapping sounds during continuous mining (minimum 200ms interval)
  if (now - lastDigTime < 200) {
    return;
  }
  lastDigTime = now;

  try {
    const t = ctx.currentTime;
    const duration = 0.065;

    // Filtered noise for texture
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, duration);

    const filter = ctx.createBiquadFilter();
    let filterFreq = 900;
    let filterQ = 2.0;

    if (type === 'stone' || type === 'bedrock') {
      filterFreq = 1800;
      filterQ = 3.5;
    } else if (type === 'dirt') {
      filterFreq = 650;
      filterQ = 1.5;
    } else if (type === 'sand') {
      filterFreq = 1100;
      filterQ = 2.2;
    } else if (type === 'grass') {
      filterFreq = 850;
      filterQ = 1.8;
    }

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(filterFreq, t);
    filter.Q.setValueAtTime(filterQ, t);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.12, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    // Subtle low-end thud for punch
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    const baseFreq = type === 'stone' || type === 'bedrock' ? 120 : 80;
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + duration);

    oscGain.gain.setValueAtTime(0.08, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    noise.start(t);
    noise.stop(t + duration);
    osc.start(t);
    osc.stop(t + duration);
  } catch {
    // Graceful fallback if Web Audio is restricted by browser policy
  }
}

/**
 * Distinct break sound when a block is destroyed
 */
export function playBreakSound(type: BlockType) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    const duration = 0.16;

    // Crunch noise burst with falling filter
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, duration);

    const filter = ctx.createBiquadFilter();
    const startFreq = type === 'stone' || type === 'bedrock' ? 2400 : 1300;
    const endFreq = type === 'stone' || type === 'bedrock' ? 450 : 250;

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(startFreq, t);
    filter.frequency.exponentialRampToValueAtTime(endFreq, t + duration);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.22, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    // Punchy pop
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + duration);

    oscGain.gain.setValueAtTime(0.15, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    noise.start(t);
    noise.stop(t + duration);
    osc.start(t);
    osc.stop(t + duration);
  } catch {
    // Graceful fallback
  }
}

/**
 * Short crisp placement sound when a block is successfully placed
 */
export function playPlaceSound(type: BlockType) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    const duration = 0.09;

    // Pitch envelope
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';

    let startFreq = 280;
    if (type === 'stone' || type === 'bedrock') startFreq = 360;
    else if (type === 'dirt') startFreq = 240;
    else if (type === 'sand') startFreq = 200;

    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(75, t + duration);

    oscGain.gain.setValueAtTime(0.18, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    // Crisp surface tap transient
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 0.02);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(type === 'stone' ? 2200 : 1200, t);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.14, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + duration);
    noise.start(t);
    noise.stop(t + 0.02);
  } catch {
    // Graceful fallback
  }
}
