import { GameCard } from '@/data/cards';
import { HighlightedText } from './HighlightedText';
import React from 'react';
import { MONO, INK, PAPER_ON_INK, BORDER_INK, PREMIUM_CARD, SHADOW_SM } from '@/lib/ui';

/**
 * Evidence Desk exhibit panel. The outer frame is a white card with a 1px
 * hairline, big rounded corners, a layered soft shadow and an ink "The
 * Evidence" tab. INSIDE the frame each card kind renders as a realistic
 * artifact (iOS messages, email client, payment receipt, DM app, browser
 * popup, call transcript, sponsored ad) using the existing card data.
 */

// Outer exhibit frame shared by every card kind.
function EvidenceFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full w-full flex flex-col relative pt-3">
      {/* Ink label tab: lives on the outer wrapper so the overflow-hidden
          panel below can never clip it. */}
      <div
        className="absolute top-0 left-6 px-3.5 py-1.5 rounded-full text-[9px] font-medium uppercase tracking-[0.2em] z-30"
        style={{ ...MONO, backgroundColor: INK, color: PAPER_ON_INK, boxShadow: SHADOW_SM }}
      >
        The Evidence
      </div>
      <div
        className="flex-1 min-h-0 bg-white overflow-hidden relative flex flex-col rounded-[24px]"
        style={{ border: BORDER_INK, boxShadow: PREMIUM_CARD }}
      >
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

const ChevronLeft = ({ color }: { color: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6" />
  </svg>
);

/**
 * Scrollable evidence body with a visible "there is more" affordance.
 * Mobile browsers hide scrollbars, so long content used to look CUT at the
 * frame edge. When the body can still scroll down, a bottom fade plus a tiny
 * chevron marks the continuation; both vanish at the end of the content.
 */
function ScrollBody({
  outerClassName = 'flex-1 min-h-0',
  className = '',
  fadeColor = '#FFFFFF',
  children,
}: {
  outerClassName?: string;
  className?: string;
  fadeColor?: string;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const innerRef = React.useRef<HTMLDivElement>(null);
  const [more, setMore] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setMore(el.scrollHeight - el.scrollTop - el.clientHeight > 8);
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    if (innerRef.current) ro.observe(innerRef.current);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, []);

  // rgba() keeps the fade in the body's own surface color
  const toRgba = (hex: string, a: number) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  };

  return (
    <div className={`relative ${outerClassName}`}>
      <div ref={ref} className={`h-full overflow-y-auto ${className}`}>
        <div ref={innerRef} className="min-h-full flex flex-col">
          {children}
        </div>
      </div>
      {more && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 flex items-end justify-center pb-1.5"
          style={{ background: `linear-gradient(to bottom, ${toRgba(fadeColor, 0)}, ${fadeColor} 82%)` }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      )}
    </div>
  );
}

const UserAvatar = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

// SMS CARD: iOS Messages
function SmsCard({ card, showTells }: { card: GameCard, showTells: boolean }) {
  return (
    <EvidenceFrame>
      {/* iOS SMS header */}
      <div className="bg-[#F9F9F9] border-b border-[#E5E5E5] pt-6 pb-2 px-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1 text-[#007AFF]">
          <ChevronLeft color="#007AFF" />
          <div className="w-8 h-8 rounded-full bg-[#E5E5EA] flex items-center justify-center text-[#8E8E93] ml-1">
            <UserAvatar />
          </div>
        </div>
        <div className="flex flex-col items-center min-w-0 px-2">
          <span className="text-[13px] font-semibold text-black leading-tight flex items-center gap-1 truncate max-w-[180px]">
            <HighlightedText text={card.sender} tells={card.tells} showHighlights={showTells} />
          </span>
          <span className="text-[11px] text-[#8E8E93] leading-tight font-medium mt-0.5">Text Message</span>
        </div>
        <div className="w-8" />
      </div>
      {/* SMS body */}
      <ScrollBody outerClassName="flex-1 min-h-0 bg-white" className="px-4 py-5">
        <div className="text-center text-[11px] font-medium text-[#8E8E93] mb-4">now</div>
        <div className="flex">
          <div className="bg-[#E9E9EB] text-black text-[15px] leading-[1.35] rounded-[18px] rounded-tl-sm px-3.5 py-2.5 max-w-[88%] font-normal tracking-[-0.01em]">
            <HighlightedText text={card.body} tells={card.tells} showHighlights={showTells} />
          </div>
        </div>
        <div className="h-6 shrink-0" />
      </ScrollBody>
    </EvidenceFrame>
  );
}

