package com.banco.sistema_bancario.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.banco.sistema_bancario.dto.AccountRequest;
import com.banco.sistema_bancario.dto.AccountResponse;
import com.banco.sistema_bancario.entity.Account;
import com.banco.sistema_bancario.entity.Notification;
import com.banco.sistema_bancario.entity.User;
import com.banco.sistema_bancario.repository.AccountRepository;
import com.banco.sistema_bancario.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public AccountResponse createAccount(AccountRequest request) {
        User user = getCurrentUser();

        Account account = new Account();
        account.setAccountNumber(generateAccountNumber());
        account.setType(request.getType());
        account.setUser(user);

        accountRepository.save(account);

        notificationService.send(user,
                "Cuenta creada",
                "Tu cuenta " + request.getType() + " fue creada exitosamente.",
                Notification.NotificationType.SISTEMA);

        return AccountResponse.from(account);
    }

    public List<AccountResponse> getMyAccounts() {
        User user = getCurrentUser();
        return accountRepository.findByUserAndDeletedFalse(user)
                .stream()
                .map(AccountResponse::from)
                .collect(Collectors.toList());
    }

    public AccountResponse getAccountById(Long id) {
        User user = getCurrentUser();
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cuenta no encontrada"));

        if (!account.getUser().getId().equals(user.getId()))
            throw new RuntimeException("No tienes permiso para ver esta cuenta");

        if (account.isDeleted())
            throw new RuntimeException("Esta cuenta ha sido cerrada");

        return AccountResponse.from(account);
    }

    @Transactional
    public void closeAccount(String accountNumber) {
        User user = getCurrentUser();
        Account account = accountRepository.findByAccountNumberAndDeletedFalse(accountNumber)
                .orElseThrow(() -> new RuntimeException("Cuenta no encontrada"));

        if (!account.getUser().getId().equals(user.getId()))
            throw new RuntimeException("No tienes permiso sobre esta cuenta");

        if (account.getBalance().compareTo(java.math.BigDecimal.ZERO) > 0)
            throw new RuntimeException("No puedes cerrar una cuenta con saldo. Retira el saldo primero.");

        account.setDeleted(true);
        account.setDeletedAt(LocalDateTime.now());
        account.setStatus(Account.AccountStatus.INACTIVE);
        accountRepository.save(account);

        notificationService.send(user,
                "Cuenta cerrada",
                "Tu cuenta " + accountNumber.substring(accountNumber.length() - 4) + " fue cerrada.",
                Notification.NotificationType.SISTEMA);
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    private String generateAccountNumber() {
        Random random = new Random();
        String number;
        do {
            number = String.format("%018d",
                    Math.abs(random.nextLong() % 1_000_000_000_000_000_000L));
        } while (accountRepository.existsByAccountNumber(number));
        return number;
    }
}