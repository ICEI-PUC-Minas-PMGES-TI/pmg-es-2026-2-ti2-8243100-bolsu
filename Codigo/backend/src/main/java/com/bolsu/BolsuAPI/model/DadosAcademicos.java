package com.bolsu.BolsuAPI.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "dados_academicos")
public class DadosAcademicos {

    @Id
    private String id;
    private String instituicao;
    private String campus;
    private String curso;

    public DadosAcademicos() {
    }

    public DadosAcademicos(String instituicao, String campus, String curso) {
        this.instituicao = instituicao;
        this.campus = campus;
        this.curso = curso;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getInstituicao() {
        return instituicao;
    }

    public void setInstituicao(String instituicao) {
        this.instituicao = instituicao;
    }

    public String getCampus() {
        return campus;
    }

    public void setCampus(String campus) {
        this.campus = campus;
    }

    public String getCurso() {
        return curso;
    }

    public void setCurso(String curso) {
        this.curso = curso;
    }
}
