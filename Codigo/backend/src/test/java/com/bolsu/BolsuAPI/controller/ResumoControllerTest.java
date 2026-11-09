package com.bolsu.BolsuAPI.controller;

import com.bolsu.BolsuAPI.configuration.ApplicationConfiguration;
import com.bolsu.BolsuAPI.dto.ResumoMensalDTO;
import com.bolsu.BolsuAPI.repository.GastoRepository;
import com.bolsu.BolsuAPI.repository.UsuarioRepository;
import com.bolsu.BolsuAPI.security.JwtUtil;
import com.bolsu.BolsuAPI.service.AuthService;
import com.bolsu.BolsuAPI.service.ResumoService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockServletContext;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

import java.time.YearMonth;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ResumoControllerTest {

    private AnnotationConfigWebApplicationContext context;
    private MockMvc mvc;
    private ResumoService service;
    private String bearer;

    @BeforeEach
    void setUp() throws Exception {
        context = new AnnotationConfigWebApplicationContext();
        context.setServletContext(new MockServletContext());
        context.register(TestConfiguration.class);
        context.refresh();
        mvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilters(context.getBean(FilterChainProxy.class)).build();
        when(context.getBean(UsuarioRepository.class).existsById("usuario-1")).thenReturn(true);
        service = context.getBean(ResumoService.class);
        bearer = "Bearer " + JwtUtil.generateToken("usuario-1");
    }

    @AfterEach
    void tearDown() {
        context.close();
    }

    private static ResumoMensalDTO resumo(String mes) {
        return new ResumoMensalDTO(mes, 500, true, 90, 410, null, List.of(), 23, 17.83, null);
    }

    @Test
    void exigeAutenticacao() throws Exception {
        mvc.perform(get("/resumo")).andExpect(status().isUnauthorized());
        verify(service, never()).resumoDoMes(any(), any());
    }

    @Test
    void usaOUsuarioDoTokenEOMesAtualPorPadrao() throws Exception {
        when(service.mesAtual()).thenReturn(YearMonth.of(2026, 11));
        when(service.resumoDoMes("usuario-1", YearMonth.of(2026, 11))).thenReturn(resumo("2026-11"));

        mvc.perform(get("/resumo").header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mes").value("2026-11"))
                .andExpect(jsonPath("$.saldo").value(410.0))
                .andExpect(jsonPath("$.orcamento").doesNotExist());
    }

    @Test
    void ignoraTentativaDeInformarOutroUsuarioPelaUrl() throws Exception {
        when(service.mesAtual()).thenReturn(YearMonth.of(2026, 11));
        when(service.resumoDoMes(eq("usuario-1"), any())).thenReturn(resumo("2026-11"));

        mvc.perform(get("/resumo").param("usuarioId", "usuario-2").header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isOk());
        verify(service).resumoDoMes(eq("usuario-1"), any());
        verify(service, never()).resumoDoMes(eq("usuario-2"), any());
    }

    @Test
    void aceitaMesInformado() throws Exception {
        when(service.resumoDoMes("usuario-1", YearMonth.of(2026, 9))).thenReturn(resumo("2026-09"));

        mvc.perform(get("/resumo").param("mes", "2026-09").header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mes").value("2026-09"));
    }

    @Test
    void recusaMesInvalidoComMensagemUtil() throws Exception {
        mvc.perform(get("/resumo").param("mes", "setembro").header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Informe o mês no formato AAAA-MM"));
        mvc.perform(get("/resumo").param("mes", "2026-13").header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isBadRequest());
        verify(service, never()).resumoDoMes(any(), any());
    }

    @Test
    void bancoIndisponivelRetorna503ComMensagem() throws Exception {
        when(service.mesAtual()).thenReturn(YearMonth.of(2026, 11));
        when(service.resumoDoMes(any(), any()))
                .thenThrow(new org.springframework.dao.DataAccessResourceFailureException("mongo fora"));

        mvc.perform(get("/resumo").header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.message").value("Não foi possível carregar seu resumo. Tente novamente em instantes."));
    }

    @Configuration
    @EnableWebMvc
    @Import({ApplicationConfiguration.class, ResumoController.class})
    static class TestConfiguration {
        @Bean
        ResumoService resumoService() { return mock(ResumoService.class); }

        @Bean
        GastoRepository gastoRepository() { return mock(GastoRepository.class); }

        @Bean
        UsuarioRepository usuarioRepository() { return mock(UsuarioRepository.class); }

        @Bean
        AuthService authService() { return spy(new AuthService()); }
    }
}
