package com.bolsu.BolsuAPI.service;

import com.bolsu.BolsuAPI.dto.LimiteCategoriaDTO;
import com.bolsu.BolsuAPI.model.LimiteCategoria;
import com.bolsu.BolsuAPI.repository.LimiteCategoriaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class LimiteCategoriaService {

    @Autowired
    private LimiteCategoriaRepository limiteRepository;

    public List<LimiteCategoria> getAll(String usuarioId) {
        return limiteRepository.findByUsuarioId(usuarioId);
    }

    // cria o limite da categoria ou atualiza se ela ja tiver um
    public LimiteCategoria salvar(LimiteCategoriaDTO dto, String usuarioId) {
        if (dto.categoria() == null || dto.categoria().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe a categoria");
        }
        if (dto.limite() == null || !Double.isFinite(dto.limite()) || dto.limite() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe um limite positivo");
        }

        String categoria = dto.categoria().trim();
        LimiteCategoria limite = limiteRepository.findByUsuarioIdAndCategoria(usuarioId, categoria)
                .orElseGet(LimiteCategoria::new);

        limite.setUsuarioId(usuarioId);
        limite.setCategoria(categoria);
        limite.setLimite(Math.round(dto.limite() * 100.0) / 100.0);
        return limiteRepository.save(limite);
    }

    public void delete(String id, String usuarioId) {
        if (limiteRepository.deleteByIdAndUsuarioId(id, usuarioId) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Limite nao encontrado");
        }
    }
}
