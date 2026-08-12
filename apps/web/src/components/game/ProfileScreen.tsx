import { useEffect, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { fetchMe, createPlayer, renamePlayer, setAvatar, ApiError, MeResponse } from '@/lib/api';
import { sound } from '@/lib/sound';
import { Country, Stats, PlayerProfile, formatMoney, levelProgress, xpForLevel, storageAvailable, levelTagline, LEVEL_TITLES, LEVEL_LADDER, MAX_LEVEL, levelFromXp, levelTitle, loadGuestAvatar, saveGuestAvatar, loadIntelCollected } from '@/lib/game';
import { CATEGORY_LABELS } from '@/data/cards';
import { INTEL_STATS, type IntelRarity } from '@/data/intel';
import { Avatar, AVATAR_IDS, AVATAR_LABELS, avatarFor, type AvatarId } from '@/components/ui/Avatar';
import {
  BODY, DISPLAY, MONO,
  PAPER, INK, INK_SOFT, INK_FAINT, INK_MICRO, HAIRLINE, SURFACE, PAPER_ON_INK,
  SCAM, LEGIT, GOLD, GOLD_TEXT, GOLD_GRAD, GOLD_SOFT,
  SHADOW_SM, SHADOW_MD,
  BORDER_INK, PREMIUM_CARD_SM,
  SERIF,
  EASE_OUT,
  Pressable,
} from '@/lib/ui';
import {
  Banknote, Bitcoin, Briefcase, Car, Check, ChevronDown, CreditCard, Dices, Eye, FileText, Fish,
  Gamepad2, Gift, GraduationCap, HandHeart, Headphones, Heart, Home as HomeIcon,
  IndianRupee, Landmark, Lock, MessageCircle, Mic, Package, PawPrint, Pencil, Plane,
  RefreshCw, ShieldCheck, ShoppingBag, Siren, Smartphone, Star, Tag, Ticket,
  TrendingUp, Zap,
  type LucideIcon,
} from 'lucide-react';

type Tier = 'gold' | 'silver' | 'bronze';

/** Mastery tier per scam category: enough reps AND enough accuracy. */
function tierFor(right: number, attempts: number): Tier {
  const acc = attempts === 0 ? 0 : right / attempts;
  if (acc >= 0.9 && attempts >= 6) return 'gold';
  if (acc >= 0.7 && attempts >= 3) return 'silver';
  return 'bronze';
}

/**
 * Mastery ladder in the app's Gen Z claim voice (its own lane, separate from
 * level tiers and run grades): still learning, then consistent, then mastered.
 * Foil gradients make each badge read as a struck coin instead of a flat dot.
 */
const TIER_META: Record<Tier, { label: string; grad: string; text: string }> = {
  gold: { label: 'Goated', grad: GOLD_GRAD, text: GOLD },
  silver: { label: 'Locked in', grad: 'linear-gradient(180deg, #CDC3B4 0%, #ADA190 58%, #93866F 100%)', text: '#7A6E5C' },
  bronze: { label: 'Training arc', grad: 'linear-gradient(180deg, #C98B5E 0%, #A5643C 58%, #85502F 100%)', text: '#9A5B33' },
};

/** engraved face per scam category so every badge has its own identity */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  phishing: Fish, prize: Gift, crypto: Bitcoin, gaming: Gamepad2, delivery: Package,
  government: Landmark, banking: Banknote, job: Briefcase, marketplace: Tag,
  social: MessageCircle, housing: HomeIcon, security: Lock, school: GraduationCap,
  'money-games': Dices, shopping: ShoppingBag, romance: Heart, charity: HandHeart,
  subscription: RefreshCw, travel: Plane, 'tech-support': Headphones,
  investment: TrendingUp, identity: CreditCard, 'ai-voice': Mic, tickets: Ticket,
  pets: PawPrint, influencer: Star, toll: Car, blackmail: Eye, utility: Zap,
  upi: IndianRupee, kyc: FileText, 'loan-app': Smartphone, 'digital-arrest': Siren,
};

