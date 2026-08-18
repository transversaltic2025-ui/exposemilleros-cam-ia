export type OpenRouterContentPart =
  | { type: "text"; text: string }
  | { type: "file"; file: { filename: string; file_data: string } };

export type OpenRouterMessage = {
  role: "system" | "user" | "assistant";
  content: string | OpenRouterContentPart[];
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

export class OpenRouterRateLimitError extends Error {
  readonly type = "OPENROUTER_RATE_LIMIT" as const;
  constructor(public readonly detail?: string) {
    super("Se alcanzó el límite diario de OpenRouter para modelos gratuitos.");
    this.name = "OpenRouterRateLimitError";
  }
}

export function isOpenRouterRateLimitError(error: unknown): error is OpenRouterRateLimitError {
  return error instanceof OpenRouterRateLimitError || Boolean(error && typeof error === "object" && "type" in error && error.type === "OPENROUTER_RATE_LIMIT");
}

export const OPENROUTER_FREE_FALLBACK_MODELS = [
  process.env.OPENROUTER_MODEL || "google/gemma-4-31b-it:free",
  "google/gemma-4-26b-a4b-it:free",
  "openai/gpt-oss-20b:free",
  "nvidia/nemotron-nano-9b-v2:free",
].filter((model, index, models) => model && models.indexOf(model) === index);

type OpenRouterOptions = {
  temperature?: number;
  signal?: AbortSignal;
  validateContent?: (content: string) => void;
  onModelAttempt?: (model: string) => void;
  onModelError?: (model: string, error: Error) => void;
};

export function validateAIConfiguration() {
  const provider = (process.env.AI_PROVIDER || "openrouter").trim().toLowerCase();
  if (provider !== "openrouter") throw new Error(`AI_PROVIDER está configurado como "${provider}". El análisis de tendencias requiere "openrouter".`);
  if (!process.env.OPENROUTER_API_KEY?.trim()) throw new Error("OPENROUTER_API_KEY no está configurada.");
  return { provider, configuredModel: process.env.OPENROUTER_MODEL?.trim() || null };
}

function errorDetail(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const value = error as Record<string, unknown>;
    const parts = [value.message, value.code && `code=${value.code}`, value.details && `details=${value.details}`, value.hint && `hint=${value.hint}`, value.status && `status=${value.status}`].filter(Boolean);
    if (parts.length) return parts.join(" | ");
    try { return JSON.stringify(error).slice(0, 800); } catch { return String(error); }
  }
  return String(error ?? "Error sin detalle devuelto por OpenRouter.");
}

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
    signal: options.signal,
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
    const detail = buildOpenRouterErrorMessage({ status: response.status, model, payload, raw });
    if (response.status === 429 && /rate limit exceeded|free-models-per-day|x-ratelimit-remaining\s*:\s*0/i.test(`${detail} ${raw}`)) {
      throw new OpenRouterRateLimitError(detail);
    }
    throw new Error(detail);
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
  validateAIConfiguration();
  const apiKey = process.env.OPENROUTER_API_KEY as string;

  console.log("[ai/openrouter] modelo principal", OPENROUTER_FREE_FALLBACK_MODELS[0]);
  console.log("[ai/openrouter] modelos fallback disponibles", OPENROUTER_FREE_FALLBACK_MODELS.join(", "));

  let lastError: Error | null = null;
  const attemptErrors: string[] = [];

  for (const model of OPENROUTER_FREE_FALLBACK_MODELS) {
    options.onModelAttempt?.(model);
    try {
      const result = await callOpenRouterModel(model, messages, options, apiKey);
      options.validateContent?.(result.content);
      return result;
    } catch (error) {
      if (isOpenRouterRateLimitError(error)) throw error;
      const detail = errorDetail(error);
      lastError = error instanceof Error ? error : new Error(detail);
      attemptErrors.push(`${model}: ${detail}`);
      options.onModelError?.(model, lastError);
      console.warn(`[ai/openrouter] modelo fallo: ${model} - ${lastError.message}`);
    }
  }

  if (lastError?.name === "AbortError" || options.signal?.aborted) throw new DOMException("Tiempo de espera agotado durante el análisis IA.", "AbortError");
  throw new Error(`Fallaron todos los modelos de OpenRouter. ${attemptErrors.join(" || ").slice(0, 1800)}`);
}
