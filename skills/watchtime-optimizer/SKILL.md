---
name: watchtime-optimizer
description: Otimização de watchtime para vídeos da King of Languages. Benchmarks, micro-ganchos, táticas de retenção, diagnóstico de queda, métricas por plataforma.
trigger: Quando o copy-copywriter precisa criar roteiros otimizados para retenção, ou quando qualquer agente precisa avaliar/melhorar performance de vídeo.
---

# Watchtime Optimizer

## O que esta skill faz

Esta skill permite otimizar o watchtime (tempo de retenção) de vídeos da King of Languages em todas as plataformas de anúncios. Cobre desde o diagnóstico de problemas até a aplicação de táticas específicas para aumentar retenção, reduzir CPM/CPA e maximizar ROI.

## Hierarquia das Métricas de Vídeo

Antes de qualquer otimização, entenda a pirâmide de prioridades:

```
1º HOOK RATE   → Sem atenção inicial, nada mais importa
2º WATCHTIME   → Sem retenção, o tráfego é desqualificado e caro
3º CTR         → Sem clique, não há tráfego para a página
4º CONVERSÃO   → Resultado final, consequência das três anteriores
```

**Regra fundamental:** Sempre diagnostique de baixo para cima. Não adianta otimizar CTA se o watchtime está ruim. Não adianta otimizar watchtime se o hook rate está baixo.

### Ordem correta de diagnóstico

```
1º Hook Rate baixo? → Problema no GANCHO (consultar skill hook-selector)
   ↓ (se ok)
2º Watchtime baixo? → Problema no CORPO do vídeo (aplicar táticas desta skill)
   ↓ (se ok)
3º CTR/CPA ruim?    → Problema na OFERTA ou CTA
```

## Quando usar cada tática

### Micro-Ganchos (Ganchos Internos)

**Usar quando:** WR 50% está abaixo do benchmark, mas Hook Rate está bom. O público entra mas não fica.

**Como aplicar:** Inserir frases de transição a cada 10-15 segundos que renovam o engajamento:

- "Mas antes de continuar..."
- "Isso aqui é importante..."
- "Olha só o que acontece quando..."
- "Agora vem a parte que ninguém fala..."
- "Presta atenção nessa parte..."
- "Mas o mais interessante é..."

**Modelo de distribuição:**

```
[0-3s]   HOOK PRINCIPAL → Para o scroll
[10-15s] GANCHO 2 → "Mas antes de continuar..."
[25-30s] GANCHO 3 → "O mais importante é..."
[45-50s] GANCHO 4 → "E aqui está o segredo..."
[Final]  LOOP ou CTA → Rewatch ou ação
```

### Open Loops (Loops Abertos)

**Usar quando:** Completion Rate está baixo. Pessoas assistem até metade mas abandonam antes do CTA.

**Como aplicar:** Criar curiosidade no início que só será resolvida no final:

- "Em 30 segundos vou revelar o erro que 90% comete..."
- "Mas antes disso, você precisa entender uma coisa..."
- "O terceiro ponto é o que muda tudo..."
- "Fica até o final porque o que vou mostrar..."

**Regra:** Plante o loop, mas ENTREGUE a resolução. Nunca frustre o espectador.

### Pattern Interrupts (Técnicas Visuais)

**Usar quando:** Retenção cai gradualmente sem ponto específico de abandono (queda monotônica). Indica conteúdo monótono.

**Técnicas e impacto estimado:**

| Técnica | Impacto Estimado |
|---------|------------------|
| Legendas Dinâmicas (Estilo Hormozi) | +20-40% |
| B-Roll Relevante | +15-25% |
| Cortes a cada 2-3s | +15-25% |
| Gráficos e Textos Animados | +10-20% |
| Zoom In/Out Dinâmico | +5-15% |

### Loop Infinito (Exclusivo TikTok)

**Usar quando:** Criando para TikTok. O algoritmo conta replays como engajamento positivo.

**Como aplicar:** Termine o vídeo com frase que conecta ao início:
- Início: "Esse erro está te custando..." → Final: "...e esse é o erro que está te custando [volta ao início]"
- Impacto: Aumenta replays em 30-50%

### Estruturas de Roteiro

**Modelo VSL Curta (1-3 minutos):**

```
[0-5s]   GANCHO: Problema ou promessa chocante
[5-20s]  CONEXÃO E PROBLEMA: Empatia + agitação
[20-40s] SOLUÇÃO: "Mecanismo único"
[40-70s] COMO FUNCIONA + PROVA
[70-90s] CTA: Chamada clara e direta
```

**Modelo Educacional Rápido (45-90 segundos):**

```
[0-5s]   GANCHO: Pergunta ou afirmação polêmica
[5-15s]  PROMESSA E AUTORIDADE
[15-60s] CONTEÚDO EM PASSOS: Rápido e numerado
[60-75s] ERRO COMUM / DICA EXTRA
[75-90s] CTA: Seguir ou clicar
```

## Como diagnosticar quedas de retenção

### Passo 1: Localizar a queda

