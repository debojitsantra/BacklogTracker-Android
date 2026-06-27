/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { PRESET_SUBJECTS, PALETTE } from '../data';
import { AppData, Subject } from '../types';
import { getLocalDateString } from '../utils/date';
import { validateAndParseImport } from '../utils/validation';
import { Plus, Trash2, Palette, Sparkles, AlertCircle, CheckCircle, Upload, X, Check, FileJson, CalendarDays, HelpCircle } from 'lucide-react';

const POPULAR_EMOJIS = [
  '📚', '📝', '💻', '🎨', '🎮', '🏋️', '🏃', '🎸', '🎬', '🍿',
  '🎧', '🚗', '🧹', '🌱', '💼', '🛒', '💰', '📅', '🎯', '🔥',
  '✨', '💡', '🔧', '🔑', '❤️', '🌟', '🍕', '☕', '🥤', '🚀',
  '⚽', '🏊', '🐶', '🐱', '🌸', '🌞', '🌙', '⭐', '🌈', '🌍'
];

interface SetupWizardProps {
  initialData: AppData;
  onSave: (data: AppData) => void;
  onCancel?: () => void;
  onImportCourseDesign?: (importedData: AppData) => void;
}

const WEEK_DAYS = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' }
];

type ScheduleMode = 'none' | 'perday' | 'repeat';

const TRACKING_TYPES: Record<string, { label: string; emoji: string; title: string; entries: Array<{ name: string; emoji: string; color: string; completion_mode?: 'todo' | 'backlog' }> }> = {
  study: {
    label: 'Study',
    emoji: '📚',
    title: 'Study Plan',
    entries: [
      { name: 'Physics', emoji: '⚛️', color: '#ff8a65', completion_mode: 'backlog' },
      { name: 'Math', emoji: '🧮', color: '#4fc3f7', completion_mode: 'backlog' },
      { name: 'Computer Science', emoji: '💻', color: '#f06292', completion_mode: 'backlog' },
      { name: 'Programming', emoji: '⌨️', color: '#9575cd', completion_mode: 'backlog' }
    ]
  },
  gaming: {
    label: 'Gaming',
    emoji: '🎮',
    title: 'Gaming Backlog',
    entries: [
      { name: 'Elden Ring', emoji: '🎮', color: '#6750a4', completion_mode: 'todo' },
      { name: 'The Witcher 3', emoji: '⚔️', color: '#006a6a', completion_mode: 'todo' },
      { name: 'Tomb Raider', emoji: '🏹', color: '#ba68c8', completion_mode: 'todo' },
      { name: 'Pragmata', emoji: '🚀', color: '#f5b400', completion_mode: 'todo' }
    ]
  },
  work: {
    label: 'Work',
    emoji: '💼',
    title: 'Work Queue',
    entries: [
      { name: 'Ticket', emoji: '🎫', color: '#0277bd', completion_mode: 'backlog' },
      { name: 'Sprint', emoji: '🏁', color: '#006a6a', completion_mode: 'backlog' },
      { name: 'Product', emoji: '📦', color: '#d84315', completion_mode: 'backlog' }
    ]
  },
  custom: {
    label: 'Custom',
    emoji: '✨',
    title: 'Custom Backlog',
    entries: []
  }
};

function resolveScheduleConflicts(importedData: AppData): AppData {
  const subjects = { ...importedData.subjects };
  Object.entries(subjects).forEach(([name, subject]) => {
    if (!subject.schedule_conflict) return;
    const keepPerDay = window.confirm(
      `"${name}" has both per-day growth and repeat days. Press OK to keep per-day growth, or Cancel to keep repeat days.`
    );
    subjects[name] = {
      ...subject,
      growth_mode: keepPerDay ? 'perday' : 'repeat',
      repeat_days: keepPerDay ? undefined : subject.repeat_days,
      perday_type: keepPerDay ? 'tasks' : undefined,
      schedule_conflict: false
    };
  });
  return { ...importedData, subjects };
}

