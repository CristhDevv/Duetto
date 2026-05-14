"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Calendar, Tag, Loader2, X, Check, RefreshCw, WifiOff } from "lucide-react";
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

export default function TasksPage() {
  const supabase = createClient();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [partner, setPartner] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  // Filters
  const filters = ["Todas", "Mis tareas", "De mi pareja", "Completadas"];
  const [activeFilter, setActiveFilter] = useState("Todas");

  // Bottom Sheet
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    category: "Hogar",
    assignedTo: "",
    dueDate: "",
    points: 10,
    recurrence: "none"
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('new') === 'true') {
        setIsSheetOpen(true);
        // Clean URL to prevent re-opening on refresh
        window.history.replaceState({}, '', '/dashboard/tasks');
      }
    }
  }, []);

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();
    if (!profile) return;
    
    setCurrentUser(profile);
    setNewTask(prev => ({ ...prev, assignedTo: profile.id }));

    if (profile.couple_id) {
      const { data: pData } = await supabase.from('users').select('*').eq('couple_id', profile.couple_id).neq('id', profile.id).single();
      setPartner(pData);
      
      const { data: tData } = await supabase
        .from('tasks')
        .select('*')
        .eq('couple_id', profile.couple_id)
        .order('created_at', { ascending: false });
        
      if (tData) setTasks(tData);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();

    // Offline detection
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => {
      setIsOnline(true);
      fetchData(); // Reload tasks when back online
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchData]);

  const toggleTask = async (task: Task) => {
    // Evitar que la interfaz se trabe mientras se actualiza
    const newStatus = !task.is_completed;
    setTasks(tasks.map(t => t.id === task.id ? { ...t, is_completed: newStatus } : t));

    // Update in Supabase
    await supabase.from('tasks').update({
      is_completed: newStatus,
      completed_at: newStatus ? new Date().toISOString() : null
    }).eq('id', task.id);

    // Update points
    const pointsChange = newStatus ? task.points_value : -task.points_value;
    const { data: userToUpdate } = await supabase.from('users').select('points').eq('id', task.assigned_to).single();
    if (userToUpdate) {
      await supabase.from('users').update({ points: userToUpdate.points + pointsChange }).eq('id', task.assigned_to);
    }

    // If completing a recurring task, create the next occurrence
    if (newStatus) {
      const nextTask = await handleRecurringTask(supabase, task);
      if (nextTask) {
        setTasks(prev => [nextTask, ...prev]);
      }
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newTask.title.trim()) return;
    setIsSubmitting(true);

    const taskToInsert = {
      couple_id: currentUser.couple_id,
      title: newTask.title.trim(),
      category: newTask.category,
      assigned_to: newTask.assignedTo,
      created_by: currentUser.id,
      points_value: newTask.points,
      due_date: newTask.dueDate || null,
      recurrence: newTask.recurrence,
      is_completed: false
    };

    const { data, error } = await supabase.from('tasks').insert(taskToInsert).select().single();
    
    if (!error && data) {
      setTasks([data, ...tasks]);
      setIsSheetOpen(false);
      setNewTask({ title: "", category: "Hogar", assignedTo: currentUser.id, dueDate: "", points: 10, recurrence: "none" });
    }
    setIsSubmitting(false);
  };

  const filteredTasks = tasks.filter(task => {
    if (activeFilter === "Completadas") return task.is_completed;
    if (task.is_completed) return false; // Ocultar completadas de los otros filtros
    if (activeFilter === "Mis tareas") return task.assigned_to === currentUser?.id;
    if (activeFilter === "De mi pareja") return task.assigned_to !== currentUser?.id;
    return true; // "Todas"
  });

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    // Agregamos el offset de la zona horaria para que el día sea el correcto
    d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const getAssigneeInitial = (assignedId: string) => {
    if (assignedId === currentUser?.id) return currentUser?.name.charAt(0).toUpperCase();
    if (assignedId === partner?.id) return partner?.name.charAt(0).toUpperCase();
    return "?";
  };

  const getAssigneeColor = (assignedId: string) => {
    if (assignedId === currentUser?.id) return currentUser?.avatar_color || '#7C6AF7';
    if (assignedId === partner?.id) return partner?.avatar_color || '#EBEBEB';
    return "#ccc";
  };

  if (loading) {
    return <div className="min-h-full flex justify-center items-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  }

  return (
    <div className="relative min-h-full pb-24">
      {/* Header Fijo con Filtros Deslizables */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-border pt-6 pb-3 px-0">
        <h1 className="text-3xl font-bold text-primary px-4 mb-4">Tareas</h1>
        <div className="flex overflow-x-auto hide-scrollbar px-4 space-x-2 pb-1">
          {filters.map(filter => (
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

      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex items-center justify-center space-x-2 animate-in fade-in slide-in-from-top duration-300">
          <WifiOff className="w-4 h-4 text-yellow-600" />
          <p className="text-xs font-medium text-yellow-700">
            Sin conexión — Los cambios se sincronizarán al reconectarte
          </p>
        </div>
      )}

      {/* Lista de Tareas */}
      <div className="p-4 space-y-3 mt-2">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-10 px-4 bg-surface rounded-2xl border border-border border-dashed flex flex-col items-center">
            <Check className="w-10 h-10 text-border mb-3" />
            <p className="text-secondary text-sm mb-4">No hay tareas para mostrar.</p>
            <button onClick={() => setIsSheetOpen(true)} className="px-4 py-2 bg-accent text-white rounded-xl text-sm font-bold shadow-sm">
              Crear primera tarea
            </button>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div 
              key={task.id} 
              className={`flex items-start p-4 border rounded-2xl transition-all shadow-sm ${
                task.is_completed ? "bg-surface border-transparent opacity-60" : "bg-white border-border"
              }`}
            >
              {/* Checkbox */}
              <button 
                onClick={() => toggleTask(task)}
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
                <h3 className={`font-semibold text-sm truncate ${task.is_completed ? "line-through text-secondary" : "text-primary"}`}>
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

              {/* Lado derecho: Puntos y Asignado */}
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

      {/* FAB para abrir Bottom Sheet */}
      <div className="fixed bottom-20 w-full max-w-md pointer-events-none flex justify-end px-4 z-40">
        <button 
          onClick={() => setIsSheetOpen(true)}
          className="pointer-events-auto w-14 h-14 bg-accent text-white rounded-full flex items-center justify-center shadow hover:bg-[#6855e0] transition-transform hover:scale-105"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Overlay Bottom Sheet */}
      {isSheetOpen && (
        <div 
          className="fixed inset-0 bg-primary/40 z-50 transition-opacity"
          onClick={() => setIsSheetOpen(false)}
        />
      )}

      {/* Panel Bottom Sheet */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-50 flex justify-center transition-transform duration-300 ${isSheetOpen ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ pointerEvents: isSheetOpen ? 'auto' : 'none' }}
      >
        <div className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl p-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-primary">Crear Tarea</h2>
            <button onClick={() => setIsSheetOpen(false)} className="p-2 bg-surface rounded-full text-secondary hover:text-primary">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-secondary uppercase tracking-wider ml-1">Título</label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                className="w-full mt-1 px-4 py-3 bg-surface border border-border rounded-2xl focus:outline-none focus:border-accent"
                placeholder="Ej. Comprar pan"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-secondary uppercase tracking-wider ml-1">Categoría</label>
                <select
                  value={newTask.category}
                  onChange={(e) => setNewTask({...newTask, category: e.target.value})}
                  className="w-full mt-1 px-4 py-3 bg-surface border border-border rounded-2xl focus:outline-none focus:border-accent appearance-none"
                >
                  <option value="Hogar">Hogar</option>
                  <option value="Compras">Compras</option>
                  <option value="Trámites">Trámites</option>
                  <option value="Mascotas">Mascotas</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-secondary uppercase tracking-wider ml-1">Puntos</label>
                <input
                  type="number"
                  value={newTask.points}
                  onChange={(e) => setNewTask({...newTask, points: parseInt(e.target.value) || 0})}
                  className="w-full mt-1 px-4 py-3 bg-surface border border-border rounded-2xl focus:outline-none focus:border-accent"
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-secondary uppercase tracking-wider ml-1">Asignar a</label>
                <select
                  value={newTask.assignedTo}
                  onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})}
                  className="w-full mt-1 px-4 py-3 bg-surface border border-border rounded-2xl focus:outline-none focus:border-accent appearance-none"
                >
                  <option value={currentUser?.id}>A mí</option>
                  {partner && <option value={partner.id}>A mi pareja ({partner.name})</option>}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-secondary uppercase tracking-wider ml-1">Fecha Límite</label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                  className="w-full mt-1 px-4 py-3 bg-surface border border-border rounded-2xl focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Recurrence selector */}
            <div>
              <label className="text-xs font-bold text-secondary uppercase tracking-wider ml-1 flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />
                Repetición
              </label>
              <div className="grid grid-cols-4 gap-2 mt-1">
                {([
                  { value: "none",    label: "Nunca" },
                  { value: "daily",   label: "Diaria" },
                  { value: "weekly",  label: "Semanal" },
                  { value: "monthly", label: "Mensual" },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setNewTask({ ...newTask, recurrence: opt.value })}
                    className={`py-2 px-1 rounded-xl text-xs font-semibold border transition-colors ${
                      newTask.recurrence === opt.value
                        ? "bg-accent text-white border-accent"
                        : "bg-surface text-secondary border-border hover:border-accent"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !newTask.title.trim()}
              className="w-full py-4 mt-4 bg-accent text-white rounded-2xl font-bold transition-colors hover:bg-[#6855e0] disabled:opacity-50 flex justify-center items-center"
            >
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Guardar Tarea"}
            </button>
          </form>
        </div>
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
