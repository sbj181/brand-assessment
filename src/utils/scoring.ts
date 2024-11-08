export function calculateTrendScore(trendsData: any) {
  const timelineData = trendsData.default.timelineData;
  
  // Get non-zero values
  const values = timelineData
    .filter((item: any) => item.hasData[0])
    .map((item: any) => item.value[0]);
  
  if (values.length === 0) return 0;
  
  // Calculate metrics
  const average = values.reduce((a: number, b: number) => a + b, 0) / values.length;
  const trend = values[values.length - 1] - values[0]; // Positive means upward trend
  
  // Score out of 100
  const score = Math.min(100, Math.max(0,
    (average * 0.6) + // Weight for average interest
    (trend > 0 ? 20 : 0) + // Bonus for upward trend
    (values.length > 3 ? 20 : 0) // Bonus for consistent data
  ));
  
  return Math.round(score);
} 