package ch.hitzetage.station;

class MeteoSwissDataException extends RuntimeException {
    MeteoSwissDataException(String message) {
        super(message);
    }

    MeteoSwissDataException(String message, Throwable cause) {
        super(message, cause);
    }
}

