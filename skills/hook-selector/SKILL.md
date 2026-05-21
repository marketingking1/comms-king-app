---
name: hook-selector
description: Algoritmo de seleção de ganchos para criativos da King of Languages. Fórmulas de ganchos textuais e visuais, headlines validadas, regra dos 70-80% do sucesso do anúncio.
trigger: Quando qualquer agente de copy precisa selecionar ou criar ganchos para ads, vídeos ou criativos de imagem.
---

# Hook Selector — Algoritmo de Seleção de Ganchos

## Princípio Fundamental

> "O gancho representa 70-80% do sucesso do anúncio. Se ele falha, o resto do criativo nem existe."

O gancho são os primeiros 1-3 segundos que decidem se o usuário para o scroll ou ignora o criativo. Este skill define o algoritmo completo para selecionar, combinar e validar ganchos para qualquer formato da King of Languages.

---

## Anatomia do Gancho por Formato

| Formato | Componente do Gancho | Duração Ideal |
|---------|---------------------|---------------|
| **Vídeo** | Primeiros 2-3 segundos (verbal + visual combinados) | 3-10s |
| **Imagem única** | Headline + imagem completa | Instantâneo (2s de leitura) |
| **Carrossel** | Primeiro card completo | Instantâneo |

---

## Algoritmo de Seleção

### PASSO 1: Identificar o Formato do Criativo

```
SE formato = vídeo:
  → Gancho VERBAL (fórmula de copy) + Gancho VISUAL (edição) obrigatórios
  → Consultar: references/formulas-ganchos.md + references/ganchos-visuais.md

SE formato = imagem:
  → Gancho = HEADLINE (fórmula de copy) + IMAGEM (visual)
  → Consultar: references/formulas-ganchos.md + references/headlines-validadas.md

SE formato = carrossel:
  → Gancho = PRIMEIRO CARD (headline + visual)
  → Consultar: references/headlines-validadas.md
```

### PASSO 2: Identificar o Nível de Consciência

O nível de consciência do público determina QUAL TIPO de gancho funciona melhor:

| Nível de Consciência | Tipo de Gancho Recomendado | Fórmulas Prioritárias |
|---------------------|---------------------------|----------------------|
| **Inconsciente** (não sabe que tem o problema) | Polêmica, Você Sabia, Bombardeio de Realidade | F1 (Polêmica), F5 (Você Sabia), Bombardeio de Realidade |
| **Consciente do problema** (sabe da dor, não sabe da solução) | Erro Exposto, Identificação, Diagnóstico de Inimigo Interno | F4 (Erro Exposto), F8 (Call-Out), Diagnóstico de Inimigo Interno |
| **Consciente da solução** (sabe que existe, não conhece a King) | Três Coisas, Contraposição, Inversão de Crença | F2 (Três Coisas), F7 (Contraposição), Inversão de Crença Universal |
| **Consciente do produto** (conhece a King, ainda não comprou) | Prova Social, Demonstração ao Vivo, Storytelling | Prova Social Tangível, Demonstração ao Vivo, Storytelling com Twist |
| **Totalmente consciente** (pronto para comprar) | Urgência/Alerta, Oferta Direta | Headlines de Urgência, CTAs diretas |

### PASSO 3: Selecionar o Ângulo da Campanha

O ângulo define o ENQUADRAMENTO emocional do gancho:

| Ângulo | Emoção Ativada | Fórmulas Compatíveis |
|--------|---------------|---------------------|
| **Dor/Medo** | Identificação, Urgência | Erro Exposto, Bombardeio de Realidade, Diagnóstico de Inimigo Interno |
| **Aspiração/Desejo** | Desejo, Curiosidade | Lifestyle, Demonstração ao Vivo, Prova Social Tangível |
| **Provocação** | Surpresa, Curiosidade | Polêmica, Contraposição, Inversão de Crença, Confronto Direto |
| **Educação** | Curiosidade, Identificação | Três Coisas, Você Sabia, Lista de Absurdos |
| **Social Proof** | Desejo, Confiança | Prova Social Tangível, Storytelling com Twist |

### PASSO 4: Cruzar Formato + Consciência + Ângulo

```
RESULTADO = Fórmula(s) de copy + Gancho visual (se vídeo)

Exemplo:
  Formato: Vídeo
  Consciência: Consciente do problema
  Ângulo: Provocação

  → Fórmula de copy: Confronto Direto + Inversão de Comportamento
  → Gancho visual: Green Screen com print de desculpas comuns
  → Referência: Adaptação King do swipefile
```

