package ch.hitzetage.station;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@Profile("!demo")
class KnmiStationDataSource implements StationDataSource {
    private static final URI ENDPOINT = URI.create("https://www.daggegevens.knmi.nl/klimatologie/daggegevens");
    private static final DateTimeFormatter DATE = DateTimeFormatter.BASIC_ISO_DATE;
    private static final Duration CACHE_DURATION = Duration.ofHours(6);
    private static final Pattern STATION = Pattern.compile("^#\\s+(\\d{3})\\s+(-?\\d+(?:\\.\\d+)?)\\s+(-?\\d+(?:\\.\\d+)?)\\s+(-?\\d+(?:\\.\\d+)?)\\s+(.+?)\\s*$");
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(12)).followRedirects(HttpClient.Redirect.NORMAL).build();
    private final Map<String, CacheEntry<String>> responseCache = new ConcurrentHashMap<>();

    @Override public List<Station> findStations() {
        LocalDate end = LocalDate.now();
        String response = request("ALL", end.minusDays(30), end);
        Set<String> active = new HashSet<>();
        response.lines().filter(line -> !line.startsWith("#")).forEach(line -> {
            String[] values = line.split(",", -1);
            if (values.length > 1 && values[0].trim().matches("\\d{3}")) active.add(values[0].trim());
        });
        return response.lines().map(STATION::matcher).filter(Matcher::matches).map(this::station)
                .filter(station -> active.contains(station.id().substring(3)))
                .sorted(Comparator.comparing(Station::name, String.CASE_INSENSITIVE_ORDER)).toList();
    }

    private Station station(Matcher matcher) {
        return new Station("NL:" + matcher.group(1), titleCase(matcher.group(5).trim()), "Niederlande",
                (int) Math.round(number(matcher.group(4))), number(matcher.group(3)), number(matcher.group(2)),
                "NL", "Niederlande", "KNMI");
    }

    @Override public List<AnnualHeatValue> findAnnualValues(String id, int fromYear, int toYear) {
        Map<Integer, YearAccumulator> years = new TreeMap<>();
        observations(id, LocalDate.of(fromYear, 1, 1), LocalDate.of(toYear, 12, 31)).forEach(row ->
                years.computeIfAbsent(row.date().getYear(), ignored -> new YearAccumulator()).add(row.date(), row.maximum(), row.minimum()));
        return years.entrySet().stream().map(entry -> entry.getValue().value(entry.getKey())).toList();
    }

    @Override public List<DailyHeatDay> findHeatDays(String id, int year) { return temperatureDays(id, year, row -> row.maximum() != null && row.maximum() >= 30); }
    @Override public List<DailyHeatDay> findTropicalNights(String id, int year) { return temperatureDays(id, year, row -> row.minimum() != null && row.minimum() >= 20); }
    @Override public List<DailyHeatDay> findFrostDays(String id, int year) { return temperatureDays(id, year, row -> row.minimum() != null && row.minimum() < 0); }
    @Override public List<DailyHeatDay> findIceDays(String id, int year) { return temperatureDays(id, year, row -> row.maximum() != null && row.maximum() < 0); }
    @Override public List<DailyHeatDay> findSummerDays(String id, int year) { return temperatureDays(id, year, row -> row.maximum() != null && row.maximum() >= 25); }
    @Override public List<DailyHeatDay> findVeryHotDays(String id, int year) { return temperatureDays(id, year, row -> row.maximum() != null && row.maximum() >= 35); }

    private List<DailyHeatDay> temperatureDays(String id, int year, java.util.function.Predicate<Observation> predicate) {
        return observations(id, LocalDate.of(year, 1, 1), LocalDate.of(year, 12, 31)).stream().filter(predicate)
                .map(row -> new DailyHeatDay(row.date(), row.maximum() == null ? row.minimum() : row.maximum(), row.minimum())).toList();
    }

    @Override public PrecipitationSummary findPrecipitation(String id, int fromYear, int toYear, int detailYear) {
        Map<LocalDate, Double> values = new TreeMap<>();
        observations(id, LocalDate.of(fromYear, 1, 1), LocalDate.of(toYear, 12, 31)).forEach(row -> { if (row.precipitation() != null) values.put(row.date(), row.precipitation()); });
        Map<Integer, Double> annual = new TreeMap<>(), annualToDate = new TreeMap<>();
        Map<YearMonth, Double> monthly = new TreeMap<>();
        LocalDate today = LocalDate.now();
        values.forEach((date, amount) -> {
            annual.merge(date.getYear(), amount, Double::sum);
            if (date.getMonthValue() < today.getMonthValue() || date.getMonthValue() == today.getMonthValue() && date.getDayOfMonth() <= today.getDayOfMonth()) annualToDate.merge(date.getYear(), amount, Double::sum);
            monthly.merge(YearMonth.from(date), amount, Double::sum);
        });
        List<DailyPrecipitation> daily = values.entrySet().stream().filter(e -> e.getKey().getYear() == detailYear).map(e -> new DailyPrecipitation(e.getKey(), e.getValue())).toList();
        DailyPrecipitation strongest = values.entrySet().stream().max(Map.Entry.comparingByValue()).map(e -> new DailyPrecipitation(e.getKey(), e.getValue())).orElse(null);
        var driest = monthly.entrySet().stream().min(Map.Entry.comparingByValue()).map(e -> new PrecipitationSummary.MonthlyTotal(e.getKey(), round(e.getValue()))).orElse(null);
        int longestDry = 0, currentDry = 0; Integer longestDryYear = null; LocalDate previous = null;
        for (var entry : values.entrySet()) {
            currentDry = previous == null || entry.getKey().equals(previous.plusDays(1)) ? (entry.getValue() < 1 ? currentDry + 1 : 0) : (entry.getValue() < 1 ? 1 : 0);
            if (currentDry > longestDry) { longestDry = currentDry; longestDryYear = entry.getKey().getYear(); }
            previous = entry.getKey();
        }
        return new PrecipitationSummary(
                annual.entrySet().stream().map(e -> new PrecipitationSummary.AnnualTotal(e.getKey(), round(e.getValue()))).toList(),
                annualToDate.entrySet().stream().map(e -> new PrecipitationSummary.AnnualTotal(e.getKey(), round(e.getValue()))).toList(),
                monthly.entrySet().stream().filter(e -> e.getKey().getYear() == detailYear).map(e -> new PrecipitationSummary.MonthlyTotal(e.getKey(), round(e.getValue()))).toList(),
                daily, strongest, driest, longestDry, longestDryYear);
    }

    private List<Observation> observations(String stationId, LocalDate start, LocalDate end) {
        String station = stationId.replaceFirst("(?i)^NL:", "");
        List<Observation> rows = new ArrayList<>();
        for (String line : request(station, start, end).lines().filter(value -> !value.startsWith("#")).toList()) {
            String[] values = line.split(",", -1);
            if (values.length < 5 || !values[0].trim().matches("\\d{3}")) continue;
            try { rows.add(new Observation(LocalDate.parse(values[1].trim(), DATE), tenth(values[2]), tenth(values[3]), rain(values[4]))); }
            catch (RuntimeException ignored) { }
        }
        return rows;
    }

    private String request(String stations, LocalDate start, LocalDate end) {
        String key = stations + ":" + start + ":" + end;
        CacheEntry<String> cached = responseCache.get(key);
        if (cached != null && !cached.expired()) return cached.value();
        String form = "stns=" + encode(stations) + "&vars=" + encode("TX:TN:RH") + "&start=" + DATE.format(start) + "&end=" + DATE.format(end) + "&fmt=csv";
        try {
            HttpRequest request = HttpRequest.newBuilder(ENDPOINT).timeout(Duration.ofSeconds(60)).header("Content-Type", "application/x-www-form-urlencoded").POST(HttpRequest.BodyPublishers.ofString(form)).build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() != 200) throw new KnmiDataException("KNMI antwortete mit HTTP " + response.statusCode());
            responseCache.put(key, new CacheEntry<>(response.body(), System.nanoTime())); return response.body();
        } catch (IOException exception) { if (cached != null) return cached.value(); throw new KnmiDataException("KNMI ist momentan nicht erreichbar", exception); }
        catch (InterruptedException exception) { Thread.currentThread().interrupt(); throw new KnmiDataException("KNMI-Abruf wurde unterbrochen", exception); }
    }

    private static String encode(String value) { return URLEncoder.encode(value, StandardCharsets.UTF_8); }
    private static double number(String value) { return Double.parseDouble(value.trim()); }
    private static Double tenth(String value) { return value.trim().isEmpty() ? null : number(value) / 10; }
    private static Double rain(String value) { if (value.trim().isEmpty()) return null; double amount = number(value); return amount < 0 ? 0 : amount / 10; }
    private static double round(double value) { return Math.round(value * 10) / 10.0; }
    private static String titleCase(String value) {
        if (!value.equals(value.toUpperCase(java.util.Locale.ROOT))) return value;
        StringBuilder result = new StringBuilder();
        for (String part : value.toLowerCase(java.util.Locale.ROOT).split(" ")) result.append(result.isEmpty() ? "" : " ").append(Character.toUpperCase(part.charAt(0))).append(part.substring(1));
        return result.toString();
    }

    private record Observation(LocalDate date, Double maximum, Double minimum, Double precipitation) {}
    private record CacheEntry<T>(T value, long loadedAt) { boolean expired() { return System.nanoTime() - loadedAt > CACHE_DURATION.toNanos(); } }
    private static final class YearAccumulator {
        int heat, tropical, frost, ice, summer, veryHot, longestHeat, currentHeat, longestFrost, currentFrost;
        LocalDate previous; double maximum=-Double.MAX_VALUE, lowestMaximum=Double.MAX_VALUE, minimum=Double.MAX_VALUE, warmestNight=-Double.MAX_VALUE; boolean hasMax, hasMin;
        void add(LocalDate date, Double max, Double min) {
            if (previous == null || !date.equals(previous.plusDays(1))) { currentHeat=0; currentFrost=0; } previous=date;
            if (max != null) { hasMax=true; if(max>=25)summer++; if(max>=35)veryHot++; if(max<0)ice++; if(max>=30){heat++; longestHeat=Math.max(longestHeat,++currentHeat);}else currentHeat=0; maximum=Math.max(maximum,max); lowestMaximum=Math.min(lowestMaximum,max); } else currentHeat=0;
            if (min != null) { hasMin=true; if(min>=20)tropical++; if(min<0){frost++; longestFrost=Math.max(longestFrost,++currentFrost);}else currentFrost=0; minimum=Math.min(minimum,min); warmestNight=Math.max(warmestNight,min); } else currentFrost=0;
        }
        AnnualHeatValue value(int year) { return new AnnualHeatValue(year,heat,tropical,frost,ice,summer,veryHot,longestHeat,longestFrost,hasMax?maximum:0,hasMax?lowestMaximum:0,hasMin?minimum:0,hasMin?warmestNight:0); }
    }
}
