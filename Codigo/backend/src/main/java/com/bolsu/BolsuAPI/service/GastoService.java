package com.bolsu.BolsuAPI.service;

import com.bolsu.BolsuAPI.dto.ResumoGastosDTO;
import com.bolsu.BolsuAPI.model.Gasto;
import com.bolsu.BolsuAPI.repository.GastoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class GastoService {

    @Autowired
    private GastoRepository gastoRepository;

    public List<Gasto> getAll(String usuarioId) {
        return gastoRepository.findByUsuarioId(usuarioId);
    }

    public Gasto add(Gasto gasto, String usuarioId) {
        if (gasto.getCategoria() == null || gasto.getCategoria().isBlank() || !Double.isFinite(gasto.getValor()) || gasto.getValor() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe categoria e valor positivo");
        }
        gasto.setUsuarioId(usuarioId);
        return gastoRepository.save(gasto);
    }

    public void delete(String id, String usuarioId) {
        if (gastoRepository.deleteByIdAndUsuarioId(id, usuarioId) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Gasto nao encontrado");
        }
    }

    // periodo: semana (7 dias), mes (30 dias), semestre (180 dias)
    public ResumoGastosDTO resumo(String periodo, String usuarioId) {
        int dias = switch (periodo.toLowerCase()) {
            case "semana" -> 7;
            case "semestre" -> 180;
            default -> 30;
        };

        LocalDate hoje = LocalDate.now();
        List<Gasto> gastos = gastoRepository.findByUsuarioIdAndDataGreaterThanEqualAndDataLessThanEqual(usuarioId, hoje.minusDays(dias - 1), hoje);

        Map<String, Double> porCategoria = gastos.stream()
                .collect(Collectors.groupingBy(Gasto::getCategoria, Collectors.summingDouble(Gasto::getValor)));

        List<ResumoGastosDTO.CategoriaTotal> categorias = porCategoria.entrySet().stream()
                .map(e -> new ResumoGastosDTO.CategoriaTotal(e.getKey(), e.getValue()))
                .toList();

        double total = categorias.stream().mapToDouble(ResumoGastosDTO.CategoriaTotal::valor).sum();
        return new ResumoGastosDTO(total, categorias);
    }
}
