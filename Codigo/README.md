# Código do Projeto Bolsu

Aplicação web de controle financeiro para universitários. O código está dividido em duas partes independentes:

| Pasta | O que é | Tecnologias |
| --- | --- | --- |
| [`backend/`](backend) | API RESTful (BolsuAPI) | Java 25, Spring Boot 4, Spring Security (JWT), MongoDB, Springdoc/Swagger |
| [`frontend/`](frontend) | Aplicação web (SSR) | React 19, TanStack Start/Router/Query, TypeScript, Tailwind CSS 4, Vite |

O front end consome a API por HTTP com autenticação Bearer. O banco é o MongoDB (não relacional).

## Como executar

### Pré-requisitos

- JDK 25 (o `mvnw` já acompanha o projeto, não é preciso instalar o Maven)
- Node.js 22.18 ou superior (ou 24)
- Uma instância do MongoDB, local ou no MongoDB Atlas

### Backend

```bash
cd Codigo/backend
cp src/main/resources/application.properties.example src/main/resources/application.properties
export MONGODB_URI="mongodb+srv://usuario:senha@cluster.mongodb.net/"   # PowerShell: $env:MONGODB_URI = "..."
./mvnw spring-boot:run
```

A API sobe em `http://localhost:8080` e a documentação interativa (Swagger) em `http://localhost:8080/docs`.

### Frontend

```bash
cd Codigo/frontend
cp .env.example .env
npm ci
npm run dev
```

A aplicação abre em `http://localhost:3000`.

### Variáveis de ambiente

| Variável | Onde | Descrição | Padrão |
| --- | --- | --- | --- |
| `MONGODB_URI` | backend | String de conexão do MongoDB. O banco usado é `bolsu-db`. | obrigatória |
| `VITE_API_URL` | frontend | URL base da API. | `http://localhost:8080` |

O arquivo `application.properties` com a conexão real não é versionado. Use sempre o `.example` como modelo e nunca publique credenciais.

## Testes

```bash
# Backend (JUnit 5, Mockito, MockMvc)
cd Codigo/backend && ./mvnw test

# Frontend (node:test), checagem de tipos e build
cd Codigo/frontend
npm test
npm run typecheck
npm run build
```

Os testes do backend usam repositórios simulados, então não precisam de MongoDB. Os testes do frontend executam arquivos TypeScript diretamente e exigem Node 22.18 ou superior; em versões anteriores, rode com `NODE_OPTIONS=--experimental-strip-types npm test`.

## Arquitetura do backend

Pacote base: `com.bolsu.BolsuAPI`.

| Pacote | Responsabilidade |
| --- | --- |
| `controller` | Rotas HTTP. Recebem a requisição, obtêm o usuário do token e delegam ao serviço. |
| `service` | Regras de negócio (validações, cálculo de resumos, isolamento por usuário). |
| `service.resumo` | Fontes plugáveis do resumo mensal (`EntradasDoMes`, `OrcamentoDoMes`). |
| `repository` | Acesso ao MongoDB (Spring Data). |
| `model` | Documentos persistidos (`Usuario`, `Gasto`, `Missao`, dados acadêmicos e financeiros). |
| `dto` | Objetos de entrada e saída da API, com validação (`GastoDTO`). |
| `security` | Filtro e utilitário de JWT. |
| `configuration` | Segurança, CORS, OpenAPI e o relógio (`Clock`) da aplicação. |
| `exception` | Exceções de domínio e o tratamento global de erros. |

Decisões que valem conhecer:

- **Isolamento por usuário.** O dono de um recurso vem sempre do token (`Principal`), nunca do corpo ou da URL. Listar, resumir e excluir gastos só alcança registros do próprio usuário.
- **Fuso horário.** Todo cálculo por data usa um único `Clock` no fuso `America/Sao_Paulo`, definido em `ApplicationConfiguration`. Assim o "hoje" e o "mês atual" não dependem do fuso do servidor, que em hospedagem costuma ser UTC.
- **Erros.** O `GlobalExceptionHandler` devolve sempre `{"message": "..."}`, que é o texto exibido na tela. Falhas do banco viram `503`.
- **Valores monetários.** As somas do resumo mensal usam `BigDecimal` com duas casas, para evitar erro de ponto flutuante (por exemplo `0,1 + 0,2`).
- **Extensibilidade do resumo.** O resumo mensal lê entradas e orçamento por interfaces. Para trocar a fonte (por exemplo, ao persistir o orçamento), basta expor um bean `@Primary` que as implemente.

## Autenticação

1. `POST /users` cria a conta e `POST /auth/login` devolve um JWT.
2. As demais rotas exigem o cabeçalho `Authorization: Bearer <token>`.
3. Sem token válido, a API responde `401` com `{"message": "Usuario nao autorizado"}`.

O token vale 10 dias. A chave de assinatura é gerada quando a API inicia, então reiniciar o backend invalida os tokens emitidos antes. O front guarda o token em `sessionStorage` (uma sessão por aba).

## Endpoints

Todas as rotas abaixo, exceto as marcadas como públicas, exigem autenticação. O detalhe completo de cada uma, com exemplos, está no Swagger (`/docs`).

