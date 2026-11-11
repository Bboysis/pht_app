"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock3,
  ListTodo,
  Plus,
  Target,
  Zap,
} from "lucide-react";

const WEEKDAYS = [
  { short: "Mon", full: "Monday" },
  { short: "Tue", full: "Tuesday" },
  { short: "Wed", full: "Wednesday" },
  { short: "Thu", full: "Thursday" },
  { short: "Fri", full: "Friday" },
  { short: "Sat", full: "Saturday" },
  { short: "Sun", full: "Sunday" },
];

const PRIORITY_STYLES = {
  High: {
    badge: "border-rose-400/20 bg-rose-400/10 text-rose-300",
    dot: "bg-rose-400",
  },
  Normal: {
    badge: "border-violet-400/20 bg-violet-400/10 text-violet-300",
    dot: "bg-violet-400",
  },
  Low: {
    badge: "border-sky-400/20 bg-sky-400/10 text-sky-300",
    dot: "bg-sky-400",
  },
};

function normalizePriority(priority) {
  const value = String(priority || "Normal").toLowerCase();

  if (value === "high") return "High";
  if (value === "low") return "Low";

  return "Normal";
}

function getMonday(date) {
  const result = new Date(date);
  result.setHours(12, 0, 0, 0);

  const day = result.getDay();
  const difference = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + difference);

  return result;
}

function addDays(date, amount) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);

  return result;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatRange(start, end) {
  const startLabel = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const endLabel = end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `${startLabel} – ${endLabel}`;
}

function isTaskScheduledForDate(task, dateKey) {
  // Tasks without a date are kept in the Unscheduled section.
  return task.scheduled_date === dateKey;
}

function StatCard({ label, value, description, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#111217] p-5 transition hover:border-white/[0.14]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-400">{label}</p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-white">
            {value}
          </p>
        </div>

        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{
            color,
            backgroundColor: `${color}18`,
          }}
        >
          <Icon size={21} />
        </div>
      </div>

      <p className="mt-4 text-xs text-zinc-500">{description}</p>
    </div>
  );
}

