# King Comms System — Squad de Comunicação Orgânica

**Versão:** 0.2 · **Última atualização:** 2026-05-21

> ## 🚨 REGRA #0 — GATE DRA (BLOQUEANTE PRÉ-ENTREGA)
>
> **NENHUM** agente do squad `comms_king` entrega output ao usuário sem passar pelo `copy-rh-director` (DRA) do sistema `copy_king_senior` em **MODO 0 — Validação Pré-Entrega**.
>
> O DRA é gate **BLOQUEANTE**: se reprovar, o output volta pro agente origem corrigir. Só entrega final ao usuário quando DRA emitir veredito **✅ APROVADO PARA ENTREGA**.
>
> Aplica-se a TODO output cliente-facing: campanha publicável, Big Idea, conceito narrativo, calendário editorial, roteiro, brief de edição, playbook de resposta.
>
> **Reports internos NÃO passam por DRA** (reports do `analyst-io`, signals do `community-manager`, briefs intermediários) — eles abastecem outros agentes, não vão ao Daniel direto.
>
> Ver: `../copy_king_senior/agents/copy-rh-director.md` § MODO 0.

### Como invocar o DRA (mecânica concreta)

Quem orquestra (geralmente `comms-head`, mas pode ser qualquer agente que segure o output final) invoca o DRA via tool `Agent`:

```
Agent({
  subagent_type: "copy-rh-director",
  description: "Validação Pré-Entrega — [tipo de peça]",
  prompt: "MODO 0 — Validar output do squad comms_king:\n\n
  [colar output completo aqui — incluindo metadados + peça + parecer quality + parecer compliance]\n\n
  Brief de origem: [link briefs/...]\n
  Agente origem: [nome do agente]\n\n
  Aplicar checklist MODO 0 (estrutura, compliance KoL, coerência com brief,
  formato, qualidade técnica) e emitir veredito ✅ APROVADO ou 🔴 REPROVADO + fixes."
})
```

Se DRA retornar REPROVADO → reabrir output no agente origem com a lista de fixes → loop até APROVADO. Máximo 3 rodadas; após isso `comms-head` escala ao Daniel.

---

## 🚨 REGRA #1 — ESTE SQUAD NÃO É DE MÍDIA PAGA

Este squad opera no **outro lado da equação**: construção de marca, comunidade e cultura via conteúdo orgânico. **NÃO** é responsável por Meta Ads, Google Ads, LinkedIn Ads, CAC, MEL, ROAS, CPMQL, leilão.

- ❌ NÃO consultar `get_growth_snapshot()`, `ad_performance`, `king-meta-newton`, `gads-*` como fonte primária
- ❌ NÃO otimizar pra atribuição, CAC ou ROAS
- ✅ Pode usar dados de performance paga como **referência histórica de ângulos que ressoaram** — nunca como métrica-objetivo
- ✅ Métricas-rei são **outras** (ver §Métricas-Rei)

---

## 🚨 REGRA #2 — FAST-TRACK vs MODO PROFUNDO

Conteúdo orgânico tem 2 velocidades. Squad opera em ambos.

### MODO PROFUNDO (default — semanal)
Pipeline completa: head → strategist + zeitgeist (paralelo) → storyteller-viral → funnel-curator → scriptwriter → edit-director → editorial-producer → [GATES] → DRA → entrega.

Aplicar quando: pilares estratégicos do mês · conteúdo evergreen · Big Ideas $1M · vídeos longos (YT).

### MODO FAST-TRACK (zeitgeist com janela ≤48h)
Pipeline enxuta: `zeitgeist-hunter` (já detectou) → `scriptwriter` (direto) → `compliance` (paralelo opcional) → `head` (gate marca) → DRA → entrega.

**Skip:** million-strategist · storyteller-viral · funnel-curator · edit-director · editorial-producer.

Aplicar quando: pauta cultural com janela ≤48h · polêmica reativa · evento ao vivo · UGC oportuno.

