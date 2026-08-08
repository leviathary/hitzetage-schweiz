package ch.hitzetage.station;

import org.springframework.stereotype.Component;
import org.springframework.context.annotation.Profile;

import java.util.List;
import java.util.Locale;
import java.util.Map;

@Component
@Profile("demo")
class DemoStationDataSource implements StationDataSource {
    private static final List<Station> STATIONS = List.of(
            new Station("ZRH", "Zürich / Fluntern", "ZH", 556, 47.3782, 8.5659),
            new Station("GVE", "Genève / Cointrin", "GE", 411, 46.2475, 6.1275),
            new Station("BAS", "Basel / Binningen", "BL", 316, 47.5411, 7.5836)
    );

    private static final Map<String, List<AnnualHeatValue>> VALUES = Map.of(
            "ZRH", List.of(new AnnualHeatValue(2022, 21, 3, 58, 4, 6, 36.2, -8.1, 22.1), new AnnualHeatValue(2023, 26, 5, 64, 5, 8, 36.5, -7.4, 22.8), new AnnualHeatValue(2024, 14, 2, 49, 0, 4, 34.9, -6.9, 21.4)),
            "GVE", List.of(new AnnualHeatValue(2022, 29, 8, 70, 8, 9, 38.3, -5.2, 23.2), new AnnualHeatValue(2023, 32, 11, 74, 10, 10, 39.3, -4.8, 24.0), new AnnualHeatValue(2024, 20, 6, 61, 3, 6, 36.7, -5.5, 22.7)),
            "BAS", List.of(new AnnualHeatValue(2022, 31, 9, 72, 7, 9, 37.0, -6.0, 23.4), new AnnualHeatValue(2023, 36, 12, 79, 9, 11, 37.6, -5.7, 24.1), new AnnualHeatValue(2024, 23, 7, 65, 3, 7, 35.7, -6.2, 22.9))
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
}
