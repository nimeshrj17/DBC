'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useAttendance } from '@/lib/hooks/useAttendance';
import { Clock, CheckCircle, AlertTriangle } from 'lucide-react';

export default function AttendancePage() {
  const { user } = useAuth();
  const { logs, checkIn } = useAttendance();
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const todayDate = new Date().toISOString().split('T')[0];
  const hasCheckedInToday = logs.some(l => l.staffId === user?.id && l.date === todayDate);

  if (!user) return null;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6 pb-24 pt-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-slate-900 flex items-center justify-center gap-2">
          <Clock className="w-8 h-8 text-indigo-600" /> Time Clock
        </h2>
        <p className="text-slate-500">Log your daily attendance</p>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-8 text-center space-y-6">
        <div className="text-4xl font-black text-slate-800 tracking-tight font-mono bg-slate-50 py-4 rounded-2xl border border-slate-100">
          {currentTime || '--:--:--'}
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-bold text-slate-900">{user.name}</h3>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{user.role}</p>
          <p className="text-xs text-slate-400 mt-2">
            Scheduled Shift: <span className="font-bold text-slate-600">{user.shiftStart || 'Not set'} - {user.shiftEnd || 'Not set'}</span>
          </p>
        </div>

        {hasCheckedInToday ? (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center justify-center gap-2 font-bold">
            <CheckCircle className="w-5 h-5" /> You are checked in for today.
          </div>
        ) : (
          <button 
            onClick={checkIn}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg rounded-2xl shadow-lg transition-transform active:scale-95"
          >
            PUNCH IN
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
        <h4 className="font-bold text-slate-800 mb-4">Your Recent Activity</h4>
        <div className="space-y-3">
          {logs.filter(l => l.staffId === user.id).slice(0, 5).map(log => (
            <div key={log.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="font-bold text-slate-800">{new Date(log.date).toLocaleDateString()}</p>
                <p className="text-xs text-slate-500">{log.arrivalTime}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${log.status === 'on-time' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700 flex items-center gap-1'}`}>
                {log.status === 'late' && <AlertTriangle className="w-3 h-3" />}
                {log.status.toUpperCase()}
              </span>
            </div>
          ))}
          {logs.filter(l => l.staffId === user.id).length === 0 && (
            <p className="text-center text-sm text-slate-500 py-4">No recent attendance records.</p>
          )}
        </div>
      </div>
    </div>
  );
}