Em fast-track, o `scriptwriter` aplica diretamente Hero Brand simplificado (cliente herói + vilão + tom) sem o arco narrativo completo. Aceita-se output mais cru em troca de timing.

Risco: peça fraca. Mitigação: `head` aprova/rejeita rápido — se rejeitar, perde a janela (ok, prefere-se isso a publicar lixo).

---

## 🚨 REGRA #3 — SINGLE SOURCE OF TRUTH

Cada decisão tem **um único dono**. Outros agentes consultam, não duplicam.

| Decisão | Dono (SSoT) |
|---|---|
| Brief estratégico mensal | `comms-head` |
| Big Idea da campanha | `comms-million-strategist` |
| Pauta cultural quente | `comms-zeitgeist-hunter` |
| Conceito narrativo + arco | `comms-storyteller-viral` |
| **Mix topo/meio/fundo + 70/20/10** | `comms-funnel-curator` |
| Plataforma e formato finais | `comms-funnel-curator` |
| Roteiro publicável | `comms-scriptwriter` |
| Brief de edição | `comms-edit-director` |
| Calendário e horários | `comms-editorial-producer` |
| Tom de resposta e sentimento | `comms-community-manager` |
| Métricas e inteligência documentada | `comms-analyst-io` |
| Gate de marca | `comms-head` |
| Compliance KoL | `copy-compliance-reviewer` (herdado) |
| Qualidade criativa | `copy-quality-reviewer` (herdado) |
| Validação pré-entrega | `copy-rh-director` (DRA — herdado) |

Se você precisa de número/decisão que está em outro agente, **referencie**, não copie. CLAUDE.md NÃO duplica números que vivem em agentes específicos.

---

## 🚨 REGRA #4 — GATES (classificação)

| Gate | Tipo | Quem | Quando |
|---|---|---|---|
| `comms-head` | BLOQUEANTE (marca) | sempre | antes de DRA |
| `copy-quality-reviewer` | BLOQUEANTE (qualidade) | quando há output criativo (roteiro, conceito, copy) | antes de compliance |
| `copy-compliance-reviewer` | BLOQUEANTE (regras) | sempre que há output cliente-facing | antes de DRA |
| `copy-rh-director` (DRA) | BLOQUEANTE (entrega) | sempre antes do Daniel | último |
| `comms-funnel-curator` | CONSULTIVO-FORTE | a cada peça | informa mix, pode pedir revisão; não trava |
| `comms-analyst-io` | CONSULTIVO | semanal/mensal | informa próximos sprints; não trava |
| `comms-community-manager` | CONSULTIVO | semanal | abastece strategist + zeitgeist-hunter; não trava |

Gates BLOQUEANTES travam o fluxo. Gates CONSULTIVOS informam mas não travam — output pode seguir com a recomendação registrada.

---

## 📖 Glossário (termos canônicos)

Pra evitar drift de vocabulário entre agentes:

| Termo | Definição precisa | Dono |
|---|---|---|
| **Brief Estratégico** | Documento mensal com pilares, métrica de obsessão, posicionamento, restrições. Vira input pros agentes criativos do mês inteiro. | `comms-head` |
| **Big Idea** | Tese estratégica $1M com fissura social + dor cultural + vilão + herói + universo. Saída do strategist, vira input do storyteller. | `comms-million-strategist` |
| **Pauta cultural** ou **Zeitgeist** | Tópico cultural quente capturado em tempo real com ângulo contrário/profundo. Pode virar conteúdo direto em fast-track ou ser absorvido por uma Big Idea no modo profundo. | `comms-zeitgeist-hunter` |
| **Conceito narrativo** | Arco + Impacto Inicial + Envolvimento + Ponto de Virada. Saída do storyteller, vira input do scriptwriter. | `comms-storyteller-viral` |
| **Roteiro** | Texto publicável final por formato (Reels/Carrossel/Stories/Post/YT). Tempo, on-screen text, B-roll, caption, hashtags. | `comms-scriptwriter` |
| **Brief de Edição** | Instruções detalhadas pra editora humana executar — cortes, ritmo, sound, legendas, thumb. | `comms-edit-director` |
| **Peça** | Output final publicado em uma plataforma. | (publicado) |

