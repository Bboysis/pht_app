"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Check,
  CheckCircle2,
  Clock3,
  Flame,
  ListTodo,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

const COLORS = {
  violet: "#8B5CF6",
  emerald: "#34D399",
  amber: "#FBBF24",
  rose: "#FB7185",
  blue: "#60A5FA",
};

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent,
  trend,
}) {
  return (
    <div className="group rounded-2xl border border-white/[0.08] bg-[#11121A] p-5 transition duration-300 hover:-translate-y-1 hover:border-white/[0.16]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-400">{title}</p>

          <h3 className="mt-3 text-3xl font-bold tracking-tight text-white">
            {value}
          </h3>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent}`}
        >
          <Icon size={21} />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
        {trend === "up" ? (
          <ArrowUpRight size={15} className="text-emerald-400" />
        ) : trend === "down" ? (
          <ArrowDownRight size={15} className="text-rose-400" />
        ) : (
          <Activity size={15} className="text-violet-400" />
        )}

        <span>{subtitle}</span>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, children, action }) {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-[#11121A] p-5 sm:p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white sm:text-lg">
            {title}
          </h2>

          {subtitle && (
            <p className="mt-1 text-sm text-gray-400">{subtitle}</p>
          )}
        </div>

        {action}
      </div>

      {children}
    </section>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
        <BarChart3 size={23} />
      </div>

      <p className="text-sm font-medium text-gray-300">
        Nothing to analyze yet
      </p>

      <p className="mt-1 max-w-xs text-xs text-gray-500">{message}</p>
    </div>
  );
}

function getPriority(priority) {
  const value = String(priority || "").toLowerCase();

  if (value === "high") {
    return "High";
  }

  if (value === "low") {
    return "Low";
  }

  return "Normal";
}

function getCompletion(task) {
  return Boolean(
    task.completed ??
      task.is_completed ??
      task.isCompleted ??
      task.done
  );
}

function getTaskDate(task) {
  const value =
    task.created_at ??
    task.createdAt ??
    task.date ??
    task.due_date ??
    task.dueDate;

  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function sameDay(first, second) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function getLastSevenDays() {
  const today = new Date();

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);

    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - (6 - index));

    return date;
  });
}

function formatDay(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
  });
}

export default function AnalyticsDashboard({
  tasks = [],
  habits = [],
}) {
  const [period, setPeriod] = useState("7D");

  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeHabits = Array.isArray(habits) ? habits : [];
const completedTasks = safeTasks.filter(getCompletion);
  const pendingTasks = safeTasks.filter((task) => !getCompletion(task));

  const completionRate = safeTasks.length
    ? Math.round(
        (completedTasks.length / safeTasks.length) * 100
      )
    : 0;

  const priorityData = useMemo(() => {
    const priorities = [
      {
        name: "High",
        color: COLORS.rose,
      },
      {
        name: "Normal",
        color: COLORS.violet,
      },
      {
        name: "Low",
        color: COLORS.blue,
      },
    ];

    return priorities.map((priority) => ({
      ...priority,
      value: safeTasks.filter(
        (task) => getPriority(task.priority) === priority.name
      ).length,
    }));
  }, [safeTasks]);

  const productivityData = useMemo(() => {
    const days = getLastSevenDays();

    return days.map((date) => {
      const dailyTasks = safeTasks.filter((task) => {
        const taskDate = getTaskDate(task);

        return taskDate && sameDay(taskDate, date);
      });

      const completed = dailyTasks.filter(getCompletion).length;

      return {
        day: formatDay(date),
        completed,
        total: dailyTasks.length,
      };
    });
  }, [safeTasks]);

  const chartData = useMemo(() => {
    if (period === "7D") {
      return productivityData;
    }

    const today = new Date();

    const weeks = Array.from({ length: 4 }, (_, index) => {
      const end = new Date(today);
      end.setHours(23, 59, 59, 999);
      end.setDate(today.getDate() - index * 7);

      const start = new Date(end);
      start.setHours(0, 0, 0, 0);
      start.setDate(end.getDate() - 6);

      const completed = safeTasks.filter((task) => {
        const date = getTaskDate(task);

        return (
          date &&
          date >= start &&
          date <= end &&
          getCompletion(task)
        );
      }).length;

      return {
        day: index === 0 ? "This week" : `${index}w ago`,
        completed,
      };
    });

    return weeks.reverse();
  }, [period, productivityData, safeTasks]);

  const habitStats = useMemo(() => {
    const activeHabits = safeHabits.length;

    const completedHabits = safeHabits.filter(
      (habit) =>
        habit.completed === true ||
        habit.is_completed === true ||
        habit.isCompleted === true
    ).length;

    const consistency = activeHabits
      ? Math.round((completedHabits / activeHabits) * 100)
      : 0;

    return {
      activeHabits,
      completedHabits,
      consistency,
    };
  }, [safeHabits]);

  const insight = useMemo(() => {
    if (!safeTasks.length && !safeHabits.length) {
      return {
        title: "Your journey starts here",
        description:
          "Add your first tasks and habits to begin discovering your productivity patterns.",
        icon: Sparkles,
      };
    }

    if (pendingTasks.length === 0 && safeTasks.length > 0) {
      return {
        title: "Everything is completed!",
        description:
          "All your current tasks are finished. Set a new goal to keep your momentum going.",
        icon: CheckCircle2,
      };
    }

    if (completionRate >= 75) {
      return {
        title: "You're making great progress",
        description:
          "Most of your tasks are completed. Keep prioritizing important work and maintain your momentum.",
        icon: TrendingUp,
      };
    }

    if (completionRate >= 40) {
      return {
        title: "Keep building consistency",
        description:
          "You're making progress. Try completing one high-priority task before starting something new.",
        icon: Target,
      };
    }

    return {
      title: "Focus on one thing at a time",
      description:
        "Choose one manageable task, finish it, and use that momentum to tackle the next one.",
      icon: Zap,
    };
  }, [safeTasks.length, safeHabits.length, pendingTasks.length, completionRate]);

  const InsightIcon = insight.icon;

  const totalPriorityTasks = priorityData.reduce(
    (sum, item) => sum + item.value,
    0
  );
return (
    <div className="min-h-full space-y-7 bg-[#090A10] p-4 text-white sm:p-6 lg:p-8">
      {/* HEADER */}
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-violet-300">
            <Activity size={15} />
            Performance center
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Analytics<span className="text-violet-400">.</span>
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-gray-400">
            Understand your progress, discover patterns, and build better habits.
          </p>
        </div>

        <div className="flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-1">
          {["7D", "4W"].map((option) => (
            <button
              key={option}
              onClick={() => setPeriod(option)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                period === option
                  ? "bg-violet-500 text-white shadow-lg shadow-violet-500/20"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {option === "7D" ? "7 days" : "4 weeks"}
            </button>
          ))}
        </div>
      </header>

      {/* OVERVIEW CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total tasks"
          value={safeTasks.length}
          subtitle="Tasks in your workspace"
          icon={ListTodo}
          accent="bg-violet-500/10 text-violet-300"
        />

        <StatCard
          title="Completed"
          value={completedTasks.length}
          subtitle={`${completionRate}% overall completion`}
          icon={CheckCircle2}
          accent="bg-emerald-500/10 text-emerald-300"
          trend="up"
        />

        <StatCard
          title="Pending"
          value={pendingTasks.length}
          subtitle="Tasks remaining"
          icon={Clock3}
          accent="bg-amber-500/10 text-amber-300"
        />

        <StatCard
          title="Habit consistency"
          value={`${habitStats.consistency}%`}
          subtitle={`${habitStats.completedHabits} completed habits`}
          icon={Flame}
          accent="bg-rose-500/10 text-rose-300"
        />
      </div>

      {/* MAIN CHARTS */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Panel
            title="Productivity overview"
            subtitle={
              period === "7D"
                ? "Tasks created and completed each day"
                : "Completed tasks grouped by recent weeks"
            }
            action={
              <div className="flex items-center gap-2 text-xs text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Completed
              </div>
            }
          >
            {safeTasks.length === 0 ? (
              <EmptyState message="Create some tasks to populate your productivity chart." />
            ) : (
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{
                      top: 10,
                      right: 8,
                      left: -22,
                      bottom: 0,
                    }}
                  >
                    <defs>
                      <linearGradient
                        id="productivityGradient"
                        x1="0"
                        y1="0"
x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={COLORS.violet}
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor={COLORS.violet}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      stroke="rgba(255,255,255,0.06)"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#88889A",
                        fontSize: 11,
                      }}
                      dy={10}
                    />

                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#88889A",
                        fontSize: 11,
                      }}
                    />

                    <Tooltip
                      contentStyle={{
                        background: "#181824",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 12,
                        color: "#fff",
                      }}
                      labelStyle={{
                        color: "#C4B5FD",
                        marginBottom: 5,
                      }}
                    />

                    <Area
                      type="monotone"
                      dataKey="completed"
                      name="Completed tasks"
                      stroke={COLORS.violet}
                      strokeWidth={3}
                      fill="url(#productivityGradient)"
                      activeDot={{
                        r: 5,
                        strokeWidth: 0,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>
        </div>

        {/* TASK COMPLETION */}
        <Panel
          title="Task completion"
          subtitle="Your overall progress"
        >
          <div className="flex min-h-[220px] flex-col items-center justify-center">
            <div
              className="relative flex h-44 w-44 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(${COLORS.violet} ${completionRate}%, #292938 ${completionRate}% 100%)`,
              }}
            >
              <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full bg-[#11121A]">
                <span className="text-4xl font-bold">
                  {completionRate}%
                </span>

                <span className="mt-1 text-xs text-gray-400">
                  Completed
                </span>
              </div>
            </div>

            <div className="mt-6 grid w-full grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/[0.03] p-3">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="h-2 w-2 rounded-full bg-violet-400" />
                  Completed
                </div>

                <p className="mt-2 text-xl font-semibold">
                  {completedTasks.length}
                </p>
              </div>

              <div className="rounded-xl bg-white/[0.03] p-3">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="h-2 w-2 rounded-full bg-gray-600" />
                  Pending
                </div>
<p className="mt-2 text-xl font-semibold">
                  {pendingTasks.length}
                </p>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      {/* PRIORITIES + HABITS */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel
          title="Task priorities"
          subtitle="Distribution of your current tasks"
        >
          {totalPriorityTasks === 0 ? (
            <EmptyState message="Your task priorities will appear here." />
          ) : (
            <div className="grid grid-cols-1 items-center gap-5 sm:grid-cols-2">
              <div className="h-[210px] min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityData.filter((item) => item.value > 0)}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={5}
                      stroke="none"
                    >
                      {priorityData
                        .filter((item) => item.value > 0)
                        .map((item) => (
                          <Cell
                            key={item.name}
                            fill={item.color}
                          />
                        ))}
                    </Pie>

                    <Tooltip
                      contentStyle={{
                        background: "#181824",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-5">
                {priorityData.map((item) => {
                  const percentage = totalPriorityTasks
                    ? Math.round(
                        (item.value / totalPriorityTasks) * 100
                      )
                    : 0;

                  return (
                    <div key={item.name}>
                      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-300">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor: item.color,
                            }}
                          />

                          {item.name}
                        </div>

                        <span className="font-medium text-white">
                          {item.value}
                        </span>
                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Panel>

        <Panel
          title="Habit consistency"
          subtitle="A snapshot of your habit data"
        >
          {safeHabits.length === 0 ? (
            <EmptyState message="Add habits to begin tracking your habit activity here." />
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
                  <Target size={25} />
                </div>
<div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-400">
                    Habits marked completed
                  </p>

                  <p className="mt-1 text-2xl font-bold">
                    {habitStats.completedHabits}
                    <span className="ml-1 text-sm font-normal text-gray-500">
                      / {habitStats.activeHabits}
                    </span>
                  </p>
                </div>

                <span className="text-lg font-semibold text-emerald-300">
                  {habitStats.consistency}%
                </span>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-xs text-gray-400">
                  <span>Habit completion snapshot</span>
                  <span>{habitStats.consistency}%</span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                    style={{
                      width: `${habitStats.consistency}%`,
                    }}
                  />
                </div>
              </div>

              <p className="text-xs leading-5 text-gray-500">
                This percentage reflects the completion status available
                in your current habit objects. Historical consistency
                requires your habit occurrence records.
              </p>
            </div>
          )}
        </Panel>
      </div>

      {/* INSIGHTS */}
      <section className="relative overflow-hidden rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/[0.13] via-[#11121A] to-[#11121A] p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-violet-300">
            <InsightIcon size={23} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles size={15} className="text-violet-300" />

              <span className="text-xs font-semibold uppercase tracking-wider text-violet-300">
                Productivity insight
              </span>
            </div>

            <h2 className="text-lg font-semibold text-white">
              {insight.title}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
              {insight.description}
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="flex flex-col items-center justify-between gap-2 border-t border-white/[0.06] pt-5 text-xs text-gray-500 sm:flex-row">
        <p>PHT-APP · Personal productivity analytics</p>

        <div className="flex items-center gap-2">
          <Check size={13} className="text-emerald-400" />
          <span>Based on your available task data</span>
        </div>
      </footer>
    </div>
  );
}

