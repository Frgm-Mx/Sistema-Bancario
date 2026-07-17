package com.banco.sistema_bancario.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.banco.sistema_bancario.dto.AccountResponse;
import com.banco.sistema_bancario.dto.AdminStatsResponse;
import com.banco.sistema_bancario.dto.AdminTransactionResponse;
import com.banco.sistema_bancario.dto.AdminUserResponse;
import com.banco.sistema_bancario.dto.SecurityLogResponse;
import com.banco.sistema_bancario.entity.Account;
import com.banco.sistema_bancario.entity.Card;
import com.banco.sistema_bancario.entity.CreditScore;
import com.banco.sistema_bancario.entity.Notification;
import com.banco.sistema_bancario.entity.Transaction;
import com.banco.sistema_bancario.entity.User;
import com.banco.sistema_bancario.repository.AccountRepository;
import com.banco.sistema_bancario.repository.CardRepository;
import com.banco.sistema_bancario.repository.CreditScoreRepository;
import com.banco.sistema_bancario.repository.LoginAttemptRepository;
import com.banco.sistema_bancario.repository.TransactionRepository;
import com.banco.sistema_bancario.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final CardRepository cardRepository;
    private final TransactionRepository transactionRepository;
    private final CreditScoreRepository creditScoreRepository;
    private final LoginAttemptRepository loginAttemptRepository;
    private final NotificationService notificationService;

    private static final BigDecimal ZERO = BigDecimal.ZERO;

    public AdminStatsResponse getStats() {
        long totalUsers = userRepository.count();
        long totalAccounts = accountRepository.count();
        long totalTransactions = transactionRepository.count();

        List<Account> allAccounts = accountRepository.findAll();

        // CORRECCIÓN 1: Manejar null en getStatus() para cards
        long activeCards = cardRepository.findAll().stream()
                .filter(c -> c.getStatus() != null && c.getStatus() == Card.CardStatus.ACTIVE)
                .count();

        // CORRECCIÓN 2: Manejar null en getStatus() para accounts
        long blockedAccounts = allAccounts.stream()
                .filter(a -> a.getStatus() != null && a.getStatus() == Account.AccountStatus.BLOCKED)
                .count();

        // CORRECCIÓN 3: Manejar null en LoginAttempt y isBlocked() - Línea 64
        long blockedUsers = loginAttemptRepository.findAll().stream()
                .filter(la -> la != null && la.isBlocked())
                .count();

        // CORRECCIÓN 4: Manejar null en getBalance() - Línea 68
        BigDecimal totalMoney = allAccounts.stream()
                .map(account -> account.getBalance() != null ? account.getBalance() : ZERO)
                .reduce(ZERO, (a, b) -> {
                    if (a == null) a = ZERO;
                    if (b == null) b = ZERO;
                    return a.add(b);
                });

        // CORRECCIÓN 5: Manejar división por cero
        BigDecimal avgBalance = allAccounts.isEmpty() ? ZERO :
                totalMoney.divide(BigDecimal.valueOf(allAccounts.size()), 2, RoundingMode.HALF_UP);

        // CORRECCIÓN 6: Manejar null en getCreatedAt() - Línea 89
        LocalDateTime todayStart = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        long transactionsToday = transactionRepository.findAll().stream()
                .filter(t -> t.getCreatedAt() != null && 
                        t.getCreatedAt().isAfter(todayStart))
                .count();

        return new AdminStatsResponse(totalUsers, totalAccounts, totalTransactions,
                totalMoney, transactionsToday, activeCards, blockedAccounts, blockedUsers, avgBalance);
    }

    public List<AdminUserResponse> getAllUsers() {
        return userRepository.findAll().stream().map(user -> {
            List<Account> accounts = accountRepository.findByUserAndDeletedFalse(user);
            List<AccountResponse> accountResponses = accounts.stream()
                    .map(AccountResponse::from).collect(Collectors.toList());
                    
            // CORRECCIÓN 7: Manejar null en getBalance() - Línea 89
            BigDecimal totalBalance = accounts.stream()
                    .map(account -> account.getBalance() != null ? account.getBalance() : ZERO)
                    .reduce(ZERO, (a, b) -> {
                        if (a == null) a = ZERO;
                        if (b == null) b = ZERO;
                        return a.add(b);
                    });
                    
            CreditScore cs = creditScoreRepository.findByUser(user)
                    .orElse(new CreditScore(user));
            return AdminUserResponse.from(user, accountResponses, totalBalance,
                    cs.getScore(), cs.getRating());
        }).collect(Collectors.toList());
    }

    public Page<AdminTransactionResponse> getAllTransactions(int page, int size) {
        return transactionRepository
                .findAllByOrderByCreatedAtDesc(PageRequest.of(page, size))
                .map(AdminTransactionResponse::from);
    }

    public List<AdminTransactionResponse> getTransactionsByDateRange(
            LocalDateTime from, LocalDateTime to) {
        return transactionRepository.findByDateRange(from, to).stream()
                .map(AdminTransactionResponse::from)
                .collect(Collectors.toList());
    }

    public List<AdminTransactionResponse> getTransactionsByUser(Long userId) {
        return transactionRepository.findByUserId(userId).stream()
                .map(AdminTransactionResponse::from)
                .collect(Collectors.toList());
    }

    public List<SecurityLogResponse> getSecurityLogs() {
        return loginAttemptRepository.findAllByOrderByLastAttemptDesc().stream()
                .map(SecurityLogResponse::from)
                .collect(Collectors.toList());
    }

    public List<SecurityLogResponse> getBlockedUsers() {
        // CORRECCIÓN 8: Manejar null en LoginAttempt y isBlocked() - Línea 124
        return loginAttemptRepository.findByAttemptsGreaterThan(0).stream()
                .filter(la -> la != null && la.isBlocked())
                .map(SecurityLogResponse::from)
                .collect(Collectors.toList());
    }

    public Map<String, Object> getChartData() {
        List<Transaction> all = transactionRepository.findAll();

        // Transacciones por tipo
        Map<String, Long> byType = all.stream()
                .collect(Collectors.groupingBy(
                        t -> t.getType() != null ? t.getType().name() : "DESCONOCIDO", 
                        Collectors.counting()));

        // Transacciones por día últimos 7 días
        Map<String, Long> byDay = new java.util.LinkedHashMap<>();
        for (int i = 6; i >= 0; i--) {
            LocalDateTime day = LocalDateTime.now().minusDays(i)
                    .withHour(0).withMinute(0).withSecond(0);
            LocalDateTime nextDay = day.plusDays(1);
            String label = day.toLocalDate().toString();
            long count = all.stream()
                    .filter(t -> t.getCreatedAt() != null && 
                            t.getCreatedAt().isAfter(day) && 
                            t.getCreatedAt().isBefore(nextDay))
                    .count();
            byDay.put(label, count);
        }

        // Distribución de scores
        List<CreditScore> scores = creditScoreRepository.findAll();
        Map<String, Long> scoreDistribution = Map.of(
                "EXCELENTE", scores.stream().filter(s -> s.getScore() >= 740).count(),
                "BUENO", scores.stream().filter(s -> s.getScore() >= 670 && s.getScore() < 740).count(),
                "REGULAR", scores.stream().filter(s -> s.getScore() >= 580 && s.getScore() < 670).count(),
                "MALO", scores.stream().filter(s -> s.getScore() < 580).count()
        );

        // CORRECCIÓN 9: Manejar null en getBalance() y getType() - Línea 163
        Map<String, BigDecimal> balanceByType = accountRepository.findAll().stream()
                .collect(Collectors.groupingBy(
                        a -> a.getType() != null ? a.getType().name() : "DESCONOCIDO",
                        Collectors.reducing(ZERO, 
                                account -> account.getBalance() != null ? account.getBalance() : ZERO, 
                                (a, b) -> {
                                    if (a == null) a = ZERO;
                                    if (b == null) b = ZERO;
                                    return a.add(b);
                                })));

        return Map.of(
                "byType", byType,
                "byDay", byDay,
                "scoreDistribution", scoreDistribution,
                "balanceByType", balanceByType
        );
    }

    @Transactional
    public void depositToAccount(String accountNumber, BigDecimal amount, String description) {
        Account account = accountRepository.findByAccountNumberAndDeletedFalse(accountNumber)
                .orElseThrow(() -> new RuntimeException("Cuenta no encontrada"));
        
        if (account.getBalance() == null) {
            account.setBalance(ZERO);
        }
        
        account.setBalance(account.getBalance().add(amount));
        accountRepository.save(account);

        Transaction tx = new Transaction();
        tx.setSourceAccount(account);
        tx.setTargetAccount(account);
        tx.setAmount(amount);
        tx.setType(Transaction.TransactionType.DEPOSITO);
        tx.setStatus(Transaction.TransactionStatus.COMPLETADA);
        tx.setDescription(description != null ? description : "Depósito ejecutivo");
        transactionRepository.save(tx);

        notificationService.send(account.getUser(),
                "Depósito acreditado",
                "Un ejecutivo acreditó " + amount + " a tu cuenta ···" +
                        accountNumber.substring(accountNumber.length() - 4),
                Notification.NotificationType.DEPOSITO);
    }

    @Transactional
    public void blockAccount(String accountNumber) {
        Account account = accountRepository.findByAccountNumberAndDeletedFalse(accountNumber)
                .orElseThrow(() -> new RuntimeException("Cuenta no encontrada"));
        account.setStatus(Account.AccountStatus.BLOCKED);
        accountRepository.save(account);
        notificationService.send(account.getUser(),
                "Cuenta bloqueada",
                "Tu cuenta ···" + accountNumber.substring(accountNumber.length() - 4) +
                        " fue bloqueada por un ejecutivo.",
                Notification.NotificationType.SEGURIDAD);
    }

    @Transactional
    public void unblockAccount(String accountNumber) {
        Account account = accountRepository.findByAccountNumberAndDeletedFalse(accountNumber)
                .orElseThrow(() -> new RuntimeException("Cuenta no encontrada"));
        account.setStatus(Account.AccountStatus.ACTIVE);
        accountRepository.save(account);
        notificationService.send(account.getUser(),
                "Cuenta desbloqueada",
                "Tu cuenta ···" + accountNumber.substring(accountNumber.length() - 4) +
                        " fue desbloqueada.",
                Notification.NotificationType.SEGURIDAD);
    }

    @Transactional
    public void unblockLoginAttempt(String email) {
        loginAttemptRepository.findByEmail(email).ifPresent(la -> {
            la.setAttempts(0);
            la.setBlockedUntil(null);
            loginAttemptRepository.save(la);
        });
    }

    @Transactional
    public void updateCreditScore(Long userId, int score) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        CreditScore cs = creditScoreRepository.findByUser(user)
                .orElse(new CreditScore(user));
        cs.setScore(Math.max(300, Math.min(850, score)));
        cs.setUpdatedAt(LocalDateTime.now());
        creditScoreRepository.save(cs);
        notificationService.send(user,
                "Score actualizado",
                "Tu score crediticio fue actualizado a " + score + " puntos.",
                Notification.NotificationType.SISTEMA);
    }

    @Transactional
    public void promoteToAdmin(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        user.setRole(User.Role.ADMIN);
        userRepository.save(user);
    }
}