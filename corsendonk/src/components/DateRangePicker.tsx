// components/DateRangePicker.tsx
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format, addDays } from "date-fns";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

interface DateRangePickerProps {
  onChange: (range: DateRange) => void;
  arrangementLength: number; // expected to be 3 or 4
}

export function DateRangePicker({ onChange, arrangementLength }: DateRangePickerProps) {
  const [range, setRange] = useState<DateRange>({
    from: new Date(),
    to: addDays(new Date(), arrangementLength - 1),
  });

  // When arrangementLength changes, update the 'to' date accordingly.
  useEffect(() => {
    if (range.from) {
      const newRange = { from: range.from, to: addDays(range.from, arrangementLength - 1) };
      setRange(newRange);
      onChange(newRange);
    }
  }, [arrangementLength]);

  const handleDateSelect = (selectedDate: Date | null) => {
    if (selectedDate) {
      const newRange = { from: selectedDate, to: addDays(selectedDate, arrangementLength - 1) };
      setRange(newRange);
      onChange(newRange);
    }
  };

  return (
    <div className="grid gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !range && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {range?.from ? (
              <>
                {format(range.from, "LLL dd, y")} - {format(range.to!, "LLL dd, y")}
              </>
            ) : (
              <span>Pick a start date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="single"
            defaultMonth={range.from}
            selected={range.from}
            onSelect={handleDateSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
