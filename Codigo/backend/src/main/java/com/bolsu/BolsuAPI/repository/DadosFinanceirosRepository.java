package com.bolsu.BolsuAPI.repository;

import com.bolsu.BolsuAPI.model.DadosFinanceiros;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface DadosFinanceirosRepository extends MongoRepository<DadosFinanceiros, String> {
}
