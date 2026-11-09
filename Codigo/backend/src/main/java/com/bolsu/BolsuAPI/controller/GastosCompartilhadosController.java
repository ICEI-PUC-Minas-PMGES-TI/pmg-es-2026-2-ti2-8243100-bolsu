package com.bolsu.BolsuAPI.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bolsu.BolsuAPI.dto.CriarGrupoRequest;
import com.bolsu.BolsuAPI.dto.GrupoResponse;
import com.bolsu.BolsuAPI.dto.UltimaDivisaoResponse;
import com.bolsu.BolsuAPI.service.GastosCompartilhadosService;

@RestController
@RequestMapping("/api/gastos-compartilhados")
public class GastosCompartilhadosController {

    /** Provisório: enquanto não há autenticação, o usuário atual vem do header X-Usuario-Id. */
    private static final String HEADER_USUARIO = "X-Usuario-Id";
    private static final String USUARIO_PADRAO = "voce";

    private final GastosCompartilhadosService service;

    public GastosCompartilhadosController(GastosCompartilhadosService service) {
        this.service = service;
    }

    @GetMapping("/grupos")
    public List<GrupoResponse> listarGrupos(
            @RequestHeader(value = HEADER_USUARIO, defaultValue = USUARIO_PADRAO) String usuarioId) {
        return service.listarGrupos(usuarioId);
    }

    @PostMapping("/grupos")
    public ResponseEntity<GrupoResponse> criarGrupo(
            @RequestHeader(value = HEADER_USUARIO, defaultValue = USUARIO_PADRAO) String usuarioId,
            @RequestBody CriarGrupoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criarGrupo(usuarioId, request));
    }

    @GetMapping("/ultima-divisao")
    public ResponseEntity<UltimaDivisaoResponse> ultimaDivisao(
            @RequestHeader(value = HEADER_USUARIO, defaultValue = USUARIO_PADRAO) String usuarioId) {
        return service.buscarUltimaDivisao(usuarioId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }
}
