import { FeelingType } from './types';

export const FEELING_TYPES: FeelingType[] = [
  { label: 'Happy', emoji: '😊', color: '#fbbf24' },
  { label: 'Sad', emoji: '😢', color: '#60a5fa' },
  { label: 'Moody', emoji: '🌀', color: '#a78bfa' },
  { label: 'Excited', emoji: '🤩', color: '#f472b6' },
  { label: 'Tired', emoji: '😴', color: '#9ca3af' },
  { label: 'Bored', emoji: '😐', color: '#94a3b8' },
  { label: 'Anxious', emoji: '😰', color: '#fb923c' },
  { label: 'Grateful', emoji: '🙏', color: '#34d399' },
  { label: 'Calm', emoji: '😌', color: '#2dd4bf' },
  { label: 'Confused', emoji: '😵‍💫', color: '#c084fc' },
  { label: 'Loved', emoji: '🥰', color: '#f87171' },
  { label: 'Angry', emoji: '😡', color: '#ef4444' },
  { label: 'Proud', emoji: '🦁', color: '#facc15' },
  { label: 'Lonely', emoji: '🌑', color: '#475569' },
];

export const MOOD_QUOTES: Record<string, string[]> = {
  Happy: ["Keep shining, the world needs your light!", "Happiness looks absolutely gorgeous on you.", "Soak up this joy and spread it around!"],
  Sad: ["This too shall pass, machi.", "It's okay to not be okay sometimes.", "Tough times never last, but tough people do."],
  Moody: ["Ride the wave, it will settle soon.", "Feelings are just visitors, let them come and go.", "Be gentle with yourself today."],
  Excited: ["Channel that energy into something amazing!", "You are unstoppable today!", "Ride this momentum!"],
  Tired: ["Rest is productive too.", "Recharge your batteries, you deserve it.", "Listen to your body, buddy."],
  Bored: ["Creativity often starts with boredom.", "Time to explore a new hobby?", "Daydreaming is good for the soul."],
  Anxious: ["One step at a time.", "Breathe in calm, breathe out worry.", "You've handled everything life has thrown at you so far."],
  Grateful: ["Gratitude turns what we have into enough.", "A grateful heart is a magnet for miracles.", "Count your blessings, name them one by one."],
  Calm: ["Peace is power.", "Enjoy this moment of stillness.", "Serenity is not freedom from the storm, but peace within it."],
  Confused: ["Clarity comes with time.", "It's okay not to have all the answers right now.", "Trust the process."],
  Loved: ["You are cherished more than you know.", "Love is the best medicine.", "Spread that love!"],
  Angry: ["Take a deep breath.", "Don't let anger steal your peace.", "Walk away and cool down, it's worth it."],
  Proud: ["You earned this!", "Celebrate your wins, big and small.", "Stand tall, you did good."],
  Lonely: ["You are never truly alone.", "Reach out, someone cares.", "Be your own best friend today."],
  default: ["Every day is a fresh start.", "You are doing great.", "Believe in yourself."]
};

export const SYSTEM_INSTRUCTION = `
You are 'Feeling Buddy', a close, supportive friend. 
- **Tone:** Casual, warm, empathetic, and simple.
- **Language style:** Use occasional Indian-English slang naturally, like "hey machi", "buddy", "da", "cool", "don't worry da", "super machi". 
- **Core Task:** Analyze the user's *mood swings* based on their recent history. If they went from Happy to Sad quickly, ask about what changed. If they have been consistently low, offer gentle support.
- **Context:** The user shares their feelings with you. Be a good listener. 
- **Constraint:** Keep responses concise (under 3 sentences) unless the user asks for detailed advice.
- **Goal:** Make them feel heard and validated.
`;

export const LIVE_API_URL = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent";