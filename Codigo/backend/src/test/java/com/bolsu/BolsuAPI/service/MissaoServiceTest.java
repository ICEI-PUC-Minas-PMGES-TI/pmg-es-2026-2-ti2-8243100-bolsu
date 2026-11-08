package com.bolsu.BolsuAPI.service;

import com.bolsu.BolsuAPI.model.ConclusaoMissao;
import com.bolsu.BolsuAPI.repository.ConclusaoMissaoRepository;
import com.bolsu.BolsuAPI.repository.MissaoRepository;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class MissaoServiceTest {
    @Test
    void calculaPeriodosDiariosSemanaisEUnicos() {
        LocalDate domingo = LocalDate.of(2026, 11, 8);
        assertEquals("2026-11-08", MissaoService.periodo("DIARIA", domingo));
        assertEquals("semana-2026-11-02", MissaoService.periodo("SEMANAL", domingo));
        assertEquals("semana-2026-11-09", MissaoService.periodo("SEMANAL", domingo.plusDays(1)));
        assertEquals("unica", MissaoService.periodo("UNICA", domingo));
    }

    @Test
    void conclusaoPremiaApenasUmaVezPorContaEProgressoLiberaDesafios() {
        MissaoRepository missoes = mock(MissaoRepository.class);
        ConclusaoMissaoRepository conclusoes = mock(ConclusaoMissaoRepository.class);
        Map<String, ConclusaoMissao> salvas = new HashMap<>();
        when(conclusoes.findByUsuarioId(anyString())).thenAnswer(chamada ->
                salvas.values().stream().filter(item -> item.usuarioId().equals(chamada.getArgument(0))).toList());
        when(conclusoes.insert(any(ConclusaoMissao.class))).thenAnswer(chamada -> {
            ConclusaoMissao item = chamada.getArgument(0);
            if (salvas.putIfAbsent(item.id(), item) != null) throw new DuplicateKeyException("Já concluída");
            return item;
        });
        MissaoService service = new MissaoService(missoes, conclusoes);
        var inicial = service.painel("ana");
        var diaria = inicial.desafios().stream().filter(d -> "DIARIA".equals(d.missao().periodicidade)).findFirst().orElseThrow();
        assertEquals(1, inicial.nivel());
        assertEquals(2, inicial.desafios().size());
        assertThrows(ResponseStatusException.class, () -> service.concluir("ana", diaria.missao().id, "periodo-anterior"));
        service.concluir("ana", diaria.missao().id, diaria.periodo());
        service.concluir("ana", diaria.missao().id, diaria.periodo());
        assertEquals(1, service.painel("ana").estrelas());
        assertEquals(diaria.missao().recompensaMoedas, service.painel("ana").moedas());
        assertTrue(service.painel("ana").desafios().getFirst().concluida());
        assertEquals(0, service.painel("bia").estrelas());
        assertFalse(service.painel("bia").desafios().getFirst().concluida());
        for (int i = 0; i < 4; i++) {
            String id = "historico-" + i;
            salvas.put(id, new ConclusaoMissao(id, "ana", 5));
        }
        assertEquals(2, service.painel("ana").nivel());
        assertEquals(4, service.painel("ana").desafios().size());
        verify(conclusoes).insert(any(ConclusaoMissao.class));
    }
}
