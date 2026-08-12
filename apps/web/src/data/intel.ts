// Fraud IQ - scam intel interstitials, collected as "case files"
// Region-aware: US players see US data (FTC, FBI), India players see India
// data (MHA, I4C, Ministry of Finance). Never cross the streams.
//
// Every number below is verified against primary or government-cited sources:
// - FTC press release "New FTC Data Show a Big Jump in Reported Losses to
//   Fraud to $12.5 Billion in 2024" (ftc.gov, March 10, 2025)
// - FTC consumer alert "Top scams of 2024" (consumer.ftc.gov, March 10, 2025)
// - FTC press release / data spotlight "Bitcoin ATMs: A payment portal for
//   scammers" (ftc.gov, September 3, 2024)
// - FBI press release for the 2024 IC3 Internet Crime Report (fbi.gov,
//   April 23, 2025)
// - MHA reply in Lok Sabha, July 22, 2025 (Rs 22,845 crore lost in 2024,
//   up 206%; 36 lakh+ financial fraud complaints)
// - Government reply in Parliament, March 2025 (Rs 1,935 crore lost to
//   digital arrest scams in 2024)
// - I4C 2024 data as reported (Rs 4,636 crore to trading scams across
//   2.28 lakh complaints)
// - Ministry of Finance reply in Rajya Sabha, March 24, 2026 (UPI fraud:
//   12.64 lakh cases, Rs 981 crore in FY 2024-25)
// Do NOT edit a number without re-verifying it against the source. Judges in
// fintech will know these figures.
//
// Files marked as "field manual" entries carry no statistics on purpose:
// they are the standing rules from official consumer advisories (RBI, NPCI,
// I4C, FTC, FCC). Rules, not numbers, so nothing to drift out of date.
//
// Rarity is collection metadata for the case-file archive, not a drop-rate
// mechanic. Drops stay context-matched to the card just played; rarity sets
// how the file is framed and foiled when it lands.

import type { CardKind, Category } from './cards';
import type { Country } from '@/lib/game';

export type IntelRarity = 'common' | 'rare' | 'classified';

export interface IntelStat {
  id: string;
  /** which player region this stat is for; stats never cross regions */
  region: Country;
  /** collection tier: field note, rare file, or classified file */
  rarity: IntelRarity;
  /** the big display figure, e.g. "$12.5B" */
  stat: string;
  /** one-line headline under the figure */
  headline: string;
  /** supporting detail, one or two short sentences */
  detail: string;
  /** attribution line shown on the card */
  source: string;
  /** card categories this stat speaks to; omit for run-anywhere stats */
  categories?: Category[];
  /** card kinds this stat speaks to (checked when categories miss) */
  kinds?: CardKind[];
}

const FTC_2024 = 'FTC Consumer Sentinel Network, 2024 US data';
const IC3_2024 = 'FBI IC3 Internet Crime Report, 2024';

