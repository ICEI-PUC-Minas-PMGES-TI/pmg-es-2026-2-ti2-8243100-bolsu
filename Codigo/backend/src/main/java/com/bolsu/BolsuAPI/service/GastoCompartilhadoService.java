package com.bolsu.BolsuAPI.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.bolsu.BolsuAPI.dto.AtualizarPagamentoRequest;
import com.bolsu.BolsuAPI.dto.CriarGastoCompartilhadoRequest;
import com.bolsu.BolsuAPI.dto.GastoCompartilhadoResponse;
import com.bolsu.BolsuAPI.dto.PainelGastosCompartilhadosResponse;
import com.bolsu.BolsuAPI.dto.ParticipanteGastoCompartilhadoResponse;
import com.bolsu.BolsuAPI.dto.UsuarioPesquisaResponse;
import com.bolsu.BolsuAPI.model.GastoCompartilhado;
import com.bolsu.BolsuAPI.model.ParticipacaoGasto;
import com.bolsu.BolsuAPI.model.StatusGastoCompartilhado;
import com.bolsu.BolsuAPI.model.StatusParticipacaoGasto;
import com.bolsu.BolsuAPI.model.Usuario;
import com.bolsu.BolsuAPI.repository.GastoCompartilhadoRepository;
import com.bolsu.BolsuAPI.repository.UsuarioRepository;

/** Regras de convite, divisão, quitação individual e encerramento de gastos. */
@Service
public class GastoCompartilhadoService {

    private static final BigDecimal VALOR_MAXIMO = new BigDecimal("99999999.99");

    private final GastoCompartilhadoRepository gastoRepository;
    private final UsuarioRepository usuarioRepository;
    private final Clock clock;

    public GastoCompartilhadoService(GastoCompartilhadoRepository gastoRepository,
                                     UsuarioRepository usuarioRepository,
                                     Clock clock) {
        this.gastoRepository = gastoRepository;
        this.usuarioRepository = usuarioRepository;
        this.clock = clock;
    }

    public GastoCompartilhadoResponse criar(String usuarioId, CriarGastoCompartilhadoRequest request) {
        validarCriacao(request);

        Set<String> convidados = normalizarConvidados(request.participantesIds(), usuarioId);
        if (convidados.isEmpty()) {
            throw erro(HttpStatus.BAD_REQUEST, "Adicione ao menos um participante ao gasto compartilhado.");
        }
        validarUsuariosExistentes(convidados);

        GastoCompartilhado gasto = new GastoCompartilhado();
        gasto.setCriadorId(usuarioId);
        gasto.setNome(request.nome().trim());
        gasto.setDescricao(textoOpcional(request.descricao()));
        gasto.setValorTotal(request.valorTotal().setScale(2, RoundingMode.HALF_UP));
        gasto.setStatus(StatusGastoCompartilhado.ATIVO);
        gasto.setCriadoEm(LocalDateTime.now(clock));

        List<ParticipacaoGasto> participacoes = new ArrayList<>();
        participacoes.add(new ParticipacaoGasto(usuarioId, StatusParticipacaoGasto.ACEITO));
        convidados.forEach(id -> participacoes.add(new ParticipacaoGasto(id, StatusParticipacaoGasto.PENDENTE)));
        gasto.setParticipacoes(participacoes);

        GastoCompartilhado salvo = gastoRepository.save(gasto);
        return montarResposta(salvo, usuarioId, nomesDosParticipantes(salvo));
    }

    /** Retorna as três listas que a tela precisa sem expor gastos recusados. */
    public PainelGastosCompartilhadosResponse listarPainel(String usuarioId) {
        List<GastoCompartilhado> gastos = gastoRepository.findByParticipanteId(usuarioId);
        gastos.sort(Comparator.comparing(GastoCompartilhado::getCriadoEm,
                Comparator.nullsLast(Comparator.reverseOrder())));

        Map<String, String> nomes = nomesDosParticipantes(gastos);
        List<GastoCompartilhadoResponse> ativos = new ArrayList<>();
        List<GastoCompartilhadoResponse> convites = new ArrayList<>();
        List<GastoCompartilhadoResponse> historico = new ArrayList<>();

        for (GastoCompartilhado gasto : gastos) {
            ParticipacaoGasto minhaParticipacao = participacaoDe(gasto, usuarioId);
            if (minhaParticipacao == null || minhaParticipacao.getStatus() == StatusParticipacaoGasto.RECUSADO) {
                continue;
            }
            GastoCompartilhadoResponse resposta = montarResposta(gasto, usuarioId, nomes);
            if (minhaParticipacao.getStatus() == StatusParticipacaoGasto.PENDENTE) {
                convites.add(resposta);
            } else if (gasto.getStatus() == StatusGastoCompartilhado.ENCERRADO) {
                historico.add(resposta);
            } else {
                ativos.add(resposta);
            }
        }
        return new PainelGastosCompartilhadosResponse(ativos, convites, historico);
    }

