import { useEffect, useMemo, useState } from "react";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Calendar } from "@/shared/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/components/ui/collapsible";
import { CalendarIcon, ChevronDown, Filter, X } from "lucide-react";
import { format } from "date-fns";
import type { DateRange as PickerDateRange } from "react-day-picker";
import type { FilterValues } from "@/shared/types/filters";
import { createDefaultFilters } from "@/shared/types/filters";

interface SharedFiltersProps {
  filters: FilterValues;
  onFilterChange: (filters: FilterValues) => void;
  showAdvanced?: boolean;
  compact?: boolean;
  primaryOnly?: boolean;
}

export function SharedFilters({
  filters,
  onFilterChange,
  showAdvanced = true,
  compact = false,
  primaryOnly = false,
}: SharedFiltersProps) {
  const defaultFilters = useMemo(() => createDefaultFilters(), []);

  const toPickerRange = (range: FilterValues["dateRange"]): PickerDateRange => {
    if (!range) return { from: undefined, to: undefined };
    return {
      from: range.start ? new Date(range.start) : undefined,
      to: range.end ? new Date(range.end) : undefined,
    };
  };

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [tempDateRange, setTempDateRange] = useState<PickerDateRange>(
    toPickerRange(filters.dateRange)
  );
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  useEffect(() => {
    setTempDateRange(toPickerRange(filters.dateRange));
  }, [filters.dateRange]);

  const updateFilter = <K extends keyof FilterValues>(
    key: K,
    value: FilterValues[K]
  ) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    const defaults = createDefaultFilters();
    onFilterChange(defaults);
    setTempDateRange({
      from: defaults.dateRange?.start,
      to: defaults.dateRange?.end,
    });
  };

  const applyDateRange = () => {
    if (tempDateRange?.from && tempDateRange?.to) {
      updateFilter("dateRange", {
        start: tempDateRange.from,
        end: tempDateRange.to,
      });
      setDatePopoverOpen(false);
    }
  };

  const clearDateRange = () => {
    setTempDateRange({ from: undefined, to: undefined });
    updateFilter("dateRange", null);
    setDatePopoverOpen(false);
  };

  const hasActiveFilters =
    filters.season !== "All" ||
    filters.fieldStage !== "All" ||
    filters.pestType !== "All" ||
    filters.thresholdStatus !== "All" ||
    filters.actionStatus !== "All" ||
    (filters.dateRange &&
      (filters.dateRange.start.getTime() !==
        defaultFilters.dateRange?.start.getTime() ||
        filters.dateRange.end.getTime() !==
          defaultFilters.dateRange?.end.getTime()));

  return (
    <div className={compact ? "mb-4" : "mb-6"}>
      {/* Primary Filter Row - compact, closer to mock */}
      <div className="flex items-center gap-3 flex-wrap rounded-md border border-border bg-white px-3 py-2 shadow-sm text-foreground">
        {/* Group 1: Primary Filters */}
        <div className="flex items-center gap-2">
          <Select
            value={filters.year.toString()}
            onValueChange={(val: string) => updateFilter("year", parseInt(val))}
          >
            <SelectTrigger className="h-9 w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.pestType}
            onValueChange={(val: string) =>
              updateFilter("pestType", val as any)
            }
          >
            <SelectTrigger className="h-9 w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Pests</SelectItem>
              <SelectItem value="Black Rice Bug">Black Rice Bug</SelectItem>
            </SelectContent>
          </Select>

          {primaryOnly && (
            <Select
              value={filters.fieldStage}
              onValueChange={(val: string) => updateFilter("fieldStage", val)}
            >
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Stages</SelectItem>
                <SelectItem value="Seedling">Seedling</SelectItem>
                <SelectItem value="Vegetative">Vegetative</SelectItem>
                <SelectItem value="Reproductive">Reproductive</SelectItem>
                <SelectItem value="Ripening">Ripening</SelectItem>
                <SelectItem value="Harvest">Harvest</SelectItem>
                <SelectItem value="Fallow">Fallow</SelectItem>
                <SelectItem value="Land Prep">Land Prep</SelectItem>
                <SelectItem value="Nursery">Nursery</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-border" />

        {/* Group 2: Date Range */}
        <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-9 w-[220px] justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
              {filters.dateRange ? (
                <span className="truncate">
                  {format(filters.dateRange.start, "MMM d")} -{" "}
                  {format(filters.dateRange.end, "MMM d, yyyy")}
                </span>
              ) : (
                <span className="text-muted-foreground">Pick date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <div className="p-3">
              <Calendar
                mode="range"
                selected={tempDateRange}
                onSelect={(range) =>
                  setTempDateRange(range || { from: undefined, to: undefined })
                }
                defaultMonth={tempDateRange?.from || new Date()}
                numberOfMonths={1}
                initialFocus
              />
              <div className="flex gap-2 pt-3 mt-3 border-t">
                <Button
                  size="sm"
                  onClick={applyDateRange}
                  disabled={!tempDateRange.from || !tempDateRange.to}
                  className="flex-1"
                  aria-label="Apply selected date range"
                >
                  Apply Range
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearDateRange}
                  className="flex-1"
                  aria-label="Clear date range filter"
                >
                  Clear
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Group 3: Advanced Filters & Reset */}
        <div className="flex items-center gap-2">
          {showAdvanced && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAdvancedOpen(!advancedOpen)}
              className="h-9 gap-1"
              aria-label={
                advancedOpen ? "Hide advanced filters" : "Show advanced filters"
              }
              aria-expanded={advancedOpen}
            >
              <Filter className="h-3.5 w-3.5" />
              Advanced
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${
                  advancedOpen ? "rotate-180" : ""
                }`}
              />
            </Button>
          )}

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-9"
              aria-label="Reset all filters to default values"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && advancedOpen && (
        <Card className="mt-3 p-4 bg-white border border-border shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Season */}
            {primaryOnly && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Season
                </label>
                <Select
                  value={filters.season}
                  onValueChange={(val: string) =>
                    updateFilter("season", val as any)
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Seasons</SelectItem>
                    <SelectItem value="Dry">Dry Season</SelectItem>
                    <SelectItem value="Wet">Wet Season</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Threshold Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Threshold Status
              </label>
              <Select
                value={filters.thresholdStatus}
                onValueChange={(val: string) =>
                  updateFilter("thresholdStatus", val as any)
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Below">Below Threshold</SelectItem>
                  <SelectItem value="Above">Above Threshold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Action Status
              </label>
              <Select
                value={filters.actionStatus}
                onValueChange={(val: string) =>
                  updateFilter("actionStatus", val as any)
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Actions</SelectItem>
                  <SelectItem value="Taken">Action Taken</SelectItem>
                  <SelectItem value="Not Taken">No Action</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
