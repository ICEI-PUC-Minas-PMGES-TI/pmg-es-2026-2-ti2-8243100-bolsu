package com.bolsu.BolsuAPI.repository;

import com.bolsu.BolsuAPI.model.Gasto;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDate;
import java.util.List;

public interface GastoRepository extends MongoRepository<Gasto, String> {

    List<Gasto> findByDataBetween(LocalDate inicio, LocalDate fim);
}
