package com.banco.sistema_bancario.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.banco.sistema_bancario.dto.CardRequest;
import com.banco.sistema_bancario.dto.CardResponse;
import com.banco.sistema_bancario.entity.Account;
import com.banco.sistema_bancario.entity.Card;
import com.banco.sistema_bancario.entity.CreditScore;
import com.banco.sistema_bancario.entity.Notification;
import com.banco.sistema_bancario.entity.User; // <-- Importación añadida
import com.banco.sistema_bancario.repository.AccountRepository;
import com.banco.sistema_bancario.repository.CardRepository;
import com.banco.sistema_bancario.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CardService {

    private final CardRepository cardRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final CreditScoreService creditScoreService;
    private final NotificationService notificationService; // <-- Inyección añadida

    public CardResponse createCard(CardRequest request) {
        User user = getCurrentUser();

        Account account = accountRepository.findByAccountNumber(request.getAccountNumber())
                .orElseThrow(() -> new RuntimeException("Cuenta no encontrada"));

        if (!account.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("No tienes permiso sobre esta cuenta");
        }

        if (account.getStatus() != Account.AccountStatus.ACTIVE) {
            throw new RuntimeException("La cuenta no está activa");
        }

        // Validar límite de crédito solo para tarjetas de crédito
        BigDecimal assignedLimit;
        if (request.getType() == Card.CardType.CREDITO) {
            CreditScore cs = creditScoreService.recalculate(user);
            assignedLimit = cs.getCreditLimit();
        } else {
            assignedLimit = BigDecimal.ZERO;
        }

        Card card = new Card();
        card.setCardNumber(generateCardNumber());
        card.setCvv(generateCvv());
        card.setType(request.getType());
        card.setCreditLimit(assignedLimit);
        card.setExpirationDate(LocalDateTime.now().plusYears(4));
        card.setAccount(account);

        cardRepository.save(card);
        return CardResponse.from(card);
    }

    public List<CardResponse> getMyCards(String accountNumber) {
        User user = getCurrentUser();

        Account account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new RuntimeException("Cuenta no encontrada"));

        if (!account.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("No tienes permiso sobre esta cuenta");
        }

        return cardRepository.findByAccount(account)
                .stream()
                .map(CardResponse::from)
                .collect(Collectors.toList());
    }

    public CardResponse blockCard(String cardNumber) {
        User user = getCurrentUser();

        Card card = cardRepository.findByCardNumber(cardNumber)
                .orElseThrow(() -> new RuntimeException("Tarjeta no encontrada"));

        if (!card.getAccount().getUser().getId().equals(user.getId())) {
            throw new RuntimeException("No tienes permiso sobre esta tarjeta");
        }

        if (card.getStatus() == Card.CardStatus.BLOCKED) {
            throw new RuntimeException("La tarjeta ya está bloqueada");
        }

        card.setStatus(Card.CardStatus.BLOCKED);
        cardRepository.save(card);
        
        // --- Notificación añadida ---
        notificationService.send(user,
            "Tarjeta bloqueada",
            "Tu tarjeta " + card.getCardNumber().substring(card.getCardNumber().length() - 4) + " fue bloqueada.",
            Notification.NotificationType.TARJETA);
        
        return CardResponse.from(card);
    }

    public CardResponse activateCard(String cardNumber) {
        User user = getCurrentUser();

        Card card = cardRepository.findByCardNumber(cardNumber)
                .orElseThrow(() -> new RuntimeException("Tarjeta no encontrada"));

        if (!card.getAccount().getUser().getId().equals(user.getId())) {
            throw new RuntimeException("No tienes permiso sobre esta tarjeta");
        }

        if (card.getStatus() == Card.CardStatus.CANCELLED
                || card.getStatus() == Card.CardStatus.EXPIRED) {
            throw new RuntimeException("Esta tarjeta no puede activarse");
        }

        card.setStatus(Card.CardStatus.ACTIVE);
        cardRepository.save(card);

        // --- Notificación añadida ---
        notificationService.send(user,
            "Tarjeta activada",
            "Tu tarjeta " + card.getCardNumber().substring(card.getCardNumber().length() - 4) + " fue activada.",
            Notification.NotificationType.TARJETA);

        return CardResponse.from(card);
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    private String generateCardNumber() {
        Random random = new Random();
        String number;
        do {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < 4; i++) {
                sb.append(String.format("%04d", random.nextInt(10000)));
                if (i < 3) {
                    sb.append("-");
                }
            }
            number = sb.toString();
        } while (cardRepository.existsByCardNumber(number));
        return number;
    }

    private String generateCvv() {
        return String.format("%03d", new Random().nextInt(1000));
    }
}