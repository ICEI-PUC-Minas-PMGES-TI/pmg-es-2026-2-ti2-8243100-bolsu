package com.bolsu.BolsuAPI.dto;

import com.bolsu.BolsuAPI.model.DadosAcademicos;
import com.bolsu.BolsuAPI.model.DadosFinanceiros;

public record UsuarioDTO(
        String nomeCompleto,
        String email,
        String senha,
        String celular,
        DadosAcademicos dadosAcademicos,
        DadosFinanceiros dadosFinanceiros
) {
}
