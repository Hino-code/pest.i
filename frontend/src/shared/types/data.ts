export type PestType = "Black Rice Bug";
export type Season = "Dry" | "Wet";
export type FieldStage =
  | "Seedling"
  | "Vegetative"
  | "Reproductive"
  | "Ripening"
  | "Harvest"
  | "Fallow"
  | "Land Prep"
  | "Nursery";

export interface PestObservation {
  id: string;
  date: string;
  pestType: PestType;
  count: number;
  threshold: number;
  aboveThreshold: boolean;
  season: Season;
  fieldStage: FieldStage;
  location?: string;
  actionTaken: boolean;
  actionType?: string;
  actionDate?: string;
}

export interface KPIMetrics {
  totalObservations: number;
  averagePestCount: number;
  percentAboveThreshold: number;
  totalActionsTaken: number;
  actionRate: number;
  currentFieldStage: string;
  mostAffectedStage: string;
}

export interface ForecastData {
  date: string;
  pestType: PestType;
  predicted: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

export interface BackendForecastResponse {
  success: boolean;
  data: {
    max_pest_count: number;
    min_pest_count: number;
    current_dates: string[];
    actual: number[];
    forecasted: {
      future_dates: { [index: string]: string };
      forecast: { [index: string]: number };
      ci_lower?: { [index: string]: number };
      ci_upper?: { [index: string]: number };
    };
  };
}

export interface AlertRecord {
  id: string;
  title: string;
  message: string;
  type: "alert" | "warning" | "info" | "success";
  timestamp: Date;
  read: boolean;
  priority: "high" | "medium" | "low";
  category:
  | "pest-alert"
  | "threshold"
  | "forecast"
  | "system"
  | "action-required";
  metadata?: {
    pestType?: PestType;
    location?: string;
    count?: number;
    threshold?: number;
  };
}

export interface ApiClientConfig {
  baseUrl: string;
  useMocks: boolean;
  fetchImpl: typeof fetch;
  getToken?: () => string | null;
}

export interface ApiRequestOptions extends RequestInit {
  mockResponse?: () => Promise<any> | any;
}

