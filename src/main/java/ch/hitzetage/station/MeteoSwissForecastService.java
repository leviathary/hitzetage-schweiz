package ch.hitzetage.station;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Profile("!demo")
class MeteoSwissForecastService {
    private static final String COLLECTION = "https://data.geo.admin.ch/api/stac/v1/collections/ch.meteoschweiz.ogd-local-forecasting";
    private static final URI POINTS_URI = URI.create("https://data.geo.admin.ch/ch.meteoschweiz.ogd-local-forecasting/ogd-local-forecasting_meta_point.csv");
    private static final Duration CACHE_DURATION = Duration.ofMinutes(30);
    private static final DateTimeFormatter RUN_FORMAT = DateTimeFormatter.ofPattern("yyyyMMddHHmm");
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).followRedirects(HttpClient.Redirect.NORMAL).build();
    private final ObjectMapper objectMapper;
    private final Map<String, CacheEntry<String>> cache = new ConcurrentHashMap<>();

    MeteoSwissForecastService(ObjectMapper objectMapper) { this.objectMapper = objectMapper; }

    ForecastResponse forecast(Station station) {
        String pointId = pointIdsByStation().get(station.id().toUpperCase(Locale.ROOT));
        if (pointId == null) return new ForecastResponse(station, null, "meteoswiss", List.of());
        ForecastAssets assets = latestAssets();
        Map<LocalDate, Temperatures> days = new LinkedHashMap<>();
        addValues(days, download(assets.minimumUri), pointId, true);
        addValues(days, download(assets.maximumUri), pointId, false);
        List<ForecastDay> values = days.entrySet().stream()
                .filter(entry -> entry.getValue().minimum != null && entry.getValue().maximum != null)
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> new ForecastDay(entry.getKey(), entry.getValue().minimum, entry.getValue().maximum,
                        entry.getValue().maximum >= 30.0, entry.getValue().minimum >= 20.0))
                .toList();
        return new ForecastResponse(station, assets.generatedAt, "meteoswiss", values);
    }

    private Map<String, String> pointIdsByStation() {
        Map<String, String> result = new HashMap<>();
        for (Map<String, String> row : MeteoSwissStationDataSource.parseCsv(download(POINTS_URI))) {
            if ("1".equals(row.get("point_type_id")) && row.get("station_abbr") != null)
                result.put(row.get("station_abbr").toUpperCase(Locale.ROOT), row.get("point_id"));
        }
        return result;
    }

    private ForecastAssets latestAssets() {
        try {
            JsonNode features = objectMapper.readTree(download(URI.create(COLLECTION + "/items?limit=20"))).path("features");
            List<JsonNode> candidates = new ArrayList<>(); features.forEach(candidates::add);
            candidates.sort(Comparator.comparing(node -> node.path("id").asText(), Comparator.reverseOrder()));
            for (JsonNode feature : candidates) {
                List<Asset> minimums = assets(feature.path("assets"), "tre200pn.csv");
                List<Asset> maximums = assets(feature.path("assets"), "tre200px.csv");
                if (!minimums.isEmpty() && !maximums.isEmpty()) {
                    Asset minimum = minimums.getLast(); Asset maximum = maximums.getLast();
                    return new ForecastAssets(URI.create(minimum.href), URI.create(maximum.href), runTimestamp(minimum.name));
                }
            }
            throw new MeteoSwissDataException("Keine aktuelle MeteoSwiss-Prognose verfügbar");
        } catch (IOException exception) { throw new MeteoSwissDataException("MeteoSwiss-Prognose konnte nicht gelesen werden", exception); }
    }

    private List<Asset> assets(JsonNode node, String suffix) {
        List<Asset> result = new ArrayList<>();
        node.fields().forEachRemaining(entry -> { if (entry.getKey().endsWith(suffix)) result.add(new Asset(entry.getKey(), entry.getValue().path("href").asText())); });
        result.sort(Comparator.comparing(Asset::name)); return result;
    }

    private LocalDateTime runTimestamp(String assetName) {
        String[] parts = assetName.split("\\.");
        return parts.length > 2 ? LocalDateTime.parse(parts[2], RUN_FORMAT) : null;
    }

    private void addValues(Map<LocalDate, Temperatures> days, String csv, String pointId, boolean minimum) {
        for (Map<String, String> row : MeteoSwissStationDataSource.parseCsv(csv)) {
            if (!pointId.equals(row.get("point_id")) || !"1".equals(row.get("point_type_id"))) continue;
            String timestamp = row.get("date"); if (timestamp == null || timestamp.length() < 8) continue;
            String raw = row.get(minimum ? "tre200pn" : "tre200px"); if (raw == null || raw.isBlank() || raw.equals("-")) continue;
            LocalDate date = LocalDate.parse(timestamp.substring(0, 8), DateTimeFormatter.BASIC_ISO_DATE);
            Temperatures temperatures = days.computeIfAbsent(date, ignored -> new Temperatures());
            if (minimum) temperatures.minimum = Double.parseDouble(raw.replace(',', '.')); else temperatures.maximum = Double.parseDouble(raw.replace(',', '.'));
        }
    }

    private String download(URI uri) {
        CacheEntry<String> cached = cache.get(uri.toString()); if (cached != null && !cached.expired()) return cached.value;
        HttpRequest request = HttpRequest.newBuilder(uri).timeout(Duration.ofSeconds(30)).header("User-Agent", "hitzetage-schweiz/0.2").GET().build();
        try {
            HttpResponse<byte[]> response = client.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() != 200) throw new MeteoSwissDataException("MeteoSwiss-Prognose antwortete mit HTTP " + response.statusCode());
            String body = uri.getPath().endsWith(".csv") ? new String(response.body(), StandardCharsets.ISO_8859_1) : new String(response.body(), StandardCharsets.UTF_8);
            cache.put(uri.toString(), new CacheEntry<>(body, System.nanoTime())); return body;
        } catch (IOException exception) {
            if (cached != null) return cached.value;
            throw new MeteoSwissDataException("MeteoSwiss-Prognose ist momentan nicht erreichbar", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt(); throw new MeteoSwissDataException("Prognoseabruf wurde unterbrochen", exception);
        }
    }

    record ForecastResponse(Station station, LocalDateTime generatedAtUtc, String dataStatus, List<ForecastDay> values) {}
    private record ForecastAssets(URI minimumUri, URI maximumUri, LocalDateTime generatedAt) {}
    private record Asset(String name, String href) {}
    private record CacheEntry<T>(T value, long createdAtNanos) { boolean expired() { return System.nanoTime() - createdAtNanos > CACHE_DURATION.toNanos(); } }
    private static final class Temperatures { Double minimum; Double maximum; }
}
