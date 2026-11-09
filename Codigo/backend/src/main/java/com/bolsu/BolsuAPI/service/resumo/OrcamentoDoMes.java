package com.bolsu.BolsuAPI.service.resumo;

import java.time.YearMonth;
import java.util.OptionalDouble;

/**
 * Fonte do limite total de gastos do mês. Quando o orçamento persistido existir,
 * basta expor um bean que implemente esta interface anotado com {@code @Primary}:
 * ele passa a valer no lugar de {@link SemOrcamento}.
 */
public interface OrcamentoDoMes {

    /** Limite total do mês, ou vazio se o usuário não definiu orçamento. */
    OptionalDouble limiteTotal(String usuarioId, YearMonth mes);
}
