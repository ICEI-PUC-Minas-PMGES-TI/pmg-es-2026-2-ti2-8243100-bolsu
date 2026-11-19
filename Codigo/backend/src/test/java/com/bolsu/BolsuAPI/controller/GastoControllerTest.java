package com.bolsu.BolsuAPI.controller;

import com.bolsu.BolsuAPI.configuration.ApplicationConfiguration;
import com.bolsu.BolsuAPI.dto.ResumoGastosDTO;
import com.bolsu.BolsuAPI.model.Gasto;
import com.bolsu.BolsuAPI.repository.GastoRepository;
import com.bolsu.BolsuAPI.repository.UsuarioRepository;
import com.bolsu.BolsuAPI.security.JwtUtil;
import com.bolsu.BolsuAPI.service.AuthService;
import com.bolsu.BolsuAPI.service.GastoService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockServletContext;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class GastoControllerTest {

    private AnnotationConfigWebApplicationContext context;
    private MockMvc mvc;
    private GastoService service;
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
        service = context.getBean(GastoService.class);
        bearer = "Bearer " + JwtUtil.generateToken("usuario-1");
    }

    @AfterEach
    void tearDown() {
        context.close();
    }

    // ---- autenticação

    @Test
    void todasAsRotasExigemAutenticacao() throws Exception {
        mvc.perform(get("/gastos")).andExpect(status().isUnauthorized());
        mvc.perform(get("/gastos/resumo")).andExpect(status().isUnauthorized());
        mvc.perform(post("/gastos").contentType(MediaType.APPLICATION_JSON)
                .content("{\"categoria\":\"Lazer\",\"valor\":10}")).andExpect(status().isUnauthorized());
        mvc.perform(delete("/gastos/g1")).andExpect(status().isUnauthorized());
        verify(service, never()).getAll(any());
        verify(service, never()).add(any(), any());
        verify(service, never()).delete(any(), any());
    }

    // ---- GET /gastos

    @Test
    void listaOsGastosDoUsuarioDoToken() throws Exception {
        Gasto gasto = new Gasto("Alimentação", 25.5, LocalDate.of(2026, 11, 3), "Almoço");
        gasto.setId("g1");
        when(service.getAll("usuario-1")).thenReturn(List.of(gasto));

        mvc.perform(get("/gastos").header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value("g1"))
                .andExpect(jsonPath("$[0].categoria").value("Alimentação"))
                .andExpect(jsonPath("$[0].valor").value(25.5));
    }

    // ---- GET /gastos/resumo

    @Test
    void resumoUsaMesPorPadrao() throws Exception {
        when(service.resumo("mes", "usuario-1")).thenReturn(new ResumoGastosDTO(0, List.of()));

        mvc.perform(get("/gastos/resumo").header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(0.0));
        verify(service).resumo("mes", "usuario-1");
    }

    @Test
    void resumoRepassaOPeriodoInformado() throws Exception {
        when(service.resumo("semana", "usuario-1")).thenReturn(
                new ResumoGastosDTO(60, List.of(new ResumoGastosDTO.CategoriaTotal("Lazer", 60))));

        mvc.perform(get("/gastos/resumo").param("periodo", "semana").header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(60.0))
                .andExpect(jsonPath("$.categorias[0].nome").value("Lazer"));
    }

    // ---- POST /gastos

    @Test
    void cadastraGastoParaOUsuarioDoToken() throws Exception {
        when(service.add(any(), eq("usuario-1"))).thenAnswer(i -> i.getArgument(0));

        mvc.perform(post("/gastos").header(HttpHeaders.AUTHORIZATION, bearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"categoria\":\"Transporte\",\"valor\":4.5,\"data\":\"2026-11-02\",\"descricao\":\"Ônibus\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categoria").value("Transporte"))
                .andExpect(jsonPath("$.valor").value(4.5));

        ArgumentCaptor<Gasto> enviado = ArgumentCaptor.forClass(Gasto.class);
        verify(service).add(enviado.capture(), eq("usuario-1"));
        assertThat(enviado.getValue().getData()).isEqualTo(LocalDate.of(2026, 11, 2));
        assertThat(enviado.getValue().getDescricao()).isEqualTo("Ônibus");
    }

    @Test
    void usaADataDeHojeQuandoNaoInformada() throws Exception {
        when(service.add(any(), any())).thenAnswer(i -> i.getArgument(0));

        mvc.perform(post("/gastos").header(HttpHeaders.AUTHORIZATION, bearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"categoria\":\"Lazer\",\"valor\":10}"))
                .andExpect(status().isOk());

        ArgumentCaptor<Gasto> enviado = ArgumentCaptor.forClass(Gasto.class);
        verify(service).add(enviado.capture(), eq("usuario-1"));
        assertThat(enviado.getValue().getData()).isNotNull();
    }

    @Test
    void ignoraUsuarioIdEnviadoNoCorpo() throws Exception {
        when(service.add(any(), any())).thenAnswer(i -> i.getArgument(0));

        mvc.perform(post("/gastos").header(HttpHeaders.AUTHORIZATION, bearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"categoria\":\"Lazer\",\"valor\":10,\"usuarioId\":\"usuario-2\"}"))
                .andExpect(status().isOk());

        verify(service).add(any(), eq("usuario-1"));
        verify(service, never()).add(any(), eq("usuario-2"));
    }

    @Test
    void repassaErroDeValidacaoDoServicoComo400() throws Exception {
        when(service.add(any(), any()))
                .thenThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe categoria e valor positivo"));

        mvc.perform(post("/gastos").header(HttpHeaders.AUTHORIZATION, bearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"categoria\":\"\",\"valor\":-1}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void recusaCorpoMalformado() throws Exception {
        mvc.perform(post("/gastos").header(HttpHeaders.AUTHORIZATION, bearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{categoria: "))
                .andExpect(status().isBadRequest());
        verify(service, never()).add(any(), any());
    }

    // ---- DELETE /gastos/{id}

    @Test
    void removeGastoDoUsuarioEResponde204() throws Exception {
        mvc.perform(delete("/gastos/g1").header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isNoContent());
        verify(service).delete("g1", "usuario-1");
    }

    @Test
    void responde404QuandoOGastoNaoExisteOuNaoEDoUsuario() throws Exception {
        doThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Gasto nao encontrado"))
                .when(service).delete("g9", "usuario-1");

        mvc.perform(delete("/gastos/g9").header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isNotFound());
    }

    @Configuration
    @EnableWebMvc
    @Import({ApplicationConfiguration.class, GastoController.class})
    static class TestConfiguration {
        @Bean
        GastoService gastoService() { return mock(GastoService.class); }

        @Bean
        GastoRepository gastoRepository() { return mock(GastoRepository.class); }

        @Bean
        UsuarioRepository usuarioRepository() { return mock(UsuarioRepository.class); }

        @Bean
        AuthService authService() { return spy(new AuthService()); }
    }
}
