package ch.hitzetage.station;

import java.util.List;

/** Abstraktion für die spätere Anbindung an MeteoSwiss Open Data. */
public interface StationDataSource {
    List<Station> findStations();

    List<AnnualHeatValue> findAnnualValues(String stationId, int fromYear, int toYear);

    List<DailyHeatDay> findHeatDays(String stationId, int year);

    List<DailyHeatDay> findFrostDays(String stationId, int year);

    List<DailyHeatDay> findIceDays(String stationId, int year);
}

