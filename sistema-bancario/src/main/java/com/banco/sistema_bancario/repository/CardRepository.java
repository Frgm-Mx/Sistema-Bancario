package com.banco.sistema_bancario.repository;

import com.banco.sistema_bancario.entity.Account;
import com.banco.sistema_bancario.entity.Card;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CardRepository extends JpaRepository<Card, Long> {
    List<Card> findByAccount(Account account);
    Optional<Card> findByCardNumber(String cardNumber);
    boolean existsByCardNumber(String cardNumber);
}