package com.bolsu.BolsuAPI.service.resumo;

import java.time.YearMonth;
import java.util.Optional;

/**
 * Fonte das entradas financeiras do usuário em um mês.
 * A implementação atual é {@link EntradasPersistidas}, que soma as entradas registradas no mês e, na falta
 * delas, recorre a {@link EntradasDeclaradas} (renda informada no cadastro). Para trocar a fonte, basta
 * expor outro bean que implemente esta interface anotado com {@code @Primary}.
 */
public interface EntradasDoMes {

    /** Total de entradas do mês, ou vazio se não houver informação. */
    Optional<Total> total(String usuarioId, YearMonth mes);

    /** @param estimado true quando o valor é uma estimativa (renda declarada), não entradas registradas */
    record Total(double valor, boolean estimado) {
    }
}
