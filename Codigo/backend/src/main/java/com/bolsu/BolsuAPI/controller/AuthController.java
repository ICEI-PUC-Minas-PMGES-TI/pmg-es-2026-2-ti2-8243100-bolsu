package com.bolsu.BolsuAPI.controller;

import com.bolsu.BolsuAPI.dto.LoginRequestDTO;
import com.bolsu.BolsuAPI.exception.IncorrectAuthorizationDataException;
import com.bolsu.BolsuAPI.model.Usuario;
import com.bolsu.BolsuAPI.service.AuthService;
import com.bolsu.BolsuAPI.service.UsuarioService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
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

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody LoginRequestDTO loginRequestDTO) {

        try {
            Usuario usuario = usuarioService.getByEmail(loginRequestDTO.email());

            if(!usuarioService.validarSenha(loginRequestDTO.senha(), usuario.getSenha())){
                throw new IncorrectAuthorizationDataException("Email ou senha invalidos");
            }

            return ResponseEntity.status(HttpStatus.ACCEPTED).body(Map.of("token", authService.generateToken(usuario.getId())));

        } catch (ResponseStatusException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        } catch (IncorrectAuthorizationDataException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }
}
