package ch.hitzetage.station;

public record AnnualHeatValue(
        int year,
        int heatDays,
        int tropicalNights,
        int frostDays,
        int iceDays,
        int summerDays,
        int veryHotDays,
        int longestHeatWaveDays,
        int longestFrostPeriodDays,
        double maximumTemperatureCelsius,
        double lowestMaximumTemperatureCelsius,
        double minimumTemperatureCelsius,
        double warmestNightCelsius) {
}
