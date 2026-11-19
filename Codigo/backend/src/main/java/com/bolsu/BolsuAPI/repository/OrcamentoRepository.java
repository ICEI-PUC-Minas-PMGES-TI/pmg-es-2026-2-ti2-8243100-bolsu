package com.bolsu.BolsuAPI.repository;

import com.bolsu.BolsuAPI.model.Orcamento;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface OrcamentoRepository extends MongoRepository<Orcamento, String> {

    Optional<Orcamento> findByUsuarioIdAndMes(String usuarioId, String mes);
}
