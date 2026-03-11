import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, type Formatters } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-0", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4 p-4",
        caption: "flex justify-center pt-1 relative items-center pb-2",
        caption_label: "text-base font-bold",
        nav: "space-x-1 flex items-center justify-between w-full",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        ),
        nav_button_previous: "absolute left-0",
        nav_button_next: "absolute right-0",
        table: "w-full border-collapse space-y-2",
        head_row: "flex w-full gap-2 mb-3",
        head_cell:
          "text-muted-foreground font-bold text-center flex-1 h-6 flex items-center justify-center text-xs uppercase tracking-wide",
        row: "flex w-full gap-2",
        cell: "h-8 flex-1 p-0 relative [&:has([aria-selected])]:bg-transparent focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-full p-0 font-medium text-sm aria-selected:opacity-100",
        ),
        day_range_end: "day-range-end rounded-full",
        day_selected:
          "bg-red-500 text-white hover:bg-red-600 hover:text-white focus:bg-red-500 focus:text-white rounded-full font-bold",
        day_today: "bg-red-500 text-white font-bold rounded-full",
        day_outside:
          "day-outside text-muted-foreground opacity-40",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-transparent aria-selected:text-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      formatters={{
        formatWeekdayName: (day) => {
          return ["S", "M", "T", "W", "T", "F", "S"][day.getDay()];
        },
      } as Partial<Formatters>}
      components={{
        Chevron: (props) => {
          if (props.orientation === "left") {
            return <ChevronLeft className="h-4 w-4" />;
          }
          return <ChevronRight className="h-4 w-4" />;
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
