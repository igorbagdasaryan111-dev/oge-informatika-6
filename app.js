"use strict";

const byId = (id) => document.getElementById(id);
const formatNumber = (value) => String(value).replace("-", "−");
const isInteger = (value) => /^[+−-]?\d+$/.test(value.trim());
const toInteger = (value) => Number(value.trim().replace("−", "-"));

const trainer = byId("trainer");
trainer.addEventListener("input", () => {
  byId("trainer-result").textContent = "Нажми «Запустить», чтобы проверить вывод.";
});
trainer.addEventListener("submit", (event) => {
  event.preventDefault();
  const s = byId("trainer-s").valueAsNumber;
  const t = byId("trainer-t").valueAsNumber;
  const options = {
    and: { value: s > 4 && t > 4, parts: [[s, ">", 4, s > 4], [t, ">", 4, t > 4]] },
    or: { value: s > 4 || t > 4, parts: [[s, ">", 4, s > 4], [t, ">", 4, t > 4]] },
    not: { value: s <= 4 && t >= 4, parts: [[s, "≤", 4, s <= 4], [t, "≥", 4, t >= 4]] },
    group: { value: !(s > 4 && t > 4), parts: [[s, ">", 4, s > 4], [t, ">", 4, t > 4]] }
  };
  const condition = byId("trainer-condition").value;
  const { value, parts } = options[condition];
  const grouping = condition === "group" ? " Результат and внутри скобок меняет оператор not." : "";
  const explanation = parts.map(([a, symbol, b, trueCase]) =>
    `${formatNumber(a)} ${symbol} ${b} — ${trueCase ? "истина" : "ложь"}`).join(", ");
  byId("trainer-result").textContent = `${value ? "YES" : "NO"}. ${explanation}.${grouping}`;
});

const key = "igor-exam-info6-homework-v1";
const tasks = JSON.parse(byId("task-data").textContent);
const cards = [...document.querySelectorAll(".task")];
const inputs = cards.map((card) => card.querySelector("input"));
const links = cards.map((card, index) => {
  const link = document.createElement("a");
  link.textContent = index + 1;
  link.href = `#${card.id}`;
  link.setAttribute("aria-label", `Задача ${index + 1}`);
  byId("task-nav").append(link);
  return link;
});

const answers = () => inputs.map((input) => input.value.trim());
let submitted = false;
function save() {
  try {
    localStorage.setItem(key, JSON.stringify({ answers: answers(), submitted }));
  } catch {
    // The assignment can still be completed if storage is unavailable.
  }
}

function progress() {
  const values = answers();
  const filled = values.filter(isInteger).length;
  byId("progress").value = filled;
  byId("progress-label").textContent = `Заполнено ${filled} из ${tasks.length}`;
  links.forEach((link, index) => link.classList.toggle("filled", isInteger(values[index])));
}

function showReview() {
  submitted = true;
  let correct = 0;
  cards.forEach((card, i) => {
    const task = tasks[i];
    const match = toInteger(inputs[i].value) === task.answer;
    correct += Number(match);
    inputs[i].readOnly = true;
    inputs[i].removeAttribute("aria-invalid");
    const status = card.querySelector(".answer-status");
    status.textContent = match ? "Верно" : "Ошибка";
    status.className = `answer-status ${match ? "right" : "wrong"}`;
    const solution = card.querySelector(".solution");
    solution.hidden = false;
    solution.querySelector("p").textContent = `Ответ: ${task.answer}. ${task.explanation}`;
    const rows = task.rows.map((row) => `№${row} (${task.pairs[row - 1].map(formatNumber).join(", ")})`);
    solution.querySelector(".run-review").textContent = `Подходящие запуски: ${rows.join(", ")}.`;
  });
  byId("submit-button").hidden = true;
  byId("result").hidden = false;
  byId("submit-message").textContent = "";
  byId("score").textContent = `Верно ${correct} из ${tasks.length} · ${Math.round(correct * 100 / tasks.length)}%`;
}

try {
  const saved = JSON.parse(localStorage.getItem(key));
  if (Array.isArray(saved?.answers) && saved.answers.length === tasks.length) {
    inputs.forEach((input, index) => {
      if (typeof saved.answers[index] === "string") input.value = saved.answers[index].slice(0, 12);
    });
    if (saved.submitted && answers().every(isInteger)) showReview();
  }
} catch {
  // Malformed or inaccessible storage does not block completing the work.
}
progress();

