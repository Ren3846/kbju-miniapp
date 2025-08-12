# Калькулятор КБЖУ (жен) — viksi666

Тёмная тема с розовым акцентом, валидации, хаптик/вибрации и интеграция с Telegram Mini App (WebApp SDK: MainButton, sendData, приветствие по имени).

- Без бэкенда и БД. Всё на фронтенде.
- Поддержка запуска в Telegram Mini App.

## Структура

```
index.html   # разметка + подключение Telegram SDK
styles.css   # тёмная тема, розовые акценты
app.js       # логика: валидации, расчёты, интеграция с Telegram
```

## Как запустить локально

1. Откройте папку проекта в VS Code/любом редакторе.
2. Запустите простой сервер (любой вариант):
   - Python 3: `python3 -m http.server 5173`
   - Node (npm i -g serve): `serve -l 5173` или `npx serve -l 5173`
   - или любой статический сервер.
3. Откройте в браузере: `http://localhost:5173`.

> Поддержка Telegram API локально ограничена. В браузере вне Telegram работает без отправки данных боту — данные копируются в буфер.

## Подготовка под Telegram Mini App

Мини-приложение — это обычный фронтенд, доступный по HTTPS. Шаги:

1. Хостинг (любой статика-хостинг с HTTPS):
   - GitHub Pages, Netlify, Vercel, Firebase Hosting, Cloudflare Pages и т.п.
   - Сборка не требуется — достаточно загрузить три файла: `index.html`, `styles.css`, `app.js`.
2. Получите публичную ссылку на `index.html`, например: `https://yourdomain.com/kbju/index.html`.
3. Создайте бота в Telegram: напишите `@BotFather` → `/newbot` → следуйте инструкциям, получите токен.
4. Включите режим WebApp:
   - Команда `/setdomain` у BotFather → укажите домен, где размещён ваш `index.html`.
   - По желанию добавьте меню: `/setmenu` → добавьте кнопку с типом Web App и URL.
   - Можно также использовать in-chat команду и отправлять кнопку Web App через вашего бота.

### Пример отправки WebApp-кнопки (если у вас есть бэкенд бота)

```python
# python-telegram-bot (пример)
from telegram import Update, WebAppInfo, KeyboardButton, ReplyKeyboardMarkup
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    kb = [[KeyboardButton(text="Калькулятор КБЖУ", web_app=WebAppInfo(url="https://yourdomain.com/kbju/index.html"))]]
    await update.message.reply_text("Открой мини-приложение", reply_markup=ReplyKeyboardMarkup(kb, resize_keyboard=True))

app = ApplicationBuilder().token("<TOKEN>").build()
app.add_handler(CommandHandler("start", start))
app.run_polling()
```

Без бэкенда можно добавить кнопку Web App в меню бота через `@BotFather`.

## Как бот получит данные

В `app.js` используется `Telegram.WebApp.sendData(json)`. Когда пользователь нажимает кнопку «Отправить результаты боту», в ваш бот прилетит апдейт с `web_app_data` (в `message`). Вы можете обработать это в бэкенде бота, например:

```python
# python-telegram-bot: обработчик web_app_data
from telegram import Update
from telegram.ext import ContextTypes
import json

async def on_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.message and update.message.web_app_data:
        data = json.loads(update.message.web_app_data.data)
        # data = { name, weight, height, age, activity, bmr, tdee, deficit, weeks: [...] }
        await update.message.reply_text(
            f"Принял данные. Дефицит калорий: {data['deficit']} ккал/день\n"
            f"Белки: {data['weeks'][0]['protein']} г, Жиры: {data['weeks'][0]['fat']} г, Углеводы: {data['weeks'][0]['carbs']} г"
        )
```

## Валидации и формулы

- Формула BMR (жен): Mifflin–St Jeor: `10*вес + 6.25*рост - 5*возраст - 161`
- TDEE = BMR × активность
- Дефицит = TDEE × 0.8 (−20%)
- Распределение макро на день: 30% белки, 30% жиры, 40% углеводы
- Четыре недели — одинаковый план дефицита (-20%)

## Как упаковать и отдать

- Ничего собирать не нужно — это статика.
- Загрузите три файла (`index.html`, `styles.css`, `app.js`) на HTTPS-хостинг.
- В `@BotFather` укажите домен и добавьте кнопку Web App.

## Тестирование в Telegram

1. Откройте чат с ботом → кнопку Web App → откроется ваше мини‑приложение.
2. Введите данные, нажмите «Рассчитать».
3. Проверьте результаты, нажмите «Отправить боту». Бот получит JSON в `web_app_data`.

## Кастомизация

- Проценты макросов можно изменить в `app.js` в функции `distributeMacros`.
- Диапазоны валидаций — там же, в `validate()`.
- Тема — в `styles.css` через переменные `--accent`, `--bg` и пр.
