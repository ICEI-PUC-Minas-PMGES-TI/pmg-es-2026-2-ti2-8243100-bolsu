package com.bolsu.BolsuAPI.dto;

import java.math.BigDecimal;
import java.util.List;

public record UltimaDivisaoResponse(
        String titulo,
        BigDecimal total,
        BigDecimal valorPorPessoa,
        List<IntegranteResponse> integrantes) {
}
