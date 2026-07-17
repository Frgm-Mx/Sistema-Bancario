package com.banco.sistema_bancario.dto;

import com.banco.sistema_bancario.entity.User;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class AdminUserResponse {
    private Long id;
    private String nombre;
    private String email;
    private String role;
    private LocalDateTime createdAt;
    private int totalAccounts;
    private BigDecimal totalBalance;
    private int creditScore;
    private String creditRating;
    private List<AccountResponse> accounts;

    public static AdminUserResponse from(User user, List<AccountResponse> accounts,
            BigDecimal totalBalance, int score, String rating) {
        AdminUserResponse r = new AdminUserResponse();
        r.setId(user.getId());
        r.setNombre(user.getNombre());
        r.setEmail(user.getEmail());
        r.setRole(user.getRole().name());
        r.setCreatedAt(user.getCreateAt());
        r.setTotalAccounts(accounts.size());
        r.setTotalBalance(totalBalance);
        r.setCreditScore(score);
        r.setCreditRating(rating);
        r.setAccounts(accounts);
        return r;
    }
}