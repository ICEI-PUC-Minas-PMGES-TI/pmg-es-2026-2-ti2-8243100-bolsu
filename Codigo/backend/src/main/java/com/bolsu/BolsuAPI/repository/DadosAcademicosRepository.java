package com.bolsu.BolsuAPI.repository;

import com.bolsu.BolsuAPI.model.DadosAcademicos;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface DadosAcademicosRepository extends MongoRepository<DadosAcademicos, String> {
}
