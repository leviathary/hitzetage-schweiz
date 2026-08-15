package ch.hitzetage.station;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Component
@Profile("!demo")
class DwdStationDataSource implements StationDataSource {
    private static final String BASE = "https://opendata.dwd.de/climate_environment/CDC/observations_germany/climate/daily/kl";
    private static final URI STATIONS = URI.create(BASE + "/recent/KL_Tageswerte_Beschreibung_Stationen.txt");
    private static final URI HISTORICAL_INDEX = URI.create(BASE + "/historical/");
    private static final Duration CACHE_DURATION = Duration.ofHours(6);
    private static final DateTimeFormatter DWD_DATE = DateTimeFormatter.BASIC_ISO_DATE;
    private static final List<String> STATES = List.of("Baden-Württemberg", "Bayern", "Berlin", "Brandenburg", "Bremen", "Hamburg", "Hessen", "Mecklenburg-Vorpommern", "Niedersachsen", "Nordrhein-Westfalen", "Rheinland-Pfalz", "Saarland", "Sachsen-Anhalt", "Sachsen", "Schleswig-Holstein", "Thüringen");
    private static final Pattern STATION_ROW = Pattern.compile("^(\\d{5})\\s+(\\d{8})\\s+(\\d{8})\\s+(-?\\d+)\\s+(-?\\d+[.,]\\d+)\\s+(-?\\d+[.,]\\d+)\\s+(.+)$");

    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(12)).followRedirects(HttpClient.Redirect.NORMAL).build();
    private final Map<String, CacheEntry<byte[]>> byteCache = new ConcurrentHashMap<>();
    private final Map<String, CacheEntry<List<Observation>>> observationCache = new ConcurrentHashMap<>();

    @Override
    public List<Station> findStations() {
        String text = new String(downloadCached(STATIONS), java.nio.charset.StandardCharsets.ISO_8859_1);
        LocalDate activeCutoff = LocalDate.now().minusDays(14);
        return text.lines().skip(2).map(String::stripTrailing).filter(line -> !line.isBlank()).map(line -> parseStation(line, activeCutoff))
                .filter(java.util.Objects::nonNull).sorted(Comparator.comparing(Station::name, String.CASE_INSENSITIVE_ORDER)).toList();
    }

    private Station parseStation(String line, LocalDate activeCutoff) {
        Matcher matcher = STATION_ROW.matcher(line);
        if (!matcher.matches()) return null;
        LocalDate end = LocalDate.parse(matcher.group(3), DWD_DATE);
        if (end.isBefore(activeCutoff)) return null;
        String rest = matcher.group(7).trim();
        String state = STATES.stream().filter(value -> rest.contains(value)).findFirst().orElse("Deutschland");
        int stateAt = rest.lastIndexOf(state);
        String name = (stateAt > 0 ? rest.substring(0, stateAt) : rest).trim();
        return new Station("DE:" + matcher.group(1), name, state, Integer.parseInt(matcher.group(4)), number(matcher.group(5)), number(matcher.group(6)), "DE", "Deutschland", "DWD");
    }

    @Override
    public List<AnnualHeatValue> findAnnualValues(String stationId, int fromYear, int toYear) {
        Map<Integer, YearAccumulator> years = new TreeMap<>();
        dailyRows(stationId).values().forEach(row -> {
            int year = row.date().getYear();
            if (year >= fromYear && year <= toYear && (row.maximum() != null || row.minimum() != null))
                years.computeIfAbsent(year, ignored -> new YearAccumulator()).add(row.date(), row.maximum(), row.minimum());
        });
        return years.entrySet().stream().map(entry -> entry.getValue().value(entry.getKey())).toList();
    }

    @Override public List<DailyHeatDay> findHeatDays(String id, int year) { return temperatureDays(id, year, row -> row.maximum() != null && row.maximum() >= 30); }
    @Override public List<DailyHeatDay> findTropicalNights(String id, int year) { return temperatureDays(id, year, row -> row.minimum() != null && row.minimum() >= 20); }
    @Override public List<DailyHeatDay> findFrostDays(String id, int year) { return temperatureDays(id, year, row -> row.minimum() != null && row.minimum() < 0); }
    @Override public List<DailyHeatDay> findIceDays(String id, int year) { return temperatureDays(id, year, row -> row.maximum() != null && row.maximum() < 0); }
    @Override public List<DailyHeatDay> findSummerDays(String id, int year) { return temperatureDays(id, year, row -> row.maximum() != null && row.maximum() >= 25); }
    @Override public List<DailyHeatDay> findVeryHotDays(String id, int year) { return temperatureDays(id, year, row -> row.maximum() != null && row.maximum() >= 35); }
    @Override public List<DailyTemperature> findDailyTemperatures(String id, int year) {
        return dailyRows(id).values().stream().filter(row -> row.date().getYear() == year)
                .filter(row -> row.maximum() != null || row.minimum() != null)
                .map(row -> new DailyTemperature(row.date(), row.maximum(), row.minimum()))
                .sorted(java.util.Comparator.comparing(DailyTemperature::date)).toList();
    }

    private List<DailyHeatDay> temperatureDays(String id, int year, java.util.function.Predicate<Observation> predicate) {
        return dailyRows(id).values().stream().filter(row -> row.date().getYear() == year && predicate.test(row))
                .map(row -> new DailyHeatDay(row.date(), row.maximum() == null ? row.minimum() : row.maximum(), row.minimum()))
                .sorted(Comparator.comparing(DailyHeatDay::date)).toList();
    }

    @Override
    public PrecipitationSummary findPrecipitation(String id, int fromYear, int toYear, int detailYear) {
        Map<LocalDate, Double> values = new TreeMap<>();
        dailyRows(id).values().forEach(row -> { if (row.precipitation() != null && row.date().getYear() >= fromYear && row.date().getYear() <= toYear) values.put(row.date(), row.precipitation()); });
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

    private Map<LocalDate, Observation> dailyRows(String stationId) {
        String station = stationId.replaceFirst("(?i)^DE:", "");
        CacheEntry<List<Observation>> cached = observationCache.get(station);
        if (cached != null && !cached.expired()) return unique(cached.value());
        List<Observation> rows = new ArrayList<>();
        String historicalFile = historicalFilename(station);
        if (historicalFile != null) rows.addAll(unzipObservations(downloadCached(URI.create(BASE + "/historical/" + historicalFile))));
        rows.addAll(unzipObservations(downloadCached(URI.create(BASE + "/recent/tageswerte_KL_" + station + "_akt.zip"))));
        observationCache.put(station, new CacheEntry<>(List.copyOf(rows), System.nanoTime()));
        return unique(rows);
    }

    private Map<LocalDate, Observation> unique(List<Observation> rows) { Map<LocalDate, Observation> result = new TreeMap<>(); rows.forEach(row -> result.put(row.date(), row)); return result; }

    private String historicalFilename(String station) {
        String html = new String(downloadCached(HISTORICAL_INDEX), StandardCharsets.UTF_8);
        Matcher matcher = Pattern.compile("tageswerte_KL_" + Pattern.quote(station) + "_\\d{8}_\\d{8}_hist\\.zip").matcher(html);
        return matcher.find() ? matcher.group() : null;
    }

    private List<Observation> unzipObservations(byte[] zipBytes) {
        try (ZipInputStream zip = new ZipInputStream(new ByteArrayInputStream(zipBytes), StandardCharsets.UTF_8)) {
            ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                if (!entry.isDirectory() && entry.getName().startsWith("produkt_klima_tag_") && entry.getName().endsWith(".txt")) {
                    ByteArrayOutputStream content = new ByteArrayOutputStream(); zip.transferTo(content);
                    return parseObservations(content.toString(StandardCharsets.UTF_8));
                }
            }
            throw new DwdDataException("DWD-Tageswerte fehlen im Stationsarchiv");
        } catch (IOException exception) { throw new DwdDataException("DWD-Stationsarchiv konnte nicht gelesen werden", exception); }
    }

    private List<Observation> parseObservations(String text) {
        List<String> lines = text.lines().toList();
        if (lines.isEmpty()) return List.of();
        String[] headers = lines.getFirst().split(";");
        int date = column(headers, "MESS_DATUM"), max = column(headers, "TXK"), min = column(headers, "TNK"), rain = column(headers, "RSK");
        List<Observation> result = new ArrayList<>();
        for (int i = 1; i < lines.size(); i++) {
            String[] values = lines.get(i).split(";", -1);
            if (values.length <= date) continue;
            try { result.add(new Observation(LocalDate.parse(values[date].trim(), DWD_DATE), optional(values, max), optional(values, min), optional(values, rain))); }
            catch (RuntimeException ignored) { }
        }
        return result;
    }

    private int column(String[] headers, String name) { for (int i=0;i<headers.length;i++) if (headers[i].trim().equalsIgnoreCase(name)) return i; return -1; }
    private Double optional(String[] values, int index) { if (index < 0 || index >= values.length || values[index].isBlank()) return null; double value = number(values[index]); return value <= -999 ? null : value; }
    private static double number(String value) { return Double.parseDouble(value.trim().replace(',', '.')); }
    private static double round(double value) { return Math.round(value * 10) / 10.0; }

    private byte[] downloadCached(URI uri) {
        CacheEntry<byte[]> cached = byteCache.get(uri.toString());
        if (cached != null && !cached.expired()) return cached.value();
        try {
            HttpResponse<byte[]> response = client.send(HttpRequest.newBuilder(uri).timeout(Duration.ofSeconds(45)).GET().build(), HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() != 200) throw new DwdDataException("DWD antwortete mit HTTP " + response.statusCode());
            byteCache.put(uri.toString(), new CacheEntry<>(response.body(), System.nanoTime())); return response.body();
        } catch (IOException exception) { if (cached != null) return cached.value(); throw new DwdDataException("DWD ist momentan nicht erreichbar", exception); }
        catch (InterruptedException exception) { Thread.currentThread().interrupt(); throw new DwdDataException("DWD-Abruf wurde unterbrochen", exception); }
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
