import { describe, it, expect } from "vitest";
import { filterObservations, calculateKPIs } from "./data-service";
import type { PestObservation } from "@/shared/types/data";

const sampleObservations: PestObservation[] = [
  {
    id: "1",
    date: "2024-01-01",
    pestType: "Black Rice Bug",
    count: 60,
    threshold: 50,
    aboveThreshold: true,
    season: "Dry",
    fieldStage: "Seedling",
    location: "Field A",
    actionTaken: true,
  },
  {
    id: "2",
    date: "2024-02-10",
    pestType: "Black Rice Bug",
    count: 25,
    threshold: 40,
    aboveThreshold: false,
    season: "Dry",
    fieldStage: "Vegetative",
    location: "Field B",
    actionTaken: false,
  },
];

describe("data-service helpers", () => {
  it("filters observations by pest type", () => {
    const filtered = filterObservations(sampleObservations, {
      pestType: "Black Rice Bug",
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].pestType).toBe("Black Rice Bug");
  });

  it("calculates KPIs from observations", () => {
    const kpis = calculateKPIs(sampleObservations);
    expect(kpis.totalObservations).toBe(2);
    expect(kpis.percentAboveThreshold).toBeGreaterThan(0);
    expect(kpis.averagePestCount).toBeGreaterThan(0);
  });
});

