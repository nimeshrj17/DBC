const fs = require('fs');
let pageCode = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// 1. Remove from page.tsx
pageCode = pageCode.replace(/const playAlarm = \(\) => \{[\s\S]*?\}\n};/, '');
pageCode = pageCode.replace(/  const prevApprovalCountRef = useRef\(0\);\n  \n  useEffect\(\(\) => \{\n    const currentApprovalCount = orders\.filter\(o => o\.status === 'needs_approval'\)\.length;\n    if \(currentApprovalCount > prevApprovalCountRef\.current\) \{\n      playAlarm\(\);\n    \}\n    prevApprovalCountRef\.current = currentApprovalCount;\n  \}, \[orders\]\);\n/, '');
fs.writeFileSync('src/app/dashboard/page.tsx', pageCode);

// 2. Add to layout.tsx
let layoutCode = fs.readFileSync('src/app/dashboard/layout.tsx', 'utf8');

// Ensure useRef is imported
if (!layoutCode.includes('useRef')) {
  layoutCode = layoutCode.replace('import React, { useState, useEffect }', 'import React, { useState, useEffect, useRef }');
}

const playAlarmFunc = `
const playAlarm = () => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
    
    // Quick double beep
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15);
    
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime + 0.2);
    gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.25);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.35);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.4);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};
`;

layoutCode = layoutCode.replace('export default function DashboardLayout', playAlarmFunc + '\\nexport default function DashboardLayout');

const effectCode = `
  const prevApprovalCountRef = useRef(0);
  
  useEffect(() => {
    const currentApprovalCount = orders.filter(o => o.status === 'needs_approval').length;
    if (currentApprovalCount > prevApprovalCountRef.current) {
      playAlarm();
    }
    prevApprovalCountRef.current = currentApprovalCount;
  }, [orders]);
`;

layoutCode = layoutCode.replace('const { orders } = useOrders();', 'const { orders } = useOrders();' + effectCode);

fs.writeFileSync('src/app/dashboard/layout.tsx', layoutCode);
