import type { PestObservation, FieldStage, Season } from "@/shared/types/data";

// Cache for generated observations
let cachedObservations: PestObservation[] | null = null;

// All 7 field stages from CSV
const FIELD_STAGES: FieldStage[] = [
  "Seedling",
  "Vegetative",
  "Reproductive",
  "Ripening",
  "Harvest",
  "Fallow",
  "Land Prep",
  "Nursery",
];

// Field stage weights - matching CSV patterns where certain stages are more common
const FIELD_STAGE_WEIGHTS = [0.05, 0.25, 0.25, 0.20, 0.10, 0.05, 0.05, 0.05];

/**
 * Get season based on month (matching CSV logic)
 * Dry: Nov-Apr (months 11, 12, 1, 2, 3, 4)
 * Wet: May-Oct (months 5, 6, 7, 8, 9, 10)
 */
function getSeason(date: Date): Season {
  const month = date.getMonth() + 1; // getMonth() returns 0-11
  return month >= 5 && month <= 10 ? "Wet" : "Dry";
}

/**
 * Get random field stage based on weighted distribution
 */
function getRandomFieldStage(): FieldStage {
  const random = Math.random();
  let cumulative = 0;
  for (let i = 0; i < FIELD_STAGES.length; i++) {
    cumulative += FIELD_STAGE_WEIGHTS[i];
    if (random <= cumulative) {
      return FIELD_STAGES[i];
    }
  }
  return FIELD_STAGES[FIELD_STAGES.length - 1];
}

/**
 * Generate random pest count (0-25 range, matching CSV patterns)
 * Most values are in 0-12 range, with occasional higher values
 */
function generatePestCount(): number {
  const random = Math.random();
  if (random < 0.5) {
    // 50% chance: 0-5 range
    return Math.floor(Math.random() * 6);
  } else if (random < 0.8) {
    // 30% chance: 5-12 range
    return 5 + Math.floor(Math.random() * 8);
  } else if (random < 0.95) {
    // 15% chance: 12-20 range
    return 12 + Math.floor(Math.random() * 9);
  } else {
    // 5% chance: 20-25 range
    return 20 + Math.floor(Math.random() * 6);
  }
}

/**
 * Calculate threshold status based on pest count (matching CSV logic)
 * - Count < 5: Below Threshold (threshold: 5, aboveThreshold: false)
 * - Count >= 5 and < 10: Economic Threshold (threshold: 5, aboveThreshold: true)
 * - Count >= 10: Economic Damage (threshold: 10, aboveThreshold: true)
 */
function calculateThreshold(count: number): { threshold: number; aboveThreshold: boolean } {
  if (count < 5) {
    return { threshold: 5, aboveThreshold: false };
  } else if (count < 10) {
    return { threshold: 5, aboveThreshold: true };
  } else {
    return { threshold: 10, aboveThreshold: true };
  }
}

/**
 * Determine if action was taken based on threshold status (matching CSV patterns)
 * - Higher probability when above threshold (~60-80%)
 * - Lower probability when below threshold (~10-20%)
 */
function shouldTakeAction(aboveThreshold: boolean): boolean {
  if (aboveThreshold) {
    return Math.random() < 0.7; // 70% chance when above threshold
  } else {
    return Math.random() < 0.15; // 15% chance when below threshold
  }
}

/**
 * Format date as YYYY-MM-DD string
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Generate mock observations matching CSV structure and characteristics
 * - All 7 field stages
 * - Threshold values: 5 (Economic Threshold), 10 (Economic Damage)
 * - Date range: Last 2-3 years
 * - Pest count ranges: 0-25 (matching CSV patterns)
 * - Season logic: Dry (Nov-Apr), Wet (May-Oct)
 * - Location: undefined for all records
 * - Action mapping based on threshold status
 */
export const generateObservations = (): PestObservation[] => {
  // If already cached, return immediately
  if (cachedObservations) {
    return cachedObservations;
  }

  const observations: PestObservation[] = [];
  const today = new Date();
  const startDate = new Date(today);
  startDate.setFullYear(today.getFullYear() - 2); // 2-3 years back

  // Generate observations - approximately 2-3 observations per week
  const totalDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const observationsCount = Math.floor(totalDays * 0.3); // ~2-3 per week

  let idCounter = 1;

  for (let i = 0; i < observationsCount; i++) {
    // Distribute dates evenly across the time range
    const daysOffset = Math.floor((i / observationsCount) * totalDays);
    const observationDate = new Date(startDate);
    observationDate.setDate(observationDate.getDate() + daysOffset);

    // Add some randomness to dates (±3 days) for more natural distribution
    const randomOffset = Math.floor(Math.random() * 7) - 3;
    observationDate.setDate(observationDate.getDate() + randomOffset);

    // Skip if date is in the future
    if (observationDate > today) {
      continue;
    }

    const pestCount = generatePestCount();
    const { threshold, aboveThreshold } = calculateThreshold(pestCount);
    const actionTaken = shouldTakeAction(aboveThreshold);

    const observation: PestObservation = {
      id: `OBS-${idCounter.toString().padStart(4, "0")}`,
      date: formatDate(observationDate),
      pestType: "Black Rice Bug",
      count: pestCount,
      threshold,
      aboveThreshold,
      season: getSeason(observationDate),
      fieldStage: getRandomFieldStage(),
      location: undefined, // Matching CSV - no location data
      actionTaken,
      actionType: undefined, // Matching CSV - no specific action type
      actionDate: actionTaken ? formatDate(observationDate) : undefined,
    };

    observations.push(observation);
    idCounter++;
  }

  // Sort by date (oldest first)
  observations.sort((a, b) => a.date.localeCompare(b.date));

  // Ensure the last 7 days have at least one observation per day
  // This ensures the overview chart has sufficient historical data
  const todayForRecent = new Date();
  todayForRecent.setHours(0, 0, 0, 0);
  const existingDates = new Set(observations.map(obs => obs.date));
  
  for (let i = 6; i >= 0; i--) {
    const checkDate = new Date(todayForRecent);
    checkDate.setDate(todayForRecent.getDate() - i);
    const dateStr = formatDate(checkDate);
    
    if (!existingDates.has(dateStr)) {
      // Add an observation for this missing day
      const pestCount = generatePestCount();
      const { threshold, aboveThreshold } = calculateThreshold(pestCount);
      const actionTaken = shouldTakeAction(aboveThreshold);
      
      observations.push({
        id: `OBS-${(observations.length + 1).toString().padStart(4, "0")}`,
        date: dateStr,
        pestType: "Black Rice Bug",
        count: pestCount,
        threshold,
        aboveThreshold,
        season: getSeason(checkDate),
        fieldStage: getRandomFieldStage(),
        location: undefined,
        actionTaken,
        actionType: undefined,
        actionDate: actionTaken ? dateStr : undefined,
      });
    }
  }
  
  // Re-sort after adding recent observations
  observations.sort((a, b) => a.date.localeCompare(b.date));

  cachedObservations = observations;
  console.log(`Generated ${observations.length} mock observations matching CSV structure`);
  return observations;
};

/**
 * Get observations with async support for backward compatibility
 */
export const getObservationsAsync = async (): Promise<PestObservation[]> => {
  return Promise.resolve(generateObservations());
};

