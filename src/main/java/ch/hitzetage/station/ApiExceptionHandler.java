package ch.hitzetage.station;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;

@RestControllerAdvice
class ApiExceptionHandler {
    @ExceptionHandler(MeteoSwissDataException.class)
    @ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
    Map<String, Object> unavailable(MeteoSwissDataException exception) {
        return Map.of(
                "timestamp", Instant.now().toString(),
                "status", 503,
                "message", exception.getMessage()
        );
    }

    @ExceptionHandler(DwdDataException.class)
    @ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
    Map<String, Object> dwdUnavailable(DwdDataException exception) {
        return Map.of("message", exception.getMessage(), "status", 503);
    }

    @ExceptionHandler(KnmiDataException.class)
    @ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
    Map<String, Object> knmiUnavailable(KnmiDataException exception) {
        return Map.of("message", exception.getMessage(), "status", 503);
    }
}
