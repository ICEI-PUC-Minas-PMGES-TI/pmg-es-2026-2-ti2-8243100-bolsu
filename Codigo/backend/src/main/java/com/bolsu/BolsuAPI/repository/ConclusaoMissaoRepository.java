package com.bolsu.BolsuAPI.repository;

import com.bolsu.BolsuAPI.model.ConclusaoMissao;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ConclusaoMissaoRepository extends MongoRepository<ConclusaoMissao, String> {
    List<ConclusaoMissao> findByUsuarioId(String usuarioId);
}
