// src/data/chatbotData.js
// This file contains the rule-based responses for your chatbot.
// You can expand this array with more patterns and responses.

const chatbotResponses = [
  {
    patterns: ["hello", "hi", "hey", "greetings"],
    responses: ["Hello there! How can I assist you today?", "Hi! Nice to meet you.", "Hey, what's up?", "Greetings! Ready to chat."],
  },
  {
    patterns: ["how are you", "how are you doing"],
    responses: ["I'm a digital assistant, so I don't have feelings, but I'm functioning perfectly!", "I'm doing great, thanks for asking! How about you?", "As an AI, I'm always ready to help!"],
  },
  {
    patterns: ["what can you do", "help me", "your purpose"],
    responses: ["I can answer basic questions, provide information, and engage in simple conversations. What would you like to know?", "I'm here to assist you with various tasks. Just ask!", "My purpose is to help you. Ask me anything!"],
  },
  {
    patterns: ["write a short story about a cat", "tell me a story", "story of cat"],
    responses: [
      "Once upon a time, in a cozy little house, lived a fluffy cat named Luna. Luna loved naps and sunbeams, but her true passion was chasing the elusive red dot. One day, the red dot led her to a mysterious, sparkling portal...",
      "A tale of whiskers and wonder! There was a brave feline named Mittens who embarked on a grand adventure to find the legendary catnip mountain. Along the way, she befriended a wise old owl and outsmarted a grumpy badger.",
      "In a quiet alley, a tiny stray kitten named Shadow found a warm, discarded box. It wasn't much, but it was home. One evening, a kind stranger offered Shadow a bowl of milk, and her life changed forever."
    ],
  },
  {
    patterns: ["write a poem", "poem about nature", "create a poem"],
    responses: [
      "Whispers of wind through emerald leaves,\nSunlight dappling, a world that breathes.\nRivers murmur, a gentle flow,\nNature's beauty, everywhere you go.",
      "In fields of green, where wildflowers bloom,\nButterflies dance, dispelling gloom.\nMountains stand tall, beneath skies so blue,\nNature's artistry, forever true."
    ],
  },
  {
    patterns: ["what is react", "explain react"],
    responses: ["React is a JavaScript library for building user interfaces, primarily single-page applications. It allows developers to create reusable UI components.", "React is a declarative, efficient, and flexible JavaScript library for building user interfaces. It lets you compose complex UIs from small and isolated pieces of code called 'components'."],
  },
  {
    patterns: ["what is vite", "explain vite"],
    responses: ["Vite is a next-generation frontend tooling that provides an extremely fast development experience. It's known for its rapid hot module replacement (HMR) and optimized build process.", "Vite is a build tool that aims to provide a faster and leaner development experience for modern web projects. It uses native ES modules for development and Rollup for production builds."],
  },
  {
    patterns: ["thank you", "thanks"],
    responses: ["You're welcome!", "Glad I could help!", "Anytime!"],
  },
  {
    patterns: ["bye", "goodbye", "see you"],
    responses: ["Goodbye! Have a great day!", "See you later!", "Farewell! Come back anytime."],
  },
];

export default chatbotResponses;