export const INTEL_STATS: IntelStat[] = [
  // ---------- United States ----------
  {
    id: 'us-total-2024',
    region: 'us',
    rarity: 'rare',
    stat: '$12.5B',
    headline: 'Reported lost to fraud in the US in 2024',
    detail:
      'That is a 25% jump in a single year. Every case in this game is modeled on the scams doing that damage.',
    source: FTC_2024,
  },
  {
    id: 'us-ic3-total',
    region: 'us',
    rarity: 'rare',
    stat: '$16B+',
    headline: 'In internet crime losses reported to the FBI for 2024',
    detail:
      'Up 33% in one year, across 859,532 complaints. Phishing and spoofing were the most reported crime types.',
    source: IC3_2024,
  },
  {
    id: 'us-loss-rate',
    region: 'us',
    rarity: 'common',
    stat: '38%',
    headline: 'Of people who reported fraud in 2024 actually lost money',
    detail:
      'Up from 27% the year before. Scams are converting better, not just spreading wider. Spotting them fast is the defense.',
    source: FTC_2024,
  },
  {
    id: 'us-age-20s',
    region: 'us',
    rarity: 'rare',
    stat: '20-29',
    headline: 'This age group reported losing money to fraud more often than people 70+',
    detail:
      'This is not a grandparents-only problem. But when older adults did lose, they lost far more per person than any other age group.',
    source: FTC_2024,
  },
  {
    id: 'us-elders',
    region: 'us',
    rarity: 'rare',
    stat: '$5B',
    headline: 'Nearly this much was lost by Americans over 60 in 2024',
    detail:
      'The most of any age group, and they filed the most complaints too. One family conversation about scams can be worth thousands.',
    source: IC3_2024,
  },
  {
    id: 'us-investment',
    region: 'us',
    rarity: 'rare',
    stat: '$5.7B',
    headline: 'Lost to investment scams, the costliest category of 2024',
    detail:
      '79% of people who reported one lost money, with a median hit above $9,000. Guaranteed returns are the tell.',
    source: FTC_2024,
    categories: ['investment', 'money-games'],
  },
  {
    id: 'us-crypto-investment',
    region: 'us',
    rarity: 'classified',
    stat: '$6.5B',
    headline: 'Reported lost to crypto investment fraud in 2024',
    detail:
      'The single biggest loss bucket in FBI internet crime data. If a stranger is coaching your trades, you are the exit liquidity.',
    source: IC3_2024,
    categories: ['crypto'],
  },
  {
    id: 'us-imposter',
    region: 'us',
    rarity: 'common',
    stat: '$2.95B',
    headline: 'Lost to imposter scams, the most reported type in America',
    detail:
      'Fake banks, fake agencies, fake support reps. If someone contacts you claiming authority, verify through the real channel yourself.',
    source: FTC_2024,
    categories: ['banking', 'security', 'tech-support', 'identity', 'ai-voice'],
  },
  {
    id: 'us-gov-imposter',
    region: 'us',
    rarity: 'common',
    stat: '$789M',
    headline: 'Lost to government imposter scams in 2024',
    detail:
      'Up $171 million in one year. Real agencies do not call, text, or DM you demanding immediate payment.',
    source: FTC_2024,
    categories: ['government', 'toll'],
  },
  {
    id: 'us-bank-crypto-rails',
    region: 'us',
    rarity: 'rare',
    stat: '$2B',
    headline: 'Lost through bank transfers, the costliest way to pay a scammer',
    detail:
      'Add $1.4 billion in crypto and those two rails beat every other payment method combined. That is why scammers push you off card payments.',
    source: FTC_2024,
    kinds: ['payment'],
  },
  {
    id: 'us-btm',
    region: 'us',
    rarity: 'classified',
    stat: '$65M',
    headline: 'Fed into Bitcoin ATMs by scam victims in just the first half of 2024',
    detail:
      'Losses through crypto ATMs grew nearly tenfold since 2020. Nobody legitimate ever directs you to pay at a Bitcoin ATM.',
    source: 'FTC Data Spotlight, September 2024',
    categories: ['tech-support'],
    kinds: ['popup'],
  },
  {
    id: 'us-social-contact',
    region: 'us',
    rarity: 'rare',
    stat: '70%',
    headline: 'Of people contacted by scammers on social media lost money',
    detail:
      '$1.9 billion moved through social platforms in 2024, more than any other contact method. A DM is a sales floor, not a friend.',
    source: FTC_2024,
    categories: ['social', 'influencer', 'marketplace', 'romance'],
    kinds: ['dm', 'ad'],
  },
  {
    id: 'us-phone-median',
    region: 'us',
    rarity: 'common',
    stat: '$1,500',
    headline: 'Median loss when the scam started with a phone call',
    detail:
      'The highest per-person hit of any contact method. Live pressure works, which is why hanging up and calling back on a real number wins.',
    source: FTC_2024,
    kinds: ['call'],
  },
  {
    id: 'us-job-scams',
    region: 'us',
    rarity: 'common',
    stat: '$501M',
    headline: 'Lost to job and employment agency scams in 2024',
    detail:
      'Up from $90 million in 2020, with reports nearly tripling. No real employer pays you to buy gift cards or "clear" transactions.',
    source: FTC_2024,
    categories: ['job'],
  },
  {
    id: 'us-shopping',
    region: 'us',
    rarity: 'common',
    stat: '#2',
    headline: 'Online shopping scams were the second most reported fraud of 2024',
    detail:
      'Only imposter scams drew more reports. Too-good prices, fake stores, and delivery bait texts are the volume plays.',
    source: FTC_2024,
    categories: ['shopping', 'delivery', 'tickets', 'pets', 'subscription', 'prize'],
  },

  // ---------- United States: field manual ----------
  {
    id: 'us-gift-card-rule',
    region: 'us',
    rarity: 'rare',
    stat: '$0',
    headline: 'Amount a real business or agency will ever demand in gift cards',
    detail:
      'Gift cards are for gifts. The moment any caller, boss, or agency wants payment in card codes, the conversation is over. The demand itself is the tell.',
    source: 'FTC consumer alerts',
    categories: ['government', 'job', 'banking'],
    kinds: ['call', 'email'],
  },
  {
    id: 'us-caller-id',
    region: 'us',
    rarity: 'common',
    stat: 'FAKE ID',
    headline: 'Caller ID can be spoofed to show any name or number',
    detail:
      'Your bank\u2019s real number on screen proves nothing. Hang up and dial the number on the back of your card yourself. The callback is the verification.',
    source: 'FCC consumer guidance',
    categories: ['banking', 'security', 'ai-voice'],
    kinds: ['call'],
  },
  {
    id: 'us-check-float',
    region: 'us',
    rarity: 'rare',
    stat: 'WEEKS',
    headline: 'How long a fake check can take to bounce after it looks cleared',
    detail:
      'Banks must release funds in days, but forgery surfaces weeks later. Anyone overpaying you and asking for the difference back is running this clock.',
    source: 'FTC consumer alerts',
    categories: ['job', 'marketplace'],
  },
  {
    id: 'us-romance-rule',
    region: 'us',
    rarity: 'common',
    stat: 'NEVER MET',
    headline: 'The romance scam playbook fits in one sentence',
    detail:
      'Someone you have never met in person, who cannot video call, asks for money, crypto, or gift cards. Any one is a flag. All three is the script.',
    source: 'FTC consumer alerts',
    categories: ['romance'],
    kinds: ['dm'],
  },
  {
    id: 'us-report-fast',
    region: 'us',
    rarity: 'common',
    stat: 'ACT FAST',
    headline: 'Reporting fraud fast is how money gets clawed back',
    detail:
      'ReportFraud.ftc.gov and your bank\u2019s fraud line, same day. Wires and payment apps can sometimes be recalled if you move before the money does.',
    source: 'FTC guidance',
  },

  // ---------- India ----------
  {
    id: 'in-total-2024',
    region: 'in',
    rarity: 'classified',
    stat: '\u20B922,845 Cr',
    headline: 'Lost by Indians to cyber fraud in 2024',
    detail:
      'A 206% jump over the previous year. Every case in this game is modeled on the scams doing that damage.',
    source: 'Ministry of Home Affairs, Lok Sabha reply, 2025',
  },
  {
    id: 'in-complaints',
    region: 'in',
    rarity: 'rare',
    stat: '36 Lakh+',
    headline: 'Financial fraud complaints reported in India in 2024',
    detail:
      'Complaint volume rose nearly 49% in a year. Reporting fast at 1930 or cybercrime.gov.in is how frozen money gets recovered.',
    source: 'Ministry of Home Affairs, Lok Sabha reply, 2025',
  },
  {
    id: 'in-digital-arrest',
    region: 'in',
    rarity: 'classified',
    stat: '\u20B91,935 Cr',
    headline: 'Lost to digital arrest scams in 2024 alone',
    detail:
      'There is no such thing as a digital arrest. No police force or agency interrogates you on a video call or demands money to close a case.',
    source: 'Government of India, Parliament reply, 2025',
    categories: ['digital-arrest', 'government', 'ai-voice'],
  },
  {
    id: 'in-trading',
    region: 'in',
    rarity: 'rare',
    stat: '\u20B94,636 Cr',
    headline: 'Lost to stock trading scams reported to I4C in 2024',
    detail:
      'Over 2.28 lakh complaints, the biggest loss bucket of the year. Guaranteed-return trading groups on WhatsApp and Telegram are the classic setup.',
    source: 'Indian Cyber Crime Coordination Centre (I4C), 2024',
    categories: ['investment', 'crypto', 'money-games'],
  },
  {
    id: 'in-upi',
    region: 'in',
    rarity: 'rare',
    stat: '\u20B9981 Cr',
    headline: 'Lost to UPI fraud in FY 2024-25',
    detail:
      'Across 12.64 lakh reported cases in a single year. A UPI PIN is only ever needed to SEND money, never to receive it.',
    source: 'Ministry of Finance, Rajya Sabha reply, 2026',
    categories: ['upi', 'kyc'],
    kinds: ['payment'],
  },

  // ---------- India: field manual ----------
  {
    id: 'in-otp-rule',
    region: 'in',
    rarity: 'common',
    stat: '0',
    headline: 'Bank employees who will ever ask for your OTP or UPI PIN',
    detail:
      'Not the bank, not the wallet, not "support". An OTP read out loud is money leaving your account. Hang up and use the official app instead.',
    source: 'RBI public awareness guidance',
    categories: ['banking', 'upi', 'kyc', 'security'],
    kinds: ['call', 'sms'],
  },
  {
    id: 'in-upi-collect',
    region: 'in',
    rarity: 'rare',
    stat: 'SEND',
    headline: 'The only thing a UPI PIN ever does is send money',
    detail:
      'A collect request that promises incoming cash is a drain trick. Receiving money never needs a PIN, a QR scan, or an approval tap.',
    source: 'NPCI UPI safety guidance',
    categories: ['upi'],
    kinds: ['payment'],
  },
  {
    id: 'in-digital-arrest-rule',
    region: 'in',
    rarity: 'common',
    stat: 'MYTH',
    headline: 'Digital arrest is not a real legal process anywhere in India',
    detail:
      'No police force, CBI, ED, or customs office interrogates people on video calls or takes money to close a case. Hang up, then report at 1930.',
    source: 'I4C and MHA public advisories',
    categories: ['digital-arrest', 'government'],
    kinds: ['call'],
  },
  {
    id: 'in-1930',
    region: 'in',
    rarity: 'rare',
    stat: '1930',
    headline: 'The national helpline that can freeze stolen money mid-transfer',
    detail:
      'Speed decides recovery. The sooner a scam is reported, the better the odds banks can freeze the money before it is layered away across mule accounts.',
    source: 'Indian Cyber Crime Coordination Centre (I4C)',
  },
  {
    id: 'in-parcel-script',
    region: 'in',
    rarity: 'rare',
    stat: '3 ACTS',
    headline: 'The courier-drugs-police call is one continuous script',
    detail:
      'Act one: a parcel with contraband. Act two: transfer to "police". Act three: pay to clear your name. Real customs sends written notices, not video calls.',
    source: 'I4C public advisories',
    categories: ['delivery', 'digital-arrest'],
    kinds: ['call'],
  },
  {
    id: 'in-task-bait',
    region: 'in',
    rarity: 'common',
    stat: 'BAIT',
    headline: 'Paid-task job offers start real and end with your deposit',
    detail:
      'Like videos, rate hotels, earn small payouts. Then comes the "prepaid task" that needs your money to unlock earnings. Your deposit is the product.',
    source: 'I4C advisories on task-based job fraud',
    categories: ['job', 'money-games'],
    kinds: ['dm', 'sms'],
  },
  {
    id: 'in-screen-share',
    region: 'in',
    rarity: 'common',
    stat: 'MIRROR',
    headline: 'A screen-share app turns your phone into the scammer\u2019s phone',
    detail:
      '"Support" that asks you to install AnyDesk or TeamViewer is reading your OTPs live. No bank or wallet support ever needs to see your screen.',
    source: 'RBI public advisories',
    categories: ['tech-support', 'banking'],
    kinds: ['call', 'popup'],
  },
  {
    id: 'in-kyc-sms',
    region: 'in',
    rarity: 'common',
    stat: 'EXPIRED?',
    headline: 'KYC never expires by SMS',
    detail:
      'The "KYC suspended" text with a link or an app to install is an account-takeover starter kit. Banks update KYC in branch or in the official app only.',
    source: 'RBI and bank advisories',
    categories: ['kyc', 'banking'],
    kinds: ['sms'],
  },
  {
    id: 'in-mule-account',
    region: 'in',
    rarity: 'rare',
    stat: 'MULE',
    headline: 'Renting out your bank account is a crime, not a side hustle',
    detail:
      'Fraud money moves through commission-paid accounts of students and job seekers. When the freeze comes, the account holder answers first.',
    source: 'I4C and RBI advisories',
    categories: ['job', 'banking', 'money-games'],
  },
];