    public GastoCompartilhadoResponse buscar(String gastoId, String usuarioId) {
        GastoCompartilhado gasto = obter(gastoId);
        garantirParticipanteVisivel(gasto, usuarioId);
        return montarResposta(gasto, usuarioId, nomesDosParticipantes(gasto));
    }

    public GastoCompartilhadoResponse aceitarConvite(String gastoId, String usuarioId) {
        GastoCompartilhado gasto = obterAtivo(gastoId);
        ParticipacaoGasto participacao = exigirConvitePendente(gasto, usuarioId);
        participacao.setStatus(StatusParticipacaoGasto.ACEITO);
        GastoCompartilhado salvo = gastoRepository.save(gasto);
        return montarResposta(salvo, usuarioId, nomesDosParticipantes(salvo));
    }

    public void recusarConvite(String gastoId, String usuarioId) {
        GastoCompartilhado gasto = obterAtivo(gastoId);
        ParticipacaoGasto participacao = exigirConvitePendente(gasto, usuarioId);
        participacao.setStatus(StatusParticipacaoGasto.RECUSADO);
        participacao.setPago(false);
        // A recusa muda o valor de cada cota. Confirmações anteriores não podem
        // continuar válidas para um valor diferente, então todos reconfirmam.
        participantesAtuais(gasto).forEach(participante -> participante.setPago(false));
        gastoRepository.save(gasto);
    }

    public GastoCompartilhadoResponse atualizarMeuPagamento(String gastoId, String usuarioId,
                                                              AtualizarPagamentoRequest request) {
        if (request == null || request.pago() == null) {
            throw erro(HttpStatus.BAD_REQUEST, "Informe se a sua cota está paga.");
        }
        GastoCompartilhado gasto = obterAtivo(gastoId);
        ParticipacaoGasto participacao = exigirParticipacaoAceita(gasto, usuarioId);
        participacao.setPago(request.pago());
        GastoCompartilhado salvo = gastoRepository.save(gasto);
        return montarResposta(salvo, usuarioId, nomesDosParticipantes(salvo));
    }

    public GastoCompartilhadoResponse encerrar(String gastoId, String usuarioId) {
        GastoCompartilhado gasto = obterAtivo(gastoId);
        if (!usuarioId.equals(gasto.getCriadorId())) {
            throw erro(HttpStatus.FORBIDDEN, "Apenas quem criou o gasto pode encerrá-lo.");
        }
        if (!podeEncerrar(gasto)) {
            throw erro(HttpStatus.CONFLICT,
                    "O gasto só pode ser encerrado depois que todos aceitarem o convite e marcarem suas cotas como pagas.");
        }
        gasto.setStatus(StatusGastoCompartilhado.ENCERRADO);
        gasto.setEncerradoEm(LocalDateTime.now(clock));
        GastoCompartilhado salvo = gastoRepository.save(gasto);
        return montarResposta(salvo, usuarioId, nomesDosParticipantes(salvo));
    }

    public List<UsuarioPesquisaResponse> buscarUsuarios(String busca, String usuarioAtualId) {
        String termo = busca == null ? "" : busca.trim();
        if (termo.startsWith("@")) {
            termo = termo.substring(1).trim();
        }
        if (termo.length() < 2) {
            return List.of();
        }
        return usuarioRepository.buscarParaCompartilhamento(Pattern.quote(termo), usuarioAtualId).stream()
                .sorted(Comparator.comparing(Usuario::getNome_completo, String.CASE_INSENSITIVE_ORDER))
                .limit(10)
                .map(usuario -> new UsuarioPesquisaResponse(usuario.getId(), usuario.getNome_completo(), usuario.getSlug()))
                .toList();
    }

