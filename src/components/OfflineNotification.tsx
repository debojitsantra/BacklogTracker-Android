/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, AlertCircle, X, Sparkles, Flame } from 'lucide-react';

interface OfflineNotificationProps {
  lastUpdatedDate: string;
  daysElapsed: number;
  totalBacklogAdded: number;
  onClose: () => void;
}

export default function OfflineNotification({
  lastUpdatedDate,
  daysElapsed,
  totalBacklogAdded,
  onClose
}: OfflineNotificationProps) {
  if (daysElapsed <= 0) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1d1b20]/60 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="relative w-full max-w-md bg-[#fef7ff] dark:bg-[#1a1c22] border border-[#cac4d0]/30 dark:border-[#24262f]/60 rounded-[28px] p-6 shadow-xl text-[#1d1b20] dark:text-white"
        >
          <div className="flex items-center gap-3 text-[#ba1a1a] dark:text-red-400 mb-4">
            <div className="p-2.5 bg-[#ba1a1a]/10 dark:bg-red-500/10 rounded-xl border border-transparent dark:border-red-500/20">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1d1b20] dark:text-white font-sans">Backlog Growth Alert!</h3>
              <p className="text-[10px] text-[#ba1a1a] dark:text-red-400 uppercase tracking-wider font-extrabold">
                Auto-Growth Synchronized
              </p>
            </div>
          </div>

          <p className="text-sm text-[#49454f] dark:text-[#c4c6d0] leading-relaxed">
            Welcome back! Since your last check-in on <strong className="text-[#1d1b20] dark:text-amber-400 font-mono font-bold">{lastUpdatedDate}</strong> (
            <strong className="text-[#1d1b20] dark:text-white font-bold">{daysElapsed} {daysElapsed === 1 ? 'day' : 'days'} ago</strong>), your automatic backlog rules have added new work.
          </p>

          <div className="mt-4 p-4 bg-brand-container rounded-[20px] flex items-center justify-between border border-[#cac4d0]/20 dark:border-brand-container/60">
            <div className="flex flex-col">
              <span className="text-[10px] text-[#49454f] dark:text-[#cac4d0] font-extrabold uppercase tracking-wider">
                Items Accumulating
              </span>
              <span className="text-2xl font-black text-[#ba1a1a] dark:text-red-400 font-mono mt-0.5">
                +{totalBacklogAdded}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#49454f] dark:text-[#cac4d0] font-extrabold uppercase tracking-wider">
                Workload Compounding
              </span>
              <p className="text-xs text-[#1d1b20] dark:text-white mt-1 italic font-medium">
                "Defeat the snowball now!"
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={onClose}
              type="button"
              className="w-full bg-brand hover:opacity-90 text-white dark:text-[#111318] font-bold text-sm py-3 rounded-full transition-all outline-none md:cursor-pointer flex items-center justify-center gap-2 shadow-sm hover:shadow-md cursor-pointer"
              style={{ minHeight: '44px' }}
            >
              <Sparkles className="w-4 h-4" />
              Focus & Neutralize
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
