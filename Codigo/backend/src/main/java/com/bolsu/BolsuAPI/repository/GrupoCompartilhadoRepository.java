package com.bolsu.BolsuAPI.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import com.bolsu.BolsuAPI.model.GrupoCompartilhado;

public interface GrupoCompartilhadoRepository extends MongoRepository<GrupoCompartilhado, String> {

    /** Grupos em que o usuário é integrante (inclusive os criados por outras pessoas). */
    @Query("{ 'integrantesIds': ?0 }")
    List<GrupoCompartilhado> findByIntegrante(String usuarioId);
}
