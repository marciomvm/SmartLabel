# Draft: Sistema de Gestão de Cogumelos (Mushroom ERP)

## Requirements (Confirmed)
- **Core Value**: Rastreabilidade Genealógica (Parent/Child), FIFO, Inventário Rápido.
- **Entities**: 
  - Batches (Grão, Substrato, Cultura Líquida)
  - Actions (Logs de movimentação/transformação)
  - Settings (Tempos de colonização por strain)
- **UI/UX**:
  - Mobile-first para operação no galpão (Shed).
  - Scan-to-Action (QR Code abre ações diretas).
  - Dashboard para CEO (Kanban, Forecast, Death Rate).
- **Architecture Suggestion**: Relacional (SQL).

## Technical Strategy (Confirmed)
- **Stack**: Next.js 14 (App Router) + Tailwind CSS + Shadcn/UI.
- **Database**: SQLite (via Prisma). Local file-based DB.
- **Auth**: Simple Password Protection (Single User).
- **Hosting**: Local execution (`npm run start` or Docker).

## Open Questions
1. **Testing Strategy**: Dado que a lógica de "Death Rate" e "Traceability" é crítica financeiramente, você prefere:
   - **TDD (Test Driven Development)**: Escrever testes antes do código (Garante que a lógica de "Parent/Child" nunca quebre). Demora +20% para criar, mas economiza horas de bugs.
   - **Manual QA**: Criamos checklists de teste manual. Mais rápido para "codar", mas maior risco de regressão.
