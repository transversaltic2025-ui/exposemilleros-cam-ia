export type OpenRouterMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type OpenRouterChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
    code?: string | number;
  };
};

export async function callOpenRouter(messages: OpenRouterMessage[]) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "openrouter/free";

  console.log("[ai/openrouter] modelo usado", model);

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY no esta configurada.");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
    }),
  });

  const raw = await response.text();
  let payload: OpenRouterChatResponse | null = null;

  try {
    payload = raw ? (JSON.parse(raw) as OpenRouterChatResponse) : null;
  } catch {
    console.error("[ai/openrouter] respuesta no JSON de OpenRouter", raw);
  }

  if (!response.ok) {
    const message = payload?.error?.message ?? raw ?? response.statusText;
    console.error("[ai/openrouter] error exacto de OpenRouter", message);
    throw new Error(`OpenRouter error: ${message}`);
  }

  if (payload?.error) {
    const message = payload.error.message ?? "OpenRouter devolvio un error sin mensaje.";
    console.error("[ai/openrouter] error exacto de OpenRouter", payload.error);
    throw new Error(`OpenRouter error: ${message}`);
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (!content) {
    console.error("[ai/openrouter] respuesta sin contenido", raw);
    throw new Error("OpenRouter no devolvio contenido analizable.");
  }

  return {
    model,
    content,
    raw,
  };
}
