/* ==========================================================================
   INITIAL STATE & DATA
   ========================================================================== */
let dishes = [
  {
    id: 1,
    name: "Dry-Brined Heritage Turkey (Roast)",
    station: "oven",
    duration: 210,
    offsetBeforeDinner: 45,
    notes: "Roast at 325°F until breast reaches 160°F.",
    completed: false
  },
  {
    id: 2,
    name: "Turkey Carving Rest & Tent",
    station: "rest",
    duration: 45,
    offsetBeforeDinner: 0,
    notes: "Tent loosely with foil; frees the oven for sides.",
    completed: false
  },
  {
    id: 3,
    name: "Sourdough & Sage Stuffing",
    station: "oven",
    duration: 45,
    offsetBeforeDinner: 0,
    notes: "Bake uncovered at 375°F for crisp golden peaks.",
    completed: false
  },
  {
    id: 4,
    name: "Yukon Gold Brown-Butter Mash",
    station: "stovetop",
    duration: 35,
    offsetBeforeDinner: 10,
    notes: "Simmer in salted water, pass through ricer, keep warm.",
    completed: false
  },
  {
    id: 5,
    name: "Pan-Dripping Pan Gravy",
    station: "stovetop",
    duration: 20,
    offsetBeforeDinner: 5,
    notes: "Whisk roux with turkey stock & fresh thyme.",
    completed: false
  },
  {
    id: 6,
    name: "Spiced Orange Cranberry Relish",
    station: "prep",
    duration: 25,
    offsetBeforeDinner: 120,
    notes: "Serve chilled or at room temperature.",
    completed: false
  }
];

let gratitudeLeaves = [
  {
    id: 101,
    author: "Eleanor & Sam",
    species: "Maple",
    color: "sienna",
    message: "For a warm roof, full glasses, and friends who feel like family."
  },
  {
    id: 102,
    author: "Grandpa Arthur",
    species: "White Oak",
    color: "gold",
    message: "Grateful for seventy-eight harvests and everyone still laughing at my jokes."
  },
  {
    id: 103,
    author: "Maya",
    species: "Ginkgo",
    color: "sage",
    message: "Thankful for quiet morning walks in crisp November air and homemade pie."
  }
];

const leftoverIngredients = [
  "Roast Turkey",
  "Herb Stuffing",
  "Mashed Potatoes",
  "Cranberry Sauce",
  "Pan Gravy",
  "Sweet Potatoes",
  "Dinner Rolls",
  "Warm Brie"
];

let selectedIngredients = [];
let selectedLeafSpecies = "Maple";
let selectedLeafColor = "sienna";

/* ==========================================================================
   TIME & SCHEDULE ENGINE
   ========================================================================== */
function parseTimeToMinutes(timeStr) {
  const [hours, mins] = timeStr.split(":").map(Number);
  return hours * 60 + mins;
}

