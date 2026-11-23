package com.bolsu.BolsuAPI.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.bolsu.BolsuAPI.dto.AtualizarPagamentoRequest;
import com.bolsu.BolsuAPI.dto.CriarGastoCompartilhadoRequest;
import com.bolsu.BolsuAPI.dto.GastoCompartilhadoResponse;
import com.bolsu.BolsuAPI.dto.PainelGastosCompartilhadosResponse;
import com.bolsu.BolsuAPI.dto.UsuarioPesquisaResponse;
import com.bolsu.BolsuAPI.service.GastoCompartilhadoService;

/** Endpoints autenticados para convites, cotas e histórico de gastos compartilhados. */
@RestController
@RequestMapping("/api/gastos-compartilhados")
public class GastosCompartilhadosController {

    private final GastoCompartilhadoService service;

    public GastosCompartilhadosController(GastoCompartilhadoService service) {
        this.service = service;
    }

    @GetMapping
    public PainelGastosCompartilhadosResponse listar(Principal principal) {
        return service.listarPainel(principal.getName());
    }

    @PostMapping
    public ResponseEntity<GastoCompartilhadoResponse> criar(
            @RequestBody CriarGastoCompartilhadoRequest request,
            Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(principal.getName(), request));
    }

    @GetMapping("/usuarios")
    public List<UsuarioPesquisaResponse> buscarUsuarios(
            @RequestParam(defaultValue = "") String busca,
            Principal principal) {
        return service.buscarUsuarios(busca, principal.getName());
    }

    @GetMapping("/{gastoId}")
    public GastoCompartilhadoResponse buscar(@PathVariable String gastoId, Principal principal) {
        return service.buscar(gastoId, principal.getName());
    }

    @PostMapping("/{gastoId}/convite/aceitar")
    public GastoCompartilhadoResponse aceitarConvite(@PathVariable String gastoId, Principal principal) {
        return service.aceitarConvite(gastoId, principal.getName());
    }

    @PostMapping("/{gastoId}/convite/recusar")
    public ResponseEntity<Void> recusarConvite(@PathVariable String gastoId, Principal principal) {
        service.recusarConvite(gastoId, principal.getName());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{gastoId}/meu-pagamento")
    public GastoCompartilhadoResponse atualizarMeuPagamento(
            @PathVariable String gastoId,
            @RequestBody AtualizarPagamentoRequest request,
            Principal principal) {
        return service.atualizarMeuPagamento(gastoId, principal.getName(), request);
    }

    @PostMapping("/{gastoId}/encerrar")
    public GastoCompartilhadoResponse encerrar(@PathVariable String gastoId, Principal principal) {
        return service.encerrar(gastoId, principal.getName());
    }
}
