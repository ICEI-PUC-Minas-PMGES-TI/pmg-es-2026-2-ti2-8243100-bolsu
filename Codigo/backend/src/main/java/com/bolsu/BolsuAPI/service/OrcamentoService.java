package com.bolsu.BolsuAPI.service;

import com.bolsu.BolsuAPI.dto.OrcamentoDTO;
import com.bolsu.BolsuAPI.dto.ResumoOrcamentoDTO;
import com.bolsu.BolsuAPI.model.Entrada;
import com.bolsu.BolsuAPI.model.Gasto;
import com.bolsu.BolsuAPI.model.LimiteCategoria;
import com.bolsu.BolsuAPI.model.Orcamento;
import com.bolsu.BolsuAPI.repository.EntradaRepository;
import com.bolsu.BolsuAPI.repository.GastoRepository;
import com.bolsu.BolsuAPI.repository.LimiteCategoriaRepository;
import com.bolsu.BolsuAPI.repository.OrcamentoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class OrcamentoService {

    @Autowired
    private OrcamentoRepository orcamentoRepository;

    @Autowired
    private LimiteCategoriaRepository limiteRepository;

    @Autowired
    private EntradaRepository entradaRepository;

    @Autowired
    private GastoRepository gastoRepository;

    public Orcamento get(String mes, String usuarioId) {
        YearMonth ym = parseMes(mes);
        return orcamentoRepository.findByUsuarioIdAndMes(usuarioId, ym.toString())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Orcamento nao definido para este mes"));
    }

    // cria o limite mensal ou atualiza se o mes ja tiver um
    public Orcamento salvar(OrcamentoDTO dto, String usuarioId) {
        if (dto.limiteMensal() == null || !Double.isFinite(dto.limiteMensal()) || dto.limiteMensal() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe um limite mensal positivo");
        }

        YearMonth ym = parseMes(dto.mes());
        Orcamento orcamento = orcamentoRepository.findByUsuarioIdAndMes(usuarioId, ym.toString())
                .orElseGet(Orcamento::new);

        orcamento.setUsuarioId(usuarioId);
        orcamento.setMes(ym.toString());
        orcamento.setLimiteMensal(arredondar(dto.limiteMensal()));
        return orcamentoRepository.save(orcamento);
    }

    // consumo calculado na hora a partir dos gastos, nada disso e salvo no banco
    public ResumoOrcamentoDTO resumo(String mes, String usuarioId) {
        YearMonth ym = parseMes(mes);
        LocalDate inicio = ym.atDay(1);
        LocalDate fim = ym.atEndOfMonth();

        List<Gasto> gastos = gastoRepository
                .findByUsuarioIdAndDataGreaterThanEqualAndDataLessThanEqual(usuarioId, inicio, fim);
        List<Entrada> entradas = entradaRepository
                .findByUsuarioIdAndDataGreaterThanEqualAndDataLessThanEqual(usuarioId, inicio, fim);

        double totalGastos = arredondar(gastos.stream().mapToDouble(Gasto::getValor).sum());
        double totalEntradas = arredondar(entradas.stream().mapToDouble(Entrada::getValor).sum());

        Map<String, Double> gastoPorCategoria = gastos.stream()
                .collect(Collectors.groupingBy(Gasto::getCategoria, Collectors.summingDouble(Gasto::getValor)));

        // categorias com limite primeiro, depois as que tem gasto mas nao tem limite
        Map<String, Double> limites = new LinkedHashMap<>();
        for (LimiteCategoria l : limiteRepository.findByUsuarioId(usuarioId)) {
            limites.put(l.getCategoria(), l.getLimite());
        }

        List<ResumoOrcamentoDTO.ConsumoCategoria> categorias = new ArrayList<>();
        for (String categoria : limites.keySet()) {
            categorias.add(consumo(categoria, gastoPorCategoria.getOrDefault(categoria, 0.0), limites.get(categoria)));
        }
        for (Map.Entry<String, Double> e : gastoPorCategoria.entrySet()) {
            if (!limites.containsKey(e.getKey())) {
                categorias.add(consumo(e.getKey(), e.getValue(), null));
            }
        }

        Double limiteMensal = orcamentoRepository.findByUsuarioIdAndMes(usuarioId, ym.toString())
                .map(Orcamento::getLimiteMensal)
                .orElse(null);
        Double restante = limiteMensal == null ? null : arredondar(limiteMensal - totalGastos);

        return new ResumoOrcamentoDTO(
                ym.toString(), totalEntradas, totalGastos, arredondar(totalEntradas - totalGastos),
                limiteMensal, restante, categorias);
    }

    private ResumoOrcamentoDTO.ConsumoCategoria consumo(String categoria, double gasto, Double limite) {
        if (limite == null || limite <= 0) {
            return new ResumoOrcamentoDTO.ConsumoCategoria(categoria, arredondar(gasto), null, null, "SEM_LIMITE");
        }
        double percentual = arredondar(gasto / limite * 100);
        String situacao = percentual >= 100 ? "ESTOURADO" : percentual >= 90 ? "ALERTA" : "OK";
        return new ResumoOrcamentoDTO.ConsumoCategoria(categoria, arredondar(gasto), limite, percentual, situacao);
    }

    // sem mes informado, usa o mes atual
    private YearMonth parseMes(String mes) {
        if (mes == null || mes.isBlank()) {
            return YearMonth.now();
        }
        try {
            return YearMonth.parse(mes);
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mes invalido. Use o formato AAAA-MM, por exemplo 2026-10");
        }
    }

    private double arredondar(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
