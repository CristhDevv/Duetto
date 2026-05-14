"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";

type Profile = {
  id: string;
  name: string;
  avatar_color: string;
  couple_id: string;
};

export default function NewTaskPage() {
  const router = useRouter();
  const supabase = createClient();

  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [partner, setPartner] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    category: "Hogar",
    assignedTo: "",
    dueDate: "",
    points: 10,
    recurrence: "none" as "none" | "daily" | "weekly" | "monthly",
  });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      const { data: profile } = await supabase
        .from("users").select("*").eq("id", user.id).single();
      if (!profile) { router.push("/auth"); return; }

      setCurrentUser(profile);
      setForm(prev => ({ ...prev, assignedTo: profile.id }));

      if (profile.couple_id) {
        const { data: pData } = await supabase
          .from("users").select("*")
          .eq("couple_id", profile.couple_id)
          .neq("id", profile.id).single();
        if (pData) setPartner(pData);
      }
      setLoading(false);
    }
    load();
  }, [supabase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !form.title.trim()) return;
    setIsSubmitting(true);

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        couple_id: currentUser.couple_id,
        title: form.title.trim(),
        category: form.category,
        assigned_to: form.assignedTo,
        created_by: currentUser.id,
        points_value: form.points,
        due_date: form.dueDate || null,
        recurrence: form.recurrence,
        is_completed: false,
      })
      .select()
      .single();

    setIsSubmitting(false);

    if (!error && data) {
      router.push("/dashboard/tasks");
    }
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

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header fijo */}
      <header className="sticky top-0 z-30 bg-white border-b border-border flex items-center px-4 h-14 flex-shrink-0">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-surface text-secondary hover:text-primary transition-colors mr-3"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-primary">Nueva Tarea</h1>
      </header>

      {/* Formulario con scroll natural */}
      <form
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto px-5 pt-6 pb-32"
      >
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
            placeholder="Ej. Comprar pan, Lavar los platos…"
            required
            autoFocus
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
            Asignar a
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
            placeholder="O escribe un valor personalizado"
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
        <div className="mb-6">
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
      </form>

      {/* Botón Crear Tarea — sticky bottom */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-border px-5 py-4">
        <button
          type="submit"
          form=""
          onClick={handleSubmit}
          disabled={isSubmitting || !form.title.trim()}
          className="w-full py-4 bg-accent text-white rounded-2xl text-base font-bold shadow-sm hover:bg-[#6855e0] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Crear tarea"
          )}
        </button>
      </div>
    </div>
  );
}
