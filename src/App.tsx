/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  RefreshCw,
  Sliders,
  Calendar,
  Flame,
  Heart,
  ChevronRight,
  TrendingUp,
  Zap,
  Info,
  CalendarDays,
  Target,
  Clock,
  Moon,
  Sun,
  Minus,
  Plus,
  X,
  Settings
} from 'lucide-react';
import { AppData, Subject } from './types';
import { MOTIVATIONAL_QUOTES, DEFAULT_DATA } from './data';
import SetupWizard from './components/SetupWizard';
import KPICard from './components/KPICard';
import SubjectCard from './components/SubjectCard';
import BacklogChart from './components/BacklogChart';
import OfflineNotification from './components/OfflineNotification';
import SettingsModal from './components/SettingsModal';
import { getCalendarDaysDifference, getLocalDateString, parseLocalDate } from './utils/date';

export default function App() {
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem('backlog_tracker_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_DATA, ...parsed };
      } catch (e) {
        return DEFAULT_DATA;
      }
    }
    return DEFAULT_DATA;
  });

  const [wizardOpen, setWizardOpen] = useState(!data.setup_done);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return saved === 'true';
    }
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true; // default to dark
  });

  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [showQuotes, setShowQuotes] = useState<boolean>(() => {
    const saved = localStorage.getItem('show_quotes');
    return saved !== 'false'; // default to true
  });

  const handleToggleQuotes = (val: boolean) => {
    setShowQuotes(val);
    localStorage.setItem('show_quotes', String(val));
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  // Set custom brand themes dynamically
  useEffect(() => {
    const color = data.palette_color || '#6750a4';
    const root = document.documentElement;
    root.style.setProperty('--brand', color);
    
    if (darkMode) {
      root.style.setProperty('--brand-container', '#24262f');
      root.style.setProperty('--brand-container-hover', '#2d303a');
      root.style.setProperty('--brand-text', color);
    } else {
      root.style.setProperty('--brand-container', color + '15'); // 8% opacity
      root.style.setProperty('--brand-container-hover', color + '28'); // 15% opacity
      root.style.setProperty('--brand-text', color);
    }
  }, [data.palette_color, darkMode]);

  const [currentQuote, setCurrentQuote] = useState(MOTIVATIONAL_QUOTES[0]);

  // States for offline sync overlay
  const [offlineSyncReport, setOfflineSyncReport] = useState<{
    daysElapsed: number;
    totalAdded: number;
    lastUpdatedDate: string;
  } | null>(null);

  // Simulated Time Machine offsets
  const [simulatedDaysShift, setSimulatedDaysShift] = useState(0);

  const runDailyBacklogGrowth = useCallback(() => {
    if (!data.setup_done || !data.subjects || Object.keys(data.subjects).length === 0) return;

    const todayStr = getLocalDateString();
    const lastStr = data.last_updated;

    if (todayStr <= lastStr) return; // Already up to date

    const diffDays = getCalendarDaysDifference(lastStr, todayStr);
    if (diffDays <= 0) return;

    // Simulate day-by-day progression
    let totalAdded = 0;
    const updatedSubjects = { ...data.subjects };
    const lastDateObj = parseLocalDate(lastStr);

    for (let i = 1; i <= diffDays; i++) {
      const nextDay = new Date(lastDateObj);
      nextDay.setDate(lastDateObj.getDate() + i);
      const isSundayObj = nextDay.getDay() === 0;

      if (data.skip_sunday && isSundayObj) {
        continue; // No growth on Sunday if skip_sunday is active
      }

      // Grow each subject
      Object.keys(updatedSubjects).forEach(subName => {
        const sub = updatedSubjects[subName];
        const added = sub.daily_increase ?? 1;
        updatedSubjects[subName] = {
          ...sub,
          backlog: sub.backlog + added
        };
        totalAdded += added;
      });
    }

    // Update state and persistent storage
    const updatedData: AppData = {
      ...data,
      subjects: updatedSubjects,
      last_updated: todayStr
    };

    setData(updatedData);
    localStorage.setItem('backlog_tracker_data', JSON.stringify(updatedData));

    // Show report modal
    setOfflineSyncReport({
      daysElapsed: diffDays,
      totalAdded,
      lastUpdatedDate: lastStr
    });
  }, [data]);

  // Check and run automated daily backlog growth, including when the app stays open past midnight.
  useEffect(() => {
    runDailyBacklogGrowth();

    const intervalId = window.setInterval(runDailyBacklogGrowth, 60 * 1000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        runDailyBacklogGrowth();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [runDailyBacklogGrowth]);

  // Set fresh default quote on first boot
  useEffect(() => {
    rotateQuote();
  }, []);

  const rotateQuote = () => {
    const randomIdx = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    setCurrentQuote(MOTIVATIONAL_QUOTES[randomIdx]);
  };

  const handleSaveData = (newData: AppData) => {
    setData(newData);
    localStorage.setItem('backlog_tracker_data', JSON.stringify(newData));
    setWizardOpen(false);
  };

  // Metrics calculators
  const getSubjectsList = (): Subject[] => {
    return Object.values(data.subjects || {});
  };

  const calculateTotalBacklog = (): number => {
    return getSubjectsList().reduce((sum, s) => sum + s.backlog, 0);
  };

  const calculateTotalGrowth = (): number => {
    return getSubjectsList().reduce((sum, s) => sum + (s.daily_increase ?? 1), 0);
  };

  const calculateClearanceETA = (): {
    calendarDays: number;
    targetDateString: string | null;
  } => {
    const total = calculateTotalBacklog();
    if (total <= 0) {
      return { calendarDays: 0, targetDateString: 'Track Cleared' };
    }

    const cpd = data.classes_per_day || 4;
    const growth = calculateTotalGrowth();

    // Check weekly clearance margin
    const weeklyClearance = data.skip_sunday
      ? (cpd * 7) - (growth * 6)
      : (cpd - growth) * 7;

    if (weeklyClearance <= 0) {
      return { calendarDays: Infinity, targetDateString: null };
    }

    let currentBacklog = total;
    let calendarDays = 0;
    const startDate = new Date();

    while (currentBacklog > 0 && calendarDays < 10000) {
      calendarDays++;
      const targetDay = new Date(startDate);
      targetDay.setDate(startDate.getDate() + calendarDays);
      const isSundayObj = targetDay.getDay() === 0;

      if (data.skip_sunday && isSundayObj) {
        currentBacklog -= cpd;
      } else {
        currentBacklog -= (cpd - growth);
      }
    }

    const etaDate = new Date();
    etaDate.setDate(startDate.getDate() + calendarDays);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
    const dateFormatted = etaDate.toLocaleDateString('en-US', options);

    return { calendarDays, targetDateString: dateFormatted };
  };

  const getMaxSubjectBacklog = (): number => {
    const list = getSubjectsList();
    if (list.length === 0) return 1;
    return Math.max(...list.map(s => s.backlog), 1);
  };

  const updateSubjectBacklog = (name: string, amount: number) => {
    const updatedSubjects = { ...data.subjects };
    if (!updatedSubjects[name]) return;

    updatedSubjects[name] = {
      ...updatedSubjects[name],
      backlog: Math.max(0, updatedSubjects[name].backlog + amount)
    };

    const updatedData = { ...data, subjects: updatedSubjects };
    setData(updatedData);
    localStorage.setItem('backlog_tracker_data', JSON.stringify(updatedData));

    // Spin/cycle the quote on random clicks as a fun mental micro-nudge
    if (Math.random() < 0.25) {
      rotateQuote();
    }
  };

  const updateSubjectGrowth = (name: string, growth: number) => {
    const updatedSubjects = { ...data.subjects };
    if (!updatedSubjects[name]) return;

    updatedSubjects[name] = {
      ...updatedSubjects[name],
      daily_increase: Math.max(0, growth)
    };

    const updatedData = { ...data, subjects: updatedSubjects };
    setData(updatedData);
    localStorage.setItem('backlog_tracker_data', JSON.stringify(updatedData));
  };

  const handleGlobalCpdChange = (val: number) => {
    const updatedData = { ...data, classes_per_day: Math.max(1, val) };
    setData(updatedData);
    localStorage.setItem('backlog_tracker_data', JSON.stringify(updatedData));
  };

  // Time Travel: Simulate future projections!
  const handleTimeTravelOffset = (days: number) => {
    if (days === 0) {
      // Clear simulation offsets & restore actual state
      setSimulatedDaysShift(0);
      const saved = localStorage.getItem('backlog_tracker_data');
      if (saved) {
        setData(JSON.parse(saved));
      }
      return;
    }

    setSimulatedDaysShift(prev => prev + days);

    // Apply incremental progression offset
    const currentSubjects = { ...data.subjects };
    let totalAdded = 0;
    const initialDateObj = new Date();

    for (let d = 1; d <= days; d++) {
      const simulatedDay = new Date(initialDateObj);
      simulatedDay.setDate(initialDateObj.getDate() + d);
      const isSundayObj = simulatedDay.getDay() === 0;

      if (data.skip_sunday && isSundayObj) {
        continue;
      }

      Object.keys(currentSubjects).forEach(subName => {
        const sub = currentSubjects[subName];
        const added = sub.daily_increase ?? 1;
        currentSubjects[subName] = {
          ...sub,
          backlog: sub.backlog + added
        };
        totalAdded += added;
      });
    }

    setData(prev => ({
      ...prev,
      subjects: currentSubjects
    }));
  };

  // Status Indicator logic
  const { calendarDays, targetDateString } = calculateClearanceETA();
  const totalBacklog = calculateTotalBacklog();
  const totalGrowth = calculateTotalGrowth();

  const getThreatAnalysis = () => {
    if (totalBacklog <= 0) {
      return {
        label: 'STATUS INDEX: SECURED (No Backlog)',
        color: '#006a6a', // Teal green
        colorDark: '#86d6a5',
        bgColor: '#e0f2f1',
        darkBgColor: '#0c2d2d',
        message: 'Master syllabus is fully optimized. Your daily trajectory is safe!'
      };
    }
    if (calendarDays === Infinity) {
      return {
        label: 'ALERT: CRITICAL (Snowballing Workload)',
        color: '#ba1a1a', // Danger red M3
        colorDark: '#ffb4ab',
        bgColor: '#ffebee',
        darkBgColor: '#3c1818',
        message: 'Active growth exceeds clearance capacity. Increase daily watch size to recover!'
      };
    }
    if (calendarDays > 30) {
      return {
        label: 'STATUS INDEX: OVERLOADED (Steady Practice Required)',
        color: '#825500', // Warning ochre
        colorDark: '#ffd54f',
        bgColor: '#fff8e1',
        darkBgColor: '#3a2b10',
        message: `Clearance calendar exceeds 30 days. Stay consistent to compress the timeline.`
      };
    }
    return {
      label: 'STATUS INDEX: STABILIZED (Active Clearance)',
      color: '#6750a4', // Accent purple M3
      colorDark: '#b8a3e8',
      bgColor: '#f3edf7',
      darkBgColor: '#241a3c',
      message: `System convergence under control. On pace to secure track in ${calendarDays} days!`
    };
  };

  const threat = getThreatAnalysis();

  if (wizardOpen) {
    return (
      <SetupWizard
        initialData={data}
        onSave={handleSaveData}
        onCancel={data.setup_done ? () => {
          // Revert data from localStorage to discard unsaved setup wizard changes
          const saved = localStorage.getItem('backlog_tracker_data');
          if (saved) {
            try {
              setData(JSON.parse(saved));
            } catch (e) {}
          }
          setWizardOpen(false);
        } : undefined}
        onImportCourseDesign={(importedData) => {
          // Load the imported subjects into setup state, merging with existing ones
          const mergedSubjects = { ...data.subjects };
          Object.entries(importedData.subjects).forEach(([name, sub]) => {
            if (!mergedSubjects[name]) {
              mergedSubjects[name] = sub;
            }
          });
          setData({
            ...data,
            course_name: importedData.course_name || data.course_name,
            classes_per_day: importedData.classes_per_day || data.classes_per_day,
            skip_sunday: importedData.skip_sunday !== undefined ? importedData.skip_sunday : data.skip_sunday,
            subjects: mergedSubjects,
            palette_color: importedData.palette_color || data.palette_color,
            theme: importedData.theme || data.theme,
            setup_done: false
          });
          setWizardOpen(true);
        }}
      />
    );
  }

  // Active theme layout context
  return (
    <div className="min-h-screen bg-[#fef7ff] text-[#1d1b20] dark:bg-[#111318] dark:text-[#e6e1e5] flex flex-col font-sans selection:bg-[#cac4d0] dark:selection:bg-[#49454f] selection:text-[#1d192b] dark:selection:text-[#fef7ff]">
      {/* Offline auto-growth report dynamic popup */}
      {offlineSyncReport && (
        <OfflineNotification
          daysElapsed={offlineSyncReport.daysElapsed}
          totalBacklogAdded={offlineSyncReport.totalAdded}
          lastUpdatedDate={offlineSyncReport.lastUpdatedDate}
          onClose={() => setOfflineSyncReport(null)}
        />
      )}

      {/* Styled top navigation bar representing premium Material Design 3 appbar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#1a1c22]/90 backdrop-blur-md border-b border-[#cac4d0]/30 dark:border-[#24262f]/60 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-brand dark:bg-brand-container p-0.5 flex items-center justify-center text-white font-bold shadow-sm overflow-hidden border border-[#cac4d0]/10 dark:border-amber-400/20">
              <img
                src="/app_logo.png"
                alt="App Logo"
                className="w-full h-full object-cover rounded-full"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="text-[10px] text-brand font-bold uppercase tracking-widest leading-none font-mono block">
                Backlog Tracker
              </span>
              <h1 className="text-sm font-bold text-[#1d1b20] dark:text-white tracking-tight truncate max-w-[180px] sm:max-w-[320px]">
                {data.course_name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Manual Dark Mode Selector */}
            <button
              onClick={() => setDarkMode(prev => !prev)}
              type="button"
              className="p-2 rounded-full bg-brand-container hover:bg-brand-container-hover text-brand border border-[#cac4d0]/20 dark:border-brand-container transition-all focus:outline-none flex items-center justify-center"
              style={{ minHeight: '36px', minWidth: '36px' }}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Direct Configuration Wizard */}
            <button
              onClick={() => setWizardOpen(true)}
              type="button"
              className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-brand-container hover:bg-brand-container-hover text-xs font-bold flex items-center gap-1 text-brand border border-[#cac4d0]/25 dark:border-brand-container transition-all focus:outline-none"
              style={{ minHeight: '36px' }}
              title="Open Setup Config Wizard"
            >
              <Sliders className="w-4 h-4 text-brand" />
              <span className="hidden sm:inline">Configure</span>
            </button>

            {/* Application Settings Dialog */}
            <button
              onClick={() => setSettingsModalOpen(true)}
              type="button"
              className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-brand-container hover:bg-brand-container-hover text-xs font-bold flex items-center gap-1 text-brand border border-[#cac4d0]/25 dark:border-brand-container transition-all focus:outline-none"
              style={{ minHeight: '36px' }}
              title="Open Settings and Share/Backup Dashboard"
            >
              <Settings className="w-4 h-4 text-brand" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container body bounds */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 space-y-6">
        
        {/* Quote space widget with micro interactions */}
        {showQuotes && (
          <section className="bg-white dark:bg-[#1a1c22] border border-[#cac4d0]/30 dark:border-[#24262f]/60 rounded-[24px] p-4 relative overflow-hidden shadow-sm" id="quote-board">
            <div className="absolute right-3 top-3">
              <button
                onClick={rotateQuote}
                type="button"
                className="p-1 px-2.5 rounded-full bg-brand-container hover:bg-brand-container-hover text-[10px] text-brand border border-[#cac4d0]/20 dark:border-brand-container transition-all font-bold"
                style={{ minHeight: '28px' }}
                title="Next Motivational Insight"
              >
                Next Quote
              </button>
            </div>
            <div className="pr-16">
              <span className="text-[10px] text-brand uppercase tracking-wider font-extrabold block mb-1">
                Daily Fire Nudge 🔥
              </span>
            <p className="text-xs sm:text-sm text-[#1d1b20] dark:text-white italic font-semibold leading-relaxed">
              "{currentQuote}"
            </p>
          </div>
        </section>
      )}

        {/* Dynamic Key Performance Indicator Blocks */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <KPICard
            title="TOTAL BACKLOG"
            value={`${totalBacklog}`}
            subtitle="Lectures Outstanding"
            icon={<Clock className="w-4 h-4 text-[#ba1a1a]" />}
            accentColor="#ba1a1a"
          />
          <KPICard
            title="Syllabus Growth"
            value={`+${totalGrowth}/day`}
            subtitle={data.skip_sunday ? 'No growth Sundays' : '7 days active growth'}
            icon={<TrendingUp className="w-4 h-4 text-brand" />}
            accentColor="var(--brand)"
          />
          <KPICard
            title="CLEARANCE ETA"
            value={calendarDays === Infinity ? 'Never' : `${calendarDays} Days`}
            subtitle={calendarDays === Infinity ? 'Critical Load error' : 'Estimated catchup timeline'}
            icon={<Target className="w-4 h-4 text-[#006a6a]" />}
            accentColor={calendarDays === Infinity ? '#ba1a1a' : '#006a6a'}
          />
        </section>

        {/* Adaptive Threat Status Banner */}
        <section
          style={{
            borderColor: (darkMode ? threat.colorDark : threat.color) + '40',
            backgroundColor: darkMode ? threat.darkBgColor : threat.bgColor
          }}
          className="border rounded-[24px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[#1d1b20] dark:text-white shadow-sm transition-all"
        >
          <div className="flex items-start gap-3">
            <div
              className="p-2 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: darkMode ? threat.colorDark : threat.color }}
            >
              <Flame className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-mono font-black tracking-wider uppercase block" style={{ color: darkMode ? threat.colorDark : threat.color }}>
                {threat.label}
              </span>
              <p className="text-[11px] text-[#49454f] dark:text-[#cac4d0] mt-0.5 leading-relaxed font-bold">
                {threat.message}
              </p>
            </div>
          </div>
          <div className="text-[10px] text-[#49454f] dark:text-brand sm:text-right font-semibold flex-shrink-0">
            <span>Last Sync: </span>
            <span className="font-mono text-[#1d1b20] dark:text-amber-400 font-bold">{data.last_updated}</span>
          </div>
        </section>

        {/* Global Study Capacity Parameters Controls */}
        <section className="bg-white dark:bg-[#1a1c22] border border-[#cac4d0]/30 dark:border-[#24262f]/60 rounded-[24px] p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="p-2 bg-brand-container rounded-xl text-brand">
              <Target className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-[#1d1b20] dark:text-white uppercase tracking-wider leading-none">
                Global Clearance Budget (CPD)
              </h4>
              <p className="text-[10px] text-[#49454f] dark:text-[#c4c6d0] mt-0.5 font-bold leading-none">
                Number of lectures you resolve to complete daily
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={() => handleGlobalCpdChange(data.classes_per_day - 1)}
              type="button"
              className="w-10 h-10 rounded-full bg-brand-container hover:bg-brand-container-hover text-brand border border-transparent dark:border-brand-container/60 font-bold flex items-center justify-center transition-all"
              style={{ minWidth: '40px', minHeight: '40px' }}
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              min="1"
              value={data.classes_per_day}
              onChange={e => handleGlobalCpdChange(parseInt(e.target.value) || 1)}
              className="bg-brand-container text-center font-mono font-bold text-lg w-16 py-1.5 rounded-xl text-brand border border-[#cac4d0]/30 dark:border-brand-container focus:outline-none"
            />
            <button
              onClick={() => handleGlobalCpdChange(data.classes_per_day + 1)}
              type="button"
              className="w-10 h-10 rounded-full bg-brand-container hover:bg-brand-container-hover text-brand border border-transparent dark:border-brand-container/60 font-bold flex items-center justify-center transition-all"
              style={{ minWidth: '40px', minHeight: '40px' }}
            >
              <Plus className="w-4 h-4" />
            </button>
            <span className="text-xs text-[#49454f] dark:text-[#cac4d0] font-bold font-mono pl-1">classes/day</span>
          </div>
        </section>

        {/* Custom Weight Progress Chart Visualizer */}
        <section>
          <BacklogChart subjects={data.subjects} />
        </section>

        {/* Active Modules Track Card Grid */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-extrabold text-brand uppercase tracking-widest flex items-center gap-1">
              <Calendar className="w-4 h-4 text-brand" />
              ACTIVE SUBJECT MODULES
            </h3>
            <span className="text-[10px] text-[#49454f] dark:text-[#cac4d0] font-bold italic">
              Touch / click keys to log activity
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getSubjectsList().map(sub => (
              <SubjectCard
                key={sub.name}
                subject={sub}
                maxBacklog={getMaxSubjectBacklog()}
                onModifyBacklog={amt => updateSubjectBacklog(sub.name, amt)}
                onUpdateDailyIncrease={val => updateSubjectGrowth(sub.name, val)}
              />
            ))}
          </div>
        </section>

        {/* Time Travel Gamification controls */}
        <section className="bg-white dark:bg-[#1a1c22] border border-[#cac4d0]/30 dark:border-[#24262f]/60 rounded-[24px] p-4 space-y-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand" />
            <h4 className="text-xs font-bold text-[#1d1b20] dark:text-white uppercase tracking-wider">
              🚀 Accumulation Predictor
            </h4>
          </div>
          <p className="text-[10px] text-[#49454f] dark:text-[#c4c6d0] leading-relaxed font-medium">
            Simulate your course release timeline. Fast forward elapsed time to inspect the terrifying compound effects of neglecting core daily watches. Ensure you don't actually lose your active states!
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => handleTimeTravelOffset(1)}
              type="button"
              className="bg-brand-container hover:bg-brand-container-hover text-[11px] font-bold py-2 px-3.5 rounded-full border border-[#cac4d0]/20 dark:border-brand-container transition-all text-brand"
              style={{ minHeight: '36px' }}
            >
              +1 Day Release Growth
            </button>
            <button
              onClick={() => handleTimeTravelOffset(7)}
              type="button"
              className="bg-brand-container hover:bg-brand-container-hover text-[11px] font-bold py-2 px-3.5 rounded-full border border-[#cac4d0]/20 dark:border-brand-container transition-all text-brand"
              style={{ minHeight: '36px' }}
            >
              +1 Week Cumulative
            </button>
            <button
              onClick={() => handleTimeTravelOffset(30)}
              type="button"
              className="bg-brand-container hover:bg-brand-container-hover text-[11px] font-bold py-2 px-3.5 rounded-full border border-[#cac4d0]/20 dark:border-brand-container transition-all text-brand"
              style={{ minHeight: '36px' }}
            >
              +30 Days Snowball
            </button>

            {simulatedDaysShift > 0 && (
              <button
                onClick={() => handleTimeTravelOffset(0)}
                type="button"
                className="bg-red-500/10 border border-red-500/30 text-xs text-red-700 dark:text-red-400 font-bold py-2 px-3.5 rounded-full hover:bg-red-500/20 transition-all flex items-center gap-1"
                style={{ minHeight: '36px' }}
              >
                Reset Time Machine ({simulatedDaysShift}d offset)
              </button>
            )}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-[#f7f2fa] dark:bg-[#15131b] border-t border-[#cac4d0]/30 dark:border-[#24262f]/60 py-6 px-4 mt-12 text-center text-xs">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-left font-sans">
            <p className="text-brand font-bold text-sm tracking-tight mb-0.5 animate-pulse">
              ⚡ Backlog Tracker
            </p>
            {targetDateString && calendarDays !== Infinity && (
              <span className="text-[11px] text-[#006a6a] dark:text-[#86d6a5] font-bold block">
                ⭐ Convergence target caught up on: {targetDateString}
              </span>
            )}
          </div>          
        </div>
      </footer>

      {/* Settings Modal */}
      {settingsModalOpen && (
        <SettingsModal
          isOpen={settingsModalOpen}
          onClose={() => setSettingsModalOpen(false)}
          data={data}
          showQuotes={showQuotes}
          onToggleQuotes={handleToggleQuotes}
          onUpdateData={handleSaveData}
          onImportFullBackup={handleSaveData}
          onImportCourseDesign={(importedData) => {
            // Load the imported subjects into setup state, merging with existing ones
            const mergedSubjects = { ...data.subjects };
            Object.entries(importedData.subjects).forEach(([name, sub]) => {
              if (!mergedSubjects[name]) {
                mergedSubjects[name] = sub;
              }
            });
            setData({
              ...data,
              course_name: importedData.course_name || data.course_name,
              classes_per_day: importedData.classes_per_day || data.classes_per_day,
              skip_sunday: importedData.skip_sunday !== undefined ? importedData.skip_sunday : data.skip_sunday,
              subjects: mergedSubjects,
              palette_color: importedData.palette_color || data.palette_color,
              theme: importedData.theme || data.theme,
              setup_done: false
            });
            setWizardOpen(true);
            setSettingsModalOpen(false);
          }}
          darkMode={darkMode}
          onToggleDarkMode={setDarkMode}
        />
      )}
    </div>
  );
}
