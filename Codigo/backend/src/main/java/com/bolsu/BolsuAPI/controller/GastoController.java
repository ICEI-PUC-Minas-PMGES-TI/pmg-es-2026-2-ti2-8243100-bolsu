package com.bolsu.BolsuAPI.controller;

import com.bolsu.BolsuAPI.dto.GastoDTO;
import com.bolsu.BolsuAPI.dto.ResumoGastosDTO;
import com.bolsu.BolsuAPI.model.Gasto;
import com.bolsu.BolsuAPI.service.GastoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/gastos")
public class GastoController {

    @Autowired
    private GastoService gastoService;

    @GetMapping
    public List<Gasto> getAll(Principal principal) {
        return gastoService.getAll(principal.getName());
    }

    @GetMapping("/resumo")
    public ResumoGastosDTO resumo(@RequestParam(defaultValue = "mes") String periodo, Principal principal) {
        return gastoService.resumo(periodo, principal.getName());
    }

    @PostMapping
    public ResponseEntity<Gasto> add(@Valid @RequestBody GastoDTO dto, Principal principal) {
        LocalDate data = dto.data() != null ? dto.data() : LocalDate.now();
        Gasto gasto = gastoService.add(new Gasto(dto.categoria(), dto.valor(), data, dto.descricao()), principal.getName());
        return ResponseEntity.ok(gasto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, Principal principal) {
        gastoService.delete(id, principal.getName());
        return ResponseEntity.noContent().build();
    }
}
