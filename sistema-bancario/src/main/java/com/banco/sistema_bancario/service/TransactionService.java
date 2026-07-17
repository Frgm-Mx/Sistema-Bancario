package com.banco.sistema_bancario.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.banco.sistema_bancario.dto.DepositWithdrawRequest;
import com.banco.sistema_bancario.dto.PagedResponse;
import com.banco.sistema_bancario.dto.TransactionResponse;
import com.banco.sistema_bancario.dto.TransferRequest;
import com.banco.sistema_bancario.entity.Account;
import com.banco.sistema_bancario.entity.Notification;
import com.banco.sistema_bancario.entity.Transaction;
import com.banco.sistema_bancario.entity.User;
import com.banco.sistema_bancario.repository.AccountRepository;
import com.banco.sistema_bancario.repository.TransactionRepository;
import com.banco.sistema_bancario.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public TransactionResponse transfer(TransferRequest request) {
        // Validar request
        if (request == null) {
            throw new IllegalArgumentException("La solicitud no puede ser nula");
        }

        User user = getCurrentUser();

        Account source = accountRepository.findByAccountNumberAndDeletedFalse(request.getSourceAccountNumber())
                .orElseThrow(() -> new RuntimeException("Cuenta origen no encontrada"));

        Account target = accountRepository.findByAccountNumberAndDeletedFalse(request.getTargetAccountNumber())
                .orElseThrow(() -> new RuntimeException("Cuenta destino no encontrada"));

        if (!source.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("No tienes permiso sobre la cuenta origen");
        }

        if (source.getAccountNumber().equals(target.getAccountNumber())) {
            throw new RuntimeException("No puedes transferir a la misma cuenta");
        }

        if (source.getStatus() != Account.AccountStatus.ACTIVE) {
            throw new RuntimeException("La cuenta origen no está activa");
        }

        if (target.getStatus() != Account.AccountStatus.ACTIVE) {
            throw new RuntimeException("La cuenta destino no está activa");
        }

        // Manejo de null en balances
        if (source.getBalance() == null) {
            source.setBalance(java.math.BigDecimal.ZERO);
        }
        if (target.getBalance() == null) {
            target.setBalance(java.math.BigDecimal.ZERO);
        }

        if (source.getBalance().compareTo(request.getAmount()) < 0) {
            throw new RuntimeException("Saldo insuficiente");
        }

        // Actualizar balances
        source.setBalance(source.getBalance().subtract(request.getAmount()));
        target.setBalance(target.getBalance().add(request.getAmount()));

        accountRepository.save(source);
        accountRepository.save(target);

        // Crear transacción
        Transaction transaction = new Transaction();
        transaction.setSourceAccount(source);
        transaction.setTargetAccount(target);
        transaction.setAmount(request.getAmount());
        transaction.setType(Transaction.TransactionType.TRANSFERENCIA);
        transaction.setStatus(Transaction.TransactionStatus.COMPLETADA);
        transaction.setDescription(request.getDescription() != null ? request.getDescription() : "Transferencia");
        transactionRepository.save(transaction);

        // Notificaciones
        notificationService.send(user,
                "Transferencia realizada",
                "Transferiste $" + request.getAmount() + " a la cuenta "
                + target.getAccountNumber().substring(target.getAccountNumber().length() - 4),
                Notification.NotificationType.TRANSFERENCIA);

        if (!target.getUser().getId().equals(user.getId())) {
            notificationService.send(target.getUser(),
                    "Dinero recibido",
                    "Recibiste $" + request.getAmount() + " en tu cuenta ..."
                    + target.getAccountNumber().substring(target.getAccountNumber().length() - 4),
                    Notification.NotificationType.TRANSFERENCIA);
        }

        return TransactionResponse.from(transaction);
    }

    @Transactional
    public TransactionResponse deposit(DepositWithdrawRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("La solicitud no puede ser nula");
        }

        User user = getCurrentUser();

        Account account = accountRepository.findByAccountNumberAndDeletedFalse(request.getAccountNumber())
                .orElseThrow(() -> new RuntimeException("Cuenta no encontrada"));

        if (!account.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("No tienes permiso sobre esta cuenta");
        }

        if (account.getStatus() != Account.AccountStatus.ACTIVE) {
            throw new RuntimeException("La cuenta no está activa");
        }

        if (account.getBalance() == null) {
            account.setBalance(java.math.BigDecimal.ZERO);
        }

        account.setBalance(account.getBalance().add(request.getAmount()));
        accountRepository.save(account);

        Transaction transaction = new Transaction();
        transaction.setSourceAccount(account);
        transaction.setTargetAccount(account);
        transaction.setAmount(request.getAmount());
        transaction.setType(Transaction.TransactionType.DEPOSITO);
        transaction.setStatus(Transaction.TransactionStatus.COMPLETADA);
        transaction.setDescription(request.getDescription() != null
                ? request.getDescription() : "Depósito");
        transactionRepository.save(transaction);

        notificationService.send(user,
                "Depósito realizado",
                "Se depositaron $" + request.getAmount() + " en tu cuenta ..."
                + account.getAccountNumber().substring(account.getAccountNumber().length() - 4),
                Notification.NotificationType.DEPOSITO);

        return TransactionResponse.from(transaction);
    }

    @Transactional
    public TransactionResponse withdraw(DepositWithdrawRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("La solicitud no puede ser nula");
        }

        User user = getCurrentUser();

        Account account = accountRepository.findByAccountNumber(request.getAccountNumber())
                .orElseThrow(() -> new RuntimeException("Cuenta no encontrada"));

        if (!account.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("No tienes permiso sobre esta cuenta");
        }

        if (account.getStatus() != Account.AccountStatus.ACTIVE) {
            throw new RuntimeException("La cuenta no está activa");
        }

        if (account.getBalance() == null) {
            account.setBalance(java.math.BigDecimal.ZERO);
        }

        if (account.getBalance().compareTo(request.getAmount()) < 0) {
            throw new RuntimeException("Saldo insuficiente para el retiro");
        }

        account.setBalance(account.getBalance().subtract(request.getAmount()));
        accountRepository.save(account);

        Transaction transaction = new Transaction();
        transaction.setSourceAccount(account);
        transaction.setTargetAccount(account);
        transaction.setAmount(request.getAmount());
        transaction.setType(Transaction.TransactionType.RETIRO);
        transaction.setStatus(Transaction.TransactionStatus.COMPLETADA);
        transaction.setDescription(request.getDescription() != null
                ? request.getDescription() : "Retiro");
        transactionRepository.save(transaction);

        notificationService.send(user,
                "Retiro realizado",
                "Retiraste $" + request.getAmount() + " de tu cuenta ..."
                + account.getAccountNumber().substring(account.getAccountNumber().length() - 4),
                Notification.NotificationType.RETIRO);

        return TransactionResponse.from(transaction);
    }

    public List<TransactionResponse> getHistory(String accountNumber) {
        if (accountNumber == null || accountNumber.trim().isEmpty()) {
            throw new IllegalArgumentException("El número de cuenta no puede estar vacío");
        }

        User user = getCurrentUser();
        Account account = accountRepository.findByAccountNumberAndDeletedFalse(accountNumber)
                .orElseThrow(() -> new RuntimeException("Cuenta no encontrada"));

        if (!account.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("No tienes permiso para ver esta cuenta");
        }

        List<Transaction> transactions = transactionRepository.findByAccount(account);
        
        if (transactions == null) {
            return List.of();
        }

        return transactions.stream()
                .map(TransactionResponse::from)
                .collect(Collectors.toList());
    }

    public PagedResponse<TransactionResponse> getHistoryPaged(
            String accountNumber, int page, int size) {

        // Validar parámetros
        if (accountNumber == null || accountNumber.trim().isEmpty()) {
            throw new IllegalArgumentException("El número de cuenta no puede estar vacío");
        }
        
        int validPage = Math.max(0, page);
        int validSize = Math.max(1, Math.min(size, 50)); // Limitar a 50 registros

        User user = getCurrentUser();
        Account account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new RuntimeException("Cuenta no encontrada"));

        if (!account.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("No tienes permiso para ver esta cuenta");
        }

        Pageable pageable = PageRequest.of(
                validPage, 
                validSize, 
                Sort.by(Sort.Order.desc("createdAt"))
        );
        
        // Llamada type-safe al repositorio
        Page<Transaction> result = transactionRepository.findByAccountPaged(account, pageable);

        List<TransactionResponse> content = result.getContent()
                .stream()
                .map(TransactionResponse::from)
                .collect(Collectors.toList());

        return new PagedResponse<>(
                content,
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.isLast()
        );
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        if (email == null || email.isEmpty()) {
            throw new RuntimeException("Usuario no autenticado");
        }
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }
}