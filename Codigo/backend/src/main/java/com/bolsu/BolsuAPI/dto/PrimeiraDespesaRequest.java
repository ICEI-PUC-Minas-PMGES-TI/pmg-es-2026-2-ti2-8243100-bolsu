package com.bolsu.BolsuAPI.dto;

import java.math.BigDecimal;

public record PrimeiraDespesaRequest(
        String descricao,
        BigDecimal valor) {
}
