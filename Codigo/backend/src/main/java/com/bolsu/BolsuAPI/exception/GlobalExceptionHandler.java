package com.bolsu.BolsuAPI.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Tratamento de erros comum a todos os controllers, sempre no formato {@code {"message": "..."}},
 * que é o que o front exibe ao usuário. Um {@code @ExceptionHandler} declarado dentro de um controller
 * tem precedência sobre este, então rotas com mensagem própria continuam podendo sobrescrevê-lo.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    static final String MENSAGEM_PADRAO = "Não foi possível concluir a solicitação";
    static final String MENSAGEM_CORPO_ILEGIVEL = "Os dados enviados estão incompletos ou em formato inválido";
    static final String MENSAGEM_BANCO_INDISPONIVEL = "Serviço temporariamente indisponível. Tente novamente em instantes.";

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> erroDeNegocio(ResponseStatusException exception) {
        String mensagem = exception.getReason() == null || exception.getReason().isBlank()
                ? MENSAGEM_PADRAO
                : exception.getReason();
        return ResponseEntity.status(exception.getStatusCode()).body(Map.of("message", mensagem));
    }

    /** Falha de Bean Validation em um {@code @Valid @RequestBody}: devolve as mensagens dos campos inválidos. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> corpoInvalido(MethodArgumentNotValidException exception) {
        String mensagem = exception.getBindingResult().getFieldErrors().stream()
                .sorted(Comparator.comparing(FieldError::getField))
                .map(erro -> erro.getDefaultMessage() == null ? MENSAGEM_PADRAO : erro.getDefaultMessage())
                .distinct()
                .collect(Collectors.joining("; "));
        return ResponseEntity.badRequest()
                .body(Map.of("message", mensagem.isBlank() ? MENSAGEM_PADRAO : mensagem));
    }

    /** JSON malformado ou com campo obrigatório ausente/nulo em tipo primitivo (ex.: valor). */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> corpoIlegivel(HttpMessageNotReadableException exception) {
        return ResponseEntity.badRequest().body(Map.of("message", MENSAGEM_CORPO_ILEGIVEL));
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<Map<String, String>> bancoIndisponivel(DataAccessException exception) {
        log.error("Falha ao acessar o banco de dados", exception);
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("message", MENSAGEM_BANCO_INDISPONIVEL));
    }
}