inputs.forEach((input) => input.addEventListener("input", () => {
  input.removeAttribute("aria-invalid");
  byId("submit-message").textContent = "";
  progress();
  save();
}));

byId("homework-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (submitted) return;
  const missing = answers().flatMap((value, index) => isInteger(value) ? [] : [index]);
  if (missing.length) {
    missing.forEach((index) => inputs[index].setAttribute("aria-invalid", "true"));
    byId("submit-message").textContent = `Введи целые числа в задачах ${missing.map((index) => index + 1).join(", ")}.`;
    inputs[missing[0]].focus();
    return;
  }
  showReview();
  save();
  byId("score").focus();
});

byId("edit").addEventListener("click", () => {
  submitted = false;
  cards.forEach((card, i) => {
    inputs[i].readOnly = false;
    const status = card.querySelector(".answer-status");
    status.textContent = "";
    status.className = "answer-status";
    const solution = card.querySelector(".solution");
    solution.open = false;
    solution.hidden = true;
  });
  byId("result").hidden = true;
  byId("copy-status").hidden = true;
  byId("copy-fallback").hidden = true;
  byId("submit-button").hidden = false;
  save();
  inputs[0].focus();
});

byId("copy").addEventListener("click", async () => {
  const summary = ["ОГЭ по информатике · ДЗ №6", byId("score").textContent,
    "Мои ответы:", ...answers().map((value, index) => `${index + 1}. ${value}`)].join("\n");
  const message = byId("copy-status");
  const fallback = byId("copy-fallback");
  message.hidden = false;
  try {
    await navigator.clipboard.writeText(summary);
    message.textContent = "Результат скопирован.";
    fallback.hidden = true;
  } catch {
    message.textContent = "Выделенный текст можно скопировать вручную.";
    fallback.value = summary;
    fallback.hidden = false;
    fallback.select();
  }
});

const tools = {
  pen: { color: "#1b59c7", width: 2.5, blend: "source-over" },
  marker: { color: "#efbf1c70", width: 15, blend: "source-over" },
  erase: { color: "#000", width: 16, blend: "destination-out" }
};

cards.forEach((card) => {
  let tool = "off";
  const history = [];
  const surfaces = [...card.querySelectorAll(".ink-layer")].map((canvas) => {
    const ctx = canvas.getContext("2d");
    const strokes = [];
    let active;

    function draw() {
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;
      const scale = devicePixelRatio || 1;
      const pixelWidth = Math.round(width * scale);
      const pixelHeight = Math.round(height * scale);
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = ctx.lineJoin = "round";
      strokes.forEach(({ points, kind }) => {
        const paint = tools[kind];
        ctx.globalCompositeOperation = paint.blend;
        ctx.lineWidth = paint.width;
        ctx.strokeStyle = paint.color;
        ctx.beginPath();
        ctx.moveTo(points[0][0] * width, points[0][1] * height);
        if (points.length === 1) ctx.lineTo(points[0][0] * width + .1, points[0][1] * height);
        points.slice(1).forEach(([x, y]) => ctx.lineTo(x * width, y * height));
        ctx.stroke();
      });
    }

    function point(event) {
      const box = canvas.getBoundingClientRect();
      return [(event.clientX - box.left) / box.width, (event.clientY - box.top) / box.height];
    }

    new ResizeObserver(draw).observe(canvas);
    canvas.addEventListener("pointerdown", (event) => {
      if (active || !tools[tool] || !event.isPrimary || event.button !== 0) return;
      active = { id: event.pointerId, kind: tool, points: [point(event)] };
      strokes.push(active);
      history.push(() => { strokes.pop(); draw(); });
      canvas.setPointerCapture(event.pointerId);
      draw();
    });
    canvas.addEventListener("pointermove", (event) => {
      if (event.pointerId !== active?.id) return;
      active.points.push(point(event));
      draw();
    });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((name) => canvas.addEventListener(name, (event) => {
      if (event.pointerId === active?.id) active = undefined;
    }));
    return draw;
  });

  const buttons = [...card.querySelectorAll("[data-tool]")];
  function use(next) {
    tool = next;
    card.classList.toggle("drawing", tool !== "off");
    buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.tool === tool)));
  }
  buttons.forEach((button) => button.addEventListener("click", () => use(button.dataset.tool)));
  card.querySelector("[data-undo]").addEventListener("click", () => history.pop()?.());
  card.querySelector(".scratch").addEventListener("toggle", (event) => {
    if (!event.currentTarget.open) use("off");
    surfaces.forEach((draw) => draw());
  });
});