    private void validarCriacao(CriarGastoCompartilhadoRequest request) {
        if (request == null) {
            throw erro(HttpStatus.BAD_REQUEST, "Informe os dados do gasto compartilhado.");
        }
        if (request.nome() == null || request.nome().isBlank()) {
            throw erro(HttpStatus.BAD_REQUEST, "Informe o nome do gasto.");
        }
        if (request.nome().trim().length() > 120) {
            throw erro(HttpStatus.BAD_REQUEST, "O nome do gasto deve ter no máximo 120 caracteres.");
        }
        if (request.descricao() != null && request.descricao().trim().length() > 500) {
            throw erro(HttpStatus.BAD_REQUEST, "A descrição deve ter no máximo 500 caracteres.");
        }
        if (request.valorTotal() == null || request.valorTotal().compareTo(BigDecimal.ZERO) <= 0
                || request.valorTotal().compareTo(VALOR_MAXIMO) > 0) {
            throw erro(HttpStatus.BAD_REQUEST, "Informe um valor total maior que zero e dentro do limite permitido.");
        }
        if (request.participantesIds() == null) {
            throw erro(HttpStatus.BAD_REQUEST, "Adicione ao menos um participante ao gasto compartilhado.");
        }
    }

    private Set<String> normalizarConvidados(Collection<String> ids, String criadorId) {
        Set<String> convidados = new LinkedHashSet<>();
        for (String id : ids) {
            if (id != null && !id.isBlank() && !criadorId.equals(id.trim())) {
                convidados.add(id.trim());
            }
        }
        return convidados;
    }

    private void validarUsuariosExistentes(Collection<String> ids) {
        Set<String> encontrados = new LinkedHashSet<>();
        usuarioRepository.findAllById(ids).forEach(usuario -> encontrados.add(usuario.getId()));
        List<String> inexistentes = ids.stream().filter(id -> !encontrados.contains(id)).toList();
        if (!inexistentes.isEmpty()) {
            throw erro(HttpStatus.BAD_REQUEST, "Há participantes que não estão mais cadastrados.");
        }
    }

    private GastoCompartilhado obter(String gastoId) {
        return gastoRepository.findById(gastoId)
                .orElseThrow(() -> erro(HttpStatus.NOT_FOUND, "Gasto compartilhado não encontrado."));
    }

    private GastoCompartilhado obterAtivo(String gastoId) {
        GastoCompartilhado gasto = obter(gastoId);
        if (gasto.getStatus() != StatusGastoCompartilhado.ATIVO) {
            throw erro(HttpStatus.CONFLICT, "Este gasto já foi encerrado.");
        }
        return gasto;
    }

    private ParticipacaoGasto exigirConvitePendente(GastoCompartilhado gasto, String usuarioId) {
        ParticipacaoGasto participacao = participacaoDe(gasto, usuarioId);
        if (participacao == null) {
            throw erro(HttpStatus.FORBIDDEN, "Você não foi convidado para este gasto.");
        }
        if (participacao.getStatus() != StatusParticipacaoGasto.PENDENTE) {
            throw erro(HttpStatus.CONFLICT, "Este convite já foi respondido.");
        }
        return participacao;
    }

    private ParticipacaoGasto exigirParticipacaoAceita(GastoCompartilhado gasto, String usuarioId) {
        ParticipacaoGasto participacao = participacaoDe(gasto, usuarioId);
        if (participacao == null || participacao.getStatus() == StatusParticipacaoGasto.RECUSADO) {
            throw erro(HttpStatus.FORBIDDEN, "Você não participa deste gasto.");
        }
        if (participacao.getStatus() != StatusParticipacaoGasto.ACEITO) {
            throw erro(HttpStatus.CONFLICT, "Aceite o convite antes de atualizar o pagamento.");
        }
        return participacao;
    }

    private void garantirParticipanteVisivel(GastoCompartilhado gasto, String usuarioId) {
        ParticipacaoGasto participacao = participacaoDe(gasto, usuarioId);
        if (participacao == null || participacao.getStatus() == StatusParticipacaoGasto.RECUSADO) {
            throw erro(HttpStatus.NOT_FOUND, "Gasto compartilhado não encontrado.");
        }
    }

