#!/usr/bin/env python3
"""
Simple CLI to test a Google Gemini API key by asking a question.

Usage examples:
  python test.py --question "Say: OK"
  python test.py -q "What is photosynthesis?" --model gemini-1.5-flash-latest
  GEMINI_API_KEY=your_key python test.py -q "Test"
  python test.py -q "Test" --key your_key_here
  python test.py -q "Test" --no-prompt  # fail fast if no key in env

Environment loading:
  - Automatically loads a .env file (current working directory and script directory) if present.
  - Uses VITE_GEMINI_API_KEY or GEMINI_API_KEY from the environment, unless --key is provided.
  - Uses VITE_GEMINI_MODEL for the default model if present.

The script tries the API key in this order:
  1) --key flag
  2) GEMINI_API_KEY env var
  3) GOOGLE_API_KEY env var
  4) VITE_GEMINI_API_KEY env var
If none are present, it prompts for a key only when running in an interactive TTY
(unless --no-prompt is given). Otherwise, it exits with instructions.
"""

import argparse
import json
import os
import sys
import urllib.error
import urllib.request

def _parse_env_line(line: str) -> tuple[str, str] | None:
    line = line.strip()
    # Remove BOM if present (common in Windows UTF-8 files)
    if line.startswith('\ufeff'):
        line = line[1:]
    if not line or line.startswith("#"):
        return None
    if line.lower().startswith("export "):
        line = line[7:].lstrip()
    if "=" not in line:
        return None
    key, value = line.split("=", 1)
    key = key.strip()
    value = value.strip().strip('"').strip("'")
    return key, value


def load_dotenv_simple(paths: list[str]) -> None:
    for path in paths:
        try:
            if not os.path.isfile(path):
                continue
            with open(path, "r", encoding="utf-8") as f:
                for raw in f:
                    parsed = _parse_env_line(raw)
                    if not parsed:
                        continue
                    key, value = parsed
                    # Do not override already-set environment variables
                    if key not in os.environ:
                        os.environ[key] = value
        except Exception:
            # Silently ignore malformed .env files to keep CLI robust
            pass


def build_endpoint(model: str, api_key: str) -> str:
    return f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"


def post_json(url: str, payload: dict) -> dict:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        raw = resp.read()
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            raise RuntimeError(f"Non-JSON response from server: {raw[:200]!r}")


def extract_text(response: dict) -> str:
    # Expected path: candidates[0].content.parts[0].text
    try:
        return response["candidates"][0]["content"]["parts"][0]["text"]
    except Exception:
        # Surface API error if present
        if isinstance(response, dict) and "error" in response:
            err = response["error"]
            msg = err.get("message") or err
            raise RuntimeError(f"API error: {msg}")
        raise RuntimeError("Unexpected response structure; no text found.")


def pick_api_key(cli_key: str | None, allow_prompt: bool) -> str:
    if cli_key:
        return cli_key
    env_key = (
        os.getenv("GEMINI_API_KEY")
        or os.getenv("GOOGLE_API_KEY")
        or os.getenv("VITE_GEMINI_API_KEY")
    )
    if env_key:
        return env_key
    # Prompt as a last resort if interactive and allowed
    if allow_prompt and sys.stdin.isatty() and sys.stderr.isatty():
        try:
            import getpass

            entered = getpass.getpass("Enter Gemini API key: ")
            if not entered:
                raise ValueError("No API key provided.")
            return entered
        except KeyboardInterrupt:
            raise ValueError("Prompt canceled. No API key provided.")
        except Exception as e:
            raise ValueError("Failed to read API key from prompt.") from e
    raise ValueError(
        "Missing API key. Provide --key or set GEMINI_API_KEY/GOOGLE_API_KEY/VITE_GEMINI_API_KEY in .env"
    )


def main(argv: list[str]) -> int:
    # Load .env from current working directory and script directory (if present)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    cwd = os.getcwd()
    load_dotenv_simple([
        os.path.join(cwd, ".env"),
        os.path.join(script_dir, ".env"),
    ])

    env_model = os.getenv("VITE_GEMINI_MODEL", "gemini-1.5-flash-latest")
    parser = argparse.ArgumentParser(description="Test Gemini API key with a question")
    parser.add_argument(
        "-q",
        "--question",
        help="Question to send. If omitted, you'll be prompted.",
        type=str,
    )
    parser.add_argument(
        "-m",
        "--model",
        help=f"Model to use (default: {env_model})",
        default=env_model,
        type=str,
    )
    parser.add_argument(
        "-k",
        "--key",
        help="Gemini API key (overrides env)",
        type=str,
    )
    parser.add_argument(
        "--no-prompt",
        help="Do not prompt for API key; fail if not found in env",
        action="store_true",
    )
    args = parser.parse_args(argv)

    api_key = pick_api_key(args.key, allow_prompt=not args.no_prompt)
    question = args.question
    if not question:
        try:
            question = input("Enter your question: ").strip()
        except EOFError:
            question = ""
    if not question:
        print("No question provided.", file=sys.stderr)
        return 2

    endpoint = build_endpoint(args.model, api_key)
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {"text": question},
                ],
            }
        ]
    }

    try:
        response = post_json(endpoint, payload)
        text = extract_text(response)
        print("=== Model response ===")
        print(text)
        return 0
    except urllib.error.HTTPError as e:
        try:
            body = e.read()
            msg = body.decode("utf-8", errors="ignore")
        except Exception:
            msg = str(e)
        print(f"HTTP error {e.code}: {msg}", file=sys.stderr)
        return 1
    except urllib.error.URLError as e:
        print(f"Network error: {e.reason}", file=sys.stderr)
        return 1
    except Exception as e:
        print(
            (
                f"Error: {e}\n"
                "Hint: pass --key YOUR_KEY or set GEMINI_API_KEY/GOOGLE_API_KEY/VITE_GEMINI_API_KEY in a .env next to test.py.\n"
                "Example .env:\n"
                "VITE_GEMINI_API_KEY=YOUR_KEY\nVITE_GEMINI_MODEL=gemini-1.5-flash-latest\n"
            ),
            file=sys.stderr,
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))