// EMAIL CARD: mail client
function EmailCard({ card, showTells }: { card: GameCard, showTells: boolean }) {
  return (
    <EvidenceFrame>
      {/* mail toolbar */}
      <div className="bg-[#F5F5F7] border-b border-[#E1E1E4] pt-6 pb-2 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1 text-[#007AFF] text-[15px] font-medium">
          <ChevronLeft color="#007AFF" />
          <span>Inbox</span>
        </div>
        <div className="flex gap-5 text-[#007AFF]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v2" /><path d="m17 9 4 4-4 4" /></svg>
        </div>
      </div>
      {/* subject + sender */}
      <div className="px-5 pt-4 pb-3 border-b border-[#ECECEC] shrink-0 bg-white">
        <h3 className="font-semibold text-[19px] leading-tight mb-3 text-black">
          {card.subject ? <HighlightedText text={card.subject} tells={card.tells} showHighlights={showTells} /> : '(No Subject)'}
        </h3>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#007AFF] text-white flex items-center justify-center font-semibold text-[15px] shrink-0">
            {card.sender[0]?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold text-black truncate">
              <HighlightedText text={card.sender} tells={card.tells} showHighlights={showTells} />
            </div>
            <div className="text-[12px] text-[#8E8E93]">to me</div>
          </div>
          <div className="text-[12px] text-[#8E8E93] shrink-0">now</div>
        </div>
      </div>
      {/* body */}
      <ScrollBody outerClassName="flex-1 min-h-0 bg-white" className="px-5 py-4">
        <div className="text-[15px] whitespace-pre-wrap text-[#1c1c1e] leading-relaxed">
          <HighlightedText text={card.body} tells={card.tells} showHighlights={showTells} />
        </div>
      </ScrollBody>
    </EvidenceFrame>
  );
}

// PAYMENT CARD: payment app receipt
function PaymentCard({ card, showTells }: { card: GameCard, showTells: boolean }) {
  const AMOUNT_RE = /(?:\$|Rs\.?\s?|₹\s?)[\d,]+(?:\.\d{2})?/;
  const amountMatch = card.subject?.match(AMOUNT_RE) ?? card.body.match(AMOUNT_RE);
  const amountStr = amountMatch ? amountMatch[0] : '$0';
  const isRequest = (card.subject ?? '').toLowerCase().includes('request');
  const appName = card.app ?? 'Payments';

  return (
    <EvidenceFrame>
      {/* app header */}
      <div className="bg-[#3D95CE] pt-6 pb-3 px-4 flex items-center justify-between shrink-0 text-white">
        <ChevronLeft color="#ffffff" />
        <div className="font-semibold text-[16px] tracking-tight">{appName}</div>
        <div className="w-[22px]" />
      </div>
      {/* receipt + memo scroll as one page, so a short screen never buries
          the note under a fixed receipt block */}
      <ScrollBody outerClassName="flex-1 min-h-0 bg-[#FAFAFA]" fadeColor="#FAFAFA">
        <div className="px-6 pt-6 pb-5 text-center border-b border-[#EDEDED] bg-white shrink-0">
          <div className="w-14 h-14 rounded-full bg-[#EAF4FB] mx-auto mb-3 flex items-center justify-center">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#3D95CE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
          </div>
          <div className="text-[12px] font-semibold text-[#8E8E93] mb-2 uppercase tracking-wide">
            {isRequest ? 'Payment Request' : 'Payment Received'}
          </div>
          <div className="text-[44px] font-bold mb-3 tracking-tight text-black tabular-nums leading-none">{amountStr}</div>
          <div className="text-[14px] text-[#636366]">
            from <span className="font-semibold text-black"><HighlightedText text={card.sender} tells={card.tells} showHighlights={showTells} /></span>
          </div>
        </div>
        <div className="px-5 py-5 flex-1 flex flex-col">
          <div className="bg-white p-4 rounded-2xl border border-[#EDEDED] mb-auto">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[#8E8E93] mb-1.5">Note</div>
            <div className="text-[15px] text-[#1c1c1e] leading-relaxed">
              <HighlightedText text={card.body} tells={card.tells} showHighlights={showTells} />
            </div>
          </div>
          {!showTells && isRequest && (
            <div className="flex gap-3 mt-5 shrink-0">
              <div className="flex-1 py-3 rounded-full text-center bg-[#F0F0F2] text-[#3D95CE] font-semibold text-[15px]">Decline</div>
              <div className="flex-1 py-3 rounded-full text-center bg-[#3D95CE] text-white font-semibold text-[15px]">Pay</div>
            </div>
          )}
        </div>
      </ScrollBody>
    </EvidenceFrame>
  );
}

// DM CARD: chat app
function DmCard({ card, showTells }: { card: GameCard, showTells: boolean }) {
  const appName = card.app ?? 'Direct Message';
  return (
    <EvidenceFrame>
      {/* chat header */}
      <div className="bg-white border-b border-[#ECECEC] pt-6 pb-2 px-3 flex items-center gap-2 shrink-0">
        <ChevronLeft color="#007AFF" />
        <div className="w-9 h-9 rounded-full bg-[#E4E4EA] flex items-center justify-center text-[#636366] font-semibold text-[15px] shrink-0">
          {card.sender[0]?.toUpperCase() || '?'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold text-black truncate leading-tight">
            <HighlightedText text={card.sender} tells={card.tells} showHighlights={showTells} />
          </div>
          <div className="text-[11px] text-[#8E8E93] leading-tight">{appName}</div>
        </div>
      </div>
      {/* messages: mt-auto bottom-aligns short chats without the flex
          justify-end + overflow trap that makes long content top-unreachable */}
      <ScrollBody outerClassName="flex-1 min-h-0 bg-white" className="px-4 py-5">
        <div className="flex mt-auto">
          <div className="bg-[#EFEFEF] text-black px-4 py-2.5 rounded-3xl rounded-bl-md max-w-[85%] text-[15px] leading-[1.4]">
            <HighlightedText text={card.body} tells={card.tells} showHighlights={showTells} />
          </div>
        </div>
      </ScrollBody>
    </EvidenceFrame>
  );
}

// Promoted visual slot: real photo when the card ships one, neutral branded
// placeholder otherwise. A failed load falls back to the placeholder so the
// slot never renders as a broken image.
function AdVisual({ src }: { src?: string }) {
  const [failed, setFailed] = React.useState(false);
  if (src && !failed) {
    return (
      <div className="w-full flex-1 min-h-0 border-b border-[#EFEFEF] overflow-hidden bg-[#F0F0F2]">
        <img
          src={src}
          alt=""
          loading="eager"
          decoding="async"
          draggable={false}
          onError={() => setFailed(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }
  return (
    <div className="w-full bg-[#F0F0F2] flex-1 min-h-0 flex flex-col items-center justify-center p-8 text-center border-b border-[#EFEFEF] overflow-hidden">
      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-3 border border-[#E5E5E5]">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#B0B0B5" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
      </div>
      <div className="text-[#A0A0A5] text-[11px] tracking-wide uppercase font-semibold">Promoted</div>
    </div>
  );
}

// AD CARD: sponsored social post
function AdCard({ card, showTells }: { card: GameCard, showTells: boolean }) {
  const accountMatch = card.sender.match(/·\s*([^·]+)$/);
  const accountName = accountMatch ? accountMatch[1].trim() : card.sender;

  return (
    <EvidenceFrame>
      {/* account row */}
      <div className="pt-6 pb-3 px-4 flex items-center justify-between border-b border-[#EFEFEF] shrink-0 bg-white">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-[#E4E4EA] shrink-0" />
          <div className="min-w-0">
            <div className="text-[14px] font-semibold leading-none mb-1 truncate text-black">
              <HighlightedText text={accountName} tells={card.tells} showHighlights={showTells} />
            </div>
            <div className="text-[11px] text-[#8E8E93]">Sponsored</div>
          </div>
        </div>
        <div className="text-[#8E8E93] font-bold tracking-widest">•••</div>
      </div>
      {/* promoted visual */}
      <AdVisual src={card.image} />
      {/* caption */}
      <ScrollBody outerClassName="shrink-0 max-h-[40%] bg-white" className="px-4 py-3">
        <div className="text-[15px] leading-relaxed text-[#1c1c1e]">
          <span className="font-semibold mr-2 text-black">{accountName}</span>
          <HighlightedText text={card.body} tells={card.tells} showHighlights={showTells} />
        </div>
      </ScrollBody>
    </EvidenceFrame>
  );
}

// CALL CARD: live phone transcript
function CallCard({ card, showTells }: { card: GameCard, showTells: boolean }) {
  const transcript = card.body.replace(/^"+|"+$/g, '');
  return (
    <EvidenceFrame>
      {/* call header */}
      <div className="bg-[#1C1C1E] pt-8 pb-6 px-6 flex flex-col items-center text-center shrink-0">
        <div className="w-16 h-16 rounded-full bg-[#3A3A3C] flex items-center justify-center text-[#EDEDED] mb-3">
          <UserAvatar />
        </div>
        <div className="text-[17px] font-semibold text-white leading-snug max-w-full break-words px-1">
          <HighlightedText text={card.sender} tells={card.tells} showHighlights={showTells} />
        </div>
        <div className="text-[13px] text-[#98989F] mt-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" />
          Call in progress
        </div>
      </div>
      {/* transcript */}
      <div className="flex-1 min-h-0 bg-white flex flex-col px-5 py-4">
        <div className="flex items-center gap-2 mb-3 shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#FF3B30] animate-pulse" />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#FF3B30]">Live Transcript</span>
        </div>
        <ScrollBody outerClassName="flex-1 min-h-0">
          <div className="bg-[#F5F5F7] rounded-2xl p-4 text-[15px] italic text-[#1c1c1e] leading-relaxed mb-auto">
            <HighlightedText text={transcript} tells={card.tells} showHighlights={showTells} />
          </div>
        </ScrollBody>
        {!showTells && (
          <div className="pt-4 flex items-center justify-center gap-2 shrink-0 text-[#8E8E93]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
            <span className="text-[11px] uppercase tracking-wide font-semibold">Caller on the line</span>
          </div>
        )}
      </div>
    </EvidenceFrame>
  );
}

// POPUP CARD: browser system popup
function PopupCard({ card, showTells }: { card: GameCard, showTells: boolean }) {
  const isBrowserOwn = card.sender === 'Google Chrome';
  return (
    <EvidenceFrame>
      {/* browser chrome */}
      <div className="bg-[#E8E8ED] pt-6 pb-2 px-3 flex items-center gap-2 shrink-0 border-b border-[#D5D5DA]">
        <div className="flex gap-1.5 shrink-0">
          <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
          <span className="w-3 h-3 rounded-full bg-[#28C840]" />
        </div>
        {/* Generic address bar: lock glyph plus a neutral placeholder rail.
            No readable domain is shown so nothing can be mistaken for scenario
            evidence, per fraud-training guidance. */}
        <div className="flex-1 mx-2 bg-white rounded-md px-3 py-1.5 flex items-center gap-2 text-[#C4C4CC]" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          <span className="flex-1 h-2 rounded-full bg-[#E4E4EA]" />
        </div>
      </div>
      {/* desktop area with toast popup; the toast caps at the desktop height
          and scrolls INSIDE itself, so its message can never be cut by the
          frame edge */}
      <div className="flex-1 relative min-h-0 flex flex-col justify-center items-center p-5 bg-[#F0F0F2]">
        <div className="bg-white rounded-2xl w-full max-w-[360px] max-h-full overflow-hidden border border-[#E0E0E5] shadow-lg flex flex-col">
          <div className="px-4 pt-3 pb-2 flex items-center gap-2 text-[12px] text-[#636366] border-b border-[#EFEFEF] shrink-0">
            <div className="w-5 h-5 rounded-full bg-[#FF3B30] text-white flex items-center justify-center text-[11px] font-semibold shrink-0">!</div>
            <span className="truncate font-medium">
              {isBrowserOwn ? (
                <HighlightedText text={card.sender} tells={card.tells} showHighlights={showTells} />
              ) : (
                <>System Alert</>
              )}
            </span>
            <svg className="ml-auto shrink-0 text-[#8E8E93]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </div>
          <ScrollBody outerClassName="flex-1 min-h-0" className="p-4">
            {!isBrowserOwn && (
              <div className="text-[11px] text-[#8E8E93] mb-2 truncate">
                from <HighlightedText text={card.sender} tells={card.tells} showHighlights={showTells} />
              </div>
            )}
            {card.subject && (
              <div className="font-semibold text-[16px] text-black leading-snug mb-2">
                <HighlightedText text={card.subject} tells={card.tells} showHighlights={showTells} />
              </div>
            )}
            <div className="text-[14px] text-[#48484A] leading-relaxed">
              <HighlightedText text={card.body} tells={card.tells} showHighlights={showTells} />
            </div>
          </ScrollBody>
        </div>
      </div>
    </EvidenceFrame>
  );
}

export function CardDisplay({ card, showTells }: { card: GameCard, showTells: boolean }) {
  switch (card.kind) {
    case 'sms': return <SmsCard card={card} showTells={showTells} />;
    case 'email': return <EmailCard card={card} showTells={showTells} />;
    case 'payment': return <PaymentCard card={card} showTells={showTells} />;
    case 'dm': return <DmCard card={card} showTells={showTells} />;
    case 'ad': return <AdCard card={card} showTells={showTells} />;
    case 'call': return <CallCard card={card} showTells={showTells} />;
    case 'popup': return <PopupCard card={card} showTells={showTells} />;
    default: return <div className="p-8 text-center font-bold">Unknown Card Type</div>;
  }
}
