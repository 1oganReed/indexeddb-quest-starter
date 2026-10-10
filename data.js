// data.js: the rules of the game (classes, powers, items, monsters).
// You do NOT need to change this file.

// The six attributes, in order.
const ATTRIBUTES = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];

// Each class: its main attribute, its starting items, and its powers.
// learnAt is the level the hero learns that power.
const CLASSES = {
  fighter: {
    label: "Fighter",
    icon: "🛡️",
    main: "strength",
    startingItems: ["longsword", "shield", "healing-potion", "healing-potion"],
    powers: [
      { powerId: "power-strike", name: "Power Strike", description: "Swing hard: add your strength to the hit.", learnAt: 1 },
      { powerId: "second-wind", name: "Second Wind", description: "Catch your breath and get back in the fight.", learnAt: 1 },
      { powerId: "cleave", name: "Cleave", description: "One swing hits two enemies.", learnAt: 2 },
      { powerId: "battle-cry", name: "Battle Cry", description: "Your shout makes monsters hesitate.", learnAt: 3 },
    ],
  },
  rogue: {
    label: "Rogue",
    icon: "🗡️",
    main: "dexterity",
    startingItems: ["dagger", "thieves-tools", "healing-potion", "healing-potion"],
    powers: [
      { powerId: "sneak-attack", name: "Sneak Attack", description: "Strike from the shadows for extra damage.", learnAt: 1 },
      { powerId: "dodge", name: "Dodge", description: "Slip out of the way of an attack.", learnAt: 1 },
      { powerId: "shadow-step", name: "Shadow Step", description: "Vanish and appear behind the enemy.", learnAt: 2 },
      { powerId: "pick-pocket", name: "Pick Pocket", description: "Lift extra gold from a beaten foe.", learnAt: 3 },
    ],
  },
  wizard: {
    label: "Wizard",
    icon: "🔮",
    main: "intelligence",
    startingItems: ["staff", "spellbook", "healing-potion", "healing-potion"],
    powers: [
      { powerId: "magic-missile", name: "Magic Missile", description: "Three darts of light that never miss.", learnAt: 1 },
      { powerId: "shield-spell", name: "Shield", description: "An invisible wall blocks a hit.", learnAt: 1 },
      { powerId: "fireball", name: "Fireball", description: "A blast of flame fills the room.", learnAt: 2 },
      { powerId: "blink", name: "Blink", description: "Teleport a short distance.", learnAt: 3 },
    ],
  },
  cleric: {
    label: "Cleric",
    icon: "✨",
    main: "wisdom",
    startingItems: ["mace", "holy-symbol", "healing-potion", "healing-potion"],
    powers: [
      { powerId: "sacred-flame", name: "Sacred Flame", description: "Holy fire falls on one enemy.", learnAt: 1 },
      { powerId: "healing-word", name: "Healing Word", description: "A quick prayer heals a wound.", learnAt: 1 },
      { powerId: "bless", name: "Bless", description: "Your whole party fights better.", learnAt: 2 },
      { powerId: "turn-undead", name: "Turn Undead", description: "Skeletons flee from your holy symbol.", learnAt: 3 },
    ],
  },
};

// Every item in the game. type is "weapon", "armor", "tool", "potion", or "treasure".
const ITEMS = {
  "longsword": { itemId: "longsword", name: "Longsword", type: "weapon", icon: "⚔️" },
  "dagger": { itemId: "dagger", name: "Dagger", type: "weapon", icon: "🗡️" },
  "staff": { itemId: "staff", name: "Staff", type: "weapon", icon: "🪄" },
  "mace": { itemId: "mace", name: "Mace", type: "weapon", icon: "🔨" },
  "shield": { itemId: "shield", name: "Shield", type: "armor", icon: "🛡️" },
  "thieves-tools": { itemId: "thieves-tools", name: "Thieves' Tools", type: "tool", icon: "🔧" },
  "spellbook": { itemId: "spellbook", name: "Spellbook", type: "tool", icon: "📘" },
  "holy-symbol": { itemId: "holy-symbol", name: "Holy Symbol", type: "tool", icon: "📿" },
  "healing-potion": { itemId: "healing-potion", name: "Healing Potion", type: "potion", icon: "🧪" },
  "torch": { itemId: "torch", name: "Torch", type: "tool", icon: "🔥" },
  "rope": { itemId: "rope", name: "Rope", type: "tool", icon: "🪢" },
  "ruby": { itemId: "ruby", name: "Ruby", type: "treasure", icon: "💎" },
  "old-coin": { itemId: "old-coin", name: "Old Coin", type: "treasure", icon: "🪙" },
};

// What you can find while exploring.
const LOOT = ["healing-potion", "healing-potion", "torch", "rope", "ruby", "old-coin"];

// Monsters. ac: the number your attack roll has to reach. damage: the most HP it can take from you.
const MONSTERS = [
  { name: "Goblin", icon: "👺", ac: 11, damage: 5, xp: 30, gold: 6 },
  { name: "Giant Rat", icon: "🐀", ac: 10, damage: 4, xp: 20, gold: 3 },
  { name: "Skeleton", icon: "💀", ac: 13, damage: 7, xp: 45, gold: 10 },
  { name: "Orc", icon: "👹", ac: 14, damage: 9, xp: 60, gold: 15 },
];

// D&D modifier: 10 or 11 is +0, every 2 points above is +1, every 2 below is -1.
function modifier(score) {
  return Math.floor((score - 10) / 2);
}
