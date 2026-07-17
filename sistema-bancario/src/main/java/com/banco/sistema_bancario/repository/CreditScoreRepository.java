package com.banco.sistema_bancario.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.banco.sistema_bancario.entity.CreditScore;
import com.banco.sistema_bancario.entity.User;

public interface CreditScoreRepository extends JpaRepository<CreditScore, Long> {
    Optional<CreditScore> findByUser(User user);
}