/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Subject } from '../types';

interface BacklogChartProps {
  subjects: Record<string, Subject>;
}

export default function BacklogChart({ subjects }: BacklogChartProps) {
  const activeSubjects = Object.values(subjects);
  const totalBacklog = activeSubjects.reduce((sum, s) => sum + s.backlog, 0);

  if (totalBacklog <= 0) {
    return (
      <div className="bg-brand-container border border-[#cac4d0]/30 dark:border-[#24262f]/60 rounded-[24px] p-6 text-center">
        <span className="text-sm font-bold text-[#006a6a] dark:text-[#86d6a5] tracking-wide block mb-1">
          ALL BACKLOGS CLEARED
        </span>
        <span className="text-xs text-[#49454f] dark:text-[#cac4d0]">
          You currently have zero pending items.
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1a1c22] border border-[#cac4d0]/30 dark:border-[#24262f]/60 rounded-[24px] p-4 space-y-4">
      <div>
        <h3 className="text-xs font-bold text-brand uppercase tracking-wider">
          Backlog Weight Distribution
        </h3>
        <p className="text-[10px] text-[#49454f] dark:text-[#cac4d0] mt-0.5">
          Proportionate breakdown of pending backlog workload
        </p>
      </div>

      <div className="h-4 w-full bg-brand-container rounded-full overflow-hidden flex">
        {activeSubjects.map((sub, idx) => {
          if (sub.backlog <= 0) return null;
          const percentage = (sub.backlog / totalBacklog) * 100;

          return (
            <div
              key={sub.name}
              style={{
                width: `${percentage}%`,
                backgroundColor: sub.color
              }}
              className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
              title={`${sub.emoji} ${sub.name}: ${sub.backlog} pending (${Math.round(percentage)}%)`}
            />
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
        {activeSubjects
          .filter(sub => sub.backlog > 0)
          .sort((a, b) => b.backlog - a.backlog)
          .map(sub => {
            const percentage = Math.round((sub.backlog / totalBacklog) * 100);
            return (
              <div key={sub.name} className="flex items-center gap-1.5 text-xs">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: sub.color }}
                />
                <span className="text-[11px] text-[#1d1b20] dark:text-white font-bold">
                  {sub.emoji} {sub.name}
                </span>
                <span className="text-[10px] text-[#49454f] dark:text-[#cac4d0] font-mono font-medium">
                  ({sub.backlog} • {percentage}%)
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
}
