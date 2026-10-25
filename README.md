# Pittsburgh Auto - Service Booking Website

A website for an auto repair shop in Moon Township, PA. Customers pick a service, choose a free time slot, pay online and get a confirmation by **email and SMS**. The shop is notified by email and SMS about every new booking and every received payment.

## Features

- **Service catalog** - 12 services (oil change, brakes, tires, alignment, diagnostics, AC, transmission, inspection, detailing and more) with prices and durations.
- **Live availability** - free time slots are calculated from business hours, service duration and existing bookings. Double bookings are rejected.
- **Online payment** - card payment through Stripe Checkout, plus a built-in TEST payment page so the whole flow can be tried without any account or real money.
- **Customer notifications**
  - on booking: email "complete your payment" (the slot is held for 30 minutes);
  - on payment: email **and** SMS, for example
    `Pittsburgh Auto: Payment received! Your Oil Change is booked for Tuesday, November 3 at 11:00 AM. Booking BK-00002. ...`
- **Shop notifications** - email and SMS to the shop for every new booking ("waiting for payment") and every payment ("PAYMENT RECEIVED $89.00 ... Please check the card").
- **Safe by design** - each message is sent only once, even if a payment is confirmed twice; unpaid bookings release their slot after 30 minutes; old databases are upgraded automatically.
- **Pages** - Home, Services, Booking, Location & Hours, About.

## Tech stack

| Part | Technology |
|------|------------|
| Frontend | React 19, TypeScript, Vite, React Router, Tailwind CSS, lucide-react |
| Backend | Python, FastAPI, SQLAlchemy, Pydantic |
| Database | SQLite by default (any SQLAlchemy database via `DATABASE_URL`) |
| Payments | Stripe Checkout (webhook) or built-in test mode |
| Email | any SMTP server (Gmail, SendGrid, Mailgun, Amazon SES) |
| SMS | Twilio |

## Project structure

```
pittsburgh-auto-dealership/
├── backend/
│   ├── app/
│   │   ├── main.py            FastAPI app, CORS, startup
│   │   ├── config.py          settings from .env
│   │   ├── models.py          Booking table
│   │   ├── schemas.py         request/response models
│   │   ├── database.py        engine, sessions, automatic column upgrade
│   │   ├── services_data.py   services, prices, durations
│   │   ├── business_hours.py  opening hours, slot length, booking window
│   │   ├── availability.py    free-slot logic
│   │   ├── payments.py        checkout, test payment page, Stripe webhook
│   │   ├── notifications.py   email (SMTP) and SMS (Twilio)
│   │   └── routers/           /api/services, /api/bookings
│   ├── tests/                 automated tests (pytest)
│   ├── notify_test.py         sends one test email and one test SMS
│   ├── requirements.txt
│   └── .env.example           copy to .env and fill in
└── frontend/
    ├── src/pages/             Home, Services, Booking, Location, About
    ├── src/components/        Navbar, Hero, ServiceCard, Footer, ...
    ├── src/services/          API client (bookingApi.ts)
    └── src/data/              business info, service list
```

## Getting started

Requirements: **Python 3.11+** and **Node.js 20.19+ (or 22.12+)**.

### 1. Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
copy .env.example .env
.venv\Scripts\python -m uvicorn app.main:app --reload
```

(macOS / Linux: `source .venv/bin/activate`, `cp .env.example .env`, `uvicorn app.main:app --reload`.)

The API runs on http://localhost:8000. Interactive API docs: http://localhost:8000/docs

### 2. Frontend

Tailwind CSS is installed in the project root, so run `npm install` there as well as in `frontend`:

```powershell
npm install            # in the project root (Tailwind)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. If the API is not on `localhost:8000`, set `VITE_API_BASE_URL` in `frontend/.env`.

### 3. Try it (test mode, nothing to configure)

