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
import java.time.LocalDateTime;
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
        String id = stationId.toLowerCase(Locale.ROOT);
        List<Map<String, String>> rows = new ArrayList<>();
        rows.addAll(parseCsv(downloadCached(URI.create(BASE_URL + "/" + id + "/ogd-smn_" + id + "_d_historical.csv"))));

        int currentYear = java.time.Year.now().getValue();
        if (toYear >= currentYear) {
            rows.addAll(parseCsv(downloadCached(URI.create(BASE_URL + "/" + id + "/ogd-smn_" + id + "_d_recent.csv"))));
        }

        Map<Integer, YearAccumulator> years = new LinkedHashMap<>();
        for (Map<String, String> row : rows) {
            Integer year = parseYear(value(row, "reference_timestamp", "date"));
            Double maximum = parseNumber(value(row, "tre200dx"));
            Double minimum = parseNumber(value(row, "tre200dn"));
            if (year == null || (maximum == null && minimum == null) || year < fromYear || year > toYear) {
                continue;
            }
            years.computeIfAbsent(year, ignored -> new YearAccumulator()).add(maximum, minimum);
        }
        return years.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> new AnnualHeatValue(
                        entry.getKey(),
                        entry.getValue().heatDays,
                        entry.getValue().tropicalNights,
                        entry.getValue().maximumValue(),
                        entry.getValue().minimumValue()))
                .toList();
    }

    private Station toStation(Map<String, String> row) {
        String id = value(row, "station_abbr", "station_id", "abbr").toUpperCase(Locale.ROOT);
        String name = value(row, "station_name", "name");
        String canton = value(row, "station_canton", "canton");
        int elevation = parseInteger(value(row, "station_height_masl", "station_height", "elevation"));
        return new Station(id, name.isBlank() ? id : name, canton, elevation);
    }

    private String downloadCached(URI uri) {
        CacheEntry<String> cached = cache.get(uri.toString());
        if (cached != null && !cached.expired()) {
            return cached.value;
        }
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
            String body = decodeCsv(response.body());
            cache.put(uri.toString(), new CacheEntry<>(body, System.nanoTime()));
            return body;
        } catch (IOException exception) {
            if (cached != null) {
                return cached.value;
            }
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
        if (value == null || value.length() < 4) return null;
        try {
            if (Character.isDigit(value.charAt(0)) && value.charAt(4) == '-') return Integer.parseInt(value.substring(0, 4));
            return LocalDateTime.parse(value, TIMESTAMP).getYear();
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

    private record CacheEntry<T>(T value, long createdAtNanos) {
        boolean expired() {
            return System.nanoTime() - createdAtNanos > CACHE_DURATION.toNanos();
        }
    }

    private static final class YearAccumulator {
        int heatDays;
        int tropicalNights;
        double maximum = -Double.MAX_VALUE;
        double minimum = Double.MAX_VALUE;
        boolean hasMaximum;
        boolean hasMinimum;

        void add(Double dailyMaximum, Double dailyMinimum) {
            if (dailyMaximum != null) {
                hasMaximum = true;
                if (dailyMaximum >= 30.0) heatDays++;
                maximum = Math.max(maximum, dailyMaximum);
            }
            if (dailyMinimum != null) {
                hasMinimum = true;
                if (dailyMinimum >= 20.0) tropicalNights++;
                minimum = Math.min(minimum, dailyMinimum);
            }
        }

        double maximumValue() { return hasMaximum ? maximum : 0.0; }
        double minimumValue() { return hasMinimum ? minimum : 0.0; }
    }
}
