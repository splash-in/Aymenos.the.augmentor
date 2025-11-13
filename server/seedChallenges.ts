import { getDb } from "./db";
import { multiplayerChallenges } from "../drizzle/schema";

const challenges = [
  // Coding Challenges
  {
    title: "Build a Calculator Together",
    description: "Work as a team to create a simple calculator that can add, subtract, multiply, and divide!",
    challengeType: "coding",
    difficulty: "easy",
    minTeamSize: 2,
    maxTeamSize: 3,
    estimatedMinutes: 20,
    pointsReward: 100,
    problemStatement: "Create a calculator function that takes two numbers and an operation (+, -, *, /) and returns the result. Each team member can work on different operations!",
    successCriteria: JSON.stringify({
      hasAddition: true,
      hasSubtraction: true,
      hasMultiplication: true,
      hasDivision: true,
    }),
    hints: JSON.stringify([
      "Start by defining a function that takes three parameters",
      "Use if-else or switch statements to handle different operations",
      "Don't forget to handle division by zero!",
    ]),
    isKidsFriendly: 1,
    ageGroup: "12+",
    tags: JSON.stringify(["programming", "math", "teamwork"]),
  },
  {
    title: "Collaborative Story Generator",
    description: "Build a program that generates random stories by combining different story elements!",
    challengeType: "coding",
    difficulty: "medium",
    minTeamSize: 2,
    maxTeamSize: 4,
    estimatedMinutes: 30,
    pointsReward: 150,
    problemStatement: "Create arrays of characters, settings, and plot points. Write a function that randomly picks one from each array to generate a unique story!",
    successCriteria: JSON.stringify({
      hasCharacters: true,
      hasSettings: true,
      hasPlots: true,
      generatesStory: true,
    }),
    hints: JSON.stringify([
      "Create separate arrays for characters, settings, and plots",
      "Use Math.random() to pick random elements",
      "Combine the elements into a story string",
    ]),
    isKidsFriendly: 1,
    ageGroup: "12+",
    tags: JSON.stringify(["programming", "creativity", "random"]),
  },

  // Math Challenges
  {
    title: "Fraction Masters",
    description: "Solve fraction problems together and teach each other different strategies!",
    challengeType: "math",
    difficulty: "easy",
    minTeamSize: 2,
    maxTeamSize: 3,
    estimatedMinutes: 15,
    pointsReward: 80,
    problemStatement: "Solve these fraction problems: 1/2 + 1/4 = ?, 3/4 - 1/3 = ?, 2/5 × 3/2 = ?. Explain your method to your teammates!",
    successCriteria: JSON.stringify({
      problem1: "3/4",
      problem2: "5/12",
      problem3: "3/5",
    }),
    hints: JSON.stringify([
      "Find common denominators for addition and subtraction",
      "For multiplication, multiply numerators and denominators",
      "Simplify your answers!",
    ]),
    isKidsFriendly: 1,
    ageGroup: "12+",
    tags: JSON.stringify(["math", "fractions", "arithmetic"]),
  },
  {
    title: "Pattern Detectives",
    description: "Work together to find and extend number patterns!",
    challengeType: "math",
    difficulty: "medium",
    minTeamSize: 2,
    maxTeamSize: 4,
    estimatedMinutes: 25,
    pointsReward: 120,
    problemStatement: "Find the next 3 numbers in each pattern: A) 2, 4, 8, 16, ?, ?, ? B) 1, 4, 9, 16, ?, ?, ? C) 3, 6, 12, 24, ?, ?, ?",
    successCriteria: JSON.stringify({
      patternA: [32, 64, 128],
      patternB: [25, 36, 49],
      patternC: [48, 96, 192],
    }),
    hints: JSON.stringify([
      "Look at how each number relates to the previous one",
      "Pattern A doubles each time",
      "Pattern B involves perfect squares",
    ]),
    isKidsFriendly: 1,
    ageGroup: "12+",
    tags: JSON.stringify(["math", "patterns", "sequences"]),
  },

  // Science Challenges
  {
    title: "Design a Solar System",
    description: "Work together to create a model solar system with correct planet order and facts!",
    challengeType: "science",
    difficulty: "easy",
    minTeamSize: 2,
    maxTeamSize: 4,
    estimatedMinutes: 20,
    pointsReward: 100,
    problemStatement: "List all 8 planets in order from the sun. For each planet, include: size category (small/medium/large), one interesting fact, and whether it has rings.",
    successCriteria: JSON.stringify({
      planetsInOrder: ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"],
      hasFactsForAll: true,
    }),
    hints: JSON.stringify([
      "Remember: My Very Educated Mother Just Served Us Nachos",
      "The first 4 planets are rocky, the last 4 are gas giants",
      "Saturn isn't the only planet with rings!",
    ]),
    isKidsFriendly: 1,
    ageGroup: "12+",
    tags: JSON.stringify(["science", "astronomy", "planets"]),
  },
  {
    title: "States of Matter Lab",
    description: "Collaborate to explain how matter changes between solid, liquid, and gas states!",
    challengeType: "science",
    difficulty: "medium",
    minTeamSize: 2,
    maxTeamSize: 3,
    estimatedMinutes: 25,
    pointsReward: 130,
    problemStatement: "Explain what happens to water molecules when: 1) Ice melts into water, 2) Water boils into steam, 3) Steam condenses back to water. Include temperature and energy changes!",
    successCriteria: JSON.stringify({
      explainsMelting: true,
      explainsBoiling: true,
      explainsCondensation: true,
      mentionsEnergy: true,
    }),
    hints: JSON.stringify([
      "Think about how molecules move in each state",
      "Heating adds energy, cooling removes energy",
      "Temperature stays constant during phase changes",
    ]),
    isKidsFriendly: 1,
    ageGroup: "12+",
    tags: JSON.stringify(["science", "chemistry", "matter"]),
  },

  // Art Challenges
  {
    title: "Collaborative Pixel Art",
    description: "Create pixel art together by each designing different parts of the image!",
    challengeType: "art",
    difficulty: "easy",
    minTeamSize: 2,
    maxTeamSize: 4,
    estimatedMinutes: 30,
    pointsReward: 120,
    problemStatement: "Design a 16x16 pixel art character! Divide the work: one person does the head, another the body, another the legs. Use a shared color palette of 8 colors.",
    successCriteria: JSON.stringify({
      hasHead: true,
      hasBody: true,
      hasLegs: true,
      usesColorPalette: true,
    }),
    hints: JSON.stringify([
      "Plan your design together before starting",
      "Make sure the parts connect smoothly",
      "Use contrasting colors for details",
    ]),
    isKidsFriendly: 1,
    ageGroup: "12+",
    tags: JSON.stringify(["art", "pixel-art", "design"]),
  },

  // Story Challenges
  {
    title: "Round-Robin Adventure",
    description: "Take turns writing paragraphs to create an exciting adventure story together!",
    challengeType: "story",
    difficulty: "easy",
    minTeamSize: 2,
    maxTeamSize: 4,
    estimatedMinutes: 25,
    pointsReward: 110,
    problemStatement: "Write a story about a group of friends who discover a mysterious map. Each team member writes one paragraph, building on what came before. Include: a challenge, a solution, and a surprise ending!",
    successCriteria: JSON.stringify({
      hasIntroduction: true,
      hasChallenge: true,
      hasSolution: true,
      hasSurprise: true,
      minParagraphs: 4,
    }),
    hints: JSON.stringify([
      "Start with an exciting opening",
      "Each paragraph should move the story forward",
      "End with something unexpected!",
    ]),
    isKidsFriendly: 1,
    ageGroup: "12+",
    tags: JSON.stringify(["writing", "creativity", "storytelling"]),
  },

  // Logic Challenges
  {
    title: "Bridge Crossing Puzzle",
    description: "Solve this classic logic puzzle together by planning the optimal strategy!",
    challengeType: "logic",
    difficulty: "medium",
    minTeamSize: 2,
    maxTeamSize: 3,
    estimatedMinutes: 20,
    pointsReward: 140,
    problemStatement: "Four people need to cross a bridge at night. They have one flashlight. The bridge can hold 2 people at a time. Person A takes 1 minute, B takes 2 minutes, C takes 5 minutes, D takes 10 minutes. What's the fastest way to get everyone across?",
    successCriteria: JSON.stringify({
      totalTime: 17,
      hasStrategy: true,
    }),
    hints: JSON.stringify([
      "The two slowest should cross together",
      "The fastest should shuttle the flashlight back",
      "Think about who should pair up",
    ]),
    isKidsFriendly: 1,
    ageGroup: "12+",
    tags: JSON.stringify(["logic", "puzzle", "optimization"]),
  },
  {
    title: "Code Breakers",
    description: "Work together to decode secret messages using different cipher techniques!",
    challengeType: "logic",
    difficulty: "hard",
    minTeamSize: 2,
    maxTeamSize: 4,
    estimatedMinutes: 35,
    pointsReward: 180,
    problemStatement: "Decode these messages: 1) Caesar cipher (shift 3): 'KHOORZRUOG', 2) Reverse: 'DLROW OLLEH', 3) Every other letter: 'HWEOLRLLOD'. Then create your own cipher and encode a message!",
    successCriteria: JSON.stringify({
      decodedCaesar: "HELLOWORLD",
      decodedReverse: "HELLO WORLD",
      decodedAlternate: "HELLOWORLD",
      createdOwnCipher: true,
    }),
    hints: JSON.stringify([
      "Caesar cipher shifts each letter by a fixed amount",
      "Try reading the reverse message backwards",
      "For the third one, take every other letter",
    ]),
    isKidsFriendly: 1,
    ageGroup: "12+",
    tags: JSON.stringify(["logic", "ciphers", "cryptography"]),
  },
];

export async function seedChallenges() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    return;
  }

  console.log("Seeding multiplayer challenges...");

  for (const challenge of challenges) {
    try {
      await db.insert(multiplayerChallenges).values(challenge);
      console.log(`✓ Added challenge: ${challenge.title}`);
    } catch (error) {
      console.error(`✗ Failed to add challenge: ${challenge.title}`, error);
    }
  }

  console.log("Challenge seeding complete!");
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedChallenges()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}
