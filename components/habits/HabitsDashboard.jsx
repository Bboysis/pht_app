"use client";

import { useMemo } from "react";
import {
  Activity,
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  Flame,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";

const WEEKDAYS = [
  { label: "Mon", full: "Monday" },
  { label: "Tue", full: "Tuesday" },
  { label: "Wed", full: "Wednesday" },
  { label: "Thu", full: "Thursday" },
  { label: "Fri", full: "Friday" },
  { label: "Sat", full: "Saturday" },
  { label: "Sun", full: "Sunday" },
];

const CATEGORY_COLORS = {
  Fitness: "#A78BFA",
  Health: "#60A5FA",
  Learning: "#FBBF24",
  Personal: "#FB7185",
  Spiritual: "#34D399",
};

function getHabitColor(habit) {
  return habit.color || CATEGORY_COLORS[habit.category] || "#A78BFA";
}

function StatCard({ title, value, subtitle, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#11121A] p-5 transition hover:-translate-y-1 hover:border-white/[0.15]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-white">
            {value}
          </p>
        </div>

        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{
            backgroundColor: `${color}18`,
            color,
          }}
        >
          <Icon size={21} />
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}

function HabitCard({
  habit,
  selectedDay,
  completed,
  onToggle,
}) {
  const color = getHabitColor(habit);

  return (
    <article className="group rounded-2xl border border-white/[0.08] bg-[#11121A] p-4 transition hover:border-white/[0.16] sm:p-5">
      <div className="flex items-start gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
          style={{
            backgroundColor: `${color}18`,
            color,
          }}
        >
          <Activity size={22} />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="break-words font-semibold text-white">
            {habit.name}
          </h3>

          <p className="mt-1 text-xs text-gray-500">
            {habit.category || "Personal"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onToggle(habit.id, selectedDay)}
          aria-label={
            completed
              ? `Mark ${habit.name} incomplete`
              : `Mark ${habit.name} complete`
          }
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition ${
            completed
              ? "border-emerald-400/30 bg-emerald-400 text-[#07130E]"
              : "border-white/10 bg-white/[0.03] text-gray-400 hover:border-violet-400/50 hover:text-violet-300"
          }`}
        >
          {completed ? <Check size={20} /> : <Circle size={20} />}
        </button>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            completed
              ? "bg-emerald-400/10 text-emerald-300"
              : "bg-white/[0.05] text-gray-400"
          }`}
        >
          {completed ? "Completed" : "Not completed"}
        </span>

        <span className="text-xs text-gray-500">
          {WEEKDAYS[selectedDay]?.full || "Selected day"}
        </span>
      </div>
    </article>
  );
}

