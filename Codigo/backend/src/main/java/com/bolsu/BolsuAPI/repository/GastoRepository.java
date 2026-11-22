package com.bolsu.BolsuAPI.repository;

import com.bolsu.BolsuAPI.model.Gasto;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import java.time.LocalDate;
import java.util.List;

public interface GastoRepository extends MongoRepository<Gasto, String> {
    List<Gasto> findByUsuarioId(String usuarioId);
    // @Query explícita: o Spring Data MongoDB não aceita dois filtros no mesmo campo (data >= e data <=)
    // em um método derivado pelo nome. Intervalo inclusivo nas duas pontas.
    @Query("{ 'usuarioId': ?0, 'data': { $gte: ?1, $lte: ?2 } }")
    List<Gasto> findByUsuarioIdAndDataGreaterThanEqualAndDataLessThanEqual(String usuarioId, LocalDate inicio, LocalDate fim);
    long deleteByIdAndUsuarioId(String id, String usuarioId);
}