### PASSO 5: Gerar Variações (Mínimo 3-5)

Para cada combinação, gerar NO MÍNIMO 3 variações do gancho:

```
1 CONCEITO (corpo/oferta fixo)
    +
3-5 GANCHOS diferentes
    =
3-5 ANÚNCIOS para testar
```

Metodologia de variação:
- Variar a FÓRMULA (mesmo ângulo, fórmulas diferentes)
- Variar o SUB-PÚBLICO (Minerador de Públicos — F6)
- Variar o VISUAL (mesmo copy, ganchos visuais diferentes)

---

## As 4 Emoções Obrigatórias

Todo gancho DEVE gerar pelo menos UMA destas reações:

1. **IDENTIFICAÇÃO** → "Sou eu, acredito nisso"
2. **CURIOSIDADE** → "O que vem depois?"
3. **SURPRESA** → "Não esperava isso"
4. **DESEJO** → "Quero isso agora"

---

## Checklist de Validação do Gancho

Antes de aprovar qualquer gancho, verificar:

- [ ] **ESPECÍFICO** — Fala com alguém em particular (não genérico)
- [ ] **EMOCIONAL** — Ativa sentimento, não apenas lógica
- [ ] **RELEVANTE** — Conecta instantaneamente com dor/desejo
- [ ] **QUEBRA PADRÃO** — Diferente do feed normal
- [ ] **ABRE LOOPING** — Cria curiosidade não resolvida
- [ ] **COMPLIANCE** — Respeita regras de compliance da King (ver king-compliance skill)

---

## Erros Fatais (Rejeição Automática)

O gancho deve ser REJEITADO se:

1. **Genérico** — "Aprenda inglês", "Mude sua vida" (sem especificidade)
2. **Longo demais** — Mais de 10s em vídeo sem motivo validado
3. **Sem looping** — Satisfaz a curiosidade no próprio gancho (sem razão para continuar)
4. **Apenas 1-2 variações** — Mínimo obrigatório: 3-5 por conceito
5. **Sem componente visual** — Para vídeos, gancho é VERBAL + VISUAL juntos
6. **Cópia literal** — Adaptar ideia, nunca copiar texto literal de outro nicho

---

## Métricas de Validação Pós-Publicação

### Hook Rate (2 Segundos)

```
Hook Rate = (Visualizações de 2 segundos / Impressões) × 100
```

| Hook Rate | Avaliação | Ação |
|-----------|-----------|------|
| < 15% | Péssimo | Trocar gancho URGENTE |
| 15-25% | Fraco | Testar novo ângulo |
| 25-35% | Médio | Melhorar ou variar |
| 35-45% | Bom | Validado, empilhar |
| 45-55% | Muito bom | Vencedor, escalar |
| 55%+ | Excelente | Campeão, proteger |

### Diagnóstico Combinado (Hook Rate + CTR)

| Hook Rate | CTR | Diagnóstico |
|-----------|-----|-------------|
| Alto (35%+) | Alto (1.5%+) | VENCEDOR — Escalar |
| Alto | Baixo | Prende mas não qualifica — Revisar corpo |
| Baixo | Baixo | Falhou — Trocar gancho |
| Baixo | Alto | Raro — Conferir métrica |

---

## Empilhamento de Ganchos (Estratégia Avançada)

Quando um gancho é validado (Hook Rate 35%+), empilhar novos ganchos para reviver o anúncio:

```
[Gancho B novo] → [Gancho A validado] → [Corpo] → [CTA]
```

Limite máximo: 3 ganchos empilhados (mais que isso aumenta CPM).

---

## Workflow Completo de Teste

```
SEMANA 1: Teste de Ganchos
→ 3-5 ganchos diferentes, mesmo corpo/CTA
→ Budget: R$50-100/dia cada
→ Objetivo: Identificar gancho vencedor (Hook Rate 35%+)

SEMANA 2: Empilhamento
→ Gancho vencedor vira base
→ Testa 3-5 novos ganchos para empilhar

SEMANA 3: Formato
→ Combo empilhado vencedor
→ Testa 3 formatos (UGC, Podcast, React)

RESULTADO: Super-anúncio escalável
```

---

## Referências

- `references/formulas-ganchos.md` — Todas as fórmulas de ganchos textuais/copy com templates e exemplos
- `references/headlines-validadas.md` — Banco completo de headlines validadas e exemplos do swipefile adaptados para King
- `references/ganchos-visuais.md` — Ganchos visuais, de edição e estratégia visual
