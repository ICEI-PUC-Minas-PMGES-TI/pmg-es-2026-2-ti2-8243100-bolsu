package com.bolsu.BolsuAPI.service.resumo;

import com.bolsu.BolsuAPI.model.Orcamento;
import com.bolsu.BolsuAPI.repository.OrcamentoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.YearMonth;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class OrcamentoPersistidoTest {

    private static final String USUARIO = "usuario-1";
    private static final YearMonth NOVEMBRO = YearMonth.of(2026, 11);

    private OrcamentoRepository repository;
    private OrcamentoPersistido orcamento;

    @BeforeEach
    void setUp() {
        repository = mock(OrcamentoRepository.class);
        orcamento = new OrcamentoPersistido(repository);
    }

    private static Orcamento comLimite(double limite) {
        Orcamento o = new Orcamento();
        o.setLimiteMensal(limite);
        return o;
    }

    @Test
    void devolveOLimiteSalvoParaOMesDoUsuario() {
        when(repository.findByUsuarioIdAndMes(USUARIO, "2026-11")).thenReturn(Optional.of(comLimite(650)));

        assertThat(orcamento.limiteTotal(USUARIO, NOVEMBRO)).hasValue(650.0);
        verify(repository).findByUsuarioIdAndMes(USUARIO, "2026-11");
    }

    @Test
    void semOrcamentoDefinidoNaoHaLimite() {
        when(repository.findByUsuarioIdAndMes(USUARIO, "2026-11")).thenReturn(Optional.empty());

        assertThat(orcamento.limiteTotal(USUARIO, NOVEMBRO)).isEmpty();
    }

    @Test
    void consultaSomenteOMesPedido() {
        when(repository.findByUsuarioIdAndMes(USUARIO, "2026-10")).thenReturn(Optional.of(comLimite(400)));

        assertThat(orcamento.limiteTotal(USUARIO, YearMonth.of(2026, 10))).hasValue(400.0);
        assertThat(orcamento.limiteTotal(USUARIO, NOVEMBRO)).isEmpty();
    }

    @Test
    void limiteZeroOuNegativoEquivaleASemOrcamento() {
        when(repository.findByUsuarioIdAndMes(USUARIO, "2026-11")).thenReturn(Optional.of(comLimite(0)));
        assertThat(orcamento.limiteTotal(USUARIO, NOVEMBRO)).isEmpty();

        when(repository.findByUsuarioIdAndMes(USUARIO, "2026-11")).thenReturn(Optional.of(comLimite(-10)));
        assertThat(orcamento.limiteTotal(USUARIO, NOVEMBRO)).isEmpty();
    }

    @Test
    void limiteNaoFinitoEquivaleASemOrcamento() {
        when(repository.findByUsuarioIdAndMes(USUARIO, "2026-11")).thenReturn(Optional.of(comLimite(Double.NaN)));

        assertThat(orcamento.limiteTotal(USUARIO, NOVEMBRO)).isEmpty();
    }
}
