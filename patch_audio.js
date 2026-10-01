const fs = require('fs');
let code = fs.readFileSync('src/lib/audio.ts', 'utf8');

const target = `export const initAudio = () => {`;
const replacement = `let audioUnlocked = false;

export const unlockAudio = () => {
  if (audioUnlocked) return;
  try {
    initAudio();
    if (globalAudioContext && globalAudioContext.state === 'suspended') {
      globalAudioContext.resume().then(() => {
        audioUnlocked = true;
      });
    } else if (globalAudioContext && globalAudioContext.state === 'running') {
      audioUnlocked = true;
    }
  } catch (e) {
    console.error("Failed to unlock audio", e);
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('click', unlockAudio, { once: true });
  window.addEventListener('touchstart', unlockAudio, { once: true });
}

export const initAudio = () => {`;

code = code.replace(target, replacement);

// Fix playNotificationSound to check state properly
code = code.replace(
  `    // Ensure it's resumed just in case
    if (ctx.state === 'suspended') {
      ctx.resume();
    }`,
  `    // Ensure it's resumed just in case
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    // If it's still suspended (browser blocked it because no user interaction), do not queue sounds!
    if (ctx.state === 'suspended') {
      console.warn("Audio blocked by browser. User must interact with the page first.");
      return;
    }`
);

fs.writeFileSync('src/lib/audio.ts', code);
