# Asimov Associates 2.0 — Sistema interno do escritório

Sistema web interno (uso em desktop) onde cada processo tem ficha completa, linha do tempo de movimentações datadas, anexos e prazo em destaque. Todos os usuários veem tudo; a diferença entre papéis está na permissão de excluir.

## Direção visual

Neutro com bordô: fundo quase branco (#FAFAF8), texto grafite (#2C2C2A), cinza médio (#5F5E5A) para apoio, bordô (#7B2D3B) apenas em detalhes, ações e alertas, e rosé claro (#F0E7E9) para destaques suaves (ex.: card de prazo vencendo). Tipografia legível para uso o dia inteiro, densidade de informação alta, sem gradientes.

## Backend (Lovable Cloud)

Ativo o backend integrado: banco de dados, login com e-mail e senha, e armazenamento de arquivos com backup.

Tabelas:

- `profiles` — usuário (nome completo, OAB, área de atuação; OAB e área só para advogados)
- `user_roles` — papel (`advogado` / `secretaria`) em tabela separada, por segurança
- `clientes` — nome, CPF, RG, nascimento, telefone, e-mail, endereço
- `processos` — número (imutável), tipo, ação, vara, fase, instância, datas inicial/final, concluído, vencido, valor da causa, próximo prazo, descrição
- `processo_clientes` e `processo_advogados` — vínculos muitos-para-muitos
- `movimentacoes` — data, descrição, autor, data/hora do registro, autor e data/hora da última alteração
- `anexos` — arquivo, nome, data e autor do upload, vinculado a processo **ou** a movimentação

Regras de acesso: leitura total para qualquer usuário autenticado; criação e edição para ambos os papéis; exclusão apenas para advogado (banco e interface). Nada é visível sem login. Anexos em bucket privado com acesso apenas a usuários autenticados.

Campos omitidos nesta versão, conforme sua escolha: empresa/filial e local do arquivo físico.

## Telas

1. **Login / criar conta** — no início o cadastro é aberto: o primeiro usuário entra como advogado; depois os advogados criam os demais acessos.
2. **Painel principal** — faixa de cards numéricos (processos ativos, prazos em 7 dias, concluídos no mês, processos por advogado) e lista de cards de processo ordenada pelo prazo mais próximo. Cards com prazo em menos de 7 dias em destaque bordô. Botões de editar e excluir no card (excluir escondido para a secretária).
3. **Menu lateral fixo** — painel, advogados, processos, clientes, busca, sair.
4. **Cadastro de advogado** — lista + formulário (nome, OAB, área de atuação).
5. **Cadastro de cliente** — lista + formulário com a ficha completa.
6. **Cadastro/edição de processo** — modal com blocos de campos, seleção múltipla de clientes e advogados, chaves de concluído/vencido, área de anexos. Número bloqueado na edição.
7. **Detalhe do processo** — bloco fixo com todos os dados e o próximo prazo em destaque; linha do tempo cronológica com autor e marca de "editado por X em data"; anexos do processo listados à parte dos anexos das movimentações. Ações: nova movimentação, editar movimentação, anexar, editar processo, excluir (advogado).
8. **Busca com filtros** — barra única (número do processo, nome ou CPF do cliente) + filtros de advogado, status e instância + limpar. Resultados no mesmo formato de card.

## Regras aplicadas

- Autoria de movimentações e anexos preenchida automaticamente pelo usuário logado.
- Editar movimentação de qualquer autor grava autor e data da alteração.
- Data final só é usada quando o processo está concluído; "vencido/perdido" só se aplica a concluído.
- Destaque de prazo: próximo prazo dentro de 7 dias (inclusive vencidos).
- Validação de formulários (CPF, e-mail, tamanhos) no cliente e no banco.

## Dados de exemplo

Carrego os exemplos da especificação (processos 10 e 11, advogados Rodrigo e José, clientes Diego e Carlos, mais algumas movimentações) para o painel já nascer com conteúdo. Podem ser apagados depois.

## Ordem de construção

1. Backend: tabelas, papéis, políticas de acesso, bucket de anexos, dados de exemplo.
2. Design system em bordô/neutro + layout com menu lateral e proteção de rotas.
3. Login e cadastro inicial.
4. Clientes e advogados.
5. Processos: modal de cadastro/edição e painel principal com cards e destaque de prazo.
6. Detalhe do processo: linha do tempo, movimentações e anexos.
7. Busca com filtros.
