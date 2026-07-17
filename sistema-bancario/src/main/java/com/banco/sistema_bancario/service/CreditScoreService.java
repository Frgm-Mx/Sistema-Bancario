package com.banco.sistema_bancario.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.banco.sistema_bancario.entity.Account;
import com.banco.sistema_bancario.entity.CreditScore;
import com.banco.sistema_bancario.entity.Transaction;
import com.banco.sistema_bancario.entity.User;
import com.banco.sistema_bancario.repository.AccountRepository;
import com.banco.sistema_bancario.repository.CreditScoreRepository;
import com.banco.sistema_bancario.repository.TransactionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CreditScoreService {

    private final CreditScoreRepository creditScoreRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    @Transactional
    public CreditScore getOrCreate(User user) {
        return creditScoreRepository.findByUser(user)
                .orElseGet(() -> creditScoreRepository.save(new CreditScore(user)));
    }

    @Transactional
    public CreditScore recalculate(User user) {
        CreditScore cs = getOrCreate(user);
        List<Account> accounts = accountRepository.findByUser(user);

        // Meses activo desde la primera cuenta
        int monthsActive = 0;
        if (!accounts.isEmpty()) {
            LocalDateTime oldest = accounts.stream()
                    .map(account -> account.getCreatedAt() != null ? account.getCreatedAt() : LocalDateTime.now())
                    .min(LocalDateTime::compareTo)
                    .orElse(LocalDateTime.now());
            monthsActive = (int) ChronoUnit.MONTHS.between(oldest, LocalDateTime.now());
        }

        // Saldo promedio entre todas las cuentas
        BigDecimal avgBalance = accounts.stream()
                .map(account -> account.getBalance() != null ? account.getBalance() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, (a, b) -> {
                    if (a == null) a = BigDecimal.ZERO;
                    if (b == null) b = BigDecimal.ZERO;
                    return a.add(b);
                });
        
        if (!accounts.isEmpty() && accounts.size() > 0) {
            avgBalance = avgBalance.divide(
                    BigDecimal.valueOf(accounts.size()), 2, java.math.RoundingMode.HALF_UP);
        }

        // Total transacciones y fallidas
        int totalTx = 0;
        int failedTx = 0;
        for (Account acc : accounts) {
            List<Transaction> txs = transactionRepository.findBySourceAccountOrderByCreatedAtDesc(acc);
            if (txs != null) {
                totalTx += txs.size();
                failedTx += txs.stream()
                        .filter(t -> t.getStatus() == Transaction.TransactionStatus.FALLIDA)
                        .count();
            }
        }

        // Calcular score
        int score = 300;

        // Antigüedad (máx +150 puntos)
        score += Math.min(monthsActive * 5, 150);

        // Saldo promedio (máx +200 puntos)
        if (avgBalance != null) {
            if (avgBalance.compareTo(new BigDecimal("50000")) >= 0) score += 200;
            else if (avgBalance.compareTo(new BigDecimal("20000")) >= 0) score += 150;
            else if (avgBalance.compareTo(new BigDecimal("5000")) >= 0) score += 100;
            else if (avgBalance.compareTo(new BigDecimal("1000")) >= 0) score += 50;
        }

        // Transacciones exitosas (máx +200 puntos)
        int successfulTx = totalTx - failedTx;
        score += Math.min(successfulTx * 2, 200);

        // Penalización por transacciones fallidas
        score -= Math.min(failedTx * 10, 100);

        // Clamp entre 300 y 850
        score = Math.max(300, Math.min(850, score));

        cs.setScore(score);
        cs.setMonthsActive(monthsActive);
        cs.setAverageBalance(avgBalance != null ? avgBalance : BigDecimal.ZERO);
        cs.setTotalTransactions(totalTx);
        cs.setFailedTransactions(failedTx);
        cs.setUpdatedAt(LocalDateTime.now());

        return creditScoreRepository.save(cs);
    }
}