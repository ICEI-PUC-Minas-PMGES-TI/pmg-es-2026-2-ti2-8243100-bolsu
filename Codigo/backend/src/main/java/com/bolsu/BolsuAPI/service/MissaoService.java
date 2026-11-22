package com.bolsu.BolsuAPI.service;

import com.bolsu.BolsuAPI.model.ConclusaoMissao;
import com.bolsu.BolsuAPI.model.Missao;
import com.bolsu.BolsuAPI.repository.ConclusaoMissaoRepository;
import com.bolsu.BolsuAPI.repository.MissaoRepository;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MissaoService {
    private static final int ESTRELAS_POR_NIVEL = 5;
    private static final List<Missao> RECORRENTES = List.of(
            recorrente("bolsu-revisar-gastos", "LANCHES", "Revise seus gastos de hoje",
                    "Confira o que você gastou hoje e identifique uma compra que pode evitar amanhã.",
                    "DIARIA", 1, 5),
            recorrente("bolsu-planejar-semana", "GUARDAR", "Planeje sua semana",
                    "Separe um valor para os gastos essenciais e defina quanto quer guardar esta semana.",
                    "SEMANAL", 1, 15),
            recorrente("bolsu-guardar-hoje", "GUARDAR", "Dê mais um passo na sua meta",
                    "Faça hoje um depósito de qualquer valor para uma das suas metas.",
                    "DIARIA", 2, 10),
            recorrente("bolsu-transporte-semana", "TRANSPORTE", "Compare seus custos de transporte",
                    "Compare duas opções de transporte para o seu trajeto nesta semana.",
                    "SEMANAL", 2, 20),
            recorrente("bolsu-planejar-lanche", "LANCHES", "Planeje seu próximo lanche",
                    "Confira o que você já tem em casa e planeje um lanche dentro do seu orçamento para amanhã.",
                    "DIARIA", 3, 15),
            recorrente("bolsu-revisar-assinaturas", "LANCHES", "Revise uma despesa recorrente",
                    "Escolha uma assinatura ou serviço e confira se o uso justifica o valor pago.",
                    "SEMANAL", 3, 25),
            recorrente("bolsu-comparar-precos", "LANCHES", "Compare antes de comprar",
                    "Escolha um item que pretende comprar e compare o preço em duas opções disponíveis.",
                    "DIARIA", 4, 20),
            recorrente("bolsu-planejar-reserva", "GUARDAR", "Dê um destino à sua reserva",
                    "Liste três imprevistos que sua reserva deve cobrir e defina quanto consegue separar nesta semana.",
                    "SEMANAL", 4, 30),
            recorrente("bolsu-calcular-trajeto", "TRANSPORTE", "Calcule o custo do trajeto",
                    "Calcule o custo completo de ida e volta do seu próximo deslocamento e confira se cabe no orçamento.",
                    "DIARIA", 5, 25),
            recorrente("bolsu-analisar-categorias", "LANCHES", "Encontre sua maior categoria de gastos",
                    "Some os gastos da semana por categoria e escolha uma categoria para acompanhar mais de perto.",
                    "SEMANAL", 5, 35),
            recorrente("bolsu-revisar-compra", "LANCHES", "Revise uma compra planejada",
                    "Escolha uma compra que está considerando e anote a necessidade, o custo e o impacto na sua meta.",
                    "DIARIA", 6, 30),
            recorrente("bolsu-revisar-plano-meta", "GUARDAR", "Confira o ritmo da sua meta",
                    "Compare o valor já guardado com o planejado e recalcule quanto precisa guardar até o prazo.",
                    "SEMANAL", 6, 40),
            recorrente("bolsu-planejar-vencimentos", "GUARDAR", "Antecipe o próximo vencimento",
                    "Confira sua próxima conta a vencer e verifique se o dinheiro necessário já está separado.",
                    "DIARIA", 7, 35),
            recorrente("bolsu-planejar-despesa-futura", "GUARDAR", "Prepare uma despesa futura",
                    "Escolha uma despesa prevista para os próximos meses e divida o valor pelos meses restantes.",
                    "SEMANAL", 7, 45),
            recorrente("bolsu-revisar-saldo-planejado", "GUARDAR", "Confira seu saldo comprometido",
                    "Compare seu saldo disponível com as contas que ainda precisa pagar antes da próxima entrada de dinheiro.",
                    "DIARIA", 8, 40),
            recorrente("bolsu-simular-imprevisto", "GUARDAR", "Simule um imprevisto",
                    "Escolha um gasto inesperado possível e descreva como o acomodaria no orçamento da semana.",
                    "SEMANAL", 8, 50),
            recorrente("bolsu-avaliar-alternativa", "LANCHES", "Avalie o custo de uma escolha",
                    "Compare uma compra planejada com uma alternativa e calcule quanto cada opção deixaria para sua meta.",
                    "DIARIA", 9, 45),
            recorrente("bolsu-priorizar-metas", "GUARDAR", "Organize suas prioridades",
                    "Revise seus objetivos financeiros e distribua o valor que pode guardar entre eles nesta semana.",
                    "SEMANAL", 9, 55),
            recorrente("bolsu-revisar-decisao", "GUARDAR", "Revise uma decisão financeira",
                    "Escolha uma decisão financeira de hoje, avalie o efeito no seu plano e anote um ajuste para amanhã.",
                    "DIARIA", 10, 50),
            recorrente("bolsu-balanco-semanal", "GUARDAR", "Faça seu balanço da semana",
                    "Compare receitas, gastos e valor guardado com o planejado e defina um ajuste para a próxima semana.",
                    "SEMANAL", 10, 60));

    private final MissaoRepository missoes;
    private final ConclusaoMissaoRepository conclusoes;

    public MissaoService(MissaoRepository missoes, ConclusaoMissaoRepository conclusoes) {
        this.missoes = missoes;
        this.conclusoes = conclusoes;
    }

    public Painel painel(String usuarioId) {
        LocalDate hoje = LocalDate.now(ZoneId.of("America/Sao_Paulo"));
        List<ConclusaoMissao> historico = conclusoes.findByUsuarioId(usuarioId);
        var idsConcluidos = historico.stream().map(ConclusaoMissao::id).collect(Collectors.toSet());
        int estrelas = historico.size();
        int nivel = 1 + estrelas / ESTRELAS_POR_NIVEL;
        long moedas = historico.stream().mapToLong(ConclusaoMissao::moedas).sum();
        var catalogo = new LinkedHashMap<String, Missao>();
        missoes.findByAtivaTrueOrderByOrdemAscIdAsc().forEach(missao -> catalogo.put(missao.id, missao));
        RECORRENTES.forEach(missao -> catalogo.putIfAbsent(missao.id, missao));
        List<Desafio> desafios = catalogo.values().stream()
                .filter(missao -> missao.nivelMinimo <= nivel)
                .map(missao -> {
                    String periodo = periodo(missao.periodicidade, hoje);
                    return new Desafio(missao, periodo, idsConcluidos.contains(chave(usuarioId, missao.id, periodo)));
                }).toList();
        return new Painel(nivel, estrelas, moedas, ESTRELAS_POR_NIVEL - estrelas % ESTRELAS_POR_NIVEL, desafios);
    }

    public void concluir(String usuarioId, String missaoId, String periodo) {
        Desafio desafio = painel(usuarioId).desafios().stream()
                .filter(item -> item.missao().id.equals(missaoId)).findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Missão indisponível."));
        if (!desafio.periodo().equals(periodo)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "O período da missão mudou. Atualize a lista.");
        }
        if (desafio.concluida()) return;
        try {
            conclusoes.insert(new ConclusaoMissao(chave(usuarioId, missaoId, periodo), usuarioId,
                    Math.max(0, desafio.missao().recompensaMoedas)));
        } catch (DuplicateKeyException ignored) {
            // Outra solicitação já concluiu a mesma missão para esta conta e período.
        }
    }

    static String periodo(String periodicidade, LocalDate hoje) {
        if ("DIARIA".equals(periodicidade)) return hoje.toString();
        if ("SEMANAL".equals(periodicidade)) {
            return "semana-" + hoje.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        }
        return "unica";
    }

    private static String chave(String usuarioId, String missaoId, String periodo) {
        return usuarioId.length() + ":" + usuarioId + ":" + periodo + ":" + missaoId;
    }

    private static Missao recorrente(String id, String tipo, String titulo, String descricao,
                                    String periodicidade, int nivel, int moedas) {
        Missao missao = new Missao();
        missao.id = id;
        missao.tipo = tipo;
        missao.titulo = titulo;
        missao.descricao = descricao;
        missao.periodicidade = periodicidade;
        missao.nivelMinimo = nivel;
        missao.recompensaMoedas = moedas;
        missao.ativa = true;
        return missao;
    }

    public record Desafio(Missao missao, String periodo, boolean concluida) {}
    public record Painel(int nivel, int estrelas, long moedas, int estrelasParaProximoNivel, List<Desafio> desafios) {}
}
