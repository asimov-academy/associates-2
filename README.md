# Process Hub

Especificação: Asimov Associates 2.0

Documento gerado a partir de entrevista. Cole na ferramenta de desenvolvimento (Lovable, Claude Code, v0) como contexto inicial do projeto.

1. Visão e problema

Nome provisório: Asimov Associates 2.0

Declaração de problema: Hoje a informação dos processos do escritório está espalhada entre planilhas, cadernos de papel, arquivos físicos e conversas informais entre os advogados do grupo. Quando um cliente liga perguntando sobre o andamento do processo dele, os advogados até sabem onde procurar, mas a informação está fragmentada e leva tempo demais para ser reunida. O cliente fica esperando na linha e nem sempre recebe resposta. As consequências principais não são perda de prazo, e sim retrabalho e a incapacidade de responder com segurança sobre o histórico de um processo.

Proposta de valor: Um sistema interno único onde cada processo tem uma linha do tempo completa de movimentações datadas, o status atual, a fase, a instância e o próximo prazo processual. Qualquer advogado ou a secretária consegue abrir o processo e ver todo o histórico do que já aconteceu, inclusive dos processos conduzidos pelos colegas. Prazos que vencem em menos de 7 dias aparecem destacados no painel principal.

Caso de uso principal:

O advogado faz login e cai no painel principal.

Na faixa superior vê os números do escritório e, na lista abaixo, os processos ordenados pelo prazo mais próximo, com os de menos de 7 dias destacados.

Um cliente liga perguntando sobre o processo dele. O advogado busca pelo número do processo, pelo nome do cliente ou pelo CPF.

Abre a tela de detalhe do processo, lê o histórico completo de movimentações e o prazo mais próximo, e responde ao cliente na hora.

Ao final do atendimento ou após uma diligência, registra uma nova movimentação na linha do tempo e atualiza a fase ou o status do processo, anexando arquivos quando necessário.

Fora de escopo:

Acesso do cliente ao sistema. A aplicação é exclusivamente de uso interno do escritório.

Notificações externas de prazo (e-mail, SMS, push). O alerta de prazo é apenas visual, dentro do painel.

Marcação de sigilo ou segredo de justiça. Como o uso é interno e todos veem tudo, não há controle de sigilo entre usuários.

Integração com tribunais ou captura automática de movimentações. Todo lançamento é manual.

Uso otimizado para celular. O uso previsto é em computador.

2. Usuários e papéis

Personas:

Samuel, advogado. Sócio do escritório, tem sua área de atuação definida. Trabalha no computador do escritório. Objetivo no app: consultar o histórico completo de qualquer processo, seu ou dos colegas, acompanhar prazos próximos e manter os processos atualizados.

Rodrigo, advogado. Mesmo perfil e mesmas permissões de Samuel, com sua própria área de atuação.

Juliano, advogado. Mesmo perfil e mesmas permissões de Samuel, com sua própria área de atuação.

Letícia, secretária. Atende o telefone e dá suporte administrativo. Trabalha no computador do escritório. Objetivo no app: consultar rapidamente o andamento de um processo para responder ao cliente, cadastrar processos novos e atualizar informações.

Papéis do sistema:

Advogado

Visualizar todos os processos, clientes, advogados e movimentações do escritório, sem restrição.

Criar, editar e excluir processos.

Criar, editar e excluir clientes.

Cadastrar novos advogados no sistema.

Registrar movimentações na linha do tempo.

Editar movimentações lançadas por qualquer advogado, inclusive as de outros usuários, com registro obrigatório da alteração.

Anexar e remover arquivos.

Secretária

Visualizar todos os processos, clientes, advogados e movimentações do escritório, sem restrição.

Criar e editar processos.

Criar e editar clientes.

Registrar movimentações na linha do tempo.

Anexar arquivos.

Não pode excluir nada e não pode executar nenhuma outra operação destrutiva ou de manipulação do sistema.

Regras de visibilidade: Não há segmentação de visibilidade. Todos os usuários, advogados e secretária, veem todos os processos, clientes e movimentações do escritório. A diferença entre os papéis está apenas na permissão de exclusão.

Administração: Não existe hierarquia entre os advogados. Todos os advogados têm o mesmo nível. O primeiro usuário cria os acessos iniciais e, a partir daí, qualquer advogado pode cadastrar novos advogados.

Escala e dispositivo: 4 usuários iniciais (3 advogados e 1 secretária). Uso exclusivo em computador desktop, cada usuário com sua própria máquina no escritório. Volume de processos: A DEFINIR.

3. Telas e funcionalidades da v1

Telas:

3.1 Login

Objetivo: identificar o usuário. A identidade do usuário logado é usada para registrar automaticamente a autoria de movimentações e alterações.

Elementos: campo de identificação, campo de senha, botão de entrar.

Ações: autenticar.

3.2 Painel principal

Objetivo: dar o panorama do escritório e mostrar o que exige ação imediata, na mesma tela.

Elementos:

Faixa superior com cards numéricos: total de processos ativos, prazos vencendo em 7 dias, processos concluídos no mês, processos por advogado.

