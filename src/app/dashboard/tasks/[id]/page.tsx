"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Loader2, RefreshCw, Trash2, Check } from "lucide-react";
import { handleRecurringTask } from "@/lib/recurrence";

type Task = {
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

type Profile = {
  id: string;
  name: string;
  avatar_color: string;
  couple_id: string;
};

export default function EditTaskPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;
  const supabase = createClient();

  const [task, setTask] = useState<Task | null>(null);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [partner, setPartner] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    category: "Hogar",
    assignedTo: "",
    dueDate: "",
    points: 10,
    recurrence: "none" as "none" | "daily" | "weekly" | "monthly",
  });

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth"); return; }

    const { data: profile } = await supabase
      .from("users").select("*").eq("id", user.id).single();
    if (!profile) { router.push("/auth"); return; }
    setCurrentUser(profile);

    if (profile.couple_id) {
      const { data: pData } = await supabase
        .from("users").select("*")
        .eq("couple_id", profile.couple_id)
        .neq("id", profile.id).single();
      if (pData) setPartner(pData);
    }

    const { data: taskData } = await supabase
      .from("tasks").select("*").eq("id", taskId).single();
    if (taskData) {
      setTask(taskData);
      setForm({
        title: taskData.title,
        category: taskData.category,
        assignedTo: taskData.assigned_to,
        dueDate: taskData.due_date || "",
        points: taskData.points_value,
        recurrence: (taskData.recurrence as "none" | "daily" | "weekly" | "monthly") || "none",
      });
    }

    setLoading(false);
  }, [supabase, router, taskId]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !form.title.trim()) return;
    setIsSubmitting(true);

    const { error } = await supabase.from("tasks").update({
      title: form.title.trim(),
      category: form.category,
      assigned_to: form.assignedTo,
      due_date: form.dueDate || null,
      points_value: form.points,
      recurrence: form.recurrence,
    }).eq("id", task.id);

    setIsSubmitting(false);
    if (!error) router.push("/dashboard/tasks");
  };

  const handleToggleComplete = async () => {
    if (!task || !currentUser) return;
    const newStatus = !task.is_completed;
    setIsSubmitting(true);

    await supabase.from("tasks").update({
      is_completed: newStatus,
      completed_at: newStatus ? new Date().toISOString() : null,
    }).eq("id", task.id);

    const pointsChange = newStatus ? task.points_value : -task.points_value;
    const { data: userToUpdate } = await supabase
      .from("users").select("points").eq("id", task.assigned_to).single();
    if (userToUpdate) {
      await supabase.from("users")
        .update({ points: userToUpdate.points + pointsChange })
        .eq("id", task.assigned_to);
    }

    if (newStatus) {
      await handleRecurringTask(supabase, task);
    }

    setIsSubmitting(false);
    router.push("/dashboard/tasks");
  };

  const handleDelete = async () => {
    if (!task) return;
    setIsDeleting(true);
    await supabase.from("tasks").delete().eq("id", task.id);
    router.push("/dashboard/tasks");
  };

  const recurrenceOptions = [
    { value: "none", label: "Nunca" },
    { value: "daily", label: "Diaria" },
    { value: "weekly", label: "Semanal" },
    { value: "monthly", label: "Mensual" },
  ] as const;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
        <p className="text-secondary text-sm mb-4">Tarea no encontrada.</p>
        <button
          onClick={() => router.push("/dashboard/tasks")}
          className="px-5 py-3 bg-accent text-white rounded-2xl font-bold"
        >
          Volver a Tareas
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header fijo */}
      <header className="sticky top-0 z-30 bg-white border-b border-border flex items-center justify-between px-4 h-14 flex-shrink-0">
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-surface text-secondary hover:text-primary transition-colors mr-3"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-primary">Editar Tarea</h1>
        </div>

        {/* Botón de completar / descompletada */}
        <button
          onClick={handleToggleComplete}
          disabled={isSubmitting}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
            task.is_completed
              ? "bg-surface text-secondary hover:bg-border"
              : "bg-success/10 text-success hover:bg-success/20"
          }`}
        >
          <Check className="w-4 h-4" />
          {task.is_completed ? "Reabrirla" : "Completar"}
        </button>
      </header>

      {/* Formulario con scroll natural */}
      <form
        id="edit-form"
        onSubmit={handleSave}
        className="flex-1 overflow-y-auto px-5 pt-6 pb-36"
      >
        {/* Estado actual si está completada */}
        {task.is_completed && (
          <div className="mb-6 flex items-center gap-2 bg-success/10 border border-success/20 rounded-2xl px-4 py-3">
            <Check className="w-5 h-5 text-success flex-shrink-0" />
            <p className="text-sm font-medium text-success">Esta tarea ya está completada</p>
          </div>
        )}

        {/* Título */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
            Título de la tarea
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-4 py-4 bg-surface border border-border rounded-2xl text-base focus:outline-none focus:border-accent transition-colors"
            placeholder="Ej. Comprar pan…"
            required
          />
        </div>

        {/* Categoría */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
            Categoría
          </label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full px-4 py-4 bg-surface border border-border rounded-2xl text-base focus:outline-none focus:border-accent appearance-none transition-colors"
          >
            <option value="Hogar">🏠 Hogar</option>
            <option value="Compras">🛒 Compras</option>
            <option value="Trámites">📋 Trámites</option>
            <option value="Mascotas">🐾 Mascotas</option>
            <option value="Otros">✨ Otros</option>
          </select>
        </div>

        {/* Asignar a */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
            Asignada a
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, assignedTo: currentUser!.id })}
              className={`flex flex-col items-center py-4 rounded-2xl border-2 transition-all ${
                form.assignedTo === currentUser?.id
                  ? "border-accent bg-accent/5"
                  : "border-border bg-surface"
              }`}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base mb-2"
                style={{ backgroundColor: currentUser?.avatar_color || "#7C6AF7" }}
              >
                {currentUser?.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-primary">A mí</span>
            </button>

            {partner ? (
              <button
                type="button"
                onClick={() => setForm({ ...form, assignedTo: partner.id })}
                className={`flex flex-col items-center py-4 rounded-2xl border-2 transition-all ${
                  form.assignedTo === partner.id
                    ? "border-accent bg-accent/5"
                    : "border-border bg-surface"
                }`}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base mb-2"
                  style={{ backgroundColor: partner.avatar_color || "#EBEBEB" }}
                >
                  {partner.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-primary">{partner.name}</span>
              </button>
            ) : (
              <div className="flex flex-col items-center py-4 rounded-2xl border-2 border-border bg-surface opacity-40">
                <div className="w-10 h-10 rounded-full bg-border flex items-center justify-center text-white font-bold text-base mb-2">?</div>
                <span className="text-sm font-semibold text-secondary">Sin pareja</span>
              </div>
            )}
          </div>
        </div>

        {/* Puntos */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
            Puntos que otorga
          </label>
          <div className="flex items-center gap-3">
            {[5, 10, 20, 30, 50].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setForm({ ...form, points: p })}
                className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                  form.points === p
                    ? "border-accent bg-accent text-white"
                    : "border-border bg-surface text-secondary hover:border-accent"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <input
            type="number"
            value={form.points}
            onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) || 0 })}
            className="w-full mt-3 px-4 py-3 bg-surface border border-border rounded-2xl text-base focus:outline-none focus:border-accent transition-colors"
            min="0"
          />
        </div>

        {/* Fecha límite */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
            Fecha límite (opcional)
          </label>
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            className="w-full px-4 py-4 bg-surface border border-border rounded-2xl text-base focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        {/* Repetición */}
        <div className="mb-8">
          <label className="flex items-center gap-1.5 text-xs font-bold text-secondary uppercase tracking-wider mb-3">
            <RefreshCw className="w-3.5 h-3.5" />
            Repetición
          </label>
          <div className="grid grid-cols-4 gap-2">
            {recurrenceOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm({ ...form, recurrence: opt.value })}
                className={`py-3 px-1 rounded-xl text-xs font-semibold border-2 transition-all ${
                  form.recurrence === opt.value
                    ? "bg-accent text-white border-accent"
                    : "bg-surface text-secondary border-border hover:border-accent"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Zona de peligro — Eliminar */}
        <div className="border border-danger/20 rounded-2xl p-4">
          <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-3">Zona de peligro</p>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-danger/10 text-danger font-bold text-sm hover:bg-danger/20 transition-colors disabled:opacity-60"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Eliminar esta tarea
          </button>
        </div>
      </form>

      {/* Botón Guardar — sticky bottom */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-border px-5 py-4">
        <button
          type="submit"
          form="edit-form"
          disabled={isSubmitting || !form.title.trim()}
          className="w-full py-4 bg-accent text-white rounded-2xl text-base font-bold shadow-sm hover:bg-[#6855e0] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Guardar cambios"
          )}
        </button>
      </div>
    </div>
  );
}
