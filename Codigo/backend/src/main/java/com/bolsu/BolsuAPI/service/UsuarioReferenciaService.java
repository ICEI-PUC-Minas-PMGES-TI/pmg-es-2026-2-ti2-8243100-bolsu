package com.bolsu.BolsuAPI.service;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

/**
 * Consulta usuários cadastrados sem depender das classes dos colegas.
 * AJUSTE se necessário: COLECAO_USUARIOS e CAMPO_NOME precisam bater com o model de usuário do projeto.
 */
@Service
public class UsuarioReferenciaService {

    private static final String COLECAO_USUARIOS = "usuarios";
    private static final String CAMPO_NOME = "nome";

    private final MongoTemplate mongoTemplate;

    public UsuarioReferenciaService(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    /** Retorna id -> nome apenas dos usuários que existem. */
    public Map<String, String> buscarNomes(Collection<String> ids) {
        Map<String, String> resultado = new HashMap<>();
        if (ids == null || ids.isEmpty()) {
            return resultado;
        }
        List<Object> candidatos = new ArrayList<>();
        for (String id : ids) {
            candidatos.add(id);
            if (ObjectId.isValid(id)) {
                candidatos.add(new ObjectId(id));
            }
        }
        Query query = Query.query(Criteria.where("_id").in(candidatos));
        for (Document doc : mongoTemplate.find(query, Document.class, COLECAO_USUARIOS)) {
            String id = String.valueOf(doc.get("_id"));
            String nome = doc.getString(CAMPO_NOME);
            resultado.put(id, nome != null ? nome : id);
        }
        return resultado;
    }

    /** IDs da lista que NÃO correspondem a usuários cadastrados. */
    public List<String> idsInexistentes(Collection<String> ids) {
        Map<String, String> existentes = buscarNomes(ids);
        List<String> inexistentes = new ArrayList<>();
        for (String id : ids) {
            if (!existentes.containsKey(id)) {
                inexistentes.add(id);
            }
        }
        return inexistentes;
    }
}