NÃO usar termos sinônimos ambíguos como "tese" / "ideia" / "ângulo" / "concept" — usar exatamente o termo da tabela acima.

---

## 🚨 REGRA #5 — DEPENDÊNCIAS DEGRADADAS (gaps de infra)

Alguns agentes têm dependências externas que **ainda não estão 100% disponíveis**. Eles operam em modo degradado documentado:

| Agente | Gap | Modo degradado atual |
|---|---|---|
| `comms-community-manager` | Scope `instagram_manage_comments` NÃO autorizado. Não consegue ler/responder comments via API. | Daniel/editora coleta comments manualmente toda sex e cola input. Agente faz a análise. Quando scope for liberado, automatiza. |
| `comms-analyst-io` | Schema `comms.*` Supabase ainda não criado. | Puxa direto IG Graph API + GA4 via MCP. Persistência em arquivo markdown em `outputs/`. Quando schema sair, automatiza. |
| `comms-zeitgeist-hunter` | OK — Perplexity + Apify (Google Trends, TikTok, Reddit) já plugados. | Operacional. |
| `comms-head` modo bootstrap (primeiros 30d) | Sem histórico em `copy-performance-analytics` e `analyst-io`. | Opera por intuição estratégica + entrevistas + verbatims. Histórico vai sendo construído. |

---

## 🚨 REGRA #6 — HANDOFF IN/OUT

Cada agente declara em sua spec:
- **Handoff IN** — o que recebe, de quem, em que formato
- **Handoff OUT** — o que entrega, pra quem, em que formato
- **Em caso de rejeição** — max 2 retries no mesmo agente; após isso, escala ao `comms-head` (ou Daniel se já está no head)

Quem rejeita declara: **o que foi reprovado · fix sugerido · prioridade do fix**.

---

## Sobre o Squad

King of Languages está deixando de ser uma **Empresa-Corporação** (que depende de leilão de mídia paga) e se tornando uma **Empresa-Creator** (que constrói desejo descentralizado via cultura, narrativa e comunidade).

Este squad é a engrenagem dessa transformação. Plataforma-alvo principal: **Instagram**. Plataformas secundárias: TikTok, LinkedIn, YouTube.

## Pegada

- **Estratégia profunda antes da ação tática.** Não entregamos "plano de posts" — entregamos teses estratégicas que geram posts coerentes.
- **Cliente é Herói, Marca é Mentora, Problema é Vilão.** Toda peça respeita Hero Brand.
- **Gerar valor antes de extrair.** A balança pende sempre para valor gerado.
- **Marca tem vilão declarado.** King bate em: escola tradicional, método de gramática decorada, sistema educacional falho, "ter que morar fora pra aprender".
- **Marca tem ponto de vista.** King fala em primeira pessoa, com opinião, com personalidade.
- **Conteúdo nasce da Fissura Social.** O conflito entre o que o público quer ser e o que a sociedade limita ele de ser.
- **Dados + Arte (Mente + Alma).** Decisão de compra é emocional (Sistema 1), justificada pela lógica (Sistema 2).
- **3 Regras de Ouro de Conteúdo.** Impacto Inicial · Envolvimento Narrativo · Ponto de Virada.
- **Mix 70/20/10 e topo/meio/fundo** definidos pelo `comms-funnel-curator` (SSoT).

## Sobre a King (contexto canônico para todos os agentes)

- Escola de inglês online com +9 mil alunos
- 3 pilares: aulas particulares ao vivo · lições teóricas e práticas · plataforma com ferramentas
- Oferta principal: aulas 4x/semana com professor particular · R$294/mês
- Público-alvo: profissional CLT 28-50 anos · R$4-15k/mês · já tentou aprender e falhou
- Avatar Marcelo Silva (35a, gerente de projetos, casado)
- Vilão central: **invisibilidade profissional** — não falar inglês esconde sua competência
- Inimigos declarados: método tradicional · gramática decorada · escola de grupão · "tem que morar fora"
- Promessa: deixar de ser invisível e se tornar executivo global respeitado em até 12 meses
- Posicionamento: a única forma de conquistar inglês em até 12 meses pra profissionais ocupados
- Diferencial #1: professor particular (12/12 entrevistados validaram)
- **Conta IG:** `@kingoflanguagesoficial` · 41.637 seguidores · Business ID `17841437757707129`

