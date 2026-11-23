package com.bolsu.BolsuAPI.dto;

import java.util.List;

public record PainelGastosCompartilhadosResponse(
        List<GastoCompartilhadoResponse> ativos,
        List<GastoCompartilhadoResponse> convitesPendentes,
        List<GastoCompartilhadoResponse> historico) {
}
