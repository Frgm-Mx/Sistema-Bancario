package com.banco.sistema_bancario.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Entity
@Table(name = "login_attempts")
public class LoginAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private int attempts = 0;

    @Column(name = "blocked_until")
    private LocalDateTime blockedUntil;

    @Column(name = "last_attempt")
    private LocalDateTime lastAttempt = LocalDateTime.now();

    public LoginAttempt(String email) {
        this.email = email;
    }

    public boolean isBlocked() {
        return blockedUntil != null && LocalDateTime.now().isBefore(blockedUntil);
    }

    public long minutesUntilUnblock() {
        if (blockedUntil == null) return 0;
        return java.time.Duration.between(LocalDateTime.now(), blockedUntil).toMinutes() + 1;
    }
}
