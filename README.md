# LUME CREATORS

## VSL exclusiva após o quiz

O quiz salva o creator e recebe um token de acesso validado pelo backend. Em seguida, o navegador substitui a landing pela rota `/vsl/`. Essa página carrega somente `vsl.css` e `vsl.js`, sem menu, FAQ, quiz ou seções da landing. O token é mantido em `sessionStorage`; a URL não contém Instagram nem dados pessoais.

O MP4 libera RECEBER MEU BRIEFING após 80% assistido. O botão abre a oferta opcional de R$14 em modal. Recusar abre o WhatsApp da campanha com o Instagram; comprar abre diretamente o checkout existente da Zuptos. Os eventos ficam associados ao creator e são deduplicados no banco.

Conforme orientação do proprietário, pagamentos não são registrados no painel LUME. A notificação de venda foi configurada diretamente entre checkout e Pushcut. Não há webhook de pagamento nem nova variável obrigatória. O Pushcut de novos creators continua usando `PUSHCUT_WEBHOOK_URL` no backend.

Novas tabelas: `creator_flow_tokens` (hash do token por creator) e `creator_events` (eventos únicos por creator). Criação incremental por `CREATE TABLE IF NOT EXISTS`, sem apagar dados existentes.

Landing, quiz e painel administrativo no mesmo serviço. A landing fica em `/` e o painel em `/admin/`. O painel só é servido depois de autenticação com e-mail e senha. Configurações, candidaturas, controle de creators e MP4 ficam no disco do servidor, não só no navegador.

## Rodar localmente

Requer Python 3.11+.

```bash
pip install -r requirements.txt
```

No Windows, para testar apenas neste computador:

```bat
set LUME_DEV_HTTP=1
python server.py
```

Abra `http://127.0.0.1:8765/`. O painel fica em `http://127.0.0.1:8765/admin/`. No primeiro acesso, o painel abre automaticamente `/admin/setup/`: informe nome, e-mail e uma senha de pelo menos 8 caracteres. Após criar essa primeira conta, o cadastro é encerrado; ninguém pode abrir outra conta apenas preenchendo e-mail e senha. **Não use `python -m http.server`**: ele publica os arquivos estáticos, inclusive os do painel, sem a proteção do servidor.

Se preferir, você também pode criar a primeira conta administrativa pelo terminal, em uma pasta de dados que vai manter:

```bat
set LUME_DEV_HTTP=1
python server.py bootstrap-admin --email voce@exemplo.com
```

O comando solicita uma senha de pelo menos 8 caracteres. Guarde-a em local seguro.

## Painel

- **Visão geral:** total de creators, campanhas em andamento, faturamento informado, pagamentos informados e saldo (faturamento menos pagamentos). Valores são registros manuais, não dados de plataforma de jogos nem comprovantes bancários.
- **Creators:** contatos vindos do quiz e cadastrados manualmente; etapas `novo`, `contatado`, `fechado`, `divulgando`, `concluído`, `não divulgou` e `recusado`. É possível informar depositantes válidos, faturamento, pagamento e notas por pessoa, filtrar, excluir e exportar CSV.
- **Conteúdo da landing:** campanha, textos, FAQ, feedbacks, vídeo e analytics. O site público lê a configuração salva no servidor.
- **Vídeo após o quiz:** o botão de contato aparece depois de 80% do MP4 assistido. A barra usa a duração real do arquivo e o player impede avanço pela interface comum. Use arquivo MP4 ou URL direta de MP4 no painel; players incorporados do Drive, YouTube e Vimeo não permitem verificar esse progresso. Como todo controle feito no navegador, isso não é uma prova inviolável de visualização.
- **Importar contatos locais:** se o navegador usado anteriormente em `http://127.0.0.1:8765` tiver candidaturas antigas no `localStorage`, o painel oferece um botão de importação. É idempotente para registros que tenham ID. Ao abrir o painel pela primeira vez, a configuração local antiga também é importada se o servidor ainda estiver vazio. Dados salvos sob `file://` ou outra origem não são transferidos automaticamente.
- **Funil e ranking:** o dashboard permite escolher hoje, 7 dias, 30 dias ou todo o período. O funil conta uma vez cada etapa por sessão de navegador, a partir da instalação desta versão; não reconstrói visitas antigas. As etapas da oferta são caminhos opcionais, separadas do avanço principal. O ranking usa depositantes válidos, com receita como desempate; também permite ordenar por receita ou saldo. Receita, pagamentos e depositantes são lançados manualmente no CRM.

## Pushcut e analytics

Crie no aplicativo Pushcut uma notificação para novos creators e copie a URL secreta de webhook da notificação (`https://api.pushcut.io/…/notifications/…`). Configure **`PUSHCUT_WEBHOOK_URL` como variável de ambiente secreta** no serviço Vercel (Production) ou Render. Não grave a URL no código, no GitHub ou no painel. O título e o texto dinâmicos enviados pelo servidor exigem um plano Pushcut que suporte esses campos; sem esse recurso, configure título e texto padrão no próprio Pushcut. O servidor aceita apenas URLs HTTPS do domínio `api.pushcut.io`. A variável é opcional: sem ela, o cadastro e o dashboard continuam funcionando.

