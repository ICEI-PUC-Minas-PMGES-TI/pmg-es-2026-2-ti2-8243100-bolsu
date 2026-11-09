package com.bolsu.BolsuAPI.controller;

import com.bolsu.BolsuAPI.dto.UsuarioRequestDTO;
import com.bolsu.BolsuAPI.dto.UsuarioResponseDTO;
import com.bolsu.BolsuAPI.exception.NotFoundException;
import com.bolsu.BolsuAPI.model.Usuario;
import com.bolsu.BolsuAPI.model.DadosFinanceiros;
import com.bolsu.BolsuAPI.service.UsuarioService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users")
@Tag(name="Usuario")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> erroDeValidacao(ResponseStatusException exception) {
        return ResponseEntity.status(exception.getStatusCode())
                .body(Map.of("message", exception.getReason() == null ? "Não foi possível concluir a solicitação" : exception.getReason()));
    }

    @GetMapping
    public ResponseEntity<List<Usuario>> getAll(Principal principal) throws NotFoundException {
        return ResponseEntity.ok(List.of(usuarioService.getById(principal.getName())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Usuario> getById(@PathVariable String id, Principal principal) {
        if (!id.equals(principal.getName())) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        try {
            Usuario usuario = usuarioService.getById(id);
            return ResponseEntity.ok(usuario);
        } catch (NotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/current")
    public ResponseEntity<UsuarioResponseDTO> getCurrent(Principal principal) {
        Usuario usuario = null;
        try {
            usuario = usuarioService.getById(principal.getName());

            return ResponseEntity.ok(new UsuarioResponseDTO(
                    usuario.getNome_completo(),
                    usuario.getEmail(),
                    usuario.getCelular(),
                    usuario.getDadosAcademicos(),
                    usuario.getDadosFinanceiros()
            ));
        } catch (NotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PostMapping
    public ResponseEntity<Usuario> add(@RequestBody UsuarioRequestDTO usuarioRequestDTO) {
        Usuario usuario = usuarioService.add(usuarioRequestDTO);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(usuario.getId())
                .toUri();

        return ResponseEntity.created(location).body(usuario);
    }

    @PutMapping("/current/registration-configs")
    public ResponseEntity<Usuario> configurarFinancas(@RequestBody DadosFinanceiros dados, Principal principal)
            throws NotFoundException {
        return ResponseEntity.ok(usuarioService.configurarFinancas(principal.getName(), dados));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Usuario> update(@PathVariable String id, @RequestBody UsuarioRequestDTO usuarioRequestDTO, Principal principal) {
        if (!id.equals(principal.getName())) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        try {
            return ResponseEntity.ok(usuarioService.update(id, usuarioRequestDTO));
        } catch (NotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, Principal principal) {
        if (!id.equals(principal.getName())) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        try {
            usuarioService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (NotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
}
