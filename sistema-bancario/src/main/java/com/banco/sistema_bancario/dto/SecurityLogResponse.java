package com.banco.sistema_bancario.dto;
import java.time.LocalDateTime;

import com.banco.sistema_bancario.entity.LoginAttempt;

import lombok.Data;

@Data
public class SecurityLogResponse {
    private Long id;
    private String email;
    private int attempts;
    private boolean blocked;
    private LocalDateTime blockedUntil;
    private LocalDateTime lastAttempt;
    private long minutesUntilUnblock;

    public static SecurityLogResponse from(LoginAttempt la) {
        SecurityLogResponse r = new SecurityLogResponse();
        r.setId(la.getId());
        r.setEmail(la.getEmail());
        r.setAttempts(la.getAttempts());
        r.setBlocked(la.isBlocked());
        r.setBlockedUntil(la.getBlockedUntil());
        r.setLastAttempt(la.getLastAttempt());
        r.setMinutesUntilUnblock(la.minutesUntilUnblock());
        return r;
    }
}