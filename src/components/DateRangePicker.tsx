import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format, addDays } from "date-fns";
import { useState, useEffect, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  onChange: (range: { from: Date; to: Date }) => void;
  arrangementLength: number; // expected to be 3 or 4
}

export function DateRangePicker({
  onChange,
  arrangementLength,
}: DateRangePickerProps) {
  // Use a single date for selection.
  const [selectedDate, setSelectedDate] = useState<Date>(
    addDays(new Date(), 1),
  );

  // Compute the full range based on the selected date and arrangementLength.
  const computedRange = useMemo(
    () => ({
      from: selectedDate,
      to: addDays(selectedDate, arrangementLength - 1),
    }),
    [selectedDate, arrangementLength],
  );

  // Memoize the onChange function to prevent unnecessary re-renders.
  const memoizedOnChange = useCallback(onChange, []);

  // Notify parent on changes.
  useEffect(() => {
    memoizedOnChange(computedRange);
  }, [computedRange, memoizedOnChange]);

  // Handle selecting a new start date.
  const handleDateSelect = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  // Define a custom modifier to highlight all days within the computed range.
  const modifiers = {
    stayRange: (date: Date) =>
      date >= computedRange.from && date <= computedRange.to,
  };

  return (
    <div className="grid gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal border-[#2C4A3C] hover:border-[#2C4A3C] focus:outline-none focus:ring-[#2C4A3C] focus:ring-offset-0 focus:ring-2",
              "group",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-black" />
            {format(computedRange.from, "LLL dd, y")} -{" "}
            {format(computedRange.to, "LLL dd, y")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-[#2C4A3C]" align="start">
          <Calendar
            initialFocus
            mode="single" // Keep single mode for clickable dates.
            defaultMonth={addDays(new Date(), 1)} // Start on today plus one.
            disabled={(date) => date <= new Date()} // Disable today and past dates.
            selected={selectedDate}
            onSelect={handleDateSelect}
            numberOfMonths={2}
            modifiers={modifiers} // Pass the custom modifier for styling.
            className="custom-calendar"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
