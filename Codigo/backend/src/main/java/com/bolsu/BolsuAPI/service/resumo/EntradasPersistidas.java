package com.bolsu.BolsuAPI.service.resumo;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import com.bolsu.BolsuAPI.model.Entrada;
import com.bolsu.BolsuAPI.repository.EntradaRepository;

/**
 * Entradas do mês = renda informada no cadastro da conta ({@link EntradasDeclaradas}, quando existe)
 * + as entradas extras que o usuário registrou no mês (freela, mesada, etc.).
 *
 * <p>A flag {@code estimado} continua indicando que o total inclui a renda do cadastro, que é uma estimativa.
 * Sem renda no cadastro, o total vem só das entradas registradas e não é estimado.
 */
@Component
@Primary
class EntradasPersistidas implements EntradasDoMes {

    private final EntradaRepository entradaRepository;
    private final EntradasDeclaradas entradasDeclaradas;

    EntradasPersistidas(EntradaRepository entradaRepository, EntradasDeclaradas entradasDeclaradas) {
        this.entradaRepository = entradaRepository;
        this.entradasDeclaradas = entradasDeclaradas;
    }

    @Override
    public Optional<Total> total(String usuarioId, YearMonth mes) {
        // Filtra o mês em Java: o volume de entradas por usuário é pequeno e isso evita depender de uma
        // consulta derivada com dois filtros no mesmo campo, que o Spring Data MongoDB não aceita.
        List<Entrada> doMes = entradaRepository.findByUsuarioId(usuarioId).stream()
                .filter(entrada -> entrada.getData() != null && YearMonth.from(entrada.getData()).equals(mes))
                .toList();

        Optional<Total> base = entradasDeclaradas.total(usuarioId, mes);
        if (doMes.isEmpty()) return base;

        BigDecimal extras = doMes.stream()
                .map(entrada -> BigDecimal.valueOf(entrada.getValor()).setScale(2, RoundingMode.HALF_UP))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal renda = base
                .map(total -> BigDecimal.valueOf(total.valor()).setScale(2, RoundingMode.HALF_UP))
                .orElse(BigDecimal.ZERO);

        return Optional.of(new Total(renda.add(extras).doubleValue(), base.isPresent()));
    }
}