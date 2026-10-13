import { VEHICLES, type VehicleKind } from '../sim/data';
const crackle = new WeakMap<AudioContext, AudioBuffer>();

export function createEngineSound(ctx: AudioContext, kind: VehicleKind) {
  const engine = ctx.createOscillator();
  const harmonic = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const volume = ctx.createGain();
  const crawler = kind === 'excavator' || kind === 'crane' || kind === 'bulldozer';
  engine.type = 'sawtooth';
  harmonic.type = 'triangle';
  filter.type = 'lowpass';
  filter.frequency.value = 160;
  volume.gain.value = 0;
  engine.frequency.value = crawler ? 38 : 48;
  harmonic.frequency.value = crawler ? 57 : 72;
  engine.connect(filter);
  harmonic.connect(filter);
  filter.connect(volume);
  volume.connect(ctx.destination);
  engine.start();
  harmonic.start();
  let stopped = false;
  return {
    update(speed: number, working: boolean) {
      if (stopped) return;
      const rev = Math.min(1.8, speed / VEHICLES[kind].speed);
      const frequency = (crawler ? 38 : 48) + rev * 45 + (working ? 6 : 0);
      engine.frequency.setTargetAtTime(frequency, ctx.currentTime, 0.12);
      harmonic.frequency.setTargetAtTime(frequency * 1.5, ctx.currentTime, 0.12);
      filter.frequency.setTargetAtTime(150 + rev * 220, ctx.currentTime, 0.15);
      volume.gain.setTargetAtTime(0.018 + rev * 0.012, ctx.currentTime, 0.1);
    },
    stop() {
      if (stopped) return;
      stopped = true;
      volume.gain.setTargetAtTime(0, ctx.currentTime, 0.025);
      engine.stop(ctx.currentTime + 0.15);
      harmonic.stop(ctx.currentTime + 0.15);
      engine.onended = () => {
        engine.disconnect();
        harmonic.disconnect();
        filter.disconnect();
        volume.disconnect();
      };
    },
  };
}

function tone(
  ctx: AudioContext,
  frequency: number,
  at: number,
  duration: number,
  volume: number,
  type: OscillatorType = 'sine',
  endFrequency = frequency,
) {
  const osc = ctx.createOscillator(),
    gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, at);
  osc.frequency.exponentialRampToValueAtTime(endFrequency, at + duration);
  gain.gain.setValueAtTime(volume, at);
  gain.gain.exponentialRampToValueAtTime(0.001, at + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
  osc.start(at);
  osc.stop(at + duration);
}

export function playPop(ctx: AudioContext, amount: number, streak: number) {
  const at = ctx.currentTime,
    intensity = Math.min(1.8, 1 + Math.log2(amount + 1) * 0.2);
  let buffer = crackle.get(ctx);
  if (!buffer) {
    buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.06), ctx.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++)
      samples[i] = (Math.random() * 2 - 1) * (1 - i / samples.length);
    crackle.set(ctx, buffer);
  }
  const noise = ctx.createBufferSource(),
    filter = ctx.createBiquadFilter(),
    gain = ctx.createGain();
  noise.buffer = buffer;
  filter.type = 'bandpass';
  filter.frequency.value = 2400;
  filter.Q.value = 0.7;
  gain.gain.setValueAtTime(0.12 * intensity, at);
  gain.gain.exponentialRampToValueAtTime(0.001, at + 0.06);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.onended = () => {
    noise.disconnect();
    filter.disconnect();
    gain.disconnect();
  };
  noise.start(at);
  tone(ctx, 200 + (streak % 5) * 18, at, 0.085, 0.07 * intensity, 'sine', 65);
  tone(ctx, 680 + Math.min(streak, 24) * 24, at, 0.075, 0.035 * intensity, 'triangle', 350);
  if (streak >= 8 && streak % 8 < amount) {
    tone(ctx, 1046, at + 0.025, 0.13, 0.025);
    tone(ctx, 1568, at + 0.065, 0.15, 0.025);
  }
}

export function playClear(ctx: AudioContext) {
  [523.25, 659.25, 783.99, 1046.5].forEach((note, i) =>
    tone(ctx, note, ctx.currentTime + i * 0.075, i === 3 ? 0.38 : 0.18, 0.055, 'triangle'),
  );
}

export function playRush(ctx: AudioContext) {
  const at = ctx.currentTime;
  tone(ctx, 110, at, 0.28, 0.07, 'sine', 55);
  [392, 523.25, 659.25, 1046.5].forEach((note, i) => {
    tone(ctx, note, at + i * 0.045, 0.21, 0.035, 'sawtooth', note * 1.015);
    tone(ctx, note * 2, at + i * 0.045, 0.15, 0.018, 'triangle');
  });
}
