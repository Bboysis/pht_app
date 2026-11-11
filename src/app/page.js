 "use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AnalyticsDashboard from "../../components/analytics/AnalyticsDashboard";
import HabitsDashboard from "../../components/habits/HabitsDashboard";
import PlannerDashboard from "../../components/planner/PlannerDashboard";
import TasksDashboard from "../../components/tasks/TasksDashboard";
import GoalsDashboard from "../../components/goals/GoalsDashboard";
import {
  Activity,
  Bell,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Flame,
  LayoutDashboard,
  ListTodo,
  Menu,
  Plus,
  Search,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  X,
} from "lucide-react";

const supabase = createClient();

function getWeekDate(dayIndex) {
  const today = new Date();
  const monday = new Date(today);
  const mondayOffset = (today.getDay() + 6) % 7;
  monday.setDate(today.getDate() - mondayOffset);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() + dayIndex);

  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
}

function mapHabitFromDatabase(habit) {
  return {
    id: habit.id,
    name: habit.name,
    category: habit.category || "Personal",
    color: habit.color || "#A78BFA",
    days: Array.isArray(habit.schedule?.days)
      ? habit.schedule.days
      : [],
  };
}

function mapTaskFromDatabase(task) {
  return {
    id: task.id,
    title: task.title,
    category: task.category || "Personal",
    priority:
      task.priority === "high"
        ? "High"
        : task.priority === "low"
          ? "Low"
          : "Normal",
    completed: task.status === "completed",
  };
}

const STORAGE_KEY = "pht-app-data-v1";

const initialHabits = [
  {
    id: 1,
    name: "Gym workout",
    category: "Fitness",
    color: "#A78BFA",
    days: [0, 1, 2, 3, 4],
  },
  {
    id: 2,
    name: "Swimming",
    category: "Fitness",
    color: "#38BDF8",
    days: [5],
  },
  {
    id: 3,
    name: "Play football",
    category: "Fitness",
    color: "#4ADE80",
    days: [6],
  },
  {
    id: 4,
    name: "Studying",
    category: "Learning",
    color: "#FBBF24",
    days: [2],
  },
  {
    id: 5,
    name: "Church",
    category: "Personal",
    color: "#FB7185",
    days: [6],
  },
  {
    id: 6,
    name: "Drink 2L water",
    category: "Health",
    color: "#60A5FA",
    days: [0, 1, 2, 3, 4, 5, 6],
  },
];

const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const initialTasks = [
  {
    id: 1,
    title: "Review study materials",
    category: "Learning",
    priority: "High",
    completed: false,
  },
  {
    id: 2,
    title: "Prepare gym clothes",
    category: "Fitness",
    priority: "Normal",
    completed: false,
  },
  {
    id: 3,
    title: "Plan next week's activities",
    category: "Personal",
    priority: "Normal",
    completed: true,
  },
];

function loadSavedData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return {
        habits: initialHabits,
        tasks: initialTasks,
        completedHabits: {},
        selectedDay: 2,
      };
    }

    const parsed = JSON.parse(saved);

    return {
      habits: Array.isArray(parsed.habits)
        ? parsed.habits
        : initialHabits,
      tasks: Array.isArray(parsed.tasks)
        ? parsed.tasks
        : initialTasks,
      completedHabits:
        parsed.completedHabits &&
        typeof parsed.completedHabits === "object"
          ? parsed.completedHabits
          : {},
      selectedDay:
        Number.isInteger(parsed.selectedDay) &&
        parsed.selectedDay >= 0 &&
        parsed.selectedDay <= 6
          ? parsed.selectedDay
          : 2,
    };
  } catch {
    return {
      habits: initialHabits,
      tasks: initialTasks,
      completedHabits: {},
      selectedDay: 2,
    };
  }
}

