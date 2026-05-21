# Template de Registro de Metricas

> Use este template para registrar metricas de cada campanha/criativo publicado.
> Copie e preencha no `historico-performance.md`.

---

## Registro Individual (por criativo)

```markdown
### [Nome do Criativo] — [Plataforma]

**Publicado em:** [DATA]
**Angulo:** [qual dos 6]
**Persona:** [qual das 5]
**Gancho:** [formula do hook-selector]
**Formato:** [imagem/video/carrossel/LP]

#### Metricas (48h)
| Metrica | Valor | Benchmark | Delta |
|---------|-------|-----------|-------|
| Impressoes | X | — | — |
| Hook Rate | X% | >25% (img) / >30% (video) | +/-X% |
| CTR | X% | >0.5% (LinkedIn) / >1% (Meta) | +/-X% |
| CPL | R$X | <R$20 | +/-R$X |
| CPA | R$X | <R$300 | +/-R$X |
| Watchtime 50% | X% | >30% | +/-X% |
| Completion Rate | X% | >15% | +/-X% |
| Frequencia | X | <3.5 | — |
| Custo Total | R$X | — | — |
| Leads Gerados | X | — | — |
| Vendas | X | — | — |

#### Classificacao
**Matriz Hook x Watchtime:** [Vencedor / Oportunidade / Decepcao / Morte]
**Acao Recomendada:** [Escalar / Otimizar Gancho / Otimizar Corpo / Descartar]
**Prioridade:** [Alta / Media / Baixa]

#### Aprendizados
- **O que funcionou:** [especifico]
- **O que nao funcionou:** [especifico]
- **Hipotese para proxima iteracao:** [o que testar]
```

---

## Registro de Campanha (agregado)

```markdown
## [DATA] — [NOME DA CAMPANHA]

### Resumo
- **N criativos:** X
- **Budget total:** R$X
- **Periodo:** [inicio] a [fim]
- **Plataforma:** [qual]

### Performance Agregada
| Metrica | Media | Melhor | Pior |
|---------|-------|--------|------|
| Hook Rate | X% | Criativo Y (X%) | Criativo Z (X%) |
| CTR | X% | Criativo Y (X%) | Criativo Z (X%) |
| CPL | R$X | Criativo Y (R$X) | Criativo Z (R$X) |
| CPA | R$X | Criativo Y (R$X) | Criativo Z (R$X) |

### Winners (escalar)
1. [Criativo] — CPL R$X, Hook X%, razao: [por que funcionou]

### Losers (pausar)
1. [Criativo] — CPL R$X, Hook X%, razao: [por que falhou]

### Decisoes para Proxima Iteracao
1. [Manter angulo X, trocar gancho]
2. [Escalar criativo Y com +20% budget]
3. [Criar variacao de Z com novo hook]
```

---

## Checklist Pos-Publicacao

- [ ] Metricas coletadas apos 48h minimo
- [ ] Cada criativo classificado na Matriz Hook x Watchtime
- [ ] Winners identificados (CPL < benchmark + volume > 20 leads)
- [ ] Losers identificados (CPL > R$20 por 3 dias OU Hook < 20%)
- [ ] Aprendizados registrados no historico
- [ ] Dashboard-resumo atualizado
- [ ] Proxima iteracao planejada com base nos dados
