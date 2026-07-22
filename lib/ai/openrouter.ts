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
    metadata?: unknown;
  };
};

export const OPENROUTER_FREE_FALLBACK_MODELS = [
  process.env.OPENROUTER_MODEL || "google/gemma-4-31b-it:free",
  "google/gemma-4-26b-a4b-it:free",
  "openai/gpt-oss-20b:free",
  "nvidia/nemotron-nano-9b-v2:free",
].filter((model, index, models) => model && models.indexOf(model) === index);

type OpenRouterOptions = {
  temperature?: number;
  validateContent?: (content: string) => void;
  onModelAttempt?: (model: string) => void;
  onModelError?: (model: string, error: Error) => void;
};

function metadataSummary(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") {
    return "";
  }

  try {
    return ` metadata=${JSON.stringify(metadata).slice(0, 300)}`;
  } catch {
    return " metadata=no_serializable";
  }
}

function buildOpenRouterErrorMessage({
  status,
  model,
  payload,
  raw,
}: {
  status: number;
  model: string;
  payload: OpenRouterChatResponse | null;
  raw: string;
}) {
  const message = payload?.error?.message ?? (raw || "OpenRouter no devolvio detalle del error.");
  const code = payload?.error?.code ? ` code=${payload.error.code}` : "";
  const metadata = metadataSummary(payload?.error?.metadata);

  return `OpenRouter status=${status} model=${model}${code} message=${message.slice(0, 500)}${metadata}`;
}

async function callOpenRouterModel(
  model: string,
  messages: OpenRouterMessage[],
  options: OpenRouterOptions,
  apiKey: string,
) {
  console.log("[ai/openrouter] intentando modelo", model);

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.2,
    }),
  });

  const raw = await response.text();
  let payload: OpenRouterChatResponse | null = null;

  try {
    payload = raw ? (JSON.parse(raw) as OpenRouterChatResponse) : null;
  } catch {
    throw new Error(`OpenRouter status=${response.status} model=${model} message=Respuesta no JSON del proveedor.`);
  }

  if (!response.ok || payload?.error) {
    console.warn("[ai/openrouter] status de OpenRouter", response.status);
    console.warn("[ai/openrouter] error message de OpenRouter", payload?.error?.message ?? response.statusText);
    throw new Error(buildOpenRouterErrorMessage({ status: response.status, model, payload, raw }));
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(`OpenRouter status=${response.status} model=${model} message=Respuesta sin contenido analizable.`);
  }

  console.log("[ai/openrouter] modelo respondio", model);

  return {
    content,
    modelUsed: model,
    model,
    raw,
  };
}

export async function callOpenRouter(messages: OpenRouterMessage[], options: OpenRouterOptions = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY no esta configurada.");
  }

  console.log("[ai/openrouter] modelo principal", OPENROUTER_FREE_FALLBACK_MODELS[0]);
  console.log("[ai/openrouter] modelos fallback disponibles", OPENROUTER_FREE_FALLBACK_MODELS.join(", "));

  let lastError: Error | null = null;

  for (const model of OPENROUTER_FREE_FALLBACK_MODELS) {
    options.onModelAttempt?.(model);
    try {
      const result = await callOpenRouterModel(model, messages, options, apiKey);
      options.validateContent?.(result.content);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Error desconocido de OpenRouter.");
      options.onModelError?.(model, lastError);
      console.warn(`[ai/openrouter] modelo fallo: ${model} - ${lastError.message}`);
    }
  }

  throw lastError ?? new Error("No fue posible obtener respuesta de OpenRouter.");
}
