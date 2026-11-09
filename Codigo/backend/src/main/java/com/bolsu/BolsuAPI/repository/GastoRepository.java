package com.bolsu.BolsuAPI.repository;

import com.bolsu.BolsuAPI.model.Gasto;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.time.LocalDate;
import java.util.List;

public interface GastoRepository extends MongoRepository<Gasto, String> {
    List<Gasto> findByUsuarioId(String usuarioId);
    List<Gasto> findByUsuarioIdAndDataGreaterThanEqualAndDataLessThanEqual(String usuarioId, LocalDate inicio, LocalDate fim);
    long deleteByIdAndUsuarioId(String id, String usuarioId);
}
