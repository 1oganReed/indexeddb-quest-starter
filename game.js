// game.js: runs WM Quest and calls the database functions you write in db.js.
// You do NOT need to change this file. Read it to see WHEN each db.js function runs
// and WHAT it hands you.

const dbStatus = document.querySelector("#db-status");
const loadForm = document.querySelector("#load-form");
const heroList = document.querySelector("#hero-list");
const heroListError = document.querySelector("#hero-list-error");
const createForm = document.querySelector("#create-form");
const newName = document.querySelector("#new-name");
const newClass = document.querySelector("#new-class");
const rolledBox = document.querySelector("#rolled");
const rollButton = document.querySelector("#roll-button");
const createError = document.querySelector("#create-error");
const sheet = document.querySelector("#sheet");
const exploreButton = document.querySelector("#explore-button");
const restButton = document.querySelector("#rest-button");
const eventText = document.querySelector("#event");
const journalList = document.querySelector("#journal");

let heroName = ""; // the hero being played right now
let rolled = null; // the attributes rolled for a new hero

// ---------- Dice ----------
function roll(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

// 4 six-sided dice, drop the lowest, add the rest (the D&D way).
function rollAttribute() {
  const dice = [roll(6), roll(6), roll(6), roll(6)].sort((a, b) => a - b);
  return dice[1] + dice[2] + dice[3];
}

function pick(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// "+2", "+0", "-1"
function signed(number) {
  return number >= 0 ? "+" + number : String(number);
}

// Shows a value from the database. If it's missing, says so in red,
// so a misspelled field name is easy to spot.
function show(value) {
  return value === undefined ? `<span class="missing">missing!</span>` : value;
}

// ---------- Database status (openDB) ----------
async function renderStatus() {
  try {
    const db = await openDB();
    const stores = Array.from(db.objectStoreNames).join(", ");
    dbStatus.innerHTML = `Connected to <b>${db.name}</b>, version <b>${db.version}</b>. Stores: <b>${stores}</b>`;
    dbStatus.classList.add("connected");
  } catch (error) {
    dbStatus.textContent = `Database not connected: ${error.message}`;
    dbStatus.classList.remove("connected");
  }
}

// ---------- Tavern: the hero list (getAllHeroes) ----------
async function renderHeroList() {
  try {
    const heroes = await getAllHeroes();
    heroList.innerHTML = heroes.length === 0
      ? `<option value="">No heroes yet</option>`
      : heroes.map((h) => `<option value="${h.name}">${h.name} (level ${h.level} ${h.heroClass})</option>`).join("");
    if (heroName) heroList.value = heroName;
    heroListError.textContent = "";
  } catch (error) {
    heroListError.textContent = error.message;
  }
}

loadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!heroList.value) return;
  heroName = heroList.value;
  eventText.textContent = `${heroName} is ready.`;
  await renderAll();
});

// ---------- Tavern: make a new hero ----------
newClass.innerHTML = Object.entries(CLASSES)
  .map(([id, c]) => `<option value="${id}">${c.icon} ${c.label}</option>`).join("");

function renderRolled() {
  const main = CLASSES[newClass.value].main;
  rolledBox.innerHTML = ATTRIBUTES.map((a) => `
    <div class="attr ${a === main ? "main" : ""}">
      <span>${a.slice(0, 3)}</span>
      <b>${rolled ? rolled[a] : "?"}</b>
      <small>${rolled ? signed(modifier(rolled[a])) : ""}</small>
    </div>`).join("");
}

rollButton.addEventListener("click", () => {
  rolled = {};
  ATTRIBUTES.forEach((a) => { rolled[a] = rollAttribute(); });
  renderRolled();
});

newClass.addEventListener("change", renderRolled);

createForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = newName.value.trim();
  const heroClass = newClass.value;
  if (!name) return;
  if (!rolled) {
    createError.textContent = "Roll your stats first.";
    return;
  }

  try {
    await createHero(name, heroClass, rolled); // Level 1
  } catch (error) {
    console.error(error);
    createError.textContent = `${error.name}: ${error.message}`;
    return;
  }
  createError.textContent = "";
  heroName = name;
  rolled = null;
  newName.value = "";
  renderRolled();

  // The starting kit: the class's items and level 1 powers.
  try {
    for (const itemId of CLASSES[heroClass].startingItems) {
      await addItem(name, ITEMS[itemId]); // Level 2
    }
    for (const power of CLASSES[heroClass].powers) {
      if (power.learnAt === 1) await learnPower(name, power); // Level 2
    }
  } catch (error) {
    console.error(error);
  }
  eventText.textContent = `${name} is ready.`;
  await log(`${name} the ${CLASSES[heroClass].label} begins their quest.`);
  await renderAll();
});

