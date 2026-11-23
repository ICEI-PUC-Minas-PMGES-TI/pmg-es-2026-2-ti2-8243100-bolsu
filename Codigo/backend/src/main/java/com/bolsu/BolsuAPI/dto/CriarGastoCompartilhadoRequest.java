package com.bolsu.BolsuAPI.dto;

import java.math.BigDecimal;
import java.util.List;

/** participantesIds não inclui o criador: ele é incluído pelo servidor. */
public record CriarGastoCompartilhadoRequest(
        String nome,
        String descricao,
        BigDecimal valorTotal,
        List<String> participantesIds) {
}
