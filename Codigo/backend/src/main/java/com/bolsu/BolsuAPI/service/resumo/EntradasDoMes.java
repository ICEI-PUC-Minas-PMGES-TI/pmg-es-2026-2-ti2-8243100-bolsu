package com.bolsu.BolsuAPI.service.resumo;

import java.time.YearMonth;
import java.util.Optional;

/**
 * Fonte das entradas financeiras do usuário em um mês.
 * Quando o CRUD de entradas existir, basta expor um bean que implemente esta interface
 * anotado com {@code @Primary}: ele passa a valer no lugar de {@link EntradasDeclaradas}.
 */
public interface EntradasDoMes {

    /** Total de entradas do mês, ou vazio se não houver informação. */
    Optional<Total> total(String usuarioId, YearMonth mes);

    /** @param estimado true quando o valor é uma estimativa (renda declarada), não entradas registradas */
    record Total(double valor, boolean estimado) {
    }
}
