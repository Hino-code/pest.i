export interface DateRange {
  start: Date;
  end: Date;
}

export interface FilterValues {
  year: number;
  season: "Dry" | "Wet" | "All";
  fieldStage: string;
  pestType: "Black Rice Bug" | "All";
  dateRange: DateRange | null;
  thresholdStatus: "Below" | "Above" | "All";
  actionStatus: "Taken" | "Not Taken" | "All";
}

export const createDefaultFilters = (): FilterValues => ({
  year: new Date().getFullYear(),
  season: "All",
  fieldStage: "All",
  pestType: "All",
  dateRange: {
    start: new Date(new Date().getFullYear(), 0, 1),
    end: new Date(),
  },
  thresholdStatus: "All",
  actionStatus: "All",
});

