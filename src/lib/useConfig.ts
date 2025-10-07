import { useEffect, useState } from "react";

const ENV_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const ENV_MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-1.5-flash-latest";

const LS_KEY = "patriot_config_api_key";
const LS_MODEL = "patriot_config_model";

export function useConfig() {
  const [apiKey, setApiKey] = useState<string>(ENV_KEY);
  const [model, setModel] = useState<string>(ENV_MODEL);

  useEffect(() => {
    const k = localStorage.getItem(LS_KEY);
    const m = localStorage.getItem(LS_MODEL);
    // Only use stored values if they are non-empty; otherwise fall back to env
    setApiKey(k && k.trim() ? k : ENV_KEY);
    setModel(m && m.trim() ? m : ENV_MODEL);
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_KEY, apiKey || "");
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem(LS_MODEL, model || "");
  }, [model]);

  const resetToEnv = () => {
    setApiKey(ENV_KEY);
    setModel(ENV_MODEL);
  };

  return { apiKey, setApiKey, model, setModel, resetToEnv };
}
