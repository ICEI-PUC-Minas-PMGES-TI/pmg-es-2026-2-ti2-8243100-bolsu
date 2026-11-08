package com.bolsu.BolsuAPI.repository;

import com.bolsu.BolsuAPI.model.Meta;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface MetaRepository extends MongoRepository<Meta, String> {
    List<Meta> findByUsuarioIdOrderByPrazoAscIdAsc(String usuarioId);
    Optional<Meta> findByIdAndUsuarioId(String id, String usuarioId);
}
