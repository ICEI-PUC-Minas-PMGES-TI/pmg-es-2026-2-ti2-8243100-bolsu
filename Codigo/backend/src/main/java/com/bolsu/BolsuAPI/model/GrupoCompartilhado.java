package com.bolsu.BolsuAPI.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "grupos_compartilhados")
public class GrupoCompartilhado {

    @Id
    private String id;

    private String nome;

    private TipoGrupo tipo;

    private String criadorId;

    /** IDs dos usuários cadastrados que fazem parte do grupo (inclui o criador). */
    @Indexed
    private List<String> integrantesIds = new ArrayList<>();

    private LocalDateTime criadoEm;

    public GrupoCompartilhado() {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public TipoGrupo getTipo() { return tipo; }
    public void setTipo(TipoGrupo tipo) { this.tipo = tipo; }

    public String getCriadorId() { return criadorId; }
    public void setCriadorId(String criadorId) { this.criadorId = criadorId; }

    public List<String> getIntegrantesIds() { return integrantesIds; }
    public void setIntegrantesIds(List<String> integrantesIds) { this.integrantesIds = integrantesIds; }

    public LocalDateTime getCriadoEm() { return criadoEm; }
    public void setCriadoEm(LocalDateTime criadoEm) { this.criadoEm = criadoEm; }
}
