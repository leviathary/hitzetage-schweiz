package ch.hitzetage.station;

import java.util.List;

/** Abstraktion für die spätere Anbindung an MeteoSwiss Open Data. */
public interface StationDataSource {
    List<Station> findStations();

    List<AnnualHeatValue> findAnnualValues(String stationId, int fromYear, int toYear);
}

