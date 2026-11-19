# Clipnaa

Clipnaa turns one long video into ranked vertical clips for Reels, Shorts and TikTok. Each clip comes with captions, hashtags and a profile setup in Arabic, English or both. It's sold as a monthly subscription through Paddle.

```
web/        Next.js 16 app: landing page (Arabic and English), login, dashboard, billing, API routes
worker/     Python worker on Modal: transcribe (Whisper on GPU), pick moments (Claude), render (ffmpeg)
supabase/   Database schema: profiles and quotas, jobs, clips, row level security
```

How a video flows through the system:

1. The browser uploads the video straight to Cloudflare R2 using a signed URL from `/api/upload-url`.
2. `/api/jobs` checks the user's remaining minutes, creates a job row and calls the worker endpoint.
3. The worker transcribes the video, asks Claude for the best moments and the copy, renders 1080x1920 clips and uploads them to R2. It then saves the clip rows and charges minutes once per job.
4. The dashboard refreshes until the job is done. The job page plays each clip and shows the copy for each platform.
5. Paddle webhooks (`/api/paddle/webhook`) set the user's plan and quota, and reset their minutes on each renewal.

## Setup (one time, about 1 hour)

### 1. Supabase (database and login)
1. Create a project at supabase.com. Then open **SQL editor**, paste `supabase/migrations/0001_init.sql` and run it.
2. Under **Authentication → URL configuration**, set the Site URL to your domain, for example `https://clipnaa.com`. Add `https://clipnaa.com/auth/callback` and `http://localhost:3000/auth/callback` as redirect URLs.
3. Optional: under **Authentication → Providers → Google**, turn on Google sign-in.
4. Copy the project URL, the anon key and the service role key from **Project settings → API**.

### 2. Cloudflare R2 (video storage)
1. Create a bucket named `clipnaa`, then create an API token with read and write access to it.
2. Under **Bucket → Settings → CORS policy**, allow `PUT` and `GET` from your domain and `http://localhost:3000`, with header `content-type`.
3. Under **Bucket → Settings → Object lifecycle rules**, delete objects after 14 days. The landing page promises this.

### 3. Modal (the worker)
```bash
pip install modal && modal setup
modal secret create clipnaa \
  ANTHROPIC_API_KEY=... WORKER_SECRET=<long random string> \
  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  R2_ACCOUNT_ID=... R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... R2_BUCKET=clipnaa
cd worker && modal deploy modal_app.py
```
`modal deploy` prints the URL of the `enqueue` endpoint. Put that URL in `WORKER_URL` below. The GPU worker scales to zero, so you pay only while videos are processing.

### 4. Paddle (payments)
1. Start in a **sandbox** account at sandbox-vendors.paddle.com.
2. Under **Catalog → Products**, create Creator, Pro and Agency products, each with a monthly price ($19, $49, $129). Copy the three price IDs (`pri_...`).
3. Under **Developer tools → Authentication**, create a client-side token.
4. Under **Developer tools → Notifications**, add `https://<your-domain>/api/paddle/webhook`, subscribe to all `subscription.*` events, and copy the secret key.
5. When you're ready to sell, do the same in the live account and set `NEXT_PUBLIC_PADDLE_ENV=production`. Paddle has to approve your domain first, which requires live terms, privacy and refund pages.

### 5. The web app
```bash
cd web
cp .env.example .env.local   # fill in every value
npm install
npm run dev                  # http://localhost:3000
```
To deploy, import the repository in Vercel, set the **Root directory** to `web`, add the same environment variables, and connect your domain.

## Tests
```bash
python -m pytest worker/tests   # the worker pipeline with fake storage and AI (needs ffmpeg)
cd web && npm run build && npm run lint
```

## Not built yet
- Posting to YouTube, Instagram and TikTok from Clipnaa. The OAuth apps need platform review, so submit those early.
- Terms, privacy and refund pages. Paddle requires them before approving the live account.
- Annual plans, extra-minute packs, brand kit, teams, scheduling.
