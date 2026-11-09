package com.bolsu.BolsuAPI.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.bolsu.BolsuAPI.dto.CriarGrupoRequest;
import com.bolsu.BolsuAPI.dto.GrupoResponse;
import com.bolsu.BolsuAPI.dto.IntegranteResponse;
import com.bolsu.BolsuAPI.dto.UltimaDivisaoResponse;
import com.bolsu.BolsuAPI.model.DespesaCompartilhada;
import com.bolsu.BolsuAPI.model.GrupoCompartilhado;
import com.bolsu.BolsuAPI.repository.DespesaCompartilhadaRepository;
import com.bolsu.BolsuAPI.repository.GrupoCompartilhadoRepository;

@Service
public class GastosCompartilhadosService {

    private final GrupoCompartilhadoRepository grupoRepository;
    private final DespesaCompartilhadaRepository despesaRepository;
    private final UsuarioReferenciaService usuarioReferenciaService;

    public GastosCompartilhadosService(GrupoCompartilhadoRepository grupoRepository,
                                       DespesaCompartilhadaRepository despesaRepository,
                                       UsuarioReferenciaService usuarioReferenciaService) {
        this.grupoRepository = grupoRepository;
        this.despesaRepository = despesaRepository;
        this.usuarioReferenciaService = usuarioReferenciaService;
    }

    public GrupoResponse criarGrupo(String usuarioId, CriarGrupoRequest request) {
        validar(request);

        Set<String> outros = new LinkedHashSet<>();
        if (request.integrantesIds() != null) {
            for (String id : request.integrantesIds()) {
                if (id != null && !id.isBlank() && !id.trim().equals(usuarioId)) {
                    outros.add(id.trim());
                }
            }
        }

        List<String> inexistentes = usuarioReferenciaService.idsInexistentes(outros);
        if (!inexistentes.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Integrantes não cadastrados: " + String.join(", ", inexistentes));
        }

        List<String> integrantes = new ArrayList<>();
        integrantes.add(usuarioId);
        integrantes.addAll(outros);

        GrupoCompartilhado grupo = new GrupoCompartilhado();
        grupo.setNome(request.nome().trim());
        grupo.setTipo(request.tipo());
        grupo.setCriadorId(usuarioId);
        grupo.setIntegrantesIds(integrantes);
        grupo.setCriadoEm(LocalDateTime.now());
        grupo = grupoRepository.save(grupo);

        List<DespesaCompartilhada> despesas = new ArrayList<>();
        if (request.primeiraDespesa() != null) {
            DespesaCompartilhada despesa = new DespesaCompartilhada();
            despesa.setGrupoId(grupo.getId());
            String descricao = request.primeiraDespesa().descricao();
            despesa.setDescricao(descricao == null || descricao.isBlank() ? grupo.getNome() : descricao.trim());
            despesa.setValor(request.primeiraDespesa().valor());
            despesa.setPagadorId(usuarioId);
            despesa.setParticipantesIds(new ArrayList<>(integrantes));
            despesa.setCriadoEm(LocalDateTime.now());
            despesas.add(despesaRepository.save(despesa));
        }

        return montarResponse(grupo, despesas, usuarioId, nomesDe(List.of(grupo)));
    }

    /** Inclui grupos criados por outras pessoas em que o usuário foi adicionado. */
    public List<GrupoResponse> listarGrupos(String usuarioId) {
        List<GrupoCompartilhado> grupos = grupoRepository.findByIntegrante(usuarioId);
        grupos.sort(Comparator.comparing(GrupoCompartilhado::getCriadoEm,
                Comparator.nullsLast(Comparator.reverseOrder())));

        Map<String, List<DespesaCompartilhada>> despesasPorGrupo = despesasPorGrupo(grupos);
        Map<String, String> nomes = nomesDe(grupos);

        return grupos.stream()
                .map(g -> montarResponse(g, despesasPorGrupo.getOrDefault(g.getId(), List.of()), usuarioId, nomes))
                .toList();
    }