export default function Home() {
  const [habits, setHabits] = useState(initialHabits);
  const [tasks, setTasks] = useState(initialTasks);
  const [showTaskForm, setShowTaskForm] = useState(false);
const [taskName, setTaskName] = useState("");
const [taskPriority, setTaskPriority] = useState("medium");
const [editingTaskId, setEditingTaskId] = useState(null);
  const [completedHabits, setCompletedHabits] = useState({});
  const [selectedDay, setSelectedDay] = useState(2);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [habitName, setHabitName] = useState("");
  const [habitCategory, setHabitCategory] = useState("Personal");
  const [search, setSearch] = useState("");
  const [taskFilter, setTaskFilter] = useState("all");
  const [taskSort, setTaskSort] = useState("default");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const [isLoaded, setIsLoaded] = useState(false);

  // Load local data first, then sync with Supabase when signed in.
  useEffect(() => {
    let cancelled = false;

    async function loadDashboardData() {
      const saved = loadSavedData();

      if (!cancelled) {
        setHabits(saved.habits);
        setTasks(saved.tasks);
        setCompletedHabits(saved.completedHabits);
        setSelectedDay(saved.selectedDay);
      }

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        // Keep the dashboard usable during development if there is no session.
        if (!user) {
          if (!cancelled) {
            setNotice(
              "You're using local mode. Sign in to sync your data with Supabase."
            );
            setIsLoaded(true);
          }
          return;
        }
        let { data: dbHabits, error: habitsError } = await supabase
          .from("habits")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_archived", false)
          .order("created_at", { ascending: true });

        if (habitsError) throw habitsError;

        // Seed an empty habits table from the saved browser data.
        if (!dbHabits || dbHabits.length === 0) {
          const habitsToSeed =
            saved.habits?.length > 0 ? saved.habits : initialHabits;

          const { error: seedHabitsError } = await supabase
            .from("habits")
            .insert(
              habitsToSeed.map((habit) => ({
                user_id: user.id,
                name: habit.name,
                category: habit.category || "Personal",
                color: habit.color || "#A78BFA",
                habit_type: "recurring",
                schedule: {
                  days: Array.isArray(habit.days)
                    ? habit.days
                    : [0, 1, 2, 3, 4, 5, 6],
                },
                start_date: getWeekDate(0),
                is_archived: false,
              }))
            );

          if (seedHabitsError) throw seedHabitsError;

          const result = await supabase
            .from("habits")
            .select("*")
            .eq("user_id", user.id)
            .eq("is_archived", false)
            .order("created_at", { ascending: true });

          if (result.error) throw result.error;
          dbHabits = result.data;
        }

        let { data: dbTasks, error: tasksError } = await supabase
          .from("tasks")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_archived", false)
          .order("created_at", { ascending: true });

        if (tasksError) throw tasksError;

        // Seed an empty tasks table from saved browser tasks or starter tasks.
        if (!dbTasks || dbTasks.length === 0) {
          const tasksToSeed =
            saved.tasks?.length > 0 ? saved.tasks : initialTasks;

          const { error: seedTasksError } = await supabase
            .from("tasks")
            .insert(
              tasksToSeed.map((task) => ({
                user_id: user.id,
                title: task.title,
                category: task.category || "Personal",
                task_type: "one_time",
                scheduled_date: getWeekDate(0),
                priority:
                  task.priority === "High"
                    ? "high"
                    : task.priority === "Low"
                      ? "low"
                      : "medium",
                status: task.completed ? "completed" : "pending",
                is_archived: false,
              }))
            );

          if (seedTasksError) throw seedTasksError;

          const result = await supabase
            .from("tasks")
            .select("*")
            .eq("user_id", user.id)
            .eq("is_archived", false)
            .order("created_at", { ascending: true });

          if (result.error) throw result.error;
          dbTasks = result.data;
        }

        // Load this week's habit completion records.
        const weekStart = getWeekDate(0);
        const weekEnd = getWeekDate(6);

        const {
          data: occurrences,
          error: occurrencesError,
        } = await supabase
          .from("habit_occurrences")
          .select("habit_id, occurrence_date, status")
          .eq("user_id", user.id)
          .gte("occurrence_date", weekStart)
          .lte("occurrence_date", weekEnd);

        if (occurrencesError) throw occurrencesError;

        const completionMap = {};

        (occurrences || []).forEach((occurrence) => {
          const dayIndex = Array.from(
            { length: 7 },
            (_, index) => index
          ).find(
            (index) =>
              getWeekDate(index) === occurrence.occurrence_date
          );
          if (dayIndex !== undefined) {
            completionMap[`${occurrence.habit_id}-${dayIndex}`] =
              occurrence.status === "completed";
          }
        });

        if (!cancelled) {
          setHabits((dbHabits || []).map(mapHabitFromDatabase));
          setTasks((dbTasks || []).map(mapTaskFromDatabase));
          setCompletedHabits(completionMap);
          setNotice("Your habits and tasks are synced with Supabase.");
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error);

        if (!cancelled) {
          setNotice(
            `Supabase sync failed: ${
              error?.message || "Unknown database error"
            }`
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoaded(true);
        }
      }
    }

    loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, []);

  // Keep a local browser backup.
  useEffect(() => {
    if (!isLoaded) return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          habits,
          tasks,
          completedHabits,
          selectedDay,
        })
      );
    } catch (error) {
      console.error("Could not save local backup:", error);
    }
  }, [habits, tasks, completedHabits, selectedDay, isLoaded]);
  const scheduledHabits = habits.filter((habit) =>
    habit.days.includes(selectedDay)
  );

  const completedCount = scheduledHabits.filter(
    (habit) => completedHabits[`${habit.id}-${selectedDay}`]
  ).length;

  const completionRate = scheduledHabits.length
    ? Math.round((completedCount / scheduledHabits.length) * 100)
    : 0;

  const completedTasks = tasks.filter((task) => task.completed).length;

  async function toggleHabit(habitId, dayIndex) {
    const key = `${habitId}-${dayIndex}`;
    const willComplete = !completedHabits[key];

    setCompletedHabits((previous) => ({
      ...previous,
      [key]: willComplete,
    }));

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user || typeof habitId !== "string") {
        setNotice("Habit updated locally. Sign in to sync it to Supabase.");
        return;
      }

      const occurrenceDate = getWeekDate(dayIndex);

      const { data: existing, error: findError } = await supabase
        .from("habit_occurrences")
        .select("id")
        .eq("user_id", user.id)
        .eq("habit_id", habitId)
        .eq("occurrence_date", occurrenceDate)
        .maybeSingle();

      if (findError) throw findError;

      if (existing) {
        const { error } = await supabase
          .from("habit_occurrences")
          .update({
            status: willComplete ? "completed" : "pending",
            completed_at: willComplete
              ? new Date().toISOString()
              : null,
          })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("habit_occurrences")
          .insert({
            user_id: user.id,
            habit_id: habitId,
            occurrence_date: occurrenceDate,
            status: willComplete ? "completed" : "pending",
            completed_at: willComplete
              ? new Date().toISOString()
              : null,
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error("PHT-APP habit save error:", error);

      setNotice(
        `Could not sync habit completion: ${
          error.message || "Unknown error"
        }`
      );
    }
  }

  async function toggleTask(taskId) {
  const task = tasks.find((item) => item.id === taskId);

  if (!task) return;

  const completed = !task.completed;

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;

    // Update locally if the user is not signed in
    // or the task has a local-only ID.
    if (!user || typeof taskId !== "string" || taskId.startsWith("local-")) {
      setTasks((previous) =>
        previous.map((item) =>
          item.id === taskId ? { ...item, completed } : item
        )
      );

      setNotice("Task updated locally. Sign in to sync it to Supabase.");
      return;
    }

    // Save the completion status to Supabase first.
    const { error } = await supabase
      .from("tasks")
      .update({
        status: completed ? "completed" : "pending",
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq("id", taskId)
      .eq("user_id", user.id);

    if (error) throw error;

    // Update the dashboard after the database update succeeds.
    setTasks((previous) =>
      previous.map((item) =>
        item.id === taskId ? { ...item, completed } : item
      )
    );

    setNotice(
      completed
        ? "Task completed and saved!"
        : "Task marked as pending and saved!"
    );
  } catch (error) {
    console.error("PHT-APP task update error:", error);

    setNotice(
      `Could not update task: ${error.message || "Unknown error"}`
    );
  }
}


  async function addHabit(event) {
    event.preventDefault();

    const name = habitName.trim();

    if (!name) return;

    const colors = {
      Fitness: "#A78BFA",
      Health: "#60A5FA",
      Learning: "#FBBF24",
      Personal: "#FB7185",
    };

    const newHabit = {
      name,
      category: habitCategory,
      color: colors[habitCategory] || "#A78BFA",
      days: [0, 1, 2, 3, 4, 5, 6],
    };

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (user) {
        const { data, error } = await supabase
          .from("habits")
          .insert({
            user_id: user.id,
            name: newHabit.name,
            category: newHabit.category,
            color: newHabit.color,
            habit_type: "recurring",
            schedule: { days: newHabit.days },
            start_date: getWeekDate(0),
            is_archived: false,
          })
          .select("*")
          .single();

        if (error) throw error;

        setHabits((previous) => [
          ...previous,
          mapHabitFromDatabase(data),
        ]);

        setNotice("Habit added and saved to Supabase.");
      } else {
        setHabits((previous) => [
          ...previous,
          { ...newHabit, id: `local-${Date.now()}` },
        ]);

        setNotice("Habit added locally. Sign in to sync with Supabase.");
      }
    } catch (error) {
      console.error("PHT-APP habit insert error:", error);

      setNotice(
        `Could not save habit: ${error.message || "Unknown error"}`
      );

      return;
    }

    setHabitName("");
    setHabitCategory("Personal");
    setShowHabitForm(false);
  }
async function addTask(event) {
  event?.preventDefault();

  const title = taskName.trim();

  if (!title) {
    setNotice("Please enter a task name.");
    return;
  }

  const newTask = {
    id: `local-${Date.now()}`,
    title,
    category: "Personal",
    priority: taskPriority,
    completed: false,
  };

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;

    if (user) {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          user_id: user.id,
          title,
          category: "Personal",
          task_type: "one_time",
          scheduled_date: getWeekDate(0),
          priority: taskPriority,
          status: "pending",
          is_archived: false,
        })
        .select("*")
        .single();

      if (error) throw error;

      setTasks((previous) => [
        ...previous,
        mapTaskFromDatabase(data),
      ]);

      setNotice("Task added and saved successfully!");
    } else {
      setTasks((previous) => [...previous, newTask]);

      setNotice("Task added locally. Sign in to sync with Supabase.");
    }

    setTaskName("");
    setTaskPriority("medium");
    setShowTaskForm(false);
  } catch (error) {
    console.error("PHT-APP task insert error:", error);
    setNotice(`Could not save task: ${error.message || "Unknown error"}`);
  }
}
function startEditingTask(task) {
  setEditingTaskId(task.id);
  setTaskName(task.title);
  setTaskPriority(
    task.priority === "High"
      ? "high"
      : task.priority === "Low"
        ? "low"
        : "medium"
  );
  setShowTaskForm(true);
}
async function updateTask(event) {
  event.preventDefault();

  const title = taskName.trim();

  if (!title) {
    setNotice("Please enter a task name.");
    return;
  }


  const taskId = editingTaskId;
  const updatedFields = {
    title,
    priority: taskPriority,
  };

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;

    if (!user || String(taskId).startsWith("local-")) {
      setTasks((previous) =>
        previous.map((task) =>
          task.id === taskId
            ? {
                ...task,
                ...updatedFields,
                priority:
                  taskPriority === "high"
                    ? "High"
                    : taskPriority === "low"
                      ? "Low"
                      : "Normal",
              }
            : task
        )
      );

      setNotice("Task updated locally. Sign in to sync it to Supabase.");
    } else {
      const { data, error } = await supabase
        .from("tasks")
        .update(updatedFields)
        .eq("id", taskId)
        .eq("user_id", user.id)
        .select("*")
        .single();

      if (error) throw error;

      setTasks((previous) =>
        previous.map((task) =>
          task.id === taskId ? mapTaskFromDatabase(data) : task
        )
      );

      setNotice("Task updated and saved successfully!");
    }

    setEditingTaskId(null);
    setTaskName("");
    setTaskPriority("medium");
    setShowTaskForm(false);
  } catch (error) {
    console.error("PHT-APP task update error:", error);
    setNotice(`Could not update task: ${error.message || "Unknown error"}`);
  }
}
  async function deleteTask(taskId) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this task?"
  );

  if (!confirmed) return;

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;

    if (!user || String(taskId).startsWith("local-")) {
      setTasks((previous) =>
        previous.filter((task) => task.id !== taskId)
      );

      setNotice("Task deleted locally. Sign in to sync with Supabase.");
      return;
    }

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId)
      .eq("user_id", user.id);

    if (error) throw error;

    setTasks((previous) =>
      previous.filter((task) => task.id !== taskId)
    );

    setNotice("Task deleted successfully!");
  } catch (error) {
    console.error("PHT-APP task deletion error:", error);

    setNotice(
      `Could not delete task: ${error.message || "Unknown error"}`
    );
  }
}


  const navigation = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Habits", icon: Activity },
    { name: "Planner", icon: CalendarDays },
    { name: "Tasks", icon: ListTodo },
    { name: "Analytics", icon: TrendingUp },
  ];

   const filteredTasks = tasks
  .filter((task) => {
    const matchesSearch = task.title
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesFilter =
      taskFilter === "all" ||
      (taskFilter === "pending" && !task.completed) ||
      (taskFilter === "completed" && task.completed) ||
      (taskFilter === "high" && task.priority === "High");

    return matchesSearch && matchesFilter;
  })
  .sort((a, b) => {
    if (taskSort === "name") {
      return a.title.localeCompare(b.title);
    }

    if (taskSort === "priority") {
      const priorityRank = {
        High: 3,
        Normal: 2,
        Low: 1,
      };

      return (
        (priorityRank[b.priority] || 0) -
        (priorityRank[a.priority] || 0)
      );
    }

    if (taskSort === "status") {
      return Number(a.completed) - Number(b.completed);
    }

    return 0;
  });
 // Analytics statistics
