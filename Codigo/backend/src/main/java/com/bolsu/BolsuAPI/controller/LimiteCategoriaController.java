package com.bolsu.BolsuAPI.controller;

import com.bolsu.BolsuAPI.dto.LimiteCategoriaDTO;
import com.bolsu.BolsuAPI.model.LimiteCategoria;
import com.bolsu.BolsuAPI.service.LimiteCategoriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/limites-categoria")
public class LimiteCategoriaController {

    @Autowired
    private LimiteCategoriaService limiteService;

    @GetMapping
    public List<LimiteCategoria> getAll(Principal principal) {
        return limiteService.getAll(principal.getName());
    }

    @PutMapping
    public ResponseEntity<LimiteCategoria> salvar(@RequestBody LimiteCategoriaDTO dto, Principal principal) {
        return ResponseEntity.ok(limiteService.salvar(dto, principal.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, Principal principal) {
        limiteService.delete(id, principal.getName());
        return ResponseEntity.noContent().build();
    }
}
