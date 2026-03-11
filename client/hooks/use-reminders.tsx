import { useEmailAuth } from "./use-email-auth";

export type RecurrenceType = "once" | "monthly" | "quarterly" | "semi-annual" | "yearly";

export interface Reminder {
  id: string;
  title: string;
  dueDate: string; // ISO date string
  recurrenceType: RecurrenceType;
  recurringDay?: number; // 1-31 for day of month
  recurringMonth?: number; // 1-12 for month of year (for yearly reminders)
  createdAt: string;
}

export function useReminders() {
  const { user } = useEmailAuth();

  if (!user) {
    throw new Error("useReminders must be used within authenticated context");
  }

  const getStorageKey = (key: string) => `user_${user.id}_${key}`;

  const getReminders = (): Reminder[] => {
    const stored = localStorage.getItem(getStorageKey("reminders"));
    return stored ? JSON.parse(stored) : [];
  };

  const setReminders = (reminders: Reminder[]) => {
    localStorage.setItem(getStorageKey("reminders"), JSON.stringify(reminders));
  };

  const addReminder = (
    title: string,
    dueDate: string,
    recurrenceType: RecurrenceType,
    recurringDay?: number,
    recurringMonth?: number
  ): Reminder => {
    const reminders = getReminders();
    const newReminder: Reminder = {
      id: Math.random().toString(36).slice(2),
      title,
      dueDate,
      recurrenceType,
      recurringDay,
      recurringMonth: recurringMonth || (recurrenceType !== "once" && recurrenceType !== "monthly" ? new Date().getMonth() + 1 : undefined),
      createdAt: new Date().toISOString(),
    };
    reminders.push(newReminder);
    setReminders(reminders);
    return newReminder;
  };

  const deleteReminder = (id: string) => {
    const reminders = getReminders().filter(r => r.id !== id);
    setReminders(reminders);
  };

  const updateReminder = (id: string, updates: Partial<Reminder>) => {
    const reminders = getReminders().map(r => 
      r.id === id ? { ...r, ...updates } : r
    );
    setReminders(reminders);
  };

  return {
    getReminders,
    setReminders,
    addReminder,
    deleteReminder,
    updateReminder,
  };
}
