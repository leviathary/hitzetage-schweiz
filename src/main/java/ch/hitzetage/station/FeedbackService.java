package ch.hitzetage.station;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
class FeedbackService {
    private static final Duration MINIMUM_INTERVAL = Duration.ofSeconds(30);

    private final ObjectMapper objectMapper;
    private final Path storagePath;
    private final Map<String, Instant> lastSubmission = new ConcurrentHashMap<>();

    FeedbackService(ObjectMapper objectMapper,
                    @Value("${feedback.storage.path:./data/feedback.jsonl}") String storagePath) {
        this.objectMapper = objectMapper;
        this.storagePath = Path.of(storagePath);
    }

    void store(FeedbackController.FeedbackRequest feedback, String clientAddress) {
        if (feedback.website() != null && !feedback.website().isBlank()) return;

        Instant now = Instant.now();
        Instant previous = lastSubmission.put(clientAddress, now);
        if (previous != null && Duration.between(previous, now).compareTo(MINIMUM_INTERVAL) < 0) {
            lastSubmission.put(clientAddress, previous);
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Please wait before sending more feedback.");
        }
        if (lastSubmission.size() > 10_000) {
            lastSubmission.entrySet().removeIf(entry -> Duration.between(entry.getValue(), now).toHours() >= 1);
        }

        Map<String, Object> entry = new LinkedHashMap<>();
        entry.put("submittedAt", now.toString());
        entry.put("language", feedback.language() == null ? "" : feedback.language().strip());
        entry.put("email", feedback.email() == null ? "" : feedback.email().strip());
        entry.put("message", feedback.message().strip());
        append(entry);
    }

    private synchronized void append(Map<String, Object> entry) {
        try {
            Path parent = storagePath.toAbsolutePath().getParent();
            if (parent != null) Files.createDirectories(parent);
            Files.writeString(storagePath, toJson(entry) + System.lineSeparator(), StandardCharsets.UTF_8,
                    StandardOpenOption.CREATE, StandardOpenOption.APPEND);
        } catch (IOException exception) {
            throw new IllegalStateException("Feedback could not be stored.", exception);
        }
    }

    private String toJson(Map<String, Object> entry) throws JsonProcessingException {
        return objectMapper.writeValueAsString(entry);
    }
}
