package com.banco.sistema_bancario.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.banco.sistema_bancario.entity.Account;

import lombok.Data;

@Data
public class AccountResponse {

    private Long id;
    private String accountNumber;
    private Account.AccountType type;
    private BigDecimal balance;
    private Account.AccountStatus status;
    private String ownerName;
    private LocalDateTime createdAt;

    public static AccountResponse from(Account account) {
        AccountResponse response = new AccountResponse();
        response.setId(account.getId());
        response.setAccountNumber(account.getAccountNumber());
        response.setType(account.getType());
        response.setBalance(account.getBalance());
        response.setStatus(account.getStatus());
        response.setOwnerName(account.getUser().getNombre());
        response.setCreatedAt(account.getCreatedAt());
        return response;
    }
}