function TaskCard({ task, onToggle }) {
  const priority = normalizePriority(task.priority);
  const style = PRIORITY_STYLES[priority];
  const completed = Boolean(task.completed);

  return (
    <article
      className={`rounded-xl border p-4 transition ${
        completed
          ? "border-white/[0.04] bg-white/[0.015]"
          : "border-white/[0.07] bg-[#15161F] hover:border-white/[0.14]"
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => onToggle(task.id)}
          aria-label={
            completed
              ? `Mark ${task.title} as pending`
              : `Complete ${task.title}`
          }
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition ${
            completed
              ? "bg-emerald-400 text-[#07130E]"
              : "border border-white/20 text-transparent hover:border-violet-400"
          }`}
        >
          <CheckCircle2 size={16} />
        </button>
<div className="min-w-0 flex-1">
          <h3
            className={`break-words text-sm font-semibold ${
              completed ? "text-zinc-500 line-through" : "text-white"
            }`}
          >
            {task.title}
          </h3>

          <p className="mt-1 text-xs text-zinc-500">
            {task.category || "Personal"}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${style.badge}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
              {priority}
            </span>

            {completed && (
              <span className="text-[11px] text-emerald-400">
                Completed
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function PlannerDashboard({
  tasks = [],
  onToggleTask,
  onAddTask,
}) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(() =>
    formatDate(new Date())
  );

  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const currentWeekStart = useMemo(() => {
    const today = getMonday(new Date());
    return addDays(today, weekOffset * 7);
  }, [weekOffset]);

  const weekDates = useMemo(
    () =>
      WEEKDAYS.map((day, index) => {
        const date = addDays(currentWeekStart, index);

        return {
          ...day,
          date,
          dateKey: formatDate(date),
          dayNumber: date.getDate(),
          month: date.toLocaleDateString("en-US", {
            month: "short",
          }),
        };
      }),
    [currentWeekStart]
  );

  const selectedDay = weekDates.find(
    (day) => day.dateKey === selectedDate
  );

  const scheduledTasks = safeTasks.filter((task) =>
    isTaskScheduledForDate(task, selectedDate)
  );

  const completedTasks = scheduledTasks.filter(
    (task) => task.completed
  ).length;

  const pendingTasks = scheduledTasks.length - completedTasks;

  const completionRate = scheduledTasks.length
    ? Math.round((completedTasks / scheduledTasks.length) * 100)
    : 0;

  const unscheduledTasks = safeTasks.filter(
    (task) => !task.scheduled_date
  );

  const weekEnd = addDays(currentWeekStart, 6);

  const weekTasks = safeTasks.filter((task) => {
    if (!task.scheduled_date) return false;

    return (
      task.scheduled_date >= formatDate(currentWeekStart) &&
      task.scheduled_date <= formatDate(weekEnd)
    );
  });

  const weekCompleted = weekTasks.filter(
    (task) => task.completed
  ).length;

  const highPriorityTasks = scheduledTasks.filter(
    (task) => normalizePriority(task.priority) === "High" && !task.completed
  ).length;

  function moveWeek(direction) {
    const nextOffset = weekOffset + direction;
    setWeekOffset(nextOffset);

    const nextWeekStart = addDays(getMonday(new Date()), nextOffset * 7);
    const nextWeekEnd = addDays(nextWeekStart, 6);

    if (
      selectedDate < formatDate(nextWeekStart) ||
      selectedDate > formatDate(nextWeekEnd)
    ) {
      const today = formatDate(new Date());

      setSelectedDate(
        nextOffset === 0
          ? today
          : formatDate(nextWeekStart)
      );
    }
  }

  function goToToday() {
    setWeekOffset(0);
    setSelectedDate(formatDate(new Date()));
  }

  return (
    <main className="min-h-full space-y-7 bg-[#090A10] p-4 text-white sm:p-6 lg:p-8">
      {/* HEADER */}
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
            <CalendarDays size={15} />
            Plan with purpose
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            My Planner<span className="text-violet-400">.</span>
          </h1>
<p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
            Organize your week, focus on what matters, and make time for your goals.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddTask}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400"
        >
          <Plus size={18} />
          Add task
        </button>
      </header>

      {/* OVERVIEW */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="All tasks"
          value={safeTasks.length}
          description="Tasks in your collection"
          icon={ListTodo}
          color="#A78BFA"
        />

        <StatCard
          label="This week"
          value={weekTasks.length}
          description="Tasks scheduled this week"
          icon={CalendarDays}
          color="#60A5FA"
        />

        <StatCard
          label="Completed this week"
          value={weekCompleted}
          description="Scheduled tasks completed"
          icon={CheckCircle2}
          color="#34D399"
        />

        <StatCard
          label="High priority"
          value={highPriorityTasks}
          description="High-priority tasks for this day"
          icon={Zap}
          color="#FB7185"
        />
      </section>

      {/* WEEK SELECTOR */}
      <section className="rounded-2xl border border-white/[0.07] bg-[#111217] p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-white">Your weekly schedule</h2>

            <p className="mt-1 text-sm text-zinc-500">
              {formatRange(currentWeekStart, weekEnd)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => moveWeek(-1)}
              aria-label="Previous week"
              className="rounded-lg border border-white/10 p-2.5 text-zinc-400 transition hover:bg-white/[0.05] hover:text-white"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              type="button"
              onClick={goToToday}
              className="rounded-lg border border-white/10 px-3 py-2.5 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => moveWeek(1)}
              aria-label="Next week"
              className="rounded-lg border border-white/10 p-2.5 text-zinc-400 transition hover:bg-white/[0.05] hover:text-white"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-7 gap-2">
          {weekDates.map((day) => {
            const dayTasks = safeTasks.filter((task) =>
              isTaskScheduledForDate(task, day.dateKey)
            );

            const dayCompleted = dayTasks.filter(
              (task) => task.completed
            ).length;

            const isSelected = selectedDate === day.dateKey;
            const isToday = formatDate(new Date()) === day.dateKey;

            return (
              <button
                key={day.dateKey}
                type="button"
                onClick={() => setSelectedDate(day.dateKey)}
                className={`relative flex min-w-0 flex-col items-center rounded-xl border px-1 py-3 transition sm:py-4 ${
                  isSelected
                    ? "border-violet-400/40 bg-violet-500/15"
: "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]"
                }`}
              >
                {isToday && (
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 sm:right-2 sm:top-2" />
                )}

                <span
                  className={`text-[10px] sm:text-xs ${
                    isSelected ? "text-violet-200" : "text-zinc-500"
                  }`}
                >
                  {day.short}
                </span>

                <span
                  className={`mt-2 text-sm font-bold sm:text-lg ${
                    isSelected ? "text-white" : "text-zinc-300"
                  }`}
                >
                  {day.dayNumber}
                </span>

                <span className="mt-1 text-[9px] text-zinc-600 sm:text-[10px]">
                  {day.month}
                </span>

                <span
                  className={`mt-2 rounded-full px-1.5 py-0.5 text-[9px] sm:text-[10px] ${
                    dayTasks.length > 0 &&
                    dayCompleted === dayTasks.length
                      ? "bg-emerald-400/10 text-emerald-300"
                      : "text-zinc-500"
                  }`}
                >
                  {dayCompleted}/{dayTasks.length}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* SELECTED DAY */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/[0.12] to-[#111217] p-5 sm:p-6 lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-zinc-400">Selected day</p>

              <h2 className="mt-2 text-2xl font-bold">
                {selectedDay?.full || "Selected date"}
              </h2>

              <p className="mt-2 text-sm text-zinc-400">
                {selectedDay?.date.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300">
              <Target size={23} />
            </div>
          </div>

          <div className="mt-7">
            <div className="mb-2 flex items-center justify-between text-xs text-zinc-400">
              <span>Daily completion</span>
              <span>{completionRate}%</span>
            </div>

            <div
              className="h-3 overflow-hidden rounded-full bg-white/[0.07]"
              role="progressbar"
              aria-valuenow={completionRate}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Daily task completion"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-5 text-xs text-zinc-400">
            <span className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-400" />
              {completedTasks} completed
            </span>

            <span className="flex items-center gap-2">
              <Circle size={15} className="text-amber-400" />
              {pendingTasks} remaining
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-[#111217] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/10 text-sky-300">
              <Clock3 size={20} />
            </div>
<div>
              <h2 className="font-semibold">Daily focus</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Your plan for the day
              </p>
            </div>
          </div>

          <p className="mt-6 text-3xl font-bold">
            {scheduledTasks.length}
          </p>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            {scheduledTasks.length === 0
              ? "No tasks are scheduled for this date."
              : `${pendingTasks} task${pendingTasks === 1 ? "" : "s"} still need your attention.`}
          </p>

          <button
            type="button"
            onClick={onAddTask}
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-violet-300 transition hover:text-violet-200"
          >
            <Plus size={16} />
            Plan a task
          </button>
        </div>
      </section>

      {/* TASKS FOR SELECTED DAY */}
      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Scheduled tasks</h2>

            <p className="mt-1 text-sm text-zinc-500">
              Tasks assigned to {selectedDay?.full || "this date"}
            </p>
          </div>

          <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400">
            {scheduledTasks.length} tasks
          </span>
        </div>

        {scheduledTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.12] bg-[#111217] px-5 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
              <CalendarDays size={25} />
            </div>

            <h3 className="mt-4 font-semibold text-white">
              Nothing planned yet
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">
              Add a task for this date to organize your day.
            </p>

            <button
              type="button"
              onClick={onAddTask}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400"
            >
              <Plus size={16} />
              Add your first task
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {scheduledTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={onToggleTask}
              />
            ))}
          </div>
        )}
      </section>

      {/* UNSCHEDULED TASKS */}
      <section className="rounded-2xl border border-white/[0.07] bg-[#111217] p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
            <ListTodo size={20} />
          </div>

          <div>
            <h2 className="font-semibold text-white">Unscheduled tasks</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Tasks that don't have a scheduled date
            </p>
          </div>
        </div>

        {unscheduledTasks.length === 0 ? (
          <p className="mt-5 text-sm text-zinc-500">
            All your tasks have a scheduled date, or there are no tasks to show here.
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            {unscheduledTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={onToggleTask}
              />
            ))}
          </div>
        )}
      </section>
<footer className="border-t border-white/[0.06] pt-5 text-center text-xs text-zinc-500">
        PHT-APP · Plan your time. Protect your focus.
      </footer>
    </main>
  );
}