### Autenticação e usuários

| Método | Rota | Descrição |
| --- | --- | --- |
| `POST` | `/auth/login` | Autentica com e-mail e senha e devolve o token. **Pública.** |
| `POST` | `/users` | Cria uma conta. **Pública.** |
| `GET` | `/users/current` | Dados da conta autenticada. |
| `PUT` | `/users/current/registration-configs` | Salva os dados financeiros do cadastro (renda, fontes, objetivos). |
| `GET` | `/users/{id}` | Consulta a própria conta. Outro id retorna `403`. |
| `PUT` | `/users/{id}` | Atualiza a própria conta. |
| `DELETE` | `/users/{id}` | Exclui a própria conta. |

### Gastos

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/gastos` | Lista os gastos do usuário. |
| `POST` | `/gastos` | Registra um gasto. |
| `DELETE` | `/gastos/{id}` | Exclui um gasto do usuário (`404` se não existir ou for de outra pessoa). |
| `GET` | `/gastos/resumo?periodo=semana\|mes\|semestre` | Total e totais por categoria nos últimos 7, 30 ou 180 dias. Padrão: `mes`. |

Corpo do `POST /gastos`:

```json
{
  "categoria": "Alimentação",
  "valor": 25.5,
  "data": "2026-11-18",
  "descricao": "Almoço no RU"
}
```

| Campo | Regra |
| --- | --- |
| `categoria` | Obrigatória, até 50 caracteres. |
| `valor` | Maior que zero e até 999.999.999,99. |
| `data` | Opcional (padrão: hoje). Não pode estar no futuro. |
| `descricao` | Opcional, até 200 caracteres. |

### Resumo mensal (visão geral)

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/resumo?mes=AAAA-MM` | Resumo financeiro do mês. O parâmetro `mes` é opcional (padrão: mês atual). |

Exemplo de resposta:

```json
{
  "mes": "2026-11",
  "entradas": 500.0,
  "entradasEstimadas": true,
  "despesas": 90.0,
  "saldo": 410.0,
  "orcamento": null,
  "categorias": [
    { "nome": "Alimentação", "valor": 70.0 },
    { "nome": "Transporte", "valor": 20.0 }
  ],
  "diasRestantes": 23,
  "gastoDiarioPermitido": 17.83,
  "variacaoSemanal": -40.0
}
```

| Campo | Significado |
| --- | --- |
| `entradas` / `entradasEstimadas` | Total de entradas do mês. `entradasEstimadas` é `true` quando o valor vem da renda informada no cadastro. |
| `saldo` | Entradas menos despesas. Pode ser negativo. |
| `orcamento` | `{limite, consumido, restante}`, ou `null` se o usuário não definiu orçamento. |
| `categorias` | Despesas por categoria, da maior para a menor. Gastos sem categoria entram em "Outros". |
| `diasRestantes` | Dias que faltam no mês, contando hoje. `0` para meses passados. |
| `gastoDiarioPermitido` | Saldo dividido pelos dias restantes. `0` sem saldo positivo ou sem dias. |
| `variacaoSemanal` | Variação percentual das despesas dos últimos 7 dias contra os 7 anteriores. `null` sem base de comparação ou fora do mês atual. |

Um `mes` fora do formato `AAAA-MM` retorna `400` com `{"message": "Informe o mês no formato AAAA-MM"}`.

### Missões

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/api/missoes` | Catálogo de missões ativas. |

## Respostas de erro

Todas as rotas devolvem erros no mesmo formato:

```json
{ "message": "Informe a categoria do gasto" }
```

| Status | Quando |
| --- | --- |
| `400` | Dados ausentes, malformados ou inválidos. Quando há mais de um problema, as mensagens vêm juntas, separadas por `;`. |
| `401` | Token ausente, inválido ou expirado. |
| `403` | Tentativa de acessar a conta de outra pessoa. |
| `404` | Recurso inexistente ou que não pertence ao usuário. |
| `503` | Banco de dados indisponível. |

## Estrutura do frontend

| Caminho | Conteúdo |
| --- | --- |
| `src/routes/` | Uma rota por tela (início, gastos, cadastro de gasto, orçamento, missões, perfil, login, cadastro). O roteamento é por arquivos (TanStack Router). |
| `src/components/` | Componentes compartilhados (layout, formulário de autenticação). |
| `src/lib/api.ts` | Cliente HTTP único: injeta o Bearer, trata `401` e encerra a sessão. |
| `src/lib/auth.tsx` | Contexto de autenticação e proteção das páginas internas. |
| `src/lib/resumo.ts`, `resumo-mes.ts` | Consulta do resumo mensal e funções puras de formatação (testáveis). |
| `tests/` | Testes com `node:test`. |

O cache de dados usa React Query. As consultas de gastos usam chaves que começam por `gastos`, então registrar ou excluir um gasto atualiza também a visão geral.

## Situação das funcionalidades

Consulte [`INTEGRACAO_LOCAL.md`](../INTEGRACAO_LOCAL.md) para o estado de cada módulo (o que já usa a API real e o que ainda é demonstrativo) e as limitações conhecidas.
