import adPuppy from '@/assets/cards/ad-puppy.jpg';
import adRobuxZone from '@/assets/cards/ad-robux-zone.jpg';
import adRobuxKing from '@/assets/cards/ad-robux-king.jpg';
import adOldNavy from '@/assets/cards/ad-oldnavy.jpg';
import adFlight from '@/assets/cards/ad-flight.jpg';

// Fraud IQ - card pool
// Every card is handwritten to feel real. Scam cards carry `tells` whose `span`
// values are EXACT substrings of `sender`, `subject`, or `body` so the UI can
// highlight them on reveal. Legit cards carry a `legitNote` explaining the
// green flags (and what to still verify).
// lossAmount = realistic dollar loss if the player falls for it (used for the
// "money you'd have lost" tally). Amounts mirror typical FTC/IC3-reported cases.

export type CardKind = 'sms' | 'email' | 'payment' | 'dm' | 'ad' | 'call' | 'popup';

export type Category =
  | 'phishing'
  | 'prize'
  | 'crypto'
  | 'gaming'
  | 'delivery'
  | 'government'
  | 'banking'
  | 'job'
  | 'marketplace'
  | 'social'
  | 'housing'
  | 'security'
  | 'school'
  | 'money-games'
  | 'shopping'
  | 'romance'
  | 'charity'
  | 'subscription'
  | 'travel'
  | 'tech-support'
  | 'investment'
  | 'identity'
  | 'ai-voice'
  | 'tickets'
  | 'pets'
  | 'influencer'
  | 'toll'
  | 'blackmail'
  | 'utility'
  | 'upi'
  | 'kyc'
  | 'loan-app'
  | 'digital-arrest';

/** Human-readable labels for category chips and the coverage strip */
export const CATEGORY_LABELS: Record<Category, string> = {
  phishing: 'Phishing',
  prize: 'Fake Prizes',
  crypto: 'Crypto',
  gaming: 'Gaming',
  delivery: 'Delivery',
  government: 'Government',
  banking: 'Banking',
  job: 'Job Offers',
  marketplace: 'Marketplace',
  social: 'Social Media',
  housing: 'Housing',
  security: 'Account Security',
  school: 'School',
  'money-games': 'Money Flips',
  shopping: 'Shopping',
  romance: 'Romance',
  charity: 'Fake Charities',
  subscription: 'Subscriptions',
  travel: 'Travel',
  'tech-support': 'Tech Support',
  investment: 'Investments',
  identity: 'Identity Theft',
  'ai-voice': 'AI Voice Clones',
  tickets: 'Ticket Resale',
  pets: 'Pet Scams',
  influencer: 'Influencer Bait',
  toll: 'Toll Fees',
  blackmail: 'Blackmail',
  utility: 'Utility Bills',
  upi: 'UPI Fraud',
  kyc: 'KYC Scams',
  'loan-app': 'Loan Apps',
  'digital-arrest': 'Digital Arrest',
};

export interface Tell {
  /** exact substring of sender/subject/body to highlight */
  span: string;
  /** one-line explanation shown on reveal */
  why: string;
}

export interface GameCard {
  id: string;
  kind: CardKind;
  tier: 1 | 2 | 3;
  category: Category;
  isScam: boolean;
  /** who it appears to come from (phone/email/handle/app label) */
  sender: string;
  /** email subject or payment request title, optional */
  subject?: string;
  body: string;
  /** app chrome label for payment/dm cards (Venmo, Zelle, Discord, ...) */
  app?: string;
  tells?: Tell[];
  legitNote?: string;
  /** realistic $ loss if a scam is trusted */
  lossAmount?: number;
  /** boss finale card: appears as card 13, scores double, never in the normal pool */
  boss?: boolean;
  /**
   * Which training region this card belongs to. 'global' cards (the default)
   * are served to every country; country codes gate region-specific brands
   * (USPS and FAFSA for the US, UPI and KYC scams for India, and so on).
   */
  region?: Region;
  /**
   * Bundled photo for chromes with a visual slot (sponsored ads). Cards
   * without one render the neutral placeholder instead.
   */
  image?: string;
}

/** 'global' serves everyone; country codes match the region picker. */
export type Region = 'global' | 'us' | 'in';

