package com.bolsu.BolsuAPI.repository;

import com.bolsu.BolsuAPI.model.LimiteCategoria;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface LimiteCategoriaRepository extends MongoRepository<LimiteCategoria, String> {

    List<LimiteCategoria> findByUsuarioId(String usuarioId);

    Optional<LimiteCategoria> findByUsuarioIdAndCategoria(String usuarioId, String categoria);

    long deleteByIdAndUsuarioId(String id, String usuarioId);
}
