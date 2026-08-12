package ch.hitzetage.station;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

public record PrecipitationSummary(
        List<AnnualTotal> annual,
        List<MonthlyTotal> monthly,
        List<DailyPrecipitation> daily,
        DailyPrecipitation strongestRainDay,
        MonthlyTotal driestMonth,
        int longestDrySpellDays) {
    public record AnnualTotal(int year, double millimetres) {}
    public record MonthlyTotal(YearMonth month, double millimetres) {}
}
