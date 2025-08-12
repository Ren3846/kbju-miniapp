(function () {
  "use strict";

  // Telegram WebApp SDK
  const tg =
    window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;

  // Elements
  const form = document.getElementById("kbjuForm");
  const btnCalc = document.getElementById("calcBtn");
  const btnReset = document.getElementById("resetBtn");
  const btnSend = document.getElementById("sendToBotBtn");
  const alertBox = document.getElementById("formAlert");
  const greetingEl = document.getElementById("greeting");

  const inputWeight = document.getElementById("weight");
  const inputHeight = document.getElementById("height");
  const inputAge = document.getElementById("age");
  const selectActivity = document.getElementById("activity");

  const resultsCard = document.getElementById("resultsCard");
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

    return { ok, weight, height, age, activity };
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
    const deficit = tdee * 0.8; // -20%

    bmrValue.textContent = Math.round(bmr);
    tdeeValue.textContent = Math.round(tdee);
    deficitCal.textContent = Math.round(deficit);

    for (let i = 1; i <= 4; i++) {
      fillWeek(i, deficit);
    }

    resultsCard.hidden = false;
    btnSend.hidden = false;

    showAlert("Готово! Проверьте результаты ниже.", "ok");
    haptic("success");

    // Telegram MainButton integration
    if (tg) {
      try {
        tg.MainButton.setText("Отправить результаты боту");
        tg.MainButton.show();
        tg.MainButton.onClick(() => {
          sendToBot();
        });
      } catch {
        /* noop */
      }
    }
  }

  function getUserName() {
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
      const u = tg.initDataUnsafe.user;
      const name = [u.first_name, u.last_name].filter(Boolean).join(" ");
      return name || u.username || null;
    }
    return null;
  }

  function sendToBot() {
    // Compose payload
    const payload = {
      name: getUserName(),
      weight: Number(inputWeight.value),
      height: Number(inputHeight.value),
      age: Number(inputAge.value),
      activity: Number(selectActivity.value),
      bmr: Number(bmrValue.textContent),
      tdee: Number(tdeeValue.textContent),
      deficit: Number(deficitCal.textContent),
      weeks: [1, 2, 3, 4].map((i) => ({
        week: i,
        calories: Number(calW[i].textContent),
        protein: Number(pW[i].textContent),
        fat: Number(fW[i].textContent),
        carbs: Number(cW[i].textContent),
      })),
    };

    const json = JSON.stringify(payload);

    if (tg) {
      try {
        tg.sendData(json); // отправка в Data из WebApp
        showAlert("Отправлено боту.", "ok");
        haptic("success");
      } catch {
        showAlert("Не удалось отправить боту. Попробуйте снова.", "error");
        haptic("error");
      }
    } else {
      // Fallback: просто копируем в буфер
      navigator.clipboard?.writeText(json);
      showAlert("Скопировано в буфер обмена (вне Telegram).", "ok");
    }
  }

  function resetAll() {
    form.reset();
    clearAlert();
    resultsCard.hidden = true;
    btnSend.hidden = true;
    if (tg) {
      try {
        tg.MainButton.hide();
      } catch {}
    }
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
  btnSend.addEventListener("click", sendToBot);

  // Live validation on blur
  [inputWeight, inputHeight, inputAge, selectActivity].forEach((el) => {
    el.addEventListener("blur", () => {
      validate();
    });
  });

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