const totalTasks = tasks.length;

 

const pendingTasks = tasks.filter(
  (task) => !task.completed
).length;

 

const highPriorityTasks = tasks.filter(
  (task) => task.priority === "High"
).length;

const normalPriorityTasks = tasks.filter(
  (task) => task.priority === "Normal"
).length;

const lowPriorityTasks = tasks.filter(
  (task) => task.priority === "Low"
).length;


  return (
    <div className="min-h-screen bg-[#0B0C10] text-zinc-200">
      {menuOpen && (
        <button
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/[0.07] bg-[#0D0F13] p-5 transition-transform lg:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500 text-white">
            <Activity size={23} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">
              PHT<span className="text-violet-400">-APP</span>
            </h2>

            <p className="text-[10px] uppercase tracking-widest text-zinc-500">
              Personal Habit Tracker
            </p>
          </div>
          <button
            className="ml-auto text-zinc-400 lg:hidden"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation"
          >
            <X size={19} />
          </button>
        </div>

        <p className="mb-3 mt-10 px-3 text-[10px] uppercase tracking-[0.2em] text-zinc-600">
          Workspace
        </p>

        <nav className="space-y-1">
          {navigation.map(({ name, icon: Icon }) => (
            <button
              key={name}
              onClick={() => {
  setActiveNav(name);
  setMenuOpen(false);
  setNotice("");
}}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                activeNav === name
                  ? "bg-violet-500/10 text-violet-300"
                  : "text-zinc-500 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <Icon size={18} />
              {name}

              {activeNav === name && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-400" />
              )}
            </button>
          ))}
        </nav>
        <p className="mb-3 mt-8 px-3 text-[10px] uppercase tracking-[0.2em] text-zinc-600">
          Personal
        </p>

        <button
          onClick={() =>
            setNotice("Goals will be implemented in a later phase.")
          }
          className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-zinc-500 hover:bg-white/[0.04] hover:text-white"
        >
          <Trophy size={18} />
          Goals
        </button>

        <button
          onClick={() =>
            setNotice("Settings will be implemented in a later phase.")
          }
          className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-zinc-500 hover:bg-white/[0.04] hover:text-white"
        >
          <Settings size={18} />
          Settings
        </button>

        <div className="mt-auto rounded-2xl border border-violet-400/15 bg-violet-500/[0.07] p-4">
          <Sparkles size={21} className="text-violet-300" />

          <p className="mt-3 text-sm font-semibold text-white">
            Small steps, big change.
          </p>

          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Build consistency one day at a time.
          </p>
        </div>

        <div className="mt-5 flex items-center gap-3 border-t border-white/[0.07] pt-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500 font-semibold text-white">
            P
          </div>

          <div>
            <p className="text-sm text-white">My workspace</p>

            <p className="text-xs text-zinc-500">
              {isLoaded
                ? "Supabase-connected workspace"
                : "Loading your data..."}
            </p>
          </div>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-64">
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-white/[0.07] bg-[#0B0C10]/95 px-4 backdrop-blur-xl sm:px-7">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg border border-white/10 p-2 text-zinc-400 lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={19} />
            </button>

            <div>
              <p className="text-xs text-zinc-500">
                Workspace / {activeNav}
              </p>

              <h1 className="mt-1 text-lg font-semibold text-white sm:text-xl">
                {activeNav === "Dashboard"
                  ? "Your dashboard"
                  : activeNav}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative hidden sm:block">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />

              <input
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-48 rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-400/40"
              />
            </div>

            <button
              onClick={() =>
                setNotice("Notifications will be implemented in a later phase.")
              }
              className="relative rounded-xl border border-white/[0.08] p-2.5 text-zinc-400 transition hover:bg-white/[0.05] hover:text-white"
              aria-label="Notifications"
            >
              <Bell size={18} />
            </button>

            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-violet-400/20 bg-violet-500/10 text-sm font-semibold text-violet-300">
              P
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-7xl p-4 sm:p-7">
          {notice && (
            <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-violet-400/20 bg-violet-500/[0.07] px-4 py-3 text-sm text-violet-200">
              <span>{notice}</span>

              <button
                onClick={() => setNotice("")}
                className="shrink-0 text-violet-300 hover:text-white"
                aria-label="Dismiss notification"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {activeNav === "Dashboard" && (
            <>
              <section className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-[#171525] via-[#11121B] to-[#101116] p-6 sm:p-9">
                <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />

                <div className="relative z-10 flex flex-col justify-between gap-7 sm:flex-row sm:items-center">
                  <div>
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/[0.08] px-3 py-1.5 text-xs text-violet-300">
                      <Sparkles size={14} />
                      Your personal growth space
                    </div>

                    <h2 className="max-w-xl text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
                      Make today count.
                      <br />
                      <span className="text-violet-300">
                        Build your best self.
                      </span>
                    </h2>

                    <p className="mt-4 max-w-lg text-sm leading-6 text-zinc-400">
                      Small actions, repeated consistently, create meaningful
                      change. Keep showing up for yourself.
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-white/[0.08] bg-black/20 p-5">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300">
                      <Flame size={28} />
                    </div>

                    <div>
                      <p className="text-3xl font-bold text-white">
                        {completionRate}%
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        Daily completion
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/[0.07] bg-[#111217] p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">
                      Total habits
                    </span>

                    <div className="rounded-xl bg-violet-500/10 p-2.5 text-violet-300">
                      <Activity size={19} />
                    </div>
                  </div>

                  <p className="mt-5 text-3xl font-bold text-white">
                    {habits.length}
                  </p>

                  <p className="mt-2 text-xs text-zinc-500">
                    Habits in your routine
                  </p>
                </div>

                <div className="rounded-2xl border border-white/[0.07] bg-[#111217] p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">
                      Completed today
                    </span>

                    <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-300">
                      <Check size={19} />
                    </div>
                  </div>
                  <p className="mt-5 text-3xl font-bold text-white">
                    {completedCount}
                    <span className="ml-1 text-base font-medium text-zinc-500">
                      / {scheduledHabits.length}
                    </span>
                  </p>

                  <p className="mt-2 text-xs text-zinc-500">
                    Scheduled habits completed
                  </p>
                </div>

                <div className="rounded-2xl border border-white/[0.07] bg-[#111217] p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">
                      Tasks completed
                    </span>

                    <div className="rounded-xl bg-sky-500/10 p-2.5 text-sky-300">
                      <ListTodo size={19} />
                    </div>
                  </div>

                  <p className="mt-5 text-3xl font-bold text-white">
                    {completedTasks}
                    <span className="ml-1 text-base font-medium text-zinc-500">
                      / {tasks.length}
                    </span>
                  </p>

                  <p className="mt-2 text-xs text-zinc-500">
                    Tasks checked off
                  </p>
                </div>

                <div className="rounded-2xl border border-white/[0.07] bg-[#111217] p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">
                      Weekly progress
                    </span>

                    <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-300">
                      <Target size={19} />
                    </div>
                  </div>

                  <p className="mt-5 text-3xl font-bold text-white">
                    {completionRate}%
                  </p>

                  <p className="mt-2 text-xs text-zinc-500">
                    Based on the selected day
                  </p>
                </div>
              </section>
              <section className="mt-8">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      Your weekly habits
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      Stay consistent, one day at a time.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowHabitForm((previous) => !previous)}
                    className="flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400"
                  >
                    {showHabitForm ? <X size={17} /> : <Plus size={17} />}
                    {showHabitForm ? "Cancel" : "Add habit"}
                  </button>
                </div>

                {showHabitForm && (
                  <form
                    onSubmit={addHabit}
                    className="mb-5 rounded-2xl border border-white/[0.08] bg-[#111217] p-5"
                  >
                    <h3 className="mb-4 font-semibold text-white">
                      Create a new habit
                    </h3>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm text-zinc-400">
                          Habit name
                        </label>

                        <input
                          value={habitName}
                          onChange={(event) =>
                            setHabitName(event.target.value)
                          }
                          placeholder="e.g. Read for 30 minutes"
                          required
                          className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-400/50"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm text-zinc-400">
                          Category
                        </label>

                        <select
                          value={habitCategory}
                          onChange={(event) =>
                            setHabitCategory(event.target.value)
                          }
                          className="w-full rounded-xl border border-white/10 bg-[#17181F] px-4 py-3 text-sm text-white outline-none focus:border-violet-400/50"
                        >
                          <option value="Personal">Personal</option>
                          <option value="Fitness">Fitness</option>
                          <option value="Health">Health</option>
                          <option value="Learning">Learning</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="mt-4 rounded-xl bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400"
                    >
                      Save habit
                    </button>
                  </form>
                )}

                <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111217]">
                  <div className="grid grid-cols-[minmax(110px,1fr)_repeat(7,minmax(32px,1fr))] border-b border-white/[0.07] px-3 py-4 sm:px-5">
                    <span className="text-xs font-medium text-zinc-500">
                      HABIT
                    </span>

                    {days.map((day, index) => (
                      <button
                        key={day}
                      onClick={() => setSelectedDay(index)}
                        className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-bold transition sm:h-9 sm:w-9 sm:text-xs ${
                          selectedDay === index
                            ? "bg-violet-500 text-white"
                            : "text-zinc-500 hover:bg-white/[0.06] hover:text-white"
                        }`}
                      >
                        {day.slice(0, 1)}
                      </button>
                    ))}
                  </div>

                  {habits
                    .filter((habit) =>
                      habit.name.toLowerCase().includes(search.toLowerCase())
                    )
                    .map((habit) => (
                      <div
                        key={habit.id}
                        className="grid grid-cols-[minmax(110px,1fr)_repeat(7,minmax(32px,1fr))] items-center border-b border-white/[0.05] px-3 py-4 last:border-b-0 sm:px-5"
                      >
                        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{
                              backgroundColor: habit.color || "#A78BFA",
                            }}
                          />

                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-zinc-200 sm:text-sm">
                              {habit.name}
                            </p>

                            <p className="mt-1 truncate text-[10px] text-zinc-500 sm:text-xs">
                              {habit.category}
                            </p>
                          </div>
                        </div>

                        {days.map((day, index) => {
                          const scheduled = habit.days.includes(index);
                          const completed =
                            !!completedHabits[`${habit.id}-${index}`];

                          return (
                            <div
                              key={day}
                              className="flex justify-center"
                            >
                              <button
                                disabled={!scheduled}
                                onClick={() => toggleHabit(habit.id, index)}
                                aria-label={`${habit.name}, ${day}, ${
                                  completed ? "completed" : "not completed"
                                }`}
                                className={`flex h-7 w-7 items-center justify-center rounded-lg border transition sm:h-8 sm:w-8 ${
                                  !scheduled
                                    ? "cursor-not-allowed border-transparent text-zinc-800"
                                    : completed
                                      ? "border-violet-400 bg-violet-500 text-white"
                                      : "border-white/10 text-zinc-600 hover:border-violet-400/50 hover:text-violet-300"
                                }`}
                              >
                                {completed && <Check size={15} />}
                                {!scheduled && (
                                  <span className="text-[10px]">·</span>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ))}

                  {habits.length === 0 && (
                    <div className="p-8 text-center">
                      <Activity
                        size={28}
                        className="mx-auto text-zinc-600"
                      />
                      <p className="mt-3 text-sm text-zinc-400">
                        No habits yet.
                      </p>
                      <p className="mt-1 text-xs text-zinc-600">
                        Add a habit to start building your routine.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/[0.07] bg-[#111217] p-4">
                  <div>
                    <p className="text-sm font-medium text-white">
                      Selected day progress
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {completedCount} of {scheduledHabits.length} scheduled
                      habits completed
                    </p>
                  </div>

                  <div className="relative flex h-12 w-12 items-center justify-center rounded-full border-4 border-white/[0.07]">
                    <span className="text-xs font-bold text-violet-300">
                      {completionRate}%
                    </span>

                    <span
                      className="absolute inset-[-4px] rounded-full border-4 border-violet-400"
                      style={{
                        clipPath: `inset(${100 - completionRate}% 0 0 0)`,
                      }}
                    />
                  </div>
                </div>
              </section>

              <section className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-2xl border border-white/[0.07] bg-[#111217] p-5 sm:p-6">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        Your tasks
                      </h2>
                      <p className="mt-1 text-xs text-zinc-500">
                        Keep track of what needs to get done.
                      </p>
                    </div>

                      <button
                       type="button"
                       onClick={() => setShowTaskForm(true)}
                        className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-violet-400/30 hover:text-white"
                                      >
                        <Plus size={15} />
                            Add task
                              </button>
                  </div>
                  {showTaskForm && (
   <form
  onSubmit={editingTaskId ? updateTask : addTask}
  className="mb-4 space-y-4 rounded-2xl border border-white/10 bg-zinc-900 p-5"
>
    <h3 className="text-lg font-semibold text-white">
      {editingTaskId ? "Edit task" : "Create a new task"}
    </h3>

    <div>
      <label
        htmlFor="taskName"
        className="mb-2 block text-sm text-zinc-300"
      >
        Task name
      </label>

      <input
        id="taskName"
        type="text"
        value={taskName}
        onChange={(event) => setTaskName(event.target.value)}
        placeholder="e.g. Study for my exam"
        autoFocus
        className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-violet-500"
      />
    </div>

    <div>
      <label
        htmlFor="taskPriority"
        className="mb-2 block text-sm text-zinc-300"
      >
        Priority
      </label>

      <select
        id="taskPriority"
        value={taskPriority}
        onChange={(event) => setTaskPriority(event.target.value)}
        className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
    </div>

    <div className="flex gap-3">
      <button
        type="submit"
        className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-violet-500"
      >
        Save task
      </button>

      <button
        type="button"
        onClick={() => {
  setShowTaskForm(false);
  setEditingTaskId(null);
  setTaskName("");
  setTaskPriority("medium");
}}
        className="rounded-xl border border-white/10 px-5 py-3 text-sm text-zinc-300 hover:bg-white/5"
      >
        Cancel
      </button>
    </div>
  </form>
)}


                  <div className="mb-5 flex items-center gap-3 rounded-xl border border-white/[0.07] bg-black/20 px-3 py-2.5 sm:hidden">
                    <Search size={16} className="text-zinc-500" />

                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search tasks..."
                      className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
                    />
                  </div>
                  <div className="mb-4 flex flex-wrap gap-2">
  {[
    { label: "All Tasks", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Completed", value: "completed" },
    { label: "High Priority", value: "high" },
  ].map((filter) => (
    
    <button
      key={filter.value}
      type="button"
      onClick={() => setTaskFilter(filter.value)}
      className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
        taskFilter === filter.value
          ? "border-violet-500/40 bg-violet-500/15 text-violet-300"
          : "border-white/10 text-zinc-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      {filter.label}
    </button>
  ))}
</div>
<div className="mb-4 flex items-center gap-3">
  <label
    htmlFor="taskSort"
    className="text-xs text-zinc-400"
  >
    Sort by
  </label>

  <select
    id="taskSort"
    value={taskSort}
    onChange={(event) => setTaskSort(event.target.value)}
    className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 outline-none focus:border-violet-500"
  >
    <option value="default">Default order</option>
    <option value="priority">Priority: High to Low</option>
    <option value="name">Task name: A–Z</option>
    <option value="status">Pending first</option>
  </select>
</div>



                  <div className="space-y-2">
                    {filteredTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.015] p-3 transition hover:bg-white/[0.035]"
                      >
                        <button
                          onClick={() => toggleTask(task.id)}
                          aria-label={
                            task.completed
                              ? `Mark ${task.title} incomplete`
                              : `Complete ${task.title}`
                              }
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                            task.completed
                              ? "border-emerald-400 bg-emerald-500 text-white"
                              : "border-white/20 text-transparent hover:border-violet-400"
                          }`}
                        >
                          {task.completed && <Check size={13} />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`truncate text-sm ${
                              task.completed
                                ? "text-zinc-600 line-through"
                                : "text-zinc-200"
                            }`}
                          >
                            {task.title}
                          </p>

                          <p className="mt-1 text-[11px] text-zinc-500">
                            {task.category}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-lg px-2 py-1 text-[10px] ${
                            task.priority === "High"
                              ? "bg-rose-500/10 text-rose-300"
                              : task.priority === "Low"
                                ? "bg-sky-500/10 text-sky-300"
                                : "bg-zinc-500/10 text-zinc-400"
                          }`}
                        >
                          {task.priority}
                        </span>
                        <button
  type="button"
  onClick={() => startEditingTask(task)}
  aria-label={`Edit ${task.title}`}
  className="shrink-0 rounded-lg px-2 py-1 text-xs text-violet-300 transition hover:bg-violet-500/10"
>
  Edit
</button>
<button
  type="button"
  onClick={() => deleteTask(task.id)}
  aria-label={`Delete ${task.title}`}
  className="shrink-0 rounded-lg px-2 py-1 text-xs text-rose-300 transition hover:bg-rose-500/10"
>
  Delete
</button>

                      </div>
                    ))}

                    {filteredTasks.length === 0 && (
                      <div className="py-8 text-center">
                        <ListTodo
                          size={27}
                          className="mx-auto text-zinc-600"
                        />
                        <p className="mt-3 text-sm text-zinc-400">
                          No matching tasks.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 border-t border-white/[0.07] pt-4">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="text-zinc-500">
                        Overall task completion
                      </span>

                      <span className="font-medium text-violet-300">
                        {tasks.length
                          ? Math.round(
                              (completedTasks / tasks.length) * 100
                            )
                          : 0}
                        %
                      </span>
                    </div>

                    <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-violet-400 transition-all"
                        style={{
                          width: `${
                            tasks.length
                              ? (completedTasks / tasks.length) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
          <div className="rounded-2xl border border-white/[0.07] bg-[#111217] p-5 sm:p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="rounded-xl bg-amber-500/10 p-3 text-amber-300">
                      <Target size={21} />
                    </div>

                    <div>
                      <h2 className="font-semibold text-white">
                        Your daily focus
                      </h2>
                      <p className="mt-1 text-xs text-zinc-500">
                        Make progress at your own pace.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-zinc-300">
                        Habits completed
                      </p>
                      <span className="text-sm font-semibold text-white">
                        {completedCount}/{scheduledHabits.length}
                      </span>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl border border-white/[0.06] bg-black/20 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-zinc-300">
                        Tasks completed
                      </p>

                      <span className="text-sm font-semibold text-white">
                        {completedTasks}/{tasks.length}
                      </span>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
                        style={{
                          width: `${
                            tasks.length
                              ? (completedTasks / tasks.length) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl border border-violet-400/10 bg-violet-500/[0.05] p-4">
                    <div className="flex items-start gap-3">
                      <Sparkles
                        size={19}
                        className="mt-0.5 shrink-0 text-violet-300"
                      />

                      <div>
                        <p className="text-sm font-medium text-white">
                          Keep going!
                        </p>

                        <p className="mt-1 text-xs leading-5 text-zinc-500">
                          You don't need to be perfect. Focus on showing up
                          consistently and making small improvements.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="mt-8 rounded-2xl border border-white/[0.07] bg-[#111217] p-5 sm:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-violet-500/10 p-3 text-violet-300">
                      <CalendarDays size={21} />
                    </div>

                    <div>
                      <h2 className="font-semibold text-white">
                        Your weekly rhythm
                      </h2>
                <p className="mt-1 text-xs text-zinc-500">
                        Review your habits throughout the week.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setSelectedDay((previous) =>
                          previous === 0 ? 6 : previous - 1
                        )
                      }
                      className="rounded-lg border border-white/10 p-2 text-zinc-400 transition hover:bg-white/[0.05] hover:text-white"
                      aria-label="Previous day"
                    >
                      <ChevronLeft size={17} />
                    </button>

                    <span className="min-w-20 text-center text-xs font-medium text-zinc-300">
                      {days[selectedDay]}
                    </span>

                    <button
                      onClick={() =>
                        setSelectedDay((previous) =>
                          previous === 6 ? 0 : previous + 1
                        )
                      }
                      className="rounded-lg border border-white/10 p-2 text-zinc-400 transition hover:bg-white/[0.05] hover:text-white"
                      aria-label="Next day"
                    >
                      <ChevronRight size={17} />
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-7 gap-2">
                  {days.map((day, index) => {
                    const dayHabits = habits.filter((habit) =>
                      habit.days.includes(index)
                    );

                    const dayCompleted = dayHabits.filter(
                      (habit) =>
                        completedHabits[`${habit.id}-${index}`]
                    ).length;

                    const percentage = dayHabits.length
                      ? Math.round(
                          (dayCompleted / dayHabits.length) * 100
                        )
                      : 0;

                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(index)}
                        className={`rounded-xl border p-2 text-center transition sm:p-4 ${
                          selectedDay === index
                            ? "border-violet-400/40 bg-violet-500/10"
                            : "border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.04]"
                        }`}
                      >
                        <p
                          className={`text-[10px] font-semibold sm:text-xs ${
                            selectedDay === index
                              ? "text-violet-300"
                              : "text-zinc-500"
                          }`}
                        >
                          {day}
                        </p>

                        <p className="mt-3 text-sm font-semibold text-white sm:text-lg">
                          {dayCompleted}
                          <span className="text-[10px] font-normal text-zinc-600 sm:text-xs">
                            /{dayHabits.length}
                          </span>
                        </p>

                        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.07]">
                          <div
                            className="h-full rounded-full bg-violet-400"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            </>
          )}
           {activeNav === "Analytics" && (
  <AnalyticsDashboard
    tasks={tasks}
    habits={habits}
  />
)} 
{activeNav === "Habits" && (
  <HabitsDashboard
    habits={habits}
    completedHabits={completedHabits}
    selectedDay={selectedDay}
    setSelectedDay={setSelectedDay}
    toggleHabit={toggleHabit}
    onAddHabit={() => setShowHabitForm(true)}
  />
)}
 {/* PLANNER */}
{activeNav === "Planner" && (
  <PlannerDashboard
    tasks={tasks}
    onToggleTask={toggleTask}
    onAddTask={() => {
      setEditingTaskId(null);
      setTaskName("");
      setTaskPriority("medium");
      setShowTaskForm(true);
      setActiveNav("Tasks");
    }}
  />
)}

{/* TASKS */}
{activeNav === "Tasks" && (
  <TasksDashboard
    tasks={tasks}
    onToggleTask={toggleTask}
    onEditTask={startEditingTask}
    onDeleteTask={deleteTask}
    onAddTask={() => {
      setEditingTaskId(null);
      setTaskName("");
      setTaskPriority("medium");
      setShowTaskForm(true);
    }}
  />
)}
 
 {activeNav === "Goals" && (
  <GoalsDashboard />
)}
  
 
            

          <footer className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] py-6 text-xs text-zinc-600 sm:flex-row">
            <p>
              © {new Date().getFullYear()} PHT-APP. Your growth, your journey.
            </p>

            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Personal workspace</span>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}         