package com.bolsu.BolsuAPI.model;

public class ParticipacaoGasto {

    private String usuarioId;
    private StatusParticipacaoGasto status;
    private boolean pago;

    public ParticipacaoGasto() {
    }

    public ParticipacaoGasto(String usuarioId, StatusParticipacaoGasto status) {
        this.usuarioId = usuarioId;
        this.status = status;
        this.pago = false;
    }

    public String getUsuarioId() {
        return usuarioId;
    }

    public void setUsuarioId(String usuarioId) {
        this.usuarioId = usuarioId;
    }

    public StatusParticipacaoGasto getStatus() {
        return status;
    }

    public void setStatus(StatusParticipacaoGasto status) {
        this.status = status;
    }

    public boolean isPago() {
        return pago;
    }

    public void setPago(boolean pago) {
        this.pago = pago;
    }
}
