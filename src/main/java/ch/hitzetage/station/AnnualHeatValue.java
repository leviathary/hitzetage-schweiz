package ch.hitzetage.station;

public record AnnualHeatValue(
        int year,
        int heatDays,
        int tropicalNights,
        int summerDays,
        int veryHotDays,
        int longestHeatWaveDays,
        double maximumTemperatureCelsius,
        double minimumTemperatureCelsius,
        double warmestNightCelsius) {
}
