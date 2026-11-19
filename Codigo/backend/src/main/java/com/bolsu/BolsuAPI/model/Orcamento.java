package com.bolsu.BolsuAPI.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "orcamentos")
public class Orcamento {

    @Id
    private String id;
    private String usuarioId;
    private String mes; // formato 2026-10
    private double limiteMensal;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUsuarioId() { return usuarioId; }
    public void setUsuarioId(String usuarioId) { this.usuarioId = usuarioId; }
    public String getMes() { return mes; }
    public void setMes(String mes) { this.mes = mes; }
    public double getLimiteMensal() { return limiteMensal; }
    public void setLimiteMensal(double limiteMensal) { this.limiteMensal = limiteMensal; }
}
