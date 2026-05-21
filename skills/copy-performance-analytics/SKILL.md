---
name: copy-performance-analytics
description: Feedback loop de performance real de ads. Conecta metricas de campanhas publicadas (CPL, Hook Rate, CTR, CPA, Watchtime) de volta ao sistema para calibrar angulos, hooks e decisoes estrategicas. Consulta Supabase ad_performance para dados atualizados.
trigger: Quando o copy-strategist precisa decidir angulo/hook baseado em dados reais, quando o copy-director inicia campanha nova, quando /otimizar e invocado, ou quando /diagnostico precisa de contexto historico.
---

# Copy Performance Analytics — Feedback Loop

## Objetivo
Fechar o ciclo entre **producao de copy** e **resultados reais** de ads. Sem este feedback loop, o sistema toma decisoes baseado apenas em dados historicos estaticos. Com ele, cada nova campanha e informada pela performance real das anteriores.

## Fonte de Dados

### Primaria: Supabase `ad_performance` (AUTOMATIZADO)
```
Projeto: quljxivtdmwpdrzbqobp
Tabela: ad_performance
Pipeline: ad-performance-pipeline (Python)
  - Sheets (dados_brutos) → metricas (spend, impressions, hook rate, etc.)
  - Supabase `leads` → funil por criativo (utm_anuncio match)
  - Facebook Ads API → conteudo criativo (copy text + video)
```

### Automacao Semanal
```
Pipeline principal: segunda 15:00 BRT → popula ad_performance
Copy System Sync: segunda 16:00 BRT → atualiza historico + dashboard
Script: ad-performance-pipeline/src/copy_system_sync.py
Runner: ad-performance-pipeline/run_copy_sync.sh
Crontab: 0 16 * * 1 ~/Desktop/claude_code/ad-performance-pipeline/run_copy_sync.sh
```

O sync classifica cada criativo por angulo, plataforma e formato usando patterns do nome do ad,
depois agrega metricas e regenera `historico-performance.md` e `dashboard-resumo.md`.

### Secundaria: Dados Manuais
Quando dados do Supabase nao estao disponiveis, o usuario informa metricas diretamente.

## Como Usar

### 1. Registrar Performance de Campanha

Apos cada campanha publicada, registrar no `references/historico-performance.md`:

```markdown
## [Data] — [Nome da Campanha]
- **Angulo:** [qual dos 6]
- **Persona:** [qual das 5]
- **Gancho:** [formula usada]
- **Formato:** [imagem/video/LP/email]
- **Plataforma:** [Meta/Google/LinkedIn]

### Metricas Reais
| Metrica | Valor | Benchmark | Status |
|---------|-------|-----------|--------|
| Hook Rate | X% | >25% | OK/RUIM |
| CTR | X% | >1% | OK/RUIM |
| CPL | R$X | <R$20 | OK/RUIM |
| CPA | R$X | <R$300 | OK/RUIM |
| Watchtime 50% | X% | >30% | OK/RUIM |
| Frequency | X | <3.5 | OK/RUIM |

### Classificacao
- **Matriz:** [Vencedor / Oportunidade / Decepcao / Morte]
- **Acao:** [Escalar / Otimizar Gancho / Otimizar Corpo / Descartar]

### Aprendizados
- [O que funcionou e por que]
- [O que nao funcionou e por que]
```

### 2. Consultar Historico Antes de Criar

**Obrigatorio para copy-strategist:** Antes de definir angulo e gancho para nova campanha, consultar `references/historico-performance.md` para:

1. **Ranking de angulos por performance real:**
   - Qual angulo tem menor CPL medio?
   - Qual angulo tem maior Hook Rate medio?
   - Qual angulo gera leads de melhor qualidade (menor CPA)?

2. **Ranking de ganchos por performance real:**
   - Quais formulas de gancho performam melhor por formato?
   - Quais ganchos tem Hook Rate acima de 30%?

3. **Padroes identificados:**
   - Tom confrontacional vs. empático — qual performa melhor em qual plataforma?
   - Verbatims usados nos vencedores — quais temas geram mais identificacao?
   - Duracao de video ideal por plataforma (dados reais vs. benchmarks)

