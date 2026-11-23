package com.bolsu.BolsuAPI.dto;

import java.math.BigDecimal;
import java.util.List;

import com.bolsu.BolsuAPI.model.TipoGrupo;

/** saldo: negativo = o usuário deve | positivo = devem ao usuário. */
public record GrupoResponse(
        String id,
        String nome,
        TipoGrupo tipo,
        int quantidadeIntegrantes,
        List<IntegranteResponse> integrantes,
        BigDecimal saldo) {
}
