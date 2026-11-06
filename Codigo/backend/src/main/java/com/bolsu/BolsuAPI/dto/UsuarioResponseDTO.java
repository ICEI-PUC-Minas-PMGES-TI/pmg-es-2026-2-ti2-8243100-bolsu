package com.bolsu.BolsuAPI.dto;

import com.bolsu.BolsuAPI.model.DadosAcademicos;
import com.bolsu.BolsuAPI.model.DadosFinanceiros;

public record UsuarioResponseDTO(
        String nomeCompleto,
        String email,
        String celular,
        DadosAcademicos dadosAcademicos,
        DadosFinanceiros dadosFinanceiros
) {
}
