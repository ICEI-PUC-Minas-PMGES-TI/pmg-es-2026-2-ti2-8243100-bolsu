package com.bolsu.BolsuAPI.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "gastos_compartilhados")
public class GastoCompartilhado {

    @Id
    private String id;

    @Indexed
    private String criadorId;

    private String nome;
    private String descricao;
    private BigDecimal valorTotal;
    private StatusGastoCompartilhado status;
    private List<ParticipacaoGasto> participacoes = new ArrayList<>();
    private LocalDateTime criadoEm;
    private LocalDateTime encerradoEm;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCriadorId() { return criadorId; }
    public void setCriadorId(String criadorId) { this.criadorId = criadorId; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }

    public BigDecimal getValorTotal() { return valorTotal; }
    public void setValorTotal(BigDecimal valorTotal) { this.valorTotal = valorTotal; }

    public StatusGastoCompartilhado getStatus() { return status; }
    public void setStatus(StatusGastoCompartilhado status) { this.status = status; }

    public List<ParticipacaoGasto> getParticipacoes() { return participacoes; }
    public void setParticipacoes(List<ParticipacaoGasto> participacoes) { this.participacoes = participacoes; }

    public LocalDateTime getCriadoEm() { return criadoEm; }
    public void setCriadoEm(LocalDateTime criadoEm) { this.criadoEm = criadoEm; }

    public LocalDateTime getEncerradoEm() { return encerradoEm; }
    public void setEncerradoEm(LocalDateTime encerradoEm) { this.encerradoEm = encerradoEm; }
}