    /** Despesa mais recente em que o usuário pagou ou participa (mesmo se outra pessoa a cadastrou). */
    public Optional<UltimaDivisaoResponse> buscarUltimaDivisao(String usuarioId) {
        List<GrupoCompartilhado> grupos = grupoRepository.findByIntegrante(usuarioId);
        if (grupos.isEmpty()) {
            return Optional.empty();
        }
        List<String> grupoIds = grupos.stream().map(GrupoCompartilhado::getId).toList();

        return despesaRepository.findByGrupoIdIn(grupoIds).stream()
                .filter(d -> usuarioId.equals(d.getPagadorId()) || d.getParticipantesIds().contains(usuarioId))
                .max(Comparator.comparing(DespesaCompartilhada::getCriadoEm))
                .map(d -> {
                    Map<String, String> nomes = usuarioReferenciaService.buscarNomes(d.getParticipantesIds());
                    List<IntegranteResponse> integrantes = d.getParticipantesIds().stream()
                            .map(id -> new IntegranteResponse(id, nomes.getOrDefault(id, id)))
                            .toList();
                    return new UltimaDivisaoResponse(d.getDescricao(), d.getValor(),
                            parte(d), integrantes);
                });
    }

    // ---------- auxiliares ----------

    private void validar(CriarGrupoRequest request) {
        if (request.nome() == null || request.nome().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dê um nome ao grupo.");
        }
        if (request.tipo() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o tipo do grupo.");
        }
        if (request.primeiraDespesa() != null) {
            BigDecimal valor = request.primeiraDespesa().valor();
            if (valor == null || valor.compareTo(BigDecimal.ZERO) <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "O valor da despesa deve ser maior que zero.");
            }
        }
    }

    private Map<String, List<DespesaCompartilhada>> despesasPorGrupo(List<GrupoCompartilhado> grupos) {
        if (grupos.isEmpty()) {
            return Map.of();
        }
        List<String> ids = grupos.stream().map(GrupoCompartilhado::getId).toList();
        return despesaRepository.findByGrupoIdIn(ids).stream()
                .collect(Collectors.groupingBy(DespesaCompartilhada::getGrupoId));
    }

    private Map<String, String> nomesDe(List<GrupoCompartilhado> grupos) {
        Set<String> ids = grupos.stream()
                .flatMap(g -> g.getIntegrantesIds().stream())
                .collect(Collectors.toSet());
        return usuarioReferenciaService.buscarNomes(ids);
    }

    private GrupoResponse montarResponse(GrupoCompartilhado grupo, List<DespesaCompartilhada> despesas,
                                         String usuarioId, Map<String, String> nomes) {
        List<IntegranteResponse> integrantes = grupo.getIntegrantesIds().stream()
                .map(id -> new IntegranteResponse(id, nomes.getOrDefault(id, id)))
                .toList();
        return new GrupoResponse(grupo.getId(), grupo.getNome(), grupo.getTipo(),
                integrantes.size(), integrantes, calcularSaldo(usuarioId, despesas));
    }

    /** Parte de cada participante (divisão igual). */
    private BigDecimal parte(DespesaCompartilhada d) {
        return d.getValor().divide(BigDecimal.valueOf(d.getParticipantesIds().size()), 2, RoundingMode.HALF_EVEN);
    }

    /**
     * Quem pagou recebe (valor - sua própria parte); quem apenas participa deve a sua parte.
     * Negativo = você deve | positivo = te devem.
     */
    private BigDecimal calcularSaldo(String usuarioId, List<DespesaCompartilhada> despesas) {
        BigDecimal saldo = BigDecimal.ZERO;
        for (DespesaCompartilhada d : despesas) {
            if (d.getParticipantesIds().isEmpty()) {
                continue;
            }
            BigDecimal parte = parte(d);
            boolean participa = d.getParticipantesIds().contains(usuarioId);
            if (usuarioId.equals(d.getPagadorId())) {
                saldo = saldo.add(d.getValor()).subtract(participa ? parte : BigDecimal.ZERO);
            } else if (participa) {
                saldo = saldo.subtract(parte);
            }
        }
        return saldo.setScale(2, RoundingMode.HALF_EVEN);
    }
}
