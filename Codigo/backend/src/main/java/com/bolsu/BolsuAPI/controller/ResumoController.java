package com.bolsu.BolsuAPI.controller;

import com.bolsu.BolsuAPI.dto.ResumoMensalDTO;
import com.bolsu.BolsuAPI.service.ResumoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.Map;

@RestController
@RequestMapping("/resumo")
@Tag(name = "Resumo")
public class ResumoController {

    private static final Logger log = LoggerFactory.getLogger(ResumoController.class);

    private final ResumoService resumoService;

    public ResumoController(ResumoService resumoService) {
        this.resumoService = resumoService;
    }

    @GetMapping
    @Operation(summary = "Resumo financeiro mensal do usuário autenticado",
            description = "Entradas, despesas, saldo, orçamento restante e despesas por categoria. "
                    + "O parâmetro mes (AAAA-MM) é opcional; o padrão é o mês atual.")
    public ResumoMensalDTO resumo(@RequestParam(required = false) String mes, Principal principal) {
        return resumoService.resumoDoMes(principal.getName(), parseMes(mes));
    }

    private YearMonth parseMes(String mes) {
        if (mes == null || mes.isBlank()) return resumoService.mesAtual();
        try {
            return YearMonth.parse(mes.trim());
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o mês no formato AAAA-MM");
        }
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> erro(ResponseStatusException exception) {
        return ResponseEntity.status(exception.getStatusCode())
                .body(Map.of("message", exception.getReason() == null ? "Não foi possível concluir a solicitação" : exception.getReason()));
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<Map<String, String>> bancoIndisponivel(DataAccessException exception) {
        log.error("Falha ao acessar o banco ao montar o resumo mensal", exception);
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("message", "Não foi possível carregar seu resumo. Tente novamente em instantes."));
    }
}
