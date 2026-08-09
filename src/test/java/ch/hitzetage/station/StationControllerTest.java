package ch.hitzetage.station;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.ActiveProfiles;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("demo")
class StationControllerTest {
    @Autowired
    MockMvc mockMvc;

    @Test
    void returnsMapMetadataForStations() throws Exception {
        mockMvc.perform(get("/api/stations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].elevationMetres").isNumber())
                .andExpect(jsonPath("$[0].latitude").isNumber())
                .andExpect(jsonPath("$[0].longitude").isNumber());
    }

    @Test
    void returnsAnnualValuesForKnownStation() throws Exception {
        mockMvc.perform(get("/api/stations/ZRH/annual-values").param("fromYear", "2023").param("toYear", "2024"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.station.id").value("ZRH"))
                .andExpect(jsonPath("$.dataStatus").value("meteoswiss"))
                .andExpect(jsonPath("$.values", hasSize(2)))
                .andExpect(jsonPath("$.values[0].summerDays").isNumber())
                .andExpect(jsonPath("$.values[0].veryHotDays").isNumber())
                .andExpect(jsonPath("$.values[0].longestHeatWaveDays").isNumber())
                .andExpect(jsonPath("$.values[0].warmestNightCelsius").isNumber());
    }

    @Test
    void rejectsInvalidRange() throws Exception {
        mockMvc.perform(get("/api/stations/ZRH/annual-values").param("fromYear", "2024").param("toYear", "2023"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void returnsHeatDaysForSelectedYear() throws Exception {
        mockMvc.perform(get("/api/stations/ZRH/heat-days").param("year", "2024"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.station.id").value("ZRH"))
                .andExpect(jsonPath("$.year").value(2024))
                .andExpect(jsonPath("$.heatDayThresholdCelsius").value(30.0))
                .andExpect(jsonPath("$.values", hasSize(3)))
                .andExpect(jsonPath("$.values[0].date").value("2024-06-18"))
                .andExpect(jsonPath("$.values[0].maximumTemperatureCelsius").isNumber());
    }

    @Test
    void returnsNotFoundForUnknownStation() throws Exception {
        mockMvc.perform(get("/api/stations/XXX/annual-values"))
                .andExpect(status().isNotFound());
    }
}
