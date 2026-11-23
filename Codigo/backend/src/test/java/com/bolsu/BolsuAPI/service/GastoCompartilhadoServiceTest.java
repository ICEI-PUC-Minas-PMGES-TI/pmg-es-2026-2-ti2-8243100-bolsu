package com.bolsu.BolsuAPI.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.bolsu.BolsuAPI.dto.AtualizarPagamentoRequest;
import com.bolsu.BolsuAPI.dto.CriarGastoCompartilhadoRequest;
import com.bolsu.BolsuAPI.model.GastoCompartilhado;
import com.bolsu.BolsuAPI.model.ParticipacaoGasto;
import com.bolsu.BolsuAPI.model.StatusGastoCompartilhado;
import com.bolsu.BolsuAPI.model.StatusParticipacaoGasto;
import com.bolsu.BolsuAPI.model.Usuario;
import com.bolsu.BolsuAPI.repository.GastoCompartilhadoRepository;
import com.bolsu.BolsuAPI.repository.UsuarioRepository;

class GastoCompartilhadoServiceTest {

    private GastoCompartilhadoRepository gastos;
    private UsuarioRepository usuarios;
    private GastoCompartilhadoService service;

    @BeforeEach
    void setUp() {
        gastos = mock(GastoCompartilhadoRepository.class);
        usuarios = mock(UsuarioRepository.class);
        Clock clock = Clock.fixed(Instant.parse("2026-11-22T12:00:00Z"), ZoneId.of("America/Sao_Paulo"));
        service = new GastoCompartilhadoService(gastos, usuarios, clock);
        when(gastos.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(usuarios.findAllById(any())).thenReturn(List.of(usuario("u2", "Ana"), usuario("u3", "Bia")));
    }

    @Test
    void criaConvitesEPreservaDivisaoEntreCriadorEConvidados() {
        var resposta = service.criar("u1", new CriarGastoCompartilhadoRequest(
                "Mercado", "Compras da casa", new BigDecimal("90.00"), List.of("u2", "u3")));

        assertThat(resposta.valorPorParticipante()).isEqualByComparingTo("30.00");
        assertThat(resposta.participantes())
                .extracting(participante -> participante.status())
                .containsExactly(StatusParticipacaoGasto.ACEITO,
                        StatusParticipacaoGasto.PENDENTE, StatusParticipacaoGasto.PENDENTE);
        verify(gastos).save(any(GastoCompartilhado.class));
    }

    @Test
    void recusaRemoveParticipanteEDivisaoERecalculada() {
        GastoCompartilhado gasto = gastoComTresPessoas();
        when(gastos.findById("g1")).thenReturn(Optional.of(gasto));

        service.recusarConvite("g1", "u2");
        var resposta = service.buscar("g1", "u1");

        assertThat(resposta.valorPorParticipante()).isEqualByComparingTo("45.00");
        assertThat(resposta.participantes()).hasSize(2);
        assertThat(gasto.getParticipacoes().get(1).getStatus()).isEqualTo(StatusParticipacaoGasto.RECUSADO);
    }

    @Test
    void somenteCotaDoProprioParticipantePodeSerMarcadaComoPaga() {
        GastoCompartilhado gasto = gastoComTresPessoas();
        gasto.getParticipacoes().get(1).setStatus(StatusParticipacaoGasto.ACEITO);
        when(gastos.findById("g1")).thenReturn(Optional.of(gasto));

        service.atualizarMeuPagamento("g1", "u2", new AtualizarPagamentoRequest(true));

        assertThat(gasto.getParticipacoes().get(1).isPago()).isTrue();
        assertThat(gasto.getParticipacoes().get(0).isPago()).isFalse();
        assertThat(gasto.getParticipacoes().get(2).isPago()).isFalse();
    }

    @Test
    void criadorSoEncerraQuandoTodosAceitaramEPagaram() {
        GastoCompartilhado gasto = gastoComTresPessoas();
        when(gastos.findById("g1")).thenReturn(Optional.of(gasto));

        assertThatThrownBy(() -> service.encerrar("g1", "u1"))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        erro -> assertThat(erro.getStatusCode()).isEqualTo(HttpStatus.CONFLICT));

        gasto.getParticipacoes().forEach(participacao -> {
            participacao.setStatus(StatusParticipacaoGasto.ACEITO);
            participacao.setPago(true);
        });
        service.encerrar("g1", "u1");

        assertThat(gasto.getStatus()).isEqualTo(StatusGastoCompartilhado.ENCERRADO);
        assertThat(gasto.getEncerradoEm()).isNotNull();
    }

    @Test
    void encaminhaSlugParaBuscaDeParticipantesMesmoComArroba() {
        when(usuarios.buscarParaCompartilhamento("\\Qnubia-torres\\E", "u1"))
                .thenReturn(List.of(usuario("u2", "Núbia Torres")));

        var encontrados = service.buscarUsuarios("@nubia-torres", "u1");

        assertThat(encontrados).singleElement()
                .satisfies(usuario -> assertThat(usuario.nome()).isEqualTo("Núbia Torres"));
        verify(usuarios).buscarParaCompartilhamento("\\Qnubia-torres\\E", "u1");
    }

    private static GastoCompartilhado gastoComTresPessoas() {
        GastoCompartilhado gasto = new GastoCompartilhado();
        gasto.setId("g1");
        gasto.setCriadorId("u1");
        gasto.setNome("Mercado");
        gasto.setValorTotal(new BigDecimal("90.00"));
        gasto.setStatus(StatusGastoCompartilhado.ATIVO);
        gasto.setParticipacoes(List.of(
                new ParticipacaoGasto("u1", StatusParticipacaoGasto.ACEITO),
                new ParticipacaoGasto("u2", StatusParticipacaoGasto.PENDENTE),
                new ParticipacaoGasto("u3", StatusParticipacaoGasto.ACEITO)));
        return gasto;
    }

    private static Usuario usuario(String id, String nome) {
        Usuario usuario = new Usuario();
        usuario.setId(id);
        usuario.setNome_completo(nome);
        return usuario;
    }
}
