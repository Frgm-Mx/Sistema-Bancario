package com.banco.sistema_bancario.service;

import java.time.LocalDateTime;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.banco.sistema_bancario.dto.AuthResponse;
import com.banco.sistema_bancario.dto.LoginRequest;
import com.banco.sistema_bancario.dto.RegisterRequest;
import com.banco.sistema_bancario.entity.CreditScore;
import com.banco.sistema_bancario.entity.LoginAttempt;
import com.banco.sistema_bancario.entity.User;
import com.banco.sistema_bancario.repository.CreditScoreRepository;
import com.banco.sistema_bancario.repository.LoginAttemptRepository;
import com.banco.sistema_bancario.repository.UserRepository;
import com.banco.sistema_bancario.security.JwtService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final LoginAttemptRepository loginAttemptRepository;
    private final CreditScoreRepository creditScoreRepository;

    private static final int MAX_ATTEMPTS = 5;
    private static final int BLOCK_MINUTES = 5;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("El email ya está registrado");
        }

        User user = new User();
        user.setNombre(request.getNombre());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(User.Role.USER);
        userRepository.save(user);

        // Crear score inicial
        CreditScore cs = new CreditScore(user);
        creditScoreRepository.save(cs);

        String token = jwtService.generateToken(user.getEmail());
        return new AuthResponse(token, user.getEmail(), user.getNombre(), user.getRole().name());
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail();

        // Verificar bloqueo
        LoginAttempt attempt = loginAttemptRepository.findByEmail(email)
                .orElse(new LoginAttempt(email));

        if (attempt.isBlocked()) {
            throw new RuntimeException(
                "Cuenta bloqueada. Intenta de nuevo en " + attempt.minutesUntilUnblock() + " minuto(s)."
            );
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.getPassword())
            );

            // Login exitoso — resetear intentos
            attempt.setAttempts(0);
            attempt.setBlockedUntil(null);
            attempt.setLastAttempt(LocalDateTime.now());
            loginAttemptRepository.save(attempt);

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            String token = jwtService.generateToken(user.getEmail());
            return new AuthResponse(token, user.getEmail(), user.getNombre(), user.getRole().name());

        } catch (BadCredentialsException e) {
            // Incrementar intentos fallidos
            attempt.setAttempts(attempt.getAttempts() + 1);
            attempt.setLastAttempt(LocalDateTime.now());

            int remaining = MAX_ATTEMPTS - attempt.getAttempts();

            if (attempt.getAttempts() >= MAX_ATTEMPTS) {
                attempt.setBlockedUntil(LocalDateTime.now().plusMinutes(BLOCK_MINUTES));
                loginAttemptRepository.save(attempt);
                throw new RuntimeException(
                    "Demasiados intentos fallidos. Cuenta bloqueada por " + BLOCK_MINUTES + " minutos."
                );
            }

            loginAttemptRepository.save(attempt);
            throw new RuntimeException(
                "Credenciales incorrectas. Te quedan " + remaining + " intento(s)."
            );
        }
    }
}