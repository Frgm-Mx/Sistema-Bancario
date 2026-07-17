package com.banco.sistema_bancario.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.banco.sistema_bancario.entity.LoginAttempt;

public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, Long> {

    Optional<LoginAttempt> findByEmail(String email);

    List<LoginAttempt> findAllByOrderByLastAttemptDesc();

    List<LoginAttempt> findByAttemptsGreaterThan(int attempts);
}
