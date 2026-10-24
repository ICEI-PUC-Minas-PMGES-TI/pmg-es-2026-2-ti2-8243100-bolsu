package com.bolsu.BolsuAPI.controller;

import com.bolsu.BolsuAPI.dto.UsuarioRequestDTO;
import com.bolsu.BolsuAPI.dto.UsuarioResponseDTO;
import com.bolsu.BolsuAPI.model.Usuario;
import com.bolsu.BolsuAPI.service.UsuarioService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/users")
@Tag(name="Usuario")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping
    public ResponseEntity<List<Usuario>> getAll() {
        return ResponseEntity.ok(usuarioService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Usuario> getById(@PathVariable String id) {

        try {
            Usuario usuario = usuarioService.getById(id);
            return ResponseEntity.ok(usuario);
        } catch (ResponseStatusException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/current")
    public ResponseEntity<UsuarioResponseDTO> getCurrent(Principal principal) {
        Usuario usuario = usuarioService.getById(principal.getName());
        return ResponseEntity.ok(new UsuarioResponseDTO(
                usuario.getNome_completo(),
                usuario.getEmail(),
                usuario.getCelular(),
                usuario.getDadosAcademicos(),
                usuario.getDadosFinanceiros()
        ));
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

    @PutMapping("/{id}")
    public ResponseEntity<Usuario> update(@PathVariable String id, @RequestBody UsuarioRequestDTO usuarioRequestDTO) {
        return ResponseEntity.ok(usuarioService.update(id, usuarioRequestDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        usuarioService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
