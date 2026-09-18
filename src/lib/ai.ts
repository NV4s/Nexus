import { CHAT_PREFIX, K } from './keys.ts';


export type EngineId = 'local' | 'chrome' | 'anthropic' | 'google' | 'openai' | 'custom';

export type Attachment = {
  name: string;

  type: string;

  data?: string;

  text?: string;
};

export type Message = {
  role: 'user' | 'assistant';
  content: string;

  files?: Attachment[];
};

export type Availability =
  | { state: 'ready' }
  | { state: 'needs-key' }
  | { state: 'needs-download'; size: string }
  | { state: 'unsupported'; reason: string };

export type Progress = (note: string) => void;

const store = {
  get(key: string) {
    try {
      return localStorage.getItem(K.apiKey(key)) ?? '';
    } catch {
      return '';
    }
  },
  set(key: string, value: string) {
    try {
      if (value) localStorage.setItem(K.apiKey(key), value);
      else localStorage.removeItem(K.apiKey(key));
    } catch {}
  },
};

export const readKey = (id: EngineId) => store.get(`key:${id}`);
export const writeKey = (id: EngineId, value: string) => store.set(`key:${id}`, value.trim());
export const readSetting = (name: string) => store.get(name);
export const writeSetting = (name: string, value: string) => store.set(name, value.trim());


