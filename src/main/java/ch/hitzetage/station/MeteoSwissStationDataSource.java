package ch.hitzetage.station;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Profile("!demo")
class MeteoSwissStationDataSource implements StationDataSource {
    private static final String BASE_URL = "https://data.geo.admin.ch/ch.meteoschweiz.ogd-smn";
    private static final URI STATIONS_URI = URI.create(BASE_URL + "/ogd-smn_meta_stations.csv");
    private static final Duration CACHE_DURATION = Duration.ofHours(6);
    private static final DateTimeFormatter TIMESTAMP = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

    private final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();
    private final Map<String, CacheEntry<String>> cache = new ConcurrentHashMap<>();
    private final Map<String, CacheEntry<List<DailyObservation>>> dailyCache = new ConcurrentHashMap<>();

    @Override
    public List<Station> findStations() {
        List<Map<String, String>> rows = parseCsv(downloadCached(STATIONS_URI));
        return rows.stream()
                .map(this::toStation)
                .filter(station -> !station.id().isBlank())
                .sorted(Comparator.comparing(Station::name, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    @Override
    public List<AnnualHeatValue> findAnnualValues(String stationId, int fromYear, int toYear) {
        List<DailyObservation> rows = dailyRows(stationId, toYear);

        Map<LocalDate, DailyObservation> uniqueRows = new java.util.TreeMap<>();
        rows.forEach(row -> uniqueRows.put(row.date(), row));
        Map<Integer, YearAccumulator> years = new LinkedHashMap<>();
        for (DailyObservation row : uniqueRows.values()) {
            int year = row.date().getYear();
            if ((row.maximum() == null && row.minimum() == null) || year < fromYear || year > toYear) {
                continue;
            }
            years.computeIfAbsent(year, ignored -> new YearAccumulator()).add(row.date(), row.maximum(), row.minimum());
        }
        return years.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> new AnnualHeatValue(
                        entry.getKey(),
                        entry.getValue().heatDays,
                        entry.getValue().tropicalNights,
                        entry.getValue().frostDays,
                        entry.getValue().iceDays,
                        entry.getValue().summerDays,
                        entry.getValue().veryHotDays,
                        entry.getValue().longestHeatWaveDays,
                        entry.getValue().longestFrostPeriodDays,
                        entry.getValue().maximumValue(),
                        entry.getValue().lowestMaximumValue(),
                        entry.getValue().minimumValue(),
                        entry.getValue().warmestNightValue()))
                .toList();
    }

    @Override
    public List<DailyHeatDay> findHeatDays(String stationId, int year) {
        Map<LocalDate, DailyHeatDay> days = new LinkedHashMap<>();
        for (DailyObservation row : dailyRows(stationId, year)) {
            if (row.date().getYear() != year || row.maximum() == null || row.maximum() < 30.0) {
                continue;
            }
            days.put(row.date(), new DailyHeatDay(row.date(), row.maximum(), row.minimum()));
        }
        return days.values().stream()
                .sorted(Comparator.comparing(DailyHeatDay::date))
                .toList();
    }

    @Override
    public List<DailyHeatDay> findTropicalNights(String stationId, int year) {
        Map<LocalDate, DailyHeatDay> days = new LinkedHashMap<>();
        for (DailyObservation row : dailyRows(stationId, year)) {
            if (row.date().getYear() != year || row.minimum() == null || row.minimum() < 20.0) continue;
            days.put(row.date(), new DailyHeatDay(row.date(), row.maximum() == null ? row.minimum() : row.maximum(), row.minimum()));
        }
        return days.values().stream().sorted(Comparator.comparing(DailyHeatDay::date)).toList();
    }

    @Override
    public List<DailyHeatDay> findFrostDays(String stationId, int year) {
        Map<LocalDate, DailyHeatDay> days = new LinkedHashMap<>();
        for (DailyObservation row : dailyRows(stationId, year)) {
            if (row.date().getYear() != year || row.minimum() == null || row.minimum() >= 0.0) continue;
            days.put(row.date(), new DailyHeatDay(row.date(), row.maximum() == null ? 0.0 : row.maximum(), row.minimum()));
        }
        return days.values().stream().sorted(Comparator.comparing(DailyHeatDay::date)).toList();
    }

    @Override
    public List<DailyHeatDay> findIceDays(String stationId, int year) {
        Map<LocalDate, DailyHeatDay> days = new LinkedHashMap<>();
        for (DailyObservation row : dailyRows(stationId, year)) {
            if (row.date().getYear() != year || row.maximum() == null || row.maximum() >= 0.0) continue;
            days.put(row.date(), new DailyHeatDay(row.date(), row.maximum(), row.minimum()));
        }
        return days.values().stream().sorted(Comparator.comparing(DailyHeatDay::date)).toList();
    }

    @Override
    public List<DailyHeatDay> findSummerDays(String stationId, int year) {
        return findMaximumDays(stationId, year, 25.0);
    }

    @Override
    public List<DailyHeatDay> findVeryHotDays(String stationId, int year) {
        return findMaximumDays(stationId, year, 35.0);
    }

    @Override
    public List<DailyTemperature> findDailyTemperatures(String stationId, int year) {
        return dailyRows(stationId, year).stream().filter(row -> row.date().getYear() == year)
                .filter(row -> row.maximum() != null || row.minimum() != null)
                .map(row -> new DailyTemperature(row.date(), row.maximum(), row.minimum()))
                .sorted(Comparator.comparing(DailyTemperature::date)).toList();
    }

    @Override
    public PrecipitationSummary findPrecipitation(String stationId, int fromYear, int toYear, int detailYear) {
        Map<LocalDate, Double> values = new java.util.TreeMap<>();
        for (DailyObservation row : dailyRows(stationId, Math.max(toYear, detailYear))) {
            if (row.precipitation() != null && row.date().getYear() >= fromYear && row.date().getYear() <= toYear) {
                values.put(row.date(), row.precipitation());
            }
        }
        Map<Integer, Double> annual = new java.util.TreeMap<>();
        Map<Integer, Double> annualToDate = new java.util.TreeMap<>();
        Map<YearMonth, Double> monthly = new java.util.TreeMap<>();
        LocalDate today = LocalDate.now();
        values.forEach((date, amount) -> {
            annual.merge(date.getYear(), amount, Double::sum);
            if (date.getMonthValue() < today.getMonthValue()
                    || (date.getMonthValue() == today.getMonthValue() && date.getDayOfMonth() <= today.getDayOfMonth())) {
                annualToDate.merge(date.getYear(), amount, Double::sum);
            }
            monthly.merge(YearMonth.from(date), amount, Double::sum);
        });
        List<DailyPrecipitation> daily = values.entrySet().stream()
                .filter(entry -> entry.getKey().getYear() == detailYear)
                .map(entry -> new DailyPrecipitation(entry.getKey(), entry.getValue())).toList();
        DailyPrecipitation strongest = values.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(entry -> new DailyPrecipitation(entry.getKey(), entry.getValue())).orElse(null);
        var driest = monthly.entrySet().stream().min(Map.Entry.comparingByValue())
                .map(entry -> new PrecipitationSummary.MonthlyTotal(entry.getKey(), round(entry.getValue()))).orElse(null);
        int longestDry = 0, currentDry = 0;
        Integer longestDryYear = null;
        LocalDate previous = null;
        for (var entry : values.entrySet()) {
            if (previous == null || entry.getKey().equals(previous.plusDays(1))) {
                currentDry = entry.getValue() < 1.0 ? currentDry + 1 : 0;
            } else currentDry = entry.getValue() < 1.0 ? 1 : 0;
            if (currentDry > longestDry) {
                longestDry = currentDry;
                longestDryYear = entry.getKey().getYear();
            }
            previous = entry.getKey();
        }
        return new PrecipitationSummary(
                annual.entrySet().stream().map(e -> new PrecipitationSummary.AnnualTotal(e.getKey(), round(e.getValue()))).toList(),
                annualToDate.entrySet().stream().map(e -> new PrecipitationSummary.AnnualTotal(e.getKey(), round(e.getValue()))).toList(),
                monthly.entrySet().stream().filter(e -> e.getKey().getYear() == detailYear).map(e -> new PrecipitationSummary.MonthlyTotal(e.getKey(), round(e.getValue()))).toList(),
                daily, strongest, driest, longestDry, longestDryYear);
    }

    private static double round(double value) { return Math.round(value * 10.0) / 10.0; }

    private List<DailyHeatDay> findMaximumDays(String stationId, int year, double threshold) {
        Map<LocalDate, DailyHeatDay> days = new LinkedHashMap<>();
        for (DailyObservation row : dailyRows(stationId, year)) {
            if (row.date().getYear() != year || row.maximum() == null || row.maximum() < threshold) continue;
            days.put(row.date(), new DailyHeatDay(row.date(), row.maximum(), row.minimum()));
        }
        return days.values().stream().sorted(Comparator.comparing(DailyHeatDay::date)).toList();
    }

    private List<DailyObservation> dailyRows(String stationId, int toYear) {
        String id = stationId.toLowerCase(Locale.ROOT);
        List<DailyObservation> rows = new ArrayList<>();
        rows.addAll(downloadDaily(URI.create(BASE_URL + "/" + id + "/ogd-smn_" + id + "_d_historical.csv")));
        if (toYear >= java.time.Year.now().getValue()) {
            rows.addAll(downloadDaily(URI.create(BASE_URL + "/" + id + "/ogd-smn_" + id + "_d_recent.csv")));
        }
        return rows;
    }

    private synchronized List<DailyObservation> downloadDaily(URI uri) {
        String key = uri.toString();
        CacheEntry<List<DailyObservation>> cached = dailyCache.get(key);
        if (cached != null && !cached.expired()) return cached.value;
        try {
            List<DailyObservation> observations = parseDailyCsv(download(uri));
            dailyCache.put(key, new CacheEntry<>(observations, System.nanoTime()));
            return observations;
        } catch (MeteoSwissDataException exception) {
            if (cached != null) return cached.value;
            throw exception;
        }
    }

    private Station toStation(Map<String, String> row) {
        String id = value(row, "station_abbr", "station_id", "abbr").toUpperCase(Locale.ROOT);
        String name = value(row, "station_name", "name");
        String canton = value(row, "station_canton", "canton");
        int elevation = parseInteger(value(row, "station_height_masl", "station_height", "elevation"));
        double latitude = parseCoordinate(value(row, "station_coordinates_wgs84_lat", "latitude"));
        double longitude = parseCoordinate(value(row, "station_coordinates_wgs84_lon", "longitude"));
        return new Station(id, name.isBlank() ? id : name, canton, elevation, latitude, longitude);
    }

    private String downloadCached(URI uri) {
        CacheEntry<String> cached = cache.get(uri.toString());
        if (cached != null && !cached.expired()) {
            return cached.value;
        }
        try {
            String body = download(uri);
            cache.put(uri.toString(), new CacheEntry<>(body, System.nanoTime()));
            return body;
        } catch (MeteoSwissDataException exception) {
            if (cached != null) return cached.value;
            throw exception;
        }
    }

    private String download(URI uri) {
        HttpRequest request = HttpRequest.newBuilder(uri)
                .timeout(Duration.ofSeconds(30))
                .header("Accept", "text/csv")
                .header("User-Agent", "hitzetage-schweiz/0.1")
                .GET()
                .build();
        try {
            HttpResponse<byte[]> response = client.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() != 200) {
                throw new MeteoSwissDataException("MeteoSwiss antwortete mit HTTP " + response.statusCode());
            }
            return decodeCsv(response.body());
        } catch (IOException exception) {
            throw new MeteoSwissDataException("MeteoSwiss ist momentan nicht erreichbar", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new MeteoSwissDataException("Abruf von MeteoSwiss wurde unterbrochen", exception);
        }
    }

    private static String decodeCsv(byte[] bytes) {
        String utf8 = new String(bytes, StandardCharsets.UTF_8);
        return utf8.indexOf('\uFFFD') >= 0
                ? new String(bytes, StandardCharsets.ISO_8859_1)
                : utf8;
    }

    static List<Map<String, String>> parseCsv(String csv) {
        List<String> lines = csv.lines().filter(line -> !line.isBlank()).toList();
        if (lines.isEmpty()) return List.of();
        List<String> headers = splitLine(lines.getFirst()).stream()
                .map(header -> header.replace("\uFEFF", "").trim().toLowerCase(Locale.ROOT))
                .toList();
        List<Map<String, String>> rows = new ArrayList<>();
        for (int lineIndex = 1; lineIndex < lines.size(); lineIndex++) {
            List<String> values = splitLine(lines.get(lineIndex));
            Map<String, String> row = new LinkedHashMap<>();
            for (int column = 0; column < headers.size(); column++) {
                row.put(headers.get(column), column < values.size() ? values.get(column).trim() : "");
            }
            rows.add(row);
        }
        return rows;
    }

    private static List<DailyObservation> parseDailyCsv(String csv) {
        var lines = csv.lines().filter(line -> !line.isBlank()).iterator();
        if (!lines.hasNext()) return List.of();
        List<String> headers = splitLine(lines.next()).stream()
                .map(header -> header.replace("\uFEFF", "").trim().toLowerCase(Locale.ROOT))
                .toList();
        int dateColumn = columnIndex(headers, "reference_timestamp", "date");
        int maximumColumn = columnIndex(headers, "tre200dx");
        int minimumColumn = columnIndex(headers, "tre200dn");
        int precipitationColumn = columnIndex(headers, "rre150d0");
        List<DailyObservation> observations = new ArrayList<>();
        while (lines.hasNext()) {
            List<String> values = splitLine(lines.next());
            LocalDate date = parseDate(columnValue(values, dateColumn));
            if (date != null) {
                observations.add(new DailyObservation(
                        date,
                        parseNumber(columnValue(values, maximumColumn)),
                        parseNumber(columnValue(values, minimumColumn)),
                        parseNumber(columnValue(values, precipitationColumn))));
            }
        }
        return List.copyOf(observations);
    }

    private static int columnIndex(List<String> headers, String... names) {
        for (String name : names) {
            int index = headers.indexOf(name);
            if (index >= 0) return index;
        }
        return -1;
    }

    private static String columnValue(List<String> values, int index) {
        return index >= 0 && index < values.size() ? values.get(index).trim() : "";
    }

    private static List<String> splitLine(String line) {
        List<String> values = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean quoted = false;
        for (int index = 0; index < line.length(); index++) {
            char character = line.charAt(index);
            if (character == '"') {
                if (quoted && index + 1 < line.length() && line.charAt(index + 1) == '"') {
                    current.append('"');
                    index++;
                } else {
                    quoted = !quoted;
                }
            } else if (character == ';' && !quoted) {
                values.add(current.toString());
                current.setLength(0);
            } else {
                current.append(character);
            }
        }
        values.add(current.toString());
        return values;
    }

    private static String value(Map<String, String> row, String... names) {
        for (String name : names) {
            String value = row.get(name);
            if (value != null && !value.isBlank()) return value;
        }
        return "";
    }

    private static Integer parseYear(String value) {
        LocalDate date = parseDate(value);
        return date == null ? null : date.getYear();
    }

    private static LocalDate parseDate(String value) {
        if (value == null || value.length() < 4) return null;
        try {
            if (value.length() >= 10 && Character.isDigit(value.charAt(0)) && value.charAt(4) == '-') {
                return LocalDate.parse(value.substring(0, 10));
            }
            return LocalDateTime.parse(value, TIMESTAMP).toLocalDate();
        } catch (DateTimeParseException | NumberFormatException exception) {
            return null;
        }
    }

    private static Double parseNumber(String value) {
        if (value == null || value.isBlank() || value.equals("-") || value.equals("/")) return null;
        try {
            return Double.parseDouble(value.replace(',', '.'));
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private static int parseInteger(String value) {
        Double number = parseNumber(value);
        return number == null ? 0 : number.intValue();
    }

    private static double parseCoordinate(String value) {
        Double number = parseNumber(value);
        return number == null ? Double.NaN : number;
    }

    private record CacheEntry<T>(T value, long createdAtNanos) {
        boolean expired() {
            return System.nanoTime() - createdAtNanos > CACHE_DURATION.toNanos();
        }
    }

    private record DailyObservation(LocalDate date, Double maximum, Double minimum, Double precipitation) {}

    private static final class YearAccumulator {
        int heatDays;
        int tropicalNights;
        int frostDays;
        int iceDays;
        int summerDays;
        int veryHotDays;
        int longestHeatWaveDays;
        int currentHeatWaveDays;
        int longestFrostPeriodDays;
        int currentFrostPeriodDays;
        LocalDate previousDate;
        double maximum = -Double.MAX_VALUE;
        double lowestMaximum = Double.MAX_VALUE;
        double minimum = Double.MAX_VALUE;
        double warmestNight = -Double.MAX_VALUE;
        boolean hasMaximum;
        boolean hasMinimum;

        void add(LocalDate date, Double dailyMaximum, Double dailyMinimum) {
            if (previousDate == null || !date.equals(previousDate.plusDays(1))) {
                currentHeatWaveDays = 0;
                currentFrostPeriodDays = 0;
            }
            previousDate = date;
            if (dailyMaximum != null) {
                hasMaximum = true;
                if (dailyMaximum >= 25.0) summerDays++;
                if (dailyMaximum >= 35.0) veryHotDays++;
                if (dailyMaximum < 0.0) iceDays++;
                if (dailyMaximum >= 30.0) {
                    heatDays++;
                    currentHeatWaveDays++;
                    longestHeatWaveDays = Math.max(longestHeatWaveDays, currentHeatWaveDays);
                } else {
                    currentHeatWaveDays = 0;
                }
                maximum = Math.max(maximum, dailyMaximum);
                lowestMaximum = Math.min(lowestMaximum, dailyMaximum);
            } else {
                currentHeatWaveDays = 0;
            }
            if (dailyMinimum != null) {
                hasMinimum = true;
                if (dailyMinimum >= 20.0) tropicalNights++;
                if (dailyMinimum < 0.0) {
                    frostDays++;
                    currentFrostPeriodDays++;
                    longestFrostPeriodDays = Math.max(longestFrostPeriodDays, currentFrostPeriodDays);
                } else {
                    currentFrostPeriodDays = 0;
                }
                minimum = Math.min(minimum, dailyMinimum);
                warmestNight = Math.max(warmestNight, dailyMinimum);
            } else {
                currentFrostPeriodDays = 0;
            }
        }

        double maximumValue() { return hasMaximum ? maximum : 0.0; }
        double lowestMaximumValue() { return hasMaximum ? lowestMaximum : 0.0; }
        double minimumValue() { return hasMinimum ? minimum : 0.0; }
        double warmestNightValue() { return hasMinimum ? warmestNight : 0.0; }
    }
}
