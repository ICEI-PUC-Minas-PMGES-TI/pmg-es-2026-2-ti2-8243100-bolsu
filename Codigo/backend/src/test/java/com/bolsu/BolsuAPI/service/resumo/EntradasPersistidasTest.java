package com.bolsu.BolsuAPI.service.resumo;

import com.bolsu.BolsuAPI.model.Entrada;
import com.bolsu.BolsuAPI.repository.EntradaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class EntradasPersistidasTest {

    private static final String USUARIO = "usuario-1";
    private static final YearMonth NOVEMBRO = YearMonth.of(2026, 11);

    private EntradaRepository repository;
    private EntradasDeclaradas declaradas;
    private EntradasPersistidas entradas;

    @BeforeEach
    void setUp() {
        repository = mock(EntradaRepository.class);
        declaradas = mock(EntradasDeclaradas.class);
        entradas = new EntradasPersistidas(repository, declaradas);
        when(declaradas.total(any(), any())).thenReturn(Optional.empty());
    }

    private static Entrada entrada(double valor, LocalDate data) {
        Entrada e = new Entrada();
        e.setValor(valor);
        e.setData(data);
        return e;
    }

    @Test
    void somaAsEntradasRegistradasNoMes() {
        when(repository.findByUsuarioId(USUARIO)).thenReturn(List.of(
                entrada(1200, LocalDate.of(2026, 11, 5)),
                entrada(300.5, LocalDate.of(2026, 11, 20))));

        var total = entradas.total(USUARIO, NOVEMBRO);

        assertThat(total).isPresent();
        assertThat(total.get().valor()).isEqualTo(1500.5);
        assertThat(total.get().estimado()).isFalse();
        verify(declaradas, never()).total(any(), any());
    }

    @Test
    void ignoraEntradasDeOutrosMeses() {
        when(repository.findByUsuarioId(USUARIO)).thenReturn(List.of(
                entrada(1000, LocalDate.of(2026, 10, 31)),
                entrada(200, LocalDate.of(2026, 11, 1)),
                entrada(50, LocalDate.of(2026, 11, 30)),
                entrada(900, LocalDate.of(2026, 12, 1)),
                entrada(700, LocalDate.of(2025, 11, 10))));

        assertThat(entradas.total(USUARIO, NOVEMBRO).orElseThrow().valor()).isEqualTo(250.0);
    }

    @Test
    void ignoraEntradaSemData() {
        when(repository.findByUsuarioId(USUARIO)).thenReturn(List.of(
                entrada(100, null),
                entrada(40, LocalDate.of(2026, 11, 2))));

        assertThat(entradas.total(USUARIO, NOVEMBRO).orElseThrow().valor()).isEqualTo(40.0);
    }

    @Test
    void somaCentavosSemErroDePontoFlutuante() {
        when(repository.findByUsuarioId(USUARIO)).thenReturn(List.of(
                entrada(0.1, LocalDate.of(2026, 11, 1)),
                entrada(0.2, LocalDate.of(2026, 11, 2))));

        assertThat(entradas.total(USUARIO, NOVEMBRO).orElseThrow().valor()).isEqualTo(0.3);
    }

    @Test
    void semEntradasNoMesUsaARendaDeclaradaComoEstimativa() {
        when(repository.findByUsuarioId(USUARIO)).thenReturn(List.of(entrada(900, LocalDate.of(2026, 10, 5))));
        when(declaradas.total(USUARIO, NOVEMBRO)).thenReturn(Optional.of(new EntradasDoMes.Total(800, true)));

        var total = entradas.total(USUARIO, NOVEMBRO);

        assertThat(total).contains(new EntradasDoMes.Total(800, true));
    }

    @Test
    void semEntradasNemRendaDeclaradaNaoHaInformacao() {
        when(repository.findByUsuarioId(USUARIO)).thenReturn(List.of());

        assertThat(entradas.total(USUARIO, NOVEMBRO)).isEmpty();
    }

    @Test
    void consultaSomenteAsEntradasDoUsuario() {
        when(repository.findByUsuarioId("usuario-2")).thenReturn(List.of());

        entradas.total("usuario-2", NOVEMBRO);

        verify(repository).findByUsuarioId("usuario-2");
        verify(repository, never()).findByUsuarioId(USUARIO);
    }
}
