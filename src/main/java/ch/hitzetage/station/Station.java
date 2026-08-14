package ch.hitzetage.station;

public record Station(
        String id,
        String name,
        String canton,
        int elevationMetres,
        double latitude,
        double longitude,
        String countryCode,
        String countryName,
        String dataProvider,
        Integer dataAvailableThroughYear) {

    public Station(String id, String name, String canton, int elevationMetres, double latitude, double longitude,
                   String countryCode, String countryName, String dataProvider) {
        this(id, name, canton, elevationMetres, latitude, longitude, countryCode, countryName, dataProvider, null);
    }

    public Station(String id, String name, String canton, int elevationMetres, double latitude, double longitude) {
        this(id, name, canton, elevationMetres, latitude, longitude, "CH", "Schweiz", "MeteoSwiss", null);
    }
}
