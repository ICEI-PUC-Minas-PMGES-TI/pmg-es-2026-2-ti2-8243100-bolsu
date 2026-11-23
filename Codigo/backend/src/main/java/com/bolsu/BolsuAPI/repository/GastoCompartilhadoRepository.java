package com.bolsu.BolsuAPI.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import com.bolsu.BolsuAPI.model.GastoCompartilhado;

public interface GastoCompartilhadoRepository extends MongoRepository<GastoCompartilhado, String> {

    @Query("{ 'participacoes.usuarioId': ?0 }")
    List<GastoCompartilhado> findByParticipanteId(String usuarioId);
}
