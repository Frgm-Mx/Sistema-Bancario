package com.banco.sistema_bancario.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.banco.sistema_bancario.entity.Card;

import lombok.Data;

@Data
public class CardResponse {

    private Long id;
    private String cardNumber;
    private String cvv;
    private Card.CardType type;
    private Card.CardStatus status;
    private BigDecimal creditLimit;
    private LocalDateTime expirationDate;
    private String accountNumber;
    private LocalDateTime createdAt;

    public static CardResponse from(Card card) {
        CardResponse response = new CardResponse();
        response.setId(card.getId());
        response.setCardNumber(card.getCardNumber());
        response.setCvv(card.getCvv());
        response.setType(card.getType());
        response.setStatus(card.getStatus());
        response.setCreditLimit(card.getCreditLimit());
        response.setExpirationDate(card.getExpirationDate());
        response.setAccountNumber(card.getAccount().getAccountNumber());
        response.setCreatedAt(card.getCreatedAt());
        return response;
    }
}