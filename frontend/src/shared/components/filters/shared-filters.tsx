import { useEffect, useMemo, useState, useRef } from "react";
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
import {
  Calendar as CalendarIcon,
  NavArrowDown,
  FilterList,
  Xmark,
} from "iconoir-react";
import { format } from "date-fns";
import type { DateRange as PickerDateRange } from "react-day-picker";
import type { FilterValues } from "@/shared/types/filters";
import {
  createDefaultFilters,
  createDefaultFiltersWithBackend,
} from "@/shared/types/filters";
import { getFilterOptions } from "@/shared/lib/filter-service";
import { useDashboardStore } from "@/state/store";

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

  // Get observations from store to find most recent date
  const observations = useDashboardStore((state) => state.observations);

  // Fetch filter options from backend
  const [filterOptions, setFilterOptions] = useState<{
    years: number[];
    seasons: string[];
    fieldStages: string[];
    pestTypes: string[];
    thresholdStatuses: string[];
    actionStatuses: string[];
  } | null>(null);

  // Get the most recent date from observations data
  const mostRecentDate = useMemo(() => {
    if (observations.length === 0) return new Date();
    const dates = observations.map((obs) => new Date(obs.date));
    return new Date(Math.max(...dates.map((d) => d.getTime())));
  }, [observations]);

  useEffect(() => {
    getFilterOptions()
      .then((options) => {
        setFilterOptions({
          years: options.years,
          seasons: options.seasons,
          fieldStages: options.fieldStages,
          pestTypes: options.pestTypes,
          thresholdStatuses: options.thresholdStatuses,
          actionStatuses: options.actionStatuses,
        });
      })
      .catch((error) => {
        console.error("Failed to load filter options:", error);
      });
  }, []);

  // Compute year range from available data years
  const yearRange = useMemo(() => {
    if (filterOptions?.years && filterOptions.years.length > 0) {
      // Years are sorted descending (newest first) from backend
      const newestYear = filterOptions.years[0];
      const oldestYear = filterOptions.years[filterOptions.years.length - 1];
      return { fromYear: oldestYear, toYear: newestYear };
    }
    // Fallback to current year ± 10 if no data available
    return { fromYear: filters.year - 10, toYear: filters.year + 10 };
  }, [filterOptions?.years, filters.year]);

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

  // Compute default month based on available data (must be after tempDateRange declaration)
  const defaultMonthValue = useMemo(() => {
    if (tempDateRange?.from) {
      return new Date(tempDateRange.from);
    }
    if (filterOptions?.years && filterOptions.years.length > 0) {
      // Use the newest year (first in array) from actual data
      return new Date(filterOptions.years[0], 0, 1);
    }
    // Fallback to selected year
    return new Date(filters.year, 0, 1);
  }, [tempDateRange?.from, filterOptions?.years, filters.year]);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [weekSelectionMode, setWeekSelectionMode] = useState(false);
  const lastAppliedRangeRef = useRef<{
    from: number | null;
    to: number | null;
  }>({
    from: null,
    to: null,
  });

  useEffect(() => {
    setTempDateRange(toPickerRange(filters.dateRange));
    // Update ref when filter changes externally
    if (filters.dateRange) {
      lastAppliedRangeRef.current = {
        from: new Date(filters.dateRange.start).setHours(0, 0, 0, 0),
        to: new Date(filters.dateRange.end).setHours(23, 59, 59, 999),
      };
    } else {
      lastAppliedRangeRef.current = { from: null, to: null };
    }
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
      // Set start to beginning of day (00:00:00) in local timezone
      const startDate = new Date(tempDateRange.from);
      startDate.setHours(0, 0, 0, 0);

      // Set end to end of day (23:59:59.999) in local timezone to include the entire selected day
      const endDate = new Date(tempDateRange.to);
      endDate.setHours(23, 59, 59, 999);

      const newStartTime = startDate.getTime();
      const newEndTime = endDate.getTime();

      // Debug logging
      console.log("Applying date range:", {
        from: tempDateRange.from,
        to: tempDateRange.to,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        startDateLocal: `${startDate.getFullYear()}-${String(
          startDate.getMonth() + 1
        ).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`,
        endDateLocal: `${endDate.getFullYear()}-${String(
          endDate.getMonth() + 1
        ).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`,
      });

      // Update the filter - this will trigger onFilterChange which updates the store
      updateFilter("dateRange", {
        start: startDate,
        end: endDate,
      });

      // Update ref after applying to prevent duplicate applications
      lastAppliedRangeRef.current = {
        from: newStartTime,
        to: newEndTime,
      };

      // Close popover after applying
      setDatePopoverOpen(false);
    }
  };

  // Auto-apply date range when both from and to are selected
  // Only apply if the range is different from the last applied range
  useEffect(() => {
    // Only auto-apply when popover is open and both dates are selected
    if (!datePopoverOpen || !tempDateRange?.from || !tempDateRange?.to) {
      return;
    }

    const newStartTime = new Date(tempDateRange.from).setHours(0, 0, 0, 0);
    const newEndTime = new Date(tempDateRange.to).setHours(23, 59, 59, 999);

    // Only auto-apply if the range has actually changed from the last applied range
    const hasChanged =
      lastAppliedRangeRef.current.from !== newStartTime ||
      lastAppliedRangeRef.current.to !== newEndTime;

    if (!hasChanged) {
      return;
    }

    // Small delay to ensure the calendar UI has updated and both dates are fully selected
    const timer = setTimeout(() => {
      // Double-check that dates are still valid before applying
      if (tempDateRange?.from && tempDateRange?.to) {
        applyDateRange();
      }
    }, 250);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tempDateRange?.from ? tempDateRange.from.getTime() : null,
    tempDateRange?.to ? tempDateRange.to.getTime() : null,
    datePopoverOpen,
  ]);

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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 rounded-md border border-border bg-card px-2 sm:px-3 py-2 shadow-sm text-foreground">
        {/* Group 1: Primary Filters */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Select
            value={filters.year.toString()}
            onValueChange={(val: string) => updateFilter("year", parseInt(val))}
          >
            <SelectTrigger className="h-9 w-full sm:w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {filterOptions?.years.length ? (
                filterOptions.years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value={filters.year.toString()}>
                  {filters.year}
                </SelectItem>
              )}
            </SelectContent>
          </Select>

          <Select
            value={filters.pestType}
            onValueChange={(val: string) =>
              updateFilter("pestType", val as any)
            }
          >
            <SelectTrigger className="h-9 w-full sm:w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {filterOptions?.pestTypes.length ? (
                filterOptions.pestTypes.map((pest) => (
                  <SelectItem key={pest} value={pest}>
                    {pest === "All" ? "All Pests" : pest}
                  </SelectItem>
                ))
              ) : (
                <>
                  <SelectItem value="All">All Pests</SelectItem>
                  <SelectItem value="Black Rice Bug">Black Rice Bug</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>

          {primaryOnly && (
            <Select
              value={filters.fieldStage}
              onValueChange={(val: string) => updateFilter("fieldStage", val)}
            >
              <SelectTrigger className="h-9 w-full sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filterOptions?.fieldStages.length ? (
                  filterOptions.fieldStages.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stage === "All" ? "All Stages" : stage}
                    </SelectItem>
                  ))
                ) : (
                  <>
                    <SelectItem value="All">All Stages</SelectItem>
                    <SelectItem value="Seedling">Seedling</SelectItem>
                    <SelectItem value="Vegetative">Vegetative</SelectItem>
                    <SelectItem value="Reproductive">Reproductive</SelectItem>
                    <SelectItem value="Ripening">Ripening</SelectItem>
                    <SelectItem value="Harvest">Harvest</SelectItem>
                    <SelectItem value="Fallow">Fallow</SelectItem>
                    <SelectItem value="Land Prep">Land Prep</SelectItem>
                    <SelectItem value="Nursery">Nursery</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-6 w-px bg-border" />

        {/* Group 2: Date Range */}
        <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-9 w-full sm:w-[220px] justify-start text-left font-normal"
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
              {/* Quick selection buttons */}
              <div className="grid grid-cols-2 gap-2 mb-3 pb-3 border-b">
                <Button
                  type="button"
                  variant={weekSelectionMode ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setWeekSelectionMode(!weekSelectionMode);
                  }}
                >
                  {weekSelectionMode ? "Cancel Week" : "Select Week"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    // Select week containing the most recent date from data (Monday to Sunday)
                    const referenceDate = new Date(mostRecentDate);
                    const dayOfWeek = referenceDate.getDay();
                    const diff =
                      referenceDate.getDate() -
                      dayOfWeek +
                      (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
                    const monday = new Date(referenceDate.setDate(diff));
                    monday.setHours(0, 0, 0, 0);
                    const sunday = new Date(monday);
                    sunday.setDate(sunday.getDate() + 6);
                    sunday.setHours(23, 59, 59, 999);
                    setTempDateRange({ from: monday, to: sunday });
                    setWeekSelectionMode(false);
                  }}
                >
                  This Week
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    // Select month containing the most recent date from data
                    const referenceDate = new Date(mostRecentDate);
                    const firstDay = new Date(
                      referenceDate.getFullYear(),
                      referenceDate.getMonth(),
                      1
                    );
                    firstDay.setHours(0, 0, 0, 0);
                    const lastDay = new Date(
                      referenceDate.getFullYear(),
                      referenceDate.getMonth() + 1,
                      0
                    );
                    lastDay.setHours(23, 59, 59, 999);
                    setTempDateRange({ from: firstDay, to: lastDay });
                    setWeekSelectionMode(false);
                  }}
                >
                  This Month
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    // Select year containing the most recent date from data
                    const referenceDate = new Date(mostRecentDate);
                    const firstDay = new Date(
                      referenceDate.getFullYear(),
                      0,
                      1
                    );
                    firstDay.setHours(0, 0, 0, 0);
                    const lastDay = new Date(
                      referenceDate.getFullYear(),
                      11,
                      31
                    );
                    lastDay.setHours(23, 59, 59, 999);
                    setTempDateRange({ from: firstDay, to: lastDay });
                    setWeekSelectionMode(false);
                  }}
                >
                  This Year
                </Button>
              </div>
              {weekSelectionMode && (
                <div className="mb-2 p-2 bg-muted rounded-md text-sm text-muted-foreground">
                  Click on any day to select its entire week (Monday - Sunday)
                </div>
              )}
              <Calendar
                mode="range"
                selected={tempDateRange}
                onSelect={(range) => {
                  if (weekSelectionMode && range?.from) {
                    // When in week selection mode, select the entire week containing the clicked day
                    const clickedDate = new Date(range.from);
                    const dayOfWeek = clickedDate.getDay();
                    const diff =
                      clickedDate.getDate() -
                      dayOfWeek +
                      (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
                    const monday = new Date(clickedDate.setDate(diff));
                    monday.setHours(0, 0, 0, 0);
                    const sunday = new Date(monday);
                    sunday.setDate(sunday.getDate() + 6);
                    sunday.setHours(23, 59, 59, 999);
                    setTempDateRange({ from: monday, to: sunday });
                    setWeekSelectionMode(false); // Exit week selection mode after selection
                  } else {
                    // Normal range selection
                    const newRange = range || {
                      from: undefined,
                      to: undefined,
                    };
                    setTempDateRange(newRange);
                  }
                }}
                defaultMonth={defaultMonthValue}
                numberOfMonths={1}
                initialFocus
                captionLayout="dropdown-buttons"
                fromYear={yearRange.fromYear}
                toYear={yearRange.toYear}
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
              <FilterList className="h-3.5 w-3.5" />
              Advanced
              <NavArrowDown
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
              <Xmark className="h-3.5 w-3.5 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && advancedOpen && (
        <Card className="mt-3 p-4 bg-card border border-border shadow-sm">
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
                    {filterOptions?.seasons.length ? (
                      filterOptions.seasons.map((season) => (
                        <SelectItem key={season} value={season}>
                          {season === "All"
                            ? "All Seasons"
                            : `${season} Season`}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="All">All Seasons</SelectItem>
                        <SelectItem value="Dry">Dry Season</SelectItem>
                        <SelectItem value="Wet">Wet Season</SelectItem>
                      </>
                    )}
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
                  {filterOptions?.thresholdStatuses.length ? (
                    filterOptions.thresholdStatuses.map((status) => {
                      const displayValue =
                        status === "All"
                          ? "All Status"
                          : status === "Economic Threshold" ||
                            status === "Economic Damage"
                          ? "Above Threshold"
                          : status === "Below Threshold"
                          ? "Below Threshold"
                          : status;
                      const selectValue =
                        status === "All"
                          ? "All"
                          : status === "Economic Threshold" ||
                            status === "Economic Damage"
                          ? "Above"
                          : status === "Below Threshold"
                          ? "Below"
                          : status;
                      return (
                        <SelectItem key={status} value={selectValue}>
                          {displayValue}
                        </SelectItem>
                      );
                    })
                  ) : (
                    <>
                      <SelectItem value="All">All Status</SelectItem>
                      <SelectItem value="Below">Below Threshold</SelectItem>
                      <SelectItem value="Above">Above Threshold</SelectItem>
                    </>
                  )}
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
                  {filterOptions?.actionStatuses.length ? (
                    filterOptions.actionStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status === "All"
                          ? "All Actions"
                          : status === "Taken"
                          ? "Action Taken"
                          : "No Action"}
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="All">All Actions</SelectItem>
                      <SelectItem value="Taken">Action Taken</SelectItem>
                      <SelectItem value="Not Taken">No Action</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
