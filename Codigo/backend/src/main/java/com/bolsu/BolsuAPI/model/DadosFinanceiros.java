package com.bolsu.BolsuAPI.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "dados_financeiros")
public class DadosFinanceiros {

    @Id
    private String id;
    private double faixaRendaMensal;
    private List<String> fontesRenda;
    private List<String> objetivos;

    public DadosFinanceiros() {
    }

    public DadosFinanceiros(double faixaRendaMensal, List<String> fontesRenda, List<String> objetivos) {
        this.faixaRendaMensal = faixaRendaMensal;
        this.fontesRenda = fontesRenda;
        this.objetivos = objetivos;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public double getFaixaRendaMensal() {
        return faixaRendaMensal;
    }

    public void setFaixaRendaMensal(double faixaRendaMensal) {
        this.faixaRendaMensal = faixaRendaMensal;
    }

    public List<String> getFontesRenda() {
        return fontesRenda;
    }

    public void setFontesRenda(List<String> fontesRenda) {
        this.fontesRenda = fontesRenda;
    }

    public List<String> getObjetivos() {
        return objetivos;
    }

    public void setObjetivos(List<String> objetivos) {
        this.objetivos = objetivos;
    }
}
