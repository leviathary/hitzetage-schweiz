package ch.hitzetage.station;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.function.Predicate;

abstract class AbstractDailyStationDataSource implements StationDataSource {
    protected abstract List<Observation> observations(String stationId, LocalDate start, LocalDate end);

    @Override public List<AnnualHeatValue> findAnnualValues(String id, int from, int to) {
        Map<Integer, Accumulator> years = new TreeMap<>();
        observations(id, LocalDate.of(from, 1, 1), LocalDate.of(to, 12, 31)).forEach(row ->
                years.computeIfAbsent(row.date().getYear(), ignored -> new Accumulator()).add(row));
        return years.entrySet().stream().map(entry -> entry.getValue().value(entry.getKey())).toList();
    }

    @Override public List<DailyHeatDay> findHeatDays(String id, int year) { return days(id, year, row -> row.maximum() != null && row.maximum() >= 30); }
    @Override public List<DailyHeatDay> findTropicalNights(String id, int year) { return days(id, year, row -> row.minimum() != null && row.minimum() >= 20); }
    @Override public List<DailyHeatDay> findFrostDays(String id, int year) { return days(id, year, row -> row.minimum() != null && row.minimum() < 0); }
    @Override public List<DailyHeatDay> findIceDays(String id, int year) { return days(id, year, row -> row.maximum() != null && row.maximum() < 0); }
    @Override public List<DailyHeatDay> findSummerDays(String id, int year) { return days(id, year, row -> row.maximum() != null && row.maximum() >= 25); }
    @Override public List<DailyHeatDay> findVeryHotDays(String id, int year) { return days(id, year, row -> row.maximum() != null && row.maximum() >= 35); }

    private List<DailyHeatDay> days(String id, int year, Predicate<Observation> predicate) {
        return observations(id, LocalDate.of(year, 1, 1), LocalDate.of(year, 12, 31)).stream().filter(predicate)
                .map(row -> new DailyHeatDay(row.date(), row.maximum() == null ? row.minimum() : row.maximum(), row.minimum()))
                .sorted(Comparator.comparing(DailyHeatDay::date)).toList();
    }

    @Override public PrecipitationSummary findPrecipitation(String id, int from, int to, int detail) {
        Map<LocalDate, Double> values = new TreeMap<>();
        observations(id, LocalDate.of(from, 1, 1), LocalDate.of(to, 12, 31)).forEach(row -> { if (row.precipitation() != null) values.put(row.date(), row.precipitation()); });
        Map<Integer, Double> annual = new TreeMap<>(), toDate = new TreeMap<>(); Map<YearMonth, Double> monthly = new TreeMap<>(); LocalDate today = LocalDate.now();
        values.forEach((date, amount) -> { annual.merge(date.getYear(), amount, Double::sum); monthly.merge(YearMonth.from(date), amount, Double::sum);
            if (date.getMonthValue() < today.getMonthValue() || date.getMonthValue() == today.getMonthValue() && date.getDayOfMonth() <= today.getDayOfMonth()) toDate.merge(date.getYear(), amount, Double::sum); });
        List<DailyPrecipitation> daily = values.entrySet().stream().filter(e -> e.getKey().getYear() == detail).map(e -> new DailyPrecipitation(e.getKey(), e.getValue())).toList();
        DailyPrecipitation strongest = values.entrySet().stream().max(Map.Entry.comparingByValue()).map(e -> new DailyPrecipitation(e.getKey(), e.getValue())).orElse(null);
        var driest = monthly.entrySet().stream().min(Map.Entry.comparingByValue()).map(e -> new PrecipitationSummary.MonthlyTotal(e.getKey(), round(e.getValue()))).orElse(null);
        int longest = 0, current = 0; Integer dryYear = null; LocalDate previous = null;
        for (var e : values.entrySet()) { current = previous == null || e.getKey().equals(previous.plusDays(1)) ? (e.getValue() < 1 ? current + 1 : 0) : (e.getValue() < 1 ? 1 : 0); if (current > longest) { longest = current; dryYear = e.getKey().getYear(); } previous = e.getKey(); }
        return new PrecipitationSummary(annual.entrySet().stream().map(e -> new PrecipitationSummary.AnnualTotal(e.getKey(), round(e.getValue()))).toList(),
                toDate.entrySet().stream().map(e -> new PrecipitationSummary.AnnualTotal(e.getKey(), round(e.getValue()))).toList(),
                monthly.entrySet().stream().filter(e -> e.getKey().getYear() == detail).map(e -> new PrecipitationSummary.MonthlyTotal(e.getKey(), round(e.getValue()))).toList(), daily, strongest, driest, longest, dryYear);
    }

    protected static double round(double value) { return Math.round(value * 10) / 10.0; }
    protected record Observation(LocalDate date, Double maximum, Double minimum, Double precipitation) {}
    private static final class Accumulator {
        int heat, tropical, frost, ice, summer, hot, heatRun, maxHeatRun, frostRun, maxFrostRun; LocalDate previous;
        double maximum=-Double.MAX_VALUE, lowestMaximum=Double.MAX_VALUE, minimum=Double.MAX_VALUE, warmestNight=-Double.MAX_VALUE; boolean hasMax, hasMin;
        void add(Observation row) { if(previous==null || !row.date().equals(previous.plusDays(1))){heatRun=0;frostRun=0;} previous=row.date(); Double max=row.maximum(),min=row.minimum();
            if(max!=null){hasMax=true;if(max>=25)summer++;if(max>=35)hot++;if(max<0)ice++;if(max>=30){heat++;maxHeatRun=Math.max(maxHeatRun,++heatRun);}else heatRun=0;maximum=Math.max(maximum,max);lowestMaximum=Math.min(lowestMaximum,max);}else heatRun=0;
            if(min!=null){hasMin=true;if(min>=20)tropical++;if(min<0){frost++;maxFrostRun=Math.max(maxFrostRun,++frostRun);}else frostRun=0;minimum=Math.min(minimum,min);warmestNight=Math.max(warmestNight,min);}else frostRun=0; }
        AnnualHeatValue value(int year){return new AnnualHeatValue(year,heat,tropical,frost,ice,summer,hot,maxHeatRun,maxFrostRun,hasMax?maximum:0,hasMax?lowestMaximum:0,hasMin?minimum:0,hasMin?warmestNight:0);}
    }
}
