let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audioContext) {
    audioContext = new AudioCtx();
  }
  return audioContext;
}

export function playOrderNotificationSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    const now = ctx.currentTime;
    const tones = [
      { freq: 659.25, start: now, duration: 0.14 },
      { freq: 880.0, start: now + 0.13, duration: 0.24 },
    ];

    for (const tone of tones) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(tone.freq, tone.start);

      gain.gain.setValueAtTime(0.001, tone.start);
      gain.gain.exponentialRampToValueAtTime(0.18, tone.start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, tone.start + tone.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(tone.start);
      osc.stop(tone.start + tone.duration + 0.02);
    }
  } catch {
    // Ignore autoplay restrictions before user gesture
  }
}
