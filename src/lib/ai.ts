/**
 * Assistant back ends.
 *
 * Two kinds, and the difference matters to whoever is typing: a local engine
 * answers on the device and nothing leaves it, while a key-based one sends the
 * conversation to that company's servers. The UI names which one replied.
 *
 * Keys live in this browser's localStorage and go only to the provider they
 * belong to. Nothing is ever sent to this site's own backend, and no key is in
 * the repo — `npm run check:secrets` fails the build if one appears in a bundle.
 */

export type EngineId = 'local' | 'chrome' | 'anthropic' | 'google' | 'openai' | 'custom';

export type Message = { role: 'user' | 'assistant'; content: string };

export type Availability =
  | { state: 'ready' }
  | { state: 'needs-key' }
  | { state: 'needs-download'; size: string }
  | { state: 'unsupported'; reason: string };

export type Progress = (note: string) => void;

const store = {
  get(key: string) {
    try {
      return localStorage.getItem(`nexus:ai:${key}`) ?? '';
    } catch {
      return '';
    }
  },
  set(key: string, value: string) {
    try {
      if (value) localStorage.setItem(`nexus:ai:${key}`, value);
      else localStorage.removeItem(`nexus:ai:${key}`);
    } catch {
      /* private mode — the assistant just will not remember the key */
    }
  },
};

export const readKey = (id: EngineId) => store.get(`key:${id}`);
export const writeKey = (id: EngineId, value: string) => store.set(`key:${id}`, value.trim());
export const readSetting = (name: string) => store.get(name);
export const writeSetting = (name: string, value: string) => store.set(name, value.trim());

/** Defaults are editable in the UI, because provider model names move. */
export const DEFAULT_MODEL: Record<string, string> = {
  anthropic: 'claude-opus-5',
  google: 'gemini-2.0-flash',
  openai: 'gpt-4o-mini',
  custom: 'gpt-4o-mini',
};

const SYSTEM =
  'You are the assistant on Nexus, a browser games site. Be brief and concrete. ' +
  'If you are unsure of a fact, say so rather than inventing it.';

/* ---------- local: WebLLM ---------- */

// Small on purpose. The audience is school Chromebooks, where a 900 MB download
// and 4 GB of RAM do not go together; this one is a few hundred MB.
const LOCAL_MODEL = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';

type WebLLMEngine = {
  chat: {
    completions: {
      create(options: unknown): Promise<AsyncIterable<{ choices: { delta: { content?: string } }[] }>>;
    };
  };
};

let localEngine: WebLLMEngine | null = null;

const hasWebGPU = () => typeof navigator !== 'undefined' && 'gpu' in navigator;

async function loadLocal(onProgress: Progress): Promise<WebLLMEngine> {
  if (localEngine) return localEngine;
  // Imported here rather than at module scope so the library is only fetched
  // when someone actually opts in to running a model locally.
  const webllm = await import('@mlc-ai/web-llm');
  localEngine = (await webllm.CreateMLCEngine(LOCAL_MODEL, {
    initProgressCallback: (report: { text: string }) => onProgress(report.text),
  })) as unknown as WebLLMEngine;
  return localEngine;
}

/** True once the model is in the browser's cache, so it will start instantly. */
export const localModelCached = async () => {
  try {
    const cache = await caches.open('webllm/model');
    return (await cache.keys()).length > 0;
  } catch {
    return false;
  }
};

/* ---------- local: Chrome's built-in model ---------- */

type PromptSession = { prompt(input: string): Promise<string> };
type PromptApi = {
  availability?(): Promise<string>;
  create(options?: unknown): Promise<PromptSession>;
};

const chromeApi = (): PromptApi | null => {
  const scope = globalThis as unknown as { LanguageModel?: PromptApi; ai?: { languageModel?: PromptApi } };
  return scope.LanguageModel ?? scope.ai?.languageModel ?? null;
};

/* ---------- cloud ---------- */

const toText = async (response: Response, pick: (body: never) => string | undefined) => {
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`${response.status} ${response.statusText}${detail ? ` — ${detail.slice(0, 300)}` : ''}`);
  }
  return pick((await response.json()) as never) ?? '(no answer)';
};

async function askAnthropic(messages: Message[]): Promise<string> {
  // The official SDK rather than hand-rolled fetch, and loaded on demand so it
  // is not in the bundle for people who never open the assistant.
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({
    apiKey: readKey('anthropic'),
    // The user's own key, from the user's own browser — which is exactly the
    // case this flag exists for.
    dangerouslyAllowBrowser: true,
  });

  const response = await client.messages.create({
    model: readSetting('model:anthropic') || DEFAULT_MODEL.anthropic,
    max_tokens: 4096,
    system: SYSTEM,
    messages,
  });

  return response.content
    .filter((block): block is { type: 'text'; text: string; citations: never } => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim();
}

async function askGoogle(messages: Message[]): Promise<string> {
  const model = readSetting('model:google') || DEFAULT_MODEL.google;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(readKey('google'))}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: messages.map((message) => ({
          role: message.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: message.content }],
        })),
      }),
    },
  );
  return toText(response, (body: { candidates?: { content?: { parts?: { text?: string }[] } }[] }) =>
    body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join(''),
  );
}

