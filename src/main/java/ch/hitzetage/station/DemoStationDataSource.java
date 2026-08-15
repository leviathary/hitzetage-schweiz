package ch.hitzetage.station;

import org.springframework.stereotype.Component;
import org.springframework.context.annotation.Profile;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.time.LocalDate;
import java.time.YearMonth;

@Component
@Profile("demo")
class DemoStationDataSource implements StationDataSource {
    private static final List<Station> STATIONS = List.of(
            new Station("ZRH", "Zürich / Fluntern", "ZH", 556, 47.3782, 8.5659),
            new Station("GVE", "Genève / Cointrin", "GE", 411, 46.2475, 6.1275),
            new Station("BAS", "Basel / Binningen", "BL", 316, 47.5411, 7.5836)
    );

    private static final Map<String, List<AnnualHeatValue>> VALUES = Map.of(
            "ZRH", List.of(new AnnualHeatValue(2022, 21, 3, 34, 4, 58, 4, 6, 9, 36.2, -3.1, -8.1, 22.1), new AnnualHeatValue(2023, 26, 5, 29, 3, 64, 5, 8, 7, 36.5, -2.4, -7.4, 22.8), new AnnualHeatValue(2024, 14, 2, 31, 2, 49, 0, 4, 8, 34.9, -1.2, -6.9, 21.4)),
            "GVE", List.of(new AnnualHeatValue(2022, 29, 8, 18, 2, 70, 8, 9, 5, 38.3, -1.8, -5.2, 23.2), new AnnualHeatValue(2023, 32, 11, 15, 1, 74, 10, 10, 4, 39.3, -0.8, -4.8, 24.0), new AnnualHeatValue(2024, 20, 6, 20, 2, 61, 3, 6, 6, 36.7, -1.4, -5.5, 22.7)),
            "BAS", List.of(new AnnualHeatValue(2022, 31, 9, 24, 3, 72, 7, 9, 6, 37.0, -2.2, -6.0, 23.4), new AnnualHeatValue(2023, 36, 12, 21, 2, 79, 9, 11, 5, 37.6, -1.1, -5.7, 24.1), new AnnualHeatValue(2024, 23, 7, 26, 3, 65, 3, 7, 7, 35.7, -1.7, -6.2, 22.9))
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
    public List<DailyHeatDay> findTropicalNights(String stationId, int year) {
        if (VALUES.getOrDefault(stationId.toUpperCase(Locale.ROOT), List.of()).stream().noneMatch(value -> value.year() == year)) return List.of();
        return List.of(new DailyHeatDay(LocalDate.of(year, 7, 12), 33.7, 20.1));
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

    @Override
    public List<DailyHeatDay> findSummerDays(String stationId, int year) {
        return findHeatDays(stationId, year);
    }

    @Override
    public List<DailyHeatDay> findVeryHotDays(String stationId, int year) {
        return findHeatDays(stationId, year).stream().filter(day -> day.maximumTemperatureCelsius() >= 35.0).toList();
    }

    @Override
    public List<DailyTemperature> findDailyTemperatures(String stationId, int year) {
        return java.util.stream.IntStream.rangeClosed(1, LocalDate.of(year, 12, 31).lengthOfYear())
                .mapToObj(day -> LocalDate.ofYearDay(year, day))
                .map(date -> {
                    double seasonal = 11 + 13 * Math.sin((date.getDayOfYear() - 105) * Math.PI * 2 / 365.25);
                    double variation = Math.sin((date.getDayOfYear() * 17 + stationId.hashCode()) * .31) * 4;
                    double maximum = Math.round((seasonal + variation + 5) * 10) / 10.0;
                    return new DailyTemperature(date, maximum, Math.round((maximum - 8) * 10) / 10.0);
                }).toList();
    }

    @Override
    public PrecipitationSummary findPrecipitation(String stationId, int fromYear, int toYear, int detailYear) {
        var annual = java.util.stream.IntStream.rangeClosed(fromYear, toYear)
                .mapToObj(year -> new PrecipitationSummary.AnnualTotal(year, 760 + Math.floorMod(year * 47 + stationId.hashCode(), 430))).toList();
        double elapsedYearShare = LocalDate.now().getDayOfYear() / (double) LocalDate.now().lengthOfYear();
        var annualToDate = annual.stream()
                .map(value -> new PrecipitationSummary.AnnualTotal(value.year(), Math.round(value.millimetres() * elapsedYearShare * 10.0) / 10.0)).toList();
        var monthly = java.util.stream.IntStream.rangeClosed(1, 12)
                .mapToObj(month -> new PrecipitationSummary.MonthlyTotal(YearMonth.of(detailYear, month), 28 + Math.floorMod(month * 23 + stationId.hashCode(), 95))).toList();
        var daily = java.util.stream.IntStream.rangeClosed(1, 28)
                .mapToObj(day -> new DailyPrecipitation(LocalDate.of(detailYear, 7, day), day % 5 == 0 ? 18 + day : day % 3 == 0 ? 3.4 : 0)).toList();
        return new PrecipitationSummary(annual, annualToDate, monthly, daily,
                daily.stream().max(java.util.Comparator.comparingDouble(DailyPrecipitation::millimetres)).orElse(null),
                monthly.stream().min(java.util.Comparator.comparingDouble(PrecipitationSummary.MonthlyTotal::millimetres)).orElse(null), 8, detailYear);
    }
}
