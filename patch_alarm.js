const fs = require('fs');
const file = 'src/app/dashboard/page.tsx';
let code = fs.readFileSync(file, 'utf8');

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

code = code.replace("export default function DashboardPage() {", playAlarmFunc + "\\nexport default function DashboardPage() {");

const effectCode = `  const prevApprovalCountRef = useRef(0);
  
  useEffect(() => {
    const currentApprovalCount = orders.filter(o => o.status === 'needs_approval').length;
    if (currentApprovalCount > prevApprovalCountRef.current) {
      playAlarm();
    }
    prevApprovalCountRef.current = currentApprovalCount;
  }, [orders]);
`;

const hookTarget = "  const [clearTablePrompt, setClearTablePrompt] = useState<{tableId: string, hasUnpaid: boolean} | null>(null);";
code = code.replace(hookTarget, hookTarget + "\\n" + effectCode);

fs.writeFileSync(file, code);
