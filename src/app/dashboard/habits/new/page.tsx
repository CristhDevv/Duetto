"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Users, User as UserIcon } from "lucide-react";
import { useGlobalData } from "@/context/GlobalDataContext";
import { createClient } from "@/lib/supabase/client";
import * as LucideIcons from "lucide-react";
import toast from "react-hot-toast";

const iconsList = [
  "Activity", "Heart", "Star", "Zap", "Coffee", "Book", "Music", "Sun", 
  "Moon", "Droplets", "Dumbbell", "Apple", "Salad", "Brain", "Smile", 
  "Flame", "Target", "Trophy", "Award", "CheckCircle"
];

const colorsList = [
  "#EF4444", // Red
  "#F97316", // Orange
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#3B82F6", // Blue
  "#6366F1", // Indigo
  "#8B5CF6", // Violet
  "#EC4899"  // Pink
];

const daysOfWeek = [
  { id: 1, label: "L" },
  { id: 2, label: "M" },
  { id: 3, label: "X" },
  { id: 4, label: "J" },
  { id: 5, label: "V" },
  { id: 6, label: "S" },
  { id: 0, label: "D" },
];

const IconByName = ({ name, className }: { name: string; className?: string }) => {
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.HelpCircle;
  return <IconComponent className={className} />;
};

export default function NewHabitPage() {
  const router = useRouter();
  const { currentUser, partner } = useGlobalData();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"individual" | "shared">("shared");
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [selectedIcon, setSelectedIcon] = useState(iconsList[0]);
  const [selectedColor, setSelectedColor] = useState(colorsList[0]);

  // Set default assigned to current user if individual is selected
  const handleTypeChange = (newType: "individual" | "shared") => {
    setType(newType);
    if (newType === "individual" && !assignedTo && currentUser) {
      setAssignedTo(currentUser.id);
    } else if (newType === "shared") {
      setAssignedTo(null);
    }
  };

  const toggleDay = (dayId: number) => {
    setSelectedDays(prev => 
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    if (frequency === "weekly" && selectedDays.length === 0) {
      toast.error("Selecciona al menos un día de la semana");
      return;
    }
    if (!currentUser?.couple_id) {
      toast.error("No tienes una pareja vinculada");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("habits").insert({
        couple_id: currentUser.couple_id,
        title: title.trim(),
        description: description.trim() || null,
        type,
        assigned_to: type === "individual" ? assignedTo : null,
        frequency,
        frequency_days: frequency === "weekly" ? selectedDays : null,
        color: selectedColor,
        icon: selectedIcon,
        created_by: currentUser.id,
      });

      if (error) throw error;
      
      toast.success("Hábito creado correctamente");
      router.push("/dashboard/habits");
    } catch (error) {
      console.error(error);
      toast.error("Error al crear el hábito");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-surface pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-border px-4 py-4 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 text-secondary hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-primary flex-1 text-center mr-6">Nuevo Hábito</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-4 flex flex-col space-y-6 mt-2 max-w-md mx-auto">
        
        {/* Título y Descripción */}
        <div className="space-y-4 bg-white p-5 rounded-2xl border border-border shadow-sm">
          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
              Título
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Beber 2L de agua"
              className="w-full bg-surface border-transparent rounded-xl px-4 py-3 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-secondary/50"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
              Descripción <span className="text-secondary/50 lowercase">(opcional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles sobre el hábito..."
              className="w-full bg-surface border-transparent rounded-xl px-4 py-3 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-secondary/50 resize-none h-20"
            />
          </div>
        </div>

        {/* Tipo de Hábito */}
        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm">
          <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-3">
            Tipo de Hábito
          </label>
          <div className="flex bg-surface p-1 rounded-xl">
            <button
              type="button"
              onClick={() => handleTypeChange("shared")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold flex justify-center items-center transition-all ${
                type === "shared" ? "bg-white text-primary shadow-sm" : "text-secondary hover:text-primary"
              }`}
            >
              <Users className="w-4 h-4 mr-2" />
              En Pareja
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("individual")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold flex justify-center items-center transition-all ${
                type === "individual" ? "bg-white text-primary shadow-sm" : "text-secondary hover:text-primary"
              }`}
            >
              <UserIcon className="w-4 h-4 mr-2" />
              Individual
            </button>
          </div>

          {/* Selector de Asignado (Solo si es individual) */}
          {type === "individual" && (
            <div className="mt-4 pt-4 border-t border-border">
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-3">
                ¿Para quién es?
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setAssignedTo(currentUser?.id || null)}
                  className={`flex-1 p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    assignedTo === currentUser?.id
                      ? "bg-accent/5 border-accent text-accent"
                      : "bg-surface border-transparent text-secondary hover:border-border"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: currentUser?.avatar_color || "#7C6AF7" }}>
                    {currentUser?.name.charAt(0).toUpperCase() || "T"}
                  </div>
                  <span className="text-xs font-medium truncate w-full text-center">Para mí</span>
                </button>
                
                {partner && (
                  <button
                    type="button"
                    onClick={() => setAssignedTo(partner.id)}
                    className={`flex-1 p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                      assignedTo === partner.id
                        ? "bg-accent/5 border-accent text-accent"
                        : "bg-surface border-transparent text-secondary hover:border-border"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: partner.avatar_color || "#EBEBEB" }}>
                      {partner.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-medium truncate w-full text-center">{partner.name}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Frecuencia */}
        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm">
          <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-3">
            Frecuencia
          </label>
          <div className="flex gap-3 mb-4">
            <button
              type="button"
              onClick={() => setFrequency("daily")}
              className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                frequency === "daily"
                  ? "bg-accent/5 border-accent text-accent"
                  : "bg-surface border-transparent text-secondary hover:border-border"
              }`}
            >
              Diaria
            </button>
            <button
              type="button"
              onClick={() => setFrequency("weekly")}
              className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                frequency === "weekly"
                  ? "bg-accent/5 border-accent text-accent"
                  : "bg-surface border-transparent text-secondary hover:border-border"
              }`}
            >
              Semanal
            </button>
          </div>

          {frequency === "weekly" && (
            <div className="flex justify-between mt-2">
              {daysOfWeek.map((day) => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    selectedDays.includes(day.id)
                      ? "bg-accent text-white shadow-sm"
                      : "bg-surface text-secondary hover:bg-border"
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Apariencia: Icono y Color */}
        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm space-y-5">
          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-3">
              Color
            </label>
            <div className="flex flex-wrap gap-3">
              {colorsList.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    selectedColor === color ? "scale-110 ring-2 ring-offset-2 ring-primary" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-3 mt-3">
              Ícono
            </label>
            <div className="grid grid-cols-5 gap-3">
              {iconsList.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
                    selectedIcon === icon
                      ? "bg-accent/10 text-accent border border-accent/20"
                      : "bg-surface text-secondary hover:bg-border border border-transparent"
                  }`}
                >
                  <IconByName name={icon} className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Espaciador para no solapar el FAB */}
        <div className="h-6"></div>

        {/* Botón de Guardar Fijo */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-border max-w-md mx-auto">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-white py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-accent/20 hover:bg-[#6855e0] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar Hábito"}
          </button>
        </div>
      </form>
    </div>
  );
}
