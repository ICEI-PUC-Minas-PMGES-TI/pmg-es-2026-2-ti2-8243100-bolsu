package com.bolsu.BolsuAPI.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Dados para registrar um gasto. {@code data} é opcional (padrão: hoje) e {@code descricao} também.
 */
public record GastoDTO(
        @NotBlank(message = "Informe a categoria do gasto")
        @Size(max = 50, message = "A categoria deve ter no máximo 50 caracteres")
        String categoria,

        @Positive(message = "O valor do gasto deve ser maior que zero")
        @DecimalMax(value = "999999999.99", message = "O valor do gasto é alto demais")
        double valor,

        @PastOrPresent(message = "A data do gasto não pode estar no futuro")
        LocalDate data,

        @Size(max = 200, message = "A observação deve ter no máximo 200 caracteres")
        String descricao) {
}
