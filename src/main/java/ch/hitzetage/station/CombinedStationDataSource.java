package ch.hitzetage.station;

import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Primary
@Profile("!demo")
class CombinedStationDataSource implements StationDataSource {
    private final MeteoSwissStationDataSource meteoSwiss;
    private final DwdStationDataSource dwd;
    private final KnmiStationDataSource knmi;

    CombinedStationDataSource(MeteoSwissStationDataSource meteoSwiss, DwdStationDataSource dwd, KnmiStationDataSource knmi) {
        this.meteoSwiss = meteoSwiss;
        this.dwd = dwd;
        this.knmi = knmi;
    }

    @Override public List<Station> findStations() {
        return java.util.stream.Stream.of(meteoSwiss.findStations(), dwd.findStations(), knmi.findStations()).flatMap(List::stream)
                .sorted(java.util.Comparator.comparing(Station::countryCode).thenComparing(Station::name, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    private StationDataSource source(String stationId) {
        if (stationId.regionMatches(true, 0, "DE:", 0, 3)) return dwd;
        if (stationId.regionMatches(true, 0, "NL:", 0, 3)) return knmi;
        return meteoSwiss;
    }
    @Override public List<AnnualHeatValue> findAnnualValues(String id, int from, int to) { return source(id).findAnnualValues(id, from, to); }
    @Override public List<DailyHeatDay> findHeatDays(String id, int year) { return source(id).findHeatDays(id, year); }
    @Override public List<DailyHeatDay> findTropicalNights(String id, int year) { return source(id).findTropicalNights(id, year); }
    @Override public List<DailyHeatDay> findFrostDays(String id, int year) { return source(id).findFrostDays(id, year); }
    @Override public List<DailyHeatDay> findIceDays(String id, int year) { return source(id).findIceDays(id, year); }
    @Override public List<DailyHeatDay> findSummerDays(String id, int year) { return source(id).findSummerDays(id, year); }
    @Override public List<DailyHeatDay> findVeryHotDays(String id, int year) { return source(id).findVeryHotDays(id, year); }
    @Override public PrecipitationSummary findPrecipitation(String id, int from, int to, int detail) { return source(id).findPrecipitation(id, from, to, detail); }
}