1. Open **Book Appointment**, pick a service, date, time and fill in your details.
2. Press **Book & pay**. A TEST payment page opens (no real money).
3. Press **Pay (test)**. You are taken back to the "You're booked" page.
4. Look in `backend/outbox/`: every email and SMS is saved there as a text file.

## Configuration (`backend/.env`)

Copy `.env.example` to `.env`. **Never commit `.env`** - it holds secrets.

| Variable | Meaning |
|----------|---------|
| `PAYMENT_MODE` | `mock` (test page, default), `stripe` (real cards) or `off` (no payment step) |
| `PAYMENT_HOLD_MINUTES` | how long an unpaid booking holds its slot (default 30) |
| `FRONTEND_URL`, `API_PUBLIC_URL` | public addresses of the site and the API |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURITY`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | outgoing email. Empty = test mode (saved to `outbox/`) |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` | SMS. Empty = test mode |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe payments |
| `OWNER_EMAIL`, `OWNER_PHONE` | where the shop receives booking and payment alerts (phone as `+17247800707`) |
| `OWNER_NOTIFY_ON_BOOKING` | `true` = alert when booked and when paid, `false` = only when paid |
| `BUSINESS_NAME`, `BUSINESS_ADDRESS`, `BUSINESS_PHONE` | shown in messages |

### Going live

1. **Email** - fill in the `SMTP_*` values (Gmail: enable 2-step verification and create an "App password"). Check with:
   `.venv\Scripts\python notify_test.py you@example.com +14125550123`
2. **SMS** - create a Twilio account, buy a number and fill in `TWILIO_*`. US business texting requires A2P 10DLC registration.
3. **Payments** - set `PAYMENT_MODE=stripe` and the Stripe keys, then add a webhook in the Stripe Dashboard pointing to
   `https://YOUR-API-URL/api/payments/stripe/webhook` with the events `checkout.session.completed`,
   `checkout.session.async_payment_succeeded` and `checkout.session.expired`. Test with Stripe test keys first (card `4242 4242 4242 4242`).
4. **Hosting** - build the site with `npm run build` and deploy `frontend/dist` (Netlify, Vercel...). Add a file `frontend/public/_redirects` containing `/* /index.html 200` so page links work after a refresh. Deploy the backend to a server (Render, Railway, Fly.io...) and set `VITE_API_BASE_URL` to its address before building the frontend.

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/services` | list of services |
| GET | `/api/bookings/availability?date=YYYY-MM-DD&service_id=...` | free time slots |
| POST | `/api/bookings` | create a booking (status `pending_payment`, or `confirmed` if payments are off) |
| GET | `/api/bookings/{id}` | booking details and payment status |
| POST | `/api/bookings/{id}/checkout` | returns the payment page URL |
| POST | `/api/payments/stripe/webhook` | Stripe payment confirmation |
| GET / POST | `/api/payments/mock/{id}` and `/complete` | test payment page (`PAYMENT_MODE=mock` only) |

Booking statuses: `pending_payment` → `confirmed` (after payment) or `cancelled`. Business hours: Mon-Fri 8:00-19:00, Sat 9:00-15:00, closed Sunday; 30-minute slots, bookings up to 30 days ahead (see `backend/app/business_hours.py`).

## Tests

```powershell
cd backend
.venv\Scripts\python -m pip install pytest httpx
.venv\Scripts\python -m pytest
```

The tests cover the full payment flow, slot holding and expiry, notifications to the customer and to the shop, invalid phone numbers, the Stripe webhook signature and upgrading an old database.

## Security notes

- Keep `backend/.env` out of Git (it is listed in `.gitignore`). It contains your SMTP, Twilio and Stripe keys.
- `backend/dealership.db` contains customer names, phones and emails - do not publish it.
- Stripe webhooks are verified by signature; forged requests are rejected.
- The TEST payment page works only when `PAYMENT_MODE=mock`. Never use that mode in production.

## License

Add your license here.
