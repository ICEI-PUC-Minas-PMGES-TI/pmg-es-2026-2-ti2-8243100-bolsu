package com.bolsu.BolsuAPI.service.resumo;

import com.bolsu.BolsuAPI.model.Orcamento;
import com.bolsu.BolsuAPI.repository.OrcamentoRepository;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.time.YearMonth;
import java.util.OptionalDouble;

/** Limite mensal que o próprio usuário definiu na tela de orçamento. Sem limite salvo, não há orçamento. */
@Component
@Primary
class OrcamentoPersistido implements OrcamentoDoMes {

    private final OrcamentoRepository orcamentoRepository;

    OrcamentoPersistido(OrcamentoRepository orcamentoRepository) {
        this.orcamentoRepository = orcamentoRepository;
    }

    @Override
    public OptionalDouble limiteTotal(String usuarioId, YearMonth mes) {
        return orcamentoRepository.findByUsuarioIdAndMes(usuarioId, mes.toString())
                .map(Orcamento::getLimiteMensal)
                .filter(limite -> Double.isFinite(limite) && limite > 0)
                .map(OptionalDouble::of)
                .orElseGet(OptionalDouble::empty);
    }
}
