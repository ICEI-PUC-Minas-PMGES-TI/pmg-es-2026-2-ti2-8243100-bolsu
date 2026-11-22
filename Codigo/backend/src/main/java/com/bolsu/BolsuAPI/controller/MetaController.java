package com.bolsu.BolsuAPI.controller;

import com.bolsu.BolsuAPI.model.Meta;
import com.bolsu.BolsuAPI.repository.MetaRepository;

import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

@RestController
@Tag(name="Metas")
@RequestMapping("/api/metas")
public class MetaController {
    private static final long LIMITE_CENTAVOS = 20_000_000_000L;
    private final MetaRepository repository;

    public MetaController(MetaRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<MetaResponse> listar(Principal principal) {
        return repository.findByUsuarioIdOrderByPrazoAscIdAsc(principal.getName())
                .stream().map(MetaResponse::from).toList();
    }

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody NovaMeta dados, Principal principal) {
        String nome = dados.nome() == null ? "" : dados.nome().strip();
        if (!valida(dados, nome, null)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Confira o nome, os valores e o prazo da meta."));
        }
        Meta meta = repository.insert(new Meta(null, principal.getName(), nome,
                dados.valorDesejado(), dados.valorGuardado(), dados.prazo()));
        return ResponseEntity.status(HttpStatus.CREATED).body(MetaResponse.from(meta));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable String id, @RequestBody NovaMeta dados, Principal principal) {
        var existente = repository.findByIdAndUsuarioId(id, principal.getName());
        if (existente.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Meta não encontrada."));
        }
        String nome = dados.nome() == null ? "" : dados.nome().strip();
        if (!valida(dados, nome, existente.get().prazo())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Confira o nome, os valores e o prazo da meta."));
        }
        Meta meta = repository.save(new Meta(id, principal.getName(), nome,
                dados.valorDesejado(), dados.valorGuardado(), dados.prazo()));
        return ResponseEntity.ok(MetaResponse.from(meta));
    }

    private boolean valida(NovaMeta dados, String nome, LocalDate prazoOriginal) {
        LocalDate hoje = LocalDate.now(ZoneId.of("America/Sao_Paulo"));
        return !nome.isEmpty() && nome.length() <= 80 && dados.valorDesejado() != null
                && dados.valorDesejado() > 0 && dados.valorDesejado() <= LIMITE_CENTAVOS
                && dados.valorGuardado() != null && dados.valorGuardado() >= 0
                && dados.valorGuardado() <= dados.valorDesejado()
                && dados.prazo() != null && dados.prazo().getYear() <= 9999
                && (!dados.prazo().isBefore(hoje) || dados.prazo().equals(prazoOriginal));
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<Map<String, String>> bancoIndisponivel() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("message", "Não foi possível acessar suas metas. Tente novamente em instantes."));
    }

    public record NovaMeta(String nome, Long valorDesejado, Long valorGuardado, LocalDate prazo) {}

    public record MetaResponse(String id, String nome, long valorDesejado, long valorGuardado, LocalDate prazo) {
        static MetaResponse from(Meta meta) {
            return new MetaResponse(meta.id(), meta.nome(), meta.valorDesejado(), meta.valorGuardado(), meta.prazo());
        }
    }
}
