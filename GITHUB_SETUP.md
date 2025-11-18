# Setup Rápido - GitHub + Vercel

Guia passo a passo para fazer upload do projeto no GitHub e configurar deployment automático no Vercel.

## 🚀 Passo 1: Preparar o Repositório GitHub (5 minutos)

### 1.1 Criar novo repositório no GitHub

1. Acesse [github.com/new](https://github.com/new)
2. Preencha:
   - **Repository name**: `w-ai-trading`
   - **Description**: `AI-powered trading chart analysis tool`
   - **Visibility**: `Public` (ou Private se preferir)
3. Clique em "Create repository"

### 1.2 Fazer push do código

Execute os comandos no seu terminal:

```bash
cd w-ai-trading
git init
git add .
git commit -m "Initial commit: W-AI Trading Assistant"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/w-ai-trading.git
git push -u origin main
```

Substitua `SEU_USUARIO` pelo seu username do GitHub.

## 🔐 Passo 2: Configurar Secrets no GitHub (3 minutos)

1. Acesse seu repositório no GitHub
2. Clique em **Settings** → **Secrets and variables** → **Actions**
3. Clique em "New repository secret"
4. Adicione cada secret abaixo:

| Nome | Valor | Onde Obter |
|------|-------|-----------|
| `OPENAI_API_KEY` | `sk-...` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `DATABASE_URL` | `mysql://...` | Seu provedor de banco (Planetscale, etc) |
| `VITE_APP_ID` | Seu ID | Fornecido pelo Manus |
| `VITE_APP_TITLE` | `W-AI Trading Assistant` | Seu título |
| `VITE_APP_LOGO` | URL do logo | URL pública do seu logo |
| `VERCEL_TOKEN` | `vercel_...` | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | ID da org | Dashboard Vercel |
| `VERCEL_PROJECT_ID` | ID do projeto | Dashboard Vercel (após criar projeto) |

## 🌐 Passo 3: Conectar ao Vercel (5 minutos)

### 3.1 Criar projeto no Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Clique em **Add New...** → **Project**
3. Selecione **Import Git Repository**
4. Procure por `w-ai-trading` e clique em **Import**

### 3.2 Configurar variáveis de ambiente no Vercel

1. Na página do projeto, clique em **Settings** → **Environment Variables**
2. Clique em **Add New**
3. Adicione as variáveis:

```
DATABASE_URL=mysql://user:pass@host/db
JWT_SECRET=seu-secret-aleatorio
VITE_APP_ID=seu-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_OPEN_ID=seu-owner-id
OWNER_NAME=Seu Nome
VITE_APP_TITLE=W-AI Trading Assistant
VITE_APP_LOGO=https://seu-logo-url.png
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=sua-chave
VITE_FRONTEND_FORGE_API_KEY=sua-chave-frontend
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3.3 Salvar IDs do Vercel

Após criar o projeto, copie:
- **VERCEL_ORG_ID**: Encontre em **Settings → General** (Team ID)
- **VERCEL_PROJECT_ID**: Encontre em **Settings → General** (Project ID)

Adicione esses valores como secrets no GitHub (Passo 2).

## ✅ Passo 4: Testar o Deployment (2 minutos)

1. Faça um pequeno commit no GitHub:

```bash
git add .
git commit -m "Configure GitHub and Vercel"
git push
```

2. Acesse seu repositório → **Actions**
3. Veja o workflow `CI/CD Pipeline` em execução
4. Após passar, o Vercel iniciará o build automaticamente
5. Acesse seu projeto Vercel → **Deployments**
6. Aguarde o status "Ready"

## 🎯 Próximos Deploys

Agora é automático! Sempre que você fizer push para `main`:

1. GitHub Actions executa testes
2. Se passar, Vercel faz deploy automático
3. Seu site fica disponível em `https://seu-projeto.vercel.app`

## 🔗 Links Úteis

- [GitHub Docs](https://docs.github.com)
- [Vercel Docs](https://vercel.com/docs)
- [GitHub Actions](https://docs.github.com/en/actions)

## 🆘 Troubleshooting

### Build falha no Vercel

1. Clique em **Deployments** → **Failed**
2. Clique em **View logs**
3. Procure por erros de variáveis de ambiente ou dependências

### GitHub Actions não roda

1. Acesse **Settings → Actions → General**
2. Verifique se "Actions permissions" está habilitado

### Webhook Stripe não funciona

1. Configure em [Stripe Dashboard](https://dashboard.stripe.com)
2. URL: `https://seu-projeto.vercel.app/api/stripe/webhook`
3. Copie o Signing Secret como `STRIPE_WEBHOOK_SECRET`

## 🗄️ Supabase (Banco de Dados PostgreSQL hospedado)

Se você pretende usar Supabase como backend de banco de dados, adicione as variáveis abaixo no Vercel / GitHub Secrets e localmente em um arquivo `.env` (não commitá-lo).

```
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key> # servidor (privado)
SUPABASE_ANON_KEY=<your-anon-key> # opcional, público
```

No servidor (backend) prefira usar `SUPABASE_SERVICE_ROLE_KEY`. Nunca exponha esta chave em código cliente ou em repositórios públicos.

Localmente, copie `.env.example` para `.env` e preencha os valores.

## 📞 Suporte

Se tiver problemas:
1. Verifique os logs no GitHub Actions
2. Verifique os logs no Vercel
3. Abra uma issue no repositório
