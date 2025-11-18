# Guia de Deployment - W-AI Trading Assistant

Este documento descreve como fazer deploy da aplicação W-AI Trading Assistant no GitHub e Vercel.

## 📋 Pré-requisitos

- Conta GitHub
- Conta Vercel
- Conta Stripe (para pagamentos)
- Chave de API OpenAI
- Banco de dados MySQL/TiDB (recomendado: Planetscale)

## 🔄 Passo 1: Preparar o Repositório GitHub

### 1.1 Criar repositório no GitHub

1. Acesse [github.com/new](https://github.com/new)
2. Preencha os detalhes:
   - **Repository name**: `w-ai-trading`
   - **Description**: `AI-powered trading chart analysis tool`
   - **Visibility**: Public ou Private
3. Clique em "Create repository"

### 1.2 Fazer push do código

```bash
cd w-ai-trading
git init
git add .
git commit -m "Initial commit: W-AI Trading Assistant"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/w-ai-trading.git
git push -u origin main
```

### 1.3 Configurar Secrets no GitHub

1. Acesse **Settings → Secrets and variables → Actions**
2. Clique em "New repository secret"
3. Adicione os seguintes secrets:

| Secret | Valor |
|--------|-------|
| `OPENAI_API_KEY` | Sua chave de API OpenAI |
| `DATABASE_URL` | String de conexão do banco |
| `VITE_APP_ID` | ID da aplicação |
| `VITE_APP_TITLE` | Título da aplicação |
| `VITE_APP_LOGO` | URL do logo |
| `VERCEL_TOKEN` | Token de acesso Vercel |
| `VERCEL_ORG_ID` | ID da organização Vercel |
| `VERCEL_PROJECT_ID` | ID do projeto Vercel |

## 🚀 Passo 2: Configurar Vercel

### 2.1 Criar projeto no Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Clique em "Add New..." → "Project"
3. Selecione seu repositório GitHub `w-ai-trading`
4. Clique em "Import"

### 2.2 Configurar variáveis de ambiente

1. No painel do projeto Vercel, acesse **Settings → Environment Variables**
2. Adicione as seguintes variáveis:

```env
DATABASE_URL=mysql://user:password@host:3306/database
JWT_SECRET=seu-secret-aleatorio
VITE_APP_ID=seu-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_OPEN_ID=seu-owner-id
OWNER_NAME=Seu Nome
VITE_APP_TITLE=W-AI Trading Assistant
VITE_APP_LOGO=https://seu-logo-url.png
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=sua-chave-api
VITE_FRONTEND_FORGE_API_KEY=sua-chave-frontend
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 2.3 Configurar domínio customizado (opcional)

1. Acesse **Settings → Domains**
2. Clique em "Add"
3. Digite seu domínio (ex: `w-ai.com`)
4. Configure os DNS records conforme instruções

## 🔐 Passo 3: Configurar Stripe

### 3.1 Criar conta Stripe

1. Acesse [stripe.com](https://stripe.com)
2. Crie uma conta e ative o modo teste
3. Copie as chaves:
   - **Publishable Key**: `pk_test_...`
   - **Secret Key**: `sk_test_...`

### 3.2 Configurar Webhook

1. No painel Stripe, acesse **Developers → Webhooks**
2. Clique em "Add endpoint"
3. Configure:
   - **URL**: `https://seu-dominio.vercel.app/api/stripe/webhook`
   - **Events**: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copie o **Signing Secret** (`whsec_...`)

## 🗄️ Passo 4: Configurar Banco de Dados

### 4.1 Usar Planetscale (recomendado)

1. Acesse [planetscale.com](https://planetscale.com)
2. Crie uma nova database
3. Clique em "Connect"
4. Selecione "Node.js" e copie a string de conexão
5. Use como `DATABASE_URL`

### 4.2 Executar migrations

```bash
# Localmente
pnpm db:push

# Ou via Vercel CLI
vercel env pull
pnpm db:push
```

## ✅ Passo 5: Verificar CI/CD

### 5.1 GitHub Actions

1. Acesse seu repositório → **Actions**
2. Você verá o workflow `CI/CD Pipeline` em execução
3. Aguarde a conclusão (deve passar nos testes)

### 5.2 Vercel Deployment

1. Após o GitHub Actions passar, o Vercel iniciará o build automaticamente
2. Acesse **Deployments** no painel Vercel
3. Aguarde o status "Ready"

## 🧪 Passo 6: Testar a Aplicação

### 6.1 Testes locais

```bash
# Instalar dependências
pnpm install

# Executar testes
pnpm test

# Build de produção
pnpm build

# Preview do build
pnpm preview
```

### 6.2 Testar em produção

1. Acesse sua URL do Vercel (ex: `w-ai-trading.vercel.app`)
2. Teste o fluxo completo:
   - Onboarding
   - Upload de imagem
   - Análise com OpenAI
   - Checkout com Stripe
   - Acesso a features premium

## 🔄 Passo 7: Configurar Atualizações Contínuas

### 7.1 Branch protection (opcional)

1. Acesse **Settings → Branches**
2. Clique em "Add rule"
3. Configure:
   - **Branch name pattern**: `main`
   - **Require status checks to pass before merging**: ✓
   - **Require code reviews before merging**: ✓

### 7.2 Auto-deploy

O deploy automático já está configurado:
- Todo push para `main` dispara CI/CD
- Se os testes passarem, o Vercel faz deploy automático
- Branches de feature não fazem deploy automático

## 📊 Monitoramento

### Vercel Analytics

1. Acesse **Analytics** no painel Vercel
2. Monitore:
   - Performance
   - Uptime
   - Erros

### Stripe Dashboard

1. Monitore transações em **Payments**
2. Verifique subscriptions em **Billing**

## 🆘 Troubleshooting

### Build falha no Vercel

1. Verifique os logs: **Deployments → Failed → View logs**
2. Comum:
   - Variáveis de ambiente faltando
   - Dependências não instaladas
   - Erros de TypeScript

### Webhook Stripe não funciona

1. Verifique o Signing Secret está correto
2. Teste o webhook: **Developers → Webhooks → Send test event**
3. Verifique os logs da função serverless

### Banco de dados não conecta

1. Verifique `DATABASE_URL` está correto
2. Teste a conexão localmente: `pnpm db:push`
3. Verifique firewall/IP whitelist do banco

## 📈 Próximos Passos

1. **Monitorar performance**: Use Vercel Analytics e Sentry
2. **Configurar CDN**: Cloudflare para melhor performance
3. **Backup automático**: Configure backups do banco de dados
4. **Alertas**: Configure alertas para erros e downtime

## 🔗 Recursos Úteis

- [Documentação Vercel](https://vercel.com/docs)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Stripe API](https://stripe.com/docs/api)
- [OpenAI API](https://platform.openai.com/docs)
- [Planetscale Docs](https://planetscale.com/docs)

## 📞 Suporte

Para problemas com deployment, abra uma issue no GitHub ou entre em contato.