export const MODELS: Record<string, { id: string; label: string }[]> = {
  anthropic: [
    { id: 'claude-opus-5', label: 'Claude Opus 5 — most capable' },
    { id: 'claude-sonnet-5', label: 'Claude Sonnet 5 — faster, cheaper' },
    { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 — fastest' },
    { id: 'claude-opus-4-1', label: 'Claude Opus 4.1' },
    { id: 'claude-opus-4-0', label: 'Claude Opus 4' },
    { id: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5' },
    { id: 'claude-sonnet-4-0', label: 'Claude Sonnet 4' },
    { id: 'claude-3-7-sonnet-latest', label: 'Claude Sonnet 3.7' },
    { id: 'claude-3-5-haiku-latest', label: 'Claude Haiku 3.5' },
  ],
  google: [
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro — most capable' },
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite — cheapest' },
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { id: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite' },
    { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    { id: 'gemini-1.5-flash-8b', label: 'Gemini 1.5 Flash 8B' },
  ],
  openai: [
    { id: 'gpt-5', label: 'GPT-5 — most capable' },
    { id: 'gpt-5-mini', label: 'GPT-5 mini' },
    { id: 'gpt-5-nano', label: 'GPT-5 nano — cheapest' },
    { id: 'gpt-4.1', label: 'GPT-4.1' },
    { id: 'gpt-4.1-mini', label: 'GPT-4.1 mini' },
    { id: 'gpt-4.1-nano', label: 'GPT-4.1 nano' },
    { id: 'gpt-4o', label: 'GPT-4o' },
    { id: 'gpt-4o-mini', label: 'GPT-4o mini' },
    { id: 'o4-mini', label: 'o4-mini — reasoning' },
    { id: 'o3', label: 'o3 — reasoning' },
    { id: 'o3-mini', label: 'o3-mini — reasoning' },
  ],
  custom: [],
};


const HISTORY_LIMIT = 50;


const chatKey = K.chat;

export function readChat(engine: string, model: string): Message[] {
  try {
    const raw = localStorage.getItem(chatKey(engine, model));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as Message[]) : [];
  } catch {
    return [];
  }
}

export function writeChat(engine: string, model: string, messages: Message[]) {
  try {



    const trimmed = messages.slice(-HISTORY_LIMIT).map(({ files, ...rest }) =>
      files?.length ? { ...rest, files: files.map(({ name, type }) => ({ name, type })) } : rest,
    );
    localStorage.setItem(chatKey(engine, model), JSON.stringify(trimmed));
  } catch {}
}

export const clearChat = (engine: string, model: string) => {
  try {
    localStorage.removeItem(chatKey(engine, model));
  } catch {}
};


export function listChats(): string[] {
  try {
    return Object.keys(localStorage).filter((key) => key.startsWith(CHAT_PREFIX));
  } catch {
    return [];
  }
}

export const DEFAULT_MODEL: Record<string, string> = {
  anthropic: 'claude-opus-5',
  google: 'gemini-2.0-flash',
  openai: 'gpt-4o-mini',
  custom: 'gpt-4o-mini',
};


export async function fetchModels(id: EngineId): Promise<string[]> {
  const key = readKey(id);
  if (!key) return [];
  try {
    if (id === 'google') {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`,
      );
      if (!response.ok) return [];
      const body = (await response.json()) as { models?: { name?: string; supportedGenerationMethods?: string[] }[] };
      return (body.models ?? [])
        .filter((model) => model.supportedGenerationMethods?.includes('generateContent'))
        .map((model) => (model.name ?? '').replace(/^models\//, ''))
        .filter(Boolean);
    }
    if (id === 'openai' || id === 'custom') {
      const base =
        id === 'openai' ? 'https://api.openai.com/v1' : (readSetting('baseUrl') || '').replace(/\/+$/, '');
      if (!base) return [];
      const response = await fetch(`${base}/models`, { headers: { authorization: `Bearer ${key}` } });
      if (!response.ok) return [];
      const body = (await response.json()) as { data?: { id?: string }[] };
      return (body.data ?? []).map((model) => model.id ?? '').filter(Boolean).sort();
    }
  } catch {}
  return [];
}

const SYSTEM =
  'You are the assistant on Nexus, a browser games site. Be brief and concrete. ' +
  'If you are unsure of a fact, say so rather than inventing it.';



const LOCAL_MODEL = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';


const LOCAL_VISION_MODEL = 'Phi-3.5-vision-instruct-q4f16_1-MLC';

export const LOCAL_VISION_SIZE = 'about 3.5 GB, and roughly 4 GB of video memory';

type WebLLMEngine = {
  chat: {
    completions: {
      create(options: unknown): Promise<AsyncIterable<{ choices: { delta: { content?: string } }[] }>>;
    };
  };
};


const localEngines = new Map<string, WebLLMEngine>();

const hasWebGPU = () => typeof navigator !== 'undefined' && 'gpu' in navigator;

async function loadLocal(onProgress: Progress, model = LOCAL_MODEL): Promise<WebLLMEngine> {
  const cached = localEngines.get(model);
  if (cached) return cached;


  const webllm = await import('@mlc-ai/web-llm');
  const engine = (await webllm.CreateMLCEngine(model, {
    initProgressCallback: (report: { text: string }) => onProgress(report.text),
  })) as unknown as WebLLMEngine;
  localEngines.set(model, engine);
  return engine;
}


function withImages(message: Message) {
  const images = (message.files ?? []).filter((file) => file.data && isImage(file.type));
  const text = (message.files ?? []).filter((file) => file.text);
  if (!images.length) {
    return {
      role: message.role,
      content: text.length
        ? `${message.content}\n\n${text.map((file) => `${file.name}:\n${file.text}`).join('\n\n')}`
        : message.content,
    };
  }

  return {
    role: message.role,
    content: [
      { type: 'text', text: message.content || 'Describe this image.' },
      ...images.map((file) => ({
        type: 'image_url',
        image_url: { url: `data:${file.type};base64,${file.data}` },
      })),
    ],
  };
}


export const localModelCached = async () => {
  try {
    const cache = await caches.open('webllm/model');
    return (await cache.keys()).length > 0;
  } catch {
    return false;
  }
};

type PromptSession = { prompt(input: string): Promise<string> };
type PromptApi = {
  availability?(): Promise<string>;
  create(options?: unknown): Promise<PromptSession>;
};

const chromeApi = (): PromptApi | null => {
  const scope = globalThis as unknown as { LanguageModel?: PromptApi; ai?: { languageModel?: PromptApi } };
  return scope.LanguageModel ?? scope.ai?.languageModel ?? null;
};

const toText = async (response: Response, pick: (body: never) => string | undefined) => {
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`${response.status} ${response.statusText}${detail ? ` — ${detail.slice(0, 300)}` : ''}`);
  }
  return pick((await response.json()) as never) ?? '(no answer)';
};


const isImage = (type: string) => type.startsWith('image/');


function withText(message: Message): string {
  const extracted = (message.files ?? []).filter((file) => file.text);
  if (!extracted.length) return message.content;
  const blocks = extracted
    .map((file) => `----- ${file.name} -----\n${file.text}`)
    .join('\n\n');
  return `${message.content}\n\n${blocks}`;
}

async function askAnthropic(messages: Message[]): Promise<string> {


  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({
    apiKey: readKey('anthropic'),


    dangerouslyAllowBrowser: true,
  });

  const response = await client.messages.create({
    model: readSetting('model:anthropic') || DEFAULT_MODEL.anthropic,
    max_tokens: 4096,
    system: SYSTEM,
    messages: messages.map((message) =>
      message.files?.length
        ? {
            role: message.role,
            content: [
              ...message.files
                .filter((file) => file.data)
                .map((file) =>
                  isImage(file.type)
                    ? ({
                        type: 'image' as const,
                        source: {
                          type: 'base64' as const,
                          media_type: file.type as 'image/png',
                          data: file.data as string,
                        },
                      })
                    : ({
                        type: 'document' as const,
                        source: {
                          type: 'base64' as const,
                          media_type: 'application/pdf' as const,
                          data: file.data as string,
                        },
                      }),
                ),
              { type: 'text' as const, text: withText(message) },
            ],
          }
        : { role: message.role, content: message.content },
    ),
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
          parts: [
            ...(message.files ?? [])
              .filter((file) => file.data)
              .map((file) => ({ inline_data: { mime_type: file.type, data: file.data as string } })),
            { text: withText(message) },
          ],
        })),
      }),
    },
  );
  return toText(response, (body: { candidates?: { content?: { parts?: { text?: string }[] } }[] }) =>
    body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join(''),
  );
}


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
      messages: [
        { role: 'system', content: SYSTEM },
        ...messages.map((message) =>


          message.files?.length
            ? {
                role: message.role,
                content: [
                  { type: 'text', text: withText(message) },
                  ...message.files
                    .filter((file) => file.data && isImage(file.type))
                    .map((file) => ({
                      type: 'image_url',
                      image_url: { url: `data:${file.type};base64,${file.data}` },
                    })),
                ],
              }
            : { role: message.role, content: message.content },
        ),
      ],
    }),
  });
  return toText(response, (body: { choices?: { message?: { content?: string } }[] }) =>
    body.choices?.[0]?.message?.content,
  );
}

export type Engine = {
  id: EngineId;
  label: string;

  private: boolean;

  keyed?: boolean;

  takesFiles?: boolean;
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
    takesFiles: true,
    note: 'A small model runs in your browser. Nothing you type leaves the device. Slower, and the first use downloads the model.',
    async check() {
      if (!hasWebGPU()) {
        return { state: 'unsupported', reason: 'This browser has no WebGPU, which the local model needs.' };
      }
      return (await localModelCached()) ? { state: 'ready' } : { state: 'needs-download', size: 'about 350 MB' };
    },
    async ask(messages, onProgress) {


      const wantsVision = messages.some((message) =>
        message.files?.some((file) => file.data && isImage(file.type)),
      );
      const engine = await loadLocal(onProgress, wantsVision ? LOCAL_VISION_MODEL : LOCAL_MODEL);
      const stream = await engine.chat.completions.create({
        messages: [{ role: 'system', content: SYSTEM }, ...messages.map(withImages)],
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



      const availability = await api.availability?.().catch(() => 'unavailable');
      if (availability === 'available') return { state: 'ready' };
      if (availability === 'downloadable' || availability === 'downloading') {
        return { state: 'needs-download', size: 'a few GB, handled by Chrome' };
      }
      return { state: 'unsupported', reason: 'Chrome reports its built-in model is unavailable here.' };
    },
    async ask(messages) {
      if (messages.some((message) => message.files?.length)) {
        throw new Error("Chrome's built-in model reads text only. Use a key-based engine for files.");
      }
      const api = chromeApi();
      if (!api) throw new Error('No built-in model in this browser.');
      const session = await api.create({ initialPrompts: [{ role: 'system', content: SYSTEM }] });
      return (await session.prompt(messages[messages.length - 1].content)).trim();
    },
  },
  {
    id: 'anthropic',
    keyed: true,
    takesFiles: true,
    label: 'Claude',
    private: false,
    note: 'Your Anthropic API key, from console.anthropic.com. The conversation goes to Anthropic.',
    check: async () => needsKey('anthropic'),
    ask: (messages) => askAnthropic(messages),
  },
  {
    id: 'google',
    keyed: true,
    takesFiles: true,
    label: 'Gemini',
    private: false,
    note: 'Your Google AI Studio key, from aistudio.google.com. The conversation goes to Google.',
    check: async () => needsKey('google'),
    ask: (messages) => askGoogle(messages),
  },
  {
    id: 'openai',
    keyed: true,
    takesFiles: true,
    label: 'ChatGPT',
    private: false,
    note: 'Your OpenAI key, from platform.openai.com. The conversation goes to OpenAI.',
    check: async () => needsKey('openai'),
    ask: (messages) => askOpenAiCompatible('openai', messages),
  },
  {
    id: 'custom',
    keyed: true,
    takesFiles: true,
    label: 'Other (OpenAI-compatible)',
    private: false,


    note: 'Any service that copies the OpenAI API — OpenRouter, an OpenClaw gateway, a local server. Needs a base URL.',
    check: async () =>
      readSetting('baseUrl') ? needsKey('custom') : { state: 'needs-key' as const },
    ask: (messages) => askOpenAiCompatible('custom', messages),
  },
];

export const engineById = (id: EngineId) => ENGINES.find((engine) => engine.id === id) ?? ENGINES[0];
