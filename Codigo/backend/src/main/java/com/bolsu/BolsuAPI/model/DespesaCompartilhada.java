package com.bolsu.BolsuAPI.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "despesas_compartilhadas")
public class DespesaCompartilhada {

    @Id
    private String id;

    @Indexed
    private String grupoId;

    private String descricao;

    private BigDecimal valor;

    /** Usuário que pagou a despesa. */
    private String pagadorId;

    /** Usuários entre os quais a despesa é dividida em partes iguais. */
    private List<String> participantesIds = new ArrayList<>();

    private LocalDateTime criadoEm;

    public DespesaCompartilhada() {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getGrupoId() { return grupoId; }
    public void setGrupoId(String grupoId) { this.grupoId = grupoId; }

    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }

    public BigDecimal getValor() { return valor; }
    public void setValor(BigDecimal valor) { this.valor = valor; }

    public String getPagadorId() { return pagadorId; }
    public void setPagadorId(String pagadorId) { this.pagadorId = pagadorId; }

    public List<String> getParticipantesIds() { return participantesIds; }
    public void setParticipantesIds(List<String> participantesIds) { this.participantesIds = participantesIds; }

    public LocalDateTime getCriadoEm() { return criadoEm; }
    public void setCriadoEm(LocalDateTime criadoEm) { this.criadoEm = criadoEm; }
}