/**
 * Pick the intel stat that best matches the card just answered, for the
 * player's region, skipping any already shown this run. Priority: category
 * match, then kind match, then a run-anywhere stat, then any unused stat.
 * Returns null when the region pool is dry.
 */
/**
 * The one national loss figure for a region. Used by the results screen to put
 * a player's own run next to the number it belongs to. Falls back to the US
 * total so the card can never render empty.
 */
export function nationalLossStat(region: Country): IntelStat {
  const id = region === 'in' ? 'in-total-2024' : 'us-total-2024';
  return (
    INTEL_STATS.find((s) => s.id === id) ??
    INTEL_STATS.find((s) => s.id === 'us-total-2024') ??
    INTEL_STATS[0]
  );
}

export function pickIntel(
  card: { category: Category; kind: CardKind },
  country: Country,
  usedIds: ReadonlySet<string>,
  rand: () => number = Math.random,
): IntelStat | null {
  const fresh = INTEL_STATS.filter((s) => s.region === country && !usedIds.has(s.id));
  const byCategory = fresh.filter((s) => s.categories?.includes(card.category));
  const byKind = fresh.filter((s) => !s.categories?.includes(card.category) && s.kinds?.includes(card.kind));
  const generic = fresh.filter((s) => !s.categories && !s.kinds);
  const pool = byCategory.length ? byCategory : byKind.length ? byKind : generic.length ? generic : fresh;
  if (!pool.length) return null;
  return pool[Math.floor(rand() * pool.length)] ?? null;
}