// ---------- The hero sheet (getHero, getPowers, getInventory) ----------
async function renderSheet() {
  exploreButton.disabled = true;
  restButton.disabled = true;
  if (!heroName) return;

  let hero;
  try {
    hero = await getHero(heroName);
  } catch (error) {
    sheet.innerHTML = `<p class="error">${error.message}</p>`;
    return;
  }
  if (!hero) {
    sheet.innerHTML = `<p class="muted">${heroName} isn't in the database.</p>`;
    heroName = "";
    return;
  }

  const c = CLASSES[hero.heroClass] || { icon: "❓", label: show(undefined), main: "" };
  const attrs = hero.attributes || {};
  const hpPercent = Math.max(0, Math.min(100, (hero.hp / hero.maxHp) * 100)) || 0;
  const xpPercent = Math.max(0, Math.min(100, (hero.xp % 100))) || 0;

  sheet.innerHTML = `
    <div class="hero-head">
      <span class="hero-icon">${c.icon}</span>
      <div class="grow">
        <h2 class="hero-name">${show(hero.name)}</h2>
        <p class="muted">Level ${show(hero.level)} ${c.label} · ${show(hero.gold)} gold</p>
      </div>
      <button id="delete-button" type="button" class="btn btn-small btn-ghost">Delete hero</button>
    </div>

    <p class="bar-label">HP ${show(hero.hp)} / ${show(hero.maxHp)}</p>
    <div class="bar"><div class="bar-fill hp" style="width: ${hpPercent}%"></div></div>
    <p class="bar-label">XP ${show(hero.xp)} (next level at ${hero.level * 100})</p>
    <div class="bar"><div class="bar-fill xp" style="width: ${xpPercent}%"></div></div>

    <h3>Attributes</h3>
    <div class="attr-grid">
      ${ATTRIBUTES.map((a) => `
        <div class="attr ${a === c.main ? "main" : ""}">
          <span>${a.slice(0, 3)}</span>
          <b>${show(attrs[a])}</b>
          <small>${attrs[a] === undefined ? "" : signed(modifier(attrs[a]))}</small>
        </div>`).join("")}
    </div>

    <h3>Powers</h3>
    <ul id="power-list" class="power-list"><li class="muted">Loading...</li></ul>

    <h3>Inventory</h3>
    <ul id="item-list" class="item-list"><li class="muted">Loading...</li></ul>
  `;

  document.querySelector("#delete-button").addEventListener("click", () => removeHero(hero.name));
  exploreButton.disabled = false;
  restButton.disabled = false;

  const powerList = document.querySelector("#power-list");
  try {
    const powers = await getPowers(heroName); // Level 2
    powerList.innerHTML = powers.length === 0
      ? `<li class="muted">No powers.</li>`
      : powers.map((p) => `<li><b>${show(p.name)}</b> <span class="muted">${show(p.description)}</span></li>`).join("");
  } catch (error) {
    powerList.innerHTML = `<li class="error">${error.message}</li>`;
  }

  const itemList = document.querySelector("#item-list");
  try {
    const items = await getInventory(heroName); // Level 2
    itemList.innerHTML = items.length === 0
      ? `<li class="muted">Your bag is empty.</li>`
      : items.map((item) => `
        <li>
          <span class="item-icon">${show(item.icon)}</span>
          <span class="grow">${show(item.name)} <b>×${show(item.qty)}</b></span>
          ${itemButton(item)}
        </li>`).join("");
  } catch (error) {
    itemList.innerHTML = `<li class="error">${error.message}</li>`;
  }
}

// Potions get Drink, treasure gets Sell, everything else gets Drop.
function itemButton(item) {
  if (item.type === "potion") return `<button data-use="${item.itemId}" class="btn btn-small">Drink</button>`;
  if (item.type === "treasure") return `<button data-use="${item.itemId}" class="btn btn-small">Sell</button>`;
  return `<button data-use="${item.itemId}" class="btn btn-small btn-ghost">Drop</button>`;
}

sheet.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-use]");
  if (!button) return;
  const item = ITEMS[button.dataset.use];
  newEvent();

  try {
    const hero = await getHero(heroName);
    await removeItem(heroName, item.itemId); // Level 2

    if (item.type === "potion") {
      const healed = roll(4) + roll(4) + 2;
      hero.hp = Math.min(hero.maxHp, hero.hp + healed);
      await updateHero(hero); // Level 1
      await say(`You drink a Healing Potion and heal ${healed} HP.`);
    } else if (item.type === "treasure") {
      const price = item.itemId === "ruby" ? 25 : 5;
      hero.gold = hero.gold + price;
      await updateHero(hero); // Level 1
      await say(`You sell the ${item.name} for ${price} gold.`);
    } else {
      await say(`You drop the ${item.name}.`);
    }
  } catch (error) {
    console.error(error);
    eventText.textContent = error.message;
  }
  await renderAll();
});

