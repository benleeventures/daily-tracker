import type { Exercise, Phase } from './types';

// Voice: direct, stripped, earned. Ben's own stories and numbers only (public ones).
// Concepts adapted from third-party programs (Ikigai, vision board, monthly board meeting) are
// rewritten from scratch here. Don't paste source-deck wording back in.

export const WELCOME = {
  title: 'This is where we do the work.',
  body: [
    'Most of my clients have been agency owners and consultants. Lately it’s wellness founders, people mid-transition, and anyone who knows something needs to change but can’t name it yet. The work is the same: get honest about where you are, get clear on where you’re going, and build a life and business that doesn’t burn you out getting there.',
    'Go in order, or start wherever I point you. Everything saves as you type. Nothing here is graded. The more honest you are, the more useful our calls get.',
  ],
};

export const PHASES: Phase[] = [
  {
    id: 'ground',
    number: 1,
    title: 'Ground',
    question: 'Where are you, really?',
    summary: 'An honest read on your energy, your life, and how you operate.',
  },
  {
    id: 'vision',
    number: 2,
    title: 'Vision',
    question: 'Where are you going?',
    summary: 'Purpose, a 3-year picture, and the values that decide the hard calls.',
  },
  {
    id: 'offer',
    number: 3,
    title: 'Offer',
    question: 'Who do you serve, and what do you sell them?',
    summary: 'Your superpower, the person you help, and a first offer they can say yes to.',
  },
  {
    id: 'build',
    number: 4,
    title: 'Build',
    question: 'How does it run without running you?',
    summary: 'A 90-day plan, your operating manual, and a monthly rhythm to stay on course.',
  },
];

