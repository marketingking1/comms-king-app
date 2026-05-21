---
name: king-compliance
description: Validação de compliance para copies da King of Languages. Verifica termos proibidos, políticas de ads (Meta/Google/LinkedIn), checklist de imagem e regras da marca.
trigger: Sempre que uma copy precisa ser validada antes de publicação, ou quando o copy-compliance-reviewer é acionado.
---

# King Compliance

## Objetivo
Validar copies e criativos da King of Languages contra regras de compliance, políticas de plataformas de ads e diretrizes da marca.

## Processo de Validação

### 1. Termos Proibidos
Consultar `references/termos-proibidos.md` para lista completa.
Categorias principais:
- **Claims absolutos**: "garantido", "100%", "certeza", "sempre funciona"
- **Promessas de tempo**: "fluente em X meses", "fluência", "aprenda em X dias". Somente "fale inglês em até 12 meses" é permitido
- **Claims médicos/científicos**: sem fonte verificável
- **Ratings/avaliações inventados**: "Nota 4.9 no Google", "5 estrelas", "melhor avaliado" — proibido sem fonte real confirmada
- **Linguagem discriminatória**: qualquer forma
- **Menção a concorrentes**: por nome
- **Termos bloqueados por Meta/Google**: ver lista em references

### 2. Checklist de Imagem
Consultar `references/checklist-imagem.md` para validação visual.
- Proporção de texto vs imagem (regra dos 20% Meta)
- Elementos obrigatórios (logo, CTA)
- Elementos proibidos (before/after exagerado, claims visuais)

### 3. Revisão de Português (OBRIGATÓRIA)
Toda copy DEVE passar por revisão gramatical e ortográfica antes de publicação. Para Google Ads (headlines com limite de 30 chars), aplicar:
- [ ] **Acentuação correta**: inglês (não "ingles"), você (não "voce"), é (não "e"), já (não "ja"), só (não "so"), não (não "nao"), flexíveis (não "flexiveis"), horários (não "horarios"), método (não "metodo"), também (não "tambem")
- [ ] **Cedilha**: preço (não "preco"), começar (não "comecar")
- [ ] **Crase**: quando aplicável (à sua rotina, à sua agenda)
- [ ] **Pontuação**: frases interrogativas com "?", exclamativas com "!" quando intencional
- [ ] **Concordância**: verificar gênero e número
- [ ] **Maiúsculas**: Title Case nos headlines do Google Ads (primeira letra de cada palavra)
- [ ] Se o limite de 30 chars impedir acentuação, REFORMULAR o headline em vez de remover acentos
- [ ] Descriptions (90 chars) NUNCA devem ter erros — espaço suficiente para português correto

**Regra**: Copy com erro de português NÃO pode ser publicada. Erros de acentuação em ads prejudicam a credibilidade da marca e podem reduzir CTR.

### 4. Validação de Copy
Para cada peça, verificar:
- [ ] Nenhum termo proibido presente
- [ ] **Português correto** (acentos, cedilha, concordância) — ver seção 3
- [ ] Claims ancorados em dados reais
- [ ] Tom alinhado com a marca (confrontacional mas respeitoso)
- [ ] CTA claro e sem pressão abusiva
- [ ] Disclaimer de resultados quando aplicável
- [ ] Compliance com plataforma de destino (Meta/Google/LinkedIn)

## Output
Relatório com:
- **APROVADO** / **REPROVADO** / **APROVADO COM RESSALVAS**
- Lista de problemas encontrados (se houver)
- Sugestões de correção para cada problema
- Nível de risco: Baixo / Médio / Alto / Crítico

### 4. Regras por Plataforma
Consultar `references/regras-plataformas.md` para regras detalhadas por plataforma.
Cada plataforma tem restrições específicas que devem ser validadas:
- **Meta (Facebook/Instagram):** Sem "Você" em atributo negativo, sem before/after implícito, sem urgência falsa, sem "Grátis" enganoso, max 3 emojis, regra 20% texto em imagem, categorias especiais
- **Google Ads:** Sem superlativos não verificados, sem pontuação excessiva, sem CAPS excessivo, políticas de marca, limites de caracteres
- **LinkedIn:** Linguagem profissional, sem claims de renda/salário sem base, compliance B2B, formato nativo preferido

## References
- `references/termos-proibidos.md` — Lista completa de termos proibidos por categoria
- `references/checklist-imagem.md` — Checklist de validação visual para criativos
- `references/regras-plataformas.md` — Regras detalhadas de compliance por plataforma (Meta, Google, LinkedIn)
