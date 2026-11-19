package com.bolsu.BolsuAPI.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "limitesCategoria")
public class LimiteCategoria {

    @Id
    private String id;
    private String usuarioId;
    private String categoria;
    private double limite;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUsuarioId() { return usuarioId; }
    public void setUsuarioId(String usuarioId) { this.usuarioId = usuarioId; }
    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }
    public double getLimite() { return limite; }
    public void setLimite(double limite) { this.limite = limite; }
}
