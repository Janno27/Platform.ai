import { format } from "date-fns";
import { CalendarIcon, PencilIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { EXPERIMENT_PARAMETERS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

const COUNTRIES = [
  { label: "France", value: "FR" },
  { label: "Germany", value: "DE" },
  { label: "United Kingdom", value: "UK" }
] as const;

interface RoadmapProps {
  startDate: Date | undefined;
  onStartDateSelect: (date: Date | undefined) => void;
  isEditing: boolean;
  onEditToggle: () => void;
  countryCode: string;
  onRemove: () => void;
  canRemove: boolean;
}

export function Roadmap({ startDate, onStartDateSelect, isEditing, onEditToggle, countryCode, onRemove, canRemove }: RoadmapProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    onStartDateSelect(date);
    setIsCalendarOpen(false);
  };

  const endDate = startDate 
    ? new Date(startDate.getTime() + EXPERIMENT_PARAMETERS.MIN_EXPERIMENT_DAYS * 24 * 60 * 60 * 1000) 
    : undefined;

  return (
    <div className="relative bg-muted/5 rounded-lg group">
      {canRemove && (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:cursor-pointer z-50"
        >
          <X className="h-3 w-3 text-muted-foreground/50 hover:text-muted-foreground" />
        </Button>
      )}
      
      <div className="flex items-center gap-4">
        {/* Timeline Container */}
        <div className="flex-1 relative">
          {/* Dates au-dessus */}
          <div style={{ paddingLeft: '55px' }} className="flex justify-between">
            {/* Start Date - Parfaitement centré au-dessus du point */}
            <div className="flex flex-col items-center">
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="h-7 text-xs px-2 hover:bg-transparent hover:text-foreground w-full"
                  >
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {startDate ? format(startDate, "MM/dd") : "Start"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={handleDateSelect}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Days Counter */}
            {startDate && (
              <div className="flex flex-col items-center">
                <span className="bg-background px-2 text-xs text-muted-foreground whitespace-nowrap">
                  {EXPERIMENT_PARAMETERS.MIN_EXPERIMENT_DAYS} days
                </span>
              </div>
            )}

            {/* End Date */}
            <div className="flex flex-col items-center">
              <span className="h-7 flex items-center justify-end text-xs text-muted-foreground px-2 w-full">
                {endDate ? format(endDate, "MM/dd") : "End"}
              </span>
            </div>
          </div>

          {/* Timeline Row avec Points, Ligne et Sélecteur */}
          <div style={{ paddingRight: '20px' }} className="flex items-center gap-4">
            {/* Country Selector aligné avec les points */}
            <div className="flex items-center">
              <Select defaultValue="FR">
                <SelectTrigger className="w-[50px] h-6 text-xs pl-1.5 pr-0">
                  <SelectValue className="truncate mr-0" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.value} value={country.value} className="text-xs">
                      {country.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Timeline avec Points et Ligne */}
            <div className="flex-1 flex items-center justify-between relative">
              {/* Start Point */}
              <div className="h-2 w-2 rounded-full bg-primary z-10" />
              
              {/* Connecting Line */}
              <div 
                className="absolute left-1 right-1 top-1/2 -translate-y-1/2"
                style={{
                  height: '2px',
                  backgroundColor: 'hsl(var(--primary))',
                }}
              />
              
              {/* End Point */}
              <div className="h-2 w-2 rounded-full bg-primary z-10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 