export const EXERCISES: Exercise[] = [
  // ─── 01 Ground ────────────────────────────────────────────────────────────
  {
    slug: 'energy-audit',
    title: 'Energy Audit',
    phase: 'ground',
    minutes: 45,
    summary: 'Find what fuels you, what drains you, and what you’re tolerating.',
    intro: [
      'I’ve done this every quarter since 2021, and I have every client do it first. Time management is the wrong frame. You can have an empty calendar and still be exhausted. Energy is the real currency.',
      'When I ran mine, meditation and surfing were at the top of the list. Managing people directly, vendor calls, and back-to-back meetings were at the bottom, and that’s where most of my week was going.',
      'Look at your last two weeks of calendar before you start. Be specific. “Meetings” is not an answer. “Weekly vendor check-in with the contractor” is.',
    ],
    sections: [
      {
        title: 'What gives you energy',
        intro: 'Work or life. The things you’d do for free, the moments you lose track of time.',
        fields: [
          { kind: 'list', id: 'energizers', label: 'Energizers', count: 6, placeholder: 'e.g. Leading the Thursday breathwork session' },
        ],
      },
      {
        title: 'What drains you',
        intro: 'The things you dread, put off, or need a nap after. Add roughly how many hours a week each one takes.',
        fields: [
          { kind: 'list', id: 'drains', label: 'Drains', count: 6, placeholder: 'e.g. Chasing invoices — 3 hrs/wk' },
        ],
      },
      {
        title: 'What you’re tolerating',
        intro: 'Everything you’ve quietly accepted. The broken process, the relationship you avoid, the belief that you don’t deserve it yet. Tolerations leak energy all day.',
        fields: [
          { kind: 'list', id: 'tolerating', label: 'Tolerating', count: 5 },
        ],
      },
      {
        title: 'Decide',
        intro: 'Every drain gets one of four calls. No drain stays on the list without a decision.',
        fields: [
          { kind: 'long', id: 'drop', label: 'Drop it', hint: 'What stops entirely? What happens if nobody does it?', rows: 3 },
          { kind: 'long', id: 'delegate', label: 'Delegate or automate it', hint: 'Who or what takes it, and by when?', rows: 3 },
          { kind: 'long', id: 'differently', label: 'Do it differently', hint: 'Same task, less drain. Batch it, shorten it, change where or when you do it.', rows: 3 },
          { kind: 'long', id: 'accept', label: 'Accept it', hint: 'Some things just come with the job. Name them so they stop surprising you.', rows: 2 },
        ],
      },
      {
        title: 'Start',
        fields: [
          { kind: 'list', id: 'start', label: 'With the time and energy you free up, what do you start doing?', count: 3 },
        ],
      },
    ],
    closing: 'Run this again in 90 days. The list will be different, and that’s the point.',
  },
  {
    slug: 'life-reflection',
    title: 'Where You Are Now',
    phase: 'ground',
    minutes: 60,
    summary: 'Score every area of your life, then write the honest version.',
    visual: 'wheel',
    intro: [
      'You can’t plan a route without knowing where you’re standing. Most people skip this part because it’s uncomfortable. That’s exactly why it matters.',
      'When I burned out, I had a business doing well on paper and a body that was falling apart. I’d have scored my work an 8 and my health a 2. I only saw it when I wrote it down.',
      'Score fast, write slow. Your first number is usually the true one.',
    ],
    sections: [
      {
        title: 'Score it',
        intro: '1 is “this is on fire,” 10 is “I wouldn’t change a thing.”',
        fields: [
          { kind: 'scale', id: 'health', label: 'Health & body', low: 'Struggling', high: 'Thriving' },
          { kind: 'scale', id: 'energy', label: 'Energy & nervous system', low: 'Depleted', high: 'Charged' },
          { kind: 'scale', id: 'relationships', label: 'Love & relationships', low: 'Disconnected', high: 'Deeply connected' },
          { kind: 'scale', id: 'community', label: 'Friends & community', low: 'Isolated', high: 'Held' },
          { kind: 'scale', id: 'work', label: 'Work & business', low: 'Stuck', high: 'In flow' },
          { kind: 'scale', id: 'money', label: 'Money', low: 'Scarcity', high: 'Abundance' },
          { kind: 'scale', id: 'purpose', label: 'Purpose & meaning', low: 'Lost', high: 'Clear' },
          { kind: 'scale', id: 'play', label: 'Play & adventure', low: 'None', high: 'Plenty' },
        ],
      },
      {
        title: 'Write it',
        fields: [
          { kind: 'long', id: 'working', label: 'What’s already working?', hint: 'Start here. Celebrate it. You built more than you give yourself credit for.', rows: 5 },
          { kind: 'long', id: 'heavy', label: 'What feels heavy?', hint: 'Where does your chest tighten when you think about it?', rows: 5 },
          { kind: 'long', id: 'patterns', label: 'What patterns are you ready to let go of?', hint: 'The loops you keep running. Habits, relationships, stories you tell yourself.', rows: 5 },
          { kind: 'long', id: 'transition', label: 'What’s ending, and what’s trying to begin?', hint: 'If you’re in a transition, name both sides of it.', rows: 5 },
        ],
      },
    ],
  },
  {
    slug: 'visionary-or-integrator',
    title: 'Visionary or Integrator?',
    phase: 'ground',
    minutes: 20,
    summary: 'Know how you’re wired before you hire, partner, or build.',
    intro: [
      'I’m a 100% visionary. Great at ideas, bad at consistency. For years I kept hiring other visionaries, and we’d generate brilliant plans that never shipped. I also trusted the wrong operator with the numbers and paid for it.',
      'Every founder needs to know which one they are on day one. Visionaries need integrators. Integrators need someone to point the ship. Neither is better. Pretending to be both is how you burn out.',
      'Answer from how you actually behave, not how you wish you did. If you want the deeper version, take the Rocket Fuel assessment and paste your scores at the bottom.',
    ],
    sections: [
      {
        title: 'Gut check',
        intro: '1 means “not me at all,” 10 means “that’s exactly me.”',
        fields: [
          { kind: 'scale', id: 'ideas', label: 'I have more ideas than I could ever execute', low: 'Not me', high: 'Exactly me' },
          { kind: 'scale', id: 'bored', label: 'I get bored once something is up and running', low: 'Not me', high: 'Exactly me' },
          { kind: 'scale', id: 'details', label: 'I love the details, the systems, the follow-through', low: 'Not me', high: 'Exactly me' },
          { kind: 'scale', id: 'accountability', label: 'I naturally hold people accountable', low: 'Not me', high: 'Exactly me' },
          { kind: 'scale', id: 'relationships', label: 'I’m the one who opens doors and closes the big relationships', low: 'Not me', high: 'Exactly me' },
          { kind: 'scale', id: 'numbers', label: 'I know my numbers without looking them up', low: 'Not me', high: 'Exactly me' },
        ],
      },
      {
        title: 'Reflect',
        fields: [
          { kind: 'short', id: 'verdict', label: 'So which are you?', placeholder: 'Visionary / Integrator / honestly, a bit of both' },
          { kind: 'long', id: 'cost', label: 'Where has pretending to be the other one cost you?', rows: 4 },
          { kind: 'long', id: 'counterpart', label: 'Who is (or could be) your counterpart?', hint: 'Name a person or describe the role you need.', rows: 3 },
          { kind: 'short', id: 'scores', label: 'Rocket Fuel scores (optional)', placeholder: 'Visionary __ / Integrator __' },
        ],
      },
    ],
  },

  // ─── 02 Vision ────────────────────────────────────────────────────────────
  {
    slug: 'ikigai',
    title: 'Ikigai',
    phase: 'vision',
    minutes: 60,
    summary: 'Where what you love, what you’re great at, what people need, and what pays overlap.',
    visual: 'ikigai',
    intro: [
      'Ikigai is a Japanese idea: your reason for getting up in the morning. It lives where four things overlap. What you love. What you’re great at. What the world needs. What someone will pay you for.',
      'I did mine for the first time a few years ago and it was a game-changer for clarity. What came out: hosting and facilitating, plus sales and marketing, expressed through coaching, teaching, and content.',
      'Brain-dump each circle first. Don’t filter. The overlaps show up on their own.',
    ],
    sections: [
      {
        title: 'What you love',
        intro: 'What do you lose track of time doing? What would you study on a free Saturday?',
        fields: [{ kind: 'list', id: 'love', label: 'What you love', count: 6 }],
      },
      {
        title: 'What you’re great at',
        intro: 'What comes naturally? What do friends call you for? What would people say you’re world-class at?',
        fields: [{ kind: 'list', id: 'good', label: 'What you’re great at', count: 6 }],
      },
      {
        title: 'What the world needs',
        intro: 'What do you hear people asking for? What do the people around you wish they had more of?',
        fields: [{ kind: 'list', id: 'need', label: 'What the world needs', count: 6 }],
      },
      {
        title: 'What you can be paid for',
        intro: 'Where do you have results? What hard thing have you already been through that you could guide someone else through? For me it was healing from Lyme and building a life in a country where I knew nobody.',
        fields: [{ kind: 'list', id: 'paid', label: 'What you can be paid for', count: 6 }],
      },
      {
        title: 'Your Ikigai',
        fields: [
          { kind: 'short', id: 'statement', label: 'Your Ikigai in one line', placeholder: 'e.g. Hosting spaces where founders come back to themselves' },
          { kind: 'long', id: 'overlaps', label: 'What showed up in more than one circle?', rows: 3 },
          { kind: 'long', id: 'shape', label: 'What shape could this take?', hint: '1:1, group, retreat, course, community, product, membership, content. Pick 1–3.', rows: 3 },
        ],
      },
    ],
  },
  {
    slug: 'three-year-vision',
    title: '3-Year Vision',
    phase: 'vision',
    minutes: 120,
    summary: 'Write the life and the work you want three years from now, in detail.',
    intro: [
      'A vision is meant to be visual. When you can see where you’re going in high definition, your brain starts noticing the opportunities that move you toward it. Vague visions get vague results.',
      'Three years is the sweet spot. Far enough to dream without getting stuck on the how. Close enough that you have to start moving today.',
      'Don’t do this at your desk. Book a half day somewhere beautiful, phone off. Move your body first. Then write in the present tense, like it already happened. Aim for a couple of pages per section. It comes slow, then fast, then slow again.',
    ],
    sections: [
      {
        title: 'Set the date',
        fields: [{ kind: 'short', id: 'date', label: 'It’s…', placeholder: 'December 31, 2029' }],
      },
      {
        title: 'Your life',
        intro: 'Just for you. Nobody else has to read this part.',
        fields: [
          { kind: 'long', id: 'day', label: 'Walk me through a normal day.', hint: 'Where do you wake up? Who’s there? What do you do first?', rows: 6 },
          { kind: 'long', id: 'people', label: 'Who’s in your life?', hint: 'Partner, family, friends, community. How do you spend time together? How does it feel?', rows: 5 },
          { kind: 'long', id: 'body', label: 'Your body, health, and inner life', hint: 'Fitness, energy, practices, spirituality, emotional life.', rows: 5 },
          { kind: 'long', id: 'money', label: 'Your money', hint: 'How you earn, how much, what you own, how it feels. Use real numbers.', rows: 4 },
          { kind: 'long', id: 'creativity', label: 'What you’re creating and learning', rows: 4 },
        ],
      },
      {
        title: 'Your work',
        intro: 'Teleport three years ahead and walk around the business.',
        fields: [
          { kind: 'long', id: 'business', label: 'What does the business look like?', hint: 'Lifestyle business or building toward an exit? What do you sell? Where?', rows: 5 },
          { kind: 'long', id: 'reputation', label: 'What are customers saying about you?', rows: 4 },
          { kind: 'long', id: 'team', label: 'What’s the team like?', hint: 'Who runs what? What do they tell their friends about working with you?', rows: 4 },
          { kind: 'long', id: 'role', label: 'What’s your role, and what did you stop doing?', rows: 4 },
          { kind: 'short', id: 'revenue', label: 'Revenue, and where it comes from', placeholder: '$__ / yr from __' },
        ],
      },
    ],
    closing: 'Celebrate this. Most founders never get this clear on paper about their business or their life. Keep adding to it as things come up this week.',
  },
  {
    slug: 'north-star',
    title: 'North Star Page',
    phase: 'vision',
    minutes: 45,
    summary: 'Values, mission, and a goal ladder from 10 years down to 90 days, on one page.',
    intro: [
      'The 3-year vision is the dream. This is the one page you look at when you have to make a hard call.',
      'My values are Fun Comes First, Health over Hustle, Conscious Growth, and Automate, Eliminate, Delegate. When an opportunity breaks one of them, it’s a no, no matter how good the money is.',
      'Keep every line short enough to remember without looking.',
    ],
    sections: [
      {
        title: 'Values',
        intro: 'The behaviors you’d hire and fire by, including hiring yourself.',
        fields: [{ kind: 'list', id: 'values', label: 'Values', count: 4 }],
      },
      {
        title: 'Why and what',
        fields: [
          { kind: 'short', id: 'vision', label: 'Vision: the change you want to see in the world', placeholder: 'A world where…' },
          { kind: 'long', id: 'mission', label: 'Mission: what you do, for whom, and how', hint: 'One sentence.', rows: 2 },
        ],
      },
      {
        title: 'Goal ladder',
        intro: 'Each rung should make the one above it more likely. Specific and measurable.',
        fields: [
          { kind: 'short', id: 'g10', label: '10 years' },
          { kind: 'short', id: 'g3', label: '3 years' },
          { kind: 'short', id: 'g1', label: '1 year' },
          { kind: 'list', id: 'g90', label: 'Next 90 days', count: 3 },
        ],
      },
    ],
  },

  // ─── 03 Offer ─────────────────────────────────────────────────────────────
  {
    slug: 'superpower',
    title: 'Your Superpower',
    phase: 'offer',
    minutes: 30,
    summary: 'Name the thing only you do, so you can stop doing everything else.',
    intro: [
      'Most burned-out founders I work with aren’t lazy or disorganized. They’re doing ten jobs, and nine of them aren’t theirs. When you know your superpower, you stop micromanaging and start delegating everything else.',
      'Mine is taking chaos and turning it into clarity: a messy idea into a productized offer, a scattered brand into a story people buy. I bootstrapped Neon Roots from $1,200 to $3M on that, and I only named it years later.',
      'Look back at your Energy Audit and Ikigai before you start.',
    ],
    sections: [
      {
        title: 'Evidence',
        fields: [
          { kind: 'list', id: 'peaks', label: 'Three moments you were at your absolute best', hint: 'What were you doing? What made it work?', count: 3 },
          { kind: 'list', id: 'asks', label: 'What people always come to you for', count: 3 },
          { kind: 'long', id: 'easy', label: 'What’s easy for you that seems hard for everyone else?', rows: 3 },
        ],
      },
      {
        title: 'Name it',
        fields: [
          { kind: 'short', id: 'superpower', label: 'My superpower is…', placeholder: 'Turning chaos into clarity' },
          { kind: 'long', id: 'not_mine', label: 'What I’m going to stop doing because it isn’t my superpower', rows: 3 },
        ],
      },
    ],
  },
  {
    slug: 'audience-avatar',
    title: 'Audience Avatar',
    phase: 'offer',
    minutes: 45,
    summary: 'Get so specific about who you serve that they feel you’re talking to them.',
    intro: [
      'If you’re talking to everyone, you’re talking to no one. People buy from people, and they buy when they feel seen.',
      'This worksheet started as how I planned content. It works for anything: a retreat, a program, a product. Build one person in enough detail that you could pick them out of a crowd.',
      'Give them a name. Mine was Jimmy: 35, a burned-out finance guy turned tech sales, living in Lisbon, surfing on weekends, wondering why his peers seem further ahead.',
    ],
    sections: [
      {
        title: 'Who they are',
        fields: [
          { kind: 'short', id: 'name', label: 'Name and one-line description', placeholder: 'Maya, the burned-out studio owner' },
          { kind: 'short', id: 'basics', label: 'Age, where they live, relationship, kids' },
          { kind: 'short', id: 'work', label: 'What they do and roughly what they earn' },
          { kind: 'long', id: 'week', label: 'How they spend their week', rows: 3 },
          { kind: 'short', id: 'hobbies', label: 'Hobbies' },
        ],
      },
      {
        title: 'What’s going on inside',
        fields: [
          { kind: 'long', id: 'wants', label: 'What do they want out of life?', rows: 3 },
          { kind: 'long', id: 'struggle', label: 'What are they struggling with right now?', rows: 3 },
          { kind: 'long', id: 'stress', label: 'What stresses them out?', rows: 2 },
          { kind: 'short', id: 'values', label: 'Their most closely held values' },
          { kind: 'short', id: 'status', label: 'Would they say life is “fine,” “not great,” or “amazing”?' },
        ],
      },
      {
        title: 'Where they are',
        fields: [
          { kind: 'long', id: 'communities', label: 'Communities they’re part of', hint: 'Groups, gyms, Slacks, retreats, corners of the internet.', rows: 2 },
          { kind: 'long', id: 'media', label: 'What they read, watch, and listen to', rows: 2 },
          { kind: 'long', id: 'knowledge', label: 'How much do they already know about what you offer?', rows: 2 },
        ],
      },
      {
        title: 'You and them',
        fields: [
          { kind: 'long', id: 'help', label: 'How can you make their life easier?', rows: 3 },
          { kind: 'long', id: 'objection', label: 'What’s the biggest thing stopping them from saying yes?', rows: 3 },
          { kind: 'long', id: 'dream', label: 'The message you’d love to get from them a year from now', rows: 3 },
        ],
      },
    ],
  },
  {
    slug: 'first-offer',
    title: 'Your First Offer',
    phase: 'offer',
    minutes: 60,
    summary: 'Package a small, fixed, branded first step that’s easy to say yes to.',
    intro: [
      'Big engagements are hard to sell. Everyone’s comparing prices, and you’re one more number on the list. A productized first step changes the game: fixed scope, fixed price, its own name.',
      'I almost went bankrupt before I figured this out. Then we stopped pitching big builds and started selling a $15k roadmap instead. It got us in the door, clients were invested, and phase one sold phase two. That split Neon Roots into a second company, Rootstrap, which we grew to $25M+.',
      'The same thing works for a wellness founder: a day retreat before the week-long, a 90-minute session before the 6-month program.',
    ],
    sections: [
      {
        title: 'The offer',
        fields: [
          { kind: 'short', id: 'name', label: 'What’s it called?', hint: 'Brand it separately from your big offer.', placeholder: 'The Reset Day' },
          { kind: 'short', id: 'who', label: 'Who is it for?', hint: 'Pull from your Audience Avatar.' },
          { kind: 'long', id: 'outcome', label: 'What do they walk away with?', hint: 'A tangible result, not “clarity.”', rows: 3 },
          { kind: 'list', id: 'steps', label: 'What happens, step by step', count: 4 },
        ],
      },
      {
        title: 'The terms',
        fields: [
          { kind: 'short', id: 'price', label: 'Price', hint: 'Low enough to be an easy yes, high enough that they show up.' },
          { kind: 'short', id: 'length', label: 'How long it takes' },
          { kind: 'short', id: 'cap', label: 'How many can you run per month?', hint: 'Capacity creates urgency. Say it out loud.' },
          { kind: 'long', id: 'guarantee', label: 'Your guarantee, if any', rows: 2 },
        ],
      },
      {
        title: 'What it leads to',
        fields: [
          { kind: 'long', id: 'next', label: 'What’s the natural next step after this?', hint: 'Phase one should sell phase two.', rows: 3 },
          { kind: 'long', id: 'objections', label: 'Top objections and your answers', rows: 4 },
        ],
      },
    ],
  },

  // ─── 04 Build ─────────────────────────────────────────────────────────────
  {
    slug: 'ninety-day-plan',
    title: '90-Day Plan',
    phase: 'build',
    minutes: 45,
    summary: 'Turn the vision into three months of moves, 30 days at a time.',
    intro: [
      'Visions die in the gap between “someday” and Monday morning. The 90-day plan closes it.',
      'When I hired my first Chief of Staff, we built a 30/60/90 together with one test at the end: could I take a full month off while the businesses ran? That one question made every priority obvious.',
      'Pick your own test. Then work backwards.',
    ],
    sections: [
      {
        title: 'The test',
        fields: [
          { kind: 'long', id: 'test', label: 'In 90 days, what has to be true?', hint: 'One sentence you can check yes or no.', rows: 2 },
        ],
      },
      {
        title: 'Days 1–30',
        fields: [{ kind: 'list', id: 'd30', label: 'Days 1–30', count: 3 }],
      },
      {
        title: 'Days 31–60',
        fields: [{ kind: 'list', id: 'd60', label: 'Days 31–60', count: 3 }],
      },
      {
        title: 'Days 61–90',
        fields: [{ kind: 'list', id: 'd90', label: 'Days 61–90', count: 3 }],
      },
      {
        title: 'Guardrails',
        fields: [
          { kind: 'long', id: 'not', label: 'What you’re saying no to for the next 90 days', rows: 3 },
          { kind: 'long', id: 'support', label: 'Who or what helps you stay on it', rows: 2 },
        ],
      },
    ],
  },
  {
    slug: 'operating-manual',
    title: 'Your Operating Manual',
    phase: 'build',
    minutes: 40,
    summary: 'A “how to work with me” doc for your team, your partner, and yourself.',
    intro: [
      'I once hired someone who found me aggressive and intense. I thought I was being motivational. Neither of us was wrong. We just never talked about how I work.',
      'Now I open-source my personality. I wrote a manual called BenOS and give it to everyone I work with. It’s the fastest way to stop the misunderstandings that burn trust and energy.',
      'Write it like you’re handing it to a new teammate on day one.',
    ],
    sections: [
      {
        title: 'How I work',
        fields: [
          { kind: 'long', id: 'mission', label: 'What I’m here to do', rows: 2 },
          { kind: 'long', id: 'style', label: 'My working style', hint: 'When I’m sharp, how I make decisions, how fast I move.', rows: 3 },
          { kind: 'long', id: 'strengths', label: 'What I’m great at', rows: 2 },
          { kind: 'long', id: 'growth', label: 'Where I’m still growing', rows: 2 },
        ],
      },
      {
        title: 'Energy',
        fields: [
          { kind: 'long', id: 'flow', label: 'When I’m in flow', rows: 2 },
          { kind: 'long', id: 'drains', label: 'What drains me', rows: 2 },
        ],
      },
      {
        title: 'Working together',
        fields: [
          { kind: 'long', id: 'comms', label: 'How to communicate with me', hint: 'Channels, response times, what’s urgent.', rows: 3 },
          { kind: 'long', id: 'convince', label: 'How to change my mind', rows: 2 },
          { kind: 'long', id: 'boundaries', label: 'My boundaries', hint: 'Hours, days off, what’s off-limits.', rows: 3 },
        ],
      },
    ],
  },
  {
    slug: 'board-meeting',
    title: 'Monthly Board Meeting',
    phase: 'build',
    minutes: 30,
    summary: 'A monthly meeting with yourself: review, reset, and set the next 30 days.',
    intro: [
      'You’re the chairman of your own life. Once a month, call the meeting.',
      'Block an hour on the first of the month. Re-read your 3-Year Vision and North Star Page before you start. Then look back honestly and set the next 30 days.',
      'Do this one every month. Each time you open it, you’re writing that month’s entry.',
    ],
    sections: [
      {
        title: 'Look back',
        fields: [
          { kind: 'long', id: 'wins', label: 'What went well? What are you proud of?', rows: 3 },
          { kind: 'long', id: 'misses', label: 'What didn’t go well, and what would you do differently?', rows: 3 },
          { kind: 'long', id: 'learned', label: 'What did you learn?', rows: 3 },
          { kind: 'scale', id: 'alignment', label: 'How aligned did this month feel with your vision?', low: 'Way off', high: 'Dialed in' },
        ],
      },
      {
        title: 'Next 30 days',
        fields: [
          { kind: 'list', id: 'personal', label: 'Personal goals', hint: 'Body, relationships, money, spirit, play.', count: 3 },
          { kind: 'list', id: 'business', label: 'Business goals', count: 3 },
          { kind: 'short', id: 'one_thing', label: 'The one thing that makes everything else easier' },
        ],
      },
      {
        title: 'Your board',
        intro: 'The people who advise you, even informally. When did you last talk to them?',
        fields: [
          { kind: 'list', id: 'advisors', label: 'Advisors', count: 4, placeholder: 'Name — what they help with — last spoke' },
        ],
      },
    ],
  },
];

export const exerciseBySlug = (slug: string) => EXERCISES.find((e) => e.slug === slug);
