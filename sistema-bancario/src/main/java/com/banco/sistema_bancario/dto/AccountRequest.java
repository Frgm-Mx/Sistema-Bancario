package com.banco.sistema_bancario.dto;

import com.banco.sistema_bancario.entity.Account;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AccountRequest {

    @NotNull(message = "El tipo de cuenta es requerido")
    private Account.AccountType type;
}