### 3. Calibrar Decisoes Estrategicas

O strategist deve usar os dados para:

| Decisao | Sem Feedback Loop | Com Feedback Loop |
|---------|-------------------|-------------------|
| Escolha de angulo | Baseada em dados estaticos (2 angulos validados) | Baseada em ranking atualizado de todos os angulos testados |
| Escolha de gancho | Baseada em formulas teoricas | Baseada em Hook Rate real por formula |
| Escolha de persona | Baseada em % da pesquisa (45% estagnado) | Baseada em qual persona converte melhor por plataforma |
| Tom da copy | Sempre confrontacional | Confrontacional com nuances por plataforma/formato |
| Formato do criativo | Recomendacao generica | Formato que historicamente performa melhor para aquele angulo |

## Dashboard de Performance (Resumo Executivo)

Manter atualizado no `references/dashboard-resumo.md`:

```
## Performance Acumulada — King of Languages

### Ultima atualizacao: [DATA]

### Top 3 Angulos (por CPL)
1. [Angulo] — CPL medio: R$X (N campanhas)
2. [Angulo] — CPL medio: R$X (N campanhas)
3. [Angulo] — CPL medio: R$X (N campanhas)

### Top 3 Ganchos (por Hook Rate)
1. [Formula] — Hook Rate medio: X% (N criativos)
2. [Formula] — Hook Rate medio: X% (N criativos)
3. [Formula] — Hook Rate medio: X% (N criativos)

### Performance por Plataforma
| Plataforma | CPL Medio | Hook Rate | CTR | CPA | N Campanhas |
|-----------|-----------|-----------|-----|-----|-------------|

### Performance por Formato
| Formato | CPL Medio | Hook Rate | CTR | N Criativos |
|---------|-----------|-----------|-----|-------------|

### Performance por Persona
| Persona | CPL Medio | CPA | Volume Leads | Qualidade |
|---------|-----------|-----|-------------|-----------|

### Tendencias
- [Tendencia 1 — ex: "Hook Rate esta caindo no angulo Exclusividade (fadiga?)"]
- [Tendencia 2 — ex: "Video 30s performa 2x melhor que 60s no Meta"]

### Alertas
- [Alerta 1 — ex: "Angulo Preco Acessivel: CPL bom mas CPA alto — leads desqualificados"]
```

## Integracao com Agentes

### copy-strategist
- **DEVE** consultar `references/historico-performance.md` antes de definir angulo
- **DEVE** mencionar no Brief Estrategico: "Baseado em dados reais: [angulo X] tem CPL medio de R$Y em N campanhas"
- **DEVE** justificar escolha de angulo com dados quando disponiveis

### copy-director
- **DEVE** solicitar metricas ao usuario apos 48h de publicacao
- **DEVE** registrar no historico apos receber metricas
- **DEVE** atualizar dashboard-resumo periodicamente

### copy-copywriter
- **PODE** consultar quais ganchos tiveram melhor Hook Rate para formato similar
- **PODE** consultar quais CTAs tiveram melhor CTR

### copy-compliance-reviewer
- **NAO** muda — compliance e regra, nao depende de performance

## Ciclo Completo

```
1. CRIAR (usando dados historicos)
      |
2. PUBLICAR
      |
3. MEDIR (48h minimo)
      |
4. REGISTRAR (historico + dashboard)
      |
5. ANALISAR (padroes, tendencias, alertas)
      |
6. CALIBRAR (proxima campanha usa dados atualizados)
      |
   volta ao 1 →
```

## Anti-Padroes

- **NAO** tomar decisao baseada em 1 campanha — minimo 3 para tendencia
- **NAO** ignorar dados que contradizem a teoria — dados reais > frameworks
- **NAO** escalar sem medir — sempre 48h de dados antes de aumentar budget
- **NAO** descartar angulo sem testar variacoes — pode ser problema de gancho, nao de angulo

## References
- `references/historico-performance.md` — Log de performance por campanha
- `references/dashboard-resumo.md` — Dashboard executivo atualizado
- `references/metricas-template.md` — Template para registro padronizado
