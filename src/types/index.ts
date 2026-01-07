// Type definitions for PRD Code Generator

export interface Prompt {
  id: string;
  name: string;
  content: string;
  isDefault?: boolean;
  createdAt: number;
  updatedAt: number;
}

export type AIProvider = 'google' | 'openai';

export interface ModelConfig {
  provider: AIProvider;
  model: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  // OpenAI specific
  openaiBaseUrl?: string;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
  level: LogLevel;
  imageUrl?: string;  // Optional image preview URL
  duration?: number;  // Duration in milliseconds (for completed tasks)
  isRunning?: boolean; // Whether the task is still running
  inputTokens?: number;  // Input tokens for this task
  outputTokens?: number; // Output tokens for this task
  promptContent?: string; // Full prompt content sent to LLM
}

export type LogLevel = 'info' | 'success' | 'warning' | 'error';

export interface GeneratorState {
  isGenerating: boolean;
  currentImage: File | null;
  imagePreview: string | null;
  generatedCode: string;
  progress: number;
}

export interface ApifoxProject {
  projectId: string;
  name: string;
}

export interface SettingsState {
  prompts: Prompt[];
  apiKey: string;
  modelConfig: ModelConfig;
  // Apifox Config
  apifoxToken: string;
  apifoxProjects: ApifoxProject[];
  // EasyForm prompts
  easyFormSpec: string;
  easyFormIndexPrompt: string;
  easyFormModalPrompt: string;
  easyFormServicePrompt: string;
  easyFormRefinePrompt: string;
  // Best Examples
  bestExamples: BestExample[];
  bestExamplesEnabled: boolean;
}

export interface BestExample {
  id: string;
  name: string;
  description?: string;
  indexCode: string;
  modalCode: string;
  serviceCode: string;
  createdAt: number;
  updatedAt: number;
}

// Multi-file project types
export interface FileVersion {
  label: string;       // e.g., "初始生成", "回炉重造"
  content: string;
  timestamp: number;
}

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  language?: string;
  children?: FileNode[];
  parentId?: string;
  versions?: FileVersion[];  // Version history for diff comparison
}

export interface ProjectState {
  files: FileNode[];
  activeFileId: string | null;
  openTabs: string[];
}

// API Proxy configuration
export interface ProxyRule {
  id: string;
  prefix: string;     // e.g., "/dist"
  target: string;     // e.g., "${HOST}" or direct URL
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

// Host group for environment switching
export interface HostGroup {
  id: string;
  name: string;       // e.g., "开发环境", "测试环境"
  host: string;       // e.g., "https://172.20.66.66:2505"
  tokenId?: string;   // Auth token for Cookies
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

// Generation history record
export interface GenerationRecord {
  id: string;
  timestamp: number;
  imagePreview?: string;     // Base64 or data URL of the image
  generatedCode: string;     // The generated code
  files?: FileNode[];        // For multi-file projects
  mode: 'general' | 'easyform';
  modelUsed: string;         // e.g., "gemini-2.0-flash"
  promptSummary?: string;    // Brief description of what was generated
  selectedApis?: string[];   // API names if EasyForm mode
  inputTokens?: number;
  outputTokens?: number;
  duration?: number;         // Generation time in ms
}

export type TaskStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface TaskState {
  id: string;
  status: TaskStatus;
  content: string;
  error?: string;
  createdAt: number;
  updatedAt: number;
}