Abaixo, lista de cards de processo ordenada pelo prazo mais próximo.

Cada card de processo exibe: número do processo, ação, instância, fase, datas inicial e final, descrição, cliente, advogado responsável, status (Em andamento ou Concluído) e resultado (Vencido, Perdido ou Em andamento), com indicadores visuais.

Processos com prazo em menos de 7 dias recebem destaque visual evidente no card.

Cada card tem os botões de editar e excluir. O botão de excluir não aparece para o papel de secretária.

Ações: abrir detalhe do processo, editar processo, excluir processo (apenas advogado).

3.3 Menu lateral

Objetivo: navegação fixa.

Elementos: acesso ao painel principal, cadastro de advogado, cadastro de processo, cadastro de cliente e busca.

3.4 Cadastro de advogado

Objetivo: registrar os advogados do escritório.

Elementos: formulário com nome, número da carteira da OAB e área de atuação.

Ações: criar, editar, excluir (apenas advogado), listar.

3.5 Cadastro de cliente

Objetivo: manter a ficha própria de cada cliente, reaproveitável em vários processos.

Elementos: formulário com nome completo, CPF, RG, data de nascimento, telefone, e-mail e endereço.

Ações: criar, editar, excluir (apenas advogado), listar.

3.6 Cadastro e edição de processo

Objetivo: criar e manter a ficha completa do processo. Abre em janela modal.

Elementos: formulário com todos os campos descritos na seção 4, organizados em blocos. Tipo de processo, ação, empresa ou filial e local do arquivo físico como listas de seleção. Vara, fase e instância como seleção única. Concluído e vencido como chaves liga e desliga. Seleção múltipla de advogados responsáveis e de clientes. Campo de descrição em texto livre. Área de anexos.

Regra: em modo de edição, o número do processo não pode ser alterado.

Ações: salvar, cancelar.

3.7 Detalhe do processo

Objetivo: mostrar tudo que se sabe sobre um processo. É a tela central do sistema.

Elementos:

Bloco superior fixo com os dados do processo: número, cliente ou clientes, advogado ou advogados responsáveis, tipo, ação, vara, fase, instância, valor da causa, local do arquivo físico, datas e próximo prazo processual em destaque.

Linha do tempo de movimentações em ordem cronológica, cada uma com data, descrição, autor do registro e, quando houver, marca de que foi alterada, com autor e data da alteração.

Anexos do processo, listados separadamente dos anexos vinculados a movimentações.

Ações: registrar nova movimentação, editar movimentação existente, anexar arquivo ao processo, anexar arquivo a uma movimentação, editar o processo, excluir o processo (apenas advogado).

3.8 Busca com filtros

Objetivo: encontrar um processo rapidamente durante o atendimento. Versão simplificada e moderna.

Elementos:

Barra de busca única no topo que aceita número do processo, nome do cliente ou CPF do cliente.

Três seletores de filtro ao lado: advogado, status (Em andamento, Concluído, Todos) e instância (1ª, 2ª, Todas).

Botão de limpar filtros.

Resultados exibidos no mesmo formato de card do painel principal.

Ações: buscar, filtrar, limpar, abrir detalhe do processo.

Fluxo de primeiro acesso:

O primeiro usuário cria os acessos do escritório.

Cadastra os advogados com nome, OAB e área de atuação.

Cadastra o acesso da secretária.

Cadastra os clientes.

Cadastra os processos existentes, vinculando clientes e advogados responsáveis.

Passa a usar o painel principal como tela inicial diária.

Fluxo principal de uso diário:

Login.

Painel principal: leitura dos números e verificação dos processos com prazo em menos de 7 dias, destacados.

Ao receber uma ligação de cliente: busca por número, nome ou CPF.

Abertura do detalhe do processo e leitura da linha do tempo e do próximo prazo.

Resposta ao cliente.

Registro de nova movimentação com data e descrição, anexando arquivo quando houver.

Atualização da fase, do status ou do próximo prazo, se mudou.

Incluído na v1: Tudo descrito acima. Login com papéis, cadastro de advogado, cadastro de cliente, cadastro e edição de processo, detalhe do processo com linha do tempo, registro e edição de movimentações com rastro de autoria, upload de anexos no processo e nas movimentações, painel principal com cards numéricos e lista de processos com destaque de prazo, e busca com filtros.

Adiado para versões futuras:

Filtros adicionais na busca por fase e tipo de processo.

Notificação de prazo por e-mail ou fora do painel.

Acesso do cliente.

Uso em celular.

Critério de sucesso da v1: Após uma semana de uso, os processos estão atualizados e de fácil visualização para os três advogados e para a secretária, e qualquer pergunta de cliente sobre o histórico de um processo é respondida durante a própria ligação.

4. Modelo de dados

Entidades:

Advogado

Nome completo, texto, obrigatório

Número da carteira da OAB, texto, obrigatório

Área de atuação, lista de seleção, obrigatório. Valores: Cível, Criminal, Trabalhista, Previdenciário, Vara de Família

Credenciais de acesso, obrigatório

