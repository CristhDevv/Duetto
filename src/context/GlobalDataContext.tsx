"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

export type Profile = {
  id: string;
  name: string;
  avatar_color: string;
  points: number;
  couple_id?: string;
};

export type Task = {
  id: string;
  couple_id: string;
  title: string;
  category: string;
  assigned_to: string;
  created_by: string | null;
  is_completed: boolean;
  points_value: number;
  due_date: string | null;
  recurrence: string;
  created_at: string;
};

interface GlobalDataContextType {
  currentUser: Profile | null;
  partner: Profile | null;
  tasks: Task[];
  loading: boolean;
  addOptimisticTask: (task: Partial<Task> & Omit<Task, 'id' | 'created_at'>) => void;
  toggleOptimisticTask: (task: Task) => void;
  refreshData: () => Promise<void>;
  loadPartnerTasks: () => Promise<void>;
  updateUserPoints: (userId: string, pointsChange: number) => void;
}

const GlobalDataContext = createContext<GlobalDataContextType | undefined>(undefined);

export function GlobalDataProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [partner, setPartner] = useState<Profile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single();
      if (!profile) {
        setLoading(false);
        return;
      }
      setCurrentUser(profile);

      if (profile.couple_id) {
        const { data: pData } = await supabase
          .from("users").select("*")
          .eq("couple_id", profile.couple_id)
          .neq("id", profile.id).maybeSingle();
        if (pData) setPartner(pData);

        // Por defecto traemos solo las tareas asignadas al usuario actual para optimizar
        const { data: tData } = await supabase
          .from("tasks").select("*")
          .eq("couple_id", profile.couple_id)
          .eq("assigned_to", user.id)
          .order("created_at", { ascending: false });
        if (tData) setTasks(tData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addOptimisticTask = async (newTaskData: Partial<Task> & Omit<Task, 'id' | 'created_at'>) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticTask: Task = {
      ...newTaskData,
      id: tempId,
      created_at: new Date().toISOString(),
      due_date: newTaskData.due_date || null,
      created_by: newTaskData.created_by || null,
    };

    setTasks(prev => [optimisticTask, ...prev]);

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        couple_id: newTaskData.couple_id,
        title: newTaskData.title,
        category: newTaskData.category,
        assigned_to: newTaskData.assigned_to,
        created_by: newTaskData.created_by,
        points_value: newTaskData.points_value,
        due_date: newTaskData.due_date,
        recurrence: newTaskData.recurrence,
        is_completed: false,
      })
      .select()
      .single();

    if (error) {
      setTasks(prev => prev.filter(t => t.id !== tempId));
      toast.error("Error al crear tarea");
    } else if (data) {
      setTasks(prev => prev.map(t => t.id === tempId ? data : t));
    }
  };

  const updateUserPoints = (userId: string, pointsChange: number) => {
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, points: prev.points + pointsChange } : prev);
    } else if (partner?.id === userId) {
      setPartner(prev => prev ? { ...prev, points: prev.points + pointsChange } : prev);
    }
  };

  const toggleOptimisticTask = async (task: Task) => {
    const newStatus = !task.is_completed;
    
    // Actualización optimista local
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_completed: newStatus } : t));
    const pointsChange = newStatus ? task.points_value : -task.points_value;
    updateUserPoints(task.assigned_to, pointsChange);

    // Llamada a background
    const { error } = await supabase.from("tasks").update({
      is_completed: newStatus,
      completed_at: newStatus ? new Date().toISOString() : null,
    }).eq("id", task.id);

    if (error) {
      // Revertir en caso de error
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_completed: !newStatus } : t));
      updateUserPoints(task.assigned_to, -pointsChange);
      toast.error("Error al sincronizar tarea");
      return;
    }

    // Actualizar puntos de usuario si no hubo error
    const userToUpdate = task.assigned_to === currentUser?.id ? currentUser : partner;
    if (userToUpdate) {
      await supabase.from("users")
        .update({ points: userToUpdate.points + pointsChange })
        .eq("id", task.assigned_to);
    }
  };

  const loadPartnerTasks = async () => {
    if (!currentUser?.couple_id) return;
    const { data: pTasks } = await supabase
      .from("tasks").select("*")
      .eq("couple_id", currentUser.couple_id)
      .neq("assigned_to", currentUser.id)
      .order("created_at", { ascending: false });
    
    if (pTasks) {
      setTasks(prev => {
        const existingIds = new Set(prev.map(t => t.id));
        const newTasks = pTasks.filter(t => !existingIds.has(t.id));
        return [...prev, ...newTasks];
      });
    }
  };

  return (
    <GlobalDataContext.Provider value={{
      currentUser,
      partner,
      tasks,
      loading,
      addOptimisticTask,
      toggleOptimisticTask,
      refreshData: loadData,
      loadPartnerTasks,
      updateUserPoints
    }}>
      {children}
    </GlobalDataContext.Provider>
  );
}

export function useGlobalData() {
  const context = useContext(GlobalDataContext);
  if (context === undefined) {
    throw new Error("useGlobalData must be used within a GlobalDataProvider");
  }
  return context;
}
