package com.bolsu.BolsuAPI.service;

import com.bolsu.BolsuAPI.dto.UsuarioRequestDTO;
import com.bolsu.BolsuAPI.model.Usuario;
import com.bolsu.BolsuAPI.repository.DadosAcademicosRepository;
import com.bolsu.BolsuAPI.repository.DadosFinanceirosRepository;
import com.bolsu.BolsuAPI.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class UsuarioServiceTest {

    private UsuarioRepository usuarioRepository;
    private UsuarioService usuarioService;

    @BeforeEach
    void setUp() {
        usuarioRepository = mock(UsuarioRepository.class);
        DadosAcademicosRepository dadosAcademicosRepository = mock(DadosAcademicosRepository.class);
        DadosFinanceirosRepository dadosFinanceirosRepository = mock(DadosFinanceirosRepository.class);

        usuarioService = new UsuarioService(
                usuarioRepository,
                dadosAcademicosRepository,
                dadosFinanceirosRepository
        );
        ReflectionTestUtils.setField(usuarioService, "passwordEncoder", new BCryptPasswordEncoder());

        when(usuarioRepository.save(any(Usuario.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void deveGerarSlugComIniciaisEIgnorarParticulasDoNome() {
        Usuario usuario = adicionarUsuario("Emanuel Phillipe Ribeiro Ferreira de Carvalho");

        assertThat(usuario.getSlug()).isEqualTo("emanuel-prf-carvalho");
    }

    @Test
    void deveGerarSlugComInicialDoNomeIntermediario() {
        Usuario usuario = adicionarUsuario("Maria Fernanda Melo");

        assertThat(usuario.getSlug()).isEqualTo("maria-f-melo");
    }

    @Test
    void deveRemoverAcentosEAdicionarSufixoQuandoSlugJaExiste() {
        when(usuarioRepository.existsBySlug("nubia-torres")).thenReturn(true);
        when(usuarioRepository.existsBySlug("nubia-torres-1")).thenReturn(false);

        Usuario usuario = adicionarUsuario("Núbia Torres");

        assertThat(usuario.getSlug()).isEqualTo("nubia-torres-1");
    }

    @Test
    void devePreservarSlugAoAtualizarUsuarioSemAlterarONome() throws Exception {
        Usuario usuarioExistente = new Usuario(
                "Núbia Torres",
                "nubia-torres-1",
                "nubia@email.com",
                "senha",
                null,
                null,
                null
        );
        usuarioExistente.setId("usuario-1");
        when(usuarioRepository.findById("usuario-1")).thenReturn(Optional.of(usuarioExistente));

        Usuario usuarioAtualizado = usuarioService.update(
                "usuario-1",
                new UsuarioRequestDTO("Núbia Torres", "novo@email.com", null, null, null, null)
        );

        assertThat(usuarioAtualizado.getSlug()).isEqualTo("nubia-torres-1");
    }

    private Usuario adicionarUsuario(String nomeCompleto) {
        UsuarioRequestDTO usuarioRequestDTO = new UsuarioRequestDTO(
                nomeCompleto,
                nomeCompleto.replace(" ", ".").toLowerCase() + "@email.com",
                "senha",
                null,
                null,
                null
        );

        return usuarioService.add(usuarioRequestDTO);
    }
}
