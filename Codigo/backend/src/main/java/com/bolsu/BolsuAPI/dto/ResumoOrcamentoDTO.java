package com.bolsu.BolsuAPI.dto;

import java.util.List;

public record ResumoOrcamentoDTO(
        String mes,
        double totalEntradas,
        double totalGastos,
        double saldo,
        Double limiteMensal,
        Double restante,
        List<ConsumoCategoria> categorias
) {
    // situacao: OK (abaixo de 90%), ALERTA (90% a 99%), ESTOURADO (100% ou mais), SEM_LIMITE
    public record ConsumoCategoria(String categoria, double gasto, Double limite, Double percentual, String situacao) {
    }
}
