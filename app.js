(function () {
  "use strict";

  // Telegram WebApp SDK
  const tg =
    window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;

  // Elements
  const form = document.getElementById("kbjuForm");
  const btnCalc = document.getElementById("calcBtn");
  const btnReset = document.getElementById("resetBtn");
  const btnShare = document.getElementById("shareBtn");
  const btnRepeat = document.getElementById("repeatBtn");
  const alertBox = document.getElementById("formAlert");
  const greetingEl = document.getElementById("greeting");

  const inputWeight = document.getElementById("weight");
  const inputHeight = document.getElementById("height");
  const inputAge = document.getElementById("age");
  const selectActivity = document.getElementById("activity");
  const selectGoal = document.getElementById("goal");

  const resultsCard = document.getElementById("resultsCard");
  const formCard = document.getElementById("formCard");
  const bmrValue = document.getElementById("bmrValue");
  const tdeeValue = document.getElementById("tdeeValue");
  const deficitCal = document.getElementById("deficitCal");

  const calW = [
    null,
    document.getElementById("calW1"),
    document.getElementById("calW2"),
    document.getElementById("calW3"),
    document.getElementById("calW4"),
  ];
  const pW = [
    null,
    document.getElementById("pW1"),
    document.getElementById("pW2"),
    document.getElementById("pW3"),
    document.getElementById("pW4"),
  ];
  const fW = [
    null,
    document.getElementById("fW1"),
    document.getElementById("fW2"),
    document.getElementById("fW3"),
    document.getElementById("fW4"),
  ];
  const cW = [
    null,
    document.getElementById("cW1"),
    document.getElementById("cW2"),
    document.getElementById("cW3"),
    document.getElementById("cW4"),
  ];

  // Haptics helpers
  function haptic(type) {
    if (!tg || !tg.HapticFeedback) return;
    try {
      if (type === "success") tg.HapticFeedback.notificationOccurred("success");
      else if (type === "warning")
        tg.HapticFeedback.notificationOccurred("warning");
      else if (type === "error")
        tg.HapticFeedback.notificationOccurred("error");
      else if (type === "light") tg.HapticFeedback.impactOccurred("light");
      else if (type === "medium") tg.HapticFeedback.impactOccurred("medium");
      else if (type === "heavy") tg.HapticFeedback.impactOccurred("heavy");
    } catch {
      /* noop */
    }
  }

  // UI helpers
  function showAlert(message, variant) {
    alertBox.textContent = message;
    alertBox.hidden = false;
    alertBox.classList.remove("alert--error", "alert--ok");
    if (variant === "error") alertBox.classList.add("alert", "alert--error");
    else if (variant === "ok") alertBox.classList.add("alert", "alert--ok");
    else alertBox.classList.add("alert");
  }
  function clearAlert() {
    alertBox.hidden = true;
    alertBox.textContent = "";
    alertBox.className = "alert";
  }
  function setFieldError(input, message) {
    const holder = document.querySelector(
      `.field-error[data-error-for="${input.id}"]`
    );
    if (holder) {
      holder.textContent = message || "";
    }
    input.setAttribute("aria-invalid", message ? "true" : "false");
  }

  // Validation
  function parseNumber(input) {
    const v = input.value.replace(",", ".");
    return v === "" ? NaN : Number(v);
  }
  function validate() {
    let ok = true;
    clearAlert();

    const weight = parseNumber(inputWeight);
    if (Number.isNaN(weight) || weight < 35 || weight > 200) {
      setFieldError(inputWeight, "Введите вес от 35 до 200 кг");
      ok = false;
    } else {
      setFieldError(inputWeight, "");
    }

    const height = parseNumber(inputHeight);
    if (Number.isNaN(height) || height < 130 || height > 220) {
      setFieldError(inputHeight, "Введите рост от 130 до 220 см");
      ok = false;
    } else {
      setFieldError(inputHeight, "");
    }

    const age = parseNumber(inputAge);
    if (!Number.isInteger(age) || age < 14 || age > 80) {
      setFieldError(inputAge, "Введите возраст от 14 до 80 лет (целое число)");
      ok = false;
    } else {
      setFieldError(inputAge, "");
    }

    const activity = Number(selectActivity.value);
    if (!activity) {
      setFieldError(selectActivity, "Выберите активность");
      ok = false;
    } else {
      setFieldError(selectActivity, "");
    }

    const goal = selectGoal.value;
    if (!goal) {
      setFieldError(selectGoal, "Выберите цель");
      ok = false;
    } else {
      setFieldError(selectGoal, "");
    }

    return { ok, weight, height, age, activity, goal };
  }

  // Calculations (женская формула Mifflin-St Jeor)
  function calcBmrFemale(weight, height, age) {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
  function round1(n) {
    return Math.round(n * 10) / 10;
  }

  function distributeMacros(calories) {
    // 30% protein, 30% fat, 40% carbs
    const protein = round1((calories * 0.3) / 4);
    const fat = round1((calories * 0.3) / 9);
    const carbs = round1((calories * 0.4) / 4);
    return { protein, fat, carbs };
  }

  function fillWeek(weekIdx, calories) {
    const macros = distributeMacros(calories);
    calW[weekIdx].textContent = Math.round(calories);
    pW[weekIdx].textContent = macros.protein.toFixed(1);
    fW[weekIdx].textContent = macros.fat.toFixed(1);
    cW[weekIdx].textContent = macros.carbs.toFixed(1);
  }

  function computeAndRender(data) {
    const bmr = calcBmrFemale(data.weight, data.height, data.age);
    const tdee = bmr * data.activity;

    // Расчёт калорий в зависимости от цели
    let targetCalories;
    let goalText;
    if (data.goal === "lose") {
      targetCalories = tdee * 0.8; // -20% для похудения
      goalText = "дефицит 20%";
    } else {
      targetCalories = tdee * 1.2; // +20% для набора массы
      goalText = "профицит 20%";
    }

    bmrValue.textContent = Math.round(bmr);
    tdeeValue.textContent = Math.round(tdee);
    deficitCal.textContent = Math.round(targetCalories);

    // Обновляем заголовок с указанием цели
    const goalLabel = document.querySelector(".total--accent");
    goalLabel.innerHTML = `Калории в день (${goalText}): <span id="deficitCal">${Math.round(
      targetCalories
    )}</span> ккал`;

    for (let i = 1; i <= 4; i++) {
      fillWeek(i, targetCalories);
    }

    // Показываем результаты сверху, скрываем форму
    resultsCard.hidden = false;
    formCard.hidden = true;

    showAlert("Готово! Проверьте результаты выше.", "ok");
    haptic("success");
  }

  function getUserName() {
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
      const u = tg.initDataUnsafe.user;
      const name = [u.first_name, u.last_name].filter(Boolean).join(" ");
      return name || u.username || null;
    }
    return null;
  }

  function shareResults() {
    const goalText = document
      .querySelector(".total--accent")
      .textContent.includes("дефицит")
      ? "дефицит 20%"
      : "профицит 20%";
    const text = `Калькулятор КБЖУ от @viksi666

Мой план питания на 4 недели:

📊 Основные показатели:
• BMR (основной обмен): ${bmrValue.textContent} ккал
• TDEE (расход в день): ${tdeeValue.textContent} ккал  
• Целевые калории (${goalText}): ${deficitCal.textContent} ккал/день

📋 Еженедельный план (30% белки, 30% жиры, 40% углеводы):

Неделя 1:
• Калории: ${calW[1].textContent} ккал/день
• Белки: ${pW[1].textContent} г
• Жиры: ${fW[1].textContent} г
• Углеводы: ${cW[1].textContent} г

Неделя 2:
• Калории: ${calW[2].textContent} ккал/день
• Белки: ${pW[2].textContent} г
• Жиры: ${fW[2].textContent} г
• Углеводы: ${cW[2].textContent} г

Неделя 3:
• Калории: ${calW[3].textContent} ккал/день
• Белки: ${pW[3].textContent} г
• Жиры: ${fW[3].textContent} г
• Углеводы: ${cW[3].textContent} г

Неделя 4:
• Калории: ${calW[4].textContent} ккал/день
• Белки: ${pW[4].textContent} г
• Жиры: ${fW[4].textContent} г
• Углеводы: ${cW[4].textContent} г

💪 Создай тело мечты: https://viksi666.ru`;

    if (navigator.share) {
      navigator
        .share({
          title: "Мой план КБЖУ на 4 недели",
          text: text,
          url: "https://viksi666.ru",
        })
        .then(() => {
          showAlert("Поделились результатами!", "ok");
          haptic("success");
        })
        .catch(() => {
          copyToClipboard(text);
        });
    } else {
      copyToClipboard(text);
    }
  }

  function saveResults() {
    const goalText = document
      .querySelector(".total--accent")
      .textContent.includes("дефицит")
      ? "дефицит 20%"
      : "профицит 20%";
    const data = {
      name: getUserName(),
      weight: Number(inputWeight.value),
      height: Number(inputHeight.value),
      age: Number(inputAge.value),
      activity: Number(selectActivity.value),
      goal: selectGoal.value,
      goalText: goalText,
      bmr: Number(bmrValue.textContent),
      tdee: Number(tdeeValue.textContent),
      targetCalories: Number(deficitCal.textContent),
      weeks: [1, 2, 3, 4].map((i) => ({
        week: i,
        calories: Number(calW[i].textContent),
        protein: Number(pW[i].textContent),
        fat: Number(fW[i].textContent),
        carbs: Number(cW[i].textContent),
      })),
    };

    const json = JSON.stringify(data, null, 2);
    copyToClipboard(json);
    showAlert("Результаты скопированы в буфер обмена!", "ok");
    haptic("success");
  }

  function copyToClipboard(text) {
    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        showAlert("Скопировано в буфер обмена!", "ok");
        haptic("success");
      })
      .catch(() => {
        showAlert("Не удалось скопировать. Попробуйте снова.", "error");
        haptic("error");
      });
  }

  function resetAll() {
    form.reset();
    clearAlert();
    resultsCard.hidden = true;
    formCard.hidden = false;
  }

  function repeatCalculation() {
    resetAll();
    showAlert("Введите новые данные для расчёта.", "ok");
    haptic("light");
  }

  function greet() {
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
      const name = getUserName();
      const mention = name ? `Привет, ${name}!` : "Привет!";
      greetingEl.textContent = `${mention} Заполните поля ниже, и я подсчитаю ваш план питания.`;
      try {
        haptic("light");
      } catch {}
    } else {
      greetingEl.textContent =
        "Заполните поля ниже, и я подсчитаю ваш план питания.";
    }
  }

  // Events
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const res = validate();
    if (!res.ok) {
      showAlert("Исправьте ошибки в форме.", "error");
      haptic("error");
      return;
    }
    computeAndRender(res);
  });

  btnReset.addEventListener("click", resetAll);
  btnShare.addEventListener("click", shareResults);
  btnRepeat.addEventListener("click", repeatCalculation);

  // Live validation on blur
  [inputWeight, inputHeight, inputAge, selectActivity, selectGoal].forEach(
    (el) => {
      el.addEventListener("blur", () => {
        validate();
      });
    }
  );

  // Telegram theme / viewport tweaks
  if (tg) {
    try {
      tg.expand();
      tg.enableClosingConfirmation();
      const theme = tg.themeParams || {};
      // could map theme colors, but we already have dark theme
    } catch {
      /* noop */
    }
  }

  greet();
})();
