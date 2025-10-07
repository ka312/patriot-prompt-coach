// Minimal Gemini proxy so your API key stays on the server.
// Run with: node server/server.js (or `npm run server` after you add the script below)

import 'dotenv/config'
import express from 'express'
import cors from 'cors'

const app = express()
app.use(express.json())

// Allow your Vite dev origin
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['POST', 'OPTIONS'],
}))

// Accept multiple env var names so existing .env works without duplication
const API_KEY =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  process.env.VITE_GEMINI_API_KEY

const MODEL =
  process.env.GEMINI_MODEL ||
  process.env.VITE_GEMINI_MODEL ||
  'gemini-1.5-flash-latest'
const PORT = Number(process.env.PORT || 8787)

if (!API_KEY) {
  console.error('❌ Missing API key. Set one of GEMINI_API_KEY, GOOGLE_API_KEY, or VITE_GEMINI_API_KEY in your .env')
  process.exit(1)
}

const GEMINI_URL = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`

// Helper to call Gemini
async function callGemini(text, model = MODEL) {
  const res = await fetch(GEMINI_URL(model), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text }] }],
    }),
  })
  const data = await res.json()
  if (data?.error?.message) {
    throw new Error(data.error.message)
  }
  const out = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!out) throw new Error('Empty response from model')
  return out
}

// POST /api/rewrite { question: string, context?: string }
app.post('/api/rewrite', async (req, res) => {
  try {
    const { question, context, model } = req.body || {}
    if (!question) return res.status(400).json({ error: 'Missing question' })

    const contextPart = context ? `\n\nConversation history:\n${context}\n\n` : ''
    const prompt = `${contextPart}Rewrite this student question to be clearer and more specific, then add one brief sentence explaining why the rewrite is better.
${context ? 'Consider the conversation history when rewriting.' : ''}
Format EXACTLY as:
Rewritten: <one clear rewritten question>
Why: <one short reason>

Original: "${question}"`

    const text = await callGemini(prompt, model || MODEL)
    res.json({ ok: true, text })
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

// POST /api/answer { rewritten: string, context?: string }
app.post('/api/answer', async (req, res) => {
  try {
    const { rewritten, context, model } = req.body || {}
    if (!rewritten) return res.status(400).json({ error: 'Missing rewritten question' })

    const contextPart = context ? `Conversation history:\n${context}\n\n` : ''
    const prompt = `${contextPart}Answer the following question for a college freshman.
${context ? 'Use the conversation history for context if relevant.' : ''}

Question: "${rewritten}"

Format your answer using markdown:
- Use **bold** (double asterisks) for important terms, key concepts, and section headings
- Use *italic* (single asterisk) for emphasis on specific words
- Use \`backticks\` for code, HTML tags, file names, or technical terms
- Use bullet points (•) for lists
- Structure your answer with clear sections

Make it engaging, well-formatted, and easy to read.`

    const text = await callGemini(prompt, model || MODEL)
    res.json({ ok: true, text })
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

// POST /api/suggest { input: string, context?: string }
app.post('/api/suggest', async (req, res) => {
  try {
    const { input, context, model } = req.body || {}
    if (!input) return res.status(400).json({ error: 'Missing input' })

    const contextPart = context ? `Conversation history:\n${context}\n\n` : ''
    const prompt = `${contextPart}The student is typing: "${input}"

Based on the conversation history and what they're typing, suggest 2-3 short, clear follow-up questions they might want to ask.
Keep suggestions concise (under 15 words each).
Format as a JSON array of strings.

Example: ["What is CSS?", "How do I use flexbox?", "What's the difference between padding and margin?"]

Respond ONLY with the JSON array:`

    const text = await callGemini(prompt, model || MODEL)
    // Try to parse JSON from response
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0])
        res.json({ ok: true, suggestions })
      } else {
        res.json({ ok: true, suggestions: [] })
      }
    } catch (parseError) {
      res.json({ ok: true, suggestions: [] })
    }
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

app.listen(PORT, () => {
  console.log(`✅ Patriot Prompt Coach API listening on http://localhost:${PORT}`)
})
