package com.banco.sistema_bancario.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.banco.sistema_bancario.entity.CreditScore;
import com.banco.sistema_bancario.entity.User;
import com.banco.sistema_bancario.repository.UserRepository;
import com.banco.sistema_bancario.service.CreditScoreService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/credit-score")
@RequiredArgsConstructor
public class CreditScoreController {

    private final CreditScoreService creditScoreService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<CreditScore> getMyCreditScore() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        CreditScore cs = creditScoreService.recalculate(user);
        return ResponseEntity.ok(cs);
    }
}