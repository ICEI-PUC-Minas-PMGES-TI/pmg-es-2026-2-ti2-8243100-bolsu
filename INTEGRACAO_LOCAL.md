# Integração local da Sprint 2 — Bolsu

Responsável: Emanuel Phillipe. Branch: `integracao/sprint-2`.

## Origem e limites

Integração criada a partir da referência local `origin/main` (94acab2), preservando por merges o histórico dos seis participantes. Não houve push, publicação ou alteração do banco de dados. As referências usadas são as já disponíveis no checkout original; nenhum fetch do GitHub foi realizado.

Branches incorporadas: `emanuel/autenticacao`, `gastos-giovanna`, `home-visao-geral-diego`, `metas-missoes-nubia`, `orcamento-maria`, `gastos-compartilhados-gabriela`. A branch `giovanna` já é ancestral de `gastos-giovanna`.

## Resultado

- JWT e configuração de segurança preservados; somente login, cadastro e documentação são públicos na API.
- Login e cadastro no frontend, perfil real, logout, validação de sessão e proteção central das páginas internas.
- Renderização inicial não acessa armazenamento do navegador nem monta páginas privadas antes de validar a sessão.
- Cliente HTTP único para gastos e missões, com Bearer e tratamento de 401. Respostas atrasadas de uma sessão anterior não encerram a sessão nova.
- Sessão por aba em `sessionStorage`; recarregar revalida `/users/current`. Logout cancela consultas e limpa o cache do React Query. A expiração do JWT também é observada na interface; a validação definitiva ocorre na API.
- Gastos vinculados ao ID do token. Listagem, resumo e exclusão filtrados pelo proprietário. O frontend não escolhe o dono.
- Consulta, edição e exclusão de outras contas bloqueadas; `/users` retorna apenas a própria conta. Senhas não são serializadas.
- Cadastro de gastos conectado ao backend, com estados de salvamento/erro e atualização do cache.
- Menus duplicados removidos, rotas regeneradas e dependências conciliadas. Animações simples do início usam CSS com respeito a movimento reduzido. Actuator, sem uso funcional no projeto, removido.
- Dados de demonstração não são usados automaticamente quando a API de gastos falha ou retorna vazio.

## Funcionalidades ainda demonstrativas

A integração preserva o estágio de cada entrega; não cria módulos de negócio ausentes nas branches:

| Área | Situação |
| --- | --- |
| Gastos e cadastro de gastos | API autenticada, persistência e isolamento por usuário |
| Perfil | Consulta dos dados reais da conta |
| Missões | Catálogo real autenticado; nível, moedas e progresso ainda não implementados |
| Efeito formatura | Simulação local protegida |
| Início | Nome da conta real; indicadores financeiros de exemplo identificados |
| Orçamento | Valores de exemplo e alterações em memória, identificados na tela |
| Compartilhados | Protótipo em memória, sem persistência, convites ou acesso entre contas |

Quando o backend de grupos for construído, cada operação deverá validar a participação do usuário no grupo. Até lá não existe API de compartilhamento liberada.

## Dados legados

Gastos antigos sem `usuarioId` deixam de aparecer nas consultas autenticadas. Não foram apagados nem atribuídos automaticamente. Antes de reutilizar esses registros, mapear o proprietário correto e executar uma migração revisada. Isso evita entregar dados históricos de uma pessoa a outra.

A implementação JWT existente gera a chave ao iniciar o backend: reiniciar a API invalida os tokens anteriores. Antes de uma implantação com múltiplas instâncias, configurar uma chave persistente por ambiente. Não há refresh token ou revogação antecipada de JWT; o logout remove a sessão do navegador.

## Executar localmente

Backend (JDK 25):

```bash
cd Codigo/backend
cp src/main/resources/application.properties.example src/main/resources/application.properties
# Definir MONGODB_URI no ambiente com a conexão apropriada.
bash mvnw spring-boot:run
```

Frontend (Node 24 para os testes):

```bash
cd Codigo/frontend
cp .env.example .env
npm ci
npm run dev
```

Frontend padrão: `http://localhost:3000`. API: `http://localhost:8080`. CORS aceita localhost e 127.0.0.1 na porta 3000. Ajustar explicitamente as origens caso mude a porta.

## Validação

- Backend: 21 testes aprovados, incluindo JWT inválido/expirado, preflight, isolamento de contas e gastos. Banco/repositórios simulados nos testes de autorização.
- Frontend: 6 testes do cliente HTTP e sessão aprovados.
- TypeScript e build de produção de cliente e servidor aprovados.
- O mecanismo de mocks por subclasses evita autoanexação de agentes no JDK 25.
- Não foi executado um fluxo completo com MongoDB real nem conferência visual pelo navegador: a conexão ao servidor local não ficou acessível ao navegador deste ambiente.

Comandos reproduzíveis:

```bash
cd Codigo/backend
bash mvnw test
cd ../frontend
npm test
npm run typecheck
npm run build
```

Antes de levar à main, validar manualmente cadastro, login, recarga, navegação em todas as telas e logout com duas contas em um banco de testes. Confirmar que os gastos da conta A não aparecem na B. Revisar os módulos demonstrativos com seus responsáveis.

## Importar o resultado no checkout original

A cópia de trabalho foi isolada porque o ambiente só permite escrita no backend do checkout original. O arquivo `Codigo/backend/bolsu-integracao.bundle` contém a branch e seus commits locais. A partir da raiz do checkout original:

```bash
git bundle verify Codigo/backend/bolsu-integracao.bundle
git fetch Codigo/backend/bolsu-integracao.bundle integracao/sprint-2:integracao/sprint-2
git switch integracao/sprint-2
```

Esse fetch lê um arquivo local, sem acessar o GitHub. Não remove nem altera a branch `emanuel/autenticacao`. Revisar o diff com `git diff main...integracao/sprint-2` antes do merge local futuro. O bundle não precisa ser versionado.