    private ParticipacaoGasto participacaoDe(GastoCompartilhado gasto, String usuarioId) {
        return gasto.getParticipacoes().stream()
                .filter(participacao -> usuarioId.equals(participacao.getUsuarioId()))
                .findFirst()
                .orElse(null);
    }

    private Map<String, String> nomesDosParticipantes(GastoCompartilhado gasto) {
        return nomesDosParticipantes(List.of(gasto));
    }

    private Map<String, String> nomesDosParticipantes(Collection<GastoCompartilhado> gastos) {
        Set<String> ids = new LinkedHashSet<>();
        for (GastoCompartilhado gasto : gastos) {
            for (ParticipacaoGasto participacao : gasto.getParticipacoes()) {
                ids.add(participacao.getUsuarioId());
            }
        }
        Map<String, String> nomes = new HashMap<>();
        usuarioRepository.findAllById(ids).forEach(usuario -> nomes.put(usuario.getId(), usuario.getNome_completo()));
        return nomes;
    }

    private GastoCompartilhadoResponse montarResposta(GastoCompartilhado gasto, String usuarioId,
                                                       Map<String, String> nomes) {
        ParticipacaoGasto minhaParticipacao = participacaoDe(gasto, usuarioId);
        List<ParticipacaoGasto> participantesAtuais = participantesAtuais(gasto);
        BigDecimal valorPorParticipante = gasto.getValorTotal()
                .divide(BigDecimal.valueOf(participantesAtuais.size()), 2, RoundingMode.HALF_UP);
        int pendentes = (int) participantesAtuais.stream()
                .filter(participacao -> participacao.getStatus() == StatusParticipacaoGasto.PENDENTE)
                .count();
        List<ParticipanteGastoCompartilhadoResponse> participantes = participantesAtuais.stream()
                .map(participacao -> new ParticipanteGastoCompartilhadoResponse(
                        participacao.getUsuarioId(),
                        nomes.getOrDefault(participacao.getUsuarioId(), "Usuário"),
                        participacao.getStatus(),
                        participacao.isPago()))
                .toList();
        boolean ehCriador = usuarioId.equals(gasto.getCriadorId());
        boolean podeMarcarPagamento = gasto.getStatus() == StatusGastoCompartilhado.ATIVO
                && minhaParticipacao != null
                && minhaParticipacao.getStatus() == StatusParticipacaoGasto.ACEITO;
        return new GastoCompartilhadoResponse(
                gasto.getId(),
                gasto.getNome(),
                gasto.getDescricao(),
                gasto.getValorTotal(),
                valorPorParticipante,
                gasto.getCriadorId(),
                nomes.getOrDefault(gasto.getCriadorId(), "Usuário"),
                gasto.getStatus(),
                minhaParticipacao == null ? null : minhaParticipacao.getStatus(),
                minhaParticipacao != null && minhaParticipacao.isPago(),
                ehCriador,
                podeMarcarPagamento,
                ehCriador && gasto.getStatus() == StatusGastoCompartilhado.ATIVO && podeEncerrar(gasto),
                pendentes,
                gasto.getCriadoEm(),
                gasto.getEncerradoEm(),
                participantes);
    }

    /** Pendente conta na divisão até recusar; ao recusar ele sai e a cota é recalculada. */
    private List<ParticipacaoGasto> participantesAtuais(GastoCompartilhado gasto) {
        List<ParticipacaoGasto> atuais = gasto.getParticipacoes().stream()
                .filter(participacao -> participacao.getStatus() != StatusParticipacaoGasto.RECUSADO)
                .toList();
        if (atuais.isEmpty()) {
            throw erro(HttpStatus.CONFLICT, "O gasto não possui participantes ativos.");
        }
        return atuais;
    }

    private boolean podeEncerrar(GastoCompartilhado gasto) {
        List<ParticipacaoGasto> atuais = participantesAtuais(gasto);
        return atuais.stream().allMatch(participacao -> participacao.getStatus() == StatusParticipacaoGasto.ACEITO
                && participacao.isPago());
    }

    private static String textoOpcional(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return valor.trim();
    }

    private static ResponseStatusException erro(HttpStatus status, String mensagem) {
        return new ResponseStatusException(status, mensagem);
    }
}
