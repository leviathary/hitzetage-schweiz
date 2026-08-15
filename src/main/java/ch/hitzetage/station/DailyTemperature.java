package ch.hitzetage.station;

import java.time.LocalDate;

public record DailyTemperature(
        LocalDate date,
        Double maximumTemperatureCelsius,
        Double minimumTemperatureCelsius) {
}