function formatMinutesToTime(totalMins) {
  let normalized = ((totalMins % 1440) + 1440) % 1440;
  let hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${mins.toString().padStart(2, "0")} ${period}`;
}

function renderSchedule() {
  const targetInput = document.getElementById("dinnerTimeInput").value || "17:00";
  const dinnerMins = parseTimeToMinutes(targetInput);

  const computed = dishes.map((dish) => {
    const endMins = dinnerMins - dish.offsetBeforeDinner;
    const startMins = endMins - dish.duration;
    return { ...dish, startMins, endMins };
  });

  computed.sort((a, b) => a.startMins - b.startMins);

  const earliestStart = computed.length ? computed[0].startMins : dinnerMins - 60;
  const totalSpan = Math.max(dinnerMins - earliestStart, 60);

  document.getElementById("heroTargetTime").textContent = formatMinutesToTime(dinnerMins);
  document.getElementById("heroCourseCount").textContent = `${dishes.length} Dishes`;
  document.getElementById("heroFirstStart").textContent = computed.length
    ? formatMinutesToTime(earliestStart)
    : "--:--";

  const ganttContainer = document.getElementById("ganttContainer");
  ganttContainer.innerHTML = computed
    .map((item) => {
      const leftPct = ((item.startMins - earliestStart) / totalSpan) * 100;
      const widthPct = Math.max((item.duration / totalSpan) * 100, 8);
      return `
        <div class="gantt-row">
          <div class="gantt-label" title="${item.name}">${item.name}</div>
          <div class="gantt-bar-bg">
            <div class="gantt-bar-fill ${item.station}" style="left: ${leftPct}%; width: ${widthPct}%;">
              ${formatMinutesToTime(item.startMins)} – ${formatMinutesToTime(item.endMins)}
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  const timelineCards = document.getElementById("timelineCards");
  timelineCards.innerHTML = computed
    .map(
      (item) => `
      <article class="dish-card ${item.completed ? "completed" : ""}">
        <button class="check-toggle" onclick="toggleDishComplete(${item.id})" aria-label="Mark step complete">
          ${item.completed ? "✓" : ""}
        </button>
        <div class="dish-info">
          <span class="dish-time-badge">
            ${formatMinutesToTime(item.startMins)} &rarr; ${formatMinutesToTime(item.endMins)}
          </span>
          <h4>${item.name}</h4>
          <p class="dish-meta">${item.notes} (${item.duration} mins &bull; ${item.station.toUpperCase()})</p>
        </div>
        <button class="delete-dish-btn" onclick="deleteDish(${item.id})" title="Remove dish">
          ✕
        </button>
      </article>
    `
    )
    .join("");

  updateCalmnessGauge();
}

function toggleDishComplete(id) {
  dishes = dishes.map((d) => (d.id === id ? { ...d, completed: !d.completed } : d));
  renderSchedule();
}

function deleteDish(id) {
  dishes = dishes.filter((d) => d.id !== id);
  renderSchedule();
}

function updateCalmnessGauge() {
  const total = dishes.length;
  const done = dishes.filter((d) => d.completed).length;
  document.getElementById("completedSummary").textContent = `${done} of ${total} steps completed`;

  const baseScore = total === 0 ? 100 : Math.round(72 + (done / total) * 28);
  const ring = document.getElementById("calmProgressRing");
  const circumference = 427.25;
  const offset = circumference - (baseScore / 100) * circumference;

  ring.style.strokeDashoffset = offset;
  document.getElementById("calmPercent").textContent = `${baseScore}%`;

  const badge = document.getElementById("calmStatusBadge");
  if (baseScore >= 95) {
    badge.textContent = "Triumphant Host";
  } else if (baseScore >= 82) {
    badge.textContent = "In Full Rhythm";
  } else {
    badge.textContent = "Serene & Ready";
  }
}

/* ==========================================================================
   MODULE 2: GRATITUDE QUILT LOGIC
   ========================================================================== */