Ao concluir o quiz, o lead é salvo com ID idempotente. Depois da resposta, o servidor tenta enviar a notificação. Falhas não bloqueiam o quiz: ficam registradas em `notification_outbox` e são tentadas novamente em novas entradas (até cinco tentativas). Confira os logs do servidor se as notificações não chegarem. O primeiro envio precisa de uma notificação existente e URL correta; a implementação não cria uma notificação Pushcut por você.

Os eventos públicos são enviados em lotes para `/api/events` e salvos em `funnel_events` sem Instagram, respostas, IP ou identificadores de anúncios. Cada etapa conta no máximo uma vez por sessão. Eventos disponíveis: `page_view`, `hero_cta_clicked`, `quiz_started`, `quiz_question_1` a `quiz_question_4`, `quiz_completed`, `profile_analysis_started`, `profile_preselected`, `vsl_view`, `vsl_started`, `vsl_25`, `vsl_50`, `vsl_75`, `vsl_80`, `vsl_completed`, `briefing_unlocked`, `whatsapp_intent`, `analysis_offer_view`, `analysis_offer_buy`, `analysis_offer_decline` e `whatsapp_clicked`. O envio para GA4/Meta e os eventos legados do navegador permanecem. As tabelas novas são criadas com `CREATE TABLE IF NOT EXISTS` no primeiro acesso; nenhum dado antigo é apagado. Faça backup do banco antes de atualizar a produção.

Não coloque senhas ou dados pessoais de creators no repositório. `data/` está no `.gitignore`. Faça backup regular de `data/lume.sqlite3` e `data/campaign.mp4` (se existir). Para SQLite com WAL ativo, prefira um backup pelo método de backup do SQLite ou pare o serviço antes de copiar o banco.

## Publicar na Vercel usando GitHub

Este projeto é detectado como FastAPI em `server.py` e executado como **uma Vercel Function**. Landing (`/`), quiz (`/api/leads`) e painel (`/admin/`) continuam no mesmo domínio. Os arquivos do painel permanecem protegidos pelas rotas Python; não mova `admin/` para `public/`.