No Gerenciador de Anúncios da Meta:
1. Selecione o anúncio de vídeo
2. Clique em "Ver gráficos"
3. Na seção "Engajamento", encontre o gráfico de Retenção de vídeo
4. Procure por quedas súbitas na curva (um "penhasco" indica problema)

### Passo 2: Diagnosticar por momento

| Momento da Queda | Causa Provável | Solução |
|------------------|----------------|---------|
| 0-3 segundos | Gancho fraco ou genérico | Testar 3-5 variações. Consultar skill hook-selector. |
| 3-15 segundos | Quebra de promessa | Revisar transição gancho→corpo. Cumprir promessa imediatamente. |
| 15-30 segundos | Conteúdo monótono ou confuso | Adicionar legendas dinâmicas, B-rolls. Quebrar em blocos menores. |
| 30-45 segundos | Falta de progressão | Introduzir novo elemento: depoimento, demonstração, open loop. |
| No CTA (final) | CTA fraco ou desconectado | CTA deve ser consequência lógica do conteúdo. Adicionar urgência. |

### Passo 3: Classificar na Matriz

| | Watchtime Baixo | Watchtime Alto |
|---|---|---|
| **Hook Rate Baixo** | ZONA DA MORTE - Descartar e começar do zero | ZONA DA OPORTUNIDADE - Manter corpo, testar novos ganchos |
| **Hook Rate Alto** | ZONA DA DECEPÇÃO - Manter gancho, refazer corpo | ZONA DO VENCEDOR - Escalar imediatamente |

### Passo 4: Otimização iterativa (4 fases)

1. **Teste de Ganchos (3-5 dias):** Criar 3-5 variações dos primeiros 3-5s. Rodar com baixo orçamento. Objetivo: Hook Rate > 35%.
2. **Otimização do Corpo (3-5 dias):** Usar gancho vencedor. Analisar gráfico de retenção. Adicionar micro-ganchos e pattern interrupts. Objetivo: WR 50% acima do benchmark.
3. **Teste de CTA (3-5 dias):** Com vídeo otimizado, criar 2-3 variações do CTA. Testar diferentes textos, ofertas e comandos. Objetivo: CTR > 1.5%.
4. **Escala e Variação:** Combinar elementos vencedores. Aumentar orçamento gradualmente. Criar variações para evitar fadiga. Objetivo: Maximizar ROAS.

## Script de Análise Rápida (5 minutos por criativo)

```
PASSO 1 (30s): Hook Rate > 30%?
  SIM → Passo 2
  NÃO → PARAR. Problema no gancho. Consultar skill hook-selector.

PASSO 2 (30s): WR 50% > benchmark da duração? (ver referência benchmarks-nicho-educacao)
  SIM → Passo 3
  NÃO → PARAR. Problema no corpo. Aplicar táticas de micro-ganchos e pattern interrupts.

PASSO 3 (30s): Completion Rate > benchmark?
  SIM → Passo 4
  NÃO → Problema no final/CTA. Revisar últimos 10s.

PASSO 4 (30s): CTR > 1.0%?
  SIM → Criativo VALIDADO. Passo 5.
  NÃO → CTA fraco ou oferta desalinhada.

PASSO 5 (2min): Classificar na Matriz Hook Rate x Watchtime
  → Definir ação: ESCALAR / OTIMIZAR GANCHO / OTIMIZAR CORPO / DESCARTAR
```

## Especificidades por plataforma

### Meta (Facebook/Instagram)

- Métrica central: ThruPlay (15s ou 97% do vídeo)
- Duração ideal: 30-60s
- Hook crítico: 0-3s
- Sensibilidade do algoritmo: Moderada
- Impacto de replays: Baixo
- Métricas customizadas recomendadas: WR 50% e Completion Rate

### TikTok

- Métrica central: Completion Rate
- Duração ideal: 15-30s
- Hook crítico: 0-2s
- Sensibilidade do algoritmo: EXTREMA
- Impacto de replays: MUITO ALTO
- Técnica exclusiva: Loop Infinito

## Referências

- `references/benchmarks-nicho-educacao.md` - Todos os benchmarks, métricas por plataforma, custos estimados Brasil, glossário completo
- Skill `hook-selector` - Para otimização dos primeiros 3 segundos
- Skill `sugarman-copy` - Para aplicar Slippery Slide no corpo do vídeo
- Skill `king-angles` - Para ângulos validados da King

## Checklist de pré-publicação

- [ ] Gancho de 3 segundos forte e conectado à dor/desejo?
- [ ] Micro-ganchos ou pattern interrupts a cada 10-15 segundos?
- [ ] Roteiro utiliza Open Loops para gerar curiosidade?
- [ ] Edição inclui legendas dinâmicas e B-rolls?
- [ ] CTA congruente com o conteúdo apresentado?
- [ ] Metas de Watchtime definidas com base na duração?

## Checklist de pós-publicação (primeiras 48h)

- [ ] Colunas de métricas de vídeo configuradas?
- [ ] Hook Rate dentro do benchmark?
- [ ] WR 50% e Completion Rate dentro do benchmark?
- [ ] Matriz de Diagnóstico usada para classificar?
- [ ] Públicos personalizados por % criados para remarketing?