export default function SetupWizard({ initialData, onSave, onCancel, onImportCourseDesign }: SetupWizardProps) {
  const [courseName, setCourseName] = useState(initialData.course_name || 'My Backlog Tracker');
  const [classesPerDay, setClassesPerDay] = useState(initialData.classes_per_day || 4);
  const [skipSunday, setSkipSunday] = useState(initialData.skip_sunday !== false);
  const [autoGrowthEnabled, setAutoGrowthEnabled] = useState(initialData.auto_growth_enabled !== false);
  const [activeTrackType, setActiveTrackType] = useState<string | null>(Object.keys(initialData.subjects || {}).length ? 'custom' : null);
  const [customCategoryName, setCustomCategoryName] = useState('Custom');
  const [isNamingCustomCategory, setIsNamingCustomCategory] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [addingCustomName, setAddingCustomName] = useState(false);
  const [newCustomName, setNewCustomName] = useState('');
  const [selectedPresets, setSelectedPresets] = useState<string[]>(() => {
    return Object.keys(initialData.subjects || {}).filter(name => PRESET_SUBJECTS[name]);
  });

  const [presetNames, setPresetNames] = useState<Record<string, string>>(() => {
    const records: Record<string, string> = {};
    Object.keys(PRESET_SUBJECTS).forEach(name => {
      records[name] = initialData.subjects[name]?.name || name;
    });
    return records;
  });

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

  const [presetScheduleModes, setPresetScheduleModes] = useState<Record<string, ScheduleMode>>(() => {
    const records: Record<string, ScheduleMode> = {};
    Object.keys(PRESET_SUBJECTS).forEach(name => {
      const sub = initialData.subjects[name];
      records[name] = sub?.growth_mode || (sub?.repeat_days?.length ? 'repeat' : sub?.daily_increase ? 'perday' : 'none');
    });
    return records;
  });

  const [presetRepeatDays, setPresetRepeatDays] = useState<Record<string, string[]>>(() => {
    const records: Record<string, string[]> = {};
    Object.keys(PRESET_SUBJECTS).forEach(name => {
      records[name] = initialData.subjects[name]?.repeat_days || [];
    });
    return records;
  });

  const [customSubjects, setCustomSubjects] = useState<Subject[]>(() => {
    return Object.entries(initialData.subjects || {})
      .map(([name, s]) => ({
        name,
        emoji: s.emoji || '📚',
        color: s.color || PALETTE[0],
        backlog: s.completion_mode === 'todo' ? Math.max(0, Math.min(1, s.backlog ?? 1)) : (s.backlog ?? 0),
        daily_increase: s.daily_increase ?? 1,
        perday_type: 'tasks',
        repeat_days: s.repeat_days,
        growth_mode: s.growth_mode,
        completion_mode: s.completion_mode || 'backlog'
      }));
  });

  const [editingSubjects, setEditingSubjects] = useState<Subject[]>([]);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [showEditorHelp, setShowEditorHelp] = useState(false);
  const [activeEmojiIdx, setActiveEmojiIdx] = useState<number | null>(null);

  const [showImportPanel, setShowImportPanel] = useState(false);
  const [importText, setImportText] = useState('');
  const [importValidation, setImportValidation] = useState<{
    success: boolean;
    text: string;
    type?: 'course_design' | 'full_backup';
    parsedData?: AppData;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handlePresetNameChange = (name: string, val: string) => {
    setPresetNames(prev => ({ ...prev, [name]: val }));
  };

  const togglePresetRepeatDay = (name: string, day: string) => {
    setPresetRepeatDays(prev => {
      const current = prev[name] || [];
      return {
        ...prev,
        [name]: current.includes(day) ? current.filter(d => d !== day) : [...current, day]
      };
    });
  };

  const handlePresetScheduleModeChange = (name: string, mode: ScheduleMode) => {
    setPresetScheduleModes(prev => ({ ...prev, [name]: mode }));
  };

  const handleCustomScheduleModeChange = (index: number, mode: ScheduleMode) => {
    updateCustomSubject(index, {
      growth_mode: mode,
      repeat_days: mode === 'repeat' ? customSubjects[index].repeat_days : undefined,
      perday_type: mode === 'perday' ? 'tasks' : undefined
    });
  };

  const toggleCustomRepeatDay = (index: number, day: string) => {
    const current = customSubjects[index].repeat_days || [];
    updateCustomSubject(index, {
      repeat_days: current.includes(day) ? current.filter(d => d !== day) : [...current, day]
    });
  };

  const selectTrackingType = (key: string) => {
    const template = TRACKING_TYPES[key];
    setActiveTrackType(key);
    setAddingCustomName(false);
    setNewCustomName('');

    if (key === 'custom') {
      setCustomCategoryName('Custom');
      setIsNamingCustomCategory(true);
      setEditingSubjects([]);
      setEditorOpen(true);
      return;
    }

    if (!template) return;

    const newSubs: typeof customSubjects = template.entries.map((entry, index) => ({
      name: entry.name,
      emoji: entry.emoji,
      color: entry.color || PALETTE[index % PALETTE.length],
      backlog: entry.completion_mode === 'todo' ? 1 : 0,
      daily_increase: 0,
      perday_type: 'tasks',
      growth_mode: 'none' as const,
      completion_mode: (entry.completion_mode || 'backlog') as 'todo' | 'backlog'
    }));
    setEditingSubjects(newSubs);
    setEditorOpen(true);
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
        daily_increase: 1,
        perday_type: 'tasks',
        completion_mode: 'backlog'
      }
    ]);
  };

  const saveCustomNamedRow = () => {
    const trimmedName = newCustomName.trim();
    if (!trimmedName) return;
    const newColor = PALETTE[editingSubjects.length % PALETTE.length];
    setEditingSubjects([
      ...editingSubjects,
      {
        name: trimmedName,
        emoji: '✨',
        color: newColor,
        backlog: 0,
        daily_increase: 1,
        perday_type: 'tasks',
        growth_mode: 'none' as const,
        completion_mode: 'backlog'
      }
    ]);
    setNewCustomName('');
    setAddingCustomName(false);
  };

  const cancelCustomNamedRow = () => {
    setNewCustomName('');
    setAddingCustomName(false);
  };

  const updateEditingSubject = (index: number, fields: Partial<Subject>) => {
    const updated = [...editingSubjects];
    updated[index] = { ...updated[index], ...fields };
    setEditingSubjects(updated);
  };

  const removeEditingSubject = (index: number) => {
    setEditingSubjects(editingSubjects.filter((_, i) => i !== index));
  };

  const cycleEditingColor = (index: number) => {
    const currentColor = editingSubjects[index].color;
    const currentIdx = PALETTE.indexOf(currentColor);
    const nextIdx = (currentIdx + 1) % PALETTE.length;
    updateEditingSubject(index, { color: PALETTE[nextIdx] });
  };

  const handleEditingScheduleModeChange = (index: number, mode: ScheduleMode) => {
    const currentGrowth = editingSubjects[index].daily_increase;
    updateEditingSubject(index, {
      growth_mode: mode,
      repeat_days: mode === 'repeat' ? (editingSubjects[index].repeat_days || []) : undefined,
      perday_type: mode === 'perday' ? 'tasks' : undefined,
      daily_increase: mode === 'none' ? 0 : (currentGrowth || 1)
    });
  };

  const toggleEditingRepeatDay = (index: number, day: string) => {
    const current = editingSubjects[index].repeat_days || [];
    updateEditingSubject(index, {
      repeat_days: current.includes(day) ? current.filter(d => d !== day) : [...current, day]
    });
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

  const handleTextImportValidation = () => {
    const result = validateAndParseImport(importText);
    if (result.success && result.data && result.type) {
      setImportValidation({
        success: true,
        text: `Validation successful! Detected a ${result.type === 'course_design' ? 'Backlog template' : 'Full Backup file'}.`,
        type: result.type,
        parsedData: result.data
      });
    } else {
      setImportValidation({
        success: false,
        text: result.error || 'Invalid JSON input data.'
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setImportText(text);
      const result = validateAndParseImport(text);
      if (result.success && result.data && result.type) {
        setImportValidation({
          success: true,
          text: `File loaded and verified: ${result.type === 'course_design' ? 'Backlog template' : 'Full Backup'}.`,
          type: result.type,
          parsedData: result.data
        });
      } else {
        setImportValidation({
          success: false,
          text: `File Validation failed: ${result.error || 'Parsing error.'}`
        });
      }
    };
    reader.readAsText(file);
  };

  const executeImport = () => {
    if (!importValidation || !importValidation.success || !importValidation.parsedData || !importValidation.type) return;

    const parsedData = resolveScheduleConflicts(importValidation.parsedData);
    if (importValidation.type === 'course_design') {
      if (parsedData.course_name) {
        setCourseName(parsedData.course_name);
      }
      if (parsedData.classes_per_day) {
        setClassesPerDay(parsedData.classes_per_day);
      }
      if (parsedData.skip_sunday !== undefined) {
        setSkipSunday(parsedData.skip_sunday);
      }

      const importedSubjects = parsedData.subjects || {};
      const newCustomSubjects = [...customSubjects];

      Object.entries(importedSubjects).forEach(([name, sub]) => {
        const existingCustomIdx = newCustomSubjects.findIndex(s => s.name.toLowerCase() === name.toLowerCase());
        const importedEntry = {
          name: sub.name || name,
          emoji: sub.emoji || '📚',
          color: sub.color || PALETTE[0],
          backlog: sub.backlog ?? 0,
          daily_increase: sub.daily_increase ?? 0,
          perday_type: 'tasks',
          repeat_days: sub.repeat_days,
          growth_mode: sub.growth_mode || (sub.repeat_days?.length ? 'repeat' : sub.daily_increase > 0 ? 'perday' : 'none'),
          completion_mode: sub.completion_mode || 'backlog'
        };
        if (existingCustomIdx === -1) {
          newCustomSubjects.push(importedEntry);
        } else {
          newCustomSubjects[existingCustomIdx] = {
            ...newCustomSubjects[existingCustomIdx],
            ...importedEntry
          };
        }
      });

      setActiveTrackType('custom');
      setCustomSubjects(newCustomSubjects);

      if (onImportCourseDesign) {
        onImportCourseDesign(parsedData);
      }
    } else {
      if (confirm('Importing this Full Backup will overwrite all your current statistics, subjects, and backlog values. Do you want to proceed?')) {
        onSave(parsedData);
      }
    }
    setShowImportPanel(false);
    setImportText('');
    setImportValidation(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const consolidatedSubjects: Record<string, Subject> = {};

    let hasDuplicateEntry = false;

    let hasEmptyCustomName = false;
    customSubjects.forEach(s => {
      const trimmedName = s.name.trim();
      if (!trimmedName) {
        hasEmptyCustomName = true;
        return;
      }
      if (consolidatedSubjects[trimmedName]) {
        hasDuplicateEntry = true;
      }
      const mode = autoGrowthEnabled ? (s.growth_mode || (s.repeat_days?.length ? 'repeat' : s.daily_increase > 0 ? 'perday' : 'none')) : 'none';
      const isTodo = (s.completion_mode || 'backlog') === 'todo';
      const rawBacklog = Math.max(0, s.backlog);
      const safeBacklog = isTodo ? Math.min(1, rawBacklog) : rawBacklog;
      const safeIncrease = mode === 'none' ? 0 : mode === 'repeat' ? Math.max(1, s.daily_increase) : Math.max(0, s.daily_increase);
      consolidatedSubjects[trimmedName] = {
        name: trimmedName,
        emoji: s.emoji.trim() || '📚',
        color: s.color,
        backlog: safeBacklog,
        daily_increase: safeIncrease,
        perday_type: mode === 'perday' ? 'tasks' : undefined,
        repeat_days: mode === 'repeat' && s.repeat_days?.length ? s.repeat_days : undefined,
        growth_mode: mode,
        completion_mode: s.completion_mode || 'backlog'
      };
    });

    if (hasEmptyCustomName) {
      setValidationError('Custom entry names cannot be left empty. Please fill them or remove the row.');
      return;
    }

    if (Object.keys(consolidatedSubjects).length === 0) {
      setValidationError('Please select or add at least one entry to track.');
      return;
    }

    if (hasDuplicateEntry) {
      setValidationError('Entry names must be unique. Rename or remove duplicate entries.');
      return;
    }

    if (classesPerDay < 1) {
      setValidationError('Daily completion target must be at least 1.');
      return;
    }

    const todayString = getLocalDateString();

    onSave({
      subjects: consolidatedSubjects,
      classes_per_day: classesPerDay,
      skip_sunday: skipSunday,
      course_name: courseName.trim() || 'My Backlog Tracker',
      last_updated: initialData.last_updated || todayString,
      setup_done: true,
      theme: initialData.theme || 'dark',
      palette_color: initialData.palette_color,
      auto_growth_enabled: autoGrowthEnabled
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-container rounded-xl border border-transparent dark:border-amber-400/10">
              <Sparkles className="w-6 h-6 text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-sans tracking-tight text-[#1d1b20] dark:text-white">Setup</h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowImportPanel(!showImportPanel);
              if (showImportPanel) {
                setImportText('');
                setImportValidation(null);
              }
            }}
            className={`text-xs font-bold px-3.5 py-1.5 rounded-full border transition-all flex items-center gap-1 cursor-pointer ${showImportPanel
              ? 'text-[#ba1a1a] dark:text-red-400 bg-red-500/10 border-red-500/30 hover:bg-red-500/20'
              : 'text-brand bg-brand-container hover:bg-brand-container-hover border-[#cac4d0]/25 dark:border-brand-container'
              }`}
            style={{ minHeight: '36px' }}
          >
            {showImportPanel ? (
              <>
                <X className="w-3.5 h-3.5" />
                <span>Close Import</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>Import JSON</span>
              </>
            )}
          </button>
        </div>

        <AnimatePresence>
          {showImportPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mb-6 p-4 bg-[#f3edf7]/50 dark:bg-[#24262f]/40 rounded-2xl border border-brand/20 dark:border-brand-container/60 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#cac4d0]/20 dark:border-[#24262f]/60 pb-2">
                  <div className="flex items-center gap-2">
                    <FileJson className="w-4 h-4 text-brand" />
                    <h3 className="text-xs font-bold text-brand uppercase tracking-wider">Import Template JSON</h3>
                  </div>
                  <a
                    href="https://backlogdesigner.pages.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-brand bg-brand-container hover:bg-brand-container-hover px-3 py-1.5 rounded-full border border-brand/20 transition-all text-center inline-block"
                  >
                    Download Templates 🌐
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-[#cac4d0]/50 dark:border-[#24262f] hover:border-brand hover:bg-[#f3edf7]/30 dark:hover:bg-[#24262f]/60 py-4 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <Upload className="w-5 h-5 text-brand" />
                  <span className="text-[11px] font-bold">Select JSON File</span>
                  <span className="text-[9px] text-[#49454f] dark:text-[#cac4d0]">Supports new items templates, old subjects templates, and backups</span>
                  <input
                    type="file"
                    accept=".json"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </button>

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] text-[#49454f] dark:text-[#cac4d0] font-bold uppercase">Or paste JSON content:</label>
                  <textarea
                    value={importText}
                    onChange={(e) => {
                      setImportText(e.target.value);
                      setImportValidation(null);
                    }}
                    placeholder='{ "schemaVersion": 1, "title": "...", "items": { ... } }'
                    className="bg-white/70 dark:bg-[#111318]/50 text-xs font-mono p-3 rounded-xl border border-[#cac4d0]/40 dark:border-[#24262f] h-24 focus:outline-none focus:border-brand text-[#1d1b20] dark:text-white resize-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTextImportValidation}
                    className="px-4 py-2 bg-brand hover:opacity-90 text-white dark:text-[#111318] text-xs font-bold rounded-full transition-all cursor-pointer"
                    style={{ minHeight: '36px' }}
                  >
                    Verify JSON
                  </button>
                  {importText && (
                    <button
                      type="button"
                      onClick={() => {
                        setImportText('');
                        setImportValidation(null);
                      }}
                      className="text-[10px] text-red-500 font-bold hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {importValidation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`p-3 rounded-xl border flex flex-col gap-2 ${importValidation.success
                        ? 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400'
                        : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400'
                        }`}
                    >
                      <div className="flex items-start gap-2 text-xs">
                        {importValidation.success ? (
                          <Check className="w-4 h-4 flex-shrink-0 text-green-500 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500 mt-0.5" />
                        )}
                        <span className="font-semibold leading-normal">{importValidation.text}</span>
                      </div>

                      {importValidation.success && (
                        <div className="border-t border-[#cac4d0]/20 pt-2 flex flex-col space-y-1">
                          <span className="text-[10px] font-bold text-[#49454f] dark:text-[#cac4d0]">Template: {importValidation.parsedData?.course_name}</span>
                          <span className="text-[10px] font-bold text-[#49454f] dark:text-[#cac4d0]">Entries: {Object.keys(importValidation.parsedData?.subjects || {}).join(', ')}</span>
                          {importValidation.type === 'course_design' ? (
                            <p className="text-[9px] text-[#49454f] dark:text-[#cac4d0] leading-normal italic">
                              This is a template. Loading will pre-fill the wizard with these entries.
                            </p>
                          ) : (
                            <p className="text-[9px] text-red-500 dark:text-red-400 font-bold leading-normal">
                              Warning: This is a Full Backup. Applying will overwrite all local data immediately.
                            </p>
                          )}

                          <button
                            type="button"
                            onClick={executeImport}
                            className={`w-full py-2.5 mt-1 rounded-xl text-xs font-bold text-white transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer ${importValidation.type === 'course_design'
                              ? 'bg-brand hover:opacity-90'
                              : 'bg-red-600 hover:bg-red-700'
                              }`}
                            style={{ minHeight: '40px' }}
                          >
                            <FileJson className="w-3.5 h-3.5" />
                            {importValidation.type === 'course_design' ? 'Load Template into Wizard' : 'Apply Full Backup'}
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-sm font-bold tracking-wide text-brand border-b border-[#cac4d0]/30 dark:border-[#24262f]/60 pb-1 uppercase">
              Tracker Basics
            </h2>


            <div className="flex items-center justify-between bg-brand-container p-3 rounded-xl border border-[#cac4d0]/20 dark:border-brand-container/60">
              <div className="flex flex-col pr-4">
                <span className="text-xs font-bold text-[#1d1b20] dark:text-white">Auto growth rules</span>
                <span className="text-[10px] text-[#49454f] dark:text-[#cac4d0]">When off, schedules are paused and schedule fields are hidden.</span>
              </div>
              <button
                type="button"
                onClick={() => setAutoGrowthEnabled(!autoGrowthEnabled)}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 outline-none ${autoGrowthEnabled ? 'bg-brand' : 'bg-neutral-300 dark:bg-neutral-805'
                  }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-sm transform duration-200 ${autoGrowthEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#49454f] dark:text-[#cac4d0] font-bold">Tracker Name</label>
                <input
                  type="text"
                  value={courseName}
                  onChange={e => setCourseName(e.target.value)}
                  placeholder="e.g., Gaming Backlog, Work Queue, Study Plan"
                  className="bg-brand-container text-sm text-[#1d1b20] dark:text-white px-3 py-2 rounded-xl border border-transparent focus:border-brand focus:outline-none transition-all h-11 font-medium placeholder-[#49454f]/50 dark:placeholder-white/30"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#49454f] dark:text-[#cac4d0] font-bold">Daily Completion Target</label>
                <input
                  type="number"
                  min="1"
                  value={classesPerDay}
                  onChange={e => setClassesPerDay(Math.max(1, parseInt(e.target.value) || 1))}
                  className="bg-brand-container text-sm text-center text-[#1d1b20] dark:text-white px-3 py-2 rounded-xl border border-transparent focus:border-brand focus:outline-none transition-all h-11 font-bold"
                  required
                />
              </div>
            </div>

            {autoGrowthEnabled && (
              <div className="flex items-center justify-between bg-brand-container p-3 rounded-xl border border-[#cac4d0]/20 dark:border-brand-container/60">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#1d1b20] dark:text-white">Skip Sunday auto-growth</span>
                  <span className="text-[10px] text-[#49454f] dark:text-[#cac4d0]">Pauses daily (+per day) growth on Sundays. Does not affect repeat-days schedules.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSkipSunday(!skipSunday)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 outline-none ${skipSunday ? 'bg-brand' : 'bg-neutral-300 dark:bg-neutral-805'
                    }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-sm transform duration-200 ${skipSunday ? 'translate-x-6' : 'translate-x-0'
                      }`}
                  />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-bold tracking-wide text-brand border-b border-[#cac4d0]/30 dark:border-[#24262f]/60 pb-1 uppercase">
              What do you want to track?
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {Object.entries(TRACKING_TYPES).map(([key, type]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectTrackingType(key)}
                  className={`min-h-[86px] rounded-2xl border p-3 flex flex-col items-center justify-center gap-2 transition-all ${activeTrackType === key
                    ? 'bg-brand-container border-brand text-brand shadow-sm'
                    : 'bg-white dark:bg-[#1a1c22]/40 border-[#cac4d0]/30 dark:border-[#24262f]/60 text-[#1d1b20] dark:text-white hover:border-brand/40'
                    }`}
                >
                  {key === 'custom' ? (
                    <Plus className="w-6 h-6 text-brand" />
                  ) : (
                    <span className="text-2xl">{type.emoji}</span>
                  )}
                  <span className="text-xs font-bold">
                    {key === 'custom' && customCategoryName !== 'Custom' ? customCategoryName : type.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {customSubjects.length > 0 && (
            <div className="space-y-3 bg-[#f3edf7]/30 dark:bg-[#24262f]/30 border border-[#cac4d0]/20 dark:border-[#24262f]/60 p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand uppercase tracking-wider">
                  Configured Entries ({customSubjects.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingSubjects([...customSubjects]);
                    if (activeTrackType === 'custom' && customSubjects.length === 0) {
                      setIsNamingCustomCategory(true);
                    } else {
                      setIsNamingCustomCategory(false);
                    }
                    setEditorOpen(true);
                  }}
                  className="text-[10px] font-bold text-brand bg-brand-container hover:bg-brand-container-hover px-3.5 py-1.5 rounded-full border border-brand/20 transition-all cursor-pointer flex items-center gap-1"
                  style={{ minHeight: '28px' }}
                >
                  Configure / Add
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-[#cac4d0]/20 dark:divide-[#24262f]/60 pr-1">
                {customSubjects.map((sub, index) => {
                  const subMode = sub.growth_mode || (sub.repeat_days?.length ? 'repeat' : sub.daily_increase > 0 ? 'perday' : 'none');
                  return (
                    <div key={index} className="flex items-center justify-between py-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base">{sub.emoji}</span>
                        <span className="font-bold truncate" style={{ color: sub.color }}>
                          {sub.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] bg-white dark:bg-[#1a1c22] px-2 py-0.5 rounded-md font-semibold text-[#49454f] dark:text-[#cac4d0] border border-[#cac4d0]/10">
                          {sub.completion_mode === 'todo' ? 'One Time Task' : `Backlog: ${sub.backlog}`}
                        </span>

                        <span className="text-[9px] text-[#49454f] dark:text-[#cac4d0] font-semibold">
                          {subMode === 'none' ? 'Manual' : subMode === 'perday' ? `+${sub.daily_increase}/day` : `Repeat: ${sub.repeat_days?.join(',')}`}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeCustomSubject(index)}
                          className="text-[#ba1a1a] dark:text-red-400 hover:bg-red-500/10 p-1.5 rounded-full transition-colors cursor-pointer flex items-center justify-center"
                          style={{ minWidth: '28px', minHeight: '28px' }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}


          {validationError && (
            <div className="flex items-center gap-2 p-3 bg-[#ba1a1a]/10 border border-[#ba1a1a]/30 rounded-xl text-xs text-[#ba1a1a] dark:text-red-400 font-bold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <div className="flex gap-4 pt-4 border-t border-[#cac4d0]/30 dark:border-[#24262f]/60">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-brand-container hover:bg-brand-container-hover text-brand font-bold text-xs py-3 rounded-full transition-all outline-none border border-[#cac4d0]/20 dark:border-transparent cursor-pointer"
                style={{ minHeight: '44px' }}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="flex-1 bg-brand hover:opacity-90 text-white dark:text-[#111318] font-bold text-xs py-3 rounded-full transition-all outline-none shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              style={{ minHeight: '44px' }}
            >
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              Apply Configuration
            </button>
          </div>
        </form>

        <AnimatePresence>
          {editorOpen && activeTrackType && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1d1b20]/60 dark:bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                className="w-full max-w-3xl max-h-[88vh] overflow-hidden bg-white dark:bg-[#1a1c22] border border-[#cac4d0]/30 dark:border-[#24262f]/60 rounded-[28px] shadow-2xl flex flex-col"
              >
                <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-[#cac4d0]/20 dark:border-[#24262f]/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-brand-container text-brand flex items-center justify-center text-xl">
                      {TRACKING_TYPES[activeTrackType]?.emoji}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#1d1b20] dark:text-white flex items-center gap-1.5">
                        <span>{activeTrackType === 'custom' ? customCategoryName : (TRACKING_TYPES[activeTrackType]?.label || 'Custom')} Entries</span>
                        {activeTrackType === 'custom' && !isNamingCustomCategory && (
                          <button
                            type="button"
                            onClick={() => setIsNamingCustomCategory(true)}
                            className="text-[10px] text-brand hover:underline font-normal cursor-pointer"
                          >
                            (Rename)
                          </button>
                        )}
                      </h3>
                      <p className="text-[10px] text-[#49454f] dark:text-[#cac4d0] font-semibold">
                        Edit names, backlog counts, colors, and schedule rules.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowEditorHelp(prev => !prev)}
                      className={`p-2 rounded-full border transition-all ${showEditorHelp
                        ? 'bg-brand text-white border-brand'
                        : 'bg-brand-container hover:bg-brand-container-hover text-brand border-[#cac4d0]/20'
                        }`}
                      title="What do the fields mean?"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                    {!addingCustomName && (
                      <button
                        type="button"
                        onClick={() => {
                          const newColor = PALETTE[editingSubjects.length % PALETTE.length];
                          setEditingSubjects(prev => [...prev, { name: '', emoji: '📚', color: newColor, backlog: 0, daily_increase: 1, perday_type: 'tasks', growth_mode: 'none' as const, completion_mode: 'backlog' as const }]);
                        }}
                        className="p-2 rounded-full bg-brand-container hover:bg-brand-container-hover text-brand border border-[#cac4d0]/20"
                        title="Add custom entry"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setEditorOpen(false);
                        cancelCustomNamedRow();
                      }}
                      className="p-2 rounded-full bg-[#f3edf7] dark:bg-[#24262f] text-[#49454f] dark:text-[#c4c6d0] flex items-center justify-center cursor-pointer transition-all"
                      style={{ minWidth: '40px', minHeight: '40px' }}
                      title="Discard changes and close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {showEditorHelp && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="absolute inset-x-0 bottom-0 top-[73px] z-30 bg-white dark:bg-[#1a1c22] overflow-y-auto p-6 flex flex-col gap-4 rounded-t-[28px]"
                    >
                      <div className="flex items-center justify-between border-b border-[#cac4d0]/25 dark:border-[#24262f]/60 pb-2">
                        <h4 className="font-bold text-sm text-[#1d1b20] dark:text-white flex items-center gap-1.5">
                          <HelpCircle className="w-4 h-4 text-brand" />
                          Field Explanations
                        </h4>
                        <button
                          type="button"
                          onClick={() => setShowEditorHelp(false)}
                          className="text-xs text-brand hover:underline font-bold px-2 py-1 rounded-lg bg-brand-container hover:bg-brand-container-hover transition-colors"
                        >
                          Close Help
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#49454f] dark:text-[#cac4d0] leading-relaxed font-medium">
                        <div><span className="font-bold text-brand">Entry Name</span> — A label for this item (e.g. Physics, Elden Ring, Daily Run).</div>
                        <div><span className="font-bold text-brand">Emoji</span> — Tap the emoji to open the emoji picker grid and pick one.</div>
                        <div><span className="font-bold text-brand">Color</span> — Tap the color swatch to cycle through palette options.</div>
                        <div><span className="font-bold text-brand">Backlog</span> — How many pending units currently exist for this entry.</div>
                        <div><span className="font-bold text-brand">Completion Mode → Backlog</span> — Multi-step: you tap Add/Complete to change the count manually or auto-grow daily.</div>
                        <div><span className="font-bold text-brand">Completion Mode → One Time Task</span> — Single-click: one tap marks the entire item complete. Best for games, gym sessions, simple tasks.</div>
                        <div><span className="font-bold text-brand">Schedule → Manual</span> — No automatic growth. Only changes when you tap Add or Complete.</div>
                        <div><span className="font-bold text-brand">Schedule → Per Day</span> — Adds a fixed amount every day automatically (e.g. +1 chapter/day).</div>
                        <div><span className="font-bold text-brand">Schedule → Repeat Days</span> — Grows only on specific days of the week (e.g. Gym on Mon, Wed, Fri).</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex-1 overflow-y-auto p-6">
                  {activeTrackType === 'custom' && isNamingCustomCategory ? (
                    <div className="py-8 px-4 max-w-md mx-auto space-y-6">
                      <div className="text-center space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-brand-container text-brand flex items-center justify-center text-2xl mx-auto">
                          ✨
                        </div>
                        <h3 className="text-base font-bold text-[#1d1b20] dark:text-white">
                          Name your Custom Category
                        </h3>
                        <p className="text-xs text-[#49454f] dark:text-[#cac4d0]">
                          Enter a name for this category (e.g. Workout, Gym, Reading) to personalize your tracker.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-[#49454f] dark:text-[#cac4d0]">Category Name</label>
                          <input
                            type="text"
                            value={customCategoryName}
                            onChange={e => setCustomCategoryName(e.target.value)}
                            placeholder="e.g. Workout"
                            className="bg-brand-container text-sm text-[#1d1b20] dark:text-white px-3 py-2.5 rounded-xl border border-transparent focus:border-brand focus:outline-none font-semibold text-center"
                            autoFocus
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const name = customCategoryName.trim() || 'Custom';
                            setCustomCategoryName(name);
                            setIsNamingCustomCategory(false);
                          }}
                          className="w-full bg-brand text-white dark:text-[#111318] py-3 rounded-full text-xs font-bold shadow-sm hover:opacity-90 transition-all cursor-pointer"
                          style={{ minHeight: '44px' }}
                        >
                          Next: Configure Entries
                        </button>
                      </div>
                    </div>
                  ) : editingSubjects.length === 0 && !addingCustomName ? (
                    <div className="min-h-[280px] flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setAddingCustomName(true)}
                        className="w-24 h-24 rounded-full bg-brand-container hover:bg-brand-container-hover text-brand border border-brand/20 flex items-center justify-center shadow-sm"
                        title="Add custom entry"
                      >
                        <Plus className="w-10 h-10" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {addingCustomName && (
                        <div className="bg-brand-container border border-[#cac4d0]/20 dark:border-brand-container/60 rounded-2xl p-4 flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={newCustomName}
                            onChange={e => setNewCustomName(e.target.value)}
                            placeholder="Name this entry"
                            className="flex-1 bg-white dark:bg-[#1a1c22] text-sm text-[#1d1b20] dark:text-white px-3 py-2 rounded-xl border border-transparent focus:border-brand focus:outline-none font-semibold"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={saveCustomNamedRow}
                            className="px-4 py-2 rounded-full bg-brand text-white dark:text-[#111318] text-xs font-bold"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelCustomNamedRow}
                            className="px-4 py-2 rounded-full bg-white dark:bg-[#1a1c22] text-brand text-xs font-bold border border-[#cac4d0]/30 dark:border-[#24262f]"
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      {editingSubjects.map((sub, idx) => {
                        const editMode: ScheduleMode = sub.growth_mode || (sub.repeat_days?.length ? 'repeat' : sub.daily_increase > 0 ? 'perday' : 'none');
                        const isTodoEntry = sub.completion_mode === 'todo';
                        return (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={`editing-sub-${idx}`}
                            className="flex flex-col lg:flex-row items-center gap-3 bg-white dark:bg-[#1a1c22]/50 border border-[#cac4d0]/30 dark:border-[#24262f]/60 p-3 rounded-xl shadow-sm"
                          >
                            <input
                              type="text"
                              placeholder="Entry name..."
                              value={sub.name}
                              onChange={e => updateEditingSubject(idx, { name: e.target.value })}
                              className="bg-brand-container text-sm text-[#1d1b20] dark:text-white px-3 py-2 rounded-xl flex-1 w-full border border-transparent focus:border-brand focus:outline-none transition-all font-semibold"
                            />

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                title="Pick emoji"
                                onClick={() => setActiveEmojiIdx(idx)}
                                className="text-xl w-10 h-10 rounded-xl bg-brand-container hover:bg-brand-container-hover flex items-center justify-center border border-transparent hover:border-brand/30 transition-all cursor-pointer"
                              >
                                {sub.emoji || '📚'}
                              </button>

                              <button
                                type="button"
                                onClick={() => cycleEditingColor(idx)}
                                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all border border-transparent dark:border-[#24262f] hover:border-neutral-400 cursor-pointer"
                                style={{ backgroundColor: sub.color }}
                                title="Cycle Palette Color"
                              >
                                <Palette className="w-4 h-4 text-white drop-shadow-sm" />
                              </button>
                            </div>

                            <div className="flex items-center gap-3 justify-between w-full lg:w-auto">
                              <div className="flex flex-col items-center">
                                <span className="text-[9px] text-[#49454f] dark:text-[#cac4d0] font-bold">{isTodoEntry ? 'One Time Task' : 'Backlog'}</span>
                                {isTodoEntry ? (
                                  <span
                                    title="One time tasks always start as pending (1) or complete (0). Use the main screen to toggle."
                                    className="bg-brand-container/60 text-center text-xs w-14 py-2 rounded-xl text-[#49454f] dark:text-[#cac4d0] font-mono block cursor-not-allowed select-none border border-dashed border-[#cac4d0]/40"
                                  >{sub.backlog === 0 ? '✓ Done' : 'Pending'}</span>
                                ) : (
                                  <input
                                    type="number"
                                    min="0"
                                    value={sub.backlog}
                                    onChange={e => updateEditingSubject(idx, { backlog: Math.max(0, parseInt(e.target.value) || 0) })}
                                    className="bg-brand-container text-center text-xs w-14 py-2 rounded-xl border border-transparent focus:border-brand focus:outline-none text-[#1d1b20] dark:text-white font-mono"
                                  />
                                )}
                              </div>

                              {autoGrowthEnabled && editMode === 'perday' && (
                                <div className="flex flex-col items-center">
                                  <span className="text-[9px] text-[#49454f] dark:text-[#cac4d0] font-bold">Per day</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={sub.daily_increase}
                                    onChange={e => updateEditingSubject(idx, { daily_increase: Math.max(0, parseInt(e.target.value) || 0) })}
                                    className="bg-brand-container text-center text-xs w-14 py-2 rounded-xl border border-transparent focus:border-brand focus:outline-none text-[#1d1b20] dark:text-white font-mono"
                                  />
                                </div>
                              )}

                              {autoGrowthEnabled && editMode === 'repeat' && (
                                <div className="flex flex-col items-center">
                                  <span className="text-[9px] text-[#49454f] dark:text-[#cac4d0] font-bold">Per repeat</span>
                                  <input
                                    type="number"
                                    min="1"
                                    value={sub.daily_increase || 1}
                                    onChange={e => updateEditingSubject(idx, { daily_increase: Math.max(1, parseInt(e.target.value) || 1) })}
                                    className="bg-brand-container text-center text-xs w-14 py-2 rounded-xl border border-transparent focus:border-brand focus:outline-none text-[#1d1b20] dark:text-white font-mono"
                                  />
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => removeEditingSubject(idx)}
                                className="p-2 text-[#ba1a1a] dark:text-red-400 rounded-full hover:bg-red-500/10 transition-colors cursor-pointer"
                                style={{ minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="w-full lg:w-56 space-y-2">
                              <div className="space-y-1">
                                <span className="text-[9px] text-[#49454f] dark:text-[#cac4d0] font-bold uppercase tracking-wider block">Completion Mode</span>
                                <div className="grid grid-cols-2 gap-1 rounded-xl bg-[#f3edf7] dark:bg-[#24262f] p-1">
                                  {(['backlog', 'todo'] as const).map(mode => (
                                    <button
                                      key={mode}
                                      type="button"
                                      onClick={() => {
                                        if (mode === 'todo') {
                                          updateEditingSubject(idx, {
                                            completion_mode: mode,
                                            backlog: 1,
                                            growth_mode: 'none',
                                            daily_increase: 0,
                                            repeat_days: undefined
                                          });
                                        } else {
                                          updateEditingSubject(idx, { completion_mode: mode });
                                        }
                                      }}
                                      className={`text-[9px] font-bold rounded-lg py-1.5 transition-all ${(sub.completion_mode || 'backlog') === mode ? 'bg-white dark:bg-[#1a1c22] text-brand shadow-sm' : 'text-[#49454f] dark:text-[#cac4d0]'}`}
                                    >
                                      {mode === 'backlog' ? 'Backlog (Count)' : 'One Time Task'}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {autoGrowthEnabled && !isTodoEntry && (
                                <div className="space-y-1">
                                  <span className="text-[9px] text-[#49454f] dark:text-[#cac4d0] font-bold uppercase tracking-wider block">Schedule</span>
                                  <div className="grid grid-cols-3 gap-1 rounded-xl bg-[#f3edf7] dark:bg-[#24262f] p-1">
                                    {(['none', 'perday', 'repeat'] as ScheduleMode[]).map(mode => (
                                      <button
                                        key={mode}
                                        type="button"
                                        onClick={() => handleEditingScheduleModeChange(idx, mode)}
                                        className={`text-[9px] font-bold rounded-lg py-1.5 transition-all ${editMode === mode ? 'bg-white dark:bg-[#1a1c22] text-brand shadow-sm' : 'text-[#49454f] dark:text-[#cac4d0]'}`}
                                      >
                                        {mode === 'none' ? 'Manual' : mode === 'perday' ? 'Per day' : 'Repeat'}
                                      </button>
                                    ))}
                                  </div>
                                  {editMode === 'repeat' && (
                                    <>
                                      <span className="text-[9px] text-[#49454f] dark:text-[#cac4d0] font-bold flex items-center gap-1">
                                        <CalendarDays className="w-3 h-3 text-brand" />
                                        Repeat days
                                      </span>
                                      <div className="grid grid-cols-4 gap-1">
                                        {WEEK_DAYS.map(day => {
                                          const selected = (sub.repeat_days || []).includes(day.key);
                                          return (
                                            <button
                                              key={day.key}
                                              type="button"
                                              onClick={() => toggleEditingRepeatDay(idx, day.key)}
                                              className={`text-[9px] font-bold rounded-lg py-1 border transition-all ${selected ? 'bg-brand text-white border-brand' : 'bg-brand-container text-[#49454f] dark:text-[#cac4d0] border-[#cac4d0]/30 dark:border-brand-container'}`}
                                            >
                                              {day.label}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 border-t border-[#cac4d0]/20 dark:border-[#24262f]/60 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomSubjects([...editingSubjects]);

                      if (activeTrackType) {
                        const template = TRACKING_TYPES[activeTrackType];
                        const knownTitles = Object.values(TRACKING_TYPES).map(t => t.title).concat(['My Backlog Tracker', 'Custom Backlog']);
                        if (activeTrackType === 'custom') {
                          const name = customCategoryName.trim() || 'Custom';
                          setCustomCategoryName(name);
                          if (knownTitles.includes(courseName)) {
                            setCourseName(`${name} Backlog`);
                          }
                        } else if (template && template.title) {
                          if (knownTitles.includes(courseName)) {
                            setCourseName(template.title);
                          }
                        }
                      }

                      setEditorOpen(false);
                      cancelCustomNamedRow();
                    }}
                    className="px-5 py-2 rounded-full bg-brand text-white dark:text-[#111318] text-xs font-bold"
                  >
                    Done
                  </button>
                </div>

                <AnimatePresence>
                  {activeEmojiIdx !== null && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
                      <div className="fixed inset-0" onClick={() => setActiveEmojiIdx(null)} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-sm rounded-2xl shadow-xl overflow-hidden bg-white dark:bg-[#1a1c22] z-10 border border-[#cac4d0]/30 dark:border-[#24262f]/60 p-1"
                      >
                        <EmojiPicker
                          onEmojiClick={(emojiData) => {
                            if (activeEmojiIdx !== null) {
                              updateEditingSubject(activeEmojiIdx, { emoji: emojiData.emoji });
                            }
                            setActiveEmojiIdx(null);
                          }}
                          autoFocusSearch={false}
                          width="100%"
                          height="350px"
                          theme={document.documentElement.classList.contains('dark') ? Theme.DARK : Theme.LIGHT}
                        />
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
