package com.bolsu.BolsuAPI.repository;

import com.bolsu.BolsuAPI.model.Entrada;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface EntradaRepository extends MongoRepository<Entrada, String> {

    List<Entrada> findByUsuarioId(String usuarioId);

    Optional<Entrada> findByIdAndUsuarioId(String id, String usuarioId);

    List<Entrada> findByUsuarioIdAndDataGreaterThanEqualAndDataLessThanEqual(String usuarioId, LocalDate inicio, LocalDate fim);

    long deleteByIdAndUsuarioId(String id, String usuarioId);
}
