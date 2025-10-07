import { useState } from "react";
import { useConfig } from "../lib/useConfig";

export default function SettingsBar() {
  const { apiKey, setApiKey, model, setModel, resetToEnv } = useConfig();
  const [testStatus, setTestStatus] = useState<null | "ok" | string>(null);

  const masked = apiKey ? apiKey.slice(0, 6) + "••••" : "(none)";

  const testGemini = async () => {
    setTestStatus(null);
    if (!apiKey) {
      setTestStatus("No API key set.");
      return;
    }
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "Say: OK" }] }],
        }),
      });
      const data = await res.json();
      if (data?.error?.message) {
        setTestStatus(`Error: ${data.error.message}`);
      } else if (data?.candidates?.[0]?.content?.parts?.[0]?.text?.includes("OK")) {
        setTestStatus("ok");
      } else {
        setTestStatus("Unexpected response. Check model name.");
      }
    } catch (e: any) {
      setTestStatus(`Network error: ${e?.message || e}`);
    }
  };

  return (
    <div className="w-full bg-white border border-green-200 rounded-xl shadow-sm p-4 mb-4">
      <h2 className="text-lg font-semibold text-patriotGreen mb-2">Settings</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="text-sm text-gray-600">Gemini API Key</label>
          <input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Paste your Gemini API key…"
            className="w-full border border-green-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <div className="text-xs text-gray-500 mt-1">Current: {masked}</div>
        </div>
        <div>
          <label className="text-sm text-gray-600">Model</label>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="gemini-1.5-flash-latest"
            className="w-full border border-green-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <div className="text-xs text-gray-500 mt-1">Example: gemini-1.5-flash-latest</div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={testGemini}
          className="px-3 py-2 rounded-lg bg-patriotGreen text-white hover:bg-green-800"
        >
          Test connection
        </button>
        <button
          onClick={resetToEnv}
          className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
        >
          Reset to .env values
        </button>

        {testStatus && (
          <span
            className={`text-sm ml-2 ${
              testStatus === "ok" ? "text-green-700" : "text-red-600"
            }`}
          >
            {testStatus === "ok" ? "✅ Connected!" : `❌ ${testStatus}`}
          </span>
        )}
      </div>
    </div>
  );
}
