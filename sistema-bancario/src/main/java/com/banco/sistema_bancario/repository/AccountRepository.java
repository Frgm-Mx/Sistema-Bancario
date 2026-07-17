package com.banco.sistema_bancario.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.banco.sistema_bancario.entity.Account;
import com.banco.sistema_bancario.entity.User;

public interface AccountRepository extends JpaRepository<Account, Long> {
    List<Account> findByUser(User user);
    Optional<Account> findByAccountNumber(String accountNumber);
    boolean existsByAccountNumber(String accountNumber);
    List<Account> findByUserAndDeletedFalse(User user);
    Optional<Account> findByAccountNumberAndDeletedFalse(String accountNumber);
}