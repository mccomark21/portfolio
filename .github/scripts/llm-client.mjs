/**
 * llm-client.mjs
 * Thin abstraction over OpenAI and Anthropic APIs.
 * Selects provider based on LLM_PROVIDER env var ("openai" | "anthropic").
 * Falls back to whichever API key is present when LLM_PROVIDER is unset.
 */

const MAX_RETRIES = 3;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function retryFetch(fn) {
  let lastErr;
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < MAX_RETRIES - 1) await sleep(Math.pow(2, i) * 1200);
    }
  }
  throw lastErr;
}

async function openai(prompt, apiKey) {
  const res = await retryFetch(() =>
    fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.6,
        max_tokens: 2400,
        messages: [
          {
            role: "system",
            content:
              "You are an expert technical writer. Generate valid MDX with YAML frontmatter as instructed.",
          },
          { role: "user", content: prompt },
        ],
      }),
    })
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`OpenAI error ${res.status}: ${err?.error?.message ?? res.statusText}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

async function anthropic(prompt, apiKey) {
  const res = await retryFetch(() =>
    fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2400,
        system:
          "You are an expert technical writer. Generate valid MDX with YAML frontmatter as instructed.",
        messages: [{ role: "user", content: prompt }],
      }),
    })
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Anthropic error ${res.status}: ${err?.error?.message ?? res.statusText}`);
  }
  const data = await res.json();
  return data.content[0].text;
}

/**
 * @param {string} prompt
 * @returns {Promise<string>} Raw generated text
 */
export async function generate(prompt) {
  const provider = (process.env.LLM_PROVIDER ?? "").toLowerCase();
  const openaiKey = process.env.OPENAI_API_KEY ?? "";
  const anthropicKey = process.env.ANTHROPIC_API_KEY ?? "";

  if (provider === "openai" || (!provider && openaiKey)) {
    if (!openaiKey) throw new Error("OPENAI_API_KEY is not set");
    return openai(prompt, openaiKey);
  }
  if (provider === "anthropic" || (!provider && anthropicKey)) {
    if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY is not set");
    return anthropic(prompt, anthropicKey);
  }
  throw new Error(
    "Set LLM_PROVIDER to 'openai' or 'anthropic' and provide the matching API key secret."
  );
}
