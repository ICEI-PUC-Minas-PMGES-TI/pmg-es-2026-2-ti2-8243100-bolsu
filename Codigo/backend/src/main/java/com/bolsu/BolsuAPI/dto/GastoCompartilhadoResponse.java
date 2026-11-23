package com.bolsu.BolsuAPI.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.bolsu.BolsuAPI.model.StatusGastoCompartilhado;
import com.bolsu.BolsuAPI.model.StatusParticipacaoGasto;

public record GastoCompartilhadoResponse(
        String id,
        String nome,
        String descricao,
        BigDecimal valorTotal,
        BigDecimal valorPorParticipante,
        String criadorId,
        String criadorNome,
        StatusGastoCompartilhado status,
        StatusParticipacaoGasto meuStatus,
        boolean minhaCotaPaga,
        boolean ehCriador,
        boolean podeMarcarPagamento,
        boolean podeEncerrar,
        int convitesPendentes,
        LocalDateTime criadoEm,
        LocalDateTime encerradoEm,
        List<ParticipanteGastoCompartilhadoResponse> participantes) {
}
