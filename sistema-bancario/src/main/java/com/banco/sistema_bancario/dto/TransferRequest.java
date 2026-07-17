package com.banco.sistema_bancario.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class TransferRequest {

    @NotBlank(message = "La cuenta origen es requerida")
    private String sourceAccountNumber;

    @NotBlank(message = "La cuenta destino es requerida")
    private String targetAccountNumber;

    @NotNull(message = "El monto es requerido")
    @DecimalMin(value = "0.01", message = "El monto debe ser mayor a 0")
    private BigDecimal amount;

    private String description;
}