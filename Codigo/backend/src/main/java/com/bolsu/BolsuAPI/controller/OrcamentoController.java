package com.bolsu.BolsuAPI.controller;

import com.bolsu.BolsuAPI.dto.OrcamentoDTO;
import com.bolsu.BolsuAPI.dto.ResumoOrcamentoDTO;
import com.bolsu.BolsuAPI.model.Orcamento;
import com.bolsu.BolsuAPI.service.OrcamentoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/orcamento")
public class OrcamentoController {

    @Autowired
    private OrcamentoService orcamentoService;

    @GetMapping
    public Orcamento get(@RequestParam(required = false) String mes, Principal principal) {
        return orcamentoService.get(mes, principal.getName());
    }

    @PutMapping
    public ResponseEntity<Orcamento> salvar(@RequestBody OrcamentoDTO dto, Principal principal) {
        return ResponseEntity.ok(orcamentoService.salvar(dto, principal.getName()));
    }

    @GetMapping("/resumo")
    public ResumoOrcamentoDTO resumo(@RequestParam(required = false) String mes, Principal principal) {
        return orcamentoService.resumo(mes, principal.getName());
    }
}
