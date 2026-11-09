package com.bolsu.BolsuAPI.dto;

import java.util.List;

import com.bolsu.BolsuAPI.model.TipoGrupo;

/**
 * integrantesIds: IDs de usuários cadastrados, SEM o criador (ele é adicionado automaticamente).
 * primeiraDespesa: opcional; envie null quando o campo não for preenchido no formulário.
 * A validação é feita no service (o projeto não tem spring-boot-starter-validation).
 */
public record CriarGrupoRequest(
        String nome,
        TipoGrupo tipo,
        List<String> integrantesIds,
        PrimeiraDespesaRequest primeiraDespesa) {
}
