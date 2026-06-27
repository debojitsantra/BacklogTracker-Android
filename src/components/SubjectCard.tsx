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
  autoGrowthEnabled: boolean;
  maxBacklog: number;
  onModifyBacklog: (amount: number) => void;
  onUpdateDailyIncrease: (rate: number) => void;
}

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
  autoGrowthEnabled,
  maxBacklog,
  onModifyBacklog,
  onUpdateDailyIncrease
}: SubjectCardProps) {
  const { name, emoji, color, backlog, daily_increase } = subject;
  const isLight = isColorLight(color);
  const isTodo = subject.completion_mode === 'todo';
  const mode = subject.growth_mode || (subject.repeat_days?.length ? 'repeat' : daily_increase > 0 ? 'perday' : 'none');
  const unitLabel = daily_increase === 1 ? 'task' : 'tasks';
  const pendingLabel = backlog === 1 ? 'task pending' : 'tasks pending';
  const repeatLabel = mode === 'repeat' && subject.repeat_days?.length ? subject.repeat_days.join(', ') : null;

  const progressRatio = maxBacklog > 0 ? Math.max(0.02, 1.0 - backlog / maxBacklog) : 1.0;

  return (
    <motion.div
      layout
      className="bg-white dark:bg-[#1a1c22] border border-[#cac4d0]/30 dark:border-[#24262f]/60 hover:border-brand/30 rounded-[24px] p-4 flex flex-col justify-between shadow-sm relative overflow-hidden"
    >
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

          {autoGrowthEnabled && mode !== 'none' && (
            <div className="flex items-center gap-1.5 text-xs text-[#49454f] dark:text-[#cac4d0] mt-1.5 font-medium">
              <span className="whitespace-nowrap">{mode === 'repeat' ? 'Repeats:' : 'Auto add:'}</span>
              <div className="flex items-center gap-1">
                {mode === 'perday' && (
                  <>
                    <button
                      type="button"
                      onClick={() => onUpdateDailyIncrease(Math.max(0, daily_increase - 1))}
                      className="w-5 h-5 rounded-md bg-brand-container hover:bg-brand-container-hover text-brand flex items-center justify-center text-xs select-none transition-colors cursor-pointer"
                      style={{ minWidth: '20px', minHeight: '20px' }}
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="font-mono font-bold text-[#1d1b20] dark:text-amber-400 px-1 bg-brand-container rounded-md">+{daily_increase}</span>
                    <button
                      type="button"
                      onClick={() => onUpdateDailyIncrease(daily_increase + 1)}
                      className="w-5 h-5 rounded-md bg-brand-container hover:bg-brand-container-hover text-brand flex items-center justify-center text-xs select-none transition-colors cursor-pointer"
                      style={{ minWidth: '20px', minHeight: '20px' }}
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                    <span className="text-[10px] text-[#49454f]/80 dark:text-[#cac4d0]/80">{unitLabel}/day</span>
                  </>
                )}
                {mode === 'repeat' && (
                  <span className="text-[10px] text-[#49454f]/80 dark:text-[#cac4d0]/80">+{daily_increase} on selected days</span>
                )}
              </div>
            </div>
          )}
          {autoGrowthEnabled && repeatLabel && (
            <div className="text-[10px] text-[#49454f] dark:text-[#cac4d0] font-semibold">
              Repeats: {repeatLabel}
            </div>
          )}
        </div>

        <div className="text-right">
          {isTodo ? (
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${backlog === 0
                ? 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20'
                : 'bg-brand-container text-brand border border-brand/20'
              }`}>
              {backlog === 0 ? 'Completed' : 'Pending'}
            </span>
          ) : (
            <>
              <div className="text-xl font-bold font-mono leading-none text-[#1d1b20] dark:text-white">
                {backlog}
              </div>
              <div className="text-[10px] text-[#49454f] dark:text-[#cac4d0] font-bold uppercase tracking-wider mt-1 whitespace-nowrap">
                {pendingLabel}
              </div>
            </>
          )}
        </div>
      </div>

      {!isTodo && (
        <div className="pl-3 mt-4 space-y-1">
          <div className="flex justify-between items-center text-[10px] text-[#49454f] dark:text-[#cac4d0] font-semibold">
            <span className="whitespace-nowrap">Clearance:</span>
            <span className="font-mono dark:text-amber-400 whitespace-nowrap">{Math.round(progressRatio * 100)}%</span>
          </div>
          <div className="w-full bg-brand-container h-2 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressRatio * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
            />
          </div>
        </div>
      )}

      <div className="pl-3 mt-4 flex gap-2">
        {isTodo ? (
          <button
            type="button"
            onClick={() => onModifyBacklog(backlog > 0 ? -backlog : 1)}
            className="w-full text-xs font-bold py-2.5 px-3 rounded-full flex items-center justify-center gap-1.5 transition-all select-none shadow-sm hover:opacity-90 border border-transparent"
            style={{
              backgroundColor: backlog > 0 ? color : 'var(--brand-container)',
              color: backlog > 0 ? (isLight ? '#1d192b' : '#ffffff') : 'var(--brand)',
              minHeight: '40px'
            }}
          >
            {backlog > 0 ? (
              <>
                <Check className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Complete</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Mark Active</span>
              </>
            )}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onModifyBacklog(1)}
              className="flex-1 bg-brand-container hover:bg-brand-container-hover text-xs font-semibold py-2.5 px-3 rounded-full flex items-center justify-center gap-1.5 text-brand transition-all select-none border border-[#cac4d0]/20 dark:border-transparent cursor-pointer"
              style={{ minHeight: '40px' }}
            >
              <Plus className="w-3.5 h-3.5 flex-shrink-0 text-[#ba1a1a] dark:text-red-400" />
              <span>Add Item</span>
            </button>

            <button
              type="button"
              onClick={() => onModifyBacklog(-1)}
              className="flex-1 text-xs font-bold py-2.5 px-3 rounded-full flex items-center justify-center gap-1.5 transition-all select-none shadow-sm hover:opacity-90 border border-transparent"
              style={{
                backgroundColor: color,
                color: isLight ? '#1d192b' : '#ffffff',
                minHeight: '40px'
              }}
            >
              <Check className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Complete</span>
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}
