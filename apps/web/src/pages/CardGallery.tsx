import { CARDS, CardKind } from '@/data/cards';
import { CardDisplay } from '@/components/game/CardDisplay';
import NotFound from '@/pages/not-found';

/**
 * Dev-only visual QA surface: renders one card of every kind side by side
 * so chrome changes can be checked at a glance. Not reachable in production.
 */
export default function CardGallery() {
  if (!import.meta.env.DEV) return <NotFound />;

  const popupIds = [
    't1-popup-virus-renew',
    't2-popup-chrome-update',
    't2-popup-classroom-due',
    't3-popup-defender-lock',
    't3-popup-breach-check',
  ];
  const otherKinds: CardKind[] = ['email', 'sms', 'dm', 'payment', 'call', 'ad'];

  const entries = [
    // Every card that ships a photo first, so image slots can be QA'd at a glance.
    ...CARDS.filter((c) => c.image).map((card) => ({ card, tells: false })),
    ...popupIds.map((id) => ({ card: CARDS.find((c) => c.id === id), tells: false })),
    { card: CARDS.find((c) => c.id === 't3-popup-defender-lock'), tells: true },
    ...otherKinds.map((kind) => ({ card: CARDS.find((c) => c.kind === kind), tells: false })),
  ].filter((e): e is { card: NonNullable<typeof e.card>; tells: boolean } => !!e.card);

  return (
    <div className="min-h-screen bg-[#f2f1e9] p-8">
      <h1 className="font-black text-3xl mb-1 uppercase tracking-tight">Card Gallery</h1>
      <p className="font-mono text-xs text-zinc-500 mb-8 uppercase tracking-widest">
        Dev-only chrome QA. Photo cards first, then popups, then one of each kind.
      </p>
      <div className="flex flex-wrap gap-10 items-start">
        {entries.map(({ card, tells }, i) => {
          const wide = card.kind === 'email' || card.kind === 'popup';
          return (
            <figure key={`${card.id}-${tells}-${i}`}>
              <div className={`${wide ? 'w-[360px] md:w-[560px]' : 'w-[360px]'} h-[560px]`}>
                <CardDisplay card={card} showTells={tells} />
              </div>
              <figcaption className="mt-2 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                {card.kind} / {card.id}{tells ? ' / reveal' : ''}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </div>
  );
}
