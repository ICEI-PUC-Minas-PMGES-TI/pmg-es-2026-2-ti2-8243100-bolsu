package com.bolsu.BolsuAPI.controller;

import com.bolsu.BolsuAPI.dto.LoginRequestDTO;
import com.bolsu.BolsuAPI.exception.IncorrectAuthorizationDataException;
import com.bolsu.BolsuAPI.exception.NotFoundException;
import com.bolsu.BolsuAPI.model.Usuario;
import com.bolsu.BolsuAPI.service.AuthService;
import com.bolsu.BolsuAPI.service.UsuarioService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@Tag(name="Authorization")
public class AuthController {

    @Autowired
    private AuthService authService;
    @Autowired
    private UsuarioService usuarioService;

    @GetMapping("/check-health")
    public ResponseEntity<String> health(){
        return ResponseEntity.status(HttpStatus.OK).body("OK");
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody LoginRequestDTO loginRequestDTO) {

        if (loginRequestDTO == null || loginRequestDTO.email() == null || loginRequestDTO.senha() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Informe email e senha"));
        }
        try {
            Usuario usuario = usuarioService.getByEmail(loginRequestDTO.email());

            if(!usuarioService.validarSenha(loginRequestDTO.senha(), usuario.getSenha())){
                throw new IncorrectAuthorizationDataException("Email ou senha invalidos");
            }

            return ResponseEntity.status(HttpStatus.ACCEPTED).body(Map.of("token", authService.generateToken(usuario.getId())));

        } catch (ResponseStatusException | IncorrectAuthorizationDataException | NotFoundException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Email ou senha invalidos"));
        }
    }
}
