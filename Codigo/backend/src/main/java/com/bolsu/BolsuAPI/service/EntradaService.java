package com.bolsu.BolsuAPI.service;

import com.bolsu.BolsuAPI.dto.EntradaDTO;
import com.bolsu.BolsuAPI.model.Entrada;
import com.bolsu.BolsuAPI.repository.EntradaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
public class EntradaService {

    @Autowired
    private EntradaRepository entradaRepository;

    public List<Entrada> getAll(String usuarioId) {
        return entradaRepository.findByUsuarioId(usuarioId).stream()
                .sorted(Comparator.comparing(Entrada::getData).reversed())
                .toList();
    }

    public Entrada add(EntradaDTO dto, String usuarioId) {
        Entrada entrada = new Entrada();
        preencher(entrada, dto);
        entrada.setUsuarioId(usuarioId);
        return entradaRepository.save(entrada);
    }

    public Entrada update(String id, EntradaDTO dto, String usuarioId) {
        Entrada entrada = entradaRepository.findByIdAndUsuarioId(id, usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entrada nao encontrada"));
        preencher(entrada, dto);
        return entradaRepository.save(entrada);
    }

    public void delete(String id, String usuarioId) {
        if (entradaRepository.deleteByIdAndUsuarioId(id, usuarioId) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Entrada nao encontrada");
        }
    }

    private void preencher(Entrada entrada, EntradaDTO dto) {
        if (dto.descricao() == null || dto.descricao().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe a descricao");
        }
        if (dto.valor() == null || !Double.isFinite(dto.valor()) || dto.valor() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe um valor positivo");
        }
        entrada.setDescricao(dto.descricao().trim());
        entrada.setValor(Math.round(dto.valor() * 100.0) / 100.0);
        entrada.setData(dto.data() != null ? dto.data() : LocalDate.now());
    }
}
