package com.bolsu.BolsuAPI.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

@Document(collection = "metas")
public record Meta(@Id String id, String usuarioId, String nome, long valorDesejado,
                   long valorGuardado, LocalDate prazo) {}
