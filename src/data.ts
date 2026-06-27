/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getLocalDateString } from './utils/date';

export const MOTIVATIONAL_QUOTES = [
  "Anxiety guesses. Mathematics calculates. You can clear this!",
  "12 days of absolute hustle beats 2 months of constant dread.",
  "Don't just reset the clock by changing batches. Fix the daily habit today.",
  "The longer you wait, the worse it snowballs. Neutralize the threat now!",
  "Every finished item is a step toward a calmer queue.",
  "Focus on one item at a time. Consistency defeats exponential growth.",
  "Practice from books when the backlog is clear. Clear the foundation first.",
  "Future you is watching your decisions today.",
  "A backlog ignored today becomes panic tomorrow.",
  "One completed task daily changes your entire trajectory.",
  "Discipline feels hard until regret feels harder.",
  "Slow progress still destroys zero progress.",
  "You don't need motivation every day. You need systems.",
  "Momentum is built one boring session at a time.",
  "Your competition is studying while you're negotiating with yourself.",
  "Clear today's work before tomorrow arrives.",
  "The fear disappears when the work starts.",
  "Small wins create dangerous confidence.",
  "A single focused hour beats five distracted hours.",
  "Backlog is temporary. Skills are permanent.",
  "The best stress relief is finishing pending work.",
  "One chapter completed is better than ten chapters planned.",
  "You are always one productive week away from confidence.",
  "Your future rank is hidden inside today's consistency.",
  "The comeback starts with opening the first pending item.",
  "Nobody clears backlog accidentally.",
  "The hardest item is usually the one you keep avoiding.",
  "Done imperfectly beats postponed perfectly.",
  "You are not behind forever unless you stop moving.",
  "Motivation starts after action, not before it.",
  "Pressure becomes power when you finally start working.",
  "Every completed unit weakens your anxiety.",
  "Consistency looks small daily but massive yearly.",
  "The pain of studying ends. The pain of regret compounds.",
  "Backlog doesn't disappear with planning. It disappears with execution.",
  "One more item. Then another. That's how people recover.",
  "You become confident by keeping promises to yourself.",
  "Results respect repetition.",
  "The best way to reduce stress is to reduce pending work."
];

export const PRESET_SUBJECTS: Record<string, { emoji: string; color: string }> = {
  "Physics":      { emoji: "⚛️",  color: "#FF8A65" },
  "Maths":        { emoji: "🧮",  color: "#4fc3f7" },
  "Chemistry":    { emoji: "🧪",  color: "#ba68c8" },
  "Biology":      { emoji: "🧬",  color: "#81c784" },
  "Computer Sci": { emoji: "💻",  color: "#f06292" },
  "Electronics":  { emoji: "🔌",  color: "#4dd0e1" },
  "AI / ML":      { emoji: "🤖",  color: "#64b5f6" },
  "Robotics":     { emoji: "🦾",  color: "#90a4ae" },
  "Web Dev":      { emoji: "🌐",  color: "#4db6ac" },
  "Programming":  { emoji: "⌨️",  color: "#9575cd" },
  "Accountancy":  { emoji: "📚",  color: "#26a69a" },
  "Business Stud.": { emoji: "💼",  color: "#ab47bc" },
  "Statistics":   { emoji: "📊",  color: "#29b6f6" }
};

export const PALETTE = [
  "#FF8A65", "#4fc3f7", "#ba68c8", "#81c784", "#ffd54f",
  "#ffb74d", "#4dd0e1", "#f06292", "#4db6ac", "#e57373",
  "#64b5f6", "#a1887f", "#9575cd", "#90a4ae", "#d4e157"
];

export const DEFAULT_DATA = {
  subjects: {},
  classes_per_day: 4,
  skip_sunday: true,
  course_name: "My Backlog Tracker",
  last_updated: getLocalDateString(),
  setup_done: false,
  theme: "dark" as const,
  auto_growth_enabled: true
};
