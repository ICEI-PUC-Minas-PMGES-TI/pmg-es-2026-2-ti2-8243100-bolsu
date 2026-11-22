package com.bolsu.BolsuAPI.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "conclusoes_missoes")
public record ConclusaoMissao(@Id String id, String usuarioId, int moedas) {}
