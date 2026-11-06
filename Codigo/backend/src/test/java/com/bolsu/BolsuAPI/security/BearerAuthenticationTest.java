package com.bolsu.BolsuAPI.security;

import com.bolsu.BolsuAPI.configuration.ApplicationConfiguration;
import com.bolsu.BolsuAPI.controller.UsuarioController;
import com.bolsu.BolsuAPI.controller.GastoController;
import com.bolsu.BolsuAPI.repository.GastoRepository;
import com.bolsu.BolsuAPI.service.GastoService;
import com.bolsu.BolsuAPI.model.Gasto;
import java.util.List;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import com.bolsu.BolsuAPI.model.Usuario;
import com.bolsu.BolsuAPI.repository.UsuarioRepository;
import com.bolsu.BolsuAPI.service.AuthService;
import com.bolsu.BolsuAPI.service.UsuarioService;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

import java.security.Principal;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class BearerAuthenticationTest {

    private AnnotationConfigWebApplicationContext context;
    private MockMvc mvc;

    @BeforeEach
    void setUp() throws Exception {
        context = new AnnotationConfigWebApplicationContext();
        context.setServletContext(new MockServletContext());
        context.register(TestConfiguration.class);
        context.refresh();
        mvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilters(context.getBean(FilterChainProxy.class)).build();
        when(context.getBean(UsuarioRepository.class).existsById("usuario-1")).thenReturn(true);
        Usuario usuario = new Usuario("Maria Silva", "maria-silva", "maria@email.com",
                "senha-criptografada", "31999999999", null, null);
        usuario.setId("usuario-1");
        when(context.getBean(UsuarioService.class).getById("usuario-1")).thenReturn(usuario);
        when(context.getBean(UsuarioService.class).add(any())).thenReturn(usuario);
    }

    @AfterEach
    void tearDown() {
        context.close();
    }

    @Test
    void deveAutenticarTokenGeradoPelaAplicacaoSemCriarSessao() throws Exception {
        mvc.perform(get("/private").header(HttpHeaders.AUTHORIZATION,
                        "Bearer " + JwtUtil.generateToken("usuario-1")))
                .andExpect(status().isOk())
                .andExpect(content().string("usuario-1"))
                .andExpect(result -> org.assertj.core.api.Assertions.assertThat(
                        result.getRequest().getSession(false)).isNull());
        mvc.perform(get("/private")).andExpect(status().isUnauthorized());
    }

    @Test
    void deveRecusarRequisicaoSemToken() throws Exception {
        mvc.perform(get("/private"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith("application/json"))
                .andExpect(content().json("{\"message\": \"Usuario nao autorizado\"}"))
                .andExpect(header().string(HttpHeaders.WWW_AUTHENTICATE, "Bearer"));
    }

    @Test
    void deveRecusarTokenMalformadoOuVazio() throws Exception {
        for (String authorization : new String[]{"Bearer invalido", "Bearer ", "Basic abc", "Bearer"}) {
            mvc.perform(get("/private").header(HttpHeaders.AUTHORIZATION, authorization))
                    .andExpect(status().isUnauthorized())
                    .andExpect(content().json("{\"message\": \"Usuario nao autorizado\"}"));
        }
    }

    @Test
    void deveRecusarTokenAssinadoComOutraChave() throws Exception {
        String token = Jwts.builder().subject("usuario-1")
                .signWith(Jwts.SIG.HS512.key().build()).compact();
        mvc.perform(get("/private").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deveRecusarTokenExpirado() throws Exception {
        doThrow(new ExpiredJwtException(null, null, "Token expirado"))
                .when(context.getBean(AuthService.class)).extractId("expirado");
        mvc.perform(get("/private").header(HttpHeaders.AUTHORIZATION, "Bearer expirado"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().json("{\"message\": \"Usuario nao autorizado\"}"));
    }

    @Test
    void deveRecusarTokenDeUsuarioInexistente() throws Exception {
        mvc.perform(get("/private").header(HttpHeaders.AUTHORIZATION,
                        "Bearer " + JwtUtil.generateToken("usuario-removido")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deveAceitarNomeDoEsquemaSemDiferenciarMaiusculas() throws Exception {
        mvc.perform(get("/private").header(HttpHeaders.AUTHORIZATION,
                        "bearer " + JwtUtil.generateToken("usuario-1")))
                .andExpect(status().isOk());
    }

    @Test
    void devePreservarRotasPublicas() throws Exception {
        mvc.perform(post("/auth/login")).andExpect(status().isOk());
        mvc.perform(post("/users").contentType("application/json").content("{}"))
                .andExpect(status().isCreated());
        for (String path : new String[]{"/docs/index", "/swagger-ui/index.html", "/v3/api-docs"}) {
            mvc.perform(get(path)).andExpect(status().isOk());
        }
        mvc.perform(get("/users")).andExpect(status().isUnauthorized());
    }

    @Test
    void deveRetornarDadosDoUsuarioDoTokenSemExporSenha() throws Exception {
        mvc.perform(get("/users/current").param("id", "outro-usuario")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + JwtUtil.generateToken("usuario-1")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nomeCompleto").value("Maria Silva"))
                .andExpect(jsonPath("$.email").value("maria@email.com"))
                .andExpect(jsonPath("$.celular").value("31999999999"))
                .andExpect(jsonPath("$.senha").doesNotExist());
        verify(context.getBean(UsuarioService.class)).getById("usuario-1");
    }

    @Test
    void deveProtegerDadosDoUsuarioAtual() throws Exception {
        mvc.perform(get("/users/current"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().json("{\"message\": \"Usuario nao autorizado\"}"));
        mvc.perform(get("/users/current").header(HttpHeaders.AUTHORIZATION, "Bearer invalido"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().json("{\"message\": \"Usuario nao autorizado\"}"));
        verifyNoInteractions(context.getBean(UsuarioService.class));
    }

    @Test
    void devePermitirPreflightDoFrontendComAuthorization() throws Exception {
        mvc.perform(options("/private")
                        .header(HttpHeaders.ORIGIN, "http://localhost:3000")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "Authorization"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:3000"));
    }

    @Test
    void deveNegarLeituraAlteracaoEExclusaoDeOutraConta() throws Exception {
        String token = "Bearer " + JwtUtil.generateToken("usuario-1");
        mvc.perform(get("/users/usuario-2").header(HttpHeaders.AUTHORIZATION, token)).andExpect(status().isForbidden());
        mvc.perform(put("/users/usuario-2").header(HttpHeaders.AUTHORIZATION, token)
                .contentType("application/json").content("{}" )).andExpect(status().isForbidden());
        mvc.perform(delete("/users/usuario-2").header(HttpHeaders.AUTHORIZATION, token)).andExpect(status().isForbidden());
        verifyNoInteractions(context.getBean(UsuarioService.class));
    }

    @Test
    void deveListarSomenteContaAtualSemSenha() throws Exception {
        mvc.perform(get("/users").header(HttpHeaders.AUTHORIZATION, "Bearer " + JwtUtil.generateToken("usuario-1")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value("usuario-1"))
                .andExpect(jsonPath("$[0].senha").doesNotExist());
    }

    @Test
    void deveVincularGastoAoTokenIgnorandoProprietarioEnviado() throws Exception {
        var repository = context.getBean(GastoRepository.class);
        when(repository.save(any(Gasto.class))).thenAnswer(call -> call.getArgument(0));
        mvc.perform(post("/gastos").header(HttpHeaders.AUTHORIZATION, "Bearer " + JwtUtil.generateToken("usuario-1"))
                        .contentType("application/json")
                        .content("{\"categoria\":\"Lanches\",\"valor\":10,\"usuarioId\":\"usuario-2\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.usuarioId").value("usuario-1"));
    }

    @Test
    void deveConsultarEExcluirGastosApenasDentroDaConta() throws Exception {
        var repository = context.getBean(GastoRepository.class);
        String token = "Bearer " + JwtUtil.generateToken("usuario-1");
        when(repository.findByUsuarioId("usuario-1")).thenReturn(List.of());
        when(repository.findByUsuarioIdAndDataGreaterThanEqualAndDataLessThanEqual(eq("usuario-1"), any(), any())).thenReturn(List.of());
        mvc.perform(get("/gastos").param("usuarioId", "usuario-2").header(HttpHeaders.AUTHORIZATION, token)).andExpect(status().isOk());
        mvc.perform(get("/gastos/resumo").header(HttpHeaders.AUTHORIZATION, token)).andExpect(status().isOk()).andExpect(jsonPath("$.total").value(0));
        mvc.perform(delete("/gastos/gasto-de-outra-conta").header(HttpHeaders.AUTHORIZATION, token)).andExpect(status().isNotFound());
        verify(repository).findByUsuarioId("usuario-1");
        verify(repository).findByUsuarioIdAndDataGreaterThanEqualAndDataLessThanEqual(eq("usuario-1"), any(), any());
        verify(repository).deleteByIdAndUsuarioId("gasto-de-outra-conta", "usuario-1");
        verify(repository, never()).deleteById(any());
    }

    @Test
    void deveRecusarGastoInvalidoESemAutenticacao() throws Exception {
        mvc.perform(get("/gastos")).andExpect(status().isUnauthorized());
        mvc.perform(post("/gastos").header(HttpHeaders.AUTHORIZATION, "Bearer " + JwtUtil.generateToken("usuario-1"))
                .contentType("application/json").content("{\"categoria\":\"Lanches\",\"valor\":-10}"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(context.getBean(GastoRepository.class));
    }

    @Configuration
    @EnableWebMvc
    @Import({ApplicationConfiguration.class, UsuarioController.class, GastoController.class, GastoService.class})
    static class TestConfiguration {
        @Bean
        GastoRepository gastoRepository() { return mock(GastoRepository.class); }
        @Bean
        UsuarioService usuarioService() {
            return mock(UsuarioService.class);
        }

        @Bean
        UsuarioRepository usuarioRepository() {
            return mock(UsuarioRepository.class);
        }

        @Bean
        AuthService authService() {
            return spy(new AuthService());
        }

        @Bean
        TestController testController() {
            return new TestController();
        }
    }

    @RestController
    static class TestController {
        @GetMapping("/private")
        String privateEndpoint(Principal principal) {
            return principal.getName();
        }

        @PostMapping("/auth/login")
        String publicPost() {
            return "ok";
        }

        @GetMapping({"/docs/index", "/swagger-ui/index.html", "/v3/api-docs"})
        String getEndpoint() {
            return "ok";
        }
    }
}
