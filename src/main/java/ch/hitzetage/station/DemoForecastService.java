package ch.hitzetage.station;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Profile("demo")
class DemoForecastService extends MeteoSwissForecastService {
    DemoForecastService(ObjectMapper objectMapper) { super(objectMapper); }
    @Override ForecastResponse forecast(Station station) { return new ForecastResponse(station, LocalDateTime.now(), "demo", List.of()); }
}