async function removeHero(name) {
  try {
    await deleteHero(name); // Level 2
    heroName = "";
    sheet.innerHTML = `<p class="muted">${name} has left the party. Pick or make another hero.</p>`;
    eventText.textContent = "Choose a hero to start.";
  } catch (error) {
    console.error(error);
    eventText.textContent = error.message;
  }
  await renderAll();
}

// ---------- Adventure ----------
exploreButton.addEventListener("click", async () => {
  newEvent();
  let hero;
  try {
    hero = await getHero(heroName);
  } catch (error) {
    eventText.textContent = error.message;
    return;
  }

  try {
    if (Math.random() < 0.35) {
      // Found something.
      const item = ITEMS[pick(LOOT)];
      await addItem(heroName, item); // Level 2
      await say(`You search a dusty room and find: ${item.icon} ${item.name}.`);
    } else {
      // A fight: one attack roll against the monster's AC.
      const monster = pick(MONSTERS);
      const bonus = modifier(hero.attributes[CLASSES[hero.heroClass].main]) + hero.level;
      const d20 = roll(20);
      if (d20 + bonus >= monster.ac) {
        hero.xp = hero.xp + monster.xp;
        hero.gold = hero.gold + monster.gold;
        await say(`${monster.icon} A ${monster.name}! You roll ${d20} ${signed(bonus)} = ${d20 + bonus} vs AC ${monster.ac}. You win! +${monster.xp} XP, +${monster.gold} gold.`);
        await levelUp(hero);
      } else {
        const hurt = roll(monster.damage);
        hero.hp = hero.hp - hurt;
        if (hero.hp < 1) {
          hero.hp = 1;
          await say(`${monster.icon} A ${monster.name}! You roll ${d20} ${signed(bonus)} = ${d20 + bonus} vs AC ${monster.ac}. Miss. It hits you for ${hurt}, and you barely escape with 1 HP.`);
        } else {
          await say(`${monster.icon} A ${monster.name}! You roll ${d20} ${signed(bonus)} = ${d20 + bonus} vs AC ${monster.ac}. Miss. It hits you for ${hurt} HP.`);
        }
      }
      await updateHero(hero); // Level 1
    }
  } catch (error) {
    console.error(error);
    eventText.textContent = error.message;
  }
  await renderAll();
});

// Every 100 XP is a new level: more HP, full heal, and maybe a new power.
async function levelUp(hero) {
  while (hero.xp >= hero.level * 100) {
    hero.level = hero.level + 1;
    hero.maxHp = hero.maxHp + Math.max(1, 5 + modifier(hero.attributes.constitution));
    hero.hp = hero.maxHp;
    await say(`⭐ Level up! ${hero.name} is now level ${hero.level}.`);
    for (const power of CLASSES[hero.heroClass].powers) {
      if (power.learnAt === hero.level) {
        await learnPower(hero.name, power); // Level 2
        await say(`⭐ New power: ${power.name}.`);
      }
    }
  }
}

restButton.addEventListener("click", async () => {
  newEvent();
  try {
    const hero = await getHero(heroName);
    hero.hp = hero.maxHp;
    await updateHero(hero); // Level 1
    await say("You rest at camp. HP is full.");
  } catch (error) {
    console.error(error);
    eventText.textContent = error.message;
  }
  await renderAll();
});

// ---------- Journal (Level 3: addJournal, getJournal) ----------
// Shows what happened, and saves it to the journal.
async function say(text) {
  eventText.insertAdjacentHTML("beforeend", `<p>${text}</p>`);
  await log(text);
}

// Clears the adventure box before each new action.
function newEvent() {
  eventText.innerHTML = "";
}

async function log(text) {
  try {
    await addJournal(heroName, text); // Level 3
  } catch (error) {
    // The journal is Level 3. Until then, the game keeps going without it.
  }
}

async function renderJournal() {
  if (!heroName) {
    journalList.innerHTML = `<li class="muted">No entries yet.</li>`;
    return;
  }
  try {
    const entries = await getJournal(heroName);
    journalList.innerHTML = entries.length === 0
      ? `<li class="muted">No entries yet.</li>`
      : entries.slice(0, 8).map((e) => `<li>${show(e.text)}</li>`).join("");
  } catch (error) {
    journalList.innerHTML = `<li class="muted">${error.message}</li>`;
  }
}

async function renderAll() {
  await renderStatus();
  await renderHeroList();
  await renderSheet();
  await renderJournal();
}

// ---------- Start ----------
renderRolled();
renderAll();
