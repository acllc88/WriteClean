# How to Add Your Groq API Key to Vercel

## Step 1 — Get a free Groq API key
1. Go to console.groq.com
2. Sign up free — no credit card needed
3. Click "API Keys" → "Create API Key"
4. Copy the key (starts with gsk_...)

## Step 2 — Add to Vercel
1. Go to vercel.com/dashboard
2. Click your writeclean project
3. Click Settings → Environment Variables
4. Click Add New:
   - Name:  GROQ_API_KEY
   - Value: [paste your key here]
   - Check: Production + Preview + Development
5. Click Save

## Step 3 — Redeploy
Deployments tab → 3 dots on latest deploy → Redeploy

## Step 4 — Test
Visit your site → paste any text → click Check Grammar ✓

## Why the key must NOT be in files
The API key must only live in Vercel's environment variables.
Never paste it into any file in the project — GitHub/Vercel
secret scanning will block your deployment.
