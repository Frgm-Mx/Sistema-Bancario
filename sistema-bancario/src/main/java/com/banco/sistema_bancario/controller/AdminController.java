package com.banco.sistema_bancario.controller;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.banco.sistema_bancario.dto.AdminStatsResponse;
import com.banco.sistema_bancario.dto.AdminTransactionResponse;
import com.banco.sistema_bancario.dto.AdminUserResponse;
import com.banco.sistema_bancario.dto.SecurityLogResponse;
import com.banco.sistema_bancario.service.AdminService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserResponse>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    // ====== NUEVO: Endpoint para transacciones ======
    @GetMapping("/transactions")
    public ResponseEntity<Page<AdminTransactionResponse>> getTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        return ResponseEntity.ok(adminService.getAllTransactions(page, size));
    }

    // ====== NUEVO: Endpoint para logs de seguridad ======
    @GetMapping("/security/logs")
    public ResponseEntity<List<SecurityLogResponse>> getSecurityLogs() {
        return ResponseEntity.ok(adminService.getSecurityLogs());
    }

    // ====== NUEVO: Endpoint para datos de gráficas ======
    @GetMapping("/charts")
    public ResponseEntity<Map<String, Object>> getChartData() {
        return ResponseEntity.ok(adminService.getChartData());
    }

    @PatchMapping("/accounts/{accountNumber}/block")
    public ResponseEntity<Void> blockAccount(@PathVariable String accountNumber) {
        adminService.blockAccount(accountNumber);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/accounts/{accountNumber}/unblock")
    public ResponseEntity<Void> unblockAccount(@PathVariable String accountNumber) {
        adminService.unblockAccount(accountNumber);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/users/{userId}/credit-score")
    public ResponseEntity<Void> updateCreditScore(
            @PathVariable Long userId,
            @RequestBody Map<String, Integer> body) {
        adminService.updateCreditScore(userId, body.get("score"));
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/users/{userId}/promote")
    public ResponseEntity<Void> promoteToAdmin(@PathVariable Long userId) {
        adminService.promoteToAdmin(userId);
        return ResponseEntity.ok().build();
    }
}