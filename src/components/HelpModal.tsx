/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CalendarDays, CheckCircle, Download, Layers, Plus, Sparkles, X } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [page, setPage] = useState(0);
  const pages = [
    {
      icon: <Layers className="w-8 h-8" />,
      title: 'Choose what you track',
      text: 'Track anything that piles up: core study subjects, gaming logs, work tasks/tickets, or personal routines (Gym, habits). Pick a preset category or build a fully custom template.'
    },
    {
      icon: <CheckCircle className="w-8 h-8" />,
      title: 'One Time Task vs. Backlog Completion',
      text: 'Use Backlog mode for multi-step elements (e.g. chapters to read). Use One Time Task mode for single-click items (e.g. playing Elden Ring or going to the gym).'
    },
    {
      icon: <Plus className="w-8 h-8" />,
      title: 'Log and reduce your queue',
      text: 'Tap Add to increase a backlog item. Tap Complete (or toggle the checkbox for One Time Tasks) to clear pending items. Watch your workload index stabilize!'
    },
    {
      icon: <CalendarDays className="w-8 h-8" />,
      title: 'Automatic growth schedules',
      text: 'Set auto-growth rates (e.g. +1 review/day) or repeat days (e.g. Gym on Mon/Wed/Fri). The app automatically simulates elapsed time when you are away.'
    },
    {
      icon: <Download className="w-8 h-8" />,
      title: 'Backups & custom JSONs',
      text: 'Export custom backlog templates, import JSON configurations designed by other students or gamers, or apply full backups from Settings.'
    }
  ];

  if (!isOpen) return null;

  const current = pages[page];
  const isLast = page === pages.length - 1;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#1d1b20]/60 dark:bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-white dark:bg-[#1a1c22] border border-[#cac4d0]/30 dark:border-[#24262f]/60 rounded-[28px] shadow-2xl overflow-hidden text-[#1d1b20] dark:text-white"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#cac4d0]/20 dark:border-[#24262f]/60">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand" />
            <h2 className="text-lg font-bold">Getting Started</h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-full bg-[#f3edf7] dark:bg-[#24262f] text-[#49454f] dark:text-[#c4c6d0] hover:text-[#1d1b20] dark:hover:text-white"
            title="Close help"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="rounded-[24px] bg-brand-container border border-[#cac4d0]/20 dark:border-brand-container/60 p-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#1a1c22] text-brand mx-auto flex items-center justify-center shadow-sm">
              {current.icon}
            </div>
            <h3 className="text-base font-bold mt-4">{current.title}</h3>
            <p className="text-xs text-[#49454f] dark:text-[#cac4d0] leading-relaxed mt-2 font-medium">
              {current.text}
            </p>
          </div>

          <div className="flex justify-center gap-1.5">
            {pages.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all ${idx === page ? 'w-6 bg-brand' : 'w-1.5 bg-[#cac4d0] dark:bg-[#49454f]'}`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {page > 0 && (
              <button
                onClick={() => setPage(page - 1)}
                type="button"
                className="flex-1 bg-brand-container hover:bg-brand-container-hover text-brand font-bold py-2.5 rounded-full text-sm transition-all"
              >
                Back
              </button>
            )}
          <button
            onClick={() => {
              if (isLast) {
                onClose();
              } else {
                setPage(page + 1);
              }
            }}
            type="button"
            className="flex-1 bg-brand hover:opacity-90 text-white dark:text-[#111318] font-bold py-2.5 rounded-full text-sm transition-all"
          >
            {isLast ? 'Start Tracking' : 'Next'}
          </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