**Plano:** a Vercel restringe o plano Hobby gratuito a uso pessoal/não comercial. Para a operação comercial da LUME, confira o plano adequado antes do deploy: [termos da Vercel](https://vercel.com/legal/terms). O GitHub guarda o código; não substitui o banco nem o armazenamento do vídeo.

### Variáveis de ambiente na Vercel

| Variável | Quando usar | Valor |
| --- | --- | --- |
| `DATABASE_URL` | Obrigatória | URL `postgresql://...` de um PostgreSQL externo persistente, preferencialmente a conexão com pool do provedor. Marque como segredo na Vercel. |
| `LUME_SETUP_TOKEN` | Obrigatória somente se criar uma conta nova | Chave aleatória com pelo menos 24 caracteres. Use apenas até concluir `/admin/setup/` e depois remova. Não é necessária se migrar um administrador existente. |
| `LUME_VIDEO_URL` | Opcional | URL HTTPS direta do MP4 já hospedado em armazenamento externo. Mantém funcionando configurações antigas que usavam `mp4-upload`, redirecionando `/media/campaign.mp4` para essa URL. |
| `PUSHCUT_WEBHOOK_URL` | Opcional | URL secreta da notificação Pushcut de novos creators. Configure só em Production. |

Não configure `LUME_DEV_HTTP=1` na Vercel. `VERCEL` é definido pela plataforma. `LUME_DATA_DIR` não é usado no deploy Vercel. Configure os segredos somente no ambiente **Production**; previews públicos não devem compartilhar o banco de produção. Se precisar testar previews, use outro banco e outra chave.

### O que precisa sair do disco local

| Origem local | Destino | Observação |
| --- | --- | --- |
| `data/lume.sqlite3` → `admin_users` | PostgreSQL | Contas, hashes de senha e bloqueios. Não copie sessões antigas. |
| `data/lume.sqlite3` → `config` | PostgreSQL | Campanha, copy editada no painel, FAQ, feedbacks, VSL e IDs de analytics. |
| `data/lume.sqlite3` → `creators` | PostgreSQL | Candidaturas do quiz, status, notas e valores informados manualmente. São dados pessoais: migre de modo controlado. |
| `data/campaign.mp4` | Armazenamento externo de vídeo/objetos | Não está no Git e não cabe em upload local de Vercel Function. Use URL HTTPS direta no painel ou `LUME_VIDEO_URL`. |
| `sessions` | Não migrar | Todos entram novamente no painel depois da migração. |

Os bancos em `data/test-*` e `data/audit` não fazem parte da produção. O script `scripts/migrate_sqlite_to_postgres.py` mostra primeiro as contagens sem enviar dados. Com `DATABASE_URL` configurada **somente no ambiente do seu terminal**, rode:

```bash
pip install -r requirements.txt
python scripts/migrate_sqlite_to_postgres.py
python scripts/migrate_sqlite_to_postgres.py --apply
```

O destino deve estar **vazio**: o script cancela se já houver administrador, configuração ou creators. Ele não imprime senhas, chaves ou contatos, não apaga o SQLite e não copia o MP4. Faça um backup antes de executar. Se preferir começar do zero, não rode a migração; configure `LUME_SETUP_TOKEN` e crie a primeira conta em `/admin/setup/`.

### Deploy

1. Suba **esta pasta como raiz** de um repositório GitHub privado. Confira `git status` antes de enviar: `data/`, `.env` e chaves não podem aparecer. Não arraste a pasta inteira no upload pelo navegador, pois isso pode ignorar `.gitignore`.
2. Crie um PostgreSQL persistente fora da Vercel e configure `DATABASE_URL` no projeto Vercel. Se quiser manter os dados locais, rode a migração **antes** de cadastrar novo administrador na versão publicada.
3. Hospede o MP4 em armazenamento externo e configure `LUME_VIDEO_URL` ou selecione **URL direta de MP4** no painel. Na Vercel, o campo de upload local fica indisponível de propósito; uploads para disco da função não persistem e o arquivo atual excede o limite de upload da função.
4. Importe o repositório em [vercel.com/new](https://vercel.com/new). Se o repositório contiver outras pastas, selecione esta pasta como **Root Directory**. O preset é `FastAPI` (`vercel.json`); não adicione um build estático nem mova as rotas `/api`.
5. Teste `/`, conclua o quiz, confira o registro em `/admin/`, carregue o MP4 e verifique o botão liberado aos 80%. Só depois conecte o domínio. Até lá, a Vercel fornece uma URL `*.vercel.app`.

Sem `DATABASE_URL`, a Function responde `503` nas rotas que precisam de dados em vez de gravar silenciosamente em um disco temporário. O PostgreSQL precisa aceitar conexões da Vercel; o arquivo local permanece intacto para rollback.

## Publicar sem domínio próprio

O GitHub pode guardar o código em um **repositório privado**, mas **GitHub Pages não publica esta aplicação completa**: ele não executa o servidor Python, nem guarda com segurança as candidaturas, a conta administrativa e o vídeo enviado pelo painel. Não abra o painel como arquivos estáticos nem publique `data/`, bancos SQLite, vídeos privados ou segredos no repositório. Mantenha a raiz deste projeto como raiz do repositório. Use Git ou GitHub Desktop para enviar os arquivos; ao arrastar arquivos diretamente no navegador, confira manualmente o que será publicado, pois o `.gitignore` não protege esse tipo de upload.

Para manter quiz, vídeo e painel funcionando juntos, é necessário hospedar o serviço e manter seu armazenamento persistente. A configuração abaixo usa Render com serviço e disco pagos; não ative o plano gratuito nessa configuração, pois nele o SQLite e o vídeo enviados seriam perdidos em reinícios ou novas implantações.

`render.yaml` prepara **um** web service que hospeda as duas interfaces, com subdomínio HTTPS `*.onrender.com`, plano pago de entrada e disco persistente de 2 GB. O disco é necessário porque o banco e o MP4 não podem sumir a cada atualização. Não use o plano gratuito com filesystem efêmero para dados de produção.

1. Coloque **esta pasta** como raiz de um repositório Git privado seu. Confirme que `data/` não foi incluída.
2. Conecte o repositório à sua conta Render e crie um **Blueprint** usando `render.yaml`. Confira o custo do serviço e do disco antes de confirmar.
3. Antes de criar a conta, configure no serviço uma variável secreta `LUME_SETUP_TOKEN` com pelo menos 24 caracteres aleatórios. Abra `/admin/setup/` na URL HTTPS atribuída pelo Render e use essa chave no formulário para criar a conta. A chave de configuração é exigida somente fora do ambiente local; não a publique no repositório. Depois da criação, remova a variável do serviço. Como alternativa, crie a primeira conta no **Shell** com `python server.py bootstrap-admin --email SEU_EMAIL`.
4. Confirme a landing em `/`, o login em `/admin/`, envie uma candidatura de teste e confirme que ela aparece em **Creators**. Exclua o contato de teste antes de divulgar.
5. Se havia configuração/contatos no navegador local, faça a importação no painel local e exporte CSV. A versão atual não transfere automaticamente o banco local para o serviço hospedado; para migrar o banco integralmente é preciso fazê-lo de modo controlado no disco persistente do Render.

O servidor usa cookies `HttpOnly`, `SameSite=Strict` e `Secure` em produção, além de CSRF, limitação de tentativas e bloqueio temporário no login. Sem o código adicional, uma senha forte e exclusiva é ainda mais importante. Não defina `LUME_DEV_HTTP=1` em produção. Ative backups externos periódicos e restrinja acesso à sua conta Render com 2FA também.

## Testes

```bash
python -m unittest discover -s tests -v
node --check app.js
node --check admin.js
node --check admin/login.js
node --check admin/setup.js
```
