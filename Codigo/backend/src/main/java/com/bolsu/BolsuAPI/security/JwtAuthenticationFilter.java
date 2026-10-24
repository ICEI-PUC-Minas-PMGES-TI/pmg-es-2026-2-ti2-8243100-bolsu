package com.bolsu.BolsuAPI.security;

import com.bolsu.BolsuAPI.repository.UsuarioRepository;
import com.bolsu.BolsuAPI.service.AuthService;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final AuthService authService;
    private final UsuarioRepository usuarioRepository;
    private final AuthenticationEntryPoint authenticationEntryPoint;

    public JwtAuthenticationFilter(AuthService authService, UsuarioRepository usuarioRepository,
                                   AuthenticationEntryPoint authenticationEntryPoint) {
        this.authService = authService;
        this.usuarioRepository = usuarioRepository;
        this.authenticationEntryPoint = authenticationEntryPoint;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authorization == null || !authorization.regionMatches(true, 0, "Bearer ", 0, 7)) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String id = authService.extractId(authorization.substring(7).trim());
            if (id == null || id.isBlank() || !usuarioRepository.existsById(id)) {
                throw new BadCredentialsException("Usuario do token nao encontrado");
            }

            var authentication = UsernamePasswordAuthenticationToken.authenticated(id, null, List.of()); // Coloca o id do usuário como "contexto" pro serviço
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            var context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
        } catch (JwtException | IllegalArgumentException | BadCredentialsException exception) {
            SecurityContextHolder.clearContext();

            authenticationEntryPoint.commence(request, response,
                    new BadCredentialsException("Bearer token invalido ou expirado", exception));
            return;
        }

        filterChain.doFilter(request, response);
    }
}
