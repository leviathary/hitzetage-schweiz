package ch.hitzetage.station;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/feedback")
class FeedbackController {
    private final FeedbackService feedbackService;

    FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.ACCEPTED)
    Map<String, String> submit(@Valid @RequestBody FeedbackRequest feedback, HttpServletRequest request) {
        feedbackService.store(feedback, clientAddress(request));
        return Map.of("status", "accepted");
    }

    private String clientAddress(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        return forwarded == null || forwarded.isBlank()
                ? request.getRemoteAddr()
                : forwarded.split(",", 2)[0].trim();
    }

    record FeedbackRequest(
            @NotBlank @Size(max = 2000) String message,
            @Email @Size(max = 254) String email,
            @Size(max = 10) String language,
            @Size(max = 200) String website
    ) {}
}
