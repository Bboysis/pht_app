"use client";

import { useMemo, useState } from "react";
import {
  ListTodo,
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Clock3,
  AlertCircle,
  Pencil,
  Trash2,
  Target,
  Check,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  Sparkles,
} from "lucide-react";

const PRIORITIES = {
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

function StatCard({ title, value, description, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#111217] p-5 transition hover:border-white/[0.14]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-400">{title}</p>

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

function TaskCard({
  task,
  onToggle,
  onEdit,
  onDelete,
}) {
  const priority = normalizePriority(task.priority);
  const priorityStyle = PRIORITIES[priority];
  const completed = Boolean(task.completed);

  return (
    <article
      className={`rounded-2xl border p-4 transition sm:p-5 ${
        completed
          ? "border-white/[0.05] bg-[#0F1016]"
          : "border-white/[0.08] bg-[#111217] hover:border-white/[0.16]"
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
              : "border border-white/20 text-transparent hover:border-violet-400 hover:text-violet-300"
          }`}
        >
          {completed ? <Check size={15} /> : <Circle size={17} />}
        </button>

        <div className="min-w-0 flex-1">
          <h3
            className={`break-words text-sm font-semibold ${
              completed
                ? "text-zinc-500 line-through"
                : "text-white"
            }`}
          >
            {task.title}
          </h3>

          <p className="mt-1 text-xs text-zinc-500">
            {task.category || "Personal"}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${priorityStyle.badge}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${priorityStyle.dot}`}
              />
              {priority} priority
            </span>

            <span
              className={`rounded-full px-2.5 py-1 text-[11px] ${
                completed
                  ? "bg-emerald-400/10 text-emerald-300"
                  : "bg-white/[0.04] text-zinc-400"
              }`}
            >
              {completed ? "Completed" : "Pending"}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(task)}
            title="Edit task"
            aria-label={`Edit ${task.title}`}
            className="rounded-lg p-2 text-zinc-500 transition hover:bg-violet-400/10 hover:text-violet-300"
          >
            <Pencil size={16} />
          </button>

          <button
            type="button"
            onClick={() => onDelete(task.id)}
            title="Delete task"
            aria-label={`Delete ${task.title}`}
            className="rounded-lg p-2 text-zinc-500 transition hover:bg-rose-400/10 hover:text-rose-300"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}

export default function TasksDashboard({
  tasks = [],
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onAddTask,
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("default");

  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const totalTasks = safeTasks.length;

  const completedTasks = safeTasks.filter(
    (task) => task.completed
  ).length;

  const pendingTasks = totalTasks - completedTasks;

  const highPriorityTasks = safeTasks.filter(
    (task) =>
      normalizePriority(task.priority) === "High" &&
      !task.completed
  ).length;

  const completionRate = totalTasks
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return safeTasks
      .filter((task) => {
        const title = String(task.title || "").toLowerCase();
        const category = String(
          task.category || "Personal"
        ).toLowerCase();

        const matchesSearch =
          title.includes(query) || category.includes(query);

        const matchesFilter =
          filter === "all" ||
          (filter === "pending" && !task.completed) ||
          (filter === "completed" && task.completed) ||
          (filter === "high" &&
            normalizePriority(task.priority) === "High");

        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        if (sort === "name") {
          return String(a.title || "").localeCompare(
            String(b.title || "")
          );
        }

        if (sort === "priority") {
          const rank = {
            High: 3,
            Normal: 2,
            Low: 1,
          };

          return (
            rank[normalizePriority(b.priority)] -
            rank[normalizePriority(a.priority)]
          );
        }

        if (sort === "status") {
          return Number(a.completed) - Number(b.completed);
        }

        return 0;
      });
  }, [safeTasks, search, filter, sort]);

  const filterOptions = [
    { id: "all", label: "All tasks", count: totalTasks },
    { id: "pending", label: "Pending", count: pendingTasks },
    {
      id: "completed",
      label: "Completed",
      count: completedTasks,
    },
    {
      id: "high",
      label: "High priority",
      count: safeTasks.filter(
        (task) => normalizePriority(task.priority) === "High"
      ).length,
    },
  ];

  return (
    <main className="min-h-full space-y-7 bg-[#090A10] p-4 text-white sm:p-6 lg:p-8">
      {/* HEADER */}
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
            <Sparkles size={15} />
            Get things done
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            My Tasks<span className="text-violet-400">.</span>
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
            Organize your responsibilities, focus on your priorities,
            and turn your plans into progress.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddTask}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400"
        >
          <Plus size={18} />
          Create task
        </button>
      </header>

      {/* STATISTICS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total tasks"
          value={totalTasks}
          description="All tasks in your workspace"
          icon={ListTodo}
          color="#A78BFA"
        />

        <StatCard
          title="Completed"
          value={completedTasks}
          description="Tasks you've finished"
          icon={CheckCircle2}
          color="#34D399"
        />

        <StatCard
          title="Pending"
          value={pendingTasks}
          description="Tasks still to complete"
          icon={Clock3}
          color="#FBBF24"
        />

        <StatCard
          title="High priority"
          value={highPriorityTasks}
          description="Uncompleted high-priority tasks"
          icon={AlertCircle}
          color="#FB7185"
        />
      </section>

      {/* PROGRESS */}
      <section className="rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/[0.12] to-[#111217] p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Target size={17} className="text-violet-300" />
              Overall progress
            </div>

            <h2 className="mt-2 text-2xl font-bold">
              {completionRate === 100 && totalTasks > 0
                ? "Everything completed!"
                : completionRate >= 50
                  ? "You're making progress!"
                  : "One task at a time."}
            </h2>

            <p className="mt-2 text-sm text-zinc-400">
              {completedTasks} of {totalTasks} tasks completed.
            </p>
          </div>

          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-violet-400/20">
            <span className="text-xl font-bold text-white">
              {completionRate}%
            </span>
          </div>
        </div>

        <div
          className="mt-6 h-3 overflow-hidden rounded-full bg-white/[0.07]"
          role="progressbar"
          aria-valuenow={completionRate}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Overall task completion"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </section>

      {/* SEARCH AND FILTERS */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tasks or categories..."
              aria-label="Search tasks"
              className="w-full rounded-xl border border-white/[0.08] bg-[#111217] py-3.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400/50"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#111217] px-3">
            <ArrowUpDown size={16} className="shrink-0 text-zinc-500" />
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              aria-label="Sort tasks"
              className="w-full bg-transparent py-3 text-sm text-zinc-300 outline-none"
            >
              <option value="default" className="bg-[#111217]">
                Default order
              </option>

              <option value="name" className="bg-[#111217]">
                Task name
              </option>

              <option value="priority" className="bg-[#111217]">
                Priority
              </option>

              <option value="status" className="bg-[#111217]">
                Status
              </option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <SlidersHorizontal size={15} />
          Filter your tasks
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {filterOptions.map((option) => {
            const active = filter === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setFilter(option.id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-medium transition ${
                  active
                    ? "border-violet-400/30 bg-violet-500/15 text-violet-200"
                    : "border-white/[0.07] bg-[#111217] text-zinc-400 hover:text-white"
                }`}
              >
                {option.label}

                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                    active
                      ? "bg-violet-400/15 text-violet-200"
                      : "bg-white/[0.05] text-zinc-500"
                  }`}
                >
                  {option.count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* TASK LIST */}
      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Your task list</h2>

            <p className="mt-1 text-sm text-zinc-500">
              Manage your tasks and track your progress.
            </p>
          </div>

          <span className="rounded-full border border-white/[0.08] bg-[#111217] px-3 py-1.5 text-xs text-zinc-400">
            {filteredTasks.length} shown
          </span>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.12] bg-[#111217] px-5 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
              <ListTodo size={26} />
            </div>

            <h3 className="mt-4 font-semibold text-white">
              {search || filter !== "all"
                ? "No matching tasks"
                : "Your task list is empty"}
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">
              {search || filter !== "all"
                ? "Try changing your search or selecting another filter."
                : "Create your first task and start organizing your day."}
            </p>

            {search || filter !== "all" ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
                className="mt-5 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-white/[0.05]"
              >
                Clear filters
                </button>
            ) : (
              <button
                type="button"
                onClick={onAddTask}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400"
              >
                <Plus size={16} />
                Create your first task
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={onToggleTask}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.06] pt-5 text-center text-xs text-zinc-500">
        PHT-APP · Every completed task is progress.
      </footer>
    </main>
  );
}