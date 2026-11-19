package com.bolsu.BolsuAPI.service;

import com.bolsu.BolsuAPI.dto.ResumoGastosDTO;
import com.bolsu.BolsuAPI.model.Gasto;
import com.bolsu.BolsuAPI.repository.GastoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class GastoServiceTest {

    private static final String USUARIO = "usuario-1";

    private GastoRepository repository;
    private GastoService service;

    @BeforeEach
    void setUp() {
        repository = mock(GastoRepository.class);
        service = new GastoService();
        ReflectionTestUtils.setField(service, "gastoRepository", repository);
    }

    private static Gasto gasto(String categoria, double valor) {
        return new Gasto(categoria, valor, LocalDate.now(), null);
    }

    private static void assertBadRequest(Runnable acao) {
        assertThatThrownBy(acao::run)
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    // ---- getAll

    @Test
    void listaSomenteOsGastosDoUsuario() {
        List<Gasto> esperados = List.of(gasto("Alimentação", 10));
        when(repository.findByUsuarioId(USUARIO)).thenReturn(esperados);

        assertThat(service.getAll(USUARIO)).isSameAs(esperados);
        verify(repository).findByUsuarioId(USUARIO);
    }

    // ---- add

    @Test
    void salvaGastoValidoAssociandoAoUsuarioDoToken() {
        Gasto novo = gasto("Transporte", 7.5);
        when(repository.save(novo)).thenReturn(novo);

        Gasto salvo = service.add(novo, USUARIO);

        assertThat(salvo.getUsuarioId()).isEqualTo(USUARIO);
        verify(repository).save(novo);
    }

    @Test
    void sobrescreveUsuarioIdEnviadoPeloCliente() {
        Gasto novo = gasto("Lazer", 30);
        novo.setUsuarioId("outro-usuario");
        when(repository.save(novo)).thenReturn(novo);

        service.add(novo, USUARIO);

        assertThat(novo.getUsuarioId()).isEqualTo(USUARIO);
    }

    @Test
    void recusaCategoriaNulaOuEmBranco() {
        assertBadRequest(() -> service.add(gasto(null, 10), USUARIO));
        assertBadRequest(() -> service.add(gasto("", 10), USUARIO));
        assertBadRequest(() -> service.add(gasto("   ", 10), USUARIO));
        verify(repository, never()).save(any());
    }

    @Test
    void recusaValorZeroOuNegativo() {
        assertBadRequest(() -> service.add(gasto("Lazer", 0), USUARIO));
        assertBadRequest(() -> service.add(gasto("Lazer", -5), USUARIO));
        verify(repository, never()).save(any());
    }

    @Test
    void recusaValorNaoFinito() {
        assertBadRequest(() -> service.add(gasto("Lazer", Double.NaN), USUARIO));
        assertBadRequest(() -> service.add(gasto("Lazer", Double.POSITIVE_INFINITY), USUARIO));
        verify(repository, never()).save(any());
    }

    @Test
    void mensagemDeValidacaoOrientaOUsuario() {
        assertThatThrownBy(() -> service.add(gasto("Lazer", 0), USUARIO))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        e -> assertThat(e.getReason()).isEqualTo("Informe categoria e valor positivo"));
    }

    // ---- delete

    @Test
    void removeGastoDoProprioUsuario() {
        when(repository.deleteByIdAndUsuarioId("g1", USUARIO)).thenReturn(1L);

        service.delete("g1", USUARIO);

        verify(repository).deleteByIdAndUsuarioId("g1", USUARIO);
    }

    @Test
    void naoEncontradoOuDeOutroUsuarioRetorna404() {
        when(repository.deleteByIdAndUsuarioId("g1", USUARIO)).thenReturn(0L);

        assertThatThrownBy(() -> service.delete("g1", USUARIO))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    // ---- resumo por período

    private ArgumentCaptor<LocalDate> inicioConsultado(String periodo) {
        ArgumentCaptor<LocalDate> inicio = ArgumentCaptor.forClass(LocalDate.class);
        when(repository.findByUsuarioIdAndDataGreaterThanEqualAndDataLessThanEqual(
                eq(USUARIO), any(), any())).thenReturn(List.of());
        service.resumo(periodo, USUARIO);
        verify(repository).findByUsuarioIdAndDataGreaterThanEqualAndDataLessThanEqual(
                eq(USUARIO), inicio.capture(), any());
        return inicio;
    }

    @Test
    void semanaCobreOsUltimos7DiasContandoHoje() {
        LocalDate hoje = LocalDate.now();
        assertThat(inicioConsultado("semana").getValue()).isEqualTo(hoje.minusDays(6));
    }

    @Test
    void mesCobreOsUltimos30Dias() {
        LocalDate hoje = LocalDate.now();
        assertThat(inicioConsultado("mes").getValue()).isEqualTo(hoje.minusDays(29));
    }

    @Test
    void semestreCobreOsUltimos180Dias() {
        LocalDate hoje = LocalDate.now();
        assertThat(inicioConsultado("semestre").getValue()).isEqualTo(hoje.minusDays(179));
    }

    @Test
    void periodoDesconhecidoUsaMes() {
        LocalDate hoje = LocalDate.now();
        assertThat(inicioConsultado("qualquer").getValue()).isEqualTo(hoje.minusDays(29));
    }

    @Test
    void periodoEhCaseInsensitive() {
        LocalDate hoje = LocalDate.now();
        assertThat(inicioConsultado("SEMANA").getValue()).isEqualTo(hoje.minusDays(6));
    }

    @Test
    void somaTotalEAgrupaPorCategoria() {
        when(repository.findByUsuarioIdAndDataGreaterThanEqualAndDataLessThanEqual(eq(USUARIO), any(), any()))
                .thenReturn(List.of(gasto("Alimentação", 40), gasto("Transporte", 15), gasto("Alimentação", 10)));

        ResumoGastosDTO resumo = service.resumo("mes", USUARIO);

        assertThat(resumo.total()).isEqualTo(65.0);
        assertThat(resumo.categorias()).hasSize(2);
        assertThat(resumo.categorias())
                .filteredOn(c -> c.nome().equals("Alimentação"))
                .singleElement()
                .satisfies(c -> assertThat(c.valor()).isEqualTo(50.0));
    }

    @Test
    void semGastosRetornaTotalZeroECategoriasVazias() {
        when(repository.findByUsuarioIdAndDataGreaterThanEqualAndDataLessThanEqual(eq(USUARIO), any(), any()))
                .thenReturn(List.of());

        ResumoGastosDTO resumo = service.resumo("mes", USUARIO);

        assertThat(resumo.total()).isZero();
        assertThat(resumo.categorias()).isEmpty();
    }
}
