import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function OccupancySelector({
  adults,
  children,
  onAdultsChange,
  onChildrenChange,
}: {
  adults: number;
  children: number;
  onAdultsChange: (adults: string) => void;
  onChildrenChange: (children: string) => void;
}) {
  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label>Adults</Label>
        <Select defaultValue={adults.toString()} onValueChange={onAdultsChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select number of adults" />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4].map((num) => (
              <SelectItem key={num} value={num.toString()}>
                {num} {num === 1 ? "Adult" : "Adults"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Children</Label>
        <Select
          defaultValue={children.toString()}
          onValueChange={onChildrenChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select number of children" />
          </SelectTrigger>
          <SelectContent>
            {[0, 1, 2, 3].map((num) => (
              <SelectItem key={num} value={num.toString()}>
                {num} {num === 1 ? "Child" : "Children"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
