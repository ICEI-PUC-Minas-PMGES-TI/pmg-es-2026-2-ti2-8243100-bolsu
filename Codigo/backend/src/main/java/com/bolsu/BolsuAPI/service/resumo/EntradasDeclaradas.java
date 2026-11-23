package com.bolsu.BolsuAPI.service.resumo;

import com.bolsu.BolsuAPI.model.DadosFinanceiros;
import com.bolsu.BolsuAPI.repository.UsuarioRepository;
import org.springframework.stereotype.Component;

import java.time.YearMonth;
import java.util.Optional;

/** Fallback: usa a renda mensal informada no cadastro como entrada estimada. */
@Component
class EntradasDeclaradas implements EntradasDoMes {

    private final UsuarioRepository usuarioRepository;

    EntradasDeclaradas(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public Optional<Total> total(String usuarioId, YearMonth mes) {
        return usuarioRepository.findById(usuarioId)
                .map(usuario -> usuario.getDadosFinanceiros())
                .map(DadosFinanceiros::getFaixaRendaMensal)
                .filter(renda -> Double.isFinite(renda) && renda > 0)
                .map(renda -> new Total(renda, true));
    }
}
