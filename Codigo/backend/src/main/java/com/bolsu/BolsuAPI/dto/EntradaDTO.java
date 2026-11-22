package com.bolsu.BolsuAPI.dto;

import java.time.LocalDate;

public record EntradaDTO(String descricao, Double valor, LocalDate data) {
}