export const CARDS: GameCard[] = [
  // ---------------- TIER 1 - warm-up ----------------
  {
    id: 't1-gift-card-text',
    kind: 'sms',
    tier: 1,
    category: 'prize',
    isScam: true,
    sender: '+1 (938) 220-4187',
    body:
      'CONGRATULATIONS! Your number was selected for a $1,000 Walmart gift card. Claim within 24 hrs: wal-mart-rewards.top/claim',
    tells: [
      {
        span: 'Your number was selected',
        why: 'You cannot win a drawing you never entered. Selected-at-random is the oldest hook in the book.',
      },
      {
        span: 'wal-mart-rewards.top',
        why: 'Walmart lives at walmart.com. Hyphenated lookalikes on cheap domains (.top) are card-harvesting pages.',
      },
      {
        span: 'within 24 hrs',
        why: 'Deadlines exist to stop you from thinking. Real promotions do not expire in hours.',
      },
    ],
    lossAmount: 200,
  },
  {
    id: 't1-crypto-giveaway',
    kind: 'dm',
    tier: 1,
    category: 'crypto',
    isScam: true,
    sender: '@elonmusk.officiaI_',
    app: 'Instagram',
    body:
      'BTC GIVEAWAY! To celebrate 300M followers I am giving back. Send 0.1 BTC to the wallet below and receive 0.5 BTC back instantly. First 100 people only. Wallet: bc1q8xj4w...',
    tells: [
      {
        span: 'Send 0.1 BTC',
        why: 'Send-to-receive is always a scam. Nobody needs your money to give you money.',
      },
      {
        span: '@elonmusk.officiaI_',
        why: 'Look closely: that is a capital I pretending to be an L, plus a trailing underscore. Handle spoofing 101.',
      },
      {
        span: 'First 100 people only',
        why: 'Scarcity pressure. Crypto sent to a stranger is gone forever, no chargebacks.',
      },
    ],
    lossAmount: 6800,
  },
  {
    id: 't1-robux-ad',
    kind: 'ad',
    tier: 1,
    category: 'gaming',
    isScam: true,
    sender: 'Sponsored - RobloxRewardZone.com',
    image: adRobuxZone,
    body:
      'FREE 10,000 ROBUX! No surveys, no downloads. Just enter your Roblox username and password to claim before the event ends tonight.',
    tells: [
      {
        span: 'username and password',
        why: 'No real reward ever needs your password. Typing it here hands over your account and any saved card on it.',
      },
      {
        span: 'FREE 10,000 ROBUX!',
        why: 'Free game currency is the #1 bait for players. Roblox only sells Robux inside the official app.',
      },
      {
        span: 'ends tonight',
        why: 'The countdown exists so you type first and think later.',
      },
    ],
    lossAmount: 75,
  },
  {
    id: 't1-inheritance-email',
    kind: 'email',
    tier: 1,
    category: 'phishing',
    isScam: true,
    sender: 'barrister.james.okafor@consultant-legal.net',
    subject: 'STRICTLY CONFIDENTIAL: $4,500,000.00 INHERITANCE',
    body:
      'Dear Beloved, I am contacting you regarding an unclaimed inheritance of $4.5 million from a late client who shares your last name. I require a trustworthy foreign partner to complete the transfer. To begin, send $850 for legal documentation along with your bank details.',
    tells: [
      {
        span: 'send $850 for legal documentation',
        why: 'The fortune is fake; the $850 is real. Advance-fee scams always need one small payment first - then another, then another.',
      },
      {
        span: 'shares your last name',
        why: 'A coincidence engineered for greed. Real estates find heirs through courts, not cold emails.',
      },
      {
        span: 'Dear Beloved',
        why: 'Mass-blast greeting. Anyone with your actual inheritance would know your actual name.',
      },
    ],
    lossAmount: 850,
  },
  {
    id: 't1-usps-fee',
    region: 'us',
    kind: 'sms',
    tier: 1,
    category: 'delivery',
    isScam: true,
    sender: '+63 915 202 8841',
    body:
      'USPS: Your package is on hold due to an incomplete address. Pay a $0.30 redelivery fee to release it: usps-package-center.info',
    tells: [
      {
        span: '$0.30 redelivery fee',
        why: 'The 30 cents is not the theft - the card number you type on that page is. Micro-fees are harvesting bait.',
      },
      {
        span: 'usps-package-center.info',
        why: 'The real site is usps.com. USPS also never texts payment links at all.',
      },
      {
        span: '+63 915 202 8841',
        why: 'That is a foreign mobile number claiming to be the US Postal Service.',
      },
    ],
    lossAmount: 340,
  },
  {
    id: 't1-irs-gift-cards',
    region: 'us',
    kind: 'call',
    tier: 1,
    category: 'government',
    isScam: true,
    sender: 'Incoming call: "Internal Revenue Service"',
    body:
      '"This is Officer Daniels with the IRS. You owe $2,000 in back taxes and a warrant will be issued for your arrest tonight unless you pay immediately using Apple gift cards. Stay on the line while you drive to the store."',
    tells: [
      {
        span: 'Apple gift cards',
        why: 'No government agency accepts gift cards. Gift cards are the currency of scammers because they are untraceable cash.',
      },
      {
        span: 'arrest tonight',
        why: 'The IRS contacts you by postal mail and never threatens same-day arrest. Fear is the whole script.',
      },
      {
        span: 'Stay on the line',
        why: 'Keeping you on the phone stops you from calling someone who would talk you out of it.',
      },
    ],
    lossAmount: 2000,
  },
  {
    id: 't1-cashapp-flip',
    region: 'us',
    kind: 'dm',
    tier: 1,
    category: 'money-games',
    isScam: true,
    sender: '@cashflip.queen2026',
    app: 'Instagram',
    body:
      'MONEY FLIP FRIDAY! Send $50 on Cash App and I flip it to $500 in 30 minutes using my broker access. 100% legit, proof screenshots in my highlights. Slots almost full!!',
    tells: [
      {
        span: 'Send $50 on Cash App',
        why: 'You send first - that is the entire scam. The moment it leaves your account, the "broker" blocks you.',
      },
      {
        span: 'flip it to $500 in 30 minutes',
        why: '10x returns in half an hour do not exist. If flipping money worked, they would not need yours.',
      },
      {
        span: '100% legit',
        why: 'Real things never have to say this. Screenshots are 30 seconds of photo editing.',
      },
    ],
    lossAmount: 50,
  },
  {
    id: 't1-venmo-stranger',
    region: 'us',
    kind: 'payment',
    tier: 1,
    category: 'phishing',
    isScam: true,
    sender: 'Amazon Refunds Dept',
    app: 'Venmo',
    subject: 'Request: $99.99',
    body:
      'Amazon Refunds Dept requests $99.99 - "Approve this request to verify your identity and release your $99.99 refund to your account."',
    tells: [
      {
        span: 'requests $99.99',
        why: 'Approving a request SENDS money. A refund is money coming TO you - it never needs your approval or a matching payment.',
      },
      {
        span: 'Approve this request to verify',
        why: '"Pay to verify" is a contradiction. Verification never costs money.',
      },
      {
        span: 'Amazon Refunds Dept',
        why: 'Companies do not request money over Venmo. Any business name on a personal payment app is a costume.',
      },
    ],
    lossAmount: 100,
  },
  {
    id: 't1-mom-text',
    kind: 'sms',
    tier: 1,
    category: 'social',
    isScam: false,
    sender: 'Mom',
    body:
      "Dinner's at 7. Text me when you're leaving practice and I'll start the pasta.",
    legitNote:
      'A known contact, saying something expected, asking for nothing sensitive. Most messages in your life are this - the game is telling THIS apart from the imitations.',
  },
  {
    id: 't1-school-fafsa-night',
    region: 'us',
    kind: 'email',
    tier: 1,
    category: 'school',
    isScam: false,
    sender: 'counselor@lincolnhs.edu',
    subject: 'FAFSA Night - Thursday 6 PM',
    body:
      'Reminder: FAFSA information night is this Thursday at 6 PM in the library. Bring your questions about financial aid. No signup needed, pizza provided.',
    legitNote:
      'Real school domain (.edu), no link demanding action, no payment, no urgency. It informs - it does not extract.',
  },
  {
    id: 't1-dominos-delivery',
    kind: 'sms',
    tier: 1,
    category: 'delivery',
    isScam: false,
    sender: "Domino's",
    body:
      "Your order is out for delivery! Track it in the app. Estimated arrival: 7:42 PM.",
    legitNote:
      'Confirmation of something YOU just did, pointing you to the app you already have. No fee, no link to type card numbers into.',
  },
  {
    id: 't1-amazon-otp',
    kind: 'sms',
    tier: 1,
    category: 'security',
    isScam: false,
    sender: 'Amazon',
    body:
      '392041 is your Amazon OTP. Do not share it with anyone. Amazon will never call you to ask for this code.',
    legitNote:
      'An OTP arriving right after YOU tried to sign in is normal - the message even warns you not to share it. The scam is never the code itself; it is the human who calls and asks you to read it out. (If a code arrives that you did NOT request, someone has your password - change it.)',
  },
  {
    id: 't1-spotify-receipt',
    region: 'us',
    kind: 'email',
    tier: 1,
    category: 'shopping',
    isScam: false,
    sender: 'no-reply@spotify.com',
    subject: 'Your Spotify Premium receipt',
    body:
      'Your Premium Student payment of $5.99 was processed on Aug 11, 2026. Next billing date: Sep 11, 2026. Manage your plan anytime at spotify.com/account.',
    legitNote:
      'Expected charge, correct amount, real domain you could type yourself, and no action demanded. Routine receipts are what normal looks like.',
  },

  // ---------------- TIER 2 - the street ----------------
  {
    id: 't2-chase-locked-scam',
    region: 'us',
    kind: 'sms',
    tier: 2,
    category: 'banking',
    isScam: true,
    sender: '+1 (307) 219-8842',
    body:
      'CHASE BANK: Your account has been temporarily locked due to suspicious activity. Verify your identity now at chase-secure-alerts.com or your account will be permanently closed.',
    tells: [
      {
        span: 'chase-secure-alerts.com',
        why: 'Chase is chase.com, nothing else. Added words plus a hyphen equals a credential-harvesting page.',
      },
      {
        span: 'permanently closed',
        why: 'Banks do not close accounts via text ultimatum. Panic is the point - the real bank app would show any real problem.',
      },
      {
        span: '+1 (307) 219-8842',
        why: 'A random cell number claiming to be a major bank.',
      },
    ],
    lossAmount: 2400,
  },
  {
    id: 't2-amazon-order-phish',
    kind: 'email',
    tier: 2,
    category: 'shopping',
    isScam: true,
    sender: 'order-confirm@amazon-delivery-status.net',
    subject: 'Your order of Apple iPhone 15 Pro ($1,099.00) has shipped',
    body:
      'Thank you for your purchase. Your iPhone 15 Pro will arrive Tuesday. If you did not place this order, cancel it immediately here: amazon-delivery-status.net/cancel-order',
    tells: [
      {
        span: 'amazon-delivery-status.net',
        why: 'Amazon mails from amazon.com. The whole email exists to panic you into clicking "cancel".',
      },
      {
        span: 'cancel it immediately here',
        why: 'The cancel button is the trap - it leads to a fake login that takes your real password. Check the Your Orders page in the app instead.',
      },
      {
        span: 'Thank you for your purchase',
        why: 'You never bought this. A charge that does not exist cannot be canceled.',
      },
    ],
    lossAmount: 1100,
  },
  {
    id: 't2-discord-nitro',
    kind: 'dm',
    tier: 2,
    category: 'gaming',
    isScam: true,
    sender: 'xXghost_blade99Xx',
    app: 'Discord',
    body:
      'yo free discord nitro for 3 months, steam is doing a partner event rn. claim yours before it ends discorcl.gift/nitro3mo',
    tells: [
      {
        span: 'discorcl.gift',
        why: 'Read it slowly: d-i-s-c-o-r-C-L. One-letter swaps catch fast readers. The page steals your Discord login.',
      },
      {
        span: 'free discord nitro',
        why: 'Free Nitro links are the most common account-stealer on Discord. Discord announces real promos in the app, not via random users.',
      },
      {
        span: 'before it ends',
        why: 'Same urgency lever, gamer edition.',
      },
    ],
    lossAmount: 60,
  },
  {
    id: 't2-fedex-hold',
    kind: 'sms',
    tier: 2,
    category: 'delivery',
    isScam: true,
    sender: '+1 (443) 902-1177',
    body:
      'FedEx: We attempted delivery but your address is incomplete. Update within 12 hours or the package returns to sender: fdx-redelivery-update.com',
    tells: [
      {
        span: 'fdx-redelivery-update.com',
        why: 'FedEx is fedex.com. Abbreviated lookalike domains are built to survive a quick glance.',
      },
      {
        span: 'within 12 hours',
        why: 'Carriers hold packages for days and leave door tags. Hour-deadlines are a fraud fingerprint.',
      },
      {
        span: 'your address is incomplete',
        why: 'Were you even expecting a package? Scammers text millions of numbers; someone is always waiting on a box.',
      },
    ],
    lossAmount: 280,
  },
  {
    id: 't2-car-wrap',
    region: 'us',
    kind: 'email',
    tier: 2,
    category: 'job',
    isScam: true,
    sender: 'recruiting@brandwrap-promo.us',
    subject: 'Earn $500/week driving your own car',
    body:
      'Monster Energy is seeking students to wrap their cars in our ads. No experience needed, $500 weekly, drive like normal. We mail you a check upfront - deposit it, keep your first week\'s pay, and send the remaining balance to the wrap installer via Zelle.',
    tells: [
      {
        span: 'We mail you a check upfront',
        why: 'The check is fake. Banks show the money as available in days but can bounce it WEEKS later - after your real money is gone.',
      },
      {
        span: 'send the remaining balance to the wrap installer via Zelle',
        why: 'The "installer" is the scammer. You are forwarding your own real dollars against a check that will bounce.',
      },
      {
        span: 'No experience needed, $500 weekly',
        why: 'Effortless money that finds YOU is the oldest lure in the job-scam playbook.',
      },
    ],
    lossAmount: 1950,
  },
  {
    id: 't2-scholarship-fee',
    kind: 'email',
    tier: 2,
    category: 'school',
    isScam: true,
    sender: 'awards@national-scholar-fund.org',
    subject: 'Pre-approved: $5,000 National Student Scholarship',
    body:
      'Congratulations! You have been pre-approved for a $5,000 scholarship based on your academic profile. No essay required. To reserve your award, submit the $49 processing fee before Friday\'s deadline.',
    tells: [
      {
        span: '$49 processing fee',
        why: 'Real scholarships never charge you - money flows toward the student, always. Fee-to-receive is the scam.',
      },
      {
        span: 'Pre-approved',
        why: 'You never applied. Awards do not fall from the sky onto strangers.',
      },
      {
        span: 'No essay required',
        why: 'Nothing asked of you means there is no award - the "scholarship" has no selection because it has no money.',
      },
    ],
    lossAmount: 49,
  },
  {
    id: 't2-apple-lock-scam',
    kind: 'email',
    tier: 2,
    category: 'security',
    isScam: true,
    sender: 'security@apple-id-verify.support',
    subject: 'Your iCloud will be locked in 24 hours',
    body:
      'Suspicious activity was detected on your account. Your iCloud will be permanently locked in 24 hours and your photos deleted. Verify your billing information immediately to keep your data: apple-id-verify.support/unlock',
    tells: [
      {
        span: 'apple-id-verify.support',
        why: 'Apple mails from apple.com domains only. Real security pages live at appleid.apple.com - a URL you can type yourself.',
      },
      {
        span: 'Verify your billing information',
        why: 'A security problem never needs your card number. "Verify billing" means "type your card into our form."',
      },
      {
        span: 'photos deleted',
        why: 'Threatening your memories is deliberate emotional pressure. The calm real version says "if this was you, ignore this."',
      },
    ],
    lossAmount: 900,
  },
  {
    id: 't2-marketplace-overpay',
    region: 'us',
    kind: 'dm',
    tier: 2,
    category: 'marketplace',
    isScam: true,
    sender: 'Brianna Cole',
    app: 'Facebook Marketplace',
    body:
      "Hi! I want your PS5 listed at $300. I'll send $500 through Zelle - the extra $200 is for my movers, just forward it to them once the payment shows as pending. I'm out of state so the movers will pick it up.",
    tells: [
      {
        span: "I'll send $500",
        why: 'Nobody overpays strangers on purpose. Overpayment means the incoming money is fake or stolen.',
      },
      {
        span: 'just forward it to them',
        why: 'The $200 you forward is YOUR real money. Their $500 never actually lands.',
      },
      {
        span: 'payment shows as pending',
        why: 'Pending is not paid. Never ship or send anything until money is fully cleared in your account.',
      },
    ],
    lossAmount: 500,
  },
  {
    id: 't2-zelle-oops',
    region: 'us',
    kind: 'payment',
    tier: 2,
    category: 'banking',
    isScam: true,
    sender: 'Unknown - (912) 574-3310',
    app: 'Zelle',
    subject: 'You received $250.00',
    body:
      'Notification: $250.00 received. Message from sender: "OMG I sent this to the wrong number!! Please send it back to this same Zelle right away, my rent is due tomorrow, I\'m begging you"',
    tells: [
      {
        span: 'Please send it back',
        why: 'The $250 came from a stolen card. The bank will claw it back from you later - and the $250 you "return" is your own real money, gone twice.',
      },
      {
        span: "my rent is due tomorrow, I'm begging you",
        why: 'The sob story rushes you past the correct move: report it to YOUR bank and let them reverse it. Never refund strangers yourself.',
      },
    ],
    lossAmount: 250,
  },
  {
    id: 't2-brand-ambassador',
    region: 'us',
    kind: 'dm',
    tier: 2,
    category: 'job',
    isScam: true,
    sender: '@shein_ambassadors_usa',
    app: 'Instagram',
    body:
      "We LOVE your feed! You've been chosen as a SHEIN campus ambassador - $300 per post plus free clothes every month. Just cover the $65 shipping on your starter box and you're officially in. Spots close Sunday!",
    tells: [
      {
        span: 'cover the $65 shipping',
        why: 'Real brand deals pay YOU and ship free. Any "job" that starts with you paying is the job.',
      },
      {
        span: 'We LOVE your feed!',
        why: 'Copy-pasted flattery blasted to thousands of accounts. They have never seen your feed.',
      },
      {
        span: 'Spots close Sunday!',
        why: 'Deadline pressure on a "job offer" - real brands have application processes, not countdown timers.',
      },
    ],
    lossAmount: 65,
  },
  {
    id: 't2-ticket-resale',
    region: 'us',
    kind: 'dm',
    tier: 2,
    category: 'marketplace',
    isScam: true,
    sender: '@taytickets.resale.atl',
    app: 'Instagram',
    body:
      "2 Eras Tour floor seats, $180 each (paid $450, can't go anymore, family emergency). PayPal Friends & Family ONLY so we both skip the fees. First to pay gets them, 3 people are messaging me rn.",
    tells: [
      {
        span: 'Friends & Family ONLY',
        why: 'F&F has zero buyer protection - that is exactly why they insist on it. Goods & Services exists for strangers.',
      },
      {
        span: '$180 each (paid $450',
        why: 'A 60% loss "because emergency" is bait math. Tickets that cheap do not reach strangers on Instagram.',
      },
      {
        span: '3 people are messaging me rn',
        why: 'A manufactured race so you pay before verifying anything.',
      },
    ],
    lossAmount: 360,
  },
  {
    id: 't2-paypal-invoice',
    kind: 'email',
    tier: 2,
    category: 'phishing',
    isScam: true,
    sender: 'service@paypal.com',
    subject: 'Invoice from CryptoExchange Ltd ($499.99)',
    body:
      'You have received an invoice of $499.99 for Bitcoin Purchase. If you did not authorize this transaction, call our fraud protection line at 1-806-224-9917 within 24 hours to dispute the charge.',
    tells: [
      {
        span: 'call our fraud protection line at 1-806-224-9917',
        why: 'The phone number IS the scam. Anyone can send a real PayPal invoice with scam text inside - disputes happen at paypal.com, never via a number typed in an invoice.',
      },
      {
        span: 'You have received an invoice of $499.99',
        why: 'An invoice is a REQUEST, not a charge. Nothing has been taken - they want you to panic-call and "cancel" by handing over card details or remote access.',
      },
    ],
    lossAmount: 500,
  },
  {
    id: 't2-steam-trade',
    kind: 'dm',
    tier: 2,
    category: 'gaming',
    isScam: true,
    sender: 'TradeMaster_Kyle',
    app: 'Discord',
    body:
      "bro your CS2 inventory is clean. I'll trade you my $400 butterfly knife for two of your mids. verify your inventory value here first so I know YOU'RE not scamming ME: steamcommunutiy-trade.com/verify",
    tells: [
      {
        span: 'steamcommunutiy-trade.com',
        why: 'Spell it out: c-o-m-m-u-n-U-T-I-y. The fake login page steals your Steam account and every skin in it.',
      },
      {
        span: "so I know YOU'RE not scamming ME",
        why: 'Flipping the suspicion onto you is social engineering - it makes you eager to prove yourself by clicking.',
      },
      {
        span: "I'll trade you my $400 butterfly knife",
        why: 'A stranger offering a lopsided trade is the lure. Nobody gives away $400 for "two mids".',
      },
    ],
    lossAmount: 400,
  },
  {
    id: 't2-chase-fraud-legit',
    region: 'us',
    kind: 'sms',
    tier: 2,
    category: 'banking',
    isScam: false,
    sender: 'Chase',
    body:
      'Chase Fraud: Did you attempt $427.80 at BEST BUY #1420? Reply YES or NO. If unrecognized, call the number on the back of your card. We will never ask for your PIN or password.',
    legitNote:
      'This is how banks actually text: a YES/NO question, no link, and it routes you to the number on YOUR OWN card. It even states what it will never ask for. Compare with the locked-account text in this deck - the difference is the ask.',
  },
  {
    id: 't2-usps-delivered-legit',
    region: 'us',
    kind: 'sms',
    tier: 2,
    category: 'delivery',
    isScam: false,
    sender: 'USPS',
    body:
      'USPS: Your package 9400 1102 8863 2141 was delivered to your mailbox at 2:14 PM. Track at usps.com.',
    legitNote:
      'Past-tense confirmation, real domain, no fee, no countdown, nothing to "fix". The scam version always needs something FROM you; the real version just informs.',
  },
  {
    id: 't2-apple-signin-legit',
    kind: 'email',
    tier: 2,
    category: 'security',
    isScam: false,
    sender: 'noreply@email.apple.com',
    subject: 'Your Apple ID was used to sign in to iCloud',
    body:
      'Your Apple ID was used to sign in to iCloud on a Windows PC on August 11, 2026. If this was you, you can ignore this message. If you have not signed in recently, go to appleid.apple.com to change your password.',
    legitNote:
      'Calm tone, no countdown, no billing ask, and it points to appleid.apple.com - a domain you can type yourself instead of clicking anything. The fake twin threatens deleted photos in 24 hours.',
  },
  {
    id: 't2-venmo-roommate-legit',
    region: 'us',
    kind: 'payment',
    tier: 2,
    category: 'social',
    isScam: false,
    sender: 'Jake Torres',
    app: 'Venmo',
    subject: 'Request: $18.50',
    body: 'Jake Torres requests $18.50 - "wifi bill august, split 4 ways"',
    legitNote:
      'Same mechanics as the scam version - a payment request - but context flips it: a known contact, an expected shared expense, a believable amount. The lesson: judge the CONTEXT, not the app.',
  },
  {
    id: 't2-indeed-interview-legit',
    region: 'us',
    kind: 'email',
    tier: 2,
    category: 'job',
    isScam: false,
    sender: 'no-reply@indeed.com',
    subject: 'Interview invitation: Crumbl Cookies - Team Member',
    body:
      'Crumbl Cookies (2.1 mi away) would like to schedule an interview for the part-time Team Member position you applied to on Aug 8. Choose a time slot from your Indeed dashboard.',
    legitNote:
      'A job YOU applied for, an actual interview step, scheduling inside the platform you already use, and zero fees. Real hiring has process; scam hiring has "you are selected, pay to start."',
  },
  {
    id: 't2-oldnavy-ad-legit',
    region: 'us',
    kind: 'ad',
    tier: 2,
    category: 'shopping',
    isScam: false,
    sender: 'Sponsored - Old Navy (oldnavy.com)',
    image: adOldNavy,
    body:
      'Back to School Sale: 40% off everything, today through Sunday. Shop online or find your store. Exclusions apply, see site for details.',
    legitNote:
      'Not every ad is a scam. Believable discount (40%, not 90%), a real domain, a multi-day window instead of a minutes countdown, and no sketchy payment rules. Boring plausibility is a green flag.',
  },

  // ---------------- TIER 3 - expert floor ----------------
  {
    id: 't3-coach-gift-cards',
    region: 'us',
    kind: 'email',
    tier: 3,
    category: 'phishing',
    isScam: true,
    sender: 'coach.d.miller.lincolnhs@gmail.com',
    subject: 'quick favor - team banquet',
    body:
      "Hey, it's Coach Miller. I'm stuck in a district meeting and can't step out. Can you grab three $100 Apple gift cards from CVS for the banquet raffle? Scratch the backs and text me photos of the codes. I'll pay you back tonight and sign off your volunteer hours.",
    tells: [
      {
        span: 'coach.d.miller.lincolnhs@gmail.com',
        why: 'Staff email is @lincolnhs.edu. A gmail with the school stuffed into the username is an impersonation costume.',
      },
      {
        span: 'text me photos of the codes',
        why: 'Gift card codes ARE cash. The moment the photo sends, the money is spent - no refunds, no tracing.',
      },
      {
        span: "stuck in a district meeting",
        why: 'The excuse exists to stop you from calling to verify. Authority + urgency + no voice contact = spear phishing.',
      },
    ],
    lossAmount: 300,
  },
  {
    id: 't3-hr-payroll',
    region: 'us',
    kind: 'email',
    tier: 3,
    category: 'job',
    isScam: true,
    sender: 'payroll@target-hr-portal.com',
    subject: 'Action needed: re-verify direct deposit before Friday payroll',
    body:
      'Hi, this is Dana from HR. Our payroll system migrated this week and some employee records did not transfer. Re-verify your direct deposit details before Thursday 5 PM or your paycheck may be delayed to the next cycle: target-hr-portal.com/verify',
    tells: [
      {
        span: 'target-hr-portal.com',
        why: 'Your real employer portal is the one you already log into. New domains that appear right before payday are paycheck-theft pages.',
      },
      {
        span: 'Re-verify your direct deposit details',
        why: 'A real system that "migrated" keeps your data. Re-typing your bank info means typing it into a thief\'s form - next payday goes to their account.',
      },
      {
        span: 'before Thursday 5 PM',
        why: 'The deadline sits right before payroll so fear does the thinking.',
      },
    ],
    lossAmount: 860,
  },
  {
    id: 't3-irs-email',
    region: 'us',
    kind: 'email',
    tier: 3,
    category: 'government',
    isScam: true,
    sender: 'refunds@irs-tax-service.us',
    subject: 'Tax refund of $936.20 approved for disbursement',
    body:
      'Our records show an overpayment for tax year 2025. Your refund of $936.20 has been approved. Confirm your identity and bank routing information within 5 business days to receive your disbursement.',
    tells: [
      {
        span: 'irs-tax-service.us',
        why: 'The IRS uses irs.gov, and it initiates contact by postal mail - never by email about refunds. A perfectly professional email on the wrong channel is still a scam.',
      },
      {
        span: 'Confirm your identity and bank routing information',
        why: 'A real refund goes to the account already on your tax return. Nobody needs you to "confirm" what they already have.',
      },
      {
        span: 'within 5 business days',
        why: 'Refunds do not evaporate. Every fake deadline is a spotlight pointed at the exit.',
      },
    ],
    lossAmount: 940,
  },
  {
    id: 't3-verizon-sim',
    region: 'us',
    kind: 'call',
    tier: 3,
    category: 'security',
    isScam: true,
    sender: 'Incoming call: "Verizon Security Team"',
    body:
      '"We flagged an unauthorized SIM change request on your line. To confirm you are the real account owner and cancel it, read me the 6-digit code we just texted you. If we cannot verify within a few minutes, the transfer completes automatically."',
    tells: [
      {
        span: 'read me the 6-digit code',
        why: 'THEY triggered that code. Reading it back authorizes the SIM swap - then your number, texts, and every bank login reset flow belong to them.',
      },
      {
        span: 'the transfer completes automatically',
        why: 'A fake countdown to force the code out of you. Hang up and call the number on your own bill; a real carrier can wait.',
      },
    ],
    lossAmount: 1400,
  },
  {
    id: 't3-apartment-wire',
    region: 'us',
    kind: 'email',
    tier: 3,
    category: 'housing',
    isScam: true,
    sender: 'mark.hensley.properties@outlook.com',
    subject: 'Re: 2BR apartment - $850/mo (your Zillow inquiry)',
    body:
      "Thanks for reaching out! The unit is still available. I'm currently overseas doing missionary work so in-person showings aren't possible, but the photos are accurate. To take it off the market today, wire the $800 deposit via Western Union and I'll FedEx you the keys and signed lease.",
    tells: [
      {
        span: 'wire the $800 deposit via Western Union',
        why: 'Wire transfers to strangers are unrecoverable - which is why real landlords never require them before you have seen the unit.',
      },
      {
        span: "I'm currently overseas",
        why: 'The overseas story removes the only real test: walking through the door. No showing = no apartment.',
      },
      {
        span: '$850/mo',
        why: 'Priced far under market to flood them with eager victims. The listing photos are stolen from an old real listing.',
      },
    ],
    lossAmount: 1650,
  },
  {
    id: 't3-insta-copyright',
    kind: 'dm',
    tier: 3,
    category: 'social',
    isScam: true,
    sender: '@meta.support.appeals_center',
    app: 'Instagram',
    body:
      'Your account has been flagged for repeated copyright violations and is scheduled for permanent deletion within 48 hours. If you believe this is a mistake, submit an appeal at instagram-appeal-center.com. Failure to appeal confirms the violation.',
    tells: [
      {
        span: '@meta.support.appeals_center',
        why: 'Instagram never DMs you from user accounts. Real notices appear in-app under Settings > Account Status.',
      },
      {
        span: 'instagram-appeal-center.com',
        why: 'The "appeal form" asks for your password - that is the entire operation. Hijacked accounts get resold or used to scam your followers.',
      },
      {
        span: 'Failure to appeal confirms the violation',
        why: 'Guilt-flip pressure. Silence never "confirms" anything - but panic makes you click.',
      },
    ],
    lossAmount: 250,
  },
  {
    id: 't3-refund-remote',
    kind: 'call',
    tier: 3,
    category: 'phishing',
    isScam: true,
    sender: 'Incoming call: "Amazon Billing Support"',
    body:
      '"We accidentally double-charged your account $299 for a Prime renewal error and I can refund you right now. Download the AnyDesk app so I can walk you through the refund form, and keep your banking page open so you can watch the money arrive."',
    tells: [
      {
        span: 'Download the AnyDesk app',
        why: 'AnyDesk gives them your screen and keyboard. Refunds NEVER require software - they just appear on your card.',
      },
      {
        span: 'keep your banking page open',
        why: 'That is the target. Once inside, they edit the page HTML to fake an "over-refund" and pressure you to send back the difference in gift cards.',
      },
      {
        span: 'I can refund you right now',
        why: 'A refund needing your live participation is theater. Real ones happen silently, days later.',
      },
    ],
    lossAmount: 4200,
  },
  {
    id: 't3-chase-lookalike',
    region: 'us',
    kind: 'email',
    tier: 3,
    category: 'banking',
    isScam: true,
    sender: 'secure.message@chase.com-account-center.net',
    subject: 'New secure message about your account',
    body:
      'You have 1 new secure message regarding recent account activity. Sign in to view it: chase.com-account-center.net/inbox. For your security, this link expires in 24 hours.',
    tells: [
      {
        span: 'chase.com-account-center.net',
        why: 'Read domains RIGHT to LEFT. The real site here is account-center.net - the "chase.com" at the front is decoration. This trick beats a quick glance every time.',
      },
      {
        span: 'this link expires in 24 hours',
        why: 'Expiring links rush you past the one habit that saves you: typing chase.com yourself.',
      },
    ],
    lossAmount: 2900,
  },
  {
    id: 't3-money-mule',
    kind: 'dm',
    tier: 3,
    category: 'money-games',
    isScam: true,
    sender: 'marcus_hd_23',
    app: 'Snapchat',
    body:
      "yo it's Marcus from 3rd period lol. my chime got locked and payroll already sent my check. can my boss direct deposit into your account instead? you cash it out, send it to me, and keep $50 for the trouble. it's my real paycheck i swear",
    tells: [
      {
        span: 'direct deposit into your account instead',
        why: 'That "paycheck" is stolen money. Letting it pass through your account makes YOU the money mule - a federal crime that freezes your account and follows you.',
      },
      {
        span: 'keep $50 for the trouble',
        why: 'Being paid just to receive and forward money is the mule pitch, word for word. There is no legit version of it.',
      },
      {
        span: "it's my real paycheck i swear",
        why: 'Is this even Marcus? Hacked accounts message every contact. Verify on a channel you trust before touching anything money-shaped.',
      },
    ],
    lossAmount: 550,
  },
  {
    id: 't3-recovery-agent',
    region: 'us',
    kind: 'dm',
    tier: 3,
    category: 'crypto',
    isScam: true,
    sender: '@cybercrime.recovery.agent',
    app: 'Instagram',
    body:
      'We identified your $500 loss in the Cash App flip scam through our fraud database. Good news: the funds were frozen and are recoverable. Pay the $120 blockchain release fee and the full amount returns to your account within 24 hours. Time-sensitive.',
    tells: [
      {
        span: '$120 blockchain release fee',
        why: 'Recovery-for-a-fee IS the second scam, run on victims of the first. Real agencies (FTC, your bank) never charge to return money.',
      },
      {
        span: 'our fraud database',
        why: 'How do strangers know what you lost? They are the same crew - or bought the victim list. Being scammed puts you on a "sucker list" that gets resold.',
      },
      {
        span: 'Time-sensitive.',
        why: 'Urgency, again. It is the one ingredient no scam can skip.',
      },
    ],
    lossAmount: 120,
  },
  {
    id: 't3-wells-fraud-legit',
    region: 'us',
    kind: 'sms',
    tier: 3,
    category: 'banking',
    isScam: false,
    sender: '93557',
    body:
      'Free Msg: Wells Fargo Fraud Dept: Did you use card ending 4832 for $89.99 at STEAMGAMES.COM? Reply YES or NO. Msg&data rates may apply.',
    legitNote:
      'Looks rough - "Free Msg", a shortcode sender - but this IS how banks text. The tell is the ASK: last 4 digits only, YES/NO protocol, no link, no code requested. Polish proves nothing in either direction; requests do.',
  },
  {
    id: 't3-bank-callback-legit',
    region: 'us',
    kind: 'call',
    tier: 3,
    category: 'banking',
    isScam: false,
    sender: 'Incoming call: "Chase Fraud Department"',
    body:
      '"We flagged a $310 charge on your card and paused it. We will never ask for your PIN, password, or any code. If you would feel safer, hang up and call the number on the back of your card - I will note the case number so any banker can pull it up."',
    legitNote:
      'The signature of a REAL fraud call: it asks for nothing and INVITES you to hang up and call back on the official number. Scammers need you to stay on the line; real banks do not care how you reach them.',
  },
  {
    id: 't3-admissions-legit',
    region: 'us',
    kind: 'email',
    tier: 3,
    category: 'school',
    isScam: false,
    sender: 'j.rivera@admissions.ohio-state.edu',
    subject: 'Great meeting you at the Columbus college fair',
    body:
      "Hi! Thanks for stopping by our table on Saturday. You mentioned interest in the CS program, so I attached our scholarship deadlines PDF. If it would help, I can set up a 15-minute Zoom with a current student. No rush at all.",
    legitNote:
      'Real .edu subdomain, references an interaction that actually happened, offers instead of demands, zero urgency, zero money. Spear-phishing imitates this exact warmth - the difference is it never asks you to pay or share codes.',
  },
  {
    id: 't3-schoolbucks-legit',
    region: 'us',
    kind: 'email',
    tier: 3,
    category: 'school',
    isScam: false,
    sender: 'notifications@myschoolbucks.com',
    subject: 'AP Exam fee ($25.00) posted to your account',
    body:
      'Lincoln High School posted a new fee: AP Computer Science Exam - $25.00, due Sep 30. Sign in to your MySchoolBucks account or pay through your school portal. Questions? Contact your school office.',
    legitNote:
      'The platform your school actually uses, a fee you expected, a deadline weeks away, and it routes you to the portal you already have - not a link demanding a card right now.',
  },
  {
    id: 't3-amazon-photo-legit',
    kind: 'sms',
    tier: 3,
    category: 'delivery',
    isScam: false,
    sender: 'Amazon',
    body:
      'Delivered: Your package was left near the front door. See your delivery photo at amazon.com/orders',
    legitNote:
      'Real domain, past-tense confirmation of something you can physically verify by opening the door. The scam twin always has a fee, a form, or a countdown.',
  },
  {
    id: 't3-fafsa-legit',
    region: 'us',
    kind: 'email',
    tier: 3,
    category: 'school',
    isScam: false,
    sender: 'noreply@studentaid.gov',
    subject: 'Your FAFSA form was processed',
    body:
      'Your 2026-27 FAFSA form was processed successfully. Your Student Aid Report is available at studentaid.gov. The schools you listed will receive your information automatically. Remember: submitting the FAFSA is always free.',
    legitNote:
      'A .gov sender, no payment path at all, and it even reminds you the process is free. Compare with the "pre-approved scholarship" that wants $49 - real aid never charges.',
  },

  // ================= EXPANSION PACK: TIER 1 =================
  {
    id: 't1-toll-ezpass',
    region: 'us',
    kind: 'sms',
    tier: 1,
    category: 'toll',
    isScam: true,
    sender: '+1 (605) 851-3327',
    body:
      'E-ZPass: You have an unpaid toll of $6.99. To avoid a $50.00 late fee, settle your balance today at ezpass-pay.info',
    tells: [
      {
        span: 'ezpass-pay.info',
        why: 'Every state toll agency ends in .com or .gov and you already know yours. Random pay-domains in texts are card harvesters.',
      },
      {
        span: 'avoid a $50.00 late fee',
        why: 'A tiny debt with a giant penalty is fear math. Real toll notices arrive by mail with your plate number on them.',
      },
    ],
    lossAmount: 180,
  },
  {
    id: 't1-netflix-declined',
    kind: 'email',
    tier: 1,
    category: 'subscription',
    isScam: true,
    sender: 'billing@netflix-account-services.info',
    subject: 'Your payment was declined',
    body:
      'We could not process your last payment. Your membership is on hold. Update your payment details within 48 hours to keep watching: netflix-billing-update.info',
    tells: [
      {
        span: 'netflix-account-services.info',
        why: 'Netflix mails you from netflix.com. The moment the sender domain is not the company domain, the story does not matter.',
      },
      {
        span: 'within 48 hours',
        why: 'Real billing retries quietly for days. Countdown clocks exist to make you type card numbers fast.',
      },
    ],
    lossAmount: 240,
  },
  {
    id: 't1-microsoft-popup-call',
    kind: 'call',
    tier: 1,
    category: 'tech-support',
    isScam: true,
    sender: 'Windows Defender Security (866) 402-8811',
    body:
      'YOUR COMPUTER HAS BEEN LOCKED. 5 viruses detected. Do not shut down your PC. Call Microsoft Certified Support immediately at (866) 402-8811 to remove the infection.',
    tells: [
      {
        span: 'YOUR COMPUTER HAS BEEN LOCKED',
        why: 'Real antivirus quarantines threats silently. Full-screen panic pages with sirens are ads written by scammers.',
      },
      {
        span: 'Call Microsoft Certified Support',
        why: 'Microsoft does not put phone numbers in virus warnings and never cold-calls you. The "technician" will ask for remote access and gift cards.',
      },
    ],
    lossAmount: 400,
  },
  {
    id: 't1-romance-gift-card',
    kind: 'dm',
    tier: 1,
    category: 'romance',
    isScam: true,
    sender: '@mia.jensen_04',
    app: 'Instagram',
    body:
      'baby i finally got my ticket to come see you!! but my card got blocked for international use. can you send a $100 Apple gift card so i can pay for my visa papers? i pay you back the second i land i promise',
    tells: [
      {
        span: 'my card got blocked',
        why: 'The emergency always lands right before you would finally meet. The story changes, the blocked card never does.',
      },
      {
        span: '$100 Apple gift card',
        why: 'Nobody pays visa fees with gift cards. Gift card codes are cash that cannot be traced or refunded.',
      },
    ],
    lossAmount: 100,
  },
  {
    id: 't1-ssn-suspended',
    region: 'us',
    kind: 'call',
    tier: 1,
    category: 'identity',
    isScam: true,
    sender: 'Social Security Administration (800) 001-4412',
    body:
      'This is an automated alert. Your Social Security number has been suspended due to suspicious activity in Texas. Press 1 now to speak with a federal agent, or a warrant will be issued for your arrest.',
    tells: [
      {
        span: 'has been suspended',
        why: 'Social Security numbers cannot be suspended. The entire premise is invented to make you press 1.',
      },
      {
        span: 'a warrant will be issued',
        why: 'Government agencies send letters, not robocall threats. Arrest pressure on a phone call is a script, every time.',
      },
    ],
    lossAmount: 900,
  },
  {
    id: 't1-puppy-shipping',
    kind: 'ad',
    tier: 1,
    category: 'pets',
    isScam: true,
    sender: 'GoldenPaws Home Breeders',
    image: adPuppy,
    body:
      'ADORABLE Golden Retriever puppies looking for their forever home! FREE to a loving family, you only cover the $150 shipping crate. Text us on WhatsApp to reserve your baby today!',
    tells: [
      {
        span: 'FREE to a loving family',
        why: 'Purebred puppies are never free. The photo is stolen, the dog does not exist, and the fees never end.',
      },
      {
        span: '$150 shipping crate',
        why: 'First the crate, then insurance, then a "climate fee" at the airport. Pet scams are a staircase of small payments.',
      },
    ],
    lossAmount: 450,
  },
  {
    id: 't1-flip-guru',
    kind: 'dm',
    tier: 1,
    category: 'investment',
    isScam: true,
    sender: '@wallst.papi',
    app: 'Instagram',
    body:
      'i turn $100 into $1,000 in 24 hours using the forex loophole banks dont want you to know. DM "PROFIT" to join my free mentorship. first 20 students only. receipts in my highlights',
    tells: [
      {
        span: '$100 into $1,000 in 24 hours',
        why: 'That is a 900% daily return. If it existed, he would not need your $100. Guaranteed profit is the loudest red flag in finance.',
      },
      {
        span: 'receipts in my highlights',
        why: 'Screenshots are free to fake. Every flip guru has receipts and zero refunds.',
      },
    ],
    lossAmount: 300,
  },
  {
    id: 't1-grandma-bail-call',
    kind: 'call',
    tier: 1,
    category: 'ai-voice',
    isScam: true,
    sender: 'Unknown Number',
    body:
      'Grandma? It is me... I am in trouble. I got arrested after the game and I need $500 for bail tonight. Please do not tell mom and dad. The officer says you can pay with gift cards from CVS. Please hurry.',
    tells: [
      {
        span: 'Please do not tell mom and dad',
        why: 'Secrecy is the trap. One phone call to the real person collapses the whole scam, which is exactly why they beg you not to make it.',
      },
      {
        span: 'pay with gift cards',
        why: 'No police department, court, or lawyer on earth takes bail in CVS gift cards. AI can clone a voice from 3 seconds of audio, so verify with a family code word.',
      },
    ],
    lossAmount: 500,
  },
  {
    id: 't1-hurricane-cashapp',
    region: 'us',
    kind: 'dm',
    tier: 1,
    category: 'charity',
    isScam: true,
    sender: '@relief.fund.official2026',
    app: 'Instagram',
    body:
      'Hurricane victims need YOUR help. Every $10 feeds a family tonight. We are volunteers, 100% goes to victims. Send directly to our CashApp $reliefhelper26. God bless you.',
    tells: [
      {
        span: 'Send directly to our CashApp',
        why: 'Real charities take cards on their own .org site so donations are tracked and refundable. Personal payment handles are a black hole.',
      },
      {
        span: '@relief.fund.official2026',
        why: 'Accounts born the week of a disaster with "official" in the name are harvest accounts. Check age, check the org on charitynavigator.org.',
      },
    ],
    lossAmount: 50,
  },
  {
    id: 't1-brand-ambassador',
    kind: 'dm',
    tier: 1,
    category: 'influencer',
    isScam: true,
    sender: '@fashionnova.creators',
    app: 'Instagram',
    body:
      'Hey! We LOVE your page and want you as a brand ambassador! You get 40% commission + free monthly drops. Just cover the $65 starter kit shipping and you are officially on the team!',
    tells: [
      {
        span: 'cover the $65 starter kit',
        why: 'Real brand deals pay YOU. Any "opportunity" that starts with you paying them is the product, and you are the customer.',
      },
      {
        span: 'We LOVE your page',
        why: 'Copy-pasted flattery blasted to thousands of accounts. Check the handle: the real brand is @fashionnova, verified, and it does not DM first.',
      },
    ],
    lossAmount: 65,
  },
  {
    id: 't1-flight-flash-sale',
    kind: 'ad',
    tier: 1,
    category: 'travel',
    isScam: true,
    sender: 'SkyDealz Express',
    image: adFlight,
    body:
      'LAST CHANCE: Round trip to Miami $29!! 97% OFF ends tonight. Book now at flashsale-flights.top before seats are gone. No refunds on promo fares.',
    tells: [
      {
        span: 'flashsale-flights.top',
        why: 'Airlines and real booking sites do not live on .top domains. You will pay, get a fake confirmation, and no plane will know your name.',
      },
      {
        span: 'Round trip to Miami $29',
        why: 'Below-cost pricing is bait math. If it is 97% off everything everywhere, the product is your card number.',
      },
    ],
    lossAmount: 120,
  },
  {
    id: 't1-sextortion-bluff',
    kind: 'email',
    tier: 1,
    category: 'blackmail',
    isScam: true,
    sender: 'unknown4419@secmail.pro',
    subject: 'I know what you did',
    body:
      'I installed malware on your device and recorded you through your camera. I have videos that would embarrass you. Pay $500 in Bitcoin within 48 hours or I send them to everyone in your contacts. Do not go to the police.',
    tells: [
      {
        span: 'I installed malware on your device',
        why: 'Zero proof attached because there is none. This exact email is blasted to millions of addresses from data breaches.',
      },
      {
        span: 'Pay $500 in Bitcoin',
        why: 'Crypto demands with countdown clocks are bluff pressure. Do not pay, do not reply, report it to an adult and the FBI at ic3.gov.',
      },
    ],
    lossAmount: 500,
  },
  {
    id: 't1-robux-generator',
    kind: 'ad',
    tier: 1,
    category: 'gaming',
    isScam: true,
    sender: 'RobuxKing.gg',
    image: adRobuxKing,
    body:
      'FREE 10,000 ROBUX GENERATOR! Working August 2026, no ban risk. Just log in with your Roblox username and password to verify you are human. 4,382 players claimed today!',
    tells: [
      {
        span: 'log in with your Roblox username and password',
        why: 'The generator generates nothing. The login form is the entire scam: your account, your skins, and your saved card are gone.',
      },
      {
        span: 'FREE 10,000 ROBUX',
        why: 'Robux costs Roblox real money. Nobody hands out $100 of it because you clicked an ad.',
      },
    ],
    lossAmount: 150,
  },
  {
    id: 't1-appleid-locked',
    kind: 'sms',
    tier: 1,
    category: 'phishing',
    isScam: true,
    sender: '+1 (213) 908-5561',
    body:
      'Apple: Your Apple ID has been locked due to unusual sign-in activity. Verify your identity within 24 hours to avoid permanent deletion: appleid-unlock.com',
    tells: [
      {
        span: 'appleid-unlock.com',
        why: 'Apple owns apple.com and nothing else. Lookalike domains with the brand name in front are phishing kits sold in bulk.',
      },
      {
        span: 'avoid permanent deletion',
        why: 'Apple does not delete accounts over a login alert. Fake stakes, fake deadline, real password theft.',
      },
    ],
    lossAmount: 350,
  },
  {
    id: 't1-chase-card-locked',
    region: 'us',
    kind: 'sms',
    tier: 1,
    category: 'banking',
    isScam: true,
    sender: '+1 (332) 271-9948',
    body:
      'CHASE ALERT: Your debit card has been temporarily locked. Restore access now: chase-secure-verify.info. Msg&data rates may apply.',
    tells: [
      {
        span: 'chase-secure-verify.info',
        why: 'Chase texts come from a 5-digit short code and link only to chase.com. A full phone number plus an .info domain is a costume.',
      },
      {
        span: 'Restore access now',
        why: 'Real bank alerts ask you to confirm a charge with YES or NO. They do not send login links, because that is exactly what thieves do.',
      },
    ],
    lossAmount: 600,
  },
  {
    id: 't1-iphone-shipping-fee',
    kind: 'email',
    tier: 1,
    category: 'prize',
    isScam: true,
    sender: 'rewards@customer-loyalty-center.net',
    subject: 'Congratulations! Your iPhone 17 Pro is waiting',
    body:
      'You have been chosen from our loyalty program to receive a FREE iPhone 17 Pro. Just pay $1.95 shipping and handling to claim your device. Offer expires in 6 hours.',
    tells: [
      {
        span: 'pay $1.95 shipping',
        why: 'The $1.95 is not the prize fee, it is a card-number collection form. Small amounts feel safe, which is the point.',
      },
      {
        span: 'expires in 6 hours',
        why: 'A real giveaway from a company you shop with does not evaporate before dinner. Urgency is the tell.',
      },
    ],
    lossAmount: 210,
  },
  {
    id: 't1-car-wrap',
    kind: 'sms',
    tier: 1,
    category: 'job',
    isScam: true,
    sender: '+1 (786) 442-0093',
    body:
      'Earn $500 weekly just by driving with a Monster Energy wrap on your car! No experience needed. Reply YES and our specialist will send your first paycheck upfront.',
    tells: [
      {
        span: 'first paycheck upfront',
        why: 'The upfront check is fake. It clears for days, you send "wrap installer fees" from it, then the bank claws the whole check back from YOU.',
      },
      {
        span: 'Earn $500 weekly just by driving',
        why: 'Pay with no work and no interview is bait. Real wrap programs are rare, competitive, and never text random numbers.',
      },
    ],
    lossAmount: 1750,
  },
  {
    id: 't1-is-this-you',
    kind: 'dm',
    tier: 1,
    category: 'social',
    isScam: true,
    sender: '@jayden_hoops22',
    app: 'Snapchat',
    body:
      'omg is this you in this video?? i cant believe someone posted this lol snap-videoview.com/watch?v=you',
    tells: [
      {
        span: 'is this you in this video??',
        why: 'Curiosity bait from a hacked friend account. The same message already went to their whole friend list.',
      },
      {
        span: 'snap-videoview.com',
        why: 'The "video player" is a fake login page. Type your password and the worm sends this exact message from your account next.',
      },
    ],
    lossAmount: 90,
  },

  // ----- tier 1 legit -----
  {
    id: 't1-duolingo-streak-legit',
    kind: 'email',
    tier: 1,
    category: 'subscription',
    isScam: false,
    sender: 'hello@duolingo.com',
    subject: 'Your 47 day streak is on the line!',
    body:
      'Hi Maya, you have not done your Spanish lesson today. Complete one lesson before midnight to keep your 47 day streak alive. Open the app to practice.',
    legitNote:
      'Real domain, no payment, no link demanding a login, and it references your actual streak. Annoying is not the same as fake.',
  },
  {
    id: 't1-discord-code-legit',
    kind: 'sms',
    tier: 1,
    category: 'security',
    isScam: false,
    sender: '22395',
    body:
      'Your Discord verification code is 481227. Do not share this code with anyone. Discord staff will never ask for it.',
    legitNote:
      'You just asked for this code, it arrived from a short code, and it tells you to share it with nobody. The scam version is a PERSON asking you to read the code out.',
  },
  {
    id: 't1-doordash-delivered-legit',
    region: 'us',
    kind: 'sms',
    tier: 1,
    category: 'delivery',
    isScam: false,
    sender: 'DoorDash',
    body:
      'Your DoorDash order from Chipotle has been delivered. Enjoy! Rate your experience in the app.',
    legitNote:
      'Past tense, matches an order you actually placed minutes ago, no link, no fee, no login. Confirmations confirm; scams demand.',
  },
  {
    id: 't1-friend-pizza-legit',
    region: 'us',
    kind: 'payment',
    tier: 1,
    category: 'social',
    isScam: false,
    sender: 'Tyler Brooks',
    app: 'Venmo',
    body: 'Request: $8.50 for "pizza friday you know what you did"',
    legitNote:
      'A person you know, an amount that matches real life, and an inside joke a bot could not write. Context is your best fraud filter.',
  },
  {
    id: 't1-spotify-receipt-legit',
    region: 'us',
    kind: 'email',
    tier: 1,
    category: 'subscription',
    isScam: false,
    sender: 'no-reply@spotify.com',
    subject: 'Your receipt from Spotify',
    body:
      'Thanks for your payment. Spotify Premium Student: $5.99 on Aug 9, 2026, charged to Visa ending 4417. Manage your subscription anytime in your account settings.',
    legitNote:
      'A receipt for the plan you actually have, from the real domain, asking nothing of you. Receipts that demand "verification" are the fake ones.',
  },
  {
    id: 't1-usps-tracking-legit',
    region: 'us',
    kind: 'sms',
    tier: 1,
    category: 'delivery',
    isScam: false,
    sender: '28777',
    body:
      'USPS: Your package is arriving today by 8:00 PM. Track at usps.com 9405 5036 9930 0421 8877 21. Reply STOP to cancel.',
    legitNote:
      'Short code sender, the real usps.com, a tracking number, and zero fees. The scam twin always invents a $1.99 "redelivery fee" on a weird domain.',
  },
  {
    id: 't1-library-hold-legit',
    region: 'us',
    kind: 'email',
    tier: 1,
    category: 'school',
    isScam: false,
    sender: 'notices@denverlibrary.org',
    subject: 'Your hold is ready for pickup',
    body:
      'Good news! The item you placed on hold, "The Anthropocene Reviewed", is ready for pickup at the Central Library branch until Aug 18. Bring your library card.',
    legitNote:
      'A thing you requested, a real .org, a pickup in person, and nothing to click or pay. The most boring messages are usually the safest.',
  },
  {
    id: 't1-venmo-received-legit',
    region: 'us',
    kind: 'payment',
    tier: 1,
    category: 'banking',
    isScam: false,
    sender: 'Grandma Rose',
    app: 'Venmo',
    body: 'Paid you $25.00 - "Happy birthday sweetheart! Buy yourself something fun"',
    legitNote:
      'Money coming IN with no strings, from a named contact you know, matching a real occasion. Scams that "send" money always need you to send something back first.',
  },

  // ================= EXPANSION PACK: TIER 2 =================
  {
    id: 't2-romance-airport',
    region: 'us',
    kind: 'dm',
    tier: 2,
    category: 'romance',
    isScam: true,
    sender: '@lucas.reyes.photo',
    app: 'Instagram',
    body:
      'i know we have only been talking 3 weeks but you already know me better than anyone here. im stuck at the airport in Atlanta, they say my bag is 12 lbs over and i need $200 or they pull me off the flight to come see you. Zelle me and ill pay you back Friday when my check hits, i swear on my mom',
    tells: [
      {
        span: 'stuck at the airport',
        why: 'Three weeks of sweet talk, then a crisis only your money can fix. The relationship was built to cash this exact moment.',
      },
      {
        span: 'Zelle me and ill pay you back Friday',
        why: 'Zelle is instant and irreversible, which is why romance scammers love it. Friday never comes.',
      },
    ],
    lossAmount: 200,
  },
  {
    id: 't2-geek-squad-invoice',
    region: 'us',
    kind: 'email',
    tier: 2,
    category: 'tech-support',
    isScam: true,
    sender: 'billing.dept@gsquad-renewals.com',
    subject: 'Invoice GS-88231: Your Geek Squad plan renewed - $399.99',
    body:
      'Dear Customer, your Geek Squad Total Protection plan has auto-renewed for $399.99, charged to your account on file. If you did not authorize this transaction or wish to cancel, call our billing desk at (888) 314-0562 within 24 hours for a full refund.',
    tells: [
      {
        span: 'call our billing desk',
        why: 'The invoice is fake; the phone number is the scam. The "agent" will remote into your computer to "process the refund" and drain your bank instead.',
      },
      {
        span: 'gsquad-renewals.com',
        why: 'Best Buy sends from bestbuy.com. A charge you never made, on a plan you never had, from a domain that is not the company: delete and check your card yourself.',
      },
    ],
    lossAmount: 400,
  },
  {
    id: 't2-staking-withdrawal-fee',
    kind: 'dm',
    tier: 2,
    category: 'crypto',
    isScam: true,
    sender: '@yieldvault_ann',
    app: 'Discord',
    body:
      'your 14-day ETH staking cycle is complete! balance: $612.40. our audited smart contract requires a one-time $50 gas unlock fee to process external withdrawals. send to the treasury wallet and your payout releases automatically within the hour',
    tells: [
      {
        span: '$50 gas unlock fee',
        why: 'Real platforms deduct fees FROM your balance. Any site that needs new money to release old money is a pay-to-exit trap that never exits.',
      },
      {
        span: 'audited smart contract',
        why: 'Audit-flavored words are decoration. The dashboard number was always fake; only your deposits were real.',
      },
    ],
    lossAmount: 850,
  },
  {
    id: 't2-mom-voice-accident',
    region: 'us',
    kind: 'call',
    tier: 2,
    category: 'ai-voice',
    isScam: true,
    sender: 'Mom (spoofed)',
    body:
      'Honey, listen, I was in a small car accident. I am okay but my phone is dying. I need you to CashApp $300 to the other driver right now so they do not call the police. The handle is $mikedrew887. Do it now, I will explain at home. Do not call your father.',
    tells: [
      {
        span: 'CashApp $300 to the other driver',
        why: 'Accidents are settled through insurance, never through a teenager\'s CashApp in the next ten minutes. The urgency is the con.',
      },
      {
        span: 'Do not call your father',
        why: 'Isolation is step one of every voice-clone script. Hang up and call the real person back on their real number; a clone cannot answer that.',
      },
    ],
    lossAmount: 300,
  },
  {
    id: 't2-ticketmaster-transfer',
    region: 'us',
    kind: 'email',
    tier: 2,
    category: 'tickets',
    isScam: true,
    sender: 'transfers@ticketmaster-events.net',
    subject: 'You have a ticket transfer waiting: Section 114, Row H',
    body:
      'Sarah M. has sent you 2 tickets: Olivia Rodrigo, Aug 22, Section 114 Row H. This transfer expires in 4 hours. Accept now to add tickets to your account: ticketmaster-events.net/accept',
    tells: [
      {
        span: 'ticketmaster-events.net',
        why: 'Real transfers live at ticketmaster.com and appear inside your app by themselves. The lookalike accept page exists to eat your login.',
      },
      {
        span: 'expires in 4 hours',
        why: 'Real ticket transfers do not have countdown bombs. Deadlines are for making you skip the domain check.',
      },
    ],
    lossAmount: 240,
  },
  {
    id: 't2-ezpass-final-notice',
    region: 'us',
    kind: 'sms',
    tier: 2,
    category: 'toll',
    isScam: true,
    sender: '+63 915 228 4471',
    body:
      'FINAL NOTICE: Outstanding toll balance $12.51. Per state code 41-6a-701 failure to pay will result in license suspension and referral to collections. Resolve immediately: ezdrivema-payments.com',
    tells: [
      {
        span: '+63 915 228 4471',
        why: 'That country code is the Philippines. Your state toll authority is not texting you from Southeast Asia.',
      },
      {
        span: 'license suspension',
        why: 'A $12 toll does not suspend licenses. Legal-sounding threats with a payment link are the costume, not the law.',
      },
    ],
    lossAmount: 190,
  },
  {
    id: 't2-icloud-renewal',
    kind: 'email',
    tier: 2,
    category: 'subscription',
    isScam: true,
    sender: 'no-reply@icloud-billing.support',
    subject: 'Your iCloud+ storage renews tomorrow: $129.00',
    body:
      'Your iCloud+ 2TB annual plan renews on Aug 12, 2026 for $129.00. If you do not recognize this subscription or want to cancel, review your billing information here: icloud-billing.support/manage',
    tells: [
      {
        span: 'icloud-billing.support',
        why: 'Apple bills from apple.com and you manage storage in Settings on your device, never through an email link.',
      },
      {
        span: 'If you do not recognize this subscription',
        why: 'The email invents a charge so you click to dispute it. The dispute form is the phishing page.',
      },
    ],
    lossAmount: 260,
  },
  {
    id: 't2-gofundme-lookalike',
    kind: 'dm',
    tier: 2,
    category: 'charity',
    isScam: true,
    sender: '@prayers4mason',
    app: 'Instagram',
    body:
      'you probably saw what happened to Mason at the game friday. his family cant cover the hospital bills. we are so close to the goal, please give anything at gofund-me.help/mason-strong and SHARE',
    tells: [
      {
        span: 'gofund-me.help',
        why: 'GoFundMe is gofundme.com, no hyphen, no .help. Tragedy scammers ride real local news within hours.',
      },
      {
        span: 'please give anything',
        why: 'Real campaigns name the organizer and show up on the platform when you search the family name. If you care, find it yourself on the real site.',
      },
    ],
    lossAmount: 40,
  },
  {
    id: 't2-fafsa-verify-upload',
    region: 'us',
    kind: 'email',
    tier: 2,
    category: 'identity',
    isScam: true,
    sender: 'processing@fafsa-verification.org',
    subject: 'Action required: Your FAFSA is on hold pending verification',
    body:
      'Your 2026-27 FAFSA was selected for verification. To release your aid package, upload a photo of your Social Security card and a parent bank statement to our secure portal within 5 days: fafsa-verification.org/upload',
    tells: [
      {
        span: 'upload a photo of your Social Security card',
        why: 'Real verification happens through your school\'s financial aid office and studentaid.gov. Nobody legitimate collects SSN card photos through an email link.',
      },
      {
        span: 'fafsa-verification.org',
        why: 'Federal student aid lives at studentaid.gov. An .org selling "verification" is farming identities that get abused for years.',
      },
    ],
    lossAmount: 1200,
  },
  {
    id: 't2-breeder-crate-fee',
    region: 'us',
    kind: 'sms',
    tier: 2,
    category: 'pets',
    isScam: true,
    sender: '+1 (971) 300-8842',
    body:
      'Hi! Bella is at the cargo facility. Unfortunately the airline requires a climate-controlled crate for the summer heat, $275 refundable deposit. She has been crying all morning, please send via Zelle so we can board her on the 3 PM flight.',
    tells: [
      {
        span: 'climate-controlled crate',
        why: 'The second fee after your deposit is the signature of pet shipping scams. There is always a third: insurance, vet papers, customs.',
      },
      {
        span: 'She has been crying all morning',
        why: 'Emotional pressure on a schedule. The dog in the photos belongs to a stranger on the internet.',
      },
    ],
    lossAmount: 275,
  },
  {
    id: 't2-airbnb-off-platform',
    region: 'us',
    kind: 'email',
    tier: 2,
    category: 'travel',
    isScam: true,
    sender: 'daniel.hostings@gmail.com',
    subject: 'Re: Your Airbnb reservation request - spring break',
    body:
      'Hey! Great news, the beach condo is available for your dates. Quick heads up: Airbnb takes a 14% service fee, so if you pay the $900 directly through Zelle I can take 10% off instead. I will mark the calendar as booked as soon as it lands. Deal?',
    tells: [
      {
        span: 'pay the $900 directly through Zelle',
        why: 'Off-platform payment deletes every protection you have. When you arrive, the condo has never heard of you.',
      },
      {
        span: 'daniel.hostings@gmail.com',
        why: 'Real Airbnb messages come through airbnb.com threads, not personal Gmail. Leaving the platform IS the scam.',
      },
    ],
    lossAmount: 900,
  },
  {
    id: 't2-shein-campus-rep',
    kind: 'dm',
    tier: 2,
    category: 'influencer',
    isScam: true,
    sender: '@shein.campus.team',
    app: 'TikTok',
    body:
      'CONGRATS! You have been selected as a SHEIN Campus Rep for your school. You earn 25% commission plus a monthly clothing allowance. To activate your rep dashboard, purchase the $85 sample box (fully reimbursed with your first commission payout).',
    tells: [
      {
        span: 'purchase the $85 sample box',
        why: 'Pay-to-start is the whole business. The reimbursement requires commissions, the commissions require recruiting more kids to buy sample boxes.',
      },
      {
        span: 'You have been selected',
        why: 'Selected from what? You never applied. Mass-DM flattery is the uniform of fake brand programs.',
      },
    ],
    lossAmount: 85,
  },
  {
    id: 't2-stockx-fake-confirm',
    kind: 'email',
    tier: 2,
    category: 'marketplace',
    isScam: true,
    sender: 'orders@stockx-transactions.com',
    subject: 'Payment confirmed: Jordan 4 Retro "Military Blue" - $312.00',
    body:
      'Good news! The buyer\'s payment of $312.00 for your Jordan 4 Retro (size 10.5) is confirmed and held in escrow. Ship within 2 business days to release funds. A prepaid label is attached. Funds release upon carrier scan.',
    tells: [
      {
        span: 'stockx-transactions.com',
        why: 'StockX emails from stockx.com and payment status lives in your seller dashboard. If the dashboard shows nothing, the "escrow" is a fairy tale.',
      },
      {
        span: 'Funds release upon carrier scan',
        why: 'Crafted so you ship $300 shoes to a stranger before any money exists. Check the app, not the email.',
      },
    ],
    lossAmount: 312,
  },
  {
    id: 't2-webcam-old-password',
    kind: 'email',
    tier: 2,
    category: 'blackmail',
    isScam: true,
    sender: 'delta.column@protonmail.com',
    subject: 'I know your password is falcons2019',
    body:
      'Yes, falcons2019 is your password. I placed a RAT on an adult site you visited and recorded through your webcam while you browsed. I also copied your contact list. Transfer $800 in Bitcoin within 72 hours or the recording goes to every contact. Answering is pointless.',
    tells: [
      {
        span: 'falcons2019 is your password',
        why: 'That password came from an old data breach dump, not your webcam. Millions got this same email with their own leaked password pasted in.',
      },
      {
        span: 'Transfer $800 in Bitcoin',
        why: 'If a recording existed they would attach proof. Change the old password, turn on 2FA, report at ic3.gov, never pay.',
      },
    ],
    lossAmount: 800,
  },
  {
    id: 't2-steam-item-verify',
    kind: 'dm',
    tier: 2,
    category: 'gaming',
    isScam: true,
    sender: 'SteamGuard Support#0417',
    app: 'Discord',
    body:
      'Hello, I am a Steam moderator. Your account was reported for duplicate items and is pending a trade ban. To verify your inventory is clean, trade your items to our verification bot SteamCheck_Bot77. Items are returned automatically after the 20 minute scan.',
    tells: [
      {
        span: 'trade your items to our verification bot',
        why: 'No company verifies your property by taking your property. The "scan" ends with your knife skins on someone else\'s account.',
      },
      {
        span: 'I am a Steam moderator',
        why: 'Valve staff do not work through Discord DMs. Report-and-ban threats are the pressure play; the bot is the exit door.',
      },
    ],
    lossAmount: 320,
  },
  {
    id: 't2-cashapp-flip',
    region: 'us',
    kind: 'dm',
    tier: 2,
    category: 'money-games',
    isScam: true,
    sender: '@moneymotivated.rell',
    app: 'Instagram',
    body:
      'CASH FLIP FRIDAY. i flip $50 into $500, $100 into $1,000. real method thru my plug at the bank, 30 min turnaround. check my story for todays winners. first come first serve, send to $rellflips to lock your slot',
    tells: [
      {
        span: 'i flip $50 into $500',
        why: 'Money does not multiply because a stranger touched it. The flip has one step: your $50 leaves.',
      },
      {
        span: 'check my story for todays winners',
        why: 'The winners are screenshots of his own alt accounts. Testimonials you cannot verify are set dressing.',
      },
    ],
    lossAmount: 50,
  },

  // ----- tier 2 legit -----
  {
    id: 't2-boa-fraud-alert-legit',
    region: 'us',
    kind: 'sms',
    tier: 2,
    category: 'banking',
    isScam: false,
    sender: '322632',
    body:
      'BofA: Did you attempt a $148.20 purchase at SHEIN.COM with card ending 8823? Reply YES or NO. Reply HELP for assistance. We will never call to ask for codes.',
    legitNote:
      'Short code sender, a specific card and merchant, and it only wants YES or NO. No link, no login, no "agent" to call. This is what real fraud alerts look like.',
  },
  {
    id: 't2-ticketmaster-transfer-legit',
    region: 'us',
    kind: 'email',
    tier: 2,
    category: 'tickets',
    isScam: false,
    sender: 'customer_support@email.ticketmaster.com',
    subject: 'Jordan P. sent you tickets!',
    body:
      'Jordan P. has transferred 1 ticket to you: Homecoming Showcase, Aug 29. Sign in to your Ticketmaster account or open the app to accept. Tickets will appear under My Events.',
    legitNote:
      'Real Ticketmaster subdomain, a sender you actually know, and it routes you to sign in the way you always do. No countdown, no weird accept-page domain.',
  },
  {
    id: 't2-dmv-appointment-legit',
    region: 'us',
    kind: 'sms',
    tier: 2,
    category: 'government',
    isScam: false,
    sender: '468311',
    body:
      'CA DMV: Reminder, your behind-the-wheel test is Aug 14 at 10:20 AM, Culver City office. Arrive 15 min early with your permit and proof of insurance. Reply C to cancel.',
    legitNote:
      'An appointment you booked, a short code, and instructions that cost nothing. Government scams always want money or your SSN; reminders just want you on time.',
  },
  {
    id: 't2-paypal-receipt-legit',
    region: 'us',
    kind: 'email',
    tier: 2,
    category: 'shopping',
    isScam: false,
    sender: 'service@paypal.com',
    subject: 'Receipt for your payment to Steam Games',
    body:
      'You sent $19.99 to Valve Corporation. Transaction ID: 7XK220489L3302158. If you did not make this purchase, report it in the Resolution Center at paypal.com. No further action is needed.',
    legitNote:
      'Real domain, a purchase that matches what you just did, an ID you can check inside the app, and no urgency. The fake version wants you to "cancel" through a phone number or a link.',
  },
  {
    id: 't2-ezpass-statement-legit',
    region: 'us',
    kind: 'email',
    tier: 2,
    category: 'toll',
    isScam: false,
    sender: 'noreply@e-zpassny.com',
    subject: 'Your August statement is ready',
    body:
      'Your E-ZPass monthly statement is now available. Sign in to your account at e-zpassny.com to view activity and manage AutoPay. Thank you for using E-ZPass.',
    legitNote:
      'The account you actually have, the official domain, no amount demanded and no deadline. Compare with the "final notice" texts from random numbers: statements inform, scams threaten.',
  },
  {
    id: 't2-class-fundraiser-legit',
    region: 'us',
    kind: 'email',
    tier: 2,
    category: 'school',
    isScam: false,
    sender: 'k.alvarez@lincolnhs.org',
    subject: 'Band trip fundraiser is live (school-approved link)',
    body:
      'Hi families, our band trip fundraiser is live on the district\'s approved platform. Donations go directly to the school account and receipts are automatic. Find the link on the school website under Activities, or donate at the front office. Thank you!',
    legitNote:
      'A named teacher on the real school domain, and it points you to the school website instead of pasting a pay-now link. Real fundraisers survive you finding them yourself.',
  },

  // ================= EXPANSION PACK: TIER 3 =================
  {
    id: 't3-coach-voicemail',
    region: 'us',
    kind: 'call',
    tier: 3,
    category: 'ai-voice',
    isScam: true,
    sender: 'Voicemail from (614) 555-0187',
    body:
      'Hey, it is Coach Daniels. Quick one: the tournament registration deadline moved up to tonight and the school portal is down. Venmo the $95 team fee to my assistant @coachD-teamfund tonight so I can lock the roster. Text me on this number if there are issues, do not bother the front office, they are slammed.',
    tells: [
      {
        span: 'Venmo the $95 team fee to my assistant',
        why: 'School fees go through the school portal or front office, never a personal Venmo. "The portal is down" is the excuse that reroutes the money.',
      },
      {
        span: 'do not bother the front office',
        why: 'The one place that could instantly expose the scam is the one place you are told to avoid. AI needs 3 seconds of a coach\'s pregame speech to clone this voice.',
      },
    ],
    lossAmount: 95,
  },
  {
    id: 't3-pig-butchering-intro',
    kind: 'dm',
    tier: 3,
    category: 'investment',
    isScam: true,
    sender: '@wei.lin.trader',
    app: 'Instagram',
    body:
      'good morning! did you sleep well? my uncle\'s node opened again, i moved my allocation at 6am. i know you said $80 is all you can spare from your job, that is honestly how i started. small consistent entries. i will walk you through the app step by step, we can do a video call, you will see my real balance. family helps family',
    tells: [
      {
        span: 'my uncle\'s node opened again',
        why: 'Months of friendly small talk, then insider access appears. Pig-butchering scams farm trust for weeks before the first deposit ask.',
      },
      {
        span: 'you will see my real balance',
        why: 'The app is a stage set run by the scammer\'s crew: fake charts, fake balance, real deposits. Withdrawals will need a "tax" that never ends.',
      },
    ],
    lossAmount: 3800,
  },
  {
    id: 't3-brokerage-withdrawal-tax',
    region: 'us',
    kind: 'email',
    tier: 3,
    category: 'investment',
    isScam: true,
    sender: 'clearing@meridian-equity.net',
    subject: 'Withdrawal request MR-30291: compliance hold',
    body:
      'Your withdrawal of $2,600.00 has passed initial review. Per FINRA regulation 2111, accounts under 12 months must remit a 10% capital gains pre-payment ($260.00) before external transfers unlock. This amount is credited back with your payout. Wire instructions attached.',
    tells: [
      {
        span: 'remit a 10% capital gains pre-payment',
        why: 'Taxes are paid to the IRS at tax time, never wired to a brokerage to "unlock" your own money. Pay-to-withdraw means the balance was never real.',
      },
      {
        span: 'Per FINRA regulation 2111',
        why: 'A real rule number used for a fake purpose. Regulation-flavored language is there to outrank your gut.',
      },
    ],
    lossAmount: 2600,
  },
  {
    id: 't3-settlement-bank-login',
    region: 'us',
    kind: 'email',
    tier: 3,
    category: 'identity',
    isScam: true,
    sender: 'claims@equifax-settlement-fund.com',
    subject: 'You are owed $384.62 from the Equifax data breach settlement',
    body:
      'Our records indicate you are an eligible class member. Your payment of $384.62 is ready for direct deposit. To receive funds, verify your identity by signing in with your online banking credentials through our secure claims portal. Claims close Aug 20.',
    tells: [
      {
        span: 'signing in with your online banking credentials',
        why: 'No settlement administrator on earth needs your bank PASSWORD. Real payouts ask for an account number or mail a check.',
      },
      {
        span: 'equifax-settlement-fund.com',
        why: 'Real settlements run through court-appointed administrators with addresses you can verify on the court\'s own site. Real-sounding case, fake portal.',
      },
    ],
    lossAmount: 1400,
  },
  {
    id: 't3-ticket-spoofed-transfer',
    region: 'us',
    kind: 'dm',
    tier: 3,
    category: 'tickets',
    isScam: true,
    sender: '@kayla.sells.tix',
    app: 'Instagram',
    body:
      'still have 2 for saturday, section 121 row F, $85 each (paid 150, cant go anymore, family thing). i do the ticketmaster transfer the second the venmo clears, i can even screen record it. i have vouches pinned. venmo goods and services is fine but you cover the fee',
    tells: [
      {
        span: 'the second the venmo clears',
        why: 'Money first, tickets never. Screen recordings and "vouches" are props; the transfer email that follows is spoofed.',
      },
      {
        span: 'section 121 row F',
        why: 'Hyper-specific seats and a sad backstory make it feel real. Buy resale only where the ticket transfers INSIDE the platform before you pay.',
      },
    ],
    lossAmount: 170,
  },
  {
    id: 't3-apple-support-callback',
    kind: 'call',
    tier: 3,
    category: 'tech-support',
    isScam: true,
    sender: 'Apple Support (caller ID)',
    body:
      'This is Marcus with Apple Support, reference case 002-3841. Following this week\'s iCloud service disruption, we detected sign-ins to your account from two states. I can secure it with you right now. Please install the Anydesk screen-share tool so I can walk you through re-encrypting your keychain. This call is recorded for quality.',
    tells: [
      {
        span: 'install the Anydesk screen-share tool',
        why: 'Apple never calls you first and never asks for remote access. Screen-share plus your open banking app is how accounts get emptied on a "support" call.',
      },
      {
        span: 'Following this week\'s iCloud service disruption',
        why: 'Scammers ride real news cycles to sound legitimate. A true outage requires nothing from you; hang up and check apple.com yourself.',
      },
    ],
    lossAmount: 1100,
  },
  {
    id: 't3-targeted-sextortion',
    kind: 'dm',
    tier: 3,
    category: 'blackmail',
    isScam: true,
    sender: '@anon.4482x',
    app: 'Snapchat',
    body:
      'i go to your school. i have screenshots from your finsta and i know your parents and coach malone. pay $1,000 by friday or everything gets sent to the whole junior class and the counselors. i am not playing. reply within 1 hour',
    tells: [
      {
        span: 'i know your parents and coach malone',
        why: 'Names scraped from public profiles in minutes. Sounding local is the upgrade, the script is the same: fear, deadline, pay.',
      },
      {
        span: 'pay $1,000 by friday',
        why: 'Paying never ends it; it marks you as someone who pays. Screenshot, block, tell a trusted adult, and report it: this is a crime against you, not your fault.',
      },
    ],
    lossAmount: 1000,
  },
  {
    id: 't3-ezdrivema-clone',
    region: 'us',
    kind: 'sms',
    tier: 3,
    category: 'toll',
    isScam: true,
    sender: '+1 (508) 214-7793',
    body:
      'EZDriveMA: Your vehicle passed through a toll zone on I-90 on 08/07. Balance due: $4.15. Unpaid balances incur administrative penalties per 700 CMR 7.00. Pay securely at ezdrivema.com-pay.info within 5 days.',
    tells: [
      {
        span: 'ezdrivema.com-pay.info',
        why: 'Read the WHOLE domain right to left: it ends in com-pay.info, not ezdrivema.com. The real name in front is the mask; the real site is the ending.',
      },
      {
        span: 'per 700 CMR 7.00',
        why: 'A real regulation number pasted onto a fake bill. Citing law is free; your state posts tolls in your transponder account, so check there.',
      },
    ],
    lossAmount: 210,
  },
  {
    id: 't3-redcross-lookalike',
    kind: 'email',
    tier: 3,
    category: 'charity',
    isScam: true,
    sender: 'give@redcross-disaster-relief.org',
    subject: 'Emergency appeal: families displaced by the Gulf Coast flooding',
    body:
      'The American Red Cross is on the ground now. 100% of your gift supports flood victims. We are a registered 501(c)(3), EIN 53-0196605. Give before midnight and a partner matches your gift 2x: redcross-disaster-relief.org/give',
    tells: [
      {
        span: 'redcross-disaster-relief.org',
        why: 'The real org is redcross.org, full stop. Scammers register disaster-flavored lookalikes within hours of real news.',
      },
      {
        span: 'EIN 53-0196605',
        why: 'That is the real Red Cross EIN pasted onto a fake domain. Public facts prove nothing about who owns the donate button.',
      },
    ],
    lossAmount: 75,
  },
  {
    id: 't3-sheerid-spoof',
    region: 'us',
    kind: 'email',
    tier: 3,
    category: 'subscription',
    isScam: true,
    sender: 'verify@sheerid-students.net',
    subject: 'Re-verify your student status to keep Spotify Premium Student',
    body:
      'Your student verification expires this month. Spotify partners with SheerID to confirm enrollment. Re-verify now to keep your $5.99 rate: upload your student ID and enter the payment card on file at sheerid-students.net/spotify. Unverified accounts move to $11.99 automatically.',
    tells: [
      {
        span: 'enter the payment card on file',
        why: 'Verification confirms you are a student; it never needs your card number. The real flow starts inside your Spotify account settings, not an email.',
      },
      {
        span: 'sheerid-students.net',
        why: 'SheerID is a real company at sheerid.com, which is exactly why the fake borrows its name. Real service, wrong address, stolen card.',
      },
    ],
    lossAmount: 180,
  },
  {
    id: 't3-turo-off-platform',
    region: 'us',
    kind: 'sms',
    tier: 3,
    category: 'travel',
    isScam: true,
    sender: '+1 (702) 881-3364',
    body:
      'Hey, this is Devon from the Turo listing (2023 Camaro). App is showing a sync error on my end, happens all the time. Send the $500 security deposit via Zelle to hold your dates and I will mark the trip confirmed manually. Deposit is fully refunded at drop-off like normal.',
    tells: [
      {
        span: 'Send the $500 security deposit via Zelle',
        why: 'Turo handles every dollar inside the app, including deposits. Off-app Zelle is a stranger keeping $500 of your money on his honor.',
      },
      {
        span: 'App is showing a sync error',
        why: 'The fake technical problem exists to justify leaving the platform. When the app "breaks" exactly at payment time, the app is not what broke.',
      },
    ],
    lossAmount: 500,
  },
  {
    id: 't3-twitch-partner-invite',
    kind: 'email',
    tier: 3,
    category: 'gaming',
    isScam: true,
    sender: 'partnerships@twitch-creators.tv',
    subject: 'Invitation: Twitch Partner Program (waived requirements)',
    body:
      'Hi! Our talent team reviewed your channel and we would like to fast-track you into the Partner Program with waived follower requirements. Sign in to the creator dashboard to accept your invitation within 7 days: twitch-creators.tv/partner-accept. Welcome aboard!',
    tells: [
      {
        span: 'twitch-creators.tv',
        why: 'Twitch is twitch.tv and partner applications live inside your own dashboard. The fake dashboard login takes the channel you spent years building.',
      },
      {
        span: 'waived follower requirements',
        why: 'Too-good exceptions are the hook. Real partner invites do not skip the rules for an account they just "found".',
      },
    ],
    lossAmount: 700,
  },
  {
    id: 't3-google-new-signin',
    kind: 'email',
    tier: 3,
    category: 'phishing',
    isScam: true,
    sender: 'no-reply@accounts-google.support',
    subject: 'Security alert: new sign-in from Moscow, Russia',
    body:
      'We detected a new sign-in to your Google Account from an unrecognized Windows device in Moscow, Russia. If this was not you, secure your account immediately: accounts-google.support/secure. Your account will be limited in 24 hours pending review.',
    tells: [
      {
        span: 'accounts-google.support',
        why: 'Google sends from google.com and security actions happen at myaccount.google.com. Read the domain ENDING: .support is not Google.',
      },
      {
        span: 'limited in 24 hours pending review',
        why: 'Real alerts inform and let YOU act in your own settings. Fake ones add a countdown so you click their link instead of typing the real address.',
      },
    ],
    lossAmount: 950,
  },

  // ----- tier 3 legit (the hard ones) -----
  {
    id: 't3-discover-fraud-legit',
    region: 'us',
    kind: 'sms',
    tier: 3,
    category: 'banking',
    isScam: false,
    sender: '347268',
    body:
      'Discover: Suspicious transaction alert. Did you attempt $221.87 at BEST BUY #2214? Reply YES or NO. If NO, we will decline it and mail a new card. STOP to opt out.',
    legitNote:
      'Specific merchant, YES or NO only, and the bank takes the action, not you. It never asks you to click, call a new number, or move money to a "safe account".',
  },
  {
    id: 't3-coach-fee-legit',
    region: 'us',
    kind: 'payment',
    tier: 3,
    category: 'school',
    isScam: false,
    sender: 'Coach Daniels',
    app: 'Venmo',
    body:
      'Request: $45.00 for "State tournament entry, as discussed at Tuesday practice. Receipts posted on the team page. Pay by Fri or bring cash to my office."',
    legitNote:
      'Matches what was said in person at practice, offers a cash-in-office alternative, and the amount is on the team page. Verification exists OUTSIDE the message: that is the difference.',
  },
  {
    id: 't3-scholarship-award-legit',
    region: 'us',
    kind: 'email',
    tier: 3,
    category: 'school',
    isScam: false,
    sender: 'awards@coolidgefoundation.org',
    subject: 'Congratulations: your Coolidge Scholarship application result',
    body:
      'Dear Aisha, the selection committee has named you a semifinalist for the Coolidge Scholarship you applied to in March. There is no fee at any stage. Next steps and interview scheduling are in your applicant portal. Reply to this thread or call our office with questions.',
    legitNote:
      'You actually applied, there is no fee at any stage, and everything happens in the portal you already use. Scholarship scams find YOU and want "processing fees"; real ones answer their phone.',
  },
  {
    id: 't3-breach-monitoring-legit',
    region: 'us',
    kind: 'email',
    tier: 3,
    category: 'identity',
    isScam: false,
    sender: 'alerts@capitalone.com',
    subject: 'CreditWise alert: your SSN was found on the dark web',
    body:
      'CreditWise detected your Social Security number in a new dark web exposure. This does not mean fraud has occurred. Open the Capital One app to review the alert and consider freezing your credit for free at the three bureaus. Do not reply to this email with personal information.',
    legitNote:
      'Scary news, calm handling: it routes you to the app you already have, tells you the fix is FREE, and asks for nothing in the email itself. The scam version sells "protection" or wants your SSN to "check".',
  },
  {
    id: 't3-epiqpay-settlement-legit',
    region: 'us',
    kind: 'email',
    tier: 3,
    category: 'shopping',
    isScam: false,
    sender: 'noreply@epiqpay.com',
    subject: 'Your payment from the T-Mobile Data Breach Settlement is ready',
    body:
      'You filed a claim in In re: T-Mobile Customer Data Security Breach Litigation. Your payment of $56.31 is ready. Choose Venmo, PayPal, or a mailed check. Payment IDs can be verified on the settlement website listed in the court notice you received.',
    legitNote:
      'Feels fake, is real: court settlements use administrators like EpiqPay. The proof is that YOU filed the claim and the case is verifiable on the court\'s site. Never sign in with bank credentials though; real payouts never need them.',
  },
  {
    id: 't3-ezpass-replenish-legit',
    region: 'us',
    kind: 'email',
    tier: 3,
    category: 'toll',
    isScam: false,
    sender: 'noreply@e-zpassny.com',
    subject: 'AutoPay replenishment processed: $25.00',
    body:
      'Your E-ZPass balance fell below $10.00, so your card on file was charged $25.00 per your AutoPay settings. No action is needed. Review activity anytime by signing in at e-zpassny.com.',
    legitNote:
      'It describes something your own settings did, on the official domain, and needs nothing from you. The scam twin demands a payment link and a deadline for a balance you cannot verify.',
  },
  {
    id: 't3-apple-signin-legit',
    kind: 'email',
    tier: 3,
    category: 'security',
    isScam: false,
    sender: 'noreply@email.apple.com',
    subject: 'Your Apple ID was used to sign in on a new iPad',
    body:
      'Your Apple ID (m•••••@icloud.com) was used to sign in to iCloud on an iPad Air near Columbus, OH on Aug 10 at 7:42 PM. If this was you, ignore this message. If not, go to Settings on your device or appleid.apple.com to change your password.',
    legitNote:
      'It names the device and place, and tells you to act through Settings or the address you type yourself. No panic, no countdown, no strange login link to click.',
  },
  {
    id: 't3-bank-education-legit',
    region: 'us',
    kind: 'sms',
    tier: 3,
    category: 'banking',
    isScam: false,
    sender: '75791',
    body:
      'Wells Fargo: Reminder, we will NEVER call or text asking for your access code, PIN, or to move money to a "safe account". If anyone does, hang up and call the number on your card.',
    legitNote:
      'The message asks for nothing and teaches the exact rule that beats bank impersonators. Save it: whoever asks for the code IS the scam.',
  },
  {
    id: 't3-zelle-received-legit',
    region: 'us',
    kind: 'payment',
    tier: 3,
    category: 'banking',
    isScam: false,
    sender: 'Aunt Dana',
    app: 'Zelle',
    body: 'Aunt Dana sent you $40.00 - "Gas money for driving Nana to PT this week. Thank you!!"',
    legitNote:
      'Incoming money referencing a real thing you actually did, from a saved contact. The scam version "accidentally overpays" and needs you to send the difference back.',
  },
  {
    id: 't3-counselor-fafsa-legit',
    region: 'us',
    kind: 'email',
    tier: 3,
    category: 'school',
    isScam: false,
    sender: 'r.whitfield@lincolnhs.org',
    subject: 'Seniors: free FAFSA night this Thursday (bring a parent)',
    body:
      'Seniors, our free FAFSA completion night is Thursday 6-8 PM in the library. Counselors and a financial aid officer from City College will help you file on studentaid.gov. Bring a parent and last year\'s tax info. Pizza provided. No sign-up needed.',
    legitNote:
      'Known sender on the school domain, an in-person event you can verify by walking to the library, and it files on the real .gov site. Free help is real; "expedited aid" for a fee is not.',
  },
  {
    id: 't3-amazon-refund-legit',
    region: 'us',
    kind: 'email',
    tier: 3,
    category: 'shopping',
    isScam: false,
    sender: 'return@amazon.com',
    subject: 'Your refund for "JBL Tune 520BT Headphones" has been issued',
    body:
      'We processed your refund of $39.74 to your Visa ending 4417 for the item you returned. Refunds typically appear within 3-5 business days. You can view the status in Your Orders. No further action is required.',
    legitNote:
      'A return YOU started, refunded to the card you used, visible in Your Orders if you check yourself. The scam refund is always "too much by mistake" and needs a gift card to fix.',
  },

  // ---------------- desktop popups (browser notifications) ----------------
  {
    id: 't1-popup-virus-renew',
    kind: 'popup',
    tier: 1,
    category: 'tech-support',
    isScam: true,
    sender: 'total-av-protection.center',
    subject: '(5) Viruses detected on your PC',
    body:
      'McAfee scan result: your protection expired today. 5 threats are attacking your files right now. Click Renew Now to remove all threats instantly before your photos and passwords are stolen.',
    app: 'Chrome',
    tells: [
      {
        span: 'total-av-protection.center',
        why: 'Antivirus alerts come from the app installed on your computer, never from a random website pushing browser notifications.',
      },
      {
        span: '5 threats are attacking your files right now',
        why: 'A website notification cannot scan your computer. It can only show text the site wrote to scare you.',
      },
      {
        span: 'Renew Now',
        why: 'The button opens a fake checkout that charges your card for nothing and keeps charging it every month.',
      },
    ],
    lossAmount: 130,
  },
  {
    id: 't2-popup-chrome-update',
    kind: 'popup',
    tier: 2,
    category: 'security',
    isScam: true,
    sender: 'browser-update-required.com',
    subject: 'Chrome is out of date',
    body:
      'Critical security patch available for your browser. Download ChromeSetup.exe now to keep your passwords safe. Sites may stop loading until you update.',
    app: 'Chrome',
    tells: [
      {
        span: 'browser-update-required.com',
        why: 'Chrome updates itself from Settings. Google never pushes updates through website notifications.',
      },
      {
        span: 'ChromeSetup.exe',
        why: 'That file is malware. Real browser updates never arrive as a download link in a notification.',
      },
      {
        span: 'Sites may stop loading until you update',
        why: 'Fake consequence to rush you. Browsers keep working; scammers invent deadlines.',
      },
    ],
    lossAmount: 480,
  },
  {
    id: 't2-popup-classroom-due',
    kind: 'popup',
    tier: 2,
    category: 'school',
    isScam: false,
    sender: 'classroom.google.com',
    subject: 'Assignment due tomorrow: Ch. 7 Problem Set',
    body:
      'Algebra II with Mr. Reyes: Ch. 7 Problem Set is due tomorrow at 11:59 PM. Open Google Classroom to view your work.',
    app: 'Chrome',
    legitNote:
      'From the real classroom.google.com, names your actual class and teacher, and asks for nothing except opening an app you already use. You turned these reminders on yourself. If unsure, type classroom.google.com into the address bar instead of clicking.',
  },
  {
    id: 't3-popup-defender-lock',
    kind: 'popup',
    tier: 3,
    category: 'tech-support',
    isScam: true,
    sender: 'windows-security-alert.live',
    subject: 'Windows Defender: access to this PC has been blocked',
    body:
      'Trojan spyware detected. Your bank details and photos are being copied. Do not shut down your computer. Call Microsoft Support now at +1 (888) 452-7710 and quote error code 0x80073afc.',
    app: 'Chrome',
    tells: [
      {
        span: 'windows-security-alert.live',
        why: 'Windows security warnings come from Windows itself, not from a website notification with a strange domain.',
      },
      {
        span: 'Do not shut down your computer',
        why: 'Real security tools never say this. Scammers say it because closing the browser makes the fake alert disappear.',
      },
      {
        span: 'Call Microsoft Support now at +1 (888) 452-7710',
        why: 'Microsoft never puts phone numbers in alerts. That number reaches a call center that charges hundreds for fake repairs.',
      },
    ],
    lossAmount: 900,
  },
  {
    id: 't3-popup-breach-check',
    kind: 'popup',
    tier: 3,
    category: 'security',
    isScam: false,
    sender: 'Google Chrome',
    subject: 'Change your password',
    body:
      'A data breach on a site or app exposed your password. Chrome recommends checking your saved passwords now. You can do this anytime in Settings under Password Manager.',
    app: 'Chrome',
    legitNote:
      'A real Chrome feature that looks scarier than it is. Notice what is missing: no link, no download, no phone number, no payment. It points you to your own browser Settings. Open Settings yourself and check from there.',
  },

  // ---------- India pool (region: 'in') ----------

  {
    id: 'in-t1-kbc-lottery',
    region: 'in',
    kind: 'dm',
    tier: 1,
    category: 'prize',
    isScam: true,
    app: 'WhatsApp',
    sender: '+92 331 774 0021',
    body:
      'KBC OFFICIAL: Congratulations! Your mobile number has won Rs 25,00,000 in the Kaun Banega Crorepati Sim Card Lucky Draw. To claim, send processing fee of Rs 6,500 and your Aadhaar copy to lottery manager Rahul Verma on this number.',
    tells: [
      {
        span: 'processing fee of Rs 6,500',
        why: 'Real prizes never charge a fee to release the money. The fee IS the scam; there is no Rs 25 lakh.',
      },
      {
        span: 'Sim Card Lucky Draw',
        why: 'You cannot win a lottery you never entered. KBC is a quiz show, it does not raffle SIM numbers.',
      },
      {
        span: 'your Aadhaar copy',
        why: 'Identity documents sent to strangers come back as loans and SIM cards issued in your name.',
      },
    ],
    lossAmount: 80,
  },
  {
    id: 'in-t1-electricity-tonight',
    region: 'in',
    kind: 'sms',
    tier: 1,
    category: 'utility',
    isScam: true,
    sender: '+91 79043 11208',
    body:
      'Dear Consumer Your Electricity power will be disconnected. Tonight at 9.30pm from electricity office. because your previous month bill was not update. immediately contact our electricity officer 8102-441-XX1 Thank you',
    tells: [
      {
        span: 'Tonight at 9.30pm',
        why: 'Electricity boards send bills with due dates and grace periods. Night-time disconnection threats by SMS are pure pressure theatre.',
      },
      {
        span: 'bill was not update',
        why: 'Broken grammar from a government utility is a giveaway. Official alerts are templated and clean.',
      },
      {
        span: 'contact our electricity officer',
        why: 'Boards do not route billing through one officer with a personal mobile number. That number leads to a screen-share app and an empty account.',
      },
    ],
    lossAmount: 220,
  },
  {
    id: 'in-t1-army-olx',
    region: 'in',
    kind: 'dm',
    tier: 1,
    category: 'marketplace',
    isScam: true,
    app: 'OLX',
    sender: 'Rajesh Kumar (CRPF)',
    body:
      'Sir I am CRPF jawan posted in Srinagar. Selling my Royal Enfield Classic 350 at Rs 45,000 only because urgent transfer posting. Army canteen parcel service will deliver bike to your address. Just pay Rs 5,000 advance booking on GPay to confirm deal.',
    tells: [
      {
        span: 'CRPF jawan posted in Srinagar',
        why: 'The fake fauji is the oldest OLX costume. A uniform in the story builds instant trust and explains why you can never meet.',
      },
      {
        span: 'Rs 45,000 only',
        why: 'A Classic 350 at a third of market price is not a deal, it is bait.',
      },
      {
        span: 'Rs 5,000 advance booking',
        why: 'Advance payment for a vehicle you have never seen disappears along with the profile. Meet, inspect, then pay.',
      },
    ],
    lossAmount: 60,
  },
  {
    id: 'in-t1-free-recharge',
    region: 'in',
    kind: 'dm',
    tier: 1,
    category: 'phishing',
    isScam: true,
    app: 'WhatsApp',
    sender: 'Sunita Aunty (forwarded)',
    body:
      'Jio 84 days FREE recharge to celebrate 10 crore users! I just got mine. Claim before offer ends today: jio-free-recharge.online. Forward this to 10 groups to activate instantly.',
    tells: [
      {
        span: 'jio-free-recharge.online',
        why: 'Jio offers live inside the MyJio app. Random .online domains exist to harvest your number and UPI details.',
      },
      {
        span: 'Forward this to 10 groups',
        why: 'Chain-forwarding is how the scam advertises itself for free. No real company recruits you as its courier.',
      },
      {
        span: 'ends today',
        why: 'A trusted aunty forwarded it, but urgency plus a strange link beats familiarity every time.',
      },
    ],
    lossAmount: 65,
  },
  {
    id: 'in-t1-work-from-home',
    region: 'in',
    kind: 'sms',
    tier: 1,
    category: 'job',
    isScam: true,
    sender: '+91 63007 88412',
    body:
      'Hiring! Work from home part time job. Earn Rs 3000 to Rs 8000 daily just by liking YouTube videos. No experience needed. Limited seats. Join our Telegram: t.me/hrpayout_official7',
    tells: [
      {
        span: 'Rs 3000 to Rs 8000 daily',
        why: 'Nobody pays a lakh a month for taps on a screen. The fake salary exists to set up a deposit demand later.',
      },
      {
        span: 't.me/hrpayout_official7',
        why: 'Real HR does not hire through Telegram handles ending in lucky numbers.',
      },
      {
        span: 'Limited seats',
        why: 'Jobs do not have flash-sale urgency. Scarcity is there so you skip the thinking step.',
      },
    ],
    lossAmount: 550,
  },
  {
    id: 'in-t1-paytm-cashback',
    region: 'in',
    kind: 'sms',
    tier: 1,
    category: 'upi',
    isScam: true,
    sender: 'PYTMCB',
    body:
      'Paytm: Congratulations! You have won Rs 1,499 cashback in our weekly lucky draw. Claim expires in 2 hours: paytm-cashback-rewards.win',
    tells: [
      {
        span: 'paytm-cashback-rewards.win',
        why: 'Real cashback lands in the app by itself. A .win domain is a phishing page dressed for a party.',
      },
      {
        span: 'expires in 2 hours',
        why: 'Deadlines on free money are there to stop you from checking the app first.',
      },
      {
        span: 'weekly lucky draw',
        why: 'You never entered a draw. Prizes you did not sign up for are hooks, not luck.',
      },
    ],
    lossAmount: 85,
  },
  {
    id: 'in-t1-parcel-ivr',
    region: 'in',
    kind: 'call',
    tier: 1,
    category: 'delivery',
    isScam: true,
    sender: 'Incoming call: +91 22 4890 1123',
    body:
      'Recorded voice: "This call is from FedEx courier service. A parcel registered against your Aadhaar number contains illegal items and is held at Mumbai customs. Press 1 to speak with customs officer immediately, or legal action will begin today."',
    tells: [
      {
        span: 'Press 1',
        why: 'Couriers send tracking texts. They do not run press-1 legal hotlines. Pressing 1 connects you to the scam floor.',
      },
      {
        span: 'registered against your Aadhaar number',
        why: 'Parcels are not booked on Aadhaar. The detail exists only to make the threat feel personal.',
      },
      {
        span: 'legal action will begin today',
        why: 'Real customs writes letters and follows procedure. Same-day arrest threats over robocalls are scripts.',
      },
    ],
    lossAmount: 900,
  },
  {
    id: 'in-t1-loan-instant',
    region: 'in',
    kind: 'sms',
    tier: 1,
    category: 'loan-app',
    isScam: true,
    sender: 'LN-APRVD',
    body:
      'Congratulation! Your profile is PRE-APPROVED for instant personal loan Rs 2,00,000 at 0% interest. No documents no CIBIL check. Money in 5 minutes. Download app: quickrupee-loan.app',
    tells: [
      {
        span: '0% interest. No documents no CIBIL check',
        why: 'No real lender skips interest, documents, and credit checks. If they are not earning from interest, they are earning from you.',
      },
      {
        span: 'quickrupee-loan.app',
        why: 'Sideloaded loan apps outside the Play Store take your contacts and photos, then use them for harassment and blackmail.',
      },
      {
        span: 'PRE-APPROVED',
        why: 'Approved for a loan you never applied for. Flattery with a download button attached.',
      },
    ],
    lossAmount: 350,
  },
  {
    id: 'in-t1-lucky-draw-sim',
    region: 'in',
    kind: 'sms',
    tier: 1,
    category: 'prize',
    isScam: true,
    sender: '+91 90312 66754',
    body:
      'AIRTEL LUCKY DRAW: Dear user your sim card number has been selected for Rs 15,00,000 prize in Airtel 25th Anniversary offer. To register your claim call manager Vikas Sharma now on 9031266XXX.',
    tells: [
      {
        span: 'your sim card number has been selected',
        why: 'Draws you never entered are the oldest hook in the book. Telecoms do not raffle prizes by SIM number.',
      },
      {
        span: 'call manager Vikas Sharma',
        why: 'A prize department is never one man with a mobile number. The call is where the fee demands start.',
      },
      {
        span: 'Rs 15,00,000 prize',
        why: 'The number is huge on purpose. Big enough and the greed switch turns off the doubt switch.',
      },
    ],
    lossAmount: 120,
  },
  {
    id: 'in-t1-yt-like-earn',
    region: 'in',
    kind: 'dm',
    tier: 1,
    category: 'money-games',
    isScam: true,
    app: 'Telegram',
    sender: '@HR_Priya_Recruitments',
    body:
      'Namaste! Google partner program is hiring. Task: like YouTube videos, earn Rs 150 per like, salary released daily to UPI. First 3 tasks are free demo, then activate premium tasks with refundable Rs 2,000 deposit. 100% money back guarantee.',
    tells: [
      {
        span: 'Rs 150 per like',
        why: 'YouTube pays creators, not likers. The fake wage exists to make the deposit feel like an investment.',
      },
      {
        span: 'refundable Rs 2,000 deposit',
        why: 'The word refundable is doing all the work. Deposits paid to unlock your own salary never come back.',
      },
      {
        span: '100% money back guarantee',
        why: 'Guarantees from strangers on Telegram are worth exactly the paper they are printed on: none.',
      },
    ],
    lossAmount: 400,
  },
  {
    id: 'in-t1-irctc-pnr',
    region: 'in',
    kind: 'sms',
    tier: 1,
    category: 'travel',
    isScam: false,
    sender: 'IRCTCi',
    body:
      'PNR:4528317690, TRN:12951, DOJ:15-08-26, MUMBAI CENTRAL to NEW DELHI, Dep 17:00, Coach B4 Seat 32 CNF. IRCTC wishes you a happy journey.',
    legitNote:
      'Your booking, your train, your seat, and it asks for nothing back. Confirmations state facts. The fakes always want something: a fee, an OTP, a click.',
  },
  {
    id: 'in-t1-swiggy-delivered',
    region: 'in',
    kind: 'sms',
    tier: 1,
    category: 'delivery',
    isScam: false,
    sender: 'SWIGGY',
    body:
      'Your order #163489021 from Biryani Blues has been delivered. Enjoyed the food? Rate your experience in the Swiggy app.',
    legitNote:
      'It closes an order YOU placed and points you back into the official app, not to a payment link. Pointing you to the app you already have is the safe direction of travel.',
  },
  {
    id: 'in-t1-jio-recharge-legit',
    region: 'in',
    kind: 'sms',
    tier: 1,
    category: 'subscription',
    isScam: false,
    sender: 'JioPay',
    body:
      'Recharge successful! Rs 239 plan is now active on Jio number 98XXXXXX21. Validity 28 days, 1.5GB/day. Check balance and offers in the MyJio app.',
    legitNote:
      'A receipt for something you just did, with nothing to click and nothing to verify. A real recharge problem shows up as the recharge not working, not as a message demanding action.',
  },
  {
    id: 'in-t1-sbi-credit-legit',
    region: 'in',
    kind: 'sms',
    tier: 1,
    category: 'banking',
    isScam: false,
    sender: 'SBIUPI',
    body:
      'Dear UPI user A/C X3847 credited by Rs 2,000.00 on 11Aug26 by UPI ref no 622819304517. If not done by you, call 1930. -SBI',
    legitNote:
      'Money coming IN, a reference number, and the official cybercrime helpline 1930. It asks you to act only if something is wrong, and routes you to a number you can verify on your own.',
  },
  {
    id: 'in-t1-school-ptm',
    region: 'in',
    kind: 'sms',
    tier: 1,
    category: 'school',
    isScam: false,
    sender: "Mrs. D'Souza (Class Teacher)",
    body:
      'Reminder: Parent Teacher Meeting this Saturday 9 AM in the school auditorium. Please bring the report card signed. Holiday homework list is on the school app.',
    legitNote:
      'Known sender, expected context, zero pressure, nothing sensitive requested. School messages that suddenly involve money or documents still deserve a cross-check on the official school app or in person.',
  },
  {
    id: 'in-t1-flipkart-otp',
    region: 'in',
    kind: 'sms',
    tier: 1,
    category: 'security',
    isScam: false,
    sender: 'FLPKRT',
    body:
      'Your Flipkart login OTP is 482913. Valid for 10 minutes. NEVER share this OTP with anyone including Flipkart staff. We never call to ask for it.',
    legitNote:
      'An OTP arriving while YOU are logging in is the system working. The message even carries the golden rule: an OTP is for typing into the screen in front of you, never for telling a person.',
  },
  {
    id: 'in-t2-kyc-suspend',
    region: 'in',
    kind: 'sms',
    tier: 2,
    category: 'kyc',
    isScam: true,
    sender: 'PYTKYC',
    body:
      'Dear Paytm user, your KYC has expired and your account will be suspended within 24 hours. Complete verification immediately: paytm-kyc-renew.in or call KYC officer 7852441XXX.',
    tells: [
      {
        span: 'paytm-kyc-renew.in',
        why: 'KYC updates happen inside the official app or at a branch, never on a lookalike domain a stranger texted you.',
      },
      {
        span: 'suspended within 24 hours',
        why: 'Wallets and banks give weeks of notice through app banners. Countdowns exist to make you skip verification of the message itself.',
      },
      {
        span: 'call KYC officer',
        why: 'The KYC officer will ask you to install a screen-share app. From there they watch you type your PIN.',
      },
    ],
    lossAmount: 480,
  },
  {
    id: 'in-t2-electricity-app',
    region: 'in',
    kind: 'sms',
    tier: 2,
    category: 'utility',
    isScam: true,
    sender: '+91 82909 14471',
    body:
      'BSES ALERT: Bill of Rs 4,860 is overdue. Disconnection team assigned for today. To stop disconnection pay instantly and update meter details by downloading BillDesk Support app: bit.ly/bses-support',
    tells: [
      {
        span: 'downloading BillDesk Support app',
        why: 'The support app is a screen-mirroring tool. Once installed, the scammer watches your banking screen live, PIN included.',
      },
      {
        span: 'bit.ly/bses-support',
        why: 'Utility boards do not hide behind link shorteners. Shorteners exist here to disguise the real destination.',
      },
      {
        span: 'Disconnection team assigned for today',
        why: 'Boards issue bills, reminders, and notice periods. A same-day disconnection squad is fiction built for panic.',
      },
    ],
    lossAmount: 750,
  },
  {
    id: 'in-t2-fastag-low',
    region: 'in',
    kind: 'sms',
    tier: 2,
    category: 'toll',
    isScam: true,
    sender: 'FSTAGH',
    body:
      'NHAI FASTag: Your tag has been deactivated due to KYC non-compliance. Vehicle will be charged double toll from tomorrow. Reactivate now: fastag-kyc-update.co',
    tells: [
      {
        span: 'fastag-kyc-update.co',
        why: 'FASTag issues get fixed in your bank or issuer app. The official portal is fastag.ihmcl.com, not a .co lookalike.',
      },
      {
        span: 'double toll from tomorrow',
        why: 'A precise penalty with a same-day clock is pressure engineering. NHAI notifies through your issuer, with time to act.',
      },
      {
        span: 'deactivated due to KYC non-compliance',
        why: 'KYC is the costume every Indian phishing text wears this year. The word alone should slow you down.',
      },
    ],
    lossAmount: 210,
  },
  {
    id: 'in-t2-upi-collect-refund',
    region: 'in',
    kind: 'payment',
    tier: 2,
    category: 'upi',
    isScam: true,
    app: 'PhonePe',
    sender: 'Flipkart Refunds Desk',
    subject: 'Collect request: Rs 4,999',
    body:
      'Refund for cancelled order #FK20817. APPROVE this request and enter your UPI PIN to receive Rs 4,999 instantly in your account.',
    tells: [
      {
        span: 'APPROVE this request and enter your UPI PIN',
        why: 'The iron rule of UPI: your PIN SENDS money, it never receives it. Approving a collect request pays the scammer.',
      },
      {
        span: 'cancelled order #FK20817',
        why: 'You cancelled nothing. The fake order number exists so the refund feels owed to you.',
      },
      {
        span: 'instantly',
        why: 'Real refunds arrive on their own with no buttons. Anything you must approve to receive is a payment in disguise.',
      },
    ],
    lossAmount: 60,
  },
  {
    id: 'in-t2-job-registration-fee',
    region: 'in',
    kind: 'email',
    tier: 2,
    category: 'job',
    isScam: true,
    sender: 'careers@amazon-india-jobs.net',
    subject: 'Shortlisted: Amazon WFH Data Entry (Rs 32,000/month)',
    body:
      'Congratulations! Your resume has been shortlisted from the Naukri database for Amazon work from home position. To confirm your slot, pay one-time refundable registration fee of Rs 1,750 within 24 hours. Interview link will be shared after payment confirmation.',
    tells: [
      {
        span: 'amazon-india-jobs.net',
        why: 'Amazon hires on amazon.jobs. Hyphenated lookalike domains are costume jewellery.',
      },
      {
        span: 'refundable registration fee',
        why: 'Employers pay you. Any job that starts with you paying them has the business model backwards, because you ARE the business model.',
      },
      {
        span: 'Interview link will be shared after payment',
        why: 'Payment before the interview reverses how hiring works anywhere on earth.',
      },
    ],
    lossAmount: 110,
  },
  {
    id: 'in-t2-credit-points-expire',
    region: 'in',
    kind: 'sms',
    tier: 2,
    category: 'banking',
    isScam: true,
    sender: 'HDFCBK-Rewards',
    body:
      'HDFC Bank: Your 9,400 reward points worth Rs 2,350 expire TODAY. Redeem against instant cashback before midnight: hdfc-netbanking-rewards.net',
    tells: [
      {
        span: 'hdfc-netbanking-rewards.net',
        why: 'HDFC lives on hdfcbank.com. This domain exists to collect netbanking logins from people in a hurry.',
      },
      {
        span: 'expire TODAY',
        why: 'Points expire on statement schedules you can check in the app. TODAY in capitals is a stress injection.',
      },
      {
        span: 'Redeem against instant cashback',
        why: 'Points redeem inside netbanking or SmartBuy, never through a link that arrives by SMS.',
      },
    ],
    lossAmount: 320,
  },
  {
    id: 'in-t2-gas-subsidy',
    region: 'in',
    kind: 'call',
    tier: 2,
    category: 'government',
    isScam: true,
    sender: 'Incoming call: "Indane Gas Seva Kendra"',
    body:
      '"Sir, your LPG subsidy of Rs 280 for July failed because your bank account is not linked with Aadhaar properly. I will send one form link on WhatsApp, just fill bank details and the OTP you receive, subsidy will credit today itself."',
    tells: [
      {
        span: 'fill bank details and the OTP',
        why: 'The OTP is the whole heist. No subsidy on earth needs you to hand over a one-time password.',
      },
      {
        span: 'form link on WhatsApp',
        why: 'Government subsidies route through your bank and the official LPG portal, not WhatsApp forms from a caller.',
      },
      {
        span: 'credit today itself',
        why: 'The instant-fix promise exists to grease the ask. Real corrections take boring official time.',
      },
    ],
    lossAmount: 260,
  },
  {
    id: 'in-t2-insta-seller-cod',
    region: 'in',
    kind: 'dm',
    tier: 2,
    category: 'shopping',
    isScam: true,
    app: 'Instagram',
    sender: '@kanjivaram.saree.official_store',
    body:
      "Ma'am the pure silk saree is Rs 2,199 with festival discount. COD is closed today due to courier strike, kindly pay 50% advance Rs 1,100 on GPay 98XXXXXX45 and we will dispatch within 1 hour with tracking id.",
    tells: [
      {
        span: 'COD is closed today due to courier strike',
        why: 'A story engineered to kill the one payment method that protects you. Cash on delivery is the buyer\'s armour.',
      },
      {
        span: 'pay 50% advance',
        why: 'Advance to an Instagram shop with no website, no reviews, and a personal GPay number is a donation.',
      },
      {
        span: 'dispatch within 1 hour',
        why: 'Too-fast promises paper over the fact that there is no saree.',
      },
    ],
    lossAmount: 26,
  },
  {
    id: 'in-t2-telegram-task',
    region: 'in',
    kind: 'dm',
    tier: 2,
    category: 'money-games',
    isScam: true,
    app: 'Telegram',
    sender: '@TaskPay_Manager_Anita',
    body:
      'Well done! You earned Rs 300 for rating 3 hotels on Google Maps. Wallet balance: Rs 300. To withdraw and unlock VIP tasks worth Rs 8,000 daily, deposit Rs 5,000 activation amount. Deposit is returned with your first VIP salary. Members are withdrawing lakhs, screenshots in group.',
    tells: [
      {
        span: 'deposit Rs 5,000 activation amount',
        why: 'The small real payout at the start exists only to make the big deposit feel safe. The deposit is the scam.',
      },
      {
        span: 'screenshots in group',
        why: 'Every screenshot is manufactured and half the group members are the scammer\'s own accounts cheering.',
      },
      {
        span: 'Rs 8,000 daily',
        why: 'If rating hotels paid Rs 8,000 a day, nobody would run hotels. They would rate them.',
      },
    ],
    lossAmount: 600,
  },
  {
    id: 'in-t2-hdfc-statement-legit',
    region: 'in',
    kind: 'email',
    tier: 2,
    category: 'banking',
    isScam: false,
    sender: 'emailstatements.cards@hdfcbank.net',
    subject: 'HDFC Bank Credit Card Statement - August 2026',
    body:
      'Your credit card statement for card ending 4471 is attached, protected with your password. Total due: Rs 8,214. Due date: 28-Aug-2026. Pay via the HDFC Bank app, netbanking, or your registered auto-debit. Never share card details or OTPs on calls.',
    legitNote:
      'It states the amount and the date, then points you to channels you already use. No panic clock, no login link. When unsure, skip the email entirely and open the bank app yourself. The statement will be there.',
  },
  {
    id: 'in-t2-flipkart-refund-legit',
    region: 'in',
    kind: 'sms',
    tier: 2,
    category: 'shopping',
    isScam: false,
    sender: 'FLPKRT',
    body:
      'Refund of Rs 1,299 for your returned order #OD3318204 has been initiated to your original payment method. It will reflect in 3-5 business days. No further action is needed from you.',
    legitNote:
      'The sentence scammers can never afford to send: no further action is needed. Real refunds go back the way the money came, on their own schedule, without OTPs or approve buttons.',
  },
  {
    id: 'in-t2-epfo-passbook-legit',
    region: 'in',
    kind: 'sms',
    tier: 2,
    category: 'government',
    isScam: false,
    sender: 'EPFOHO',
    body:
      'Dear member, contribution of Rs 3,600 for Jul-2026 has been received in your PF account XXXX4218. View your passbook on the UMANG app or epfindia.gov.in.',
    legitNote:
      'Money into your retirement account, a masked account number, and official .gov.in channels to verify. Government messages point to government domains, not shortened links or personal mobile numbers.',
  },
  {
    id: 'in-t2-digilocker-legit',
    region: 'in',
    kind: 'sms',
    tier: 2,
    category: 'school',
    isScam: false,
    sender: 'DGLOCK',
    body:
      'Your CBSE Class XII marksheet has been issued to your DigiLocker account. Sign in on the DigiLocker app with your Aadhaar-linked mobile number to view and share it.',
    legitNote:
      'Expected document, official app, and the message never asks for an OTP or PIN. The sign-in happens inside an app you install from the store yourself, not through a link in the SMS.',
  },
  {
    id: 'in-t2-bescom-bill-legit',
    region: 'in',
    kind: 'sms',
    tier: 2,
    category: 'utility',
    isScam: false,
    sender: 'BESCOM',
    body:
      'BESCOM: Bill for Jul-2026, A/C 214870233: Rs 1,240. Due date 22-Aug-2026. Pay on bescom.org, BBPS, or the bill section of any UPI app. Late fee applies after due date.',
    legitNote:
      'Put this next to the disconnection threat: an account number, a due date days away, official payment routes, and no officer with a personal mobile. Boring is the signature of real.',
  },
  {
    id: 'in-t2-upi-received-legit',
    region: 'in',
    kind: 'payment',
    tier: 2,
    category: 'upi',
    isScam: false,
    app: 'GPay',
    sender: 'Rohit Nair',
    subject: 'Rs 500 received',
    body:
      'You received Rs 500 from Rohit Nair (rohitn@okhdfcbank). Note: "goa trip settle". Money has been added to your bank account ending 3847.',
    legitNote:
      'Incoming money is complete on arrival. No PIN, no approval, no verification step. Anyone who says you must do something more to RECEIVE money is describing how you will SEND it.',
  },
  {
    id: 'in-t3-digital-arrest',
    region: 'in',
    kind: 'call',
    tier: 3,
    category: 'digital-arrest',
    isScam: true,
    sender: 'Incoming call: "Mumbai Police Cyber Cell"',
    body:
      'Officer on video call: "A parcel sent on your Aadhaar to Taiwan contains MDMA and fake passports. FIR CBI/2214/26 stands registered. You are under digital arrest. Do not disconnect. Do not inform family or your bank, this is a sealed national security matter. To prove innocence, transfer your balance to the RBI safe account for audit. Funds return in 48 hours with a clearance certificate."',
    tells: [
      {
        span: 'You are under digital arrest',
        why: 'Digital arrest does not exist in Indian law. Police do not arrest, interrogate, or monitor anyone over video calls.',
      },
      {
        span: 'Do not inform family or your bank',
        why: 'Isolation is the strongest tell in fraud. The one call they forbid is the exact call that would end the scam.',
      },
      {
        span: 'RBI safe account',
        why: 'RBI holds no accounts for citizens. A safe account is where money goes to disappear.',
      },
    ],
    lossAmount: 4800,
  },
  {
    id: 'in-t3-trai-suspend',
    region: 'in',
    kind: 'call',
    tier: 3,
    category: 'government',
    isScam: true,
    sender: 'Incoming call: "TRAI Head Office"',
    body:
      'Recorded voice: "This is Telecom Regulatory Authority of India. Your mobile number will be disconnected within 2 hours as it is linked to illegal advertisement and harassment cases. Press 9 to connect with our verification officer to keep your number active."',
    tells: [
      {
        span: 'Press 9 to connect',
        why: 'TRAI regulates telecom companies. It does not call subscribers, and its verification officer is a scam call centre desk.',
      },
      {
        span: 'within 2 hours',
        why: 'Regulators move on paper with notice periods measured in weeks. Countdowns are for scripts.',
      },
      {
        span: 'illegal advertisement and harassment cases',
        why: 'A scary accusation you suddenly have to disprove is a manufactured emergency, not a procedure.',
      },
    ],
    lossAmount: 1400,
  },
  {
    id: 'in-t3-itr-refund',
    region: 'in',
    kind: 'email',
    tier: 3,
    category: 'government',
    isScam: true,
    sender: 'refunds@incometax-efiling-gov.in.co',
    subject: 'Income Tax Refund of Rs 36,490 approved - verify bank account',
    body:
      'Dear Taxpayer, your ITR for AY 2026-27 has been processed and a refund of Rs 36,490 is approved. However your bank account failed verification. Confirm your account number and IFSC within 48 hours to receive the refund: incometax-refund-portal.co.in/verify',
    tells: [
      {
        span: 'incometax-efiling-gov.in.co',
        why: 'Read domains from the END. The real one stops at gov.in. The extra .co makes it an entirely different website owned by a stranger.',
      },
      {
        span: 'bank account failed verification',
        why: 'The department pays into the account you pre-validated on the portal. It never re-collects bank details over email.',
      },
      {
        span: 'within 48 hours',
        why: 'Your refund does not evaporate on a timer. Deadlines on money you are owed are pressure, not policy.',
      },
    ],
    lossAmount: 900,
  },
  {
    id: 'in-t3-demat-kyc',
    region: 'in',
    kind: 'email',
    tier: 3,
    category: 'investment',
    isScam: true,
    sender: 'compliance@nsdl-investor-services.org',
    subject: 'URGENT: Demat account will be frozen - Re-KYC pending',
    body:
      'As per SEBI circular 2026/114, your demat account is non-compliant and will be frozen tomorrow, blocking access to all holdings. Complete Re-KYC immediately to retain access. Login with your broker credentials to proceed: nsdl-rekyc-verify.org',
    tells: [
      {
        span: 'Login with your broker credentials',
        why: 'No depository ever asks for your broker password. That combination is how portfolios get sold off by strangers.',
      },
      {
        span: 'nsdl-investor-services.org',
        why: 'NSDL is nsdl.co.in. The .org copy is a costume, and the SEBI circular number is set dressing.',
      },
      {
        span: 'frozen tomorrow',
        why: 'Real Re-KYC arrives with months of notice from your own broker, not a one-day ultimatum from an unknown domain.',
      },
    ],
    lossAmount: 2600,
  },
  {
    id: 'in-t3-mom-new-number',
    region: 'in',
    kind: 'sms',
    tier: 3,
    category: 'social',
    isScam: true,
    sender: '+91 74110 92834',
    body:
      'Mumma this is my new number, old phone screen is damaged so using this temporarily. Save this number. Also I need Rs 18,000 urgently today for semester exam fees, portal closes at 5 PM. GPay on this same number please, I will explain everything at home.',
    tells: [
      {
        span: 'this is my new number',
        why: 'The new-number story exists so you cannot call back on the number you trust. Call the old number anyway. The phone that "broke" usually answers.',
      },
      {
        span: 'portal closes at 5 PM',
        why: 'A deadline hours away forces the transfer before dinner-table verification can happen.',
      },
      {
        span: 'GPay on this same number',
        why: 'Fee portals take cards and netbanking. Money sent person-to-person on an unverified number is gone.',
      },
    ],
    lossAmount: 215,
  },
  {
    id: 'in-t3-sim-upgrade',
    region: 'in',
    kind: 'call',
    tier: 3,
    category: 'security',
    isScam: true,
    sender: 'Incoming call: "Airtel Network Desk"',
    body:
      '"Sir, we are upgrading your area to 5G standalone network tonight. Your current SIM will stop working. I am sending a 20-digit eSIM activation code by SMS. Just read it back to me and your number upgrades without any store visit."',
    tells: [
      {
        span: 'read it back to me',
        why: 'That code moves your number onto the caller\'s SIM. Every OTP and bank alert you receive then goes to them.',
      },
      {
        span: 'Your current SIM will stop working',
        why: 'A manufactured deadline. Network upgrades never require phone calls to individual customers.',
      },
      {
        span: 'without any store visit',
        why: 'SIM changes are deliberately designed to need the store or the official app. Skipping that friction is the entire point of the scam.',
      },
    ],
    lossAmount: 3200,
  },
  {
    id: 'in-t3-rbi-video-kyc',
    region: 'in',
    kind: 'call',
    tier: 3,
    category: 'banking',
    isScam: true,
    sender: 'Incoming call: "RBI Compliance Division"',
    body:
      '"Your savings account has been flagged under a money laundering review. As per RBI guideline we will complete video KYC right now to avoid freezing. Keep your debit card and PAN ready, and share the OTP you receive during verification to confirm your identity."',
    tells: [
      {
        span: 'share the OTP you receive',
        why: 'That OTP authorises a transfer, not an identity check. Reading it out is signing the cheque.',
      },
      {
        span: 'RBI Compliance Division',
        why: 'RBI regulates banks. It never calls account holders. Its name gets borrowed because it outranks your bank in your head.',
      },
      {
        span: 'right now to avoid freezing',
        why: 'Compliance reviews generate letters and branch visits, not surprise video calls with countdown clocks.',
      },
    ],
    lossAmount: 1900,
  },
  {
    id: 'in-t3-relative-voice',
    region: 'in',
    kind: 'call',
    tier: 3,
    category: 'ai-voice',
    isScam: true,
    sender: 'Voicemail from +91 98220 41077',
    body:
      'Voicemail: "Bhaiya, Aditya here. There was an accident near the highway, my friend is in hospital and police are also involved. I am okay but they need Rs 40,000 deposit right now or treatment will not start. Send to the ward boy\'s UPI 88XXXXXX12@paytm, my phone is with police. Do not tell Mummy, she will panic."',
    tells: [
      {
        span: "the ward boy's UPI",
        why: 'Hospitals bill at counters with receipts. Nobody\'s treatment ever depended on a stranger\'s personal UPI handle.',
      },
      {
        span: 'my phone is with police',
        why: 'The story explaining the unknown number is the scam\'s load-bearing wall. Call his real number. AI voice clones need only seconds of audio.',
      },
      {
        span: 'Do not tell Mummy',
        why: 'Isolation again. The one person they forbid you from calling is the one who would ask the question that breaks the spell.',
      },
    ],
    lossAmount: 480,
  },
  {
    id: 'in-t3-qr-receive-money',
    region: 'in',
    kind: 'dm',
    tier: 3,
    category: 'marketplace',
    isScam: true,
    app: 'OLX',
    sender: 'Amit Verma (buyer)',
    body:
      'Bike is final at Rs 62,000. I am army officer so cannot come personally, my unit driver will pick up. I am sending Rs 5,000 advance token. Check WhatsApp, I sent a QR code. Just scan it and enter your UPI PIN, the amount will credit to your account immediately.',
    tells: [
      {
        span: 'scan it and enter your UPI PIN',
        why: 'Scanning a QR and entering a PIN is how you PAY. Receiving money requires neither. The sentence is a lie about which way money flows.',
      },
      {
        span: 'army officer so cannot come personally',
        why: 'Rank as trust-armour plus a permanent reason you will never meet. The fake fauji buys as well as he sells.',
      },
      {
        span: 'credit to your account immediately',
        why: 'A buyer this eager to pay a stranger in advance does not exist in nature.',
      },
    ],
    lossAmount: 340,
  },
  {
    id: 'in-t3-itr-intimation-legit',
    region: 'in',
    kind: 'email',
    tier: 3,
    category: 'government',
    isScam: false,
    sender: 'intimations@cpc.incometax.gov.in',
    subject: 'Intimation u/s 143(1) for PAN AXXXX1234X, AY 2026-27',
    body:
      'Your income tax return has been processed. The intimation under section 143(1) is attached, password protected with your PAN and date of birth. Refund, if any, will be credited to your pre-validated bank account. Log in to the e-filing portal directly for details. Do not share credentials with anyone.',
    legitNote:
      'The domain ends at incometax.gov.in with nothing bolted on after it, the refund goes to the account already validated on the portal, and it tells you to log in yourself. No link begging for bank details, no 48-hour clock.',
  },
  {
    id: 'in-t3-sbi-freeze-legit',
    region: 'in',
    kind: 'sms',
    tier: 3,
    category: 'banking',
    isScam: false,
    sender: 'SBICRD',
    body:
      'SBI Card: Transaction of Rs 14,999 at Croma Online was declined and your card has been temporarily locked due to suspicious activity. If this was you, unlock it in the SBI Card app. For help, call the number printed on the back of your card.',
    legitNote:
      'The bank routes you to the app you already have and the number printed on your own card. A scammer cannot fake that structure, because a scammer needs YOU to come to THEM.',
  },
  {
    id: 'in-t3-upi-mandate-legit',
    region: 'in',
    kind: 'payment',
    tier: 3,
    category: 'subscription',
    isScam: false,
    app: 'GPay',
    sender: 'Spotify India',
    subject: 'AutoPay executed: Rs 199',
    body:
      'Your UPI AutoPay mandate for Spotify Premium was executed: Rs 199 debited from bank account ending 3847 on 11-Aug-2026. Next debit: 11-Sep-2026. Manage or pause this mandate anytime in your UPI app settings.',
    legitNote:
      'A subscription YOU set up, debiting on schedule, with controls inside your own UPI app. An unrecognised mandate deserves investigation, but the fix still happens inside your app, never through a caller or a link.',
  },
  {
    id: 'in-t3-aadhaar-otp-legit',
    region: 'in',
    kind: 'sms',
    tier: 3,
    category: 'security',
    isScam: false,
    sender: 'UIDAI',
    body:
      'Your Aadhaar OTP for e-KYC authentication initiated at SBI BRANCH KORAMANGALA is 664208. Valid for 10 minutes. UIDAI never calls to ask for this OTP.',
    legitNote:
      'You are standing at the branch, the teller initiated e-KYC, and the OTP arrives on cue. Context is everything: the same OTP arriving when you initiated NOTHING is an alarm bell, and even this message reminds you that no caller should ever ask for it.',
  },
  {
    id: 'in-t3-customs-duty-legit',
    region: 'in',
    kind: 'email',
    tier: 3,
    category: 'delivery',
    isScam: false,
    sender: 'noreply@dhl.com',
    subject: 'Import duty payment required: Waybill 4471820993',
    body:
      'Your shipment from London (Waybill 4471820993, ordered from asos.com) requires customs duty of Rs 2,180 as assessed by Indian Customs. Pay on the official DHL India portal dhl.co.in using your waybill number, or at the time of delivery. The detailed duty breakup is attached.',
    legitNote:
      'You actually ordered this, the waybill matches your own tracking, the sender is the real dhl.com, and payment happens on the official portal or at your door. Duty on international orders is normal. Duty demanded on a phone call with arrest threats is not.',
  },
  {
    id: 'in-t3-cybercrime-ack-legit',
    region: 'in',
    kind: 'sms',
    tier: 3,
    category: 'government',
    isScam: false,
    sender: '1930',
    body:
      'National Cyber Crime Reporting Portal: Your complaint (Ack No. 31608260041275) has been registered. The reported amount of Rs 15,000 has been flagged to the receiving bank for lien marking. Track status on cybercrime.gov.in. Do not pay anyone claiming to recover your money.',
    legitNote:
      'The real 1930 pipeline: an acknowledgement number, the official .gov.in portal, and a built-in warning about recovery scammers. Notice what it never does: ask for money, OTPs, or verification of any kind.',
  },
];