/** OpenAI's own endpoint and anything that copies its shape — OpenRouter, gateways, local servers. */
async function askOpenAiCompatible(id: 'openai' | 'custom', messages: Message[]): Promise<string> {
  const base =
    id === 'openai'
      ? 'https://api.openai.com/v1'
      : (readSetting('baseUrl') || '').replace(/\/+$/, '');
  if (!base) throw new Error('Set the base URL for this provider first.');

  const response = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${readKey(id)}`,
    },
    body: JSON.stringify({
      model: readSetting(`model:${id}`) || DEFAULT_MODEL[id],
      messages: [{ role: 'system', content: SYSTEM }, ...messages],
    }),
  });
  return toText(response, (body: { choices?: { message?: { content?: string } }[] }) =>
    body.choices?.[0]?.message?.content,
  );
}

/* ---------- the engines ---------- */

export type Engine = {
  id: EngineId;
  label: string;
  /** True when the conversation never leaves this device. */
  private: boolean;
  note: string;
  check(): Promise<Availability>;
  ask(messages: Message[], onProgress: Progress): Promise<string>;
};

const needsKey = (id: EngineId): Availability =>
  readKey(id) ? { state: 'ready' } : { state: 'needs-key' };

export const ENGINES: Engine[] = [
  {
    id: 'local',
    label: 'On this device',
    private: true,
    note: 'A small model runs in your browser. Nothing you type leaves the device. Slower, and the first use downloads the model.',
    async check() {
      if (!hasWebGPU()) {
        return { state: 'unsupported', reason: 'This browser has no WebGPU, which the local model needs.' };
      }
      return (await localModelCached()) ? { state: 'ready' } : { state: 'needs-download', size: 'about 350 MB' };
    },
    async ask(messages, onProgress) {
      const engine = await loadLocal(onProgress);
      const stream = await engine.chat.completions.create({
        messages: [{ role: 'system', content: SYSTEM }, ...messages],
        stream: true,
      });
      let answer = '';
      for await (const chunk of stream) {
        answer += chunk.choices[0]?.delta?.content ?? '';
        onProgress(answer);
      }
      return answer.trim();
    },
  },
  {
    id: 'chrome',
    label: "Chrome's built-in model",
    private: true,
    note: 'Uses the model built into Chrome. Nothing leaves the device and there is nothing to download — but it is only on some machines.',
    async check(): Promise<Availability> {
      const api = chromeApi();
      if (!api) {
        return {
          state: 'unsupported',
          reason: 'This browser has no built-in model. It needs Chrome 138+ on a supported device, with the Prompt API flag enabled.',
        };
      }
      // Four states, not two. Treating anything non-"unavailable" as ready
      // reports success and then throws, because Chrome refuses to start a
      // download except from a click.
      const availability = await api.availability?.().catch(() => 'unavailable');
      if (availability === 'available') return { state: 'ready' };
      if (availability === 'downloadable' || availability === 'downloading') {
        return { state: 'needs-download', size: 'a few GB, handled by Chrome' };
      }
      return { state: 'unsupported', reason: 'Chrome reports its built-in model is unavailable here.' };
    },
    async ask(messages) {
      const api = chromeApi();
      if (!api) throw new Error('No built-in model in this browser.');
      const session = await api.create({ initialPrompts: [{ role: 'system', content: SYSTEM }] });
      return (await session.prompt(messages[messages.length - 1].content)).trim();
    },
  },
  {
    id: 'anthropic',
    label: 'Claude',
    private: false,
    note: 'Your Anthropic API key, from console.anthropic.com. The conversation goes to Anthropic.',
    check: async () => needsKey('anthropic'),
    ask: (messages) => askAnthropic(messages),
  },
  {
    id: 'google',
    label: 'Gemini',
    private: false,
    note: 'Your Google AI Studio key, from aistudio.google.com. The conversation goes to Google.',
    check: async () => needsKey('google'),
    ask: (messages) => askGoogle(messages),
  },
  {
    id: 'openai',
    label: 'ChatGPT',
    private: false,
    note: 'Your OpenAI key, from platform.openai.com. The conversation goes to OpenAI.',
    check: async () => needsKey('openai'),
    ask: (messages) => askOpenAiCompatible('openai', messages),
  },
  {
    id: 'custom',
    label: 'Other (OpenAI-compatible)',
    private: false,
    // One field instead of one integration per service: OpenRouter, OpenClaw's
    // gateway and most self-hosted servers all speak this shape.
    note: 'Any service that copies the OpenAI API — OpenRouter, an OpenClaw gateway, a local server. Needs a base URL.',
    check: async () =>
      readSetting('baseUrl') ? needsKey('custom') : { state: 'needs-key' as const },
    ask: (messages) => askOpenAiCompatible('custom', messages),
  },
];

export const engineById = (id: EngineId) => ENGINES.find((engine) => engine.id === id) ?? ENGINES[0];
