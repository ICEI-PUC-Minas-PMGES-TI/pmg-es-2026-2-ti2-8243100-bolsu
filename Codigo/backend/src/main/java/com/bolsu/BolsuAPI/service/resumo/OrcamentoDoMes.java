package com.bolsu.BolsuAPI.service.resumo;

import java.time.YearMonth;
import java.util.OptionalDouble;

/**
 * Fonte do limite total de gastos do mês. A implementação atual é {@link OrcamentoPersistido}, que lê o
 * limite que o usuário salvou. Para trocar a fonte, basta expor outro bean que implemente esta interface
 * anotado com {@code @Primary}.
 */
public interface OrcamentoDoMes {

    /** Limite total do mês, ou vazio se o usuário não definiu orçamento. */
    OptionalDouble limiteTotal(String usuarioId, YearMonth mes);
}
