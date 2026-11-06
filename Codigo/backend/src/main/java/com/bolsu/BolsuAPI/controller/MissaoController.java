package com.bolsu.BolsuAPI.controller;

import com.bolsu.BolsuAPI.model.Missao;
import com.bolsu.BolsuAPI.repository.MissaoRepository;
import org.springframework.dao.DataAccessException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/missoes")
public class MissaoController {
    private final MissaoRepository repository;
    public MissaoController(MissaoRepository repository) { this.repository = repository; }

    @GetMapping
    public List<Missao> listar() { return repository.findByAtivaTrueOrderByOrdemAscIdAsc(); }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<Map<String, String>> bancoIndisponivel() {
        return ResponseEntity.status(503).body(Map.of("message", "Não foi possível carregar as missões. Tente novamente em instantes."));
    }
}
