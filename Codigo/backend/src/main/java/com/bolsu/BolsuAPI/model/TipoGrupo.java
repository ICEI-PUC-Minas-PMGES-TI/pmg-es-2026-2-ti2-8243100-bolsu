package com.bolsu.BolsuAPI.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/** Tipo do grupo de gastos compartilhados. No JSON trafega em minúsculas (ex.: "moradia"). */
public enum TipoGrupo {
    MORADIA,
    VIAGEM,
    AMIGOS,
    OUTRO;

    @JsonValue
    public String toJson() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static TipoGrupo fromJson(String valor) {
        if (valor == null) {
            return null;
        }
        return TipoGrupo.valueOf(valor.trim().toUpperCase());
    }
}
