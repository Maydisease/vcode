// EasyForm Code Generation Service
// Handles multi-file generation with 3 fixed output files

import { useSettingsStore } from '../stores/settingsStore';
import { type SelectedApis } from '../components/ApiSelector/ApiSelector';
import { formatEndpointForPrompt, extractRequestFields } from './apifoxService';

/**
 * Build the complete prompt for generating EasyForm code
 * Reads prompt templates from settings store
 */
export function buildEasyFormPrompt(
  selectedApis: SelectedApis | null,
  fileType: 'index' | 'modal' | 'service'
): string {
  const state = useSettingsStore.getState();
  const apiContext = selectedApis ? buildApiContext(selectedApis) : '';

  const basePrompt = `你是一个专业的 React 前端开发工程师。

=== EasyFormService 规范 ===
${state.easyFormSpec}

${apiContext}

【重要】输出格式：
- 只输出纯代码，不要任何解释
- 不要使用 markdown 代码块包裹
- 直接输出可运行的代码`;

  switch (fileType) {
    case 'index':
      return `${basePrompt}\n\n${state.easyFormIndexPrompt}`;
    case 'modal':
      return `${basePrompt}\n\n${state.easyFormModalPrompt}`;
    case 'service':
      return `${basePrompt}\n\n${state.easyFormServicePrompt}`;
    default:
      return basePrompt;
  }
}

/**
 * Build API context from selected endpoints
 */
function buildApiContext(selectedApis: SelectedApis): string {
  const parts: string[] = ['=== 接口定义 ==='];

  if (selectedApis.createApi) {
    parts.push(`\n【添加接口】\n${formatEndpointForPrompt(selectedApis.createApi)}`);
    const fields = extractRequestFields(selectedApis.createApi);
    parts.push(`字段列表: ${JSON.stringify(fields, null, 2)}`);
  }

  if (selectedApis.updateApi) {
    parts.push(`\n【修改接口】\n${formatEndpointForPrompt(selectedApis.updateApi)}`);
    const fields = extractRequestFields(selectedApis.updateApi);
    parts.push(`字段列表: ${JSON.stringify(fields, null, 2)}`);
  }

  if (selectedApis.queryApi) {
    parts.push(`\n【查询接口】\n${formatEndpointForPrompt(selectedApis.queryApi)}`);
  }

  if (selectedApis.columnsCode) {
    parts.push(`\n【重要表格配置】\n请在 EasyTable 组件中必须添加属性: columnsCode="${selectedApis.columnsCode}"\n注意：不需要生成 columns 定义，后端会根据 columnsCode 自动下发。`);
  }

  return parts.join('\n');
}

/**
 * Build the refinement prompt for merging 3 files
 * Reads template from settings store
 */
export function buildRefinementPrompt(
  indexCode: string,
  modalCode: string,
  serviceCode: string
): string {
  const state = useSettingsStore.getState();

  // Build best examples section if enabled and any exist
  let examplesSection = '';
  if (state.bestExamplesEnabled && state.bestExamples && state.bestExamples.length > 0) {
    examplesSection = '\n=== 最佳例子参考 ===\n';
    state.bestExamples.forEach((example, index) => {
      examplesSection += `\n--- 例子 ${index + 1}: ${example.name} ---\n`;
      if (example.description) {
        examplesSection += `描述: ${example.description}\n`;
      }
      examplesSection += `\n[index.tsx]\n${example.indexCode || '(无)'}\n`;
      examplesSection += `\n[modal.tsx]\n${example.modalCode || '(无)'}\n`;
      examplesSection += `\n[scope.service.ts]\n${example.serviceCode || '(无)'}\n`;
    });
    examplesSection += '\n请参考以上最佳例子的代码风格和结构进行优化。\n';
  }

  return `${state.easyFormRefinePrompt}
${examplesSection}
=== 待整合的代码 ===

=== index.tsx ===
${indexCode}

=== modal.tsx ===
${modalCode}

=== scope.service.ts ===
${serviceCode}`;
}
