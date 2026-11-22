package com.bolsu.BolsuAPI.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.bolsu.BolsuAPI.model.DespesaCompartilhada;

public interface DespesaCompartilhadaRepository extends MongoRepository<DespesaCompartilhada, String> {

    List<DespesaCompartilhada> findByGrupoIdIn(Collection<String> grupoIds);
}
