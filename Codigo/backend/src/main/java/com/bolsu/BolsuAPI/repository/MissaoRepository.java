package com.bolsu.BolsuAPI.repository;

import com.bolsu.BolsuAPI.model.Missao;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface MissaoRepository extends MongoRepository<Missao, String> {
    List<Missao> findByAtivaTrueOrderByOrdemAscIdAsc();
}
