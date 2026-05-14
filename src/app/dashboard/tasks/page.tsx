"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Calendar, Tag, Loader2, Check, WifiOff } from "lucide-react";
import { useGlobalData, Task } from "@/context/GlobalDataContext";

export default function TasksPage() {
  const router = useRouter();
  const { currentUser, partner, tasks, loading, toggleOptimisticTask } = useGlobalData();

  const [isOnline, setIsOnline] = useState(true);

  const filters = ["Todas", "Mis tareas", "De mi pareja", "Completadas"];
  const [activeFilter, setActiveFilter] = useState("Todas");

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const toggleTask = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    toggleOptimisticTask(task);
  };

  const filteredTasks = tasks.filter((task) => {
    if (activeFilter === "Completadas") return task.is_completed;
    if (task.is_completed) return false;
    if (activeFilter === "Mis tareas") return task.assigned_to === currentUser?.id;
    if (activeFilter === "De mi pareja") return task.assigned_to !== currentUser?.id;
    return true;
  });

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
    return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  };

  const getAssigneeInitial = (assignedId: string) => {
    if (assignedId === currentUser?.id) return currentUser?.name.charAt(0).toUpperCase();
    if (assignedId === partner?.id) return partner?.name.charAt(0).toUpperCase();
    return "?";
  };

  const getAssigneeColor = (assignedId: string) => {
    if (assignedId === currentUser?.id) return currentUser?.avatar_color || "#7C6AF7";
    if (assignedId === partner?.id) return partner?.avatar_color || "#EBEBEB";
    return "#ccc";
  };

  if (loading) {
    return (
      <div className="min-h-full flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="relative min-h-full pb-24">
      {/* Header fijo con filtros */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-border pt-6 pb-3 px-0">
        <h1 className="text-3xl font-bold text-primary px-4 mb-4">Tareas</h1>
        <div className="flex overflow-x-auto hide-scrollbar px-4 space-x-2 pb-1">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === filter
                  ? "bg-primary text-white"
                  : "bg-surface text-secondary hover:bg-[#EBEBEB]"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Banner offline */}
      {!isOnline && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex items-center justify-center space-x-2">
          <WifiOff className="w-4 h-4 text-yellow-600" />
          <p className="text-xs font-medium text-yellow-700">
            Sin conexión — Los cambios se sincronizarán al reconectarte
          </p>
        </div>
      )}

      {/* Lista de tareas */}
      <div className="p-4 space-y-3 mt-2">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-10 px-4 bg-surface rounded-2xl border border-border border-dashed flex flex-col items-center">
            <Check className="w-10 h-10 text-border mb-3" />
            <p className="text-secondary text-sm mb-4">No hay tareas para mostrar.</p>
            <button
              onClick={() => router.push("/dashboard/tasks/new")}
              className="px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-bold shadow-sm hover:bg-[#6855e0] transition-colors"
            >
              Crear primera tarea
            </button>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
              className={`flex items-start p-4 border rounded-2xl transition-all shadow-sm cursor-pointer active:scale-[0.98] ${
                task.is_completed
                  ? "bg-surface border-transparent opacity-60"
                  : "bg-white border-border hover:border-accent/40"
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={(e) => toggleTask(e, task)}
                className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors mr-4 ${
                  task.is_completed
                    ? "bg-accent border-accent text-white"
                    : "border-border hover:border-accent"
                }`}
              >
                {task.is_completed && <Check className="w-4 h-4" />}
              </button>

              {/* Info Tarea */}
              <div className="flex-1 min-w-0">
                <h3
                  className={`font-semibold text-sm truncate ${
                    task.is_completed ? "line-through text-secondary" : "text-primary"
                  }`}
                >
                  {task.title}
                </h3>
                <div className="flex flex-wrap items-center mt-2 gap-2">
                  <div className="flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md bg-accent-light text-accent uppercase tracking-wider">
                    <Tag className="w-3 h-3 mr-1" />
                    {task.category}
                  </div>
                  {task.due_date && (
                    <div className="flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md bg-surface text-secondary uppercase tracking-wider">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(task.due_date)}
                    </div>
                  )}
                </div>
              </div>

              {/* Puntos + Avatar */}
              <div className="flex flex-col items-end justify-between ml-3 space-y-2">
                <div className="text-xs font-bold text-success">+{task.points_value}</div>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ backgroundColor: getAssigneeColor(task.assigned_to) }}
                >
                  {getAssigneeInitial(task.assigned_to)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB → navega a /dashboard/tasks/new */}
      <div className="fixed bottom-20 w-full max-w-md pointer-events-none flex justify-end px-4 z-40">
        <button
          onClick={() => router.push("/dashboard/tasks/new")}
          className="pointer-events-auto w-14 h-14 bg-accent text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#6855e0] transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