## Métricas-Rei (DIFERENTES das de performance)

| Eixo | Métrica | Por quê |
|---|---|---|
| **Atenção** | Watch-through · avg view duration · dwell time | O algoritmo recomenda quem retém |
| **Compartilhamento** | Share rate · save rate · save-to-reach | Sinal de utilidade percebida |
| **Comunidade** | Comment depth · DM rate · menções espontâneas · sentimento | Saúde de marca real |
| **Crescimento** | Net follower growth · % crescimento via shares vs descoberta | Empresa-Creator real |
| **Cultural** | UGC · stitch/dueto · citações por terceiros · share of voice | Influência cultural |
| **Output negócio** | Lead orgânico declarado · busca por marca · DMs convertidas | Conexão orgânico→negócio **sem atribuição forçada** |

## Tom e Voz

Paleta de 6 tons herdada do `copy_king_senior`. Default no orgânico difere por etapa de funil (ver `comms-funnel-curator`):

| Tom | Quando usar no orgânico |
|-----|-------------------------|
| **Provocador-direto** | Pauta zeitgeist · Big Ideas · vídeos de opinião · reels de impacto inicial |
| **Storyteller** | Depoimentos · cases · jornada de aluno · stories de bastidor |
| **Didático-energético** | Carrosséis educativos · Reels-aula · tira-dúvidas · listening |
| **Empático** | Quem já tentou e falhou · stories de superação · respostas em DM |
| **Bater no inimigo** | Conteúdo de polarização contra escola tradicional · gramática decorada · sistema educacional |
| **Acolhedor** | Comunidade · agradecimento a alunos · resposta a UGC |

Regras gerais: usar "você" (nunca "tu" ou "vocês") · evitar jargão de marketing visível · confrontacional mas empático.

## Regras Críticas de Compliance

Herdadas do `copy_king_senior` + específicas do orgânico:

1. **NUNCA** prometer fluência em tempo específico (ex: "fluente em 3 meses")
2. **NUNCA** usar linguagem discriminatória/excludente
3. **NUNCA** depreciar concorrentes pelo nome
4. **NUNCA** fazer claims médicos/científicos sem fonte
5. **NUNCA** inventar ratings/avaliações sem fonte verificada
6. **SEMPRE** ancorar prova em "+9 mil alunos" (NUNCA 5 mil, 7 mil ou outro número)
7. **SEMPRE** usar prazo "fale inglês em até 12 meses" (NUNCA "fluência/fluente")
8. **SEMPRE** usar verbatim real (não inventar fala de aluno)
9. **NO ORGÂNICO** — respeitar diretrizes de comunidade da plataforma (IG/TikTok/LinkedIn/YT) além das regras KoL
10. **NO ORGÂNICO** — UGC e depoimentos exigem autorização do aluno antes de repost

## Workflow de Produção

### Modo Profundo (default)

```
Briefing (Daniel ou cadência mensal)
  → comms-head (diagnóstico + brief estratégico)
  → comms-million-strategist (3 Big Ideas/sprint)   ┐
  → comms-zeitgeist-hunter (pauta cultural)          ┘ paralelo
  → comms-storyteller-viral (1 conceito por Big Idea — 3 paralelos)
  → comms-funnel-curator (mix topo/meio/fundo + plataforma + formato)
  → comms-scriptwriter (roteiro por peça)
  → comms-edit-director (brief de edição p/ editora humana) [se vídeo]
  → comms-editorial-producer (calendário + pauta + scheduling)
  → [GATE] copy-quality-reviewer
  → [GATE] copy-compliance-reviewer
  → [GATE] comms-head (aprovação final de marca)
  → [GATE] copy-rh-director MODO 0 (DRA pré-entrega — BLOQUEANTE)
  → Entrega ao Daniel
  → Publicação (Daniel/equipe)
  → comms-community-manager (resposta + listening contínuo)
  → comms-analyst-io (report D+7 input/output)
  → comms-head (loop de insights → próximo brief)
```