Papel, fixo como Advogado

Secretária

Modelada como um usuário com papel Secretária. Nome completo, texto, obrigatório. Credenciais de acesso, obrigatório.

Observação de implementação: recomenda-se uma única entidade Usuário com campo de papel (Advogado ou Secretária) e os campos de OAB e área de atuação preenchidos apenas para advogados.

Cliente

Nome completo, texto, obrigatório

CPF, texto, obrigatório

RG, texto, opcional

Data de nascimento, data, opcional

Telefone, texto, opcional

E-mail, texto, opcional

Endereço, texto, opcional

Processo

Número do processo, texto ou número, obrigatório, imutável após a criação

Empresa ou filial, lista de seleção, opcional. Significado exato do campo: A DEFINIR

Tipo de processo, lista de seleção, obrigatório. Valores: Cível, Criminal, Trabalhista, Previdenciário, Família

Ação, lista de seleção, obrigatório. Exemplos coletados: Busca e Apreensão, Consignação

Vara, seleção única, obrigatório. Valores: Civil, Conciliação e Julgamento, Trabalhista, Vara de Família

Fase, seleção única, obrigatório. Valores: Elaboração, Impugnação, Recurso, Execução, Instrução, Suspenso

Instância, seleção única, obrigatório. Valores: 1ª Instância, 2ª Instância

Data inicial, data, obrigatório

Data final, data, opcional. Computada apenas quando o processo está marcado como concluído

Processo concluído, verdadeiro ou falso, obrigatório

Processo vencido ou perdido, verdadeiro ou falso, opcional. Aplicável quando concluído

Valor da causa, valor monetário, opcional

Local do arquivo físico, lista de seleção, opcional

Próximo prazo processual, data, opcional. Base do destaque de menos de 7 dias no painel

Descrição, texto livre, opcional

Movimentação

Data, data, obrigatório

Descrição, texto livre, obrigatório

Autor do registro, referência a Usuário, obrigatório, preenchido automaticamente pelo login

Data e hora do registro, obrigatório, automático

Autor da última alteração, referência a Usuário, opcional, automático

Data e hora da última alteração, opcional, automático

Anexo

Arquivo, upload a partir do computador, obrigatório

Nome do arquivo, texto, automático

Data do upload, automático

Autor do upload, referência a Usuário, automático

Vínculo, obrigatório: pertence a um Processo ou a uma Movimentação

Relacionamentos:

Processo e Cliente: muitos para muitos. Um processo pode ter vários clientes, e um cliente pode ter vários processos.

Processo e Advogado: muitos para muitos. Um processo pode ter mais de um advogado responsável, e um advogado responde por vários processos.

Processo e Movimentação: um para muitos. Cada movimentação pertence a um único processo.

Movimentação e Usuário: muitos para um, tanto para o autor do registro quanto para o autor da alteração.

Anexo e Processo: um para muitos. Um processo pode ter vários anexos gerais.

Anexo e Movimentação: um para muitos. Uma movimentação pode ter vários anexos próprios.

Exemplos de registro:

Processo

Número do processo: 10

Empresa ou filial: Filial Canoas

Tipo de processo: Trabalhista

Ação: Busca e Apreensão

Vara: Trabalhista

Fase: Execução

Instância: 1ª Instância

Data inicial: 10/11/2022

Data final: 03/03/2023

Processo concluído: sim

Processo vencido: sim

Advogado responsável: Rodrigo Pires Vanzelotti

Cliente: Diego Armando Maradona

CPF do cliente: 7423737837

Descrição: Processo corre em segredo de justiça por questões similares

Processo

Número do processo: 11

Tipo de processo: A DEFINIR

Ação: Consignação

Instância: 1ª Instância

Fase: Suspenso

Data inicial: 15/09/2022

Processo concluído: não

Status: Em andamento

Advogado responsável: José Mourinho

Cliente: Carlos Da Silva

Advogado

Nome: Rodrigo Pires Vanzelotti

Número da OAB: A DEFINIR

Área de atuação: Trabalhista

Movimentação

Exemplo real não coletado na entrevista: A DEFINIR. Formato previsto: data, descrição do ato processual, autor derivado do login.

Dados sensíveis: CPF, RG, endereço, data de nascimento e telefone dos clientes, além do conteúdo dos processos e dos anexos. Não há restrição de visibilidade interna: todos os usuários do escritório veem todos os dados. A proteção necessária é contra acesso externo, com autenticação obrigatória em todas as telas. Processos em segredo de justiça não recebem tratamento diferenciado dentro do sistema.

Arquivos e imagens: Processo e Movimentação armazenam anexos, com upload feito a partir do computador do usuário. Tipos de arquivo previstos: documentos PDF e imagens de documentos digitalizados. Limite de tamanho: A DEFINIR.

Retenção: Todas as informações do sistema são consideradas críticas e nenhuma pode ser perdida. É necessário backup de todo o conteúdo, incluindo processos, clientes, movimentações e anexos.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://caseflow-hub-48.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/41863846-58ab-4f2f-a4d3-40748324de5a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
