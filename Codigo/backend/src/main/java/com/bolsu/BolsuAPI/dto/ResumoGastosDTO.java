package com.bolsu.BolsuAPI.dto;

import java.util.List;

public record ResumoGastosDTO(double total, List<CategoriaTotal> categorias) {

    public record CategoriaTotal(String nome, double valor) {
    }
}
