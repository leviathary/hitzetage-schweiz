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

@SpringBootTest(properties = "feedback.storage.path=target/test-feedback/feedback.jsonl")
@AutoConfigureMockMvc
@ActiveProfiles("demo")
class StationControllerTest {
    @Autowired
    MockMvc mockMvc;

    @Test
    void acceptsFeedback() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/feedback")
                        .contentType("application/json")
                        .content("{\"message\":\"Eine hilfreiche Rückmeldung\",\"email\":\"person@example.ch\",\"language\":\"de\",\"website\":\"\"}"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.status").value("accepted"));
    }

    @Test
    void rejectsInvalidFeedbackEmail() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/feedback")
                        .contentType("application/json")
                        .content("{\"message\":\"Rückmeldung\",\"email\":\"keine-adresse\"}"))
                .andExpect(status().isBadRequest());
    }

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
                .andExpect(jsonPath("$.values[0].frostDays").isNumber())
                .andExpect(jsonPath("$.values[0].iceDays").isNumber())
                .andExpect(jsonPath("$.values[0].lowestMaximumTemperatureCelsius").isNumber())
                .andExpect(jsonPath("$.values[0].summerDays").isNumber())
                .andExpect(jsonPath("$.values[0].veryHotDays").isNumber())
                .andExpect(jsonPath("$.values[0].longestHeatWaveDays").isNumber())
                .andExpect(jsonPath("$.values[0].longestFrostPeriodDays").isNumber())
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
    void returnsTropicalNightsForSelectedYear() throws Exception {
        mockMvc.perform(get("/api/stations/ZRH/tropical-nights").param("year", "2024"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.heatDayThresholdCelsius").value(20.0))
                .andExpect(jsonPath("$.values", hasSize(1)))
                .andExpect(jsonPath("$.values[0].minimumTemperatureCelsius").value(20.1));
    }

    @Test
    void returnsFrostDaysForSelectedYear() throws Exception {
        mockMvc.perform(get("/api/stations/ZRH/frost-days").param("year", "2024"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.station.id").value("ZRH"))
                .andExpect(jsonPath("$.year").value(2024))
                .andExpect(jsonPath("$.heatDayThresholdCelsius").value(0.0))
                .andExpect(jsonPath("$.values", hasSize(3)))
                .andExpect(jsonPath("$.values[0].date").value("2024-01-18"))
                .andExpect(jsonPath("$.values[0].minimumTemperatureCelsius").value(-4.2));
    }

    @Test
    void returnsIceDaysForSelectedYear() throws Exception {
        mockMvc.perform(get("/api/stations/ZRH/ice-days").param("year", "2024"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.station.id").value("ZRH"))
                .andExpect(jsonPath("$.values", hasSize(2)))
                .andExpect(jsonPath("$.values[0].date").value("2024-01-19"))
                .andExpect(jsonPath("$.values[0].maximumTemperatureCelsius").value(-1.2));
    }

    @Test
    void returnsSummerDaysForSelectedYear() throws Exception {
        mockMvc.perform(get("/api/stations/ZRH/summer-days").param("year", "2024"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.heatDayThresholdCelsius").value(25.0))
                .andExpect(jsonPath("$.values", hasSize(3)));
    }

    @Test
    void returnsVeryHotDaysForSelectedYear() throws Exception {
        mockMvc.perform(get("/api/stations/ZRH/very-hot-days").param("year", "2024"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.heatDayThresholdCelsius").value(35.0))
                .andExpect(jsonPath("$.values", hasSize(0)));
    }

    @Test
    void returnsNotFoundForUnknownStation() throws Exception {
        mockMvc.perform(get("/api/stations/XXX/annual-values"))
                .andExpect(status().isNotFound());
    }
}
