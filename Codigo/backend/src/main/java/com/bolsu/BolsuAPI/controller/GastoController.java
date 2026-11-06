package com.bolsu.BolsuAPI.controller;

import com.bolsu.BolsuAPI.dto.GastoDTO;
import com.bolsu.BolsuAPI.dto.ResumoGastosDTO;
import com.bolsu.BolsuAPI.model.Gasto;
import com.bolsu.BolsuAPI.service.GastoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/gastos")
public class GastoController {

    @Autowired
    private GastoService gastoService;

    @GetMapping
    public List<Gasto> getAll() {
        return gastoService.getAll();
    }

    @GetMapping("/resumo")
    public ResumoGastosDTO resumo(@RequestParam(defaultValue = "mes") String periodo) {
        return gastoService.resumo(periodo);
    }

    @PostMapping
    public ResponseEntity<Gasto> add(@RequestBody GastoDTO dto) {
        LocalDate data = dto.data() != null ? dto.data() : LocalDate.now();
        Gasto gasto = gastoService.add(new Gasto(dto.categoria(), dto.valor(), data, dto.descricao()));
        return ResponseEntity.ok(gasto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        gastoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
