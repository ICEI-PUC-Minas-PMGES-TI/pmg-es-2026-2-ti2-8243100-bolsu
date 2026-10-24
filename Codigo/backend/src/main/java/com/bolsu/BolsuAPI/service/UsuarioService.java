package com.bolsu.BolsuAPI.service;

import com.bolsu.BolsuAPI.dto.UsuarioDTO;
import com.bolsu.BolsuAPI.model.DadosAcademicos;
import com.bolsu.BolsuAPI.model.DadosFinanceiros;
import com.bolsu.BolsuAPI.model.Usuario;
import com.bolsu.BolsuAPI.repository.DadosAcademicosRepository;
import com.bolsu.BolsuAPI.repository.DadosFinanceirosRepository;
import com.bolsu.BolsuAPI.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class UsuarioService {

    private static final Set<String> PARTICULAS_NOME = Set.of(
            "da", "das", "de", "do", "dos", "e"
    );

    private final UsuarioRepository usuarioRepository;
    private final DadosAcademicosRepository dadosAcademicosRepository;
    private final DadosFinanceirosRepository dadosFinanceirosRepository;

    public UsuarioService(
            UsuarioRepository usuarioRepository,
            DadosAcademicosRepository dadosAcademicosRepository,
            DadosFinanceirosRepository dadosFinanceirosRepository
    ) {
        this.usuarioRepository = usuarioRepository;
        this.dadosAcademicosRepository = dadosAcademicosRepository;
        this.dadosFinanceirosRepository = dadosFinanceirosRepository;
    }

    public List<Usuario> getAll() {
        return usuarioRepository.findAll();
    }

    public Usuario getById(String id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado"));
    }

    public Usuario add(UsuarioDTO usuarioDTO) {
        validarCamposObrigatorios(usuarioDTO, true);
        validarEmailUnico(usuarioDTO.email(), null);

        String nomeCompleto = usuarioDTO.nomeCompleto().trim();

        Usuario usuario = new Usuario(
                nomeCompleto,
                gerarSlugUnica(nomeCompleto, null),
                usuarioDTO.email().trim().toLowerCase(),
                usuarioDTO.senha(),
                normalizarOpcional(usuarioDTO.celular()),
                salvarDadosAcademicos(usuarioDTO.dadosAcademicos(), null),
                salvarDadosFinanceiros(usuarioDTO.dadosFinanceiros(), null)
        );

        return usuarioRepository.save(usuario);
    }

    public Usuario update(String id, UsuarioDTO usuarioDTO) {
        Usuario usuario = getById(id);
        validarCamposObrigatorios(usuarioDTO, false);
        validarEmailUnico(usuarioDTO.email(), usuario);

        DadosAcademicos dadosAcademicosAnteriores = usuario.getDadosAcademicos();
        DadosFinanceiros dadosFinanceirosAnteriores = usuario.getDadosFinanceiros();
        String nomeCompleto = usuarioDTO.nomeCompleto().trim();

        if (!nomeCompleto.equals(usuario.getNome_completo())) {
            usuario.setSlug(gerarSlugUnica(nomeCompleto, usuario.getSlug()));
        }

        usuario.setNome_completo(nomeCompleto);
        usuario.setEmail(usuarioDTO.email().trim().toLowerCase());
        usuario.setCelular(normalizarOpcional(usuarioDTO.celular()));

        if (temTexto(usuarioDTO.senha())) {
            usuario.setSenha(usuarioDTO.senha());
        }

        usuario.setDadosAcademicos(salvarDadosAcademicos(usuarioDTO.dadosAcademicos(), dadosAcademicosAnteriores));
        usuario.setDadosFinanceiros(salvarDadosFinanceiros(usuarioDTO.dadosFinanceiros(), dadosFinanceirosAnteriores));

        removerDadosAcademicosDesvinculados(dadosAcademicosAnteriores, usuario.getDadosAcademicos());
        removerDadosFinanceirosDesvinculados(dadosFinanceirosAnteriores, usuario.getDadosFinanceiros());

        return usuarioRepository.save(usuario);
    }

    public void delete(String id) {
        Usuario usuario = getById(id);
        usuarioRepository.delete(usuario);

        if (usuario.getDadosAcademicos() != null && usuario.getDadosAcademicos().getId() != null) {
            dadosAcademicosRepository.deleteById(usuario.getDadosAcademicos().getId());
        }
        if (usuario.getDadosFinanceiros() != null && usuario.getDadosFinanceiros().getId() != null) {
            dadosFinanceirosRepository.deleteById(usuario.getDadosFinanceiros().getId());
        }
    }

    private DadosAcademicos salvarDadosAcademicos(DadosAcademicos dados, DadosAcademicos dadosAtuais) {
        if (dados == null) {
            return null;
        }
        dados.setId(dadosAtuais == null ? null : dadosAtuais.getId());
        return dadosAcademicosRepository.save(dados);
    }

    private DadosFinanceiros salvarDadosFinanceiros(DadosFinanceiros dados, DadosFinanceiros dadosAtuais) {
        if (dados == null) {
            return null;
        }
        dados.setId(dadosAtuais == null ? null : dadosAtuais.getId());
        return dadosFinanceirosRepository.save(dados);
    }

    private void removerDadosAcademicosDesvinculados(DadosAcademicos anterior, DadosAcademicos atual) {
        if (anterior != null && anterior.getId() != null && atual == null) {
            dadosAcademicosRepository.deleteById(anterior.getId());
        }
    }

    private void removerDadosFinanceirosDesvinculados(DadosFinanceiros anterior, DadosFinanceiros atual) {
        if (anterior != null && anterior.getId() != null && atual == null) {
            dadosFinanceirosRepository.deleteById(anterior.getId());
        }
    }

    private void validarCamposObrigatorios(UsuarioDTO usuarioDTO, boolean senhaObrigatoria) {
        if (usuarioDTO == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Os dados do usuário são obrigatórios");
        }
        if (!temTexto(usuarioDTO.nomeCompleto())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O nome completo é obrigatório");
        }
        if (!temTexto(usuarioDTO.email())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O e-mail é obrigatório");
        }
        if (senhaObrigatoria && !temTexto(usuarioDTO.senha())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A senha é obrigatória");
        }
    }

    private void validarEmailUnico(String email, Usuario usuarioAtual) {
        String emailNormalizado = email.trim().toLowerCase();

        boolean emailAlterado = usuarioAtual == null || !emailNormalizado.equalsIgnoreCase(usuarioAtual.getEmail());
        if (emailAlterado && usuarioRepository.existsByEmailIgnoreCase(emailNormalizado)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe um usuário com este e-mail");
        }
    }

    private String gerarSlugUnica(String nomeCompleto, String slugAtual) {
        String slugBase = gerarSlugBase(nomeCompleto);

        if (slugBase.equals(slugAtual) || !usuarioRepository.existsBySlug(slugBase)) {
            return slugBase;
        }

        int sufixo = 1;
        String slugCandidata;
        do {
            slugCandidata = slugBase + "-" + sufixo;
            if (slugCandidata.equals(slugAtual)) {
                return slugCandidata;
            }
            sufixo++;
        } while (usuarioRepository.existsBySlug(slugCandidata));

        return slugCandidata;
    }

    private String gerarSlugBase(String nomeCompleto) {
        String[] partesDoNome = nomeCompleto.trim().split("\\s+");
        List<String> nomes = new ArrayList<>();

        for (String parte : partesDoNome) {
            String parteNormalizada = normalizarParaSlug(parte);
            if (!parteNormalizada.isBlank() && !PARTICULAS_NOME.contains(parteNormalizada)) {
                nomes.add(parteNormalizada);
            }
        }

        if (nomes.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Não foi possível gerar a slug a partir do nome");
        }
        if (nomes.size() == 1) {
            return nomes.getFirst();
        }
        if (nomes.size() == 2) {
            return nomes.getFirst() + "-" + nomes.getLast();
        }

        StringBuilder iniciais = new StringBuilder();
        for (int i = 1; i < nomes.size() - 1; i++) {
            iniciais.append(nomes.get(i).charAt(0));
        }

        return nomes.getFirst() + "-" + iniciais + "-" + nomes.getLast();
    }

    private String normalizarParaSlug(String valor) {
        return Normalizer.normalize(valor, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]", "");
    }

    private boolean temTexto(String valor) {
        return valor != null && !valor.isBlank();
    }

    private String normalizarOpcional(String valor) {
        return temTexto(valor) ? valor.trim() : null;
    }
}
