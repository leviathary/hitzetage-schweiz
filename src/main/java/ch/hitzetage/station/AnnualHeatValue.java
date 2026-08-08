package ch.hitzetage.station;

public record AnnualHeatValue(
        int year,
        int heatDays,
        int tropicalNights,
        double maximumTemperatureCelsius,
        double minimumTemperatureCelsius) {
}
