import type { ForecastData } from "@/shared/types/data";

export const generateForecastData = (): ForecastData[] => {
  const forecasts: ForecastData[] = [];
  const pestTypes: Array<'Black Rice Bug'> = ['Black Rice Bug'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate 30 days of forecast data starting from TOMORROW (history ends today)
  for (let i = 0; i < 30; i++) {
    const forecastDate = new Date(today);
    forecastDate.setDate(today.getDate() + i + 1); // Start from tomorrow

    for (const pestType of pestTypes) {
      // Generate realistic values that connect with recent history (typically 5-25 range)
      const basePrediction = pestType === 'Black Rice Bug'
        ? Math.floor(Math.random() * 15) + 5 // Range 5-20
        : Math.floor(Math.random() * 10) + 5;

      // Add seasonal variation and trend - keep it fluctuating
      const fluctuation = Math.sin((i + 1) / 1.5) * 5;
      const predicted = Math.max(0, basePrediction + fluctuation);

      // Confidence decreases over time (95% at day 1, ~80% at day 30)
      const confidence = 95 - ((i + 1) * 0.5);
      const margin = Math.max(2, predicted * (1 - confidence / 100) * 4); // Ensure visible confidence band

      forecasts.push({
        date: forecastDate.toISOString().split('T')[0],
        pestType,
        predicted: Math.floor(predicted),
        lowerBound: Math.max(0, Math.floor(predicted - margin)),
        upperBound: Math.floor(predicted + margin),
        confidence: Math.floor(confidence)
      });
    }
  }

  return forecasts;
};
