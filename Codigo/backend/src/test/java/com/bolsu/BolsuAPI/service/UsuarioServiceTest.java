package com.bolsu.BolsuAPI.service;

import com.bolsu.BolsuAPI.dto.UsuarioRequestDTO;
import com.bolsu.BolsuAPI.model.Usuario;
import com.bolsu.BolsuAPI.model.DadosAcademicos;
import com.bolsu.BolsuAPI.model.DadosFinanceiros;
import java.util.List;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verifyNoInteractions;
import org.springframework.web.server.ResponseStatusException;
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
    private DadosAcademicosRepository academicos;
    private DadosFinanceirosRepository financeiros;

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
        academicos = dadosAcademicosRepository;
        financeiros = dadosFinanceirosRepository;
        when(academicos.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(financeiros.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
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
                "Senha1234",
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

    @Test
    void deveSalvarPerfilAcademicoComSemestreESenhaCriptografada() {
        DadosAcademicos dados = new DadosAcademicos("PUC", "Coração Eucarístico", "Engenharia");
        dados.setSemestre(5);
        dados.setId("id-forjado");
        Usuario usuario = usuarioService.add(new UsuarioRequestDTO("Maria Silva", " MARIA@email.com ",
                "Senha1234", "31999999999", dados, null));
        assertThat(usuario.getEmail()).isEqualTo("maria@email.com");
        assertThat(usuario.getDadosAcademicos().getSemestre()).isEqualTo(5);
        assertThat(usuario.getDadosAcademicos().getId()).isNull();
        assertThat(usuario.getCelular()).isEqualTo("31999999999");
        assertThat(usuarioService.validarSenha("Senha1234", usuario.getSenha())).isTrue();
    }

    @Test
    void deveRejeitarSenhaFracaAntesDeSalvar() {
        assertThatThrownBy(() -> usuarioService.add(new UsuarioRequestDTO("Maria", "maria@email.com",
                "fraca", null, null, null))).isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(usuarioRepository, academicos, financeiros);
    }

    @Test
    void deveRejeitarSemestreInvalidoAntesDeSalvar() {
        DadosAcademicos dados = new DadosAcademicos();
        dados.setSemestre(0);
        assertThatThrownBy(() -> usuarioService.add(new UsuarioRequestDTO("Maria", "maria@email.com",
                "Senha1234", null, dados, null))).isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(usuarioRepository, academicos, financeiros);
    }

    @Test
    void deveSalvarConfiguracaoSemAlterarCredenciaisEReutilizarReferencia() throws Exception {
        Usuario usuario = adicionarUsuario("Maria Silva");
        String senha = usuario.getSenha();
        DadosFinanceiros anterior = new DadosFinanceiros(100, List.of("Mesada"), List.of("Viajar"));
        anterior.setId("financeiro-original");
        usuario.setDadosFinanceiros(anterior);
        when(usuarioRepository.findById("usuario-1")).thenReturn(Optional.of(usuario));
        DadosFinanceiros dados = new DadosFinanceiros(650.50, List.of("Estágio", "Bolsa"), List.of("Investir", "Viajar"));
        dados.setId("id-de-outro-usuario");
        Usuario atualizado = usuarioService.configurarFinancas("usuario-1", dados);
        assertThat(atualizado.getSenha()).isEqualTo(senha);
        assertThat(atualizado.getDadosFinanceiros().getId()).isEqualTo("financeiro-original");
        assertThat(atualizado.getDadosFinanceiros().getFaixaRendaMensal()).isEqualTo(650.50);
        assertThat(atualizado.getDadosFinanceiros().getFontesRenda()).containsExactly("Estágio", "Bolsa");
        assertThat(atualizado.getDadosFinanceiros().getObjetivos()).containsExactly("Investir", "Viajar");
    }

    @Test
    void deveAceitarRendaZeroSemFontesERejeitarValoresInvalidos() throws Exception {
        Usuario usuario = adicionarUsuario("Maria Silva");
        when(usuarioRepository.findById("usuario-1")).thenReturn(Optional.of(usuario));
        usuarioService.configurarFinancas("usuario-1", new DadosFinanceiros(0, List.of(), List.of("Viajar")));
        for (double renda : new double[] { -1, Double.NaN, Double.POSITIVE_INFINITY }) {
            assertThatThrownBy(() -> usuarioService.configurarFinancas("usuario-1",
                    new DadosFinanceiros(renda, List.of(), List.of("Viajar"))))
                    .isInstanceOf(ResponseStatusException.class);
        }
        assertThatThrownBy(() -> usuarioService.configurarFinancas("usuario-1",
                new DadosFinanceiros(0, List.of(), List.of())))
                .isInstanceOf(ResponseStatusException.class);
    }

    private Usuario adicionarUsuario(String nomeCompleto) {
        UsuarioRequestDTO usuarioRequestDTO = new UsuarioRequestDTO(
                nomeCompleto,
                nomeCompleto.replace(" ", ".").toLowerCase() + "@email.com",
                "Senha1234",
                null,
                null,
                null
        );

        return usuarioService.add(usuarioRequestDTO);
    }
}
