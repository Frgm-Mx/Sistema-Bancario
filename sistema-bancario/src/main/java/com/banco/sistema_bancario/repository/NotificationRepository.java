package com.banco.sistema_bancario.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.banco.sistema_bancario.entity.Notification;
import com.banco.sistema_bancario.entity.User;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserOrderByCreatedAtDesc(User user);
    List<Notification> findByUserAndReadFalseOrderByCreatedAtDesc(User user);
    long countByUserAndReadFalse(User user);
}