function renderGratitudeQuilt() {
  const grid = document.getElementById("gratitudeGrid");
  grid.innerHTML = gratitudeLeaves
    .map(
      (leaf) => `
      <div class="leaf-note ${leaf.color}">
        <div class="leaf-species-tag">🍂 ${leaf.species} Leaf</div>
        <p>“${escapeHTML(leaf.message)}”</p>
        <div class="leaf-author">— ${escapeHTML(leaf.author)}</div>
      </div>
    `
    )
    .join("");
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ==========================================================================
   MODULE 3: LEFTOVER ALCHEMY LAB
   ========================================================================== */
function renderIngredientChips() {
  const container = document.getElementById("ingredientChips");
  container.innerHTML = leftoverIngredients
    .map((ing) => {
      const isSelected = selectedIngredients.includes(ing);
      return `
        <button type="button" class="ing-chip ${isSelected ? "selected" : ""}" onclick="toggleIngredient('${ing}')">
          ${isSelected ? "✓ " : "+ "}${ing}
        </button>
      `;
    })
    .join("");

  document.getElementById("selectedCountBadge").textContent = `${selectedIngredients.length} / 3 Selected`;
  document.getElementById("transmuteBtn").disabled = selectedIngredients.length < 2;
}

function toggleIngredient(ing) {
  if (selectedIngredients.includes(ing)) {
    selectedIngredients = selectedIngredients.filter((item) => item !== ing);
  } else if (selectedIngredients.length < 3) {
    selectedIngredients.push(ing);
  }
  renderIngredientChips();
}

function generateAlchemyRecipe() {
  const combo = [...selectedIngredients].sort().join(" + ");
  const has = (item) => selectedIngredients.includes(item);

  let recipe = {
    title: "Crispy Cast-Iron Harvest Hash",
    tag: "Friday Brunch Creation",
    desc: `A golden, skillet-seared medley uniting ${selectedIngredients.join(", ")} with fresh cracked black pepper and a runny fried egg.`,
    steps: "1. Sear diced leftovers in butter over medium-high heat until crisp edges form. 2. Create wells, crack in 2 eggs, cover for 3 minutes, and finish with flaky sea salt."
  };

  if (has("Herb Stuffing") && (has("Roast Turkey") || has("Cranberry Sauce"))) {
    recipe = {
      title: "Crispy Waffle-Iron Stuffing Panini",
      tag: "Signature Leftover Classic",
      desc: "Savory herb stuffing pressed into a crunchy golden waffle crust, layered with carved turkey and tart cranberry glaze.",
      steps: "1. Brush waffle iron with melted butter and press stuffing for 4 minutes until crisp. 2. Sandwich warm turkey and cranberry sauce between two stuffing waffles."
    };
  } else if (has("Mashed Potatoes") && has("Pan Gravy")) {
    recipe = {
      title: "Truffled Shepherd’s Croquettes",
      tag: "Bistro Small Plate",
      desc: "Chilled mashed potatoes rolled into crisp panko croquettes and served over piping-hot pan gravy.",
      steps: "1. Form cold mashed potatoes into patties, dust with flour, and pan-fry in olive oil until golden. 2. Ladle simmering pan gravy underneath and garnish with chives."
    };
  } else if (has("Warm Brie") || has("Dinner Rolls")) {
    recipe = {
      title: "Baked Cranberry & Brie Harvest Sliders",
      tag: "Fireside Evening Snack",
      desc: "Pull-apart dinner rolls glazed with Dijon butter, stuffed with molten brie and leftover Thanksgiving fixings.",
      steps: "1. Slice rolls horizontally, layer with brie and remaining fillings. 2. Brush tops with garlic-thyme butter and bake at 375°F for 12 minutes."
    };
  }

  const resultBox = document.getElementById("alchemyResult");
  resultBox.innerHTML = `
    <div>
      <span class="recipe-kicker">${recipe.tag} &bull; ${combo}</span>
      <h3>${recipe.title}</h3>
      <p class="recipe-desc">${recipe.desc}</p>
      <div class="recipe-steps"><strong>Method:</strong> ${recipe.steps}</div>
    </div>
    <button type="button" class="btn btn-secondary" onclick="flipCardBack()" style="margin-top:16px;">
      ↺ Try Another Combination
    </button>
  `;

  document.getElementById("alchemyCard").classList.add("flipped");
}

function flipCardBack() {
  document.getElementById("alchemyCard").classList.remove("flipped");
}

/* ==========================================================================
   AMBIENT FALLING AUTUMN LEAVES CANVAS
   ========================================================================== */
function initLeafCanvas() {
  const canvas = document.getElementById("leafCanvas");
  const ctx = canvas.getContext("2d");
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const colors = ["#C9562D", "#DDA027", "#912B29", "#385E4C"];
  const leaves = Array.from({ length: 18 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: 7 + Math.random() * 7,
    speedY: 0.35 + Math.random() * 0.55,
    swaySpeed: 0.01 + Math.random() * 0.015,
    swayOffset: Math.random() * Math.PI * 2,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.02,
    color: colors[Math.floor(Math.random() * colors.length)]
  }));

  function animate() {
    ctx.clearRect(0, 0, width, height);
    leaves.forEach((leaf) => {
      leaf.y += leaf.speedY;
      leaf.x += Math.sin(leaf.y * leaf.swaySpeed + leaf.swayOffset) * 0.6;
      leaf.rotation += leaf.rotSpeed;

      if (leaf.y > height + 20) {
        leaf.y = -20;
        leaf.x = Math.random() * width;
      }

      ctx.save();
      ctx.translate(leaf.x, leaf.y);
      ctx.rotate(leaf.rotation);
      ctx.globalAlpha = 0.24;
      ctx.fillStyle = leaf.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, leaf.size, leaf.size * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    requestAnimationFrame(animate);
  }
  animate();
}

/* ==========================================================================
   EVENT LISTENERS & INITIALIZATION
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();
  initLeafCanvas();
  renderSchedule();
  renderGratitudeQuilt();
  renderIngredientChips();

  document.getElementById("dinnerTimeInput").addEventListener("change", renderSchedule);

  const drawer = document.getElementById("addDishDrawer");
  document.getElementById("addDishToggleBtn").addEventListener("click", () => {
    drawer.classList.toggle("hidden");
  });

  document.getElementById("customDishForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("dishName").value.trim();
    const station = document.getElementById("dishStation").value;
    const duration = parseInt(document.getElementById("dishDuration").value, 10);
    const offsetBeforeDinner = parseInt(document.getElementById("dishOffset").value, 10);

    dishes.push({
      id: Date.now(),
      name,
      station,
      duration,
      offsetBeforeDinner,
      notes: "Custom host addition.",
      completed: false
    });

    e.target.reset();
    drawer.classList.add("hidden");
    renderSchedule();
  });

  document.getElementById("resetProgressBtn").addEventListener("click", () => {
    dishes = dishes.map((d) => ({ ...d, completed: false }));
    renderSchedule();
  });

  const msgInput = document.getElementById("gratitudeMessage");
  msgInput.addEventListener("input", () => {
    document.getElementById("charCount").textContent = msgInput.value.length;
  });

  document.querySelectorAll(".leaf-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".leaf-option").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      selectedLeafSpecies = btn.textContent.trim();
    });
  });

  document.querySelectorAll(".color-dot").forEach((dot) => {
    dot.addEventListener("click", () => {
      document.querySelectorAll(".color-dot").forEach((d) => d.classList.remove("active"));
      dot.classList.add("active");
      selectedLeafColor = dot.dataset.color;
    });
  });

  document.getElementById("gratitudeForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const author = document.getElementById("guestName").value.trim();
    const message = msgInput.value.trim();
    if (!author || !message) return;

    gratitudeLeaves.unshift({
      id: Date.now(),
      author,
      species: selectedLeafSpecies,
      color: selectedLeafColor,
      message
    });

    e.target.reset();
    document.getElementById("charCount").textContent = "0";
    renderGratitudeQuilt();
  });

  document.getElementById("transmuteBtn").addEventListener("click", generateAlchemyRecipe);
  document.getElementById("clearIngredientsBtn").addEventListener("click", () => {
    selectedIngredients = [];
    flipCardBack();
    renderIngredientChips();
  });

  const sosModal = document.getElementById("sosModal");
  document.getElementById("sosBtn").addEventListener("click", () => {
    sosModal.classList.remove("hidden");
  });
  document.getElementById("closeSosBtn").addEventListener("click", () => {
    sosModal.classList.add("hidden");
  });
  sosModal.addEventListener("click", (e) => {
    if (e.target === sosModal) sosModal.classList.add("hidden");
  });
});