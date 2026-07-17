package com.banco.sistema_bancario.dto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AdminStatsResponse {
    private long totalUsers;
    private long totalAccounts;
    private long totalTransactions;
    private BigDecimal totalMoneyInSystem;
    private long transactionsToday;
    private long activeCards;
    private long blockedAccounts;
    private long blockedUsers;
    private BigDecimal averageBalance;
}