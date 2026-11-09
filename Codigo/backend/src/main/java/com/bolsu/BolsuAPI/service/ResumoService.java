package com.bolsu.BolsuAPI.service;

import com.bolsu.BolsuAPI.dto.ResumoMensalDTO;
import com.bolsu.BolsuAPI.dto.ResumoMensalDTO.CategoriaTotal;
import com.bolsu.BolsuAPI.dto.ResumoMensalDTO.Orcamento;
import com.bolsu.BolsuAPI.model.Gasto;
import com.bolsu.BolsuAPI.repository.GastoRepository;
import com.bolsu.BolsuAPI.service.resumo.EntradasDoMes;
import com.bolsu.BolsuAPI.service.resumo.OrcamentoDoMes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ResumoService {

    private static final ZoneId ZONA = ZoneId.of("America/Sao_Paulo");
    private static final String CATEGORIA_PADRAO = "Outros";

    private final GastoRepository gastoRepository;
    private final EntradasDoMes entradasDoMes;
    private final OrcamentoDoMes orcamentoDoMes;
    private final Clock clock;

    @Autowired
    public ResumoService(GastoRepository gastoRepository, EntradasDoMes entradasDoMes, OrcamentoDoMes orcamentoDoMes) {
        this(gastoRepository, entradasDoMes, orcamentoDoMes, Clock.system(ZONA));
    }

    ResumoService(GastoRepository gastoRepository, EntradasDoMes entradasDoMes, OrcamentoDoMes orcamentoDoMes, Clock clock) {
        this.gastoRepository = gastoRepository;
        this.entradasDoMes = entradasDoMes;
        this.orcamentoDoMes = orcamentoDoMes;
        this.clock = clock;
    }

    public YearMonth mesAtual() {
        return YearMonth.now(clock);
    }

    /** Resumo do mês do usuário informado. Só lê dados cujo dono é {@code usuarioId}. */
    public ResumoMensalDTO resumoDoMes(String usuarioId, YearMonth mes) {
        LocalDate hoje = LocalDate.now(clock);
        boolean mesAtual = mes.equals(YearMonth.from(hoje));

        List<Gasto> gastosDoMes = gastoRepository.findByUsuarioIdAndDataGreaterThanEqualAndDataLessThanEqual(
                usuarioId, mes.atDay(1), mes.atEndOfMonth());

        BigDecimal despesas = somar(gastosDoMes);

        var entradas = entradasDoMes.total(usuarioId, mes);
        BigDecimal totalEntradas = entradas.map(e -> dinheiro(e.valor())).orElse(BigDecimal.ZERO);
        BigDecimal saldo = totalEntradas.subtract(despesas);

        Orcamento orcamento = orcamentoDoMes.limiteTotal(usuarioId, mes).stream()
                .mapToObj(limite -> new Orcamento(
                        dinheiro(limite).doubleValue(),
                        despesas.doubleValue(),
                        dinheiro(limite).subtract(despesas).doubleValue()))
                .findFirst().orElse(null);

        int diasRestantes = diasRestantes(mes, hoje);
        BigDecimal gastoDiario = saldo.signum() > 0 && diasRestantes > 0
                ? saldo.divide(BigDecimal.valueOf(diasRestantes), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return new ResumoMensalDTO(
                mes.toString(),
                totalEntradas.doubleValue(),
                entradas.map(EntradasDoMes.Total::estimado).orElse(false),
                despesas.doubleValue(),
                saldo.doubleValue(),
                orcamento,
                porCategoria(gastosDoMes),
                diasRestantes,
                gastoDiario.doubleValue(),
                mesAtual ? variacaoSemanal(usuarioId, hoje) : null);
    }

    private static int diasRestantes(YearMonth mes, LocalDate hoje) {
        YearMonth atual = YearMonth.from(hoje);
        if (mes.isBefore(atual)) return 0;
        if (mes.isAfter(atual)) return mes.lengthOfMonth();
        return mes.lengthOfMonth() - hoje.getDayOfMonth() + 1;
    }

    /** Despesas dos últimos 7 dias contra os 7 dias anteriores, em %. Null sem base de comparação. */
    private Double variacaoSemanal(String usuarioId, LocalDate hoje) {
        LocalDate inicioSemana = hoje.minusDays(6);
        List<Gasto> ultimas = gastoRepository.findByUsuarioIdAndDataGreaterThanEqualAndDataLessThanEqual(
                usuarioId, hoje.minusDays(13), hoje);
        BigDecimal recente = somar(ultimas.stream().filter(g -> !g.getData().isBefore(inicioSemana)).toList());
        BigDecimal anterior = somar(ultimas.stream().filter(g -> g.getData().isBefore(inicioSemana)).toList());
        if (anterior.signum() == 0) return null;
        return recente.subtract(anterior)
                .multiply(BigDecimal.valueOf(100))
                .divide(anterior, 1, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private static List<CategoriaTotal> porCategoria(List<Gasto> gastos) {
        Map<String, BigDecimal> totais = gastos.stream().collect(Collectors.groupingBy(
                g -> g.getCategoria() == null || g.getCategoria().isBlank() ? CATEGORIA_PADRAO : g.getCategoria(),
                Collectors.reducing(BigDecimal.ZERO, g -> dinheiro(g.getValor()), BigDecimal::add)));
        return totais.entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed()
                        .thenComparing(Map.Entry.comparingByKey(Comparator.naturalOrder())))
                .map(e -> new CategoriaTotal(e.getKey(), e.getValue().doubleValue()))
                .toList();
    }

    private static BigDecimal somar(List<Gasto> gastos) {
        return gastos.stream().map(g -> dinheiro(g.getValor())).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static BigDecimal dinheiro(double valor) {
        return BigDecimal.valueOf(valor).setScale(2, RoundingMode.HALF_UP);
    }
}
