/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  accentColor?: string;
}

export default function KPICard({ title, value, subtitle, icon, accentColor }: KPICardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white dark:bg-[#1a1c22] border border-[#cac4d0]/30 dark:border-[#24262f]/60 rounded-[24px] p-4 flex flex-col justify-between shadow-sm relative overflow-hidden"
    >
      {accentColor && (
        <div
          className="absolute top-0 left-0 w-full h-1.5 opacity-80"
          style={{ backgroundColor: accentColor }}
        />
      )}

      <div className="flex items-center justify-between gap-1 text-[10px] sm:text-xs font-bold tracking-wider text-[#49454f] dark:text-[#cac4d0] uppercase">
        <span>{title}</span>
        {icon && <span className="opacity-90">{icon}</span>}
      </div>

      <div className="mt-2 flex flex-col">
        <span 
          className={`font-extrabold text-[#1d1b20] dark:text-white transition-all duration-300 ${
            value.length > 8 ? 'text-xs sm:text-sm font-sans' : 'text-xl sm:text-2xl font-mono'
          }`}
        >
          {value}
        </span>
        {subtitle && (
          <span className="text-[10px] sm:text-xs text-[#49454f] dark:text-[#c4c6d0] font-medium leading-none mt-1">
            {subtitle}
          </span>
        )}
      </div>
    </motion.div>
  );
}
