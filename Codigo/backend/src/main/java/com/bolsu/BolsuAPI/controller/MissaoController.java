package com.bolsu.BolsuAPI.controller;

import com.bolsu.BolsuAPI.model.Missao;
import com.bolsu.BolsuAPI.repository.MissaoRepository;
import com.bolsu.BolsuAPI.service.MissaoService;

import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.dao.DataAccessException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@Tag(name="Missoes")
@RequestMapping("/api/missoes")
public class MissaoController {
    private final MissaoRepository repository;
    private final MissaoService service;

    public MissaoController(MissaoRepository repository, MissaoService service) {
        this.repository = repository;
        this.service = service;
    }

    @GetMapping
    public List<Missao> listar() { return repository.findByAtivaTrueOrderByOrdemAscIdAsc(); }

    @GetMapping("/painel")
    public MissaoService.Painel painel(Principal principal) {
        return service.painel(principal.getName());
    }

    @PutMapping("/{id}/conclusao")
    public Map<String, Boolean> concluir(@PathVariable String id, @RequestParam String periodo, Principal principal) {
        service.concluir(principal.getName(), id, periodo);
        return Map.of("concluida", true);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> missaoIndisponivel(ResponseStatusException erro) {
        return ResponseEntity.status(erro.getStatusCode()).body(Map.of("message", erro.getReason()));
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<Map<String, String>> bancoIndisponivel() {
        return ResponseEntity.status(503).body(Map.of("message", "Não foi possível carregar as missões. Tente novamente em instantes."));
    }
}
