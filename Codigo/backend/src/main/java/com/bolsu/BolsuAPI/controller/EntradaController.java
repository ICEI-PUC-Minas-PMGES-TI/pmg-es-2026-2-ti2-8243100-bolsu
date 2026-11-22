package com.bolsu.BolsuAPI.controller;

import com.bolsu.BolsuAPI.dto.EntradaDTO;
import com.bolsu.BolsuAPI.model.Entrada;
import com.bolsu.BolsuAPI.service.EntradaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/entradas")
public class EntradaController {

    @Autowired
    private EntradaService entradaService;

    @GetMapping
    public List<Entrada> getAll(Principal principal) {
        return entradaService.getAll(principal.getName());
    }

    @PostMapping
    public ResponseEntity<Entrada> add(@RequestBody EntradaDTO dto, Principal principal) {
        return ResponseEntity.ok(entradaService.add(dto, principal.getName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Entrada> update(@PathVariable String id, @RequestBody EntradaDTO dto, Principal principal) {
        return ResponseEntity.ok(entradaService.update(id, dto, principal.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, Principal principal) {
        entradaService.delete(id, principal.getName());
        return ResponseEntity.noContent().build();
    }
}
