package ch.hitzetage.station;

import org.springframework.stereotype.Component;
import org.springframework.context.annotation.Profile;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.time.LocalDate;

@Component
@Profile("demo")
class DemoStationDataSource implements StationDataSource {
    private static final List<Station> STATIONS = List.of(
            new Station("ZRH", "Zürich / Fluntern", "ZH", 556, 47.3782, 8.5659),
            new Station("GVE", "Genève / Cointrin", "GE", 411, 46.2475, 6.1275),
            new Station("BAS", "Basel / Binningen", "BL", 316, 47.5411, 7.5836)
    );

    private static final Map<String, List<AnnualHeatValue>> VALUES = Map.of(
            "ZRH", List.of(new AnnualHeatValue(2022, 21, 3, 34, 4, 58, 4, 6, 36.2, -3.1, -8.1, 22.1), new AnnualHeatValue(2023, 26, 5, 29, 3, 64, 5, 8, 36.5, -2.4, -7.4, 22.8), new AnnualHeatValue(2024, 14, 2, 31, 2, 49, 0, 4, 34.9, -1.2, -6.9, 21.4)),
            "GVE", List.of(new AnnualHeatValue(2022, 29, 8, 18, 2, 70, 8, 9, 38.3, -1.8, -5.2, 23.2), new AnnualHeatValue(2023, 32, 11, 15, 1, 74, 10, 10, 39.3, -0.8, -4.8, 24.0), new AnnualHeatValue(2024, 20, 6, 20, 2, 61, 3, 6, 36.7, -1.4, -5.5, 22.7)),
            "BAS", List.of(new AnnualHeatValue(2022, 31, 9, 24, 3, 72, 7, 9, 37.0, -2.2, -6.0, 23.4), new AnnualHeatValue(2023, 36, 12, 21, 2, 79, 9, 11, 37.6, -1.1, -5.7, 24.1), new AnnualHeatValue(2024, 23, 7, 26, 3, 65, 3, 7, 35.7, -1.7, -6.2, 22.9))
    );

    @Override
    public List<Station> findStations() {
        return STATIONS;
    }

    @Override
    public List<AnnualHeatValue> findAnnualValues(String stationId, int fromYear, int toYear) {
        return VALUES.getOrDefault(stationId.toUpperCase(Locale.ROOT), List.of()).stream()
                .filter(value -> value.year() >= fromYear && value.year() <= toYear)
                .toList();
    }

    @Override
    public List<DailyHeatDay> findHeatDays(String stationId, int year) {
        if (VALUES.getOrDefault(stationId.toUpperCase(Locale.ROOT), List.of()).stream().noneMatch(value -> value.year() == year)) {
            return List.of();
        }
        return List.of(
                new DailyHeatDay(LocalDate.of(year, 6, 18), 30.4, 18.2),
                new DailyHeatDay(LocalDate.of(year, 7, 12), 33.7, 20.1),
                new DailyHeatDay(LocalDate.of(year, 8, 23), 31.8, 19.4));
    }

    @Override
    public List<DailyHeatDay> findFrostDays(String stationId, int year) {
        if (VALUES.getOrDefault(stationId.toUpperCase(Locale.ROOT), List.of()).stream().noneMatch(value -> value.year() == year)) return List.of();
        return List.of(
                new DailyHeatDay(LocalDate.of(year, 1, 18), 2.4, -4.2),
                new DailyHeatDay(LocalDate.of(year, 2, 12), 1.7, -2.1),
                new DailyHeatDay(LocalDate.of(year, 12, 3), 3.1, -1.4));
    }

    @Override
    public List<DailyHeatDay> findIceDays(String stationId, int year) {
        if (VALUES.getOrDefault(stationId.toUpperCase(Locale.ROOT), List.of()).stream().noneMatch(value -> value.year() == year)) return List.of();
        return List.of(
                new DailyHeatDay(LocalDate.of(year, 1, 19), -1.2, -5.4),
                new DailyHeatDay(LocalDate.of(year, 12, 4), -0.7, -3.8));
    }
}
