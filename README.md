# W-AI Trading Assistant

Um assistente de trading alimentado por IA que analisa gráficos de criptomoedas usando visão computacional e fornece insights técnicos em tempo real.

## 🚀 Features

- **Análise de Gráficos com IA**: Carregue imagens de gráficos e receba análise técnica instantânea com GPT-4 Vision
- **Gráficos Interativos**: Visualize dados com TradingView Lightweight Charts com múltiplos indicadores (MA10, MA30, MA60)
- **Sinais de Trading**: Receba sinais de compra/venda com níveis de suporte e resistência (Premium)
- **Histórico de Análises**: Acesse suas últimas 3 análises (Free) ou ilimitadas (Premium)
- **Estratégias Personalizadas**: Crie e gerencie estratégias de trading (Premium)
- **Chat com IA**: Converse com assistente de IA sobre trading (Premium)
- **Monetização com Stripe**: Planos semanais ($7.99) e anuais ($39.99)

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS 4
- **Backend**: Express 4 + tRPC 11 + Drizzle ORM
- **Database**: MySQL/TiDB
- **APIs**: OpenAI GPT-4 Vision, Stripe, TradingView Lightweight Charts
- **Testing**: Vitest
- **Deployment**: Vercel + GitHub Actions

## 📋 Pré-requisitos

- Node.js 18+ e pnpm 8+
- Chave de API da OpenAI
- Conta Stripe (para pagamentos)
- Banco de dados MySQL/TiDB

## 🏃 Começando Localmente

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/w-ai-trading.git
cd w-ai-trading
```

### 2. Instale dependências

```bash
pnpm install
```

### 3. Configure variáveis de ambiente

Crie um arquivo `.env.local`:

```env
DATABASE_URL=mysql://user:password@localhost:3306/w_ai_trading
JWT_SECRET=seu-secret-aleatorio-aqui
VITE_APP_ID=seu-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_OPEN_ID=seu-owner-id
OWNER_NAME=Seu Nome
VITE_APP_TITLE=W-AI Trading Assistant
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 4. Configure o banco de dados

```bash
pnpm db:push
```

### 5. Inicie o servidor de desenvolvimento

```bash
pnpm dev
```

Acesse http://localhost:5173

## 🧪 Testes

Execute os testes com:

```bash
pnpm test
```

Para modo watch:

```bash
pnpm test:watch
```

## 🏗️ Build

Para produção:

```bash
pnpm build
pnpm preview
```

## 📦 Estrutura do Projeto

```
w-ai-trading/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── lib/           # Utilitários e hooks
│   │   └── App.tsx        # Componente raiz
│   └── index.html
├── server/                 # Backend Express + tRPC
│   ├── routers.ts         # Procedures tRPC
│   ├── db.ts              # Query helpers
│   └── _core/             # Framework interno
├── drizzle/               # Schema e migrations
├── shared/                # Código compartilhado
├── storage/               # Helpers S3
├── vercel.json            # Configuração Vercel
├── .github/workflows/     # GitHub Actions
└── package.json
```

## 🚀 Deployment

### GitHub

1. Crie um repositório no GitHub
2. Configure os secrets necessários (ver DEPLOYMENT.md)
3. Faça push do código

```bash
git remote add origin https://github.com/seu-usuario/w-ai-trading.git
git branch -M main
git push -u origin main
```

### Vercel

1. Conecte seu repositório GitHub ao Vercel
2. Configure as variáveis de ambiente no painel Vercel
3. O deployment automático será acionado a cada push para `main`

Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para instruções detalhadas.

## 📚 Documentação

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guia completo de deployment
- [API.md](./API.md) - Documentação da API tRPC
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitetura do sistema

## 🔑 Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|----------|-----------|------------|
| `DATABASE_URL` | String de conexão MySQL | Sim |
| `JWT_SECRET` | Secret para assinar JWTs | Sim |
| `OPENAI_API_KEY` | Chave API OpenAI | Sim |
| `STRIPE_SECRET_KEY` | Chave secreta Stripe | Sim |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Chave pública Stripe | Sim |

## 🤝 Contribuindo

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Ver [LICENSE](./LICENSE) para mais detalhes.

## 💬 Suporte

Para suporte, abra uma issue no GitHub ou entre em contato através de [support@w-ai.com](mailto:support@w-ai.com).

## 🙏 Agradecimentos

- OpenAI pela API GPT-4 Vision
- TradingView pelos Lightweight Charts
- Stripe pela integração de pagamentos
- Comunidade de trading por feedback e sugestões
