import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, getDocs, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { AttendanceLog } from './useStaff';

export function useAttendance() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // Only fetch recent logs
    const q = query(collection(db, 'attendance_logs'), orderBy('date', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceLog)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const checkIn = async () => {
    if (!user) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Prevent double check-in
      const q = query(collection(db, 'attendance_logs'), where('staffId', '==', user.id), where('date', '==', today));
      const snap = await getDocs(q);
      if (!snap.empty) {
        toast.error("You have already checked in today!");
        return false;
      }

      const now = new Date();
      const arrivalTime = now.toTimeString().substring(0, 5); // HH:MM
      
      let status: 'on-time' | 'late' = 'on-time';
      
      if (user.shiftStart) {
        // Compare times (HH:MM)
        if (arrivalTime > user.shiftStart) {
          status = 'late';
        }
      }

      await addDoc(collection(db, 'attendance_logs'), {
        date: today,
        staffId: user.id,
        staffName: user.name,
        arrivalTime,
        status
      });
      
      if (status === 'late') toast.warning(`Checked in LATE at ${arrivalTime}`);
      else toast.success(`Checked in ON-TIME at ${arrivalTime}`);
      
      return true;
    } catch (err) {
      console.error(err);
      toast.error("Check-in failed");
      return false;
    }
  };

  return { logs, loading, checkIn };
}
