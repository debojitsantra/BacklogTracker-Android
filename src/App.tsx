/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  CalendarCheck,
  Flame,
  TrendingUp,
  Target,
  Clock,
  Minus,
  Plus,
  Settings,
  SlidersHorizontal
} from 'lucide-react';
import { AppData, Subject } from './types';
import { MOTIVATIONAL_QUOTES, DEFAULT_DATA } from './data';
import SetupWizard from './components/SetupWizard';
import KPICard from './components/KPICard';
import SubjectCard from './components/SubjectCard';
import BacklogChart from './components/BacklogChart';
import OfflineNotification from './components/OfflineNotification';
import SettingsModal from './components/SettingsModal';
import HelpModal from './components/HelpModal';
import { getCalendarDaysDifference, getLocalDateString, parseLocalDate } from './utils/date';

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const WEEK_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABELS: Record<string, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun'
};

function getGrowthMode(subject: Subject): 'none' | 'perday' | 'repeat' {
  const growth = subject.daily_increase ?? 0;
  return subject.growth_mode || (subject.repeat_days?.length ? 'repeat' : growth > 0 ? 'perday' : 'none');
}

function getGrowthForDate(subject: Subject, date: Date): number {
  const growth = subject.daily_increase ?? 0;
  if (growth <= 0) return 0;
  const mode = getGrowthMode(subject);
  if (mode === 'none') return 0;
  if (mode === 'perday') return growth;
  if (!subject.repeat_days?.length) return 0;
  return subject.repeat_days.includes(DAY_KEYS[date.getDay()]) ? growth : 0;
}

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
      perday_type: keepPerDay ? subject.perday_type : undefined,
      schedule_conflict: false
    };
  });
  return { ...importedData, subjects };
}

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
    return true;
  });

  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState<boolean>(() => {
    return localStorage.getItem('backlog_tracker_help_seen') !== 'true';
  });
  const [showQuotes, setShowQuotes] = useState<boolean>(() => {
    const saved = localStorage.getItem('show_quotes');
    return saved !== 'false';
  });

  const handleToggleQuotes = (val: boolean) => {
    setShowQuotes(val);
    localStorage.setItem('show_quotes', String(val));
  };

  const closeHelpModal = () => {
    localStorage.setItem('backlog_tracker_help_seen', 'true');
    setHelpModalOpen(false);
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

  useEffect(() => {
    const color = data.palette_color || '#6750a4';
    const root = document.documentElement;
    root.style.setProperty('--brand', color);

    if (darkMode) {
      root.style.setProperty('--brand-container', '#24262f');
      root.style.setProperty('--brand-container-hover', '#2d303a');
      root.style.setProperty('--brand-text', color);
    } else {
      root.style.setProperty('--brand-container', color + '15');
      root.style.setProperty('--brand-container-hover', color + '28');
      root.style.setProperty('--brand-text', color);
    }
  }, [data.palette_color, darkMode]);

  const [currentQuote, setCurrentQuote] = useState(MOTIVATIONAL_QUOTES[0]);
  const autoGrowthEnabled = data.auto_growth_enabled !== false;

  const [offlineSyncReport, setOfflineSyncReport] = useState<{
    daysElapsed: number;
    totalAdded: number;
    lastUpdatedDate: string;
  } | null>(null);

  const [simulatedDaysShift, setSimulatedDaysShift] = useState(0);

  const runDailyBacklogGrowth = useCallback(() => {
    if (!data.setup_done || !data.subjects || Object.keys(data.subjects).length === 0) return;

    const todayStr = getLocalDateString();
    const lastStr = data.last_updated;

    if (todayStr <= lastStr) return;

    if (!autoGrowthEnabled) {
      const updatedData: AppData = {
        ...data,
        last_updated: todayStr
      };
      setData(updatedData);
      localStorage.setItem('backlog_tracker_data', JSON.stringify(updatedData));
      return;
    }

    const diffDays = getCalendarDaysDifference(lastStr, todayStr);
    if (diffDays <= 0) return;

    let totalAdded = 0;
    const updatedSubjects = { ...data.subjects };
    const lastDateObj = parseLocalDate(lastStr);

    for (let i = 1; i <= diffDays; i++) {
      const nextDay = new Date(lastDateObj);
      nextDay.setDate(lastDateObj.getDate() + i);
      const isSundayObj = nextDay.getDay() === 0;

      Object.keys(updatedSubjects).forEach(subName => {
        const sub = updatedSubjects[subName];
        if (sub.completion_mode === 'todo') return;
        if (data.skip_sunday && isSundayObj && !sub.repeat_days?.length) return;
        const added = getGrowthForDate(sub, nextDay);
        if (added <= 0) return;
        updatedSubjects[subName] = {
          ...sub,
          backlog: sub.backlog + added
        };
        totalAdded += added;
      });
    }

    const updatedData: AppData = {
      ...data,
      subjects: updatedSubjects,
      last_updated: todayStr
    };

    setData(updatedData);
    localStorage.setItem('backlog_tracker_data', JSON.stringify(updatedData));

    setOfflineSyncReport({
      daysElapsed: diffDays,
      totalAdded,
      lastUpdatedDate: lastStr
    });
  }, [data, autoGrowthEnabled]);

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

  const getSubjectsList = (): Subject[] => {
    return Object.values(data.subjects || {});
  };

  const calculateTotalBacklog = (): number => {
    return getSubjectsList().reduce((sum, s) => sum + s.backlog, 0);
  };

  const hasAnySchedule = (): boolean => {
    return getSubjectsList().some(s => {
      if (s.completion_mode === 'todo') return false;
      const mode = s.growth_mode || (s.repeat_days?.length ? 'repeat' : s.daily_increase && s.daily_increase > 0 ? 'perday' : 'none');
      return (mode === 'perday' || mode === 'repeat') && (s.daily_increase ?? 0) > 0;
    });
  };

  const isAllTodoMode = (): boolean => {
    const list = getSubjectsList();
    return list.length > 0 && list.every(s => s.completion_mode === 'todo');
  };

  const countPendingTodos = (): number => {
    return getSubjectsList().filter(s => s.completion_mode === 'todo' && s.backlog > 0).length;
  };

  const calculateTotalGrowth = (): number => {
    if (!autoGrowthEnabled) return 0;
    return getSubjectsList().reduce((sum, s) => sum + (s.daily_increase ?? 0), 0);
  };

  const calculateGrowthForDate = (date: Date): number => {
    if (!autoGrowthEnabled) return 0;
    const isSundayObj = date.getDay() === 0;
    return getSubjectsList().reduce((sum, sub) => {
      if (sub.completion_mode === 'todo') return sum;
      if (data.skip_sunday && isSundayObj && !sub.repeat_days?.length) return sum;
      return sum + getGrowthForDate(sub, date);
    }, 0);
  };

  const getGrowthKpi = (): {
    title: string;
    value: string;
    subtitle: string;
  } => {
    const activeRules = getSubjectsList().filter(
      sub => sub.completion_mode !== 'todo' && getGrowthMode(sub) !== 'none' && (sub.daily_increase ?? 0) > 0
    );
    if (activeRules.length === 0) {
      return {
        title: 'Daily Growth',
        value: '+0',
        subtitle: 'Manual updates only'
      };
    }

    const perDayRules = activeRules.filter(sub => getGrowthMode(sub) === 'perday');
    const repeatRules = activeRules.filter(sub => getGrowthMode(sub) === 'repeat');
    const hasPerDay = perDayRules.length > 0;
    const hasRepeat = repeatRules.length > 0;


    const activeDaysPerWeek = data.skip_sunday ? 6 : 7;
    const perDayWeekly = perDayRules.reduce((sum, sub) => sum + (sub.daily_increase ?? 0) * activeDaysPerWeek, 0);
    const repeatWeekly = repeatRules.reduce((sum, sub) => {
      const selectedCount = (sub.repeat_days || []).length;
      return sum + (sub.daily_increase ?? 1) * selectedCount;
    }, 0);
    const weeklyGrowth = perDayWeekly + repeatWeekly;

    const repeatDays = Array.from(new Set(repeatRules.flatMap(sub => sub.repeat_days || [])))
      .sort((a, b) => WEEK_DAYS.indexOf(a) - WEEK_DAYS.indexOf(b));
    const repeatDaysLabel = repeatDays.map(day => DAY_LABELS[day] || day).join(', ');

    if (hasPerDay && !hasRepeat) {
      const dailyGrowth = perDayRules.reduce((sum, sub) => sum + (sub.daily_increase ?? 0), 0);
      return {
        title: 'Daily Growth',
        value: `+${dailyGrowth}/day`,
        subtitle: data.skip_sunday ? 'Daily rules skip Sunday' : 'Every day'
      };
    }

    if (!hasPerDay && hasRepeat) {
      return {
        title: `Repeat only — ${repeatDaysLabel || 'selected days'}`,
        value: `+${repeatWeekly}/week`,
        subtitle: 'Grows only on selected days'
      };
    }

    return {
      title: 'Weekly Growth',
      value: `+${weeklyGrowth}/week`,
      subtitle: `Daily (+${perDayWeekly}/wk) + Repeat (+${repeatWeekly}/wk on ${repeatDaysLabel || 'sel. days'})`
    };
  };

  const calculateClearanceETA = (): {
    calendarDays: number;
    targetDateString: string | null;
  } => {
    const subjects = getSubjectsList();
    const pendingTodos = subjects.filter(s => s.completion_mode === 'todo' && s.backlog > 0).length;
    const backlogTotal = subjects
      .filter(s => s.completion_mode !== 'todo')
      .reduce((sum, s) => sum + s.backlog, 0);

    if (pendingTodos + backlogTotal <= 0) {
      return { calendarDays: 0, targetDateString: 'Track Cleared' };
    }

    const cpd = data.classes_per_day || 4;
    let currentTodos = pendingTodos;
    let currentBacklog = backlogTotal;
    let calendarDays = 0;
    const startDate = new Date();

    while ((currentTodos > 0 || currentBacklog > 0) && calendarDays < 10000) {
      calendarDays++;
      const targetDay = new Date(startDate);
      targetDay.setDate(startDate.getDate() + calendarDays);
      currentBacklog += calculateGrowthForDate(targetDay);
      currentBacklog = Math.max(0, currentBacklog - cpd);
      currentTodos = Math.max(0, currentTodos - 1);
    }

    if (currentTodos > 0 || currentBacklog > 0) {
      return { calendarDays: Infinity, targetDateString: null };
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

    const currentBacklog = Number(updatedSubjects[name].backlog) || 0;
    const isTodo = updatedSubjects[name].completion_mode === 'todo';
    const newBacklog = Math.max(0, currentBacklog + amount);
    updatedSubjects[name] = {
      ...updatedSubjects[name],
      backlog: isTodo ? Math.min(1, newBacklog) : newBacklog
    };

    const updatedData = { ...data, subjects: updatedSubjects };
    setData(updatedData);
    localStorage.setItem('backlog_tracker_data', JSON.stringify(updatedData));

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

  const handleTimeTravelOffset = (days: number) => {
    if (days === 0) {
      setSimulatedDaysShift(0);
      const saved = localStorage.getItem('backlog_tracker_data');
      if (saved) {
        setData(JSON.parse(saved));
      }
      return;
    }

    setSimulatedDaysShift(prev => prev + days);

    const currentSubjects = { ...data.subjects };
    let totalAdded = 0;
    const initialDateObj = new Date();

    for (let d = 1; d <= days; d++) {
      const simulatedDay = new Date(initialDateObj);
      simulatedDay.setDate(initialDateObj.getDate() + d);
      const isSundayObj = simulatedDay.getDay() === 0;

      Object.keys(currentSubjects).forEach(subName => {
        const sub = currentSubjects[subName];
        if (sub.completion_mode === 'todo') return;
        if (data.skip_sunday && isSundayObj && !sub.repeat_days?.length) return;
        const added = getGrowthForDate(sub, simulatedDay);
        if (added <= 0) return;
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

  const anySchedule = hasAnySchedule();
  const allTodo = isAllTodoMode();
  const pendingTodoCount = countPendingTodos();

  const { calendarDays, targetDateString } = calculateClearanceETA();
  const totalBacklog = calculateTotalBacklog();
  const growthKpi = getGrowthKpi();

  const getThreatAnalysis = () => {
    if (totalBacklog <= 0) {
      return {
        label: 'STATUS INDEX: No Backlog',
        color: '#006a6a', 
        colorDark: '#86d6a5',
        bgColor: '#e0f2f1',
        darkBgColor: '#0c2d2d',
        message: 'Everything tracked here is clear. Your current queue is under control.'
      };
    }
    if (calendarDays === Infinity && autoGrowthEnabled) {
      return {
        label: 'ALERT: Snowballing Workload',
        color: '#ba1a1a', 
        colorDark: '#ffb4ab',
        bgColor: '#ffebee',
        darkBgColor: '#3c1818',
        message: 'Automatic growth exceeds your daily completion target. Consider adjusting your daily completion target.'
      };
    }
    if (calendarDays > 30) {
      return {
        label: 'STATUS INDEX: Steady Practice Required',
        color: '#825500', 
        colorDark: '#ffd54f',
        bgColor: '#fff8e1',
        darkBgColor: '#3a2b10',
        message: `Clearance calendar exceeds 30 days. Keep completing entries to compress the timeline.`
      };
    }
    return {
      label: 'STATUS INDEX: Keep Going — On Track',
      color: '#6750a4', 
      colorDark: '#b8a3e8',
      bgColor: '#f3edf7',
      darkBgColor: '#241a3c',
      message: `On pace to clear the tracked backlog in ${calendarDays} days.`
    };
  };

  const threat = getThreatAnalysis();

  if (wizardOpen) {
    return (
      <>
        <HelpModal isOpen={helpModalOpen} onClose={closeHelpModal} />
        <SetupWizard
          initialData={data}
          onSave={handleSaveData}
          onCancel={data.setup_done ? () => {
            const saved = localStorage.getItem('backlog_tracker_data');
            if (saved) {
              try {
                setData({ ...DEFAULT_DATA, ...JSON.parse(saved) });
              } catch (e) { }
            }
            setWizardOpen(false);
          } : undefined}
          onImportCourseDesign={(importedData) => {
            const resolvedImport = resolveScheduleConflicts(importedData);
            const mergedSubjects = { ...data.subjects };
            Object.entries(resolvedImport.subjects).forEach(([name, sub]) => {
              if (!mergedSubjects[name]) {
                mergedSubjects[name] = sub;
              }
            });
            setData({
              ...data,
              course_name: resolvedImport.course_name || data.course_name,
              classes_per_day: resolvedImport.classes_per_day || data.classes_per_day,
              skip_sunday: resolvedImport.skip_sunday !== undefined ? resolvedImport.skip_sunday : data.skip_sunday,
              subjects: mergedSubjects,
              palette_color: resolvedImport.palette_color || data.palette_color,
              theme: resolvedImport.theme || data.theme,
              auto_growth_enabled: resolvedImport.auto_growth_enabled ?? data.auto_growth_enabled,
              setup_done: false
            });
            setWizardOpen(true);
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#fef7ff] text-[#1d1b20] dark:bg-[#111318] dark:text-[#e6e1e5] flex flex-col font-sans selection:bg-[#cac4d0] dark:selection:bg-[#49454f] selection:text-[#1d192b] dark:selection:text-[#fef7ff]">
      <HelpModal isOpen={helpModalOpen} onClose={closeHelpModal} />

      {offlineSyncReport && (
        <OfflineNotification
          daysElapsed={offlineSyncReport.daysElapsed}
          totalBacklogAdded={offlineSyncReport.totalAdded}
          lastUpdatedDate={offlineSyncReport.lastUpdatedDate}
          onClose={() => setOfflineSyncReport(null)}
        />
      )}

      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#1a1c22]/90 backdrop-blur-md border-b border-[#cac4d0]/30 dark:border-[#24262f]/60 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-base font-bold text-[#1d1b20] dark:text-white tracking-tight truncate max-w-[220px] sm:max-w-[420px]">
              {data.course_name}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setWizardOpen(true)}
              type="button"
              className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-brand text-white dark:text-[#111318] text-xs font-bold flex items-center gap-1 hover:opacity-90 transition-all focus:outline-none shadow-sm"
              style={{ minHeight: '36px' }}
              title="Open Configuration / Setup"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Configure</span>
            </button>
            <button
              onClick={() => setSettingsModalOpen(true)}
              type="button"
              className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-brand-container hover:bg-brand-container-hover text-xs font-bold flex items-center gap-1 text-brand border border-[#cac4d0]/25 dark:border-brand-container transition-all focus:outline-none"
              style={{ minHeight: '36px' }}
              title="Open Settings and Backup Dashboard"
            >
              <Settings className="w-4 h-4 text-brand" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 space-y-6">

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
                Daily Nudge
              </span>
              <p className="text-xs sm:text-sm text-[#1d1b20] dark:text-white italic font-semibold leading-relaxed">
                "{currentQuote}"
              </p>
            </div>
          </section>
        )}

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPICard
            title={allTodo ? 'TASKS PENDING' : 'TOTAL BACKLOG'}
            value={allTodo ? `${pendingTodoCount}` : `${totalBacklog}`}
            subtitle={allTodo ? 'Incomplete tasks' : 'Pending items'}
            icon={<Clock className="w-4 h-4 text-[#ba1a1a]" />}
            accentColor="#ba1a1a"
          />
          {anySchedule && autoGrowthEnabled && (
            <KPICard
              title={growthKpi.title}
              value={growthKpi.value}
              subtitle={growthKpi.subtitle}
              icon={<TrendingUp className="w-4 h-4 text-brand" />}
              accentColor="var(--brand)"
            />
          )}
          <KPICard
            title="CLEARANCE TIME"
            value={calendarDays === Infinity ? 'Never' : `${calendarDays} Days`}
            subtitle={calendarDays === Infinity ? 'Critical Load error' : 'Estimated catchup timeline'}
            icon={<Target className="w-4 h-4 text-[#006a6a]" />}
            accentColor={calendarDays === Infinity ? '#ba1a1a' : '#006a6a'}
          />
          {totalBacklog > 0 && (
            <KPICard
              title="BACKLOG FINISH DATE"
              value={
                calendarDays === Infinity
                  ? 'Never'
                  : targetDateString
                    ? targetDateString.split(',').slice(1).join(',').trim()
                    : '—'
              }
              subtitle={
                calendarDays === Infinity
                  ? 'Growth exceeds budget'
                  : targetDateString
                    ? `In ${calendarDays} day${calendarDays === 1 ? '' : 's'}`
                    : 'Track already clear'
              }
              icon={<CalendarCheck className="w-4 h-4 text-[#6750a4]" />}
              accentColor="#6750a4"
            />
          )}
        </section>

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

        {!allTodo && (
          <section className="bg-white dark:bg-[#1a1c22] border border-[#cac4d0]/30 dark:border-[#24262f]/60 rounded-[24px] p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="p-2 bg-brand-container rounded-xl text-brand">
                <Target className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-[#1d1b20] dark:text-white uppercase tracking-wider leading-none">
                  Daily Completion Target
                </h4>
                <p className="text-[10px] text-[#49454f] dark:text-[#c4c6d0] mt-0.5 font-bold leading-none">
                  Number of backlog units you plan to finish daily
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
              <span className="text-xs text-[#49454f] dark:text-[#cac4d0] font-bold font-mono pl-1">items/day</span>
            </div>
          </section>
        )}


        <section>
          <BacklogChart subjects={data.subjects} />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-extrabold text-brand uppercase tracking-widest flex items-center gap-1">
              <Calendar className="w-4 h-4 text-brand" />
              ACTIVE BACKLOG ENTRIES
            </h3>
            <span className="text-[10px] text-[#49454f] dark:text-[#cac4d0] font-bold italic">
              Tap buttons to add or complete units
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getSubjectsList().map(sub => (
              <SubjectCard
                key={sub.name}
                subject={sub}
                autoGrowthEnabled={autoGrowthEnabled}
                maxBacklog={getMaxSubjectBacklog()}
                onModifyBacklog={amt => updateSubjectBacklog(sub.name, amt)}
                onUpdateDailyIncrease={val => updateSubjectGrowth(sub.name, val)}
              />
            ))}
          </div>
        </section>

        {anySchedule && autoGrowthEnabled && (
          <section className="bg-white dark:bg-[#1a1c22] border border-[#cac4d0]/30 dark:border-[#24262f]/60 rounded-[24px] p-4 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand" />
              <h4 className="text-xs font-bold text-[#1d1b20] dark:text-white uppercase tracking-wider">
                Accumulation Predictor
              </h4>
            </div>
            <p className="text-[10px] text-[#49454f] dark:text-[#c4c6d0] leading-relaxed font-medium">
              Fast forward elapsed time to inspect how automatic growth rules affect your queue. This simulation does not save until you make real changes.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => handleTimeTravelOffset(1)}
                type="button"
                className="bg-brand-container hover:bg-brand-container-hover text-[11px] font-bold py-2 px-3.5 rounded-full border border-[#cac4d0]/20 dark:border-brand-container transition-all text-brand"
                style={{ minHeight: '36px' }}
              >
                +1 Day Growth
              </button>
              <button
                onClick={() => handleTimeTravelOffset(7)}
                type="button"
                className="bg-brand-container hover:bg-brand-container-hover text-[11px] font-bold py-2 px-3.5 rounded-full border border-[#cac4d0]/20 dark:border-brand-container transition-all text-brand"
                style={{ minHeight: '36px' }}
              >
                +1 Week Growth
              </button>
              <button
                onClick={() => handleTimeTravelOffset(30)}
                type="button"
                className="bg-brand-container hover:bg-brand-container-hover text-[11px] font-bold py-2 px-3.5 rounded-full border border-[#cac4d0]/20 dark:border-brand-container transition-all text-brand"
                style={{ minHeight: '36px' }}
              >
                +30 Days Growth
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
        )}

      </main>

      <footer className="bg-[#f7f2fa] dark:bg-[#15131b] border-t border-[#cac4d0]/30 dark:border-[#24262f]/60 py-6 px-4 mt-12 text-center text-xs">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-left font-sans">
            <p className="text-brand font-bold text-sm tracking-tight mb-0.5 animate-pulse">
              ⚡ Backlog Tracker
            </p>
          </div>
        </div>
      </footer>

      {settingsModalOpen && (
        <SettingsModal
          isOpen={settingsModalOpen}
          onClose={() => setSettingsModalOpen(false)}
          data={data}
          showQuotes={showQuotes}
          onToggleQuotes={handleToggleQuotes}
          onUpdateData={handleSaveData}
          onImportFullBackup={(importedData) => handleSaveData(resolveScheduleConflicts(importedData))}
          onImportCourseDesign={(importedData) => {
            const resolvedImport = resolveScheduleConflicts(importedData);
            const mergedSubjects = { ...data.subjects };
            Object.entries(resolvedImport.subjects).forEach(([name, sub]) => {
              if (!mergedSubjects[name]) {
                mergedSubjects[name] = sub;
              }
            });
            setData({
              ...data,
              course_name: resolvedImport.course_name || data.course_name,
              classes_per_day: resolvedImport.classes_per_day || data.classes_per_day,
              skip_sunday: resolvedImport.skip_sunday !== undefined ? resolvedImport.skip_sunday : data.skip_sunday,
              subjects: mergedSubjects,
              palette_color: resolvedImport.palette_color || data.palette_color,
              theme: resolvedImport.theme || data.theme,
              auto_growth_enabled: resolvedImport.auto_growth_enabled ?? data.auto_growth_enabled,
              setup_done: false
            });
            setWizardOpen(true);
            setSettingsModalOpen(false);
          }}
          darkMode={darkMode}
          onToggleDarkMode={setDarkMode}
          onOpenConfiguration={() => {
            setSettingsModalOpen(false);
            setWizardOpen(true);
          }}
          onOpenHelp={() => setHelpModalOpen(true)}
        />
      )}
    </div>
  );
}
