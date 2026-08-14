package ch.hitzetage.station;

class KnmiDataException extends RuntimeException {
    KnmiDataException(String message) { super(message); }
    KnmiDataException(String message, Throwable cause) { super(message, cause); }
}
