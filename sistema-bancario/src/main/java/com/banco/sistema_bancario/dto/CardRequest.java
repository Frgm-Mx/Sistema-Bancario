package com.banco.sistema_bancario.dto;

import java.math.BigDecimal;

import com.banco.sistema_bancario.entity.Card;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CardRequest {

    @NotBlank(message = "El número de cuenta es requerido")
    private String accountNumber;

    @NotNull(message = "El tipo de tarjeta es requerido")
    private Card.CardType type;

    private BigDecimal creditLimit = BigDecimal.ZERO;
}