package com.bolsu.BolsuAPI.repository;

import com.bolsu.BolsuAPI.model.Usuario;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends MongoRepository<Usuario, String> {
    Optional<Usuario> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsBySlug(String slug);

    @Query(value = "{ '$or': ["
            + "{ 'nome_completo': { $regex: ?0, $options: 'i' } },"
            + "{ 'slug': { $regex: ?0, $options: 'i' } }"
            + "], '_id': { $ne: ?1 } }")
    List<Usuario> buscarParaCompartilhamento(String busca, String usuarioAtualId);
}
