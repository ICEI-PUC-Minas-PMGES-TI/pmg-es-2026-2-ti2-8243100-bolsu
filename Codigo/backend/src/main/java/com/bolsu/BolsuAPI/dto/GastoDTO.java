package com.bolsu.BolsuAPI.dto;

import java.time.LocalDate;

public record GastoDTO(String categoria, double valor, LocalDate data, String descricao) {
}
