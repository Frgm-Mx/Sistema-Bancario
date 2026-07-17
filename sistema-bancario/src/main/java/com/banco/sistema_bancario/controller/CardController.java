package com.banco.sistema_bancario.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.banco.sistema_bancario.dto.CardRequest;
import com.banco.sistema_bancario.dto.CardResponse;
import com.banco.sistema_bancario.service.CardService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/cards")
@RequiredArgsConstructor
public class CardController {

    private final CardService cardService;

    @PostMapping
    public ResponseEntity<CardResponse> createCard(@Valid @RequestBody CardRequest request) {
        return ResponseEntity.ok(cardService.createCard(request));
    }

    @GetMapping("/{accountNumber}")
    public ResponseEntity<List<CardResponse>> getMyCards(@PathVariable String accountNumber) {
        return ResponseEntity.ok(cardService.getMyCards(accountNumber));
    }

    @PatchMapping("/block/{cardNumber}")
    public ResponseEntity<CardResponse> blockCard(@PathVariable String cardNumber) {
        return ResponseEntity.ok(cardService.blockCard(cardNumber));
    }

    @PatchMapping("/activate/{cardNumber}")
    public ResponseEntity<CardResponse> activateCard(@PathVariable String cardNumber) {
        return ResponseEntity.ok(cardService.activateCard(cardNumber));
    }
}