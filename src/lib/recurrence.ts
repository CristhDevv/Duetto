import { SupabaseClient } from "@supabase/supabase-js";

export type RecurrenceType = "none" | "daily" | "weekly" | "monthly";

/**
 * Calculates the next due date based on a recurrence type.
 * If no current due_date exists, today is used as the base.
 */
function getNextDueDate(currentDueDate: string | null, recurrence: RecurrenceType): string {
  const base = currentDueDate ? new Date(currentDueDate) : new Date();
  // Correct for timezone offset so the day is accurate
  base.setMinutes(base.getMinutes() + base.getTimezoneOffset());

  switch (recurrence) {
    case "daily":
      base.setDate(base.getDate() + 1);
      break;
    case "weekly":
      base.setDate(base.getDate() + 7);
      break;
    case "monthly":
      base.setMonth(base.getMonth() + 1);
      break;
    default:
      break;
  }

  // Return as YYYY-MM-DD string (Supabase date format)
  return base.toISOString().split("T")[0];
}

interface RecurringTask {
  id: string;
  couple_id: string;
  title: string;
  category: string;
  assigned_to: string | null;
  created_by: string | null;
  points_value: number;
  due_date: string | null;
  recurrence: RecurrenceType | string;
}

/**
 * When a recurring task is completed, this function automatically
 * inserts a new identical task with the due date advanced according
 * to the recurrence type.
 *
 * Call this inside the complete-task handler, passing the task and
 * the Supabase client.
 *
 * @returns The newly created task data, or null if not applicable.
 */
export async function handleRecurringTask(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  task: RecurringTask
) {
  // Only act on tasks with an active recurrence
  if (!task.recurrence || task.recurrence === "none") return null;

  const nextDueDate = getNextDueDate(task.due_date, task.recurrence as RecurrenceType);

  const newTask = {
    couple_id: task.couple_id,
    title: task.title,
    category: task.category,
    assigned_to: task.assigned_to,
    created_by: task.created_by,
    points_value: task.points_value,
    due_date: nextDueDate,
    recurrence: task.recurrence,
    is_completed: false,
  };

  const { data, error } = await supabase.from("tasks").insert(newTask).select().single();

  if (error) {
    return null;
  }

  return data;
}
