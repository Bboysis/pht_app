 "use client";

import { useEffect, useState } from "react";
import {
  Target,
  Plus,
  Trash2,
  Pencil,
  CheckCircle2,
  CalendarDays,
  TrendingUp,
  X,
  Trophy,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "pht-app-goals-v1";

const categories = [
  "Personal",
  "Health",
  "Fitness",
  "Learning",
  "Career",
  "Finance",
  "Other",
];

const emptyGoal = {
  title: "",
  description: "",
  category: "Personal",
  target_date: "",
  progress: 0,
};

function loadLocalGoals() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function normalizeGoal(goal) {
  return {
    id: goal.id,
    title: goal.title || "",
    description: goal.description || "",
    category: goal.category || "Personal",
    target_date: goal.target_date || "",
    progress: Math.min(
      100,
      Math.max(0, Number(goal.progress ?? 0))
    ),
    created_at: goal.created_at || new Date().toISOString(),
  };
}

function getDaysRemaining(date) {
  if (!date) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(`${date}T00:00:00`);

  return Math.ceil(
    (target - today) / (1000 * 60 * 60 * 24)
  );
}

export default function GoalsDashboard() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [form, setForm] = useState(emptyGoal);
  const [notice, setNotice] = useState("");
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    async function initialize() {
      try {
        const {
          data: { user: currentUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;
        if (!mounted) return;

        setUser(currentUser || null);

        if (currentUser) {
          const { data, error } = await supabase
            .from("goals")
            .select("*")
            .eq("user_id", currentUser.id)
            .order("created_at", { ascending: false });

          if (error) throw error;
          if (!mounted) return;

          setGoals((data || []).map(normalizeGoal));
        } else {
          setGoals(loadLocalGoals().map(normalizeGoal));
        }
      } catch (error) {
        console.error("Goals loading error:", error);

        if (mounted) {
          setGoals(loadLocalGoals().map(normalizeGoal));

          setNotice(
            "Could not load goals from Supabase. Showing locally saved goals."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (user === null) {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(goals)
        );
      } catch (error) {
        console.error("Local goals save error:", error);
      }
    }
  }, [goals, user]);

  function openAddForm() {
    setEditingGoal(null);
    setForm(emptyGoal);
    setShowForm(true);
  }

  function openEditForm(goal) {
    setEditingGoal(goal);

    setForm({
      title: goal.title,
      description: goal.description,
      category: goal.category,
      target_date: goal.target_date,
      progress: goal.progress,
    });

    setShowForm(true);
  }

  function updateForm(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function saveGoal(event) {
    event.preventDefault();

    const title = form.title.trim();

    if (!title) {
      setNotice("Please enter a goal title.");
      return;
    }

    setSaving(true);
    setNotice("");
    const goalData = {
      title,
      description: form.description.trim(),
      category: form.category,
      target_date: form.target_date || null,
      progress: Math.min(
        100,
        Math.max(0, Number(form.progress) || 0)
      ),
    };

    try {
      const supabase = createClient();

      if (user) {
        if (
          editingGoal &&
          !String(editingGoal.id).startsWith("local-")
        ) {
          const { data, error } = await supabase
            .from("goals")
            .update(goalData)
            .eq("id", editingGoal.id)
            .eq("user_id", user.id)
            .select("*")
            .single();

          if (error) throw error;

          setGoals((previous) =>
            previous.map((goal) =>
              goal.id === editingGoal.id
                ? normalizeGoal(data)
                : goal
            )
          );

          setNotice("Goal updated successfully!");
        } else {
          const { data, error } = await supabase
            .from("goals")
            .insert({
              ...goalData,
              user_id: user.id,
            })
            .select("*")
            .single();

          if (error) throw error;

          setGoals((previous) => [
            normalizeGoal(data),
            ...previous,
          ]);

          setNotice("Goal created successfully!");
        }
      } else {
        if (editingGoal) {
          setGoals((previous) =>
            previous.map((goal) =>
              goal.id === editingGoal.id
                ? normalizeGoal({
                    ...goal,
                    ...goalData,
                  })
                : goal
            )
          );

          setNotice("Goal updated on this device.");
        } else {
          const newGoal = normalizeGoal({
            ...goalData,
            id: `local-${Date.now()}`,
            created_at: new Date().toISOString(),
          });

          setGoals((previous) => [
            newGoal,
            ...previous,
          ]);

          setNotice(
            "Goal created locally. Sign in to save goals to Supabase."
          );
        }
      }

      setShowForm(false);
      setEditingGoal(null);
      setForm(emptyGoal);
    } catch (error) {
      console.error("Goal save error:", error);

      setNotice(
        `Could not save goal: ${error.message || "Unknown error"}`
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateProgress(goal, value) {
    const progress = Math.min(
      100,
      Math.max(0, Number(value))
    );

    const previousGoals = goals;

    setGoals((previous) =>
      previous.map((item) =>
        item.id === goal.id
          ? { ...item, progress }
          : item
      )
    );

    if (!user || String(goal.id).startsWith("local-")) {
      setNotice("Progress updated on this device.");
      return;
    }

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("goals")
        .update({ progress })
        .eq("id", goal.id)
        .eq("user_id", user.id);

      if (error) throw error;

      setNotice("Goal progress saved!");
    } catch (error) {
      console.error("Goal progress update error:", error);

      setGoals(previousGoals);

      setNotice(
        `Could not update progress: ${error.message || "Unknown error"}`
      );
    }
  }

  async function deleteGoal(goal) {
    const confirmed = window.confirm(
      `Delete "${goal.title}"? This cannot be undone.`
    );

    if (!confirmed) return;

    const previousGoals = goals;

    setGoals((previous) =>
      previous.filter((item) => item.id !== goal.id)
    );

    if (!user || String(goal.id).startsWith("local-")) {
      setNotice("Goal deleted from this device.");
      return;
    }

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("goals")
        .delete()
        .eq("id", goal.id)
        .eq("user_id", user.id);

      if (error) throw error;
      setNotice("Goal deleted successfully!");
    } catch (error) {
      console.error("Goal deletion error:", error);

      setGoals(previousGoals);

      setNotice(
        `Could not delete goal: ${error.message || "Unknown error"}`
      );
    }
  }

  const filteredGoals = goals.filter((goal) =>
    `${goal.title} ${goal.category} ${goal.description}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const completedGoals = goals.filter(
    (goal) => goal.progress >= 100
  ).length;

  const activeGoals = goals.filter(
    (goal) => goal.progress < 100
  ).length;

  const averageProgress = goals.length
    ? Math.round(
        goals.reduce(
          (total, goal) => total + goal.progress,
          0
        ) / goals.length
      )
    : 0;

  const cardClass =
    "rounded-2xl border border-white/10 bg-white/[0.04] p-5";

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-violet-400";

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-gray-400">
        <div className="text-center">
          <Target className="mx-auto mb-3 h-8 w-8 animate-pulse text-violet-400" />
          Loading your goals...
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6 text-white">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-violet-300">
            <Target size={17} />
            Personal development
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            My Goals
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            Turn your plans into progress, one step at a time.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold transition hover:bg-violet-400"
        >
          <Plus size={18} />
          Add Goal
        </button>
      </div>

      {/* Notice */}
      {notice && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-violet-400/20 bg-violet-400/10 px-4 py-3 text-sm text-violet-200">
          <span>{notice}</span>

          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">
              Total goals
            </span>
            <Target className="text-violet-300" size={20} />
          </div>

          <p className="mt-4 text-3xl font-bold">
            {goals.length}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            All your goals
          </p>
        </div>

        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">
              In progress
            </span>
            <TrendingUp className="text-blue-300" size={20} />
          </div>

          <p className="mt-4 text-3xl font-bold">
            {activeGoals}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Keep moving forward
          </p>
        </div>

        <div className={cardClass}>

         <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">
              Completed
            </span>
            <CheckCircle2
              className="text-emerald-300"
              size={20}
            />
          </div>

          <p className="mt-4 text-3xl font-bold">
            {completedGoals}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Goals achieved
          </p>
        </div>

        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">
              Average progress
            </span>
            <Trophy className="text-amber-300" size={20} />
          </div>

          <p className="mt-4 text-3xl font-bold">
            {averageProgress}%
          </p>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-violet-400 transition-all"
              style={{ width: `${averageProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Search */}
      <div>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search goals by title, category, or description..."
          className={inputClass}
        />
      </div>

      {/* Goal list */}
      {filteredGoals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 px-6 py-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-400/10">
            <Target size={28} className="text-violet-300" />
          </div>

          <h2 className="text-lg font-semibold">
            {search
              ? "No matching goals"
              : "Your next chapter starts here"}
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">
            {search
              ? "Try another search term."
              : "Create your first goal and start tracking your progress."}
          </p>

          {!search && (
            <button
              type="button"
              onClick={openAddForm}
              className="mt-5 rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold hover:bg-violet-400"
            >
              Create your first goal
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filteredGoals.map((goal) => {
            const remaining = getDaysRemaining(
              goal.target_date
            );

            const isCompleted = goal.progress >= 100;

            return (
              <article
                key={goal.id}
                className={`${cardClass} transition hover:border-violet-400/30`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="inline-flex rounded-lg bg-violet-400/10 px-3 py-1 text-xs font-medium text-violet-300">
                      {goal.category}
                    </span>

                    <h2 className="mt-3 break-words text-lg font-semibold">
                      {goal.title}
                    </h2>

                    {goal.description && (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-gray-400">
                        {goal.description}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => openEditForm(goal)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white"
                      aria-label={`Edit ${goal.title}`}
                    >
                      <Pencil size={17} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteGoal(goal)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-500/10 hover:text-red-300"
                      aria-label={`Delete ${goal.title}`}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>

                {goal.target_date && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                    <CalendarDays size={15} />

                    <span>Target: {goal.target_date}</span>

                    <span className="text-gray-600">•</span>

                    {isCompleted ? (
                      <span className="text-emerald-300">
                        Achieved
                      </span>
                    ) : remaining < 0 ? (
                      <span className="text-red-300">
                        Past target date
                      </span>
                    ) : remaining === 0 ? (
                      <span className="text-amber-300">
                        Due today
                      </span>
                    ) : (
                      <span>{remaining} days left</span>
                    )}
                  </div>
                )}

                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                      Progress
                    </span>

                    <span className="text-sm font-semibold">
                      {goal.progress}%
                    </span>
                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted
                          ? "bg-emerald-400"
                          : "bg-violet-400"
                      }`}
                      style={{
                        width: `${goal.progress}%`,
                      }}
                    />
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={goal.progress}
                      onChange={(event) =>
                        updateProgress(
                          goal,
                          event.target.value
                        )
                      }
                      aria-label={`Progress for ${goal.title}`}
                      className="min-w-0 flex-1 accent-violet-400"
                    />

                    <span className="w-20 text-right text-xs text-gray-400">
                      {isCompleted
                        ? "Completed!"
                        : "Update progress"}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Add/Edit form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
          <div className="my-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#151827] p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">
                  {editingGoal
                    ? "Edit goal"
                    : "Create a goal"}
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                  Define what you want to achieve.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white"
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveGoal} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Goal title *
                </label>

                <input
                  required
                  maxLength={120}
                  value={form.title}
                  onChange={(event) =>
                    updateForm("title", event.target.value)
                  }
                  placeholder="e.g. Become a full-stack developer"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Description
                </label>

                <textarea
                  rows={3}
                  maxLength={1000}
                  value={form.description}
                  onChange={(event) =>
                    updateForm(
                      "description",
                      event.target.value
                    )
                  }
                  placeholder="Describe your goal and why it matters..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Category
                </label>

                <select
                  value={form.category}
                  onChange={(event) =>
                    updateForm("category", event.target.value)
                  }
                  className={inputClass}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Target date
                </label>

                <input
                  type="date"
                  value={form.target_date}
                  onChange={(event) =>
                    updateForm(
                      "target_date",
                      event.target.value
                    )
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm text-gray-300">
                    Current progress
                  </label>

                  <span className="text-sm font-semibold text-violet-300">
                    {form.progress}%
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={form.progress}
                  onChange={(event) =>
                    updateForm(
                      "progress",
                      Number(event.target.value)
                    )
                  }
                  className="w-full accent-violet-400"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-gray-300 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingGoal
                      ? "Save changes"
                      : "Create goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}