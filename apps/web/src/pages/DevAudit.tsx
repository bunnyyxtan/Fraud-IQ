import { useEffect, useState } from 'react';
import { CARDS, BOSS_CARDS, GameCard } from '@/data/cards';
import { INTEL_STATS } from '@/data/intel';
import { resolveRound, RoundResult } from '@/lib/game';
import { PlayScreen } from '@/components/game/PlayScreen';
import { IntelCard } from '@/components/game/IntelCard';
import NotFound from '@/pages/not-found';

/**
 * Dev-only automated-audit surface: renders the REAL PlayScreen (exact game
 * geometry, timer, headers, action buttons) for any card in the full pool, or
 * the real IntelCard for any intel file. A headless-browser script drives it
 * through window.__audit(i, mode, reveal) and measures the DOM for clipped or
 * unreachable content. Never reachable in production builds.
 */

const ALL_CARDS: GameCard[] = [...CARDS, ...BOSS_CARDS];

type AuditMode = 'card' | 'intel';
/** false = playing, true = correct-answer reveal, 'wrong' = wrong-call reveal */
type RevealMode = boolean | 'wrong';

interface AuditState {
  mode: AuditMode;
  i: number;
  reveal: RevealMode;
}

declare global {
  interface Window {
    __audit?: (i: number, mode?: AuditMode, reveal?: RevealMode) => { total: number; id: string | null };
    __auditTotals?: { cards: number; intel: number };
    __auditCards?: { id: string; kind: string; region: string; len: number; boss: boolean }[];
  }
}

export default function DevAudit() {
  const params = new URLSearchParams(window.location.search);
  const [state, setState] = useState<AuditState>({
    mode: (params.get('mode') as AuditMode) || 'card',
    i: Number(params.get('i') ?? 0),
    reveal: params.get('reveal') === '1',
  });

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    window.__auditTotals = { cards: ALL_CARDS.length, intel: INTEL_STATS.length };
    window.__auditCards = ALL_CARDS.map((c) => ({
      id: c.id,
      kind: c.kind,
      region: c.region ?? 'global',
      len: c.body.length + (c.subject?.length ?? 0),
      boss: !!c.boss,
    }));
    window.__audit = (i, mode = 'card', reveal = false) => {
      setState({ mode, i, reveal });
      const total = mode === 'intel' ? INTEL_STATS.length : ALL_CARDS.length;
      const id = mode === 'intel' ? (INTEL_STATS[i]?.id ?? null) : (ALL_CARDS[i]?.id ?? null);
      return { total, id };
    };
    return () => {
      delete window.__audit;
      delete window.__auditTotals;
      delete window.__auditCards;
    };
  }, []);

  if (!import.meta.env.DEV) return <NotFound />;

  if (state.mode === 'intel') {
    const intel = INTEL_STATS[state.i];
    if (!intel) return <div data-audit-missing="1">intel index out of range</div>;
    return <IntelCard key={intel.id} intel={intel} casesDone={4} onContinue={() => {}} />;
  }

  const raw = ALL_CARDS[state.i];
  if (!raw) return <div data-audit-missing="1">card index out of range</div>;
  // Boss cards normally sit behind the boss-intro gate; strip the flag so the
  // exhibit itself renders (the slot geometry is identical either way).
  const card: GameCard = raw.boss ? { ...raw, boss: false } : raw;
  let feedback: RoundResult | undefined;
  if (state.reveal === 'wrong') {
    feedback = resolveRound(card, card.isScam ? 'legit' : 'scam', 8000, 2);
  } else if (state.reveal) {
    feedback = resolveRound(card, card.isScam ? 'scam' : 'legit', 8000, 2);
  }

  return (
    <PlayScreen
      key={`${card.id}-${state.reveal ? 'r' : 'n'}`}
      card={card}
      lives={3}
      streak={2}
      score={450}
      totalCards={13}
      currentIndex={11}
      mode="classic"
      country={raw.region === 'in' ? 'in' : 'us'}
      onChoice={() => {}}
      onQuit={() => {}}
      feedbackResult={feedback}
      onNext={state.reveal ? () => {} : undefined}
    />
  );
}
