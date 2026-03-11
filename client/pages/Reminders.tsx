import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar as CalendarIcon, AlertTriangle, Plus, Trash2 } from "lucide-react";
import { format, differenceInDays, addMonths, addYears } from "date-fns";
import { toast } from "sonner";
import { useReminders, type RecurrenceType } from "@/hooks/use-reminders";

export default function RemindersPage() {
  const { getReminders, addReminder, deleteReminder } = useReminders();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>("once");
  const [recurringDay, setRecurringDay] = useState("10");
  const [recurringMonth, setRecurringMonth] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reminders = getReminders();

  const getRecurrenceLabel = (type: RecurrenceType) => {
    const labels: Record<RecurrenceType, string> = {
      once: "One-Time",
      monthly: "Monthly",
      quarterly: "Every 3 Months",
      "semi-annual": "Every 6 Months",
      yearly: "Yearly",
    };
    return labels[type];
  };

  const calculateNextDueDate = (reminder: any) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (reminder.recurrenceType === "once") {
      return new Date(reminder.dueDate);
    }

    if (reminder.recurrenceType === "monthly") {
      const targetDay = reminder.recurringDay || 10;
      let nextDate = new Date(today.getFullYear(), today.getMonth(), targetDay);
      if (nextDate < today) {
        nextDate = new Date(today.getFullYear(), today.getMonth() + 1, targetDay);
      }
      return nextDate;
    }

    if (reminder.recurrenceType === "quarterly") {
      const targetDay = reminder.recurringDay || 10;
      const targetMonth = (reminder.recurringMonth || 1) - 1;
      let nextDate = new Date(today.getFullYear(), targetMonth, targetDay);
      while (nextDate < today) {
        nextDate = addMonths(nextDate, 3);
      }
      return nextDate;
    }

    if (reminder.recurrenceType === "semi-annual") {
      const targetDay = reminder.recurringDay || 10;
      const targetMonth = (reminder.recurringMonth || 1) - 1;
      let nextDate = new Date(today.getFullYear(), targetMonth, targetDay);
      while (nextDate < today) {
        nextDate = addMonths(nextDate, 6);
      }
      return nextDate;
    }

    if (reminder.recurrenceType === "yearly") {
      const targetDay = reminder.recurringDay || 10;
      const targetMonth = (reminder.recurringMonth || 1) - 1;
      let nextDate = new Date(today.getFullYear(), targetMonth, targetDay);
      if (nextDate < today) {
        nextDate = addYears(nextDate, 1);
      }
      return nextDate;
    }

    return new Date(reminder.dueDate);
  };

  const processedReminders = useMemo(() => {
    return reminders.map(reminder => {
      const dueDateObj = calculateNextDueDate(reminder);
      const daysRemaining = differenceInDays(dueDateObj, new Date());
      const isOverdue = daysRemaining < 0;

      return {
        ...reminder,
        dueDate: dueDateObj.toISOString(),
        daysRemaining: Math.abs(daysRemaining),
        isOverdue,
      };
    });
  }, [reminders]);

  const sortedReminders = useMemo(() => {
    return [...processedReminders].sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return a.daysRemaining - b.daysRemaining;
    });
  }, [processedReminders]);

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!title.trim()) {
        toast.error("Please enter a reminder title");
        return;
      }

      if (recurrenceType === "once" && !dueDate) {
        toast.error("Please select a due date");
        return;
      }

      addReminder(
        title,
        recurrenceType === "once" ? dueDate : new Date().toISOString(),
        recurrenceType,
        parseInt(recurringDay),
        (recurrenceType === "quarterly" || recurrenceType === "semi-annual" || recurrenceType === "yearly")
          ? parseInt(recurringMonth)
          : undefined
      );

      toast.success(`Reminder "${title}" created!`);
      setTitle("");
      setDueDate("");
      setRecurrenceType("once");
      setRecurringDay("10");
      setRecurringMonth("1");
      setIsOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add reminder");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Smart reminders & deadlines</h1>
          <p className="text-muted-foreground">Never miss important dates again.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-tr from-fuchsia-600 to-indigo-600">
              <Plus className="mr-2 h-4 w-4" />
              Add Reminder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Reminder</DialogTitle>
              <DialogDescription>Add a custom reminder or set up a recurring date alert.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddReminder} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Reminder Title</label>
                <Input
                  placeholder="e.g., GST Filing, Invoice Payment"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Frequency</label>
                <Select value={recurrenceType} onValueChange={(val) => setRecurrenceType(val as RecurrenceType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">One-Time</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Every 3 Months (Quarterly)</SelectItem>
                    <SelectItem value="semi-annual">Every 6 Months</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {recurrenceType === "once" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Due Date</label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {(recurrenceType === "monthly" || recurrenceType === "quarterly" || recurrenceType === "semi-annual" || recurrenceType === "yearly") && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Day of Month</label>
                  <Select value={recurringDay} onValueChange={setRecurringDay}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={day.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(recurrenceType === "quarterly" || recurrenceType === "semi-annual" || recurrenceType === "yearly") && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Month</label>
                  <Select value={recurringMonth} onValueChange={setRecurringMonth}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => {
                        const monthIndex = i + 1;
                        const monthName = new Date(2024, i, 1).toLocaleString("default", { month: "long" });
                        return (
                          <SelectItem key={monthIndex} value={monthIndex.toString()}>
                            {monthName}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Reminder"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {sortedReminders.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              No Reminders
            </CardTitle>
            <CardDescription>You haven't set any reminders yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Create your first reminder to stay on top of important deadlines.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Upcoming & Overdue
            </CardTitle>
            <CardDescription>Key dates and reminders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedReminders.map((reminder) => {
              const dueDateObj = new Date(reminder.dueDate);
              return (
                <div
                  key={reminder.id}
                  className={`rounded-md border p-4 flex items-center justify-between ${
                    reminder.isOverdue ? "border-destructive/30 bg-destructive/5" : ""
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{reminder.title}</p>
                      {reminder.recurrenceType !== "once" && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {getRecurrenceLabel(reminder.recurrenceType)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>Due: {format(dueDateObj, "MMM d, yyyy")}</span>
                      {reminder.isOverdue ? (
                        <span className="text-destructive font-medium flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4" />
                          Overdue by {reminder.daysRemaining} day{reminder.daysRemaining !== 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className={reminder.daysRemaining <= 3 ? "text-amber-600 font-medium" : ""}>
                          {reminder.daysRemaining === 0
                            ? "Due today"
                            : `${reminder.daysRemaining} day${reminder.daysRemaining !== 1 ? "s" : ""} remaining`}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      deleteReminder(reminder.id);
                      toast.success("Reminder deleted");
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
