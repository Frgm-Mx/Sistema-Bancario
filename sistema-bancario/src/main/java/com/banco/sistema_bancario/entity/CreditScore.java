package com.banco.sistema_bancario.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Entity
@Table(name = "credit_scores")
public class CreditScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private int score = 300;

    @Column(name = "total_transactions")
    private int totalTransactions = 0;

    @Column(name = "failed_transactions")
    private int failedTransactions = 0;

    @Column(name = "average_balance", precision = 15, scale = 2)
    private BigDecimal averageBalance = BigDecimal.ZERO;

    @Column(name = "months_active")
    private int monthsActive = 0;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public CreditScore(User user) {
        this.user = user;
    }

    // Score máx 850, mín 300
    // Rangos: 300-579 malo, 580-669 regular, 670-739 bueno, 740-850 excelente
    public String getRating() {
        if (score >= 740) return "EXCELENTE";
        if (score >= 670) return "BUENO";
        if (score >= 580) return "REGULAR";
        return "MALO";
    }

    // Límite de crédito basado en score
    public BigDecimal getCreditLimit() {
        if (score >= 740) return new BigDecimal("50000");
        if (score >= 670) return new BigDecimal("25000");
        if (score >= 580) return new BigDecimal("10000");
        return new BigDecimal("3000");
    }
}