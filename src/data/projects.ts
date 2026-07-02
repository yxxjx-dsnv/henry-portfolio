import type { Project } from '../types';

// Brief project archive drawn from the resume. Hover a row for a one-line detail.
export const projects: Project[] = [
  {
    name: 'Multi-tenant AI Workplace Messenger',
    date: '2026',
    stack: ['Next.js', 'TypeScript', 'Supabase', 'Multi-LLM'],
    detail: [
      'B2B SaaS messenger with 4-provider LLM dispatch (Claude, Groq, OpenAI, Gemini), real-time chat over a 25+ table PostgreSQL schema, and Instagram DM auto-reply — white-label onboarding in ~30 minutes.',
    ],
  },
  {
    name: 'AI Review-Reply Engine',
    date: '2026',
    stack: ['Claude CLI', 'bash', 'AppleScript', 'macOS'],
    detail: [
      '24/7 autonomous engine that generates brand-matched review replies in ~12s (3–5× faster than manual) across Naver SmartStore brands, with hallucination / ID-match safety gates (87/87 tests).',
    ],
  },
  {
    name: 'AI Customer-Service Bot (Naver TalkTalk)',
    date: '2026',
    stack: ['Supabase', 'Claude', 'Webhooks'],
    detail: [
      'Human-in-the-loop CS bot that auto-drafts every reply via a webhook → Supabase → Claude pipeline, with 17+ legal / refund-risk filters and Claude vision — zero duplicate-sends in 24h production.',
    ],
  },
  {
    name: 'China-Sourcing SPA',
    date: '2026',
    stack: ['Next.js', 'TypeScript', 'Claude Vision'],
    detail: ['7,290-line sourcing app with AI invoice OCR (Claude vision) for automated product-cost analysis.'],
  },
  {
    name: 'AI Copywriter & Settlement Tools',
    date: '2026',
    stack: ['Next.js', 'Automation'],
    detail: [
      'A bulk AI copywriter generating up to 500 Naver Cafe posts unattended, plus a group-buy settlement tool automating 3-source consolidation with 3.3% withholding logic.',
    ],
  },
  {
    name: 'MONO — Resale Analytics Platform',
    date: '2025',
    stack: ['AI', 'Automation', 'Shopify'],
    detail: ['AI-driven resale analytics that automates profit prediction and Shopify listings across global marketplaces.'],
  },
  {
    name: 'APS112 — Arduino Real-Time Detection',
    date: 'Jan 2026 - Apr 2026',
    stack: ['Arduino', 'C'],
    detail: ['Arduino-based real-time detection system; led hardware–software integration for the team.'],
  },
  {
    name: 'CIV102 — Matboard Bridge',
    date: 'Sep 2025 - Dec 2025',
    stack: ['Structural Design'],
    detail: ['Designed and fabricated a matboard bridge applying load distribution, truss analysis, and failure prediction.'],
  },
  {
    name: 'PHY180 — Simple Harmonic Motion',
    date: 'Sep 2025 - Dec 2025',
    stack: ['Experiment', 'Data Analysis'],
    detail: ['Research-driven pendulum experiment analyzing SHM, documented in a rigorous academic lab report.'],
  },
];