// ---------------- BOSS POOL - the final case ----------------
// One boss card closes every run as card 13, worth double points. These are
// "tricky twins": the same brands and situations players just practiced on,
// but the scam versions are near-perfect and the legit versions look shady.
// Never mixed into the normal pool.

export const BOSS_CARDS: GameCard[] = [
  {
    id: 'boss-chase-alias',
    region: 'us',
    kind: 'email',
    tier: 3,
    boss: true,
    category: 'banking',
    isScam: true,
    sender: 'alerts@chase.com.card-services-verify.net',
    subject: 'Chase Fraud Alert: Did you attempt $847.62 at BestBuy.com?',
    body:
      'We declined a suspicious charge on your Visa ending 4416. If this was not you, verify your identity within 24 hours to keep your card active: chase.com.card-services-verify.net/fraud. Message and data rates may apply.',
    tells: [
      {
        span: 'chase.com.card-services-verify.net',
        why: 'Read domains right to left. The real site here is card-services-verify.net; the chase.com up front is just a subdomain costume.',
      },
      {
        span: 'within 24 hours to keep your card active',
        why: 'When fraud is real, banks freeze the card themselves. They never make YOU race a deadline to keep it alive.',
      },
    ],
    lossAmount: 1400,
  },
  {
    id: 'boss-chase-real',
    region: 'us',
    kind: 'email',
    tier: 3,
    boss: true,
    category: 'banking',
    isScam: false,
    sender: 'no-reply@alertsp.chase.com',
    subject: 'Your Chase statement is ready',
    body:
      'Your statement for Chase Total Checking (...6304) is now available. To view it, sign in to chase.com or the Chase Mobile app. We will never ask for your password or one-time codes by email.',
    legitNote:
      'alertsp.chase.com ENDS in chase.com, so Chase really owns it. No link demanding a login, no deadline, no request for codes, and it tells you to sign in on your own. Statement notices that leave the next move to you are how real banks talk.',
  },
  {
    id: 'boss-usps-hold',
    region: 'us',
    kind: 'sms',
    tier: 3,
    boss: true,
    category: 'delivery',
    isScam: true,
    sender: '+1 (762) 405-3318',
    body:
      'USPS: Your parcel US9214823571 arrived at the regional facility but the street number is unreadable. Update your address within 12 hours to avoid return to sender: usps-address-desk.com. No fee is required.',
    tells: [
      {
        span: 'usps-address-desk.com',
        why: 'USPS links live on usps.com, nowhere else. A calm, polite tone does not clean a dirty domain.',
      },
      {
        span: 'No fee is required.',
        why: 'Saying it out loud is the tell. The site asks for a card number "to confirm your identity" the moment you arrive.',
      },
      {
        span: '+1 (762) 405-3318',
        why: 'Real USPS texts come from the short code 28777, not a regular 10-digit number.',
      },
    ],
    lossAmount: 500,
  },
  {
    id: 'boss-usps-real',
    region: 'us',
    kind: 'sms',
    tier: 3,
    boss: true,
    category: 'delivery',
    isScam: false,
    sender: '28777',
    body:
      'USPS 28777: Your package with tracking 9400 1108 8992 3016 4571 22 is out for delivery today by 8:00 PM. Track at usps.com. Reply STOP to cancel.',
    legitNote:
      'Short code 28777 spells 2USPS and is the real USPS sender. The link is plain usps.com and nothing is asked of you, no fee, no address form, no rush. You signed up for these when you enabled Informed Delivery. Still unsure? Type usps.com yourself and paste the tracking number.',
  },
  {
    id: 'boss-fafsa-fake',
    region: 'us',
    kind: 'email',
    tier: 3,
    boss: true,
    category: 'school',
    isScam: true,
    sender: 'processing@studentaid-fafsa-review.org',
    subject: 'Action needed: your FAFSA award is on hold',
    body:
      'Congratulations, your federal aid package of $6,895 has been approved. Before funds release, federal law requires identity confirmation. Submit your Social Security number and a photo of your student ID through our secure portal: studentaid-fafsa-review.org/verify. Processing closes Friday.',
    tells: [
      {
        span: 'studentaid-fafsa-review.org',
        why: 'Federal student aid lives at studentaid.gov. A .org mashup of official-sounding words is a costume.',
      },
      {
        span: 'Submit your Social Security number',
        why: 'The government already has your SSN from the FAFSA you filed. Anyone asking for it again by email is building an identity theft kit.',
      },
    ],
    lossAmount: 2900,
  },
  {
    id: 'boss-fafsa-real',
    region: 'us',
    kind: 'email',
    tier: 3,
    boss: true,
    category: 'school',
    isScam: false,
    sender: 'FederalStudentAid@notifications.studentaid.gov',
    subject: 'Reminder: complete your FAFSA form',
    body:
      'Our records show you started but have not submitted your FAFSA form. Sign in at studentaid.gov with your own account to finish. Need help? Call 1-800-433-3243. We never request your SSN or password by email.',
    legitNote:
      'The sender ends in studentaid.gov, the only link is the official site, and it tells you to sign in with your own account instead of tapping a special link. That helpline, 1-800-433-3243, is the real Federal Student Aid number, and you can verify it yourself at studentaid.gov.',
  },
  {
    id: 'boss-zelle-upgrade',
    region: 'us',
    kind: 'payment',
    tier: 3,
    boss: true,
    category: 'marketplace',
    isScam: true,
    sender: 'service@zelle-transfers-secure.com',
    app: 'Zelle',
    subject: 'Payment of $450.00 received - action required',
    body:
      'Marcus T. sent you $450.00 for "PS5 console". Because the buyer used a Zelle Business account, your account must be upgraded before funds release. The buyer has added $50.00 for the upgrade fee. Send $50.00 back to complete verification and receive $500.00 total.',
    tells: [
      {
        span: 'zelle-transfers-secure.com',
        why: 'Zelle has no inbox of its own. Real Zelle notifications come through YOUR bank, not a standalone "secure" domain.',
      },
      {
        span: 'Send $50.00 back',
        why: 'The payment is fake; this email is the whole scam. Real money never needs seed money to be released.',
      },
      {
        span: 'Zelle Business account',
        why: 'There is no such upgrade. The invented rule exists purely to explain why you must pay first.',
      },
    ],
    lossAmount: 500,
  },
  {
    id: 'boss-mom-voicemail',
    region: 'us',
    kind: 'call',
    tier: 3,
    boss: true,
    category: 'ai-voice',
    isScam: true,
    sender: '+1 (415) 887-2203',
    body:
      'Voicemail transcript: "Sweetheart, it\'s Mom. My phone died so I\'m on a friend\'s phone. I\'m okay but there was a fender bender and my card is locked. I need you to Venmo $180 to @jules-garcia-help for the tow before they impound the car. Please don\'t call Dad, he\'ll panic. I\'ll pay you back tonight, promise."',
    tells: [
      {
        span: "on a friend's phone",
        why: 'AI can clone a voice from a few seconds of audio. The borrowed-phone story exists to explain the strange number. Hang up and call the number you already have saved.',
      },
      {
        span: 'Venmo $180 to @jules-garcia-help',
        why: 'Family emergencies never route through a stranger\'s payment handle.',
      },
      {
        span: "don't call Dad",
        why: 'Isolation is the play. Scammers block the one phone call that would break the spell.',
      },
    ],
    lossAmount: 180,
  },

  // ---------- global bosses (every region, and the daily gauntlet) ----------

  {
    id: 'boss-insta-bluebadge',
    kind: 'email',
    tier: 3,
    boss: true,
    category: 'social',
    isScam: true,
    sender: 'verify@meta-badge-support.net',
    subject: 'Your account qualifies for the Verified blue badge',
    body:
      'Hi, after a manual review your profile qualifies for the blue Verified badge. This offer is valid for 24 hours. Confirm ownership by submitting your login credentials and a payment method on the verification portal: meta-badge-support.net/confirm. Failure to complete removes eligibility permanently.',
    tells: [
      {
        span: 'submitting your login credentials',
        why: 'Meta never asks for your password on an outside portal. Verification lives inside the app settings, nowhere else.',
      },
      {
        span: 'meta-badge-support.net',
        why: 'Real mail comes from facebookmail.com or instagram.com. A .net fan-site domain cannot verify anyone.',
      },
      {
        span: 'removes eligibility permanently',
        why: 'Flattery plus a slamming door is the influencer-phish signature. Real programs do not expire in a day.',
      },
    ],
    lossAmount: 260,
  },
  {
    id: 'boss-insta-login-real',
    kind: 'email',
    tier: 3,
    boss: true,
    category: 'social',
    isScam: false,
    sender: 'security@mail.instagram.com',
    subject: 'New login to your account from Chrome on Windows',
    body:
      'We noticed a new login to your account from Chrome on Windows. If this was you, you can ignore this email. If it was not you, secure your account from the app: Settings > Accounts Centre > Password and security. We will never ask for your password by email.',
    legitNote:
      'Real security mail: the official instagram.com domain, an if-this-was-you-ignore option, and directions into your own app settings instead of a link demanding a login. The absence of urgency IS the signal.',
  },
  {
    id: 'boss-netflix-hold',
    kind: 'email',
    tier: 3,
    boss: true,
    category: 'subscription',
    isScam: true,
    sender: 'billing@netflix-account-services.com',
    subject: 'Your membership is on hold',
    body:
      'Hi, we could not authorize your payment for this billing cycle, so your membership is on hold. To keep watching, update your payment details within 24 hours at netflix-account-services.com/billing. If we cannot verify your card, your profiles and viewing history will be permanently deleted.',
    tells: [
      {
        span: 'netflix-account-services.com',
        why: 'Netflix writes from netflix.com. The extra words bolted into the domain are exactly where the fraud lives.',
      },
      {
        span: 'permanently deleted',
        why: 'Streaming services pause accounts and win you back later. Threatening to burn your data is loss-framing bait.',
      },
      {
        span: 'within 24 hours',
        why: 'A billing hiccup has no bomb timer. Open the app yourself; if billing were real trouble, it would say so there.',
      },
    ],
    lossAmount: 190,
  },
  {
    id: 'boss-netflix-price-real',
    region: 'us',
    kind: 'email',
    tier: 3,
    boss: true,
    category: 'subscription',
    isScam: false,
    sender: 'info@account.netflix.com',
    subject: 'We are updating our prices',
    body:
      'Your plan price is changing from your next billing cycle: Standard will be $16.49 per month. No action is needed, the update applies automatically. If you would like to review or change your plan, visit your Account page anytime by signing in at netflix.com.',
    legitNote:
      'Corporate email at its most boring: a fact, no deadline, no begging link, and sign in at the site you already know. Unhurried and optional is what legitimate looks like.',
  },

  // ---------- India bosses ----------

  {
    id: 'boss-phonepe-cashback',
    region: 'in',
    kind: 'payment',
    tier: 3,
    boss: true,
    category: 'upi',
    isScam: true,
    app: 'PhonePe',
    sender: 'PhonePe Rewards',
    subject: 'Collect request: Rs 1,999',
    body:
      'Scratch card won! Cashback of Rs 1,999 is reserved for your account. This reward request expires in 30 minutes. Approve the request and enter your UPI PIN to claim your cashback instantly.',
    tells: [
      {
        span: 'Approve the request and enter your UPI PIN',
        why: 'The eternal UPI rule: a PIN sends money, it never receives it. Real cashback lands by itself with zero buttons.',
      },
      {
        span: 'expires in 30 minutes',
        why: 'Rewards do not evaporate on a stopwatch. The timer exists so you act before you think.',
      },
      {
        span: 'Scratch card won!',
        why: 'A scratch card you never scratched. Prizes that find you are hooks, not luck.',
      },
    ],
    lossAmount: 120,
  },
  {
    id: 'boss-phonepe-real',
    region: 'in',
    kind: 'payment',
    tier: 3,
    boss: true,
    category: 'upi',
    isScam: false,
    app: 'PhonePe',
    sender: 'PhonePe',
    subject: 'Cashback received: Rs 75',
    body:
      'Congratulations! Rs 75 cashback from your electricity bill payment scratch card has been credited. It will reflect in your PhonePe wallet within 24 hours. No action is needed from you.',
    legitNote:
      'The twin of the scam, separated by one sentence: no action is needed. Real rewards complete themselves. The moment a reward needs your approval or your PIN, it has stopped being a reward.',
  },
  {
    id: 'boss-courier-fir',
    region: 'in',
    kind: 'call',
    tier: 3,
    boss: true,
    category: 'digital-arrest',
    isScam: true,
    sender: 'Incoming call: "Delhi Customs / CBI Joint Desk"',
    body:
      '"We have verified your Aadhaar against FIR no CBI/DL/3321. Officer Meena will stay on video call while you cooperate. This is a national security case, telling your family or bank counts as evidence tampering. Transfer Rs 3,90,000, your full balance, to the Supreme Court monitored safe account. You will receive an RBI clearance certificate and full refund after the 24 hour audit."',
    tells: [
      {
        span: 'stay on video call while you cooperate',
        why: 'No Indian agency arrests or interrogates by video call. The camera exists to keep you scared, watched, and alone.',
      },
      {
        span: 'counts as evidence tampering',
        why: 'Any script that criminalises asking for help is a script. Real police have no problem with you calling a lawyer or your bank.',
      },
      {
        span: 'Supreme Court monitored safe account',
        why: 'Courts and RBI operate no safe accounts. The phrase is invented so that theft sounds like procedure.',
      },
    ],
    lossAmount: 4700,
  },
  {
    id: 'boss-echallan-real',
    region: 'in',
    kind: 'sms',
    tier: 3,
    boss: true,
    category: 'government',
    isScam: false,
    sender: 'VAHAN',
    body:
      'e-Challan DL04202608114471 issued for vehicle DL8CAF5031: Red light violation on 09-08-2026, fine Rs 500. Pay within 60 days on echallan.parivahan.gov.in or contest in virtual court. Photo evidence is available on the portal.',
    legitNote:
      'A real fine: challan number, your actual vehicle, 60 days not 60 minutes, payment only on the parivahan .gov.in portal, and the right to contest. The scam version of this exact message swaps just one thing: the link.',
  },
];

/** Fraud IQ ratings by accuracy - used on the results screen */
export const RADAR_LEVELS = [
  {
    min: 0,
    name: 'Absolutely Cooked',
    line: 'scammers pass your number around like a coupon 💀',
  },
  {
    min: 0.4,
    name: 'Still Mid',
    line: 'you catch the loud ones, the quiet ones still eat you up',
  },
  {
    min: 0.65,
    name: 'Lowkey Ate',
    line: 'you read the sender before the story, no cap',
  },
  {
    min: 0.85,
    name: 'No Crumbs',
    line: 'banks should be paying you for this fr 🔥',
  },
] as const;

/**
 * Every bundled card photo, for warm-up preloading at app mount. Kept here so
 * a new image field automatically joins the preload list.
 */
export const CARD_IMAGE_URLS: string[] = Array.from(
  new Set([...CARDS, ...BOSS_CARDS].map((c) => c.image).filter((s): s is string => Boolean(s))),
);
