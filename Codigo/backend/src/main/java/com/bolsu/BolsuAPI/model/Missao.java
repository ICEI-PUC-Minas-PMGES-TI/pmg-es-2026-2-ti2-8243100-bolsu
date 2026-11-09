package com.bolsu.BolsuAPI.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "missoes")
public class Missao {
    @Id public String id;
    public String tipo;
    public String titulo;
    public String descricao;
    public long objetivo;
    public String unidade;
    public String periodicidade;
    public int recompensaMoedas;
    public int ordem;
    public boolean ativa;
}
