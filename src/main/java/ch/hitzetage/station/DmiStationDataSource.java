package ch.hitzetage.station;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Profile("!demo")
class DmiStationDataSource extends AbstractDailyStationDataSource {
    private static final String BASE = "https://opendataapi.dmi.dk/v2/climateData/collections/";
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(15)).build();
    private final ObjectMapper mapper;
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

    DmiStationDataSource(ObjectMapper mapper) { this.mapper = mapper; }

    @Override
    public List<Station> findStations() {
        JsonNode features = json(BASE + "station/items?limit=1000").path("features");
        Map<String, Station> stations = new HashMap<>();
        for (JsonNode feature : features) {
            JsonNode properties = feature.path("properties");
            if (!"DNK".equals(properties.path("country").asText()) || !properties.path("validTo").isNull()) continue;
            if (!contains(properties.path("parameterId"), "max_temp_w_date") || !contains(properties.path("parameterId"), "min_temp")) continue;
            String dmiId = properties.path("stationId").asText();
            JsonNode coordinates = feature.path("geometry").path("coordinates");
            stations.put(dmiId, new Station("DK:" + dmiId, properties.path("name").asText(), "Dänemark",
                    (int) Math.round(properties.path("stationHeight").asDouble()), coordinates.path(1).asDouble(), coordinates.path(0).asDouble(),
                    "DK", "Dänemark", "DMI Climate Data", LocalDate.now().getYear()));
        }
        return stations.values().stream().sorted(Comparator.comparing(Station::name, String.CASE_INSENSITIVE_ORDER)).toList();
    }

    @Override
    protected List<Observation> observations(String stationId, LocalDate start, LocalDate end) {
        String id = stationId.substring(stationId.indexOf(':') + 1);
        Map<LocalDate, Mutable> values = new HashMap<>();
        load(id, "max_temp_w_date", start, end, values, 0);
        load(id, "min_temp", start, end, values, 1);
        load(id, "acc_precip", start, end, values, 2);
        return values.entrySet().stream().sorted(Map.Entry.comparingByKey())
                .map(entry -> new Observation(entry.getKey(), entry.getValue().maximum, entry.getValue().minimum, entry.getValue().precipitation)).toList();
    }

    private void load(String stationId, String parameter, LocalDate start, LocalDate end, Map<LocalDate, Mutable> target, int field) {
        String interval = start + "T00:00:00Z/" + end + "T23:59:59Z";
        String url = BASE + "stationValue/items?stationId=" + encode(stationId) + "&parameterId=" + parameter
                + "&timeResolution=day&datetime=" + encode(interval) + "&limit=300000";
        for (JsonNode feature : json(url).path("features")) {
            JsonNode properties = feature.path("properties");
            if (!properties.path("validity").asBoolean(true)) continue;
            LocalDate date = OffsetDateTime.parse(properties.path("from").asText()).toLocalDate();
            Mutable row = target.computeIfAbsent(date, ignored -> new Mutable());
            double value = properties.path("value").asDouble();
            if (field == 0) row.maximum = value;
            else if (field == 1) row.minimum = value;
            else row.precipitation = Math.max(0, value);
        }
    }

    private JsonNode json(String url) {
        CacheEntry old = cache.get(url);
        if (old != null && !old.expired()) return old.value();
        try {
            HttpResponse<String> response = client.send(HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(90)).GET().build(), HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) throw new RuntimeException("DMI antwortete mit HTTP " + response.statusCode());
            JsonNode value = mapper.readTree(response.body());
            cache.put(url, new CacheEntry(value, System.nanoTime()));
            return value;
        } catch (Exception exception) {
            if (old != null) return old.value();
            throw new RuntimeException("DMI ist momentan nicht erreichbar", exception);
        }
    }

    private static boolean contains(JsonNode array, String value) {
        for (JsonNode node : array) if (value.equals(node.asText())) return true;
        return false;
    }

    private static String encode(String value) { return URLEncoder.encode(value, StandardCharsets.UTF_8); }
    private static final class Mutable { Double maximum, minimum, precipitation; }
    private record CacheEntry(JsonNode value, long loaded) { boolean expired() { return System.nanoTime() - loaded > Duration.ofHours(12).toNanos(); } }
}
