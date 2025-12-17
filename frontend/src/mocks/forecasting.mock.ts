import type { ForecastData } from "@/shared/lib/data-service";

export const generateForecastData = (): ForecastData[] => {
  const forecasts: ForecastData[] = [];
  const pestTypes: Array<'Black Rice Bug'> = ['Black Rice Bug'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate 30 days of forecast data starting from today (i=0) through 29 days ahead
  for (let i = 0; i < 30; i++) {
    const forecastDate = new Date(today);
    forecastDate.setDate(today.getDate() + i);

    for (const pestType of pestTypes) {
      const basePrediction = pestType === 'Black Rice Bug'
        ? Math.floor(Math.random() * 40) + 30
        : Math.floor(Math.random() * 30) + 20;

      // Add seasonal variation and trend
      const predicted = basePrediction + Math.sin((i + 1) / 2) * 10;
      
      // Confidence decreases over time (95% at day 0/today, ~80% at day 29)
      const confidence = 95 - ((i + 1) * 0.5);
      const margin = predicted * (1 - confidence / 100) * 2;

      forecasts.push({
        date: forecastDate.toISOString().split('T')[0],
        pestType,
        predicted: Math.floor(predicted),
        lowerBound: Math.floor(predicted - margin),
        upperBound: Math.floor(predicted + margin),
        confidence: Math.floor(confidence)
      });
    }
  }

  return forecasts;
};
