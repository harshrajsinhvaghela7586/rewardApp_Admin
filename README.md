# Visezy Admin Web

Responsive Next.js admin panel for the supplied Express admin API.

1. `npm install`
2. Copy `.env.local.example` to `.env.local`
3. Set `NEXT_PUBLIC_API_URL=http://localhost:5000/api`
4. `npm run dev`
5. Laptop: `http://localhost:3000/login`
6. Phone on same Wi-Fi: `http://YOUR-PC-LAN-IP:3000/login`

The Applications screen intentionally uses `/api/admin/users` because the supplied backend has no separate applications endpoint. Referral and Reports pages are not fabricated because their backend endpoints were not supplied.
