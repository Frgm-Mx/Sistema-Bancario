package com.banco.sistema_bancario.dto;

import com.banco.sistema_bancario.entity.Transaction;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class TransactionResponse {

    private Long id;
    private String sourceAccountNumber;
    private String targetAccountNumber;
    private BigDecimal amount;
    private Transaction.TransactionType type;
    private Transaction.TransactionStatus status;
    private String description;
    private LocalDateTime createdAt;

    public static TransactionResponse from(Transaction t) {
        TransactionResponse response = new TransactionResponse();
        response.setId(t.getId());
        response.setSourceAccountNumber(t.getSourceAccount().getAccountNumber());
        response.setTargetAccountNumber(t.getTargetAccount().getAccountNumber());
        response.setAmount(t.getAmount());
        response.setType(t.getType());
        response.setStatus(t.getStatus());
        response.setDescription(t.getDescription());
        response.setCreatedAt(t.getCreatedAt());
        return response;
    }
}