export default function HabitsDashboard({
  habits = [],
  completedHabits = {},
  selectedDay = 0,
  setSelectedDay,
  toggleHabit,
  onAddHabit,
}) {
  const safeHabits = Array.isArray(habits) ? habits : [];

  const scheduledHabits = useMemo(
    () =>
      safeHabits.filter(
        (habit) =>
          Array.isArray(habit.days) &&
          habit.days.includes(selectedDay)
      ),
    [safeHabits, selectedDay]
  );
const completedCount = scheduledHabits.filter(
    (habit) => Boolean(completedHabits[`${habit.id}-${selectedDay}`])
  ).length;

  const pendingCount = scheduledHabits.length - completedCount;

  const completionRate = scheduledHabits.length
    ? Math.round((completedCount / scheduledHabits.length) * 100)
    : 0;

  const categories = useMemo(() => {
    const counts = {};

    safeHabits.forEach((habit) => {
      const category = habit.category || "Personal";
      counts[category] = (counts[category] || 0) + 1;
    });

    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      color: CATEGORY_COLORS[name] || "#A78BFA",
    }));
  }, [safeHabits]);

  return (
    <main className="min-h-full space-y-7 bg-[#090A10] p-4 text-white sm:p-6 lg:p-8">
      {/* HEADER */}
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
            <Sparkles size={15} />
            Build your best self
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            My Habits<span className="text-violet-400">.</span>
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-gray-400">
            Small actions, repeated consistently, create meaningful change.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddHabit}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400"
        >
          <Plus size={18} />
          Add new habit
        </button>
      </header>

      {/* OVERVIEW */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total habits"
          value={safeHabits.length}
          subtitle="Habits in your collection"
          icon={Activity}
          color="#A78BFA"
        />

        <StatCard
          title="Completed today"
          value={completedCount}
          subtitle="Scheduled habits completed"
          icon={CheckCircle2}
          color="#34D399"
        />

        <StatCard
          title="Remaining"
          value={pendingCount}
          subtitle="Scheduled habits to complete"
          icon={Target}
          color="#FBBF24"
        />

        <StatCard
          title="Completion rate"
          value={`${completionRate}%`}
          subtitle="For the selected day"
          icon={TrendingUp}
          color="#60A5FA"
        />
      </section>

      {/* WEEKLY SELECTOR */}
      <section className="rounded-2xl border border-white/[0.08] bg-[#11121A] p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
            <CalendarDays size={20} />
          </div>

          <div>
            <h2 className="font-semibold text-white">Weekly tracker</h2>
            <p className="mt-1 text-xs text-gray-500">
              Select a day to view its scheduled habits.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {WEEKDAYS.map((day, index) => {
            const dayHabits = safeHabits.filter(
              (habit) =>
                Array.isArray(habit.days) &&
                habit.days.includes(index)
            );

            const dayCompleted = dayHabits.filter(
              (habit) => Boolean(completedHabits[`${habit.id}-${index}`])
            ).length;

            const isSelected = selectedDay === index;
return (
              <button
                key={day.label}
                type="button"
                onClick={() => setSelectedDay(index)}
                className={`flex min-w-0 flex-col items-center rounded-xl border px-1 py-3 transition sm:py-4 ${
                  isSelected
                    ? "border-violet-400/50 bg-violet-500/15"
                    : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]"
                }`}
              >
                <span
                  className={`text-[10px] sm:text-xs ${
                    isSelected ? "text-violet-200" : "text-gray-500"
                  }`}
                >
                  {day.label}
                </span>

                <span
                  className={`mt-2 text-sm font-bold sm:text-base ${
                    isSelected ? "text-white" : "text-gray-300"
                  }`}
                >
                  {dayCompleted}/{dayHabits.length}
                </span>

                <span
                  className={`mt-2 h-1 w-6 rounded-full ${
                    dayHabits.length > 0 &&
                    dayCompleted === dayHabits.length
                      ? "bg-emerald-400"
                      : isSelected
                        ? "bg-violet-400"
                        : "bg-white/10"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </section>

      {/* DAILY PROGRESS */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/[0.14] to-[#11121A] p-5 sm:p-6 lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-gray-400">Daily progress</p>

              <h2 className="mt-2 text-2xl font-bold">
                {completionRate === 100 && scheduledHabits.length > 0
                  ? "Amazing work!"
                  : completionRate >= 50
                    ? "You're making progress!"
                    : "Keep moving forward"}
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-400">
                {scheduledHabits.length === 0
                  ? "No habits are scheduled for this day."
                  : `${completedCount} of ${scheduledHabits.length} scheduled habits completed.`}
              </p>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300">
              <Trophy size={23} />
            </div>
          </div>

          <div className="mt-7">
            <div className="mb-2 flex items-center justify-between text-xs text-gray-400">
              <span>Completion</span>
              <span>{completionRate}%</span>
            </div>

            <div
              className="h-3 overflow-hidden rounded-full bg-white/[0.07]"
              role="progressbar"
              aria-valuenow={completionRate}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Daily habit completion"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-5 text-xs text-gray-400">
            <span className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-400" />
              {completedCount} completed
            </span>

            <span className="flex items-center gap-2">
              <Circle size={15} className="text-gray-500" />
              {pendingCount} remaining
            </span>
          </div>
        </div>
<div className="rounded-2xl border border-white/[0.08] bg-[#11121A] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
              <Flame size={21} />
            </div>

            <div>
              <h2 className="font-semibold">Stay consistent</h2>
              <p className="mt-1 text-xs text-gray-500">Your next milestone</p>
            </div>
          </div>

          <p className="mt-6 text-3xl font-bold">
            {completedCount}/{scheduledHabits.length}
          </p>

          <p className="mt-2 text-sm leading-6 text-gray-400">
            Complete your scheduled habits to make today count.
          </p>

          <div className="mt-5 flex items-center gap-2 text-xs text-amber-300">
            <Zap size={15} />
            Consistency beats perfection.
          </div>
        </div>
      </section>

      {/* HABIT LIST */}
      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Your daily habits</h2>

            <p className="mt-1 text-sm text-gray-500">
              {WEEKDAYS[selectedDay]?.full} · {scheduledHabits.length} scheduled
            </p>
          </div>

          <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-gray-400">
            {completedCount} of {scheduledHabits.length} complete
          </span>
        </div>

        {scheduledHabits.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.12] bg-[#11121A] px-5 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
              <Activity size={26} />
            </div>

            <h3 className="mt-4 font-semibold text-white">
              No habits scheduled
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
              Add a habit or select another day to see your schedule.
            </p>

            <button
              type="button"
              onClick={onAddHabit}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-400"
            >
              <Plus size={16} />
              Create a habit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {scheduledHabits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                selectedDay={selectedDay}
                completed={Boolean(
                  completedHabits[`${habit.id}-${selectedDay}`]
                )}
                onToggle={toggleHabit}
              />
            ))}
          </div>
        )}
      </section>

      {/* CATEGORY SUMMARY */}
      <section className="rounded-2xl border border-white/[0.08] bg-[#11121A] p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/10 text-sky-300">
            <Target size={20} />
          </div>

          <div>
            <h2 className="font-semibold">Habit categories</h2>
            <p className="mt-1 text-xs text-gray-500">
              Your habits organized by category
            </p>
          </div>
        </div>

        {categories.length === 0 ? (
          <p className="py-5 text-sm text-gray-500">
            Your category breakdown will appear when you add habits.
          </p>
        ) : (
<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <div
                key={category.name}
                className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />

                  <span className="text-sm text-gray-300">
                    {category.name}
                  </span>
                </div>

                <span className="text-sm font-semibold text-white">
                  {category.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-white/[0.06] pt-5 text-center text-xs text-gray-500">
        PHT-APP · Build better habits, one day at a time.
      </footer>
    </main>
  );
}
