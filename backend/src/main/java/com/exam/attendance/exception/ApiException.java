package com.exam.attendance.exception;

public class ApiException extends RuntimeException {
    public ApiException(String message) {
        super(message);
    }
}
