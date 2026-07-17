package com.banco.sistema_bancario.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.banco.sistema_bancario.entity.Account;
import com.banco.sistema_bancario.entity.Transaction;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    @Query("SELECT t FROM Transaction t WHERE t.sourceAccount = :account OR t.targetAccount = :account ORDER BY t.createdAt DESC")
    List<Transaction> findByAccount(@Param("account") Account account);

    @Query("SELECT t FROM Transaction t WHERE t.sourceAccount = :account OR t.targetAccount = :account")
    Page<Transaction> findByAccountPaged(@Param("account") Account account, Pageable pageable);

    List<Transaction> findBySourceAccountOrderByCreatedAtDesc(Account account);

    Page<Transaction> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT t FROM Transaction t WHERE t.createdAt BETWEEN :from AND :to ORDER BY t.createdAt DESC")
    List<Transaction> findByDateRange(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT t FROM Transaction t WHERE t.sourceAccount.user.id = :userId OR t.targetAccount.user.id = :userId ORDER BY t.createdAt DESC")
    List<Transaction> findByUserId(@Param("userId") Long userId);
}