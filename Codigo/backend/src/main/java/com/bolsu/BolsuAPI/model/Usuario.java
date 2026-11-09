package com.bolsu.BolsuAPI.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "usuarios")
public class Usuario {

    @Id
    private String id;
    private String nome_completo;
    private String slug;
    private String email;
    private String senha;
    private String celular;
    @DBRef
    private DadosAcademicos dadosAcademicos;
    @DBRef
    private DadosFinanceiros dadosFinanceiros;

    public Usuario() {
    }

    public Usuario(String nome_completo, String slug, String email, String senha, String celular, DadosAcademicos dadosAcademicos, DadosFinanceiros dadosFinanceiros) {
        this.nome_completo = nome_completo;
        this.slug = slug;
        this.email = email;
        this.senha = senha;
        this.celular = celular;
        this.dadosAcademicos = dadosAcademicos;
        this.dadosFinanceiros = dadosFinanceiros;
    }

    public String getId() {
        return id;
    }
    public void setId(String id) {
        this.id = id;
    }
    public String getNome_completo() {
        return nome_completo;
    }
    public void setNome_completo(String nome_completo) {
        this.nome_completo = nome_completo;
    }
    public String getSlug() {
        return slug;
    }
    public void setSlug(String slug) {
        this.slug = slug;
    }
    public String getEmail() {
        return email;
    }
    public void setEmail(String email) {
        this.email = email;
    }
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    public String getSenha() {
        return senha;
    }
    public void setSenha(String senha) {
        this.senha = senha;
    }
    public String getCelular() {
        return celular;
    }
    public void setCelular(String celular) {
        this.celular = celular;
    }
    public DadosAcademicos getDadosAcademicos() {
        return dadosAcademicos;
    }
    public void setDadosAcademicos(DadosAcademicos dadosAcademicos) {
        this.dadosAcademicos = dadosAcademicos;
    }
    public DadosFinanceiros getDadosFinanceiros() {
        return dadosFinanceiros;
    }
    public void setDadosFinanceiros(DadosFinanceiros dadosFinanceiros) {
        this.dadosFinanceiros = dadosFinanceiros;
    }
}