### Modo Fast-Track (zeitgeist ≤48h)

```
comms-zeitgeist-hunter (pauta detectada + janela documentada)
  → comms-scriptwriter (Hero Brand simplificado, direto)
  → [GATE PARALELO] copy-compliance-reviewer
  → [GATE] comms-head (gate marca rápido)
  → [GATE] copy-rh-director MODO 0
  → Entrega ao Daniel
  → Publicação
  → comms-analyst-io D+1 quick-look
```

Janela perdida = peça morta. Aceita-se output mais cru em troca de timing.

## Plataformas — escopo e prioridade

| Plataforma | Prioridade | Foco | Frequência (default — `comms-editorial-producer` é SSoT) |
|---|---|---|---|
| **Instagram** | 🥇 PRINCIPAL | Reels + Carrossel + Stories | ver `comms-editorial-producer` |
| TikTok | Secundária | Adaptação nativa do IG | ver `comms-editorial-producer` |
| LinkedIn | Secundária | Carrosséis B2B + post texto opinativo | ver `comms-editorial-producer` |
| YouTube | Secundária | Shorts (cortes Reels) + longo educativo | ver `comms-editorial-producer` |

Frequência exata vive em `agents/comms-editorial-producer.md`. CLAUDE.md NÃO duplica.

## Edição de Vídeo

A King tem **editora humana interna** que executa a edição.
- `comms-edit-director` NÃO edita — escreve **brief detalhado de edição**
- Brief precisa ser preciso o suficiente pra editora não decidir nada criativo
- Pra buscar referências visuais: usar Apify TikTok scraper, IG Reel scraper, ou WebFetch de Reels públicos

## Estrutura de Pastas

```
comms_king/
├── CLAUDE.md                  (este arquivo — versão 0.2)
├── agents/                    (10 agentes do squad)
├── skills/                    (symlinks pras skills compartilhadas em copy_king_senior/skills/)
├── briefs/                    (briefs estratégicos versionados)
├── outputs/                   (peças entregues por campanha)
├── knowledge/                 (manifesto, brand book, pesquisa qualitativa)
└── commands/                  (slash commands futuros)
```

## Ciclo de Feedback (Inteligência Documentada)

```
PROPOR (consulta histórico) → APROVAR → PRODUZIR → PUBLICAR → MEDIR (D+1 quick · D+7 análise · D+14 calibração)
  → REGISTRAR (em `outputs/` + insight do `comms-analyst-io`) → CALIBRAR → próximo sprint
```

## Skills Disponíveis

**Próprias do squad** (em `comms_king/skills/`):

| Skill | Função | Agentes que usam |
|-------|--------|---|
| `comms-strategy-frameworks` | CCO vs CMO · PESO · Edelman Trust · RACE · Narrative Architecture · Brand Voice System · world-class operators · crisis playbook | head, community-manager, analyst-io |
| `brand-building-empresa-creator` | Mental Availability · Distinctive Brand Assets · Diagnosis-Strategy-Tactics · Marca como Palco · Individuação Jung · 60/40 Binet/Field · Empresa-Creator playbook | head, million-strategist, community-manager |
| `hero-brand-storytelling` | StoryBrand 7-part (Donald Miller) · Pixar formula · Jornada Campbell · Made to Stick SUCCES · Círculo da História Tay · 3-act · in medias res · Antagonista 5 tipos | head, million-strategist, storyteller-viral, scriptwriter |
| `viral-mechanics-advanced` | STEPPS Berger · Hook 1.5s (MrBeast/Hormozi) · 7 fórmulas de hook · 3 Regras de Ouro Tay · Algorithm proxies · Native format psychology · Pattern interrupt · Diagnóstico | storyteller-viral, scriptwriter, zeitgeist-hunter, edit-director, analyst-io |
| `organic-social-playbook` | IG algorithm 2026 · two-stage distribution · Originality Score · platform-native rules (IG/TikTok/LinkedIn/YT) · content pillars · métricas-rei orgânicas · horários · cadência | zeitgeist-hunter, funnel-curator, scriptwriter, edit-director, editorial-producer, analyst-io |

