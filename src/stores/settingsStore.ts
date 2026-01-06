import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Prompt, ModelConfig, SettingsState, BestExample, ProxyRule, HostGroup } from '../types';

const DEFAULT_PROMPTS: Prompt[] = [
  {
    id: 'system-prompt',
    name: '系统提示词',
    content: `你是一个专业的前端开发工程师，擅长将设计稿转换为高质量的代码。
请根据用户提供的设计图片，生成符合以下要求的代码：
1. 使用 React + TypeScript
2. 样式使用独立的 CSS 文件
3. 代码结构清晰，组件化设计
4. 响应式布局，支持多种屏幕尺寸

【重要】多文件输出格式：
如果需要生成多个文件，请使用以下格式：

===FILE: ComponentName.tsx===
// 组件代码

===FILE: ComponentName.css===
/* 样式代码 */

===FILE: types.ts===
// 类型定义

===END===

如果只需要一个文件，直接输出代码即可，无需使用上述格式。`,
    isDefault: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'code-style',
    name: '代码风格',
    content: `代码风格要求：
- 使用函数式组件和 Hooks
- 使用 ES6+ 语法
- 添加必要的类型注解
- 代码缩进使用 2 空格
- 组件文件使用 PascalCase 命名
- 不要输出任何解释或说明文字
- 不要使用 markdown 代码块包裹`,
    isDefault: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

const DEFAULT_MODEL_CONFIG: ModelConfig = {
  provider: 'google',
  model: 'gemini-2.0-flash',
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 8192,
  openaiBaseUrl: 'https://api.openai.com/v1',
};

// EasyForm 默认提示词
const DEFAULT_EASY_FORM_SPEC = `{
  "name": "easyFormSpec",
  "version": "1.17",
  "meta": {
    "instructions": [
      "defineLayoutConfig ONLY accepts { matrix }. No other layout fields are allowed.",
      "In watch callback, use inst.update/enable/disable/show/hide (no $ prefix).",
      "Outside watch, call EasyFormService instance methods: inst.$update/$show/$hide/$enable/$disable/$submit/$reset.",
      "Do NOT call $ methods as static methods on EasyFormService.",
      "Do not invent fields or behaviors not defined here.",
      "Use the project import path for EasyFormService.",
      "Do NOT add or guess features props unless the user explicitly provides exact props.",
      "Do NOT generate slot widgets or any component field.",
      "Do NOT use dataType. The correct field name is data.",
      "Do NOT set required on every field. Only set required when the field is actually mandatory."
    ]
  },
  "imports": {
    "EasyFormService": "import { EasyFormService } from \\"@components/easyForm/easyForm.service\\";"
  },
  "widgetTypeEnum": ["text", "password", "textArea", "number", "select", "radio", "checkbox", "date", "dateRange", "time", "timeRange", "cascader", "treeSelect", "switch"],
  "usagePatterns": {
    "component": "const layout = inst.defineLayoutConfig({ matrix: [...] }); const config = inst.defineConfig(...); return <inst.Form config={config} layout={layout} />;"
  }
}`;

const DEFAULT_EASY_FORM_INDEX_PROMPT = `请生成模块入口文件 index.tsx：
- 导入 Modal 弹窗组件（从 ./modal 导入）
- 包含一个打开弹窗的按钮
- 使用 useState 管理弹窗的 open 状态和编辑数据
- 提供 handleAdd 和 handleEdit 方法
- 弹窗关闭后刷新列表

【重要】文件边界：
- 只生成 index.tsx 文件的代码
- 不要包含 modal.tsx 或 scope.service.ts 的代码
- 不要生成 FormModal 或 ScopeService 的实现
- 这些会在其他文件中单独生成

参考结构：
import { useState } from 'react';
import FormModal from './modal';

const ModulePage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  
  // ... handlers
  
  return (
    <div>
      <button onClick={handleAdd}>新增</button>
      <FormModal 
        open={modalOpen}
        editData={editData}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default ModulePage;`;

const DEFAULT_EASY_FORM_MODAL_PROMPT = `请生成弹窗表单组件 modal.tsx：
- 使用 EasyFormService 创建表单
- 根据设计图和接口参数定义表单字段
- 支持添加/编辑两种模式（通过 editData 判断）
- 使用 Modal 或 Drawer 包裹表单
- 提交时调用 scopeService 的对应方法

【重要】文件边界：
- 只生成 modal.tsx 文件的代码
- 不要包含 index.tsx 或 scope.service.ts 的代码
- 这些会在其他文件中单独生成

参考结构：
import React, { useMemo, useEffect } from 'react';
import { Modal } from 'antd';
import { EasyFormService } from "@components/easyForm/easyForm.service";
import scopeService from './scope.service';

interface Props {
  open: boolean;
  editData: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

const FormModal: React.FC<Props> = ({ open, editData, onClose, onSuccess }) => {
  const inst = useMemo(() => new EasyFormService(), []);
  const isEdit = !!editData;
  
  useEffect(() => {
    if (editData && open) {
      // inst.$update 回填
    }
  }, [editData, open]);
  
  const layout = inst.defineLayoutConfig({ matrix: [...] });
  const config = inst.defineConfig([...]);
  
  const handleSubmit = async () => {
    const values = await inst.$submit();
    if (!values) return;
    
    const success = isEdit 
      ? await scopeService.update(values)
      : await scopeService.create(values);
      
    if (success) {
      onSuccess();
      onClose();
    }
  };
  
  return (
    <Modal open={open} onCancel={onClose} onOk={handleSubmit}>
      <inst.Form config={config} layout={layout} />
    </Modal>
  );
};

export default FormModal;`;

const DEFAULT_EASY_FORM_SERVICE_PROMPT = `请生成服务接口文件 scope.service.ts：
- 继承 ScopeBaseService
- 实现 create 和 update 方法
- 使用 httpClient 调用接口
- 遵循已有的代码风格

【重要】接口地址：
- 必须使用上方"接口定义"中提供的实际接口路径
- 添加接口使用【添加接口】中的 path
- 修改接口使用【修改接口】中的 path  
- 查询接口使用【查询接口】中的 path
- 不要使用示例中的 /api/xxx 占位符

参考结构：
import { ScopeBaseService } from "@services/scopeBase.service";
import { httpClient } from "@services/http/httpClient.service";
import lodash from "lodash";

class ScopeService extends ScopeBaseService {
  constructor() {
    super();
  }

  async create<T>(payload: any): Promise<boolean> {
    // 使用【添加接口】的实际路径
    const [err] = await httpClient.post<T>("实际的添加接口路径", payload);
    return !err;
  }

  async update<T>(payload: any): Promise<boolean> {
    // 使用【修改接口】的实际路径
    const [err] = await httpClient.post<T>("实际的修改接口路径", payload);
    return !err;
  }

  async getDataList<T extends any>(): Promise<T> {
    // 使用【查询接口】的实际路径
    const [err, response] = await httpClient.post<T>("实际的查询接口路径", {
      ...this.search,
      ...this.getPurePageInfo(),
    });
    if (err) return undefined as any;
    this.updatePageInfoPro(response);
    return lodash.get(response, "items", []) as T;
  }
}

export default new ScopeService();`;

const DEFAULT_EASY_FORM_REFINE_PROMPT = `请检查以下三个文件的关联关系并进行整合优化：

1. 确保 import 路径正确（相对路径）
2. 确保类型定义一致
3. 确保接口调用参数匹配表单字段
4. 确保 scopeService 的方法名与 modal 中的调用一致
5. 优化代码结构，去除冗余

你需要遵循的规则:
1. index.tsx 的弹窗打开调用函数结构，必须按照提供的模版中的函数结构来展示，以下是参考，不要额外再增加过多逻辑:
\`\`\`ts
const openUpdateModal = (record: any = {}) => {
    new EasyDialog().modal(
        \`title\`,
        {
            data: { record },
            component: modal,
            width: 800,
        },
        () => {
            // 弹窗确认后的回调
        }
    );
};
\`\`\`
1.1 index.tsx 中，应包含EasyTable组件，EasyTable组件的使用请参考最佳示例

2. modal.tsx 的函数导出必须使用 \`dialogWrapper\`

3. modal.tsx 表单的提交函数应该使用 \`onSubmitHandle\`

4. modal.tsx 中必须包含 \`useImperativeHandle\`

5. scope.service.ts 必须遵循以下结构，不要更改：
   - 必须 \`import { ScopeBaseService } from "@services/scopeBase.service"\`
   - 必须 \`class ScopeService extends ScopeBaseService\`
   - 必须在 constructor 中调用 \`super()\`
   - 不要更改已生成的接口请求函数

【重要】请严格使用以下 JSON 格式输出，不要输出任何其他内容：

\`\`\`json
{
  "indexCode": "// index.tsx 的完整代码",
  "modalCode": "// modal.tsx 的完整代码",
  "serviceCode": "// scope.service.ts 的完整代码"
}
\`\`\`

注意：
- 只输出 JSON，不要有任何解释或前言
- 代码中的换行用 \\n 表示
- 代码中的双引号需要转义为 \\"
- 确保 JSON 格式正确，可以被解析`;

interface SettingsStore extends SettingsState {
  // Prompt actions
  addPrompt: (prompt: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePrompt: (id: string, updates: Partial<Prompt>) => void;
  deletePrompt: (id: string) => void;

  // API Key actions
  setApiKey: (key: string) => void;

  // Model config actions
  updateModelConfig: (config: Partial<ModelConfig>) => void;

  // Apifox actions
  setApifoxToken: (token: string) => void;
  addApifoxProject: (project: { projectId: string; name: string }) => void;
  updateApifoxProject: (projectId: string, name: string) => void;
  removeApifoxProject: (projectId: string) => void;

  // EasyForm prompt actions
  updateEasyFormSpec: (spec: string) => void;
  updateEasyFormIndexPrompt: (prompt: string) => void;
  updateEasyFormModalPrompt: (prompt: string) => void;
  updateEasyFormServicePrompt: (prompt: string) => void;
  updateEasyFormRefinePrompt: (prompt: string) => void;

  // Best Examples actions
  addBestExample: (example: Omit<BestExample, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateBestExample: (id: string, updates: Partial<BestExample>) => void;
  deleteBestExample: (id: string) => void;
  setBestExamplesEnabled: (enabled: boolean) => void;

  // Proxy Rules actions
  proxyRules: ProxyRule[];
  addProxyRule: (rule: Omit<ProxyRule, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProxyRule: (id: string, updates: Partial<ProxyRule>) => void;
  deleteProxyRule: (id: string) => void;
  toggleProxyRule: (id: string) => void;

  // Host Groups actions
  hostGroups: HostGroup[];
  addHostGroup: (group: Omit<HostGroup, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateHostGroup: (id: string, updates: Partial<HostGroup>) => void;
  deleteHostGroup: (id: string) => void;
  setActiveHostGroup: (id: string) => void;
  getActiveHost: () => string | null;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      prompts: DEFAULT_PROMPTS,
      apiKey: '',
      modelConfig: DEFAULT_MODEL_CONFIG,
      // EasyForm prompts with defaults
      easyFormSpec: DEFAULT_EASY_FORM_SPEC,
      easyFormIndexPrompt: DEFAULT_EASY_FORM_INDEX_PROMPT,
      easyFormModalPrompt: DEFAULT_EASY_FORM_MODAL_PROMPT,
      easyFormServicePrompt: DEFAULT_EASY_FORM_SERVICE_PROMPT,
      easyFormRefinePrompt: DEFAULT_EASY_FORM_REFINE_PROMPT,

      // Apifox defaults
      apifoxToken: '',
      apifoxProjects: [],

      // Best Examples
      bestExamples: [],
      bestExamplesEnabled: true,

      // Proxy Rules
      proxyRules: [],

      // Host Groups
      hostGroups: [],

      addPrompt: (prompt) =>
        set((state) => ({
          prompts: [
            ...state.prompts,
            {
              ...prompt,
              id: `prompt-${Date.now()}`,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ],
        })),

      updatePrompt: (id, updates) =>
        set((state) => ({
          prompts: state.prompts.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
          ),
        })),

      deletePrompt: (id) =>
        set((state) => ({
          prompts: state.prompts.filter((p) => p.id !== id),
        })),

      setApiKey: (key) => set({ apiKey: key }),

      updateModelConfig: (config) =>
        set((state) => ({
          modelConfig: { ...state.modelConfig, ...config },
        })),

      // Apifox actions
      setApifoxToken: (token) => set({ apifoxToken: token }),

      addApifoxProject: (project) =>
        set((state) => ({
          apifoxProjects: [...state.apifoxProjects, project],
        })),

      updateApifoxProject: (projectId, name) =>
        set((state) => ({
          apifoxProjects: state.apifoxProjects.map((p) =>
            p.projectId === projectId ? { ...p, name } : p
          ),
        })),

      removeApifoxProject: (projectId) =>
        set((state) => ({
          apifoxProjects: state.apifoxProjects.filter((p) => p.projectId !== projectId),
        })),

      // EasyForm prompt updaters
      updateEasyFormSpec: (spec) => set({ easyFormSpec: spec }),
      updateEasyFormIndexPrompt: (prompt) => set({ easyFormIndexPrompt: prompt }),
      updateEasyFormModalPrompt: (prompt) => set({ easyFormModalPrompt: prompt }),
      updateEasyFormServicePrompt: (prompt) => set({ easyFormServicePrompt: prompt }),
      updateEasyFormRefinePrompt: (prompt) => set({ easyFormRefinePrompt: prompt }),

      // Best Examples CRUD
      addBestExample: (example) =>
        set((state) => ({
          bestExamples: [
            ...state.bestExamples,
            {
              ...example,
              id: `example-${Date.now()}`,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ],
        })),

      updateBestExample: (id, updates) =>
        set((state) => ({
          bestExamples: state.bestExamples.map((e) =>
            e.id === id ? { ...e, ...updates, updatedAt: Date.now() } : e
          ),
        })),

      deleteBestExample: (id) =>
        set((state) => ({
          bestExamples: state.bestExamples.filter((e) => e.id !== id),
        })),

      setBestExamplesEnabled: (enabled) => set({ bestExamplesEnabled: enabled }),

      // Proxy Rules CRUD
      addProxyRule: (rule) =>
        set((state) => ({
          proxyRules: [
            ...state.proxyRules,
            {
              ...rule,
              id: `proxy-${Date.now()}`,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ],
        })),

      updateProxyRule: (id, updates) =>
        set((state) => ({
          proxyRules: state.proxyRules.map((r) =>
            r.id === id ? { ...r, ...updates, updatedAt: Date.now() } : r
          ),
        })),

      deleteProxyRule: (id) =>
        set((state) => ({
          proxyRules: state.proxyRules.filter((r) => r.id !== id),
        })),

      toggleProxyRule: (id) =>
        set((state) => ({
          proxyRules: state.proxyRules.map((r) =>
            r.id === id ? { ...r, enabled: !r.enabled, updatedAt: Date.now() } : r
          ),
        })),

      // Host Groups CRUD
      addHostGroup: (group) =>
        set((state) => ({
          hostGroups: [
            ...state.hostGroups,
            {
              ...group,
              id: `host-${Date.now()}`,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ],
        })),

      updateHostGroup: (id, updates) =>
        set((state) => ({
          hostGroups: state.hostGroups.map((h) =>
            h.id === id ? { ...h, ...updates, updatedAt: Date.now() } : h
          ),
        })),

      deleteHostGroup: (id) =>
        set((state) => ({
          hostGroups: state.hostGroups.filter((h) => h.id !== id),
        })),

      setActiveHostGroup: (id) =>
        set((state) => ({
          hostGroups: state.hostGroups.map((h) => ({
            ...h,
            isActive: h.id === id,
            updatedAt: h.id === id ? Date.now() : h.updatedAt,
          })),
        })),

      getActiveHost: (): string | null => {
        const { hostGroups } = useSettingsStore.getState() as SettingsStore;
        const activeGroup = hostGroups.find((h: HostGroup) => h.isActive);
        return activeGroup ? activeGroup.host : null;
      },
    }),
    {
      name: 'vcode-settings',
    }
  )
);
