# comms-king-app

Sistema multi-agente de comunicação orgânica da King of Languages — squad de social media com 10 agentes especializados, rodando em Claude + GPT via Vercel AI SDK.

## Stack

- **Next.js 16** + Turbopack + App Router (params async)
- **React 19**
- **Tailwind 4** + **shadcn/ui**
- **AI SDK** com routing multi-provider (Anthropic Claude + OpenAI GPT)
- **Supabase** (Postgres `comms.*` schema + Auth + Storage)
- **TipTap** (editor inline de roteiro estilo Notion)
- **Vercel** (deploy + cron)

## Squad de Agentes

| Camada | Agente | Função |
|--------|--------|--------|
| Estratégia | `comms-head` | Orquestrador. Diagnóstico. Gate de marca |
| Estratégia | `comms-million-strategist` | Big Ideas $1M |
| Estratégia | `comms-zeitgeist-hunter` | Pauta cultural + timing |
| Criação | `comms-storyteller-viral` | Hero Brand + 3 Regras + STEPPS |
| Criação | `comms-funnel-curator` | Mix topo/meio/fundo · 70/20/10 |
| Criação | `comms-scriptwriter` | Roteiro final por formato |
| Operacional | `comms-edit-director` | Brief de edição |
| Operacional | `comms-editorial-producer` | Calendário · pauta · scheduling |
| Operacional | `comms-community-manager` | Resposta + inteligência de comunidade |
| Calibração | `comms-analyst-io` | IG insights · inteligência documentada |

Specs completas em [`agents/`](./agents/). Constituição em [`agents/CLAUDE.md`](./agents/CLAUDE.md).

## Skills (knowledge base)

- `comms-strategy-frameworks` — CCO modern role + PESO + Edelman Trust + RACE
- `brand-building-empresa-creator` — Sharp + Ritson + Tay + Jung individuação
- `hero-brand-storytelling` — Donald Miller StoryBrand + Pixar + Campbell + Heath
- `viral-mechanics-advanced` — Berger STEPPS + MrBeast hook + Tay 3 Regras
- `organic-social-playbook` — IG algorithm 2026 + platform-native rules
- Plus 7 skills herdadas do `copy_king_senior` (king-angles, sugarman-copy, hook-selector, etc.)

Ver [`skills/`](./skills/).

## Local dev

```bash
npm install
cp .env.example .env.local  # preencher keys
npm run dev
```

## Deploy

Vercel — deploy automático no push pra `main`.

## Status

F0 em desenvolvimento (semanas 1-2).

- [x] Repo + bootstrap Next 16 + AI SDK + shadcn
- [x] Agents + skills copiados
- [ ] Schema Supabase `comms.*`
- [ ] Agent runner streaming
- [ ] Auth + roles
- [ ] Telas F0 (brief → big ideas → conceito → roteiro)
- [ ] Deploy Vercel preview

## License

Proprietary — King of Languages 2026
