/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Minus, Plus, Check } from 'lucide-react';
import { Subject } from '../types';

interface SubjectCardProps {
  key?: string;
  subject: Subject;
  maxBacklog: number;
  onModifyBacklog: (amount: number) => void;
  onUpdateDailyIncrease: (rate: number) => void;
}

// Check contrast/brightness helper for pristine Material Design 3 text rendering
function isColorLight(hexColor: string): boolean {
  const hex = hexColor.replace('#', '');
  try {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 140;
  } catch (e) {
    return true;
  }
}

export default function SubjectCard({
  subject,
  maxBacklog,
  onModifyBacklog,
  onUpdateDailyIncrease
}: SubjectCardProps) {
  const { name, emoji, color, backlog, daily_increase } = subject;
  const isLight = isColorLight(color);

  // Clearance percentage shows your progress against worst-case backlog scaling
  const progressRatio = maxBacklog > 0 ? Math.max(0.02, 1.0 - backlog / maxBacklog) : 1.0;

  return (
    <motion.div
      layout
      className="bg-white dark:bg-[#1a1c22] border border-[#cac4d0]/30 dark:border-[#24262f]/60 hover:border-[#6750a4]/30 dark:hover:border-[#6aa0f2]/30 rounded-[24px] p-4 flex flex-col justify-between shadow-sm relative overflow-hidden"
    >
      {/* Decorative vertical badge line */}
      <div
        className="absolute top-0 bottom-0 left-0 w-2"
        style={{ backgroundColor: color }}
      />

      <div className="flex items-start justify-between gap-2 pl-3">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xl leading-none">{emoji}</span>
            <span className="text-base font-bold font-sans truncate text-[#1d1b20] dark:text-white" style={{ borderBottom: `2px solid ${color}40` }}>
              {name}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 text-xs text-[#49454f] dark:text-[#cac4d0] mt-1.5 font-medium">
            <span>Growth rate:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onUpdateDailyIncrease(Math.max(0, daily_increase - 1))}
                className="w-5 h-5 rounded-md bg-[#e8def8] dark:bg-[#24262f] hover:bg-[#d0bcff] dark:hover:bg-neutral-800 text-[#1d192b] dark:text-[#a8c7fa] flex items-center justify-center text-xs select-none transition-colors"
                style={{ minWidth: '20px', minHeight: '20px' }}
              >
                <Minus className="w-2.5 h-2.5" />
              </button>
              <span className="font-mono font-bold text-[#1d1b20] dark:text-amber-400 px-1 bg-[#f3edf7] dark:bg-neutral-800 rounded-md">+{daily_increase}</span>
              <button
                type="button"
                onClick={() => onUpdateDailyIncrease(daily_increase + 1)}
                className="w-5 h-5 rounded-md bg-[#e8def8] dark:bg-[#24262f] hover:bg-[#d0bcff] dark:hover:bg-neutral-800 text-[#1d192b] dark:text-[#a8c7fa] flex items-center justify-center text-xs select-none transition-colors"
                style={{ minWidth: '20px', minHeight: '20px' }}
              >
                <Plus className="w-2.5 h-2.5" />
              </button>
              <span className="text-[10px] text-[#49454f]/80 dark:text-[#cac4d0]/80">/day</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xl font-bold font-mono leading-none text-[#1d1b20] dark:text-white">
            {backlog}
          </div>
          <div className="text-[10px] text-[#49454f] dark:text-[#cac4d0] font-bold uppercase tracking-wider mt-1">
            Lectures Left
          </div>
        </div>
      </div>

      {/* Progress cleared visual index indicator */}
      <div className="pl-3 mt-4 space-y-1">
        <div className="flex justify-between items-center text-[10px] text-[#49454f] dark:text-[#cac4d0] font-semibold">
          <span>Surplus control:</span>
          <span className="font-mono dark:text-amber-400">{Math.round(progressRatio * 100)}%</span>
        </div>
        <div className="w-full bg-[#f3edf7] dark:bg-[#24262f] h-2 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressRatio * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
          />
        </div>
      </div>

      {/* Quick interactive touch elements */}
      <div className="pl-3 mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onModifyBacklog(1)}
          className="flex-1 min-w-[100px] bg-[#f3edf7] dark:bg-[#24262f] hover:bg-[#e8def8] dark:hover:bg-neutral-800 text-xs font-semibold py-2.5 px-3 rounded-full flex items-center justify-center gap-1.5 text-[#6750a4] dark:text-[#a8c7fa] transition-all select-none border border-[#cac4d0]/20 dark:border-transparent"
          style={{ minHeight: '44px' }}
        >
          <Plus className="w-3.5 h-3.5 text-[#ba1a1a] dark:text-red-400" />
          <span>Class Added</span>
        </button>

        <button
          type="button"
          onClick={() => onModifyBacklog(-1)}
          className="flex-1 min-w-[120px] text-xs font-bold py-2.5 px-3 rounded-full flex items-center justify-center gap-1.5 transition-all select-none shadow-sm hover:opacity-90 border border-transparent"
          style={{
            backgroundColor: color,
            color: isLight ? '#1d192b' : '#ffffff',
            minHeight: '44px'
          }}
        >
          <Check className="w-3.5 h-3.5" />
          <span>Completed Class</span>
        </button>
      </div>
    </motion.div>
  );
}
