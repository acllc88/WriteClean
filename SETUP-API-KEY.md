# How to Add Your API Key (2 minutes)

Your API key is NEVER in the code files.
It lives securely in Netlify's environment variables.

## Step 1 — Deploy the site to Netlify first
Drag the writeclean folder to netlify.com/drop

## Step 2 — Add the API key
1. Go to your Netlify site dashboard
2. Click **Site configuration** (left sidebar)
3. Click **Environment variables**
4. Click **Add a variable**
5. Set:
   - Key:   OPENROUTER_API_KEY
   - Value: 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
6. Click **Save**

## Step 3 — Redeploy
After adding the variable, click **Deploys** → **Trigger deploy** → **Deploy site**

## Step 4 — Test
Visit your site, paste any text, click Check Grammar.
It should work within seconds.

## How it works (why this is secure)
Browser → calls /api/grammar on YOUR site (Netlify Edge Function)
         → Edge Function adds the API key server-side
         → calls OpenRouter
         → returns result to browser

The API key is NEVER sent to the browser. It only exists on Netlify's servers.
