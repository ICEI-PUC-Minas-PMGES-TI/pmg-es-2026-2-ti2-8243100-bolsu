package com.bolsu.BolsuAPI.dto;

import java.util.List;

/**
 * Resumo financeiro de um mês para a tela inicial.
 * Valores monetários em reais, com 2 casas decimais.
 *
 * @param mes                   mês consultado no formato AAAA-MM
 * @param entradas              total de entradas do mês
 * @param entradasEstimadas     true quando as entradas vêm da renda informada no cadastro
 *                              (ainda não há entradas registradas)
 * @param despesas              total gasto no mês
 * @param saldo                 entradas - despesas (pode ser negativo)
 * @param orcamento             limite mensal e consumo; null quando o usuário não definiu orçamento
 * @param categorias            despesas do mês por categoria, da maior para a menor
 * @param diasRestantes         dias que faltam no mês, contando hoje (0 se o mês já terminou)
 * @param gastoDiarioPermitido  saldo dividido pelos dias restantes (0 quando não há saldo ou dias)
 * @param variacaoSemanal       variação % das despesas dos últimos 7 dias frente aos 7 anteriores;
 *                              null quando não há base de comparação ou o mês não é o atual
 */
public record ResumoMensalDTO(
        String mes,
        double entradas,
        boolean entradasEstimadas,
        double despesas,
        double saldo,
        Orcamento orcamento,
        List<CategoriaTotal> categorias,
        int diasRestantes,
        double gastoDiarioPermitido,
        Double variacaoSemanal) {

    public record Orcamento(double limite, double consumido, double restante) {
    }

    public record CategoriaTotal(String nome, double valor) {
    }
}
