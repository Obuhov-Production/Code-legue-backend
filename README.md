# Code League Backend

Backend-частина платформи **Code League** для проведення IT-турнірів.

Проєкт реалізований на **NestJS** та забезпечує API, авторизацію, realtime-взаємодію, турнірну логіку, систему ролей, чат, OAuth, email-сервіси та адміністрування платформи.

## Про проєкт

**Code League** — це вебплатформа для організації та проведення IT-турнірів, командної взаємодії та оцінювання конкурсних робіт.

Backend відповідає за:

* авторизацію та автентифікацію користувачів;
* JWT-сесії та захист API;
* OAuth-вхід через зовнішні сервіси;
* роботу з користувачами, командами й ролями;
* турнірну логіку;
* realtime-сповіщення та чати;
* email-підтвердження;
* завантаження й обробку медіа;
* систему модерації та адміністрування;
* інтеграцію з frontend-частиною платформи.

## Основні можливості

### Авторизація та безпека

* реєстрація та вхід;
* JWT-авторизація;
* OAuth через Google, GitHub і Discord;
* підтвердження email;
* bcrypt-хешування паролів;
* middleware та guards;

### Користувачі та ролі

* профілі користувачів;
* система ролей;
* редагування профілю;
* аватари та банери;
* статуси користувачів;
* можливість блокувати користувачів та модерація.

### Команди та турніри

* створення команд;
* керування учасниками;
* реєстрація на турніри;
* подання конкурсних робіт;
* турнірна логіка та етапи;
* таблиці лідерів.

### Realtime-функціонал

* Socket.IO gateway;
* realtime-сповіщення;
* чати;
* оновлення статусів користувачів;

### Email та медіа

* email-повідомлення через Nodemailer;
* підтвердження email;
* обробка зображень через Sharp;
* завантаження файлів.

### Адміністрування

* модерація користувачів;
* керування ролями;
* контроль турнірів і команд;

## Технологічний стек

### Core

* **Node.js** — серверне середовище;
* **NestJS 11** — backend framework;
* **TypeScript** — типізована розробка.

### Database

* **MySQL** — база даних;
* **TypeORM** — ORM для роботи з БД.

### Authentication

* **JWT** — токен-авторизація;
* **Passport** — authentication middleware;
* **Google OAuth**;
* **GitHub OAuth**;
* **Discord OAuth**.

### Realtime

* **Socket.IO**;
* **NestJS WebSockets**.

### Utilities

* **bcrypt** — хешування паролів;
* **Nodemailer** — email-сервіси;
* **Sharp** — обробка зображень;
* **class-validator** — валідація DTO;

## Архітектура проєкту

```text
src/
├─ common/                 # decorators, guards
├─ database/               # database config та інтеграція
├─ middleware/             # глобальні middleware
├─ modules/                # функціональні модулі застосунку
├─ app.controller.ts       # базовий controller
├─ app.module.ts           # root module
├─ app.service.ts          # базовий service
└─ main.ts                 # точка входу
```

### Принцип структури

Backend побудований за модульною архітектурою NestJS.

Кожен модуль зазвичай містить:

```text
module-name/
├─ controllers/
├─ services/
├─ dto/
├─ entities/
└─ module.ts
```

Це дозволяє:

* масштабувати платформу;
* ізолювати бізнес-логіку;
* легко підтримувати код;
* спрощувати командну розробку.

## Структура backend-модулів

У директорії `src/modules` знаходяться функціональні модулі платформи:

| Модуль | Призначення |
|---|---|
| `admin` | адміністративні функції та модерація |
| `ai` | AI-функціонал та інтеграції |
| `announcements` | системні анонси та повідомлення |
| `applications` | заявки та процеси подання |
| `auth` | авторизація, JWT, OAuth |
| `badges` | система бейджів і досягнень |
| `chat-messages` | повідомлення чатів |
| `chat-pinned` | закріплені повідомлення |
| `chat-reactions` | реакції на повідомлення |
| `chat-room` | чат-кімнати |
| `chat-room-settings` | налаштування чатів |
| `contact` | контактні форми та звернення |
| `email-verification` | підтвердження email |
| `evaluation` | логіка оцінювання |
| `evaluation-criteria` | критерії оцінювання |
| `evaluation-scores` | оцінки журі |
| `jury` | робота з журі |
| `jury-assignments` | призначення журі |
| `mail` | email-сервіси |
| `notifications` | сповіщення |
| `public` | публічні endpoint-и |
| `reviews` | відгуки та review-система |
| `rounds` | турнірні раунди |
| `submissions` | конкурсні роботи |
| `tasks` | турнірні завдання |
| `team-members` | учасники команд |
| `teams` | командна логіка |
| `tournaments` | турніри |
| `users` | користувачі та профілі |
| `webhooks` | webhook-інтеграції |


## Змінні середовища

Проєкт використовує `.env` для конфігурації.

Перед запуском створіть файл:

```bash
.env
```

Можна скопіювати шаблон:

```bash
cp .env.example .env
```

### Приклад конфігурації

```env
# Application
PORT=4001
NODE_ENV=development
FRONTEND_URL=http://localhost:4000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_DATABASE=code_league

# JWT
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:4001/auth/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:4001/auth/github/callback

# Discord OAuth
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_CALLBACK_URL=http://localhost:4001/auth/discord/callback

# Mail
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASSWORD=your_password
MAIL_FROM=Code League
```

## Встановлення та запуск

## 1. Клонування репозиторію

```bash
git clone https://github.com/your-username/code-league-backend.git
```

```bash
cd code-league-backend
```

## 2. Встановлення залежностей

```bash
npm install
```

## 3. Налаштування `.env`

Створіть `.env` на основі `.env.example`.

```bash
cp .env.example .env
```

Після цього заповніть усі необхідні змінні середовища.

## 4. Запуск MySQL

Переконайтесь, що:

* MySQL встановлений;
* база даних створена;
* дані доступу збігаються з `.env`.

### Створення БД вручну

```sql
CREATE DATABASE code_league;
```

## 5. Запуск backend

### Development

```bash
npm run start:dev
```

або

```bash
npm run dev
```

Backend буде доступний за адресою:

```text
http://localhost:4001
```

## Інтеграція з frontend

Backend працює разом із frontend-частиною **Code League**.

За замовчуванням frontend очікує API:

```text
http://localhost:4001
```

Backend підтримує:

* REST API;
* Socket.IO realtime connection;
* OAuth redirect flow;
* JWT authentication.

## API та архітектура

Backend побудований за принципами:

* controller → service → repository;
* DTO + validation;
* dependency injection;
* modular architecture;
* guards/interceptors/middleware;
* realtime gateway architecture.

## Безпека

У проєкті реалізовано:

* JWT authentication;
* bcrypt password hashing;
* route guards;
* DTO validation;
* OAuth verification;
* environment-based secrets.

## NPM-скрипти

| Скрипт                | Призначення                   |
| --------------------- | ----------------------------- |
| `npm run dev`         | запуск backend у watch-режимі |
| `npm run start`       | стандартний запуск NestJS     |
| `npm run start:dev`   | development-запуск            |
| `npm run start:debug` | запуск із debug-mode          |
| `npm run build`       | production build              |
| `npm run start:prod`  | запуск production build       |
| `npm run lint`        | ESLint перевірка              |
| `npm run format`      | форматування Prettier         |
| `npm run test`        | unit tests                    |
| `npm run test:watch`  | watch-mode тестів             |
| `npm run test:cov`    | coverage tests                |
| `npm run test:e2e`    | end-to-end тести              |


## Статус проєкту

Проєкт перебуває в активній розробці та постійно розширюється разом із frontend-частиною платформи **Code League**.

## Команда


- Назва : Obuhov-Production;
- Учасники : Abetik, SHK_Igor, Misha;
- Посилання на frontend-репозиторій: https://github.com/Obuhov-Production/Code__League-Frontend;
- Посилання на backend-репозиторій: https://github.com/Obuhov-Production/Code-legue-backend;


## License

Проєкт створений для платформи **Code League**.
