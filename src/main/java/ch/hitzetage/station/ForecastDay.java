package ch.hitzetage.station;

import java.time.LocalDate;

public record ForecastDay(LocalDate date, double minimumTemperatureCelsius, double maximumTemperatureCelsius,
                          boolean predictedHeatDay, boolean predictedTropicalNight) {
}
