package ch.hitzetage;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.InputStream;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class TranslationResourcesTest {

    private static final Set<String> LANGUAGES = Set.of("de", "fr", "it", "rm", "en", "nl", "zh");
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void everyLanguageContainsExactlyTheGermanTranslationKeys() throws IOException {
        Set<String> germanKeys = readTranslations("de").keySet();

        for (String language : LANGUAGES) {
            assertEquals(germanKeys, readTranslations(language).keySet(),
                    () -> "Translation keys differ for language: " + language);
        }
    }

    private Map<String, String> readTranslations(String language) throws IOException {
        String resource = "/static/i18n/" + language + ".json";
        try (InputStream input = getClass().getResourceAsStream(resource)) {
            assertNotNull(input, "Missing translation resource: " + resource);
            return objectMapper.readValue(input, new TypeReference<>() {});
        }
    }
}
