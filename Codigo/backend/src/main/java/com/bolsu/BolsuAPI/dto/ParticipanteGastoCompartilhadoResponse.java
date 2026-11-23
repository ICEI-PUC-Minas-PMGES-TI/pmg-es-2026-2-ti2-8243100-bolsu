package com.bolsu.BolsuAPI.dto;

import com.bolsu.BolsuAPI.model.StatusParticipacaoGasto;

public record ParticipanteGastoCompartilhadoResponse(
        String id,
        String nome,
        StatusParticipacaoGasto status,
        boolean pago) {
}
