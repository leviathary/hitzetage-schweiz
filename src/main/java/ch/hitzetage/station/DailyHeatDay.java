package ch.hitzetage.station;

import java.time.LocalDate;

public record DailyHeatDay(
        LocalDate date,
        double maximumTemperatureCelsius,
        Double minimumTemperatureCelsius) {
}
