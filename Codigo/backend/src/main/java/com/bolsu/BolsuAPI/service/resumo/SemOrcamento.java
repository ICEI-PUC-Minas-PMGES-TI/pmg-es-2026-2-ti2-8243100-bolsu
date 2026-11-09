package com.bolsu.BolsuAPI.service.resumo;

import org.springframework.stereotype.Component;

import java.time.YearMonth;
import java.util.OptionalDouble;

/** Fallback até o orçamento mensal ser persistido: nenhum limite definido. */
@Component
class SemOrcamento implements OrcamentoDoMes {

    @Override
    public OptionalDouble limiteTotal(String usuarioId, YearMonth mes) {
        return OptionalDouble.empty();
    }
}