**Herdadas** (symlinks → `copy_king_senior/skills/`):

| Skill | Função |
|-------|--------|
| `king-compliance` | Termos proibidos KoL |
| `king-angles` | 6 ângulos validados · 5 personas · verbatims |
| `big-idea-protocol` | Schwartz · Ogilvy · níveis de consciência |
| `hook-selector` | 19 fórmulas de gancho · ganchos visuais |
| `sugarman-copy` | Princípios de escrita persuasiva |
| `watchtime-optimizer` | Retenção em vídeo |
| `copy-performance-analytics` | Histórico de ângulos/ganchos que ressoaram |

## Agentes do Squad

| Camada | Agente | Função |
|--------|--------|--------|
| Estratégia | `comms-head` | Orquestrador. Diagnóstico. Gate de marca. Invoca DRA. |
| Estratégia | `comms-million-strategist` | Big Ideas $1M |
| Estratégia | `comms-zeitgeist-hunter` | Pauta cultural + timing + Apify |
| Criação | `comms-storyteller-viral` | Hero Brand + 3 Regras + STEPPS |
| Criação | `comms-funnel-curator` | Mix topo/meio/fundo · 70/20/10 (SSoT) |
| Criação | `comms-scriptwriter` | Roteiro final por formato |
| Operacional | `comms-edit-director` | Brief de edição |
| Operacional | `comms-editorial-producer` | Calendário · pauta · scheduling |
| Operacional | `comms-community-manager` | Resposta + inteligência (degradado até IG comments scope sair) |
| Calibração | `comms-analyst-io` | IG Graph + GA4 · inteligência documentada |

## O Que Este Squad NÃO Faz

- Não otimiza Meta/Google/LinkedIn Ads
- Não calcula CAC/LTV/MEL/ROAS
- Não entrega "plano de posts" — entrega **tese estratégica que gera posts coerentes**
- Não valida ideia sem questionar a premissa
- Não foca em métricas de vaidade
- Não inventa verbatim, depoimento, dado, rating
- Não atropela o DRA

---

## Changelog

- **0.3 (2026-05-21)** — Pesquisa world-class + 5 skills próprias criadas: `comms-strategy-frameworks` (CCO/PESO/Edelman/RACE), `brand-building-empresa-creator` (Sharp/Ritson/Tay/Jung), `hero-brand-storytelling` (Miller StoryBrand/Pixar/Campbell/Heath/Tay), `viral-mechanics-advanced` (Berger STEPPS/MrBeast/Hormozi/Tay 3 Regras), `organic-social-playbook` (IG algorithm 2026 + platform-native). Frontmatter dos 10 agentes atualizado com novas referências. Cruzamento Tay Dantas (Empresa-Creator, Hero Brand, Fissura Social, Marca como Palco, Círculo da História, 3 Regras de Ouro, 70/20/10) + frameworks internacionais (Donald Miller, Byron Sharp, Mark Ritson, Jonah Berger, Carl Jung, Heath brothers, Joseph Campbell, MrBeast school, Binet/Field IPA, Nielsen Norman Group).
- **0.2 (2026-05-21)** — Audit pós-criação: regra #3 SSoT, #4 classificação de gates, #5 dependências degradadas, #6 handoffs, #2 fast-track mode, glossário canônico, mecânica concreta de invocação DRA, skills via symlink, removida duplicação de defaults de cadência (agora vivem só no editorial-producer)
- **0.1 (2026-05-21)** — Criação inicial do squad com 10 agentes
