package ch.hitzetage.station;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.validation.annotation.Validated;

import java.util.List;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/stations")
@Validated
public class StationController {
    private final StationDataSource dataSource;
    private final MeteoSwissForecastService forecastService;

    public StationController(StationDataSource dataSource, MeteoSwissForecastService forecastService) {
        this.dataSource = dataSource;
        this.forecastService = forecastService;
    }

    @GetMapping
    public List<Station> stations() {
        return dataSource.findStations();
    }

    @GetMapping("/{stationId}/forecast")
    public MeteoSwissForecastService.ForecastResponse forecast(@PathVariable String stationId) {
        Station station = findStation(stationId);
        if (!"CH".equals(station.countryCode())) {
            return new MeteoSwissForecastService.ForecastResponse(station, LocalDateTime.now(), station.dataProvider().toLowerCase(java.util.Locale.ROOT) + "-forecast-pending", List.of());
        }
        return forecastService.forecast(station);
    }

    @GetMapping("/{stationId}/annual-values")
    public AnnualValuesResponse annualValues(
            @PathVariable String stationId,
            @RequestParam(defaultValue = "2022") @Min(1864) int fromYear,
            @RequestParam(defaultValue = "2024") @Min(1864) @Max(2100) int toYear) {
        if (fromYear > toYear) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "fromYear darf nicht grösser als toYear sein");
        }
        Station station = findStation(stationId);
        return new AnnualValuesResponse(station, 30.0, dataStatus(station), dataSource.findAnnualValues(station.id(), fromYear, toYear));
    }

    @GetMapping("/{stationId}/heat-days")
    public HeatDaysResponse heatDays(
            @PathVariable String stationId,
            @RequestParam @Min(1864) @Max(2100) int year) {
        Station station = findStation(stationId);
        return new HeatDaysResponse(station, year, 30.0, dataStatus(station), dataSource.findHeatDays(station.id(), year));
    }

    @GetMapping("/{stationId}/tropical-nights")
    public HeatDaysResponse tropicalNights(
            @PathVariable String stationId,
            @RequestParam @Min(1864) @Max(2100) int year) {
        Station station = findStation(stationId);
        return new HeatDaysResponse(station, year, 20.0, dataStatus(station), dataSource.findTropicalNights(station.id(), year));
    }

    @GetMapping("/{stationId}/frost-days")
    public HeatDaysResponse frostDays(
            @PathVariable String stationId,
            @RequestParam @Min(1864) @Max(2100) int year) {
        Station station = findStation(stationId);
        return new HeatDaysResponse(station, year, 0.0, dataStatus(station), dataSource.findFrostDays(station.id(), year));
    }

    @GetMapping("/{stationId}/ice-days")
    public HeatDaysResponse iceDays(
            @PathVariable String stationId,
            @RequestParam @Min(1864) @Max(2100) int year) {
        Station station = findStation(stationId);
        return new HeatDaysResponse(station, year, 0.0, dataStatus(station), dataSource.findIceDays(station.id(), year));
    }

    @GetMapping("/{stationId}/summer-days")
    public HeatDaysResponse summerDays(@PathVariable String stationId, @RequestParam @Min(1864) @Max(2100) int year) {
        Station station = findStation(stationId);
        return new HeatDaysResponse(station, year, 25.0, dataStatus(station), dataSource.findSummerDays(station.id(), year));
    }

    @GetMapping("/{stationId}/very-hot-days")
    public HeatDaysResponse veryHotDays(@PathVariable String stationId, @RequestParam @Min(1864) @Max(2100) int year) {
        Station station = findStation(stationId);
        return new HeatDaysResponse(station, year, 35.0, dataStatus(station), dataSource.findVeryHotDays(station.id(), year));
    }

    @GetMapping("/{stationId}/daily-temperatures")
    public DailyTemperaturesResponse dailyTemperatures(
            @PathVariable String stationId,
            @RequestParam @Min(1864) @Max(2100) int year) {
        Station station = findStation(stationId);
        return new DailyTemperaturesResponse(station, year, dataStatus(station), dataSource.findDailyTemperatures(station.id(), year));
    }

    @GetMapping("/{stationId}/precipitation")
    public PrecipitationResponse precipitation(@PathVariable String stationId,
            @RequestParam @Min(1864) int fromYear,
            @RequestParam @Min(1864) @Max(2100) int toYear,
            @RequestParam @Min(1864) @Max(2100) int year) {
        if (fromYear > toYear || year < fromYear || year > toYear) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ungültiger Niederschlagszeitraum");
        }
        Station station = findStation(stationId);
        return new PrecipitationResponse(station, dataStatus(station), dataSource.findPrecipitation(station.id(), fromYear, toYear, year));
    }

    private String dataStatus(Station station) { return station.dataProvider().toLowerCase(java.util.Locale.ROOT); }

    private Station findStation(String stationId) {
        return dataSource.findStations().stream()
                .filter(item -> item.id().equalsIgnoreCase(stationId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Station nicht gefunden"));
    }

    public record AnnualValuesResponse(
            Station station,
            double heatDayThresholdCelsius,
            String dataStatus,
            List<AnnualHeatValue> values) {
    }

    public record HeatDaysResponse(
            Station station,
            int year,
            double heatDayThresholdCelsius,
            String dataStatus,
            List<DailyHeatDay> values) {
    }

    public record DailyTemperaturesResponse(
            Station station,
            int year,
            String dataStatus,
            List<DailyTemperature> values) {
    }

    public record PrecipitationResponse(Station station, String dataStatus, PrecipitationSummary precipitation) {}
}
