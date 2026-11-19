package com.bolsu.BolsuAPI.service.resumo;

import com.bolsu.BolsuAPI.model.Entrada;
import com.bolsu.BolsuAPI.repository.EntradaRepository;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

/**
 * Entradas que o usuário registrou no mês. Quando não há nenhuma, recorre à renda informada no cadastro
 * ({@link EntradasDeclaradas}), marcada como estimativa, para a tela inicial não ficar sem saldo.
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

        if (doMes.isEmpty()) return entradasDeclaradas.total(usuarioId, mes);

        BigDecimal soma = doMes.stream()
                .map(entrada -> BigDecimal.valueOf(entrada.getValor()).setScale(2, RoundingMode.HALF_UP))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return Optional.of(new Total(soma.doubleValue(), false));
    }
}
