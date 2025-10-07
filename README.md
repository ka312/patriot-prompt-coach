# Patriot Prompt Coach 🎓

AI-powered prompt coaching tool that helps students learn effective AI prompting through interactive rewriting and feedback, built for George Mason University.

## Features

- 🤖 **Interactive AI Coaching**: Get real-time feedback on your prompts
- 📝 **Prompt Rewriting**: See how to improve your questions before getting answers
- 💬 **Chat Memory**: Maintains conversation context for better responses
- 💡 **Smart Suggestions**: AI-generated follow-up question recommendations
- 🎨 **Beautiful UI**: Modern glassmorphism design with GMU branding
- 📚 **Educational Focus**: Built specifically for college students learning AI prompting

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + Framer Motion
- **Backend**: Express.js (API proxy)
- **AI**: Google Gemini API

## Setup

1. Clone the repository:
```bash
git clone https://github.com/ka312/patriot-prompt-coach.git
cd patriot-prompt-coach
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_api_key_here
```

4. Run the development servers:

In one terminal:
```bash
npm run server
```

In another terminal:
```bash
npm run dev
```

5. Open http://localhost:5173 in your browser

## Usage

1. Click "Get Started" to begin
2. Ask any question about a topic you're learning
3. Review the AI's rewritten version of your question
4. Approve or refine the rewritten question
5. Get a well-formatted answer with proper formatting
6. Use suggested follow-up questions to continue learning

## Project Structure

```
patriot-prompt-coach/
├── src/
│   ├── components/
│   │   ├── ChatWindow.tsx      # Main chat interface
│   │   ├── MessageBubble.tsx   # Message formatting & display
│   │   └── GoogleLogin.tsx     # Login screen
│   ├── App.tsx                 # Main app with chat history
│   └── main.tsx                # Entry point
├── server/
│   └── server.js               # Express API proxy
├── public/
│   └── gmu-logo.png           # GMU branding
└── package.json
```

## Environment Variables

- `GEMINI_API_KEY` - Your Google Gemini API key (required)
- `GEMINI_MODEL` - Model to use (optional, defaults to gemini-1.5-flash-latest)
- `PORT` - Backend server port (optional, defaults to 8787)

## Contributing

Built for George Mason University students. Feel free to fork and customize for your institution!

## License

MIT

---

Built with 💚 for George Mason University — Practice. Learn. Prompt.

