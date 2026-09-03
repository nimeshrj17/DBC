export const playNotificationSound = (type: 'order' | 'payment') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    
    if (type === 'order') {
      // 5-Second Loud Digital Alarm (Order Placed)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'square'; // Harsh, loud alarm sound
      osc.frequency.value = 880; // A5
      
      const now = ctx.currentTime;
      // Loop the beep pattern for 5 seconds
      for (let i = 0; i < 10; i++) {
        const t = now + (i * 0.5);
        // Beep 1
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(1, t + 0.02);
        gain.gain.setValueAtTime(1, t + 0.1);
        gain.gain.linearRampToValueAtTime(0, t + 0.12);
        // Beep 2
        gain.gain.setValueAtTime(0, t + 0.15);
        gain.gain.linearRampToValueAtTime(1, t + 0.17);
        gain.gain.setValueAtTime(1, t + 0.27);
        gain.gain.linearRampToValueAtTime(0, t + 0.29);
      }
      
      osc.start(now);
      osc.stop(now + 5.0);
      
      setTimeout(() => {
        ctx.close();
      }, 5500);
      
    } else {
      // 5-Second Rapid Urgent Alarm (Payment Pending)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sawtooth';
      
      const now = ctx.currentTime;
      for (let i = 0; i < 15; i++) {
        const t = now + (i * 0.33);
        // Alternating pitch
        osc.frequency.setValueAtTime(1046.5, t); // C6
        osc.frequency.setValueAtTime(1318.5, t + 0.15); // E6
        
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(1, t + 0.02);
        gain.gain.setValueAtTime(1, t + 0.28);
        gain.gain.linearRampToValueAtTime(0, t + 0.3);
      }
      
      osc.start(now);
      osc.stop(now + 5.0);
      
      setTimeout(() => {
        ctx.close();
      }, 5500);
    }
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};
