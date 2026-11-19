package com.bolsu.BolsuAPI.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

/**
 * Tratamento de erros comum a todos os controllers, sempre no formato {@code {"message": "..."}},
 * que é o que o front exibe ao usuário. Um {@code @ExceptionHandler} declarado dentro de um controller
 * tem precedência sobre este, então rotas com mensagem própria continuam podendo sobrescrevê-lo.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    static final String MENSAGEM_PADRAO = "Não foi possível concluir a solicitação";
    static final String MENSAGEM_BANCO_INDISPONIVEL = "Serviço temporariamente indisponível. Tente novamente em instantes.";

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> erroDeNegocio(ResponseStatusException exception) {
        String mensagem = exception.getReason() == null || exception.getReason().isBlank()
                ? MENSAGEM_PADRAO
                : exception.getReason();
        return ResponseEntity.status(exception.getStatusCode()).body(Map.of("message", mensagem));
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<Map<String, String>> bancoIndisponivel(DataAccessException exception) {
        log.error("Falha ao acessar o banco de dados", exception);
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("message", MENSAGEM_BANCO_INDISPONIVEL));
    }
}
