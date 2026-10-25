# Yangi: Email + SMS + To'lov

## Nima qo'shildi
1. **Bron qilinganda** mijozga email ketadi: "To'lovni yakunlang" (joy 30 daqiqa ushlab turiladi).
2. **To'lov qilinganda** mijozga **email + SMS** ketadi, masalan:
   `Pittsburgh Auto: Payment received! Your Oil Change is booked for Tuesday, November 3 at 11:00 AM. Booking BK-00002. ...`
3. Siz (egasi) `OWNER_EMAIL` orqali har bir to'langan bron haqida nusxa olasiz (ixtiyoriy).
4. Ikki marta to'lov yoki Stripe qayta yuborsa ham xabar **bir marta** ketadi.
5. To'lanmagan bron 30 daqiqadan keyin vaqtni bo'shatadi.
6. Eski `dealership.db` o'zi yangilanadi, eski bronlar saqlanadi.

## Ishga tushirish
```
cd backend
pip install -r requirements.txt          (stripe qo'shildi)
copy .env.example .env                   (Windows)   yoki   cp .env.example .env
uvicorn app.main:app --reload
```
Frontend avvalgidek: `cd frontend && npm install && npm run dev`

## Sinov rejimi (hozirgi standart, hech narsa kerak emas)
`.env` da `PAYMENT_MODE=mock` va SMTP/Twilio bo'sh bo'lsa:
- to'lov sahifasi TEST (haqiqiy pul yo'q),
- email va SMS yuborilmaydi, **backend/outbox/** papkasiga matn fayl bo'lib tushadi.
Shu bilan butun oqimni ko'rib chiqing.

## Haqiqiy email (SMTP)
`.env` ga yozing (Gmail misoli: 2 bosqichli tasdiqlashni yoqing va "App password" yarating):
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURITY=starttls
SMTP_USER=sizning@gmail.com
SMTP_PASSWORD=<app password>
SMTP_FROM=sizning@gmail.com
```
Sinash: `python notify_test.py mening@email.com +14125550123`
Biznes uchun Gmail o'rniga SendGrid / Mailgun / Amazon SES SMTP ma'lumotlarini qo'ying (spamga kam tushadi).

## Haqiqiy SMS (Twilio)
Twilio akkaunt oching va `.env` ga yozing:
```
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+1...
```
Muhim: AQShda biznes SMS yuborish uchun Twilio'da **A2P 10DLC** ro'yxatdan o'tish kerak, aks holda xabarlar bloklanishi mumkin.

## Haqiqiy to'lov (Stripe)
1. stripe.com da akkaunt oching. `.env`: `PAYMENT_MODE=stripe`, `STRIPE_SECRET_KEY=sk_...`
2. Stripe Dashboard -> Developers -> Webhooks -> endpoint qo'shing:
   `https://SIZNING-BACKEND-MANZIL/api/payments/stripe/webhook`
   Hodisalar: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`.
   Berilgan `whsec_...` ni `STRIPE_WEBHOOK_SECRET` ga yozing.
3. `FRONTEND_URL` va `API_PUBLIC_URL` ni haqiqiy manzillarga o'zgartiring.

Avval Stripe **test kalitlari** (`sk_test_`) bilan sinang (karta 4242 4242 4242 4242).
Webhook internetda ochiq backend talab qiladi (localhost ishlamaydi; sinash uchun Stripe CLI yoki ngrok).

## To'lovsiz variant
`PAYMENT_MODE=off`: bron darrov tasdiqlanadi va email + SMS ketadi ("Your Oil Change is booked for ...").

## Xavfsizlik
- `.env` faylini hech kimga yubormang va GitHub'ga yuklamang (kalitlar shu yerda).
- Zip ichida `venv` papkasi yo'q: o'zingizniki ishlaydi, faqat `pip install -r requirements.txt` ni qayta bajaring.

## O'zgargan/yangi fayllar
- backend yangi: `app/config.py`, `app/notifications.py`, `app/payments.py`, `.env.example`, `notify_test.py`, `tests/`
- backend o'zgargan: `app/main.py`, `app/models.py`, `app/schemas.py`, `app/database.py`, `app/availability.py`, `app/routers/bookings.py`, `requirements.txt`
- frontend: `src/pages/Booking.tsx`, `src/services/bookingApi.ts`

Testlar: `cd backend && pip install pytest httpx && pytest`
