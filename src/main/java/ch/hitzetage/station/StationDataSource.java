package ch.hitzetage.station;

import java.util.List;

/** Abstraktion für die spätere Anbindung an MeteoSwiss Open Data. */
public interface StationDataSource {
    List<Station> findStations();

    List<AnnualHeatValue> findAnnualValues(String stationId, int fromYear, int toYear);

    List<DailyHeatDay> findHeatDays(String stationId, int year);

    List<DailyHeatDay> findTropicalNights(String stationId, int year);

    List<DailyHeatDay> findFrostDays(String stationId, int year);

    List<DailyHeatDay> findIceDays(String stationId, int year);

    List<DailyHeatDay> findSummerDays(String stationId, int year);

    List<DailyHeatDay> findVeryHotDays(String stationId, int year);

    PrecipitationSummary findPrecipitation(String stationId, int fromYear, int toYear, int detailYear);
}

