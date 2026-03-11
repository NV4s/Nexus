export const GREETINGS = [
  "Your all-in-one entertainment and study portal.",
  "Welcome back to the Nexus.",
  "Ready to level up your study session?",
  "Time to focus, then time to play.",
  "The terminal is awaiting your command.",
  "Enter the grid.",
  "Initializing study protocols...",
  "Entertainment modules loaded and ready."
];

export const getRandomGreeting = () => {
  return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
};