/** embossed metal face: light catches the top edge, shade pools at the bottom */
const COIN_EMBOSS = 'inset 0 2px 3px rgba(255,252,245,0.55), inset 0 -3px 5px rgba(56,36,18,0.32), 0 2px 0 rgba(34,27,22,0.18)';

function StatCell({ label, value, accent }: { label: string; value: string; accent?: 'green' | 'red' }) {
  const valueColor = accent === 'green' ? LEGIT : accent === 'red' ? SCAM : INK;
  return (
    <div
      className="rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-1.5"
      style={{ backgroundColor: SURFACE, border: BORDER_INK, boxShadow: PREMIUM_CARD_SM }}
    >
      <span className="text-[10px] font-medium uppercase tracking-[0.18em]" style={{ ...MONO, color: INK_MICRO }}>{label}</span>
      <span className="text-[26px] tabular-nums leading-none break-all" style={{ ...DISPLAY, fontWeight: 700, color: valueColor }}>
        {value}
      </span>
    </div>
  );
}

export function ProfileScreen({
  stats,
  profile,
  country,
  onProfileChange,
  onPlay,
}: {
  stats: Stats;
  profile: PlayerProfile | null;
  /** player's region; lifetime money stats render in local currency */
  country?: Country;
  onProfileChange: (p: PlayerProfile | null) => void;
  onPlay: () => void;
}) {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [meState, setMeState] = useState<'idle' | 'loading' | 'error'>(profile ? 'loading' : 'idle');

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    setMeState('loading');
    fetchMe(profile)
      .then((res) => {
        if (cancelled) return;
        setMe(res);
        setMeState('idle');
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 401) {
          /* server no longer knows this device; sign out quietly */
          onProfileChange(null);
          setMeState('idle');
        } else {
          setMeState('error');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [profile, onProfileChange]);

  /* ---------- pick / change name ---------- */
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [nameErr, setNameErr] = useState('');
  const [saving, setSaving] = useState(false);

  /* ---------- the ladder ---------- */
  const [openTier, setOpenTier] = useState<number | null>(null);
  const ladderLevel = me ? me.level : levelFromXp(stats.totalXp);
  const currentTier = Math.floor((Math.min(Math.max(1, ladderLevel), MAX_LEVEL) - 1) / 5);
  const fmtXp = (n: number): string =>
    n >= 10000 ? `${Math.round(n / 1000)}K` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

  const [picking, setPicking] = useState(false);
  const [guestAvatar, setGuestAvatar] = useState<string | null>(() => loadGuestAvatar());
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarErr, setAvatarErr] = useState('');

  const startEdit = () => {
    setNameDraft(profile ? profile.name : '');
    setNameErr('');
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setNameErr('');
  };

  const handlePickAvatar = async (id: AvatarId) => {
    if (avatarSaving) return;
    setAvatarErr('');
    if (!profile) {
      saveGuestAvatar(id);
      setGuestAvatar(id);
      sound.play('correct');
      setPicking(false);
      return;
    }
    setAvatarSaving(true);
    try {
      const res = await setAvatar(profile, id);
      onProfileChange({ ...profile, avatar: res.avatar });
      sound.play('correct');
      setPicking(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        /* server no longer knows this device; sign out quietly */
        onProfileChange(null);
        setPicking(false);
      } else {
        setAvatarErr('Could not save that pick. Try again.');
      }
    } finally {
      setAvatarSaving(false);
    }
  };

  const handleNameSave = async (e?: FormEvent) => {
    e?.preventDefault();
    if (saving) return;
    const trimmed = nameDraft.trim();
    if (trimmed.length < 2 || trimmed.length > 16) {
      setNameErr('Name must be 2-16 characters.');
      return;
    }
    if (profile && trimmed === profile.name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      if (profile) {
        const res = await renamePlayer(profile, trimmed);
        onProfileChange({ ...profile, name: res.name });
      } else {
        const res = await createPlayer(trimmed, guestAvatar ?? undefined);
        onProfileChange({ id: res.id, name: res.name, token: res.token, avatar: res.avatar });
      }
      sound.play('correct');
      setEditing(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        /* server no longer knows this device; sign out, naming CTA takes over */
        onProfileChange(null);
        setEditing(false);
      } else {
        setNameErr(err instanceof ApiError ? err.message : "That name won't fly. Try another.");
      }
    } finally {
      setSaving(false);
    }
  };

  const accuracy =
    stats.totalAnswered === 0 ? null : Math.round((stats.totalCorrect / stats.totalAnswered) * 100);

  const categoryKeys = Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>;
  const encountered = categoryKeys
    .map((key) => ({ key, label: CATEGORY_LABELS[key], tally: stats.categories[key] }))
    .filter((c) => c.tally && c.tally.right + c.tally.wrong > 0)
    .map((c) => {
      const right = c.tally!.right;
      const attempts = c.tally!.right + c.tally!.wrong;
      return { ...c, right, attempts, pct: Math.round((right / attempts) * 100), tier: tierFor(right, attempts) };
    })
    .sort((a, b) => b.attempts - a.attempts || b.pct - a.pct);
  const undiscovered = categoryKeys.length - encountered.length;

  const xpPct = me ? Math.round(levelProgress(me.totalXp) * 100) : 0;

  const currentAvatar = avatarFor(profile, guestAvatar);

  return (
    <div className="h-[100dvh] w-full overflow-y-auto" style={{ ...BODY, backgroundColor: PAPER, color: INK }}>
      <main className="max-w-[440px] mx-auto w-full px-6 pt-10 pb-36">
        {/* Header */}
        <div className="flex items-center justify-center mb-8">
          <div className="text-[10px] font-medium uppercase tracking-[0.22em]" style={{ ...MONO, color: INK_MICRO }}>Player profile</div>
        </div>

        {/* Identity */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
          className="flex flex-col items-center mt-2 mb-10"
        >
          <button
            type="button"
            onClick={() => {
              setPicking((p) => !p);
              setAvatarErr('');
            }}
            aria-expanded={picking}
            aria-label="Change profile picture"
            className="fiq-ring relative mb-5 rounded-full transition-transform active:scale-95"
            style={{ boxShadow: SHADOW_MD, lineHeight: 0 }}
          >
            <Avatar id={currentAvatar} size={92} />
            <div
              className="absolute -bottom-0.5 -right-0.5 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: GOLD, color: SURFACE, boxShadow: SHADOW_SM, border: `2px solid ${PAPER}` }}
            >
              <Pencil size={14} strokeWidth={2.5} />
            </div>
          </button>

          {picking && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              className="w-full rounded-2xl p-4 mb-6"
              style={{ backgroundColor: SURFACE, border: BORDER_INK, boxShadow: PREMIUM_CARD_SM }}
            >
              <div className="text-[10px] font-medium uppercase tracking-[0.18em] mb-3 text-center" style={{ ...MONO, color: INK_MICRO }}>
                Pick your face
              </div>
              <div className="grid grid-cols-4 gap-2">
                {AVATAR_IDS.map((id) => {
                  const active = id === currentAvatar;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handlePickAvatar(id)}
                      disabled={avatarSaving}
                      aria-label={AVATAR_LABELS[id]}
                      aria-pressed={active}
                      className="fiq-ring rounded-2xl p-1.5 flex items-center justify-center transition-transform active:scale-95"
                      style={{
                        backgroundColor: active ? GOLD_SOFT : 'transparent',
                        border: active ? `2px solid ${GOLD}` : '2px solid transparent',
                        opacity: avatarSaving && !active ? 0.55 : 1,
                      }}
                    >
                      <Avatar id={id} size={50} />
                    </button>
                  );
                })}
              </div>
              {avatarErr && (
                <div className="text-[11.5px] font-semibold text-center mt-3" style={{ color: SCAM }}>{avatarErr}</div>
              )}
            </motion.div>
          )}
          {editing ? (
            <form onSubmit={handleNameSave} className="w-full max-w-[300px] flex flex-col items-center gap-3 mb-3">
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => {
                  setNameDraft(e.target.value);
                  setNameErr('');
                }}
                maxLength={16}
                placeholder="2-16 characters"
                aria-label="Your player name"
                className="fiq-ring w-full text-center rounded-2xl px-4 py-3.5 text-[22px]"
                style={{ ...DISPLAY, fontWeight: 700, backgroundColor: SURFACE, border: BORDER_INK, boxShadow: SHADOW_SM, color: INK }}
              />
              {nameErr && (
                <div className="text-[11.5px] font-semibold text-center" style={{ color: SCAM }}>{nameErr}</div>
              )}
              <div className="flex gap-2.5 w-full">
                <Pressable
                  onClick={cancelEdit}
                  className="flex-1 rounded-2xl py-3 text-[12px] font-bold uppercase tracking-[0.12em] text-center"
                  style={{ ...MONO, backgroundColor: SURFACE, border: BORDER_INK, color: INK }}
                >
                  Cancel
                </Pressable>
                <Pressable
                  onClick={handleNameSave}
                  className="flex-1 rounded-2xl py-3 text-[12px] font-bold uppercase tracking-[0.12em] text-center"
                  style={{ ...MONO, background: GOLD_GRAD, border: BORDER_INK, color: INK }}
                >
                  {saving ? 'Saving...' : profile ? 'Save name' : 'Sign it'}
                </Pressable>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-center gap-2.5 mb-3 max-w-full">
              <h1 className="text-[34px] leading-none text-center break-words min-w-0 m-0" style={{ ...DISPLAY, fontWeight: 800 }}>
                {profile ? profile.name : 'Guest'}
              </h1>
              {profile && (
                <button
                  aria-label="Change name"
                  onClick={startEdit}
                  className="fiq-ring w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer"
                  style={{ backgroundColor: SURFACE, border: BORDER_INK, boxShadow: SHADOW_SM, color: INK }}
                >
                  <Pencil size={14} strokeWidth={2.25} />
                </button>
              )}
            </div>
          )}
          <div
            className="px-4 py-1.5 rounded-full text-[10px] font-medium tracking-[0.18em] uppercase text-center"
            style={{ ...MONO, backgroundColor: INK, color: PAPER_ON_INK, boxShadow: SHADOW_SM }}
          >
            {profile
              ? me
                ? me.levelTitle
                : meState === 'loading'
                  ? 'Checking ledger...'
                  : 'Fraud analyst'
              : 'Playing as guest'}
          </div>

          {!profile && !editing && storageAvailable && (
            <Pressable
              onClick={startEdit}
              className="mt-4 rounded-2xl px-6 py-3 text-[12px] font-bold uppercase tracking-[0.14em]"
              style={{ ...MONO, background: GOLD_GRAD, border: BORDER_INK, color: INK }}
            >
              Pick your name
            </Pressable>
          )}

          {profile && me && (
            <div className="mt-2.5 text-[13.5px] text-center" style={{ ...SERIF, color: INK_SOFT }}>
              {levelTagline(me.level)}
            </div>
          )}

          {!profile && !storageAvailable && (
            <div className="mt-4 text-[11px] font-medium leading-relaxed text-center max-w-[300px]" style={{ color: INK_SOFT }}>
              This browser view blocks local storage, so signed names do not stick here. Open the app in a regular tab and sign there.
            </div>
          )}

          {profile && me && (
            <div className="w-full mt-8">
              <div className="flex justify-between items-baseline mb-2 text-[10px] font-medium uppercase tracking-[0.16em]" style={MONO}>
                <span style={{ color: INK }}>Level {me.level}</span>
                <span style={{ color: INK_MICRO }}>{me.totalXp.toLocaleString('en-US')} / {xpForLevel(me.level + 1).toLocaleString('en-US')} XP</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(34,27,22,0.08)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPct}%` }}
                  transition={{ duration: 0.7, delay: 0.15, ease: EASE_OUT }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: GOLD }}
                />
              </div>
              <div className="mt-2 text-[10px] font-medium uppercase tracking-[0.16em]" style={{ ...MONO, color: INK_MICRO }}>
                {me.level >= MAX_LEVEL
                  ? 'Top of the ladder'
                  : `Next: Lvl ${me.level + 1} · ${levelTitle(me.level + 1)}`}
              </div>
              <div className="flex flex-wrap gap-2.5 mt-5 justify-center">
                {[
                  { label: 'Rank', value: `#${me.rank ?? '-'}` },
                  { label: 'Best score', value: String(me.bestScore) },
                  { label: 'Cases run', value: String(me.runs) },
                ].map((chip) => (
                  <div
                    key={chip.label}
                    className="rounded-full px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em]"
                    style={{ ...MONO, backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}`, color: INK_MICRO }}
                  >
                    {chip.label} <span className="ml-1 font-semibold tabular-nums" style={{ color: INK }}>{chip.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {profile && meState === 'error' && (
            <div className="mt-4 text-[10px] font-medium uppercase tracking-[0.14em] text-center" style={{ ...MONO, color: SCAM }}>
              Could not reach the ledger, showing local records only
            </div>
          )}
        </motion.div>

        {/* The ladder: 50 rungs, five per rank, harder deck every climb */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.04, ease: EASE_OUT }}
          className="mb-10"
        >
          <div className="flex items-baseline justify-between mb-4 px-1">
            <h2 className="text-[20px] m-0" style={{ ...DISPLAY, fontWeight: 700 }}>The ladder</h2>
            <div className="text-[10px] font-medium uppercase tracking-[0.16em] tabular-nums" style={{ ...MONO, color: INK_MICRO }}>
              Lvl {ladderLevel} of {MAX_LEVEL}
            </div>
          </div>
          <div className="rounded-[24px] overflow-hidden" style={{ backgroundColor: SURFACE, border: BORDER_INK, boxShadow: PREMIUM_CARD_SM }}>
            {LEVEL_TITLES.map((tier, ti) => {
              const start = ti * 5 + 1;
              const end = start + 4;
              const rungs = LEVEL_LADDER.slice(start - 1, end);
              const open = (openTier ?? currentTier) === ti;
              const reached = ladderLevel >= start;
              const isCurrentTier = ti === currentTier;
              return (
                <div key={tier} style={ti > 0 ? { borderTop: `1px solid ${HAIRLINE}` } : undefined}>
                  <button
                    onClick={() => setOpenTier((prev) => ((prev ?? currentTier) === ti ? -1 : ti))}
                    aria-expanded={open}
                    className="fiq-ring w-full px-4 py-3 flex items-center justify-between gap-3 cursor-pointer"
                    style={isCurrentTier
                      ? { backgroundColor: INK, color: PAPER_ON_INK }
                      : { backgroundColor: 'transparent', color: reached ? INK : INK_SOFT }}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="text-[13px] uppercase tracking-[0.06em] truncate" style={{ ...DISPLAY, fontWeight: 800 }}>{tier}</span>
                      {isCurrentTier && (
                        <span className="shrink-0 rounded-full px-2 py-0.5 text-[8.5px] font-semibold tracking-[0.14em]" style={{ ...MONO, backgroundColor: GOLD, color: INK }}>YOU</span>
                      )}
                    </span>
                    <span className="flex items-center gap-2.5 shrink-0">
                      <span className="text-[9.5px] font-medium tracking-[0.14em] uppercase tabular-nums" style={{ ...MONO, opacity: 0.75 }}>
                        Lvl {start}-{end}
                      </span>
                      <ChevronDown size={14} strokeWidth={2.5} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </span>
                  </button>
                  {open && (
                    <div style={{ borderTop: `1px solid ${HAIRLINE}` }}>
                      <div className="px-4 pt-2.5 pb-1 text-[11px] font-medium" style={{ color: INK_SOFT }}>{rungs[0].tagline}</div>
                      {rungs.map((rung) => {
                        const isHere = rung.level === ladderLevel;
                        const done = rung.level < ladderLevel;
                        return (
                          <div
                            key={rung.level}
                            className="px-4 py-2 flex items-center justify-between gap-3"
                            style={{ backgroundColor: isHere ? GOLD_SOFT : 'transparent', opacity: done ? 0.55 : 1 }}
                          >
                            <span className="flex items-center gap-2">
                              <span className="w-4 flex justify-center">
                                {done
                                  ? <Check size={12} strokeWidth={3} style={{ color: LEGIT }} />
                                  : isHere
                                    ? <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: GOLD }} />
                                    : <Lock size={10} strokeWidth={2.5} style={{ color: INK_FAINT }} />}
                              </span>
                              <span className="text-[11px] font-semibold tabular-nums tracking-[0.1em]" style={{ ...MONO }}>LVL {rung.level}</span>
                            </span>
                            <span className="flex items-center gap-3 tabular-nums">
                              <span className="text-[9.5px] font-medium tracking-[0.12em] uppercase" style={{ ...MONO, color: INK_MICRO }}>
                                deck {rung.shape[1]}·{rung.shape[2]}·{rung.shape[3]}
                              </span>
                              <span className="text-[11.5px] font-bold w-[64px] text-right">{fmtXp(rung.xp)} XP</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-2.5 px-1 text-[10px] font-medium uppercase tracking-[0.14em] text-center" style={{ ...MONO, color: INK_MICRO }}>
            deck a·b·c = easy · mid · expert cards per run
          </div>
        </motion.div>

        {/* Case files: the intel archive, recovered two files per run */}
        {(() => {
          const collected = loadIntelCollected();
          const pool = INTEL_STATS.filter((s) => s.region === country);
          const got = pool.filter((s) => collected.has(s.id));
          const pct = pool.length ? Math.round((got.length / pool.length) * 100) : 0;
          const rarityOrder: IntelRarity[] = ['classified', 'rare', 'common'];
          const rarityLabel: Record<IntelRarity, string> = {
            classified: 'Classified',
            rare: 'Rare files',
            common: 'Field notes',
          };
          return (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05, ease: EASE_OUT }}
              className="rounded-[24px] p-6"
              style={{ backgroundColor: SURFACE, border: BORDER_INK, boxShadow: PREMIUM_CARD_SM }}
            >
              <div className="flex items-center justify-between gap-3 mb-1">
                <div className="flex items-center gap-2.5">
                  <FileText size={20} strokeWidth={2.2} style={{ color: GOLD }} />
                  <h2 className="text-[20px] m-0" style={{ ...DISPLAY, fontWeight: 700 }}>Case files</h2>
                </div>
                <span
                  className="px-2.5 py-1 rounded-full text-[11px] font-bold tabular-nums"
                  style={{ ...MONO, backgroundColor: GOLD_SOFT, color: GOLD_TEXT }}
                >
                  {got.length}/{pool.length}
                </span>
              </div>
              <p className="text-[12.5px] font-medium mt-0 mb-4" style={{ color: INK_SOFT }}>
                Real fraud intel, recovered mid-run. Every file is sourced.
              </p>
              <div
                className="h-[4px] rounded-full mb-5 overflow-hidden"
                role="progressbar"
                aria-valuenow={got.length}
                aria-valuemin={0}
                aria-valuemax={pool.length}
                aria-label="Case files recovered"
                style={{ backgroundColor: 'rgba(34,27,22,0.08)' }}
              >
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: GOLD_GRAD }} />
              </div>
              {got.length === 0 ? (
                <div
                  className="rounded-2xl px-4 py-5 text-center text-[13px] font-medium leading-relaxed"
                  style={{ backgroundColor: 'rgba(34,27,22,0.04)', color: INK_SOFT, border: `1px dashed ${HAIRLINE}` }}
                >
                  Intel drops between cases while you play.
                  <br />
                  Run a deck, crack your first file.
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {rarityOrder.map((tier) => {
                    const tierPool = pool.filter((s) => s.rarity === tier);
                    if (!tierPool.length) return null;
                    const tierGot = tierPool.filter((s) => collected.has(s.id)).length;
                    return (
                      <div key={tier}>
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className="text-[10px] font-medium uppercase tracking-[0.2em]"
                            style={{ ...MONO, color: tier === 'classified' ? GOLD_TEXT : INK_MICRO }}
                          >
                            {rarityLabel[tier]}
                          </span>
                          <span className="text-[10px] font-medium tabular-nums" style={{ ...MONO, color: INK_MICRO }}>
                            {tierGot}/{tierPool.length}
                          </span>
                        </div>
                        <div>
                          {tierPool.map((f) => {
                            const has = collected.has(f.id);
                            return (
                              <div
                                key={f.id}
                                className="flex items-start gap-3 py-2.5 border-b last:border-b-0"
                                style={{ borderColor: HAIRLINE }}
                              >
                                <span
                                  className="shrink-0 w-[72px] text-right text-[11.5px] font-bold tabular-nums leading-snug break-words"
                                  style={{ ...MONO, color: has ? (tier === 'common' ? SCAM : GOLD_TEXT) : INK_MICRO }}
                                >
                                  {has ? f.stat : '? ? ?'}
                                </span>
                                {has ? (
                                  <div className="min-w-0">
                                    <div className="text-[12.5px] font-semibold leading-snug" style={{ color: INK }}>
                                      {f.headline}
                                    </div>
                                    <div className="mt-0.5 text-[10px] font-medium" style={{ ...MONO, color: INK_MICRO }}>
                                      {f.source}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-[12.5px] font-medium leading-snug pt-0.5" style={{ color: INK_MICRO }}>
                                    Not yet recovered
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div
                className="mt-4 text-[10px] font-medium uppercase tracking-[0.14em] text-center"
                style={{ ...MONO, color: INK_MICRO }}
              >
                {got.length >= pool.length
                  ? 'Archive complete. Radar fully loaded.'
                  : `${pool.length - got.length} still out there. Files drop mid-run.`}
              </div>
            </motion.div>
          );
        })()}

        {stats.gamesPlayed === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.06, ease: EASE_OUT }}
            className="rounded-[24px] p-8 text-center"
            style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}`, boxShadow: SHADOW_MD }}
          >
            <div className="text-[22px] mb-2.5" style={{ ...DISPLAY, fontWeight: 700 }}>No cases on file yet</div>
            <div className="text-[13px] font-medium mb-7 leading-relaxed" style={{ color: INK_SOFT }}>
              Run your first case and this file starts filling itself in.
            </div>
            <Pressable
              pressScale={0.98}
              onClick={onPlay}
              className="rounded-2xl px-8 py-4"
              style={{ backgroundColor: INK, boxShadow: SHADOW_MD }}
            >
              <span className="text-[16px] uppercase tracking-[0.08em]" style={{ ...DISPLAY, fontWeight: 700, color: PAPER_ON_INK }}>Start a run</span>
            </Pressable>
          </motion.div>
        ) : (
          <>
            {/* Lifetime numbers, this device */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.06, ease: EASE_OUT }}
              className="mb-10"
            >
              <div className="flex items-baseline justify-between mb-4 px-1">
                <h2 className="text-[20px] m-0" style={{ ...DISPLAY, fontWeight: 700 }}>Case record</h2>
                <div className="text-[10px] font-medium uppercase tracking-[0.16em]" style={{ ...MONO, color: INK_MICRO }}>this device</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <StatCell label="Best streak" value={stats.bestStreak > 0 ? `x${stats.bestStreak}` : 'n/a'} />
                <StatCell label="Accuracy" value={accuracy === null ? 'n/a' : `${accuracy}%`} accent="green" />
                <StatCell label="Saved" value={formatMoney(stats.lifetimeSaved, country)} accent="green" />
                <StatCell label="Slipped past" value={formatMoney(stats.lifetimeLost, country)} accent="red" />
              </div>
            </motion.div>

            {/* Fraud file: per-category mastery, framed as badges */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.12, ease: EASE_OUT }}
              className="mb-6"
            >
              <div className="flex items-baseline justify-between mb-4 px-1">
                <h2 className="text-[20px] m-0" style={{ ...DISPLAY, fontWeight: 700 }}>Badges</h2>
                <div className="text-[10px] font-medium uppercase tracking-[0.16em]" style={{ ...MONO, color: INK_MICRO }}>
                  {encountered.length}/{categoryKeys.length} on record
                </div>
              </div>

              {encountered.length === 0 ? (
                <div
                  className="rounded-2xl p-5 text-[13.5px] font-medium"
                  style={{ backgroundColor: SURFACE, border: BORDER_INK, boxShadow: PREMIUM_CARD_SM, color: INK_SOFT }}
                >
                  No receipts yet. Your first run starts the collection.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {encountered.map((c) => {
                    const meta = TIER_META[c.tier];
                    const Icon = CATEGORY_ICONS[c.key] ?? ShieldCheck;
                    return (
                      <div
                        key={c.key}
                        className="rounded-2xl px-3.5 py-3 flex items-center gap-3.5"
                        style={{ backgroundColor: SURFACE, border: BORDER_INK, boxShadow: PREMIUM_CARD_SM }}
                      >
                        {/* coin medallion is the only tier color on the row; everything else stays quiet */}
                        <div
                          className="w-[44px] h-[44px] rounded-full flex items-center justify-center shrink-0"
                          style={{ background: meta.grad, border: BORDER_INK, boxShadow: COIN_EMBOSS }}
                        >
                          <Icon size={18} strokeWidth={2.25} style={{ color: INK, opacity: 0.78 }} />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1 gap-[3px]">
                          <span className="font-semibold text-[15.5px] leading-tight truncate">{c.label}</span>
                          <span className="text-[9px] font-semibold uppercase tracking-[0.13em] truncate" style={{ ...MONO, color: meta.text }}>
                            {meta.label}
                            <span style={{ color: INK_MICRO }}> · {c.attempts} {c.attempts === 1 ? 'case' : 'cases'} clocked</span>
                          </span>
                        </div>
                        <span className="shrink-0 tabular-nums text-[17px]" style={{ ...DISPLAY, fontWeight: 700 }}>{c.pct}%</span>
                      </div>
                    );
                  })}
                  {undiscovered > 0 && (
                    <div
                      className="rounded-2xl p-4 flex items-center gap-4 mt-0.5"
                      style={{ backgroundColor: 'rgba(34,27,22,0.04)', border: '1.5px dashed rgba(34,27,22,0.3)' }}
                    >
                      {/* blank coin slot waiting to be struck */}
                      <div
                        className="w-[44px] h-[44px] rounded-full flex items-center justify-center shrink-0"
                        style={{ border: '1.5px dashed rgba(34,27,22,0.3)', color: INK_FAINT }}
                      >
                        <Lock size={18} strokeWidth={2.25} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-[16px] leading-tight" style={{ color: INK_SOFT }}>
                          {undiscovered} more locked
                        </span>
                        <span className="text-[12px] font-medium mt-1" style={{ color: INK_MICRO }}>
                          {undiscovered === 1 ? 'scam type' : 'scam types'} still in the wild
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}

        {profile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-col items-start gap-3.5 mt-12 pt-8"
            style={{ borderTop: `1px solid ${HAIRLINE}` }}
          >
            <Pressable
              quiet
              onClick={() => onProfileChange(null)}
              className="rounded-full text-[11px] px-5 py-2.5 font-semibold uppercase tracking-[0.12em]"
              style={{ ...MONO, backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}`, color: SCAM, boxShadow: SHADOW_SM }}
            >
              Sign out on this device
            </Pressable>
            <div className="text-[10px] font-medium uppercase tracking-[0.14em]" style={{ ...MONO, color: INK_MICRO }}>
              Your ledger entries stay, this device just forgets the name.
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
