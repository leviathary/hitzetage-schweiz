package ch.hitzetage.station;

class DwdDataException extends RuntimeException {
    DwdDataException(String message) { super(message); }
    DwdDataException(String message, Throwable cause) { super(message, cause); }
}
