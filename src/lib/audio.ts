export const playNotificationSound = (type: 'order' | 'payment') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    
    if (type === 'order') {
      // High pitched double beep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.1); // C6
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(1, ctx.currentTime + 0.15);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
      
      osc.start(ctx.currentTime);
      
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.25);
      osc2.frequency.setValueAtTime(1318.5, ctx.currentTime + 0.35); // E6
      
      gain2.gain.setValueAtTime(0, ctx.currentTime + 0.25);
      gain2.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.3);
      gain2.gain.setValueAtTime(1, ctx.currentTime + 0.4);
      gain2.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      
      osc2.start(ctx.currentTime + 0.25);
      
      setTimeout(() => {
        osc.stop();
        osc2.stop();
        ctx.close();
      }, 1000);
    } else {
      // Payment: gentle chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2); // E5
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      
      osc.start(ctx.currentTime);
      
      setTimeout(() => {
        osc.stop();
        ctx.close();
      }, 1000);
    }
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};
