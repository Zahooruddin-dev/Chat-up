// src/utils/chatbotProcessor.js
// Contains the logic to process user input and retrieve chatbot responses.
import chatbotResponses from '../data/chatbotData';

// Function to get a random response from an array of responses
const getRandomResponse = (responses) => {
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
};

/**
 * Processes user input to generate a chatbot response and manages conversation context.
 * @param {string} userInput - The message entered by the user.
 * @param {string} conversationContext - The current context of the conversation (e.g., 'general', 'story_mode').
 * @returns {{response: string, newContext: string}} An object containing the bot's response and the updated context.
 */
export const getChatbotResponse = (userInput, conversationContext) => {
  const lowerCaseInput = userInput.toLowerCase();
  let newContext = conversationContext; // Initialize new context with current context

  // --- Context-specific responses (e.g., continuing a story) ---
  if (conversationContext === 'story_mode') {
    if (lowerCaseInput.includes("continue") || lowerCaseInput.includes("next part")) {
      // Provide a continuation of the story
      newContext = 'general'; // Reset context after continuing the story
      return {
        response: getRandomResponse([
          "The portal shimmered, drawing Luna into a world where fish flew and mice wore tiny hats! She knew this was the adventure she'd always dreamed of.",
          "Mittens, with the owl's guidance, scaled the treacherous cliffs of Catnip Mountain, the scent of pure bliss growing stronger with every paw-step.",
          "The kind stranger, a retired librarian, took Shadow home. There, Shadow discovered a warm bed, endless cuddles, and a lifetime supply of delicious tuna."
        ]),
        newContext: newContext
      };
    } else {
      // If in story mode but user didn't ask to continue, prompt them
      return {
        response: getRandomResponse([
          "We're currently in story mode. Would you like me to continue the story about the cat?",
          "To get the next part of the story, just say 'continue' or 'next part'."
        ]),
        newContext: newContext // Stay in story mode
      };
    }
  }

  // --- General pattern matching ---
  for (const entry of chatbotResponses) {
    for (const pattern of entry.patterns) {
      if (lowerCaseInput.includes(pattern)) {
        // If a story or poem request is detected, set the context to 'story_mode'
        if (pattern.includes("story") || pattern.includes("poem")) {
          newContext = 'story_mode';
        } else {
          newContext = 'general'; // For other general queries, reset context
        }
        return {
          response: getRandomResponse(entry.responses),
          newContext: newContext
        };
      }
    }
  }

  // --- Default response if no pattern matches ---
  // Reset context to general if the bot doesn't understand
  newContext = 'general';
  return {
    response: "I'm sorry, I don't quite understand that. Could you please rephrase or ask something else?",
    newContext: newContext
  };
};