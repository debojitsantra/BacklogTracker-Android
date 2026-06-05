/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sliders,
  Database,
  Download,
  Upload,
  Copy,
  Check,
  Palette,
  AlertCircle,
  Eye,
  EyeOff,
  CalendarDays,
  FileJson
} from 'lucide-react';
import { AppData } from '../types';
import { validateAndParseImport } from '../utils/validation';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AppData;
  showQuotes: boolean;
  onToggleQuotes: (val: boolean) => void;
  onUpdateData: (newData: AppData) => void;
  onImportFullBackup: (importedData: AppData) => void;
  onImportCourseDesign: (importedData: AppData) => void;
  darkMode: boolean;
  onToggleDarkMode: (val: boolean) => void;
}

const COLOR_PRESETS = [
  { name: 'Classic Purple', hex: '#6750a4' },
  { name: 'Teal Forest', hex: '#006a6a' },
  { name: 'Crimson Fire', hex: '#ba1a1a' },
  { name: 'Ocean Blue', hex: '#0277bd' },
  { name: 'Sunset Orange', hex: '#d84315' }
];

export default function SettingsModal({
  isOpen,
  onClose,
  data,
  showQuotes,
  onToggleQuotes,
  onUpdateData,
  onImportFullBackup,
  onImportCourseDesign,
  darkMode,
  onToggleDarkMode
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'customization' | 'backup'>('customization');
  
  // Customization States
  const [selectedColor, setSelectedColor] = useState(data.palette_color || '#6750a4');
  
  // Backup & Import States
  const [copiedType, setCopiedType] = useState<'course' | 'backup' | null>(null);
  const [importText, setImportText] = useState('');
  const [validationMessage, setValidationMessage] = useState<{
    success: boolean;
    text: string;
    type?: 'course_design' | 'full_backup';
    parsedData?: AppData;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleColorChange = (hex: string) => {
    setSelectedColor(hex);
    onUpdateData({
      ...data,
      palette_color: hex
    });
  };

  const handleSkipSundayChange = (val: boolean) => {
    onUpdateData({
      ...data,
      skip_sunday: val
    });
  };

  // Helper to trigger file download
  const downloadJSON = (obj: object, filename: string) => {
    const jsonStr = JSON.stringify(obj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCourseDesign = () => {
    // Exclude backlogs, last_updated, setup_done, etc.
    const cleanSubjects: Record<string, any> = {};
    Object.entries(data.subjects || {}).forEach(([name, sub]) => {
      cleanSubjects[name] = {
        emoji: sub.emoji,
        color: sub.color,
        daily_increase: sub.daily_increase
      };
    });

    const exportObj = {
      schemaVersion: 1,
      exportType: 'course_design',
      course_name: data.course_name,
      subjects: cleanSubjects,
      classes_per_day: data.classes_per_day,
      skip_sunday: data.skip_sunday,
      theme: data.theme,
      palette_color: data.palette_color
    };

    downloadJSON(exportObj, `${data.course_name.toLowerCase().replace(/\s+/g, '-')}-course-design.json`);
  };

  const handleExportFullBackup = () => {
    const exportObj = {
      ...data,
      schemaVersion: 1,
      exportType: 'full_backup'
    };
    downloadJSON(exportObj, `backlog-tracker-backup-${new Date().toISOString().split('T')[0]}.json`);
  };

  const handleCopyJson = (type: 'course' | 'backup') => {
    let objToCopy: object;
    if (type === 'course') {
      const cleanSubjects: Record<string, any> = {};
      Object.entries(data.subjects || {}).forEach(([name, sub]) => {
        cleanSubjects[name] = {
          emoji: sub.emoji,
          color: sub.color,
          daily_increase: sub.daily_increase
        };
      });

      objToCopy = {
        schemaVersion: 1,
        exportType: 'course_design',
        course_name: data.course_name,
        subjects: cleanSubjects,
        classes_per_day: data.classes_per_day,
        skip_sunday: data.skip_sunday,
        theme: data.theme,
        palette_color: data.palette_color
      };
    } else {
      objToCopy = {
        ...data,
        schemaVersion: 1,
        exportType: 'full_backup'
      };
    }

    navigator.clipboard.writeText(JSON.stringify(objToCopy, null, 2))
      .then(() => {
        setCopiedType(type);
        setTimeout(() => setCopiedType(null), 2000);
      });
  };

  const handleTextImportValidation = () => {
    const result = validateAndParseImport(importText);
    if (result.success && result.data && result.type) {
      setValidationMessage({
        success: true,
        text: `Validation successful! Detected a ${result.type === 'course_design' ? 'Course Design template' : 'Full Backup file'}.`,
        type: result.type,
        parsedData: result.data
      });
    } else {
      setValidationMessage({
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
        setValidationMessage({
          success: true,
          text: `File loaded and verified: ${result.type === 'course_design' ? 'Course Design' : 'Full Backup'}.`,
          type: result.type,
          parsedData: result.data
        });
      } else {
        setValidationMessage({
          success: false,
          text: `File Validation failed: ${result.error || 'Parsing error.'}`
        });
      }
    };
    reader.readAsText(file);
  };

  const executeImport = () => {
    if (!validationMessage || !validationMessage.success || !validationMessage.parsedData || !validationMessage.type) return;

    const parsedData = validationMessage.parsedData;
    if (validationMessage.type === 'course_design') {
      onImportCourseDesign(parsedData);
      onClose();
    } else {
      if (confirm('Importing this Full Backup will overwrite all your current statistics, subjects, and backlog values. Do you want to proceed?')) {
        onImportFullBackup(parsedData);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1d1b20]/60 dark:bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg bg-white dark:bg-[#1a1c22] border border-[#cac4d0]/30 dark:border-[#24262f]/60 rounded-[28px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-[#1d1b20] dark:text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#cac4d0]/20 dark:border-[#24262f]/60">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-brand" />
            <h2 className="text-lg font-bold font-sans">Application Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#49454f] dark:text-[#c4c6d0] hover:text-[#1d1b20] dark:hover:text-white rounded-full bg-[#f3edf7] dark:bg-[#24262f] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-[#f3edf7] dark:bg-[#24262f] p-1 mx-6 mt-4 rounded-xl">
          <button
            onClick={() => setActiveTab('customization')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'customization'
                ? 'bg-white dark:bg-[#1a1c22] text-brand shadow-sm'
                : 'text-[#49454f] dark:text-[#cac4d0] hover:text-[#1d1b20] dark:hover:text-white'
            }`}
          >
            Customization
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-white dark:bg-[#1a1c22] text-brand shadow-sm'
                : 'text-[#49454f] dark:text-[#cac4d0] hover:text-[#1d1b20] dark:hover:text-white'
            }`}
          >
            Backup & Share
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {activeTab === 'customization' ? (
            <>
              {/* App Theme Toggle */}
              <div className="space-y-2">
                <label className="text-xs text-[#49454f] dark:text-[#cac4d0] font-bold uppercase tracking-wider block">App Layout Theme</label>
                <div className="flex items-center justify-between p-3 bg-[#f3edf7]/50 dark:bg-[#24262f]/40 rounded-2xl border border-[#cac4d0]/20 dark:border-[#24262f]/60">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold">Dark mode view state</span>
                    <span className="text-[10px] text-[#49454f] dark:text-[#cac4d0]">Toggle between standard dark mode and light theme</span>
                  </div>
                  <button
                    onClick={() => onToggleDarkMode(!darkMode)}
                    type="button"
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                      darkMode ? 'bg-brand' : 'bg-neutral-300 dark:bg-neutral-805'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-sm transform duration-200 ${
                        darkMode ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Theme Customization Presets */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-brand" />
                  <label className="text-xs text-[#49454f] dark:text-[#cac4d0] font-bold uppercase tracking-wider block">App Color Customization</label>
                </div>
                
                {/* Presets Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {COLOR_PRESETS.map((color) => {
                    const isSelected = selectedColor.toLowerCase() === color.hex.toLowerCase();
                    return (
                      <button
                        key={color.name}
                        onClick={() => handleColorChange(color.hex)}
                        className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all text-left cursor-pointer ${
                          isSelected
                            ? 'bg-[#f3edf7] dark:bg-[#24262f] border-brand shadow-sm font-bold'
                            : 'bg-white dark:bg-[#1a1c22]/40 border-[#cac4d0]/30 dark:border-[#24262f]/60 hover:border-brand/40'
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: color.hex }} />
                        <span className="text-xs truncate">{color.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Color Picker */}
                <div className="flex items-center gap-3 bg-[#f3edf7]/50 dark:bg-[#24262f]/40 p-3 rounded-2xl border border-[#cac4d0]/20 dark:border-[#24262f]/60">
                  <span className="text-xs font-semibold flex-1">Or select custom HEX accent color:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={selectedColor}
                      onChange={(e) => handleColorChange(e.target.value)}
                      placeholder="#6750a4"
                      className="w-20 px-2 py-1 bg-white dark:bg-[#1a1c22] text-xs font-mono rounded-lg border border-[#cac4d0]/40 dark:border-[#24262f] text-center focus:outline-none focus:border-brand"
                    />
                    <input
                      type="color"
                      value={selectedColor.startsWith('#') && selectedColor.length === 7 ? selectedColor : '#6750a4'}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 overflow-hidden bg-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Growth Customization: Skip Sundays */}
              <div className="space-y-2">
                <label className="text-xs text-[#49454f] dark:text-[#cac4d0] font-bold uppercase tracking-wider block">Weekly Planning</label>
                <div className="flex items-center justify-between p-3 bg-[#f3edf7]/50 dark:bg-[#24262f]/40 rounded-2xl border border-[#cac4d0]/20 dark:border-[#24262f]/60">
                  <div className="flex flex-col flex-1 pr-4">
                    <div className="flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5 text-brand" />
                      <span className="text-xs font-bold">Skip Sunday in backlog growth</span>
                    </div>
                    <span className="text-[10px] text-[#49454f] dark:text-[#cac4d0]">Prevents automated daily backlog increases from executing on Sundays</span>
                  </div>
                  <button
                    onClick={() => handleSkipSundayChange(!data.skip_sunday)}
                    type="button"
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                      data.skip_sunday ? 'bg-brand' : 'bg-neutral-300 dark:bg-neutral-805'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-sm transform duration-200 ${
                        data.skip_sunday ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Interface Customization: Quotes */}
              <div className="space-y-2">
                <label className="text-xs text-[#49454f] dark:text-[#cac4d0] font-bold uppercase tracking-wider block">Dashboard Layout</label>
                <div className="flex items-center justify-between p-3 bg-[#f3edf7]/50 dark:bg-[#24262f]/40 rounded-2xl border border-[#cac4d0]/20 dark:border-[#24262f]/60">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      {showQuotes ? <Eye className="w-3.5 h-3.5 text-brand" /> : <EyeOff className="w-3.5 h-3.5 text-brand" />}
                      <span className="text-xs font-bold">Show Daily Fire Quotes Board</span>
                    </div>
                    <span className="text-[10px] text-[#49454f] dark:text-[#cac4d0]">Display the motivational quote panel on top of the dashboard</span>
                  </div>
                  <button
                    onClick={() => onToggleQuotes(!showQuotes)}
                    type="button"
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                      showQuotes ? 'bg-brand' : 'bg-neutral-300 dark:bg-neutral-805'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-sm transform duration-200 ${
                        showQuotes ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Export Panel */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#49454f] dark:text-[#cac4d0] uppercase tracking-wider">Export Backlog Data</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Course Design */}
                  <div className="bg-[#f3edf7]/50 dark:bg-[#24262f]/40 p-4 rounded-2xl border border-[#cac4d0]/20 dark:border-[#24262f]/60 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="text-xs font-bold text-brand">Course Design only</h4>
                      <p className="text-[10px] text-[#49454f] dark:text-[#cac4d0] leading-relaxed mt-1">
                        Syllabus schema, subject colors, emojis, and daily increase rates. <strong>No personal backlog counts</strong> included. Perfect for sharing!
                      </p>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={handleExportCourseDesign}
                        className="flex-1 bg-brand hover:bg-brand-container-hover hover:text-brand text-white text-[10px] font-bold py-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all border border-transparent hover:border-brand/20"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </button>
                      <button
                        onClick={() => handleCopyJson('course')}
                        className="p-2 bg-[#f3edf7] dark:bg-[#24262f] text-brand border border-[#cac4d0]/30 dark:border-[#24262f] hover:bg-[#e8def8] rounded-xl flex items-center justify-center cursor-pointer transition-colors"
                        title="Copy to Clipboard"
                      >
                        {copiedType === 'course' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Full Backup */}
                  <div className="bg-[#f3edf7]/50 dark:bg-[#24262f]/40 p-4 rounded-2xl border border-[#cac4d0]/20 dark:border-[#24262f]/60 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="text-xs font-bold text-brand">Full Snapshot Backup</h4>
                      <p className="text-[10px] text-[#49454f] dark:text-[#cac4d0] leading-relaxed mt-1">
                        Complete data snapshot including subjects, <strong>active backlog sizes</strong>, configurations, and last sync timestamps.
                      </p>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={handleExportFullBackup}
                        className="flex-1 bg-brand hover:bg-brand-container-hover hover:text-brand text-white text-[10px] font-bold py-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all border border-transparent hover:border-brand/20"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </button>
                      <button
                        onClick={() => handleCopyJson('backup')}
                        className="p-2 bg-[#f3edf7] dark:bg-[#24262f] text-brand border border-[#cac4d0]/30 dark:border-[#24262f] hover:bg-[#e8def8] rounded-xl flex items-center justify-center cursor-pointer transition-colors"
                        title="Copy to Clipboard"
                      >
                        {copiedType === 'backup' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Import Panel */}
              <div className="space-y-3 border-t border-[#cac4d0]/20 dark:border-[#24262f]/60 pt-4">
                <h3 className="text-xs font-bold text-[#49454f] dark:text-[#cac4d0] uppercase tracking-wider">Import Backlog Data</h3>
                
                {/* File Drop and Pasted JSON */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 border-2 border-dashed border-[#cac4d0]/50 dark:border-[#24262f] hover:border-brand hover:bg-[#f3edf7]/20 py-4 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <Upload className="w-5 h-5 text-brand" />
                      <span className="text-[11px] font-bold">Select JSON Backup File</span>
                      <input
                        type="file"
                        accept=".json"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </button>
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] text-[#49454f] dark:text-[#cac4d0] font-bold uppercase">Or paste JSON content string:</label>
                    <textarea
                      value={importText}
                      onChange={(e) => {
                        setImportText(e.target.value);
                        setValidationMessage(null);
                      }}
                      placeholder='{ "schemaVersion": 1, ... }'
                      className="bg-[#f3edf7]/30 dark:bg-[#111318]/50 text-xs font-mono p-3 rounded-xl border border-[#cac4d0]/40 dark:border-[#24262f] h-24 focus:outline-none focus:border-brand text-[#1d1b20] dark:text-white"
                    />
                  </div>

                  {/* Validate Trigger */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTextImportValidation}
                      className="px-4 py-2 bg-[#f3edf7] hover:bg-[#e8def8] dark:bg-[#24262f] text-brand text-xs font-bold rounded-full transition-colors cursor-pointer"
                    >
                      Verify JSON Structure
                    </button>
                    {importText && (
                      <button
                        type="button"
                        onClick={() => {
                          setImportText('');
                          setValidationMessage(null);
                        }}
                        className="text-[10px] text-red-500 font-bold hover:underline"
                      >
                        Clear Text
                      </button>
                    )}
                  </div>

                  {/* Validation Message Notification Panel */}
                  <AnimatePresence>
                    {validationMessage && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`p-3 rounded-xl border flex flex-col gap-2 ${
                          validationMessage.success
                            ? 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400'
                            : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400'
                        }`}
                      >
                        <div className="flex items-start gap-2 text-xs">
                          {validationMessage.success ? (
                            <Check className="w-4 h-4 flex-shrink-0 text-green-500 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500 mt-0.5" />
                          )}
                          <span className="font-semibold leading-normal">{validationMessage.text}</span>
                        </div>

                        {validationMessage.success && (
                          <div className="border-t border-[#cac4d0]/20 pt-2 flex flex-col space-y-1">
                            <span className="text-[10px] font-bold text-[#49454f] dark:text-[#cac4d0]">Course Name: {validationMessage.parsedData?.course_name}</span>
                            <span className="text-[10px] font-bold text-[#49454f] dark:text-[#cac4d0]">Subjects: {Object.keys(validationMessage.parsedData?.subjects || {}).join(', ')}</span>
                            {validationMessage.type === 'course_design' ? (
                              <p className="text-[9px] text-[#49454f] dark:text-[#cac4d0] leading-normal italic">
                                Note: This is a Course Design template. Loading this will open the Setup Wizard pre-filled with these subject structures.
                              </p>
                            ) : (
                              <p className="text-[9px] text-red-500 dark:text-red-400 font-bold leading-normal">
                                Warning: This is a Full Backup file. Applying this will overwrite all local logs and details immediately.
                              </p>
                            )}

                            <button
                              type="button"
                              onClick={executeImport}
                              className={`w-full py-2.5 mt-1 rounded-xl text-xs font-bold text-white transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer ${
                                validationMessage.type === 'course_design'
                                  ? 'bg-brand hover:opacity-90'
                                  : 'bg-red-600 hover:bg-red-700'
                              }`}
                            >
                              <FileJson className="w-3.5 h-3.5" />
                              {validationMessage.type === 'course_design' ? 'Load Design into Setup Wizard' : 'Apply Full Backup Overwrite'}
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="bg-[#f7f2fa] dark:bg-[#15131b] border-t border-[#cac4d0]/20 dark:border-[#24262f]/60 py-3.5 px-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-brand text-white dark:text-[#111318] hover:opacity-90 text-xs font-bold rounded-full transition-all cursor-pointer"
          >
            Dismiss Settings
          </button>
        </div>
      </motion.div>
    </div>
  );
}
