# GI Football Bot

لعبة بطاقات كرة قدم عربية داخل Discord.

## الأوامر

- `باك` — فتح باك مجاني كل 6 ساعات
- `بطاقاتي` — عرض أفضل بطاقاتك
- `فريقي` — عرض أفضل تشكيلة
- `يومي` — مكافأة يومية
- `رصيدي` — عرض الرصيد
- `مساعدة` — عرض الأوامر

## التشغيل

1. غيّر اسم `.env.example` إلى `.env`.
2. ضع توكن البوت ورابط MongoDB.
3. شغّل:

```bash
npm install
npm start
```

## Discord Developer Portal

فعّل Message Content Intent و Server Members Intent.

## Render

- Build Command: `npm install`
- Start Command: `npm start`
- أضف `DISCORD_TOKEN` و `MONGO_URI` إلى Environment Variables.

مولّد البطاقات يدعم `imageUrl` داخل `data/players.json`. إذا بقي فارغاً، يصنع بطاقة بديلة بالأحرف الأولى من اسم اللاعب.
