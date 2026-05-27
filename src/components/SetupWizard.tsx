/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { PRESET_SUBJECTS, PALETTE } from '../data';
import { AppData, Subject } from '../types';
import { Plus, Trash2, Palette, Sparkles, BookOpen, AlertCircle, CheckCircle } from 'lucide-react';

interface SetupWizardProps {
  initialData: AppData;
  onSave: (data: AppData) => void;
  onCancel?: () => void;
}

export default function SetupWizard({ initialData, onSave, onCancel }: SetupWizardProps) {
  const [courseName, setCourseName] = useState(initialData.course_name || 'My Course Tracker');
  const [classesPerDay, setClassesPerDay] = useState(initialData.classes_per_day || 4);
  const [skipSunday, setSkipSunday] = useState(initialData.skip_sunday !== false);
  const [selectedPresets, setSelectedPresets] = useState<string[]>(() => {
    // Determine which presets are already customized & present in initialData subjects
    return Object.keys(initialData.subjects || {}).filter(name => PRESET_SUBJECTS[name]);
  });

  // Preset values state
  const [presetBacklogs, setPresetBacklogs] = useState<Record<string, number>>(() => {
    const records: Record<string, number> = {};
    Object.keys(PRESET_SUBJECTS).forEach(name => {
      records[name] = initialData.subjects[name]?.backlog ?? 0;
    });
    return records;
  });

  const [presetGrowths, setPresetGrowths] = useState<Record<string, number>>(() => {
    const records: Record<string, number> = {};
    Object.keys(PRESET_SUBJECTS).forEach(name => {
      records[name] = initialData.subjects[name]?.daily_increase ?? 1;
    });
    return records;
  });

  // Custom subjects state
  const [customSubjects, setCustomSubjects] = useState<Subject[]>(() => {
    return Object.entries(initialData.subjects || {})
      .filter(([name]) => !PRESET_SUBJECTS[name])
      .map(([name, s]) => ({
        name,
        emoji: s.emoji || '📚',
        color: s.color || PALETTE[0],
        backlog: s.backlog || 0,
        daily_increase: s.daily_increase || 1
      }));
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  const togglePreset = (name: string) => {
    if (selectedPresets.includes(name)) {
      setSelectedPresets(selectedPresets.filter(n => n !== name));
    } else {
      setSelectedPresets([...selectedPresets, name]);
    }
  };

  const handlePresetBacklogChange = (name: string, val: string) => {
    const num = Math.max(0, parseInt(val) || 0);
    setPresetBacklogs(prev => ({ ...prev, [name]: num }));
  };

  const handlePresetGrowthChange = (name: string, val: string) => {
    const num = Math.max(0, parseInt(val) || 0);
    setPresetGrowths(prev => ({ ...prev, [name]: num }));
  };

  const addCustomRow = () => {
    const newColor = PALETTE[customSubjects.length % PALETTE.length];
    setCustomSubjects([
      ...customSubjects,
      {
        name: '',
        emoji: '📚',
        color: newColor,
        backlog: 0,
        daily_increase: 1
      }
    ]);
  };

  const updateCustomSubject = (index: number, fields: Partial<Subject>) => {
    const updated = [...customSubjects];
    updated[index] = { ...updated[index], ...fields };
    setCustomSubjects(updated);
  };

  const removeCustomSubject = (index: number) => {
    setCustomSubjects(customSubjects.filter((_, i) => i !== index));
  };

  const cycleCustomColor = (index: number) => {
    const currentColor = customSubjects[index].color;
    const currentIdx = PALETTE.indexOf(currentColor);
    const nextIdx = (currentIdx + 1) % PALETTE.length;
    updateCustomSubject(index, { color: PALETTE[nextIdx] });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const consolidatedSubjects: Record<string, Subject> = {};

    // Validate and add presets
    selectedPresets.forEach(name => {
      const p = PRESET_SUBJECTS[name];
      consolidatedSubjects[name] = {
        name,
        emoji: p.emoji,
        color: p.color,
        backlog: presetBacklogs[name] ?? 0,
        daily_increase: presetGrowths[name] ?? 1
      };
    });

    // Validate and add custom subjects
    let hasEmptyCustomName = false;
    customSubjects.forEach(s => {
      const trimmedName = s.name.trim();
      if (!trimmedName) {
        hasEmptyCustomName = true;
        return;
      }
      consolidatedSubjects[trimmedName] = {
        name: trimmedName,
        emoji: s.emoji.trim() || '📚',
        color: s.color,
        backlog: Math.max(0, s.backlog),
        daily_increase: Math.max(0, s.daily_increase)
      };
    });

    if (hasEmptyCustomName) {
      setValidationError('Custom module names cannot be left empty. Please fill them or remove the row.');
      return;
    }

    if (Object.keys(consolidatedSubjects).length === 0) {
      setValidationError('Please select or add at least one subject to track.');
      return;
    }

    if (classesPerDay < 1) {
      setValidationError('Daily completed target class size must be at least 1.');
      return;
    }

    const todayString = new Date().toISOString().split('T')[0];

    onSave({
      subjects: consolidatedSubjects,
      classes_per_day: classesPerDay,
      skip_sunday: skipSunday,
      course_name: courseName.trim() || 'My Course Tracker',
      last_updated: initialData.last_updated || todayString,
      setup_done: true,
      theme: initialData.theme || 'dark'
    });
  };

  return (
    <div className="min-h-screen bg-[#fef7ff] text-[#1d1b20] dark:bg-[#111318] dark:text-[#e6e1e5] px-4 py-8 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-2xl bg-white dark:bg-[#1a1c22] border border-[#cac4d0]/30 dark:border-[#24262f]/60 rounded-[28px] shadow-sm overflow-hidden p-6 md:p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-[#e8def8] dark:bg-[#24262f] rounded-xl border border-transparent dark:border-amber-400/10">
            <Sparkles className="w-6 h-6 text-[#6750a4] dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-sans tracking-tight text-[#1d1b20] dark:text-white">Course Setup Wizard</h1>
            <p className="text-xs text-[#49454f] dark:text-[#cac4d0]"></p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Target Settings */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold tracking-wide text-[#6750a4] dark:text-[#a8c7fa] border-b border-[#cac4d0]/30 dark:border-[#24262f]/60 pb-1 uppercase">
              📝 Target Parameters
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#49454f] dark:text-[#cac4d0] font-bold">Batch / Goal Name</label>
                <input
                  type="text"
                  value={courseName}
                  onChange={e => setCourseName(e.target.value)}
                  placeholder="e.g., JEE Preparation, Codecraft Bootcamp"
                  className="bg-[#f3edf7] dark:bg-[#24262f] text-sm text-[#1d1b20] dark:text-white px-3 py-2 rounded-xl border border-transparent focus:border-[#6750a4] dark:focus:border-[#a8c7fa] focus:outline-none transition-all h-11 font-medium placeholder-[#49454f]/50 dark:placeholder-white/30"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#49454f] dark:text-[#cac4d0] font-bold">Daily Watched Classes Target (CPD)</label>
                <input
                  type="number"
                  min="1"
                  value={classesPerDay}
                  onChange={e => setClassesPerDay(Math.max(1, parseInt(e.target.value) || 1))}
                  className="bg-[#f3edf7] dark:bg-[#24262f] text-sm text-center text-[#1d1b20] dark:text-white px-3 py-2 rounded-xl border border-transparent focus:border-[#6750a4] dark:focus:border-[#a8c7fa] focus:outline-none transition-all h-11 font-bold"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between bg-[#f3edf7] dark:bg-[#24262f] p-3 rounded-xl border border-[#cac4d0]/20 dark:border-[#24262f]/60">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#1d1b20] dark:text-white">No new lectures on Sunday</span>
                <span className="text-[10px] text-[#49454f] dark:text-[#cac4d0]">Excludes automated growth on Sundays</span>
              </div>
              <button
                type="button"
                onClick={() => setSkipSunday(!skipSunday)}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 outline-none ${
                  skipSunday ? 'bg-[#6750a4] dark:bg-[#a8c7fa]' : 'bg-neutral-300 dark:bg-neutral-805'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-sm transform duration-200 ${
                    skipSunday ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Quick Preset Modules */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold tracking-wide text-[#6750a4] dark:text-[#a8c7fa] border-b border-[#cac4d0]/30 dark:border-[#24262f]/60 pb-1 uppercase">
              📋 Select Curriculum Presets
            </h2>
            <p className="text-[11px] text-[#49454f] dark:text-[#cac4d0] font-medium">Toggle subjects and specify initial values:</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(PRESET_SUBJECTS).map(([name, config]) => {
                const isActive = selectedPresets.includes(name);
                return (
                  <div
                    key={name}
                    className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                      isActive
                        ? 'bg-[#f3edf7] dark:bg-[#24262f]/60 border-[#6750a4]/50 dark:border-[#a8c7fa]/50 shadow-sm'
                        : 'bg-white dark:bg-[#1a1c22]/30 border-[#cac4d0]/30 dark:border-[#24262f]/60 hover:border-[#6750a4]/20 dark:hover:border-[#a8c7fa]/20'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => togglePreset(name)}
                      className="flex items-center gap-2 w-full text-left font-bold text-xs text-[#1d1b20] dark:text-white pb-2"
                      style={{ minHeight: '44px' }}
                    >
                      <span className="text-lg">{config.emoji}</span>
                      <span className="flex-1 truncate">{name}</span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isActive ? 'border-[#6750a4] bg-[#6750a4] dark:border-[#a8c7fa] dark:bg-[#a8c7fa]' : 'border-neutral-400 dark:border-neutral-600'
                        }`}
                      >
                        {isActive && <div className="w-2 h-2 bg-white dark:bg-[#111318] rounded-full" />}
                      </div>
                    </button>

                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-2 mt-1 pt-2 border-t border-[#cac4d0]/20 dark:border-[#24262f]/60"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#49454f] dark:text-[#cac4d0] font-semibold">Backlog:</span>
                          <input
                            type="number"
                            min="0"
                            value={presetBacklogs[name] ?? 0}
                            onChange={e => handlePresetBacklogChange(name, e.target.value)}
                            className="bg-white dark:bg-[#1a1c22] text-center w-14 py-0.5 rounded border border-[#cac4d0]/40 dark:border-[#24262f] text-[#1d1b20] dark:text-white font-mono focus:outline-none focus:border-[#6750a4] dark:focus:border-[#a8c7fa]"
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#49454f] dark:text-[#cac4d0] font-semibold">Growth/day:</span>
                          <input
                            type="number"
                            min="0"
                            value={presetGrowths[name] ?? 1}
                            onChange={e => handlePresetGrowthChange(name, e.target.value)}
                            className="bg-white dark:bg-[#1a1c22] text-center w-14 py-0.5 rounded border border-[#cac4d0]/40 dark:border-[#24262f] text-[#1d1b20] dark:text-white font-mono focus:outline-none focus:border-[#6750a4] dark:focus:border-[#a8c7fa]"
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Subject Append list */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#cac4d0]/30 dark:border-[#24262f]/60 pb-1">
              <h2 className="text-sm font-bold tracking-wide text-[#6750a4] dark:text-[#a8c7fa] uppercase">
                ➕ Custom Curriculum Modules
              </h2>
              <button
                type="button"
                onClick={addCustomRow}
                className="flex items-center gap-1 text-xs text-[#6750a4] dark:text-[#a8c7fa] bg-[#f3edf7] dark:bg-[#24262f] px-3 py-1.5 rounded-full hover:bg-[#e8def8] dark:hover:bg-neutral-805 transition-all font-bold border border-[#cac4d0]/20 dark:border-transparent"
                style={{ minHeight: '36px' }}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Row
              </button>
            </div>

            {customSubjects.length === 0 ? (
              <p className="text-[11px] text-center text-[#49454f] dark:text-[#cac4d0] py-3 italic bg-[#f3edf7]/50 dark:bg-[#24262f]/40 rounded-xl font-medium">
                No custom modules added. Click the "Add Row" button above if your curriculum requires custom topics.
              </p>
            ) : (
              <div className="space-y-3">
                {customSubjects.map((sub, idx) => (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={idx}
                    className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-[#1a1c22]/50 border border-[#cac4d0]/30 dark:border-[#24262f]/60 p-3 rounded-xl shadow-sm"
                  >
                    <input
                      type="text"
                      placeholder="Module Name..."
                      value={sub.name}
                      onChange={e => updateCustomSubject(idx, { name: e.target.value })}
                      className="bg-[#f3edf7] dark:bg-[#24262f] text-sm text-[#1d1b20] dark:text-white px-3 py-2 rounded-xl flex-1 w-full border border-transparent focus:border-[#6750a4] dark:focus:border-[#a8c7fa] focus:outline-none transition-all font-semibold"
                    />

                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        placeholder="Emoji"
                        value={sub.emoji}
                        onChange={e => updateCustomSubject(idx, { emoji: e.target.value })}
                        className="bg-[#f3edf7] dark:bg-[#24262f] text-center text-sm w-12 py-2 rounded-xl border border-transparent focus:border-[#6750a4] dark:focus:border-[#a8c7fa] focus:outline-none text-[#1d1b20] dark:text-white"
                      />

                      <button
                        type="button"
                        onClick={() => cycleCustomColor(idx)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all border border-transparent dark:border-[#24262f] hover:border-neutral-400"
                        style={{ backgroundColor: sub.color }}
                        title="Cycle Palette Color"
                      >
                        <Palette className="w-4 h-4 text-white drop-shadow-sm" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 justify-between w-full sm:w-auto">
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] text-[#49454f] dark:text-[#cac4d0] font-bold">Backlog</span>
                        <input
                          type="number"
                          min="0"
                          value={sub.backlog}
                          onChange={e => updateCustomSubject(idx, { backlog: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="bg-[#f3edf7] dark:bg-[#24262f] text-center text-xs w-14 py-2 rounded-xl border border-transparent focus:border-[#6750a4] dark:focus:border-[#a8c7fa] focus:outline-none text-[#1d1b20] dark:text-white font-mono"
                        />
                      </div>

                      <div className="flex flex-col items-center">
                        <span className="text-[9px] text-[#49454f] dark:text-[#cac4d0] font-bold">Growth/d</span>
                        <input
                          type="number"
                          min="0"
                          value={sub.daily_increase}
                          onChange={e => updateCustomSubject(idx, { daily_increase: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="bg-[#f3edf7] dark:bg-[#24262f] text-center text-xs w-14 py-2 rounded-xl border border-transparent focus:border-[#6750a4] dark:focus:border-[#a8c7fa] focus:outline-none text-[#1d1b20] dark:text-white font-mono"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeCustomSubject(idx)}
                        className="p-2 text-[#ba1a1a] dark:text-red-400 rounded-full hover:bg-red-500/10 transition-colors"
                        style={{ minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Validation feedback */}
          {validationError && (
            <div className="flex items-center gap-2 p-3 bg-[#ba1a1a]/10 border border-[#ba1a1a]/30 rounded-xl text-xs text-[#ba1a1a] dark:text-red-400 font-bold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Action pills */}
          <div className="flex gap-4 pt-4 border-t border-[#cac4d0]/30 dark:border-[#24262f]/60">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-[#f3edf7] dark:bg-[#24262f] hover:bg-[#e8def8] dark:hover:bg-neutral-800 text-[#6750a4] dark:text-[#a8c7fa] font-bold text-sm py-3 rounded-full transition-all outline-none border border-[#cac4d0]/20 dark:border-transparent"
                style={{ minHeight: '44px' }}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="flex-1 bg-[#6750a4] hover:bg-[#5b4396] dark:bg-[#a8c7fa] dark:hover:bg-[#91b3f5] text-white dark:text-[#111318] font-bold text-sm py-3 rounded-full transition-all outline-none shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              style={{ minHeight: '44px' }}
            >
              <CheckCircle className="w-4 h-4" />
              Apply Configuration
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
