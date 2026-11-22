package com.bolsu.BolsuAPI.service;

import com.bolsu.BolsuAPI.dto.ResumoMensalDTO;
import com.bolsu.BolsuAPI.model.Gasto;
import com.bolsu.BolsuAPI.repository.GastoRepository;
import com.bolsu.BolsuAPI.service.resumo.EntradasDoMes;
import com.bolsu.BolsuAPI.service.resumo.OrcamentoDoMes;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.OptionalDouble;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ResumoServiceTest {

    private static final String USUARIO = "usuario-1";
    private static final ZoneId SAO_PAULO = ZoneId.of("America/Sao_Paulo");
    // Hoje: 2026-11-08 (domingo). Novembro tem 30 dias -> 23 dias restantes contando hoje.
    private static final Clock RELOGIO = Clock.fixed(
            LocalDate.of(2026, 11, 8).atTime(12, 0).atZone(SAO_PAULO).toInstant(), SAO_PAULO);
    private static final YearMonth NOVEMBRO = YearMonth.of(2026, 11);

    private GastoRepository gastos;
    private EntradasDoMes entradas;
    private OrcamentoDoMes orcamento;
    private ResumoService service;

    @BeforeEach
    void setUp() {
        gastos = mock(GastoRepository.class);
        entradas = mock(EntradasDoMes.class);
        orcamento = mock(OrcamentoDoMes.class);
        when(entradas.total(any(), any())).thenReturn(Optional.empty());
        when(orcamento.limiteTotal(any(), any())).thenReturn(OptionalDouble.empty());
        service = new ResumoService(gastos, entradas, orcamento, RELOGIO);
    }

    private static Gasto gasto(String categoria, double valor, LocalDate data) {
        return new Gasto(categoria, valor, data, null);
    }

    private void gastosNoMes(YearMonth mes, Gasto... lista) {
        when(gastos.findByUsuarioIdAndDataGreaterThanEqualAndDataLessThanEqual(
                USUARIO, mes.atDay(1), mes.atEndOfMonth())).thenReturn(List.of(lista));
    }

    private void gastosNaJanela(LocalDate inicio, LocalDate fim, Gasto... lista) {
        when(gastos.findByUsuarioIdAndDataGreaterThanEqualAndDataLessThanEqual(USUARIO, inicio, fim))
                .thenReturn(List.of(lista));
    }

    @Test
    void calculaDespesasSaldoECategoriasDoMes() {
        gastosNoMes(NOVEMBRO,
                gasto("Alimentação", 40.50, LocalDate.of(2026, 11, 2)),
                gasto("Transporte", 20, LocalDate.of(2026, 11, 3)),
                gasto("Alimentação", 29.50, LocalDate.of(2026, 11, 7)));
        when(entradas.total(USUARIO, NOVEMBRO)).thenReturn(Optional.of(new EntradasDoMes.Total(500, true)));

        ResumoMensalDTO resumo = service.resumoDoMes(USUARIO, NOVEMBRO);

        assertThat(resumo.mes()).isEqualTo("2026-11");
        assertThat(resumo.entradas()).isEqualTo(500.0);
        assertThat(resumo.entradasEstimadas()).isTrue();
        assertThat(resumo.despesas()).isEqualTo(90.0);
        assertThat(resumo.saldo()).isEqualTo(410.0);
        assertThat(resumo.categorias()).extracting(ResumoMensalDTO.CategoriaTotal::nome)
                .containsExactly("Alimentação", "Transporte");
        assertThat(resumo.categorias().get(0).valor()).isEqualTo(70.0);
        assertThat(resumo.diasRestantes()).isEqualTo(23);
        assertThat(resumo.gastoDiarioPermitido()).isEqualTo(17.83); // 410 / 23
        assertThat(resumo.orcamento()).isNull();
    }

    @Test
    void consultaSomenteOsGastosDoUsuarioAutenticado() {
        service.resumoDoMes("usuario-2", NOVEMBRO);

        verify(gastos).findByUsuarioIdAndDataGreaterThanEqualAndDataLessThanEqual(
                eq("usuario-2"), eq(NOVEMBRO.atDay(1)), eq(NOVEMBRO.atEndOfMonth()));
        verify(entradas).total("usuario-2", NOVEMBRO);
        verify(orcamento).limiteTotal("usuario-2", NOVEMBRO);
    }

    @Test
    void semEntradasNemOrcamentoSaldoFicaNegativoESemGastoDiario() {
        gastosNoMes(NOVEMBRO, gasto("Lazer", 30, LocalDate.of(2026, 11, 5)));

        ResumoMensalDTO resumo = service.resumoDoMes(USUARIO, NOVEMBRO);

        assertThat(resumo.entradas()).isZero();
        assertThat(resumo.entradasEstimadas()).isFalse();
        assertThat(resumo.saldo()).isEqualTo(-30.0);
        assertThat(resumo.gastoDiarioPermitido()).isZero();
        assertThat(resumo.orcamento()).isNull();
    }

    @Test
    void mesSemGastosRetornaZerosECategoriasVazias() {
        ResumoMensalDTO resumo = service.resumoDoMes(USUARIO, NOVEMBRO);

        assertThat(resumo.despesas()).isZero();
        assertThat(resumo.categorias()).isEmpty();
        assertThat(resumo.variacaoSemanal()).isNull();
    }

    @Test
    void informaOrcamentoRestanteQuandoHaLimite() {
        gastosNoMes(NOVEMBRO, gasto("Alimentação", 150, LocalDate.of(2026, 11, 4)));
        when(orcamento.limiteTotal(USUARIO, NOVEMBRO)).thenReturn(OptionalDouble.of(650));

        ResumoMensalDTO resumo = service.resumoDoMes(USUARIO, NOVEMBRO);

        assertThat(resumo.orcamento()).isNotNull();
        assertThat(resumo.orcamento().limite()).isEqualTo(650.0);
        assertThat(resumo.orcamento().consumido()).isEqualTo(150.0);
        assertThat(resumo.orcamento().restante()).isEqualTo(500.0);
    }

    @Test
    void orcamentoEstouradoTemRestanteNegativo() {
        gastosNoMes(NOVEMBRO, gasto("Lazer", 120, LocalDate.of(2026, 11, 4)));
        when(orcamento.limiteTotal(USUARIO, NOVEMBRO)).thenReturn(OptionalDouble.of(100));

        assertThat(service.resumoDoMes(USUARIO, NOVEMBRO).orcamento().restante()).isEqualTo(-20.0);
    }

    @Test
    void somaCentavosSemErroDePontoFlutuante() {
        gastosNoMes(NOVEMBRO,
                gasto("A", 0.1, LocalDate.of(2026, 11, 1)),
                gasto("A", 0.2, LocalDate.of(2026, 11, 2)));

        assertThat(service.resumoDoMes(USUARIO, NOVEMBRO).despesas()).isEqualTo(0.3);
    }

    @Test
    void categoriaAusenteVaiParaOutros() {
        gastosNoMes(NOVEMBRO, gasto(null, 10, LocalDate.of(2026, 11, 1)), gasto(" ", 5, LocalDate.of(2026, 11, 2)));

        var categorias = service.resumoDoMes(USUARIO, NOVEMBRO).categorias();

        assertThat(categorias).hasSize(1);
        assertThat(categorias.get(0).nome()).isEqualTo("Outros");
        assertThat(categorias.get(0).valor()).isEqualTo(15.0);
    }

    @Test
    void variacaoSemanalComparaUltimos7DiasComOs7Anteriores() {
        // janela: 26/10 a 08/11. Últimos 7 dias: 02/11 a 08/11.
        gastosNaJanela(LocalDate.of(2026, 10, 26), LocalDate.of(2026, 11, 8),
                gasto("A", 80, LocalDate.of(2026, 10, 28)),
                gasto("A", 20, LocalDate.of(2026, 11, 1)),
                gasto("A", 60, LocalDate.of(2026, 11, 5)));

        assertThat(service.resumoDoMes(USUARIO, NOVEMBRO).variacaoSemanal()).isEqualTo(-40.0); // 60 vs 100
    }

    @Test
    void variacaoSemanalNulaSemSemanaAnteriorParaComparar() {
        gastosNaJanela(LocalDate.of(2026, 10, 26), LocalDate.of(2026, 11, 8),
                gasto("A", 60, LocalDate.of(2026, 11, 5)));

        assertThat(service.resumoDoMes(USUARIO, NOVEMBRO).variacaoSemanal()).isNull();
    }

    @Test
    void mesPassadoNaoTemDiasRestantesNemGastoDiarioNemVariacao() {
        YearMonth outubro = YearMonth.of(2026, 10);
        gastosNoMes(outubro, gasto("A", 10, LocalDate.of(2026, 10, 3)));
        when(entradas.total(USUARIO, outubro)).thenReturn(Optional.of(new EntradasDoMes.Total(500, false)));

        ResumoMensalDTO resumo = service.resumoDoMes(USUARIO, outubro);

        assertThat(resumo.diasRestantes()).isZero();
        assertThat(resumo.gastoDiarioPermitido()).isZero();
        assertThat(resumo.variacaoSemanal()).isNull();
        assertThat(resumo.entradasEstimadas()).isFalse();
        assertThat(resumo.saldo()).isCloseTo(490.0, within(0.001));
    }

    @Test
    void mesFuturoTemOMesInteiroPelaFrente() {
        assertThat(service.resumoDoMes(USUARIO, YearMonth.of(2026, 12)).diasRestantes()).isEqualTo(31);
    }

    @Test
    void mesAtualUsaFusoDeSaoPauloEmVezDeUtc() {
        // 30/11 23:30 em São Paulo já é 01/12 em UTC; o mês atual deve continuar sendo novembro.
        Instant instante = LocalDate.of(2026, 11, 30).atTime(23, 30).atZone(SAO_PAULO).toInstant();
        var servico = new ResumoService(gastos, entradas, orcamento, Clock.fixed(instante, SAO_PAULO));

        assertThat(servico.mesAtual()).isEqualTo(NOVEMBRO);
        assertThat(servico.resumoDoMes(USUARIO, NOVEMBRO).diasRestantes()).isEqualTo(1);
    }
}
