package com.banco.sistema_bancario.dto;

import com.banco.sistema_bancario.entity.Transaction;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class AdminTransactionResponse {
    private Long id;
    private String sourceAccountNumber;
    private String targetAccountNumber;
    private String sourceOwner;
    private String targetOwner;
    private BigDecimal amount;
    private Transaction.TransactionType type;
    private Transaction.TransactionStatus status;
    private String description;
    private LocalDateTime createdAt;

    public static AdminTransactionResponse from(Transaction t) {
        AdminTransactionResponse r = new AdminTransactionResponse();
        r.setId(t.getId());
        r.setSourceAccountNumber(t.getSourceAccount().getAccountNumber());
        r.setTargetAccountNumber(t.getTargetAccount().getAccountNumber());
        r.setSourceOwner(t.getSourceAccount().getUser().getNombre());
        r.setTargetOwner(t.getTargetAccount().getUser().getNombre());
        r.setAmount(t.getAmount());
        r.setType(t.getType());
        r.setStatus(t.getStatus());
        r.setDescription(t.getDescription());
        r.setCreatedAt(t.getCreatedAt());
        return r;
    }
}