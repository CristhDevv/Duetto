"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Flame, Check, Loader2, Circle, CheckCircle2 } from "lucide-react";
import { useGlobalData } from "@/context/GlobalDataContext";
import { createClient } from "@/lib/supabase/client";
import * as LucideIcons from "lucide-react";
import toast from "react-hot-toast";

type Habit = {
  id: string;
  couple_id: string;
  title: string;
  description: string;
  type: string;
  assigned_to: string | null;
  frequency: string;
  frequency_days: number[];
  color: string;
  icon: string;
  streak_count: number;
};

type HabitLog = {
  id: string;
  habit_id: string;
  user_id: string;
  completed_date: string;
};

const IconByName = ({ name, className }: { name: string; className?: string }) => {
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.HelpCircle;
  return <IconComponent className={className} />;
};

export default function HabitsPage() {
  const router = useRouter();
  const { currentUser } = useGlobalData();
  const supabase = createClient();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.couple_id) {
      loadHabitsAndLogs();
    }
  }, [currentUser]);

  const loadHabitsAndLogs = async () => {
    if (!currentUser?.couple_id) return;
    try {
      setLoading(true);
      const [habitsRes, logsRes] = await Promise.all([
        supabase.from("habits").select("*").eq("couple_id", currentUser.couple_id).order("created_at", { ascending: false }),
        supabase.from("habit_logs").select("*").eq("completed_date", new Date().toISOString().split("T")[0])
      ]);

      if (habitsRes.data) setHabits(habitsRes.data);
      if (logsRes.data) setLogs(logsRes.data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar hábitos");
    } finally {
      setLoading(false);
    }
  };

  const getTodayDateString = () => new Date().toISOString().split("T")[0];

  const toggleHabit = async (habit: Habit) => {
    if (!currentUser) return;
    const today = getTodayDateString();
    const existingLog = logs.find(l => l.habit_id === habit.id && l.user_id === currentUser.id && l.completed_date === today);

    // Optimistic update
    let newLogs = [...logs];
    let newHabits = [...habits];
    let newStreak = habit.streak_count;

    if (existingLog) {
      newLogs = newLogs.filter(l => l.id !== existingLog.id);
      newStreak = Math.max(0, newStreak - 1);
    } else {
      const tempLog = { id: `temp-${Date.now()}`, habit_id: habit.id, user_id: currentUser.id, completed_date: today };
      newLogs.push(tempLog);
      newStreak += 1;
    }

    setLogs(newLogs);
    setHabits(newHabits.map(h => h.id === habit.id ? { ...h, streak_count: newStreak } : h));

    try {
      if (existingLog) {
        await supabase.from("habit_logs").delete().eq("id", existingLog.id);
      } else {
        await supabase.from("habit_logs").insert({
          habit_id: habit.id,
          user_id: currentUser.id,
          completed_date: today
        });
      }
      
      await supabase.from("habits").update({ streak_count: newStreak }).eq("id", habit.id);
    } catch (error) {
      console.error(error);
      toast.error("Error al sincronizar hábito");
      loadHabitsAndLogs(); // revert on error
    }
  };

  const isCompletedToday = (habitId: string) => {
    if (!currentUser) return false;
    return logs.some(l => l.habit_id === habitId && l.user_id === currentUser.id && l.completed_date === getTodayDateString());
  };

  if (loading) {
    return (
      <div className="min-h-full flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const sharedHabits = habits.filter(h => h.type === "shared");
  const individualHabits = habits.filter(h => h.type === "individual");

  const renderHabitCard = (habit: Habit) => {
    const completed = isCompletedToday(habit.id);
    
    return (
      <div 
        key={habit.id} 
        className={`flex items-center justify-between p-4 mb-3 border rounded-2xl transition-all shadow-sm ${
          completed ? "bg-surface border-transparent opacity-70" : "bg-white border-border"
        }`}
      >
        <div className="flex items-center flex-1 min-w-0">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center mr-4 shrink-0 shadow-sm"
            style={{ backgroundColor: \`\${habit.color}15\`, color: habit.color }}
          >
            <IconByName name={habit.icon} className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0 pr-4">
            <h3 className={`font-semibold text-sm truncate ${completed ? "text-secondary" : "text-primary"}`}>
              {habit.title}
            </h3>
            {habit.description && (
              <p className="text-xs text-secondary truncate mt-0.5">{habit.description}</p>
            )}
            <div className="flex items-center mt-2 space-x-1">
              <Flame className={`w-3.5 h-3.5 ${habit.streak_count > 0 ? "text-orange-500" : "text-gray-300"}`} />
              <span className={`text-xs font-bold ${habit.streak_count > 0 ? "text-orange-500" : "text-gray-400"}`}>
                {habit.streak_count} {habit.streak_count === 1 ? 'día' : 'días'}
              </span>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => toggleHabit(habit)}
          className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            completed ? "text-accent bg-accent/10" : "text-border hover:text-accent"
          }`}
        >
          {completed ? <CheckCircle2 className="w-8 h-8" /> : <Circle className="w-8 h-8" />}
        </button>
      </div>
    );
  };

  return (
    <div className="relative min-h-full pb-24">
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-border pt-6 pb-4 px-4">
        <h1 className="text-3xl font-bold text-primary">Hábitos</h1>
        <p className="text-sm text-secondary mt-1">Mantén tu racha al día</p>
      </div>

      <div className="p-4 mt-2">
        {sharedHabits.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-secondary uppercase tracking-wider mb-3">Compartidos</h2>
            {sharedHabits.map(renderHabitCard)}
          </div>
        )}

        {individualHabits.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-secondary uppercase tracking-wider mb-3">Individuales</h2>
            {individualHabits.map(renderHabitCard)}
          </div>
        )}

        {habits.length === 0 && (
          <div className="text-center py-12 px-4 bg-surface rounded-2xl border border-border border-dashed flex flex-col items-center mt-4">
            <Flame className="w-10 h-10 text-border mb-3" />
            <p className="text-secondary text-sm mb-4">Aún no tienen hábitos creados.</p>
            <button
              onClick={() => router.push("/dashboard/habits/new")}
              className="px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-bold shadow-sm hover:bg-[#6855e0] transition-colors"
            >
              Crear primer hábito
            </button>
          </div>
        )}
      </div>

      <div className="fixed bottom-20 w-full max-w-md pointer-events-none flex justify-end px-4 z-40">
        <button
          onClick={() => router.push("/dashboard/habits/new")}
          className="pointer-events-auto w-14 h-14 bg-accent text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#6855e0] transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
