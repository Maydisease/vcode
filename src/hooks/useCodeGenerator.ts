import { useCallback } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { useGeneratorStore } from '../stores/generatorStore';
import { useLogStore } from '../stores/logStore';
import { useHistoryStore } from '../stores/historyStore';
import { useProjectStore, parseMultiFileOutput } from '../stores/projectStore';
import { invoke } from '@tauri-apps/api/core';
import { useUIStore } from '../stores/uiStore';
import { initializeGemini, generateCodeFromImage } from '../services/geminiService';
import { initializeOpenAI, generateCodeFromImageOpenAI } from '../services/openaiService';
import { buildEasyFormPrompt, buildRefinementPrompt } from '../services/easyFormService';
import { countTokens } from '../services/tokenService';
import type { SelectedApis } from '../components/ApiSelector/ApiSelector';

/**
 * Remove markdown code block wrappers (```language ... ```) and LLM thinking content
 */
function stripMarkdownCodeBlock(code: string): string {
    let cleanCode = code.trim();

    // Remove markdown code block wrappers
    const codeBlockRegex = /^```[\w]*\n?([\s\S]*?)\n?```$/;
    const match = cleanCode.match(codeBlockRegex);
    if (match) {
        cleanCode = match[1].trim();
    }

    // Remove LLM thinking/reasoning content that appears before actual code
    const lines = cleanCode.split('\n');
    let codeStartIndex = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // Check if this line looks like actual code (starts with import, class, const, etc.)
        if (/^(import|export|class|const|let|var|function|interface|type|async|\/\/|\/\*|from)/.test(line)) {
            codeStartIndex = i;
            break;
        }
        // Skip thinking markers, markdown headers, quotes, empty lines
        if (line === '' ||
            line.startsWith('*') ||
            line.startsWith('**') ||
            line.startsWith('>') ||
            line.startsWith('#') ||
            line.startsWith('---')) {
            continue;
        }
        // If it doesn't look like code or markdown, continue
        if (!/^[{}\[\]();]/.test(line)) {
            continue;
        }
        codeStartIndex = i;
        break;
    }

    // If we found actual code, strip everything before it
    if (codeStartIndex > 0) {
        cleanCode = lines.slice(codeStartIndex).join('\n');
    }

    // Detect and remove content from multiple files that got mixed in
    // Look for patterns like "// modal.tsx", "// scope.service.ts" or "/* modal.tsx */"
    const multiFilePatterns = [
        /\n\s*\/\/\s*(modal|index|scope)\.tsx?\s*(逻辑参考|实现)?.*$/gm,
        /\n\s*\/\*\s*(modal|index|scope)\.tsx?\s*\*\/.*$/gm,
    ];

    for (const pattern of multiFilePatterns) {
        const match = cleanCode.match(pattern);
        if (match && match.index !== undefined) {
            // Found a multi-file marker, truncate everything after it
            cleanCode = cleanCode.substring(0, match.index).trim();
        }
    }

    // Also truncate after the first "export default Xxx;" if there's more code after it
    const exportDefaultMatch = cleanCode.match(/export\s+default\s+\w+;?\s*\n/);
    if (exportDefaultMatch && exportDefaultMatch.index !== undefined) {
        const exportEnd = exportDefaultMatch.index + exportDefaultMatch[0].length;
        const remainingCode = cleanCode.substring(exportEnd).trim();
        // If there's significant code after export default (more than just whitespace/comments)
        // and it looks like it starts a new file (has imports), truncate it
        if (remainingCode.length > 10 && /^(\/\/|\/\*|import|const|class|function)/.test(remainingCode)) {
            cleanCode = cleanCode.substring(0, exportEnd).trim();
        }
    }

    // Remove trailing "###" lines
    cleanCode = cleanCode.replace(/\n\s*###\s*$/gm, '');
    cleanCode = cleanCode.replace(/^\s*###\s*$/gm, '');

    return cleanCode.trim();
}

export function useCodeGenerator() {
    const { apiKey, prompts, modelConfig } = useSettingsStore();
    const {
        setImage,
        setImagePreview,
        setGeneratedCode,
        appendCode,
        setIsGenerating,
        setProgress,
        setStep,
        setSelectedApis,
        reset
    } = useGeneratorStore();
    const { addLog, startTask, completeTask, clearLogs, setTaskComplete } = useLogStore();
    const { setFiles, clearProject, addFileVersion } = useProjectStore();
    const { addRecord } = useHistoryStore();

    const handleImageUpload = useCallback(async (file: File) => {
        reset();
        clearLogs();
        clearProject();

        // Switch to work log tab when uploading image
        useUIStore.getState().setSidePanelTab('log');

        setImage(file);

        const reader = new FileReader();
        reader.onload = (e) => {
            const previewUrl = e.target?.result as string;
            setImagePreview(previewUrl);
            addLog(`已上传图片: ${file.name}`, 'info', previewUrl);
            // Open the upload wizard dialog
            useGeneratorStore.getState().setWizardOpen(true);
            setStep('wizard-upload');
        };
        reader.readAsDataURL(file);
    }, [reset, clearLogs, clearProject, setImage, setImagePreview, addLog, setStep]);

    const handleApiSelection = useCallback((apis: SelectedApis | null) => {
        setSelectedApis(apis);
        if (apis) {
            const selected = [apis.createApi, apis.updateApi, apis.queryApi].filter(Boolean);
            addLog(`已选择 ${selected.length} 个接口`, 'info');
        }
    }, [setSelectedApis, addLog]);

    const skipApiSelection = useCallback(() => {
        setStep('idle');
        addLog('跳过接口选择', 'info');
    }, [setStep, addLog]);





    const dataURLtoFile = useCallback((dataURL: string, filename: string): File => {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    }, []);

    /**
     * Helper to run a background generation task with polling
     */
    const runGenerationTask = useCallback(async (
        taskKey: string,
        prompt: string,
        onProgress?: (content: string) => void
    ): Promise<{ code: string; task: any }> => {
        const { apiKey, modelConfig } = useSettingsStore.getState();
        const { imagePreview, activeTasks, setTask } = useGeneratorStore.getState();
        const { addApiLog } = useLogStore.getState();

        if (!apiKey) throw new Error('API Key not configured');
        if (!imagePreview) throw new Error('No image preview available');

        // Extract base64 and mime type
        const [meta, base64Data] = imagePreview.split(',');
        const mimeType = meta.match(/:(.*?);/)?.[1] || 'image/png';

        let taskId = activeTasks[taskKey];
        const startTime = Date.now();
        const apiUrl = `backend://${modelConfig.provider || 'system'}/${modelConfig.model || 'default'}`;

        // Estimate input tokens
        let inputTokens = 0;
        try {
            const countResult = await countTokens(prompt);
            inputTokens = countResult.count;
        } catch (e) {
            console.warn('Failed to count tokens:', e);
        }

        // If no active task, start one
        if (!taskId) {
            const provider = modelConfig.provider || 'google';
            // Use invoke directly to start task
            try {
                // Determine max tokens based on model
                let maxTokens = modelConfig.maxTokens;
                if (!maxTokens && modelConfig.model === 'gemini-2.0-flash') maxTokens = 8192;

                const { invoke } = await import('@tauri-apps/api/core');
                taskId = await invoke('start_generation_task', {
                    provider,
                    apiKey,
                    baseUrl: modelConfig.openaiBaseUrl,
                    model: modelConfig.model,
                    prompt,
                    imageBase64: base64Data,
                    imageMimeType: mimeType,
                    temperature: modelConfig.temperature,
                    topP: modelConfig.topP,
                    maxTokens: maxTokens || 4096,
                }) as string;

                setTask(taskKey, taskId);
                console.log(`Task ${taskKey} started: ${taskId}`);

            } catch (e) {
                console.error("Start task failed", e);
                addApiLog({
                    url: apiUrl,
                    reason: `Start Generation (${taskKey}) Failed`,
                    status: 'failed',
                    duration: Date.now() - startTime,
                    usage: { promptTokens: inputTokens, completionTokens: 0, totalTokens: inputTokens }
                });
                throw e;
            }
        } else {
            console.log(`Resuming task ${taskKey}: ${taskId}`);
        }

        // Polling loop
        const { invoke } = await import('@tauri-apps/api/core');
        let taskState: any = null;

        while (true) {
            try {
                taskState = await invoke('poll_task_status', { taskId });

                if (onProgress && taskState.content) {
                    onProgress(taskState.content);
                }

                if (taskState.status === 'completed') {
                    setTask(taskKey, null); // Clear task on completion

                    // Log success
                    // Note: Backend might not return usage yet, so we estimate
                    const contentLen = taskState.content?.length || 0;
                    const completionTokens = Math.ceil(contentLen / 4);
                    addApiLog({
                        url: apiUrl,
                        reason: `Generate ${taskKey}`,
                        status: 'success',
                        duration: Date.now() - startTime,
                        usage: {
                            promptTokens: inputTokens,
                            completionTokens: completionTokens,
                            totalTokens: inputTokens + completionTokens
                        }
                    });

                    return { code: taskState.content, task: taskState };
                }

                if (taskState.status === 'failed') {
                    setTask(taskKey, null);
                    addApiLog({
                        url: apiUrl,
                        reason: `Generate ${taskKey} Failed`,
                        status: 'failed',
                        duration: Date.now() - startTime,
                        usage: { promptTokens: inputTokens, completionTokens: 0, totalTokens: inputTokens }
                    });
                    throw new Error(taskState.error || 'Unknown error');
                }

                // Wait 1s before next poll
                await new Promise(r => setTimeout(r, 1000));
            } catch (e) {
                // If polling fails (e.g. backend restart), we might want to handle it. 
                // For now throw.
                throw e;
            }
        }
    }, [addLog]);

    /**
     * Generate a single file using task system
     */
    const generateSingleFile = useCallback(async (
        fileType: 'index' | 'modal' | 'service',
        selectedApis: SelectedApis | null
    ): Promise<{ code: string; inputTokens: number; outputTokens: number; promptContent: string }> => {
        const customPrompt = buildEasyFormPrompt(selectedApis, fileType);
        const { prompts } = useSettingsStore.getState();
        const promptContents = [customPrompt, ...prompts.map(p => p.content)];
        const combinedPrompts = promptContents.join('\n');

        // Estimate input tokens
        const inputTokenResult = await countTokens(combinedPrompts);
        const imageTokenEstimate = 500;
        const inputTokens = inputTokenResult.count + imageTokenEstimate;

        // Run task
        const { code } = await runGenerationTask(fileType, combinedPrompts);
        const cleanedCode = stripMarkdownCodeBlock(code);
        const outputTokenResult = await countTokens(cleanedCode);

        return {
            code: cleanedCode,
            inputTokens,
            outputTokens: outputTokenResult.count,
            promptContent: combinedPrompts,
        };
    }, [runGenerationTask]);

    /**
     * Multi-stage code generation with 3 fixed files
     */
    const generateEasyFormCode = useCallback(async () => {
        const execId = Math.random().toString(36).substring(7);
        console.log(`[Exec ${execId}] generateEasyFormCode called`);

        let { currentImage, selectedApis, imagePreview, activeTasks, isGenerating } = useGeneratorStore.getState();

        // Prevent double execution
        if (isGenerating) {
            console.log(`[Exec ${execId}] Generation already in progress (isGenerating=true), skipping.`);
            return;
        }

        // If no imagePreview, we can't do anything (unless we have tasks running?)
        if (!imagePreview && !currentImage) {
            addLog('请先上传设计图片', 'warning');
            return;
        }

        // If resuming (no File but have preview), use existing preview
        // No need to recreate File object if using base64 for generation
        // But Store needs currentImage for other logic? 
        // Let's assume currentImage check is mainly for UI.

        const { apiKey } = useSettingsStore.getState();
        if (!apiKey) {
            addLog('请先在设置中配置 API Key', 'error');
            return;
        }

        try {
            setIsGenerating(true);
            setStep('generating');

            // Only clear if NOT resuming (activeTasks empty)
            const isResuming = Object.keys(activeTasks).length > 0;
            if (!isResuming) {
                clearProject();
                clearLogs();
                setProgress(0);
                addLog('开始生成任务...', 'info');
            } else {
                addLog('正在恢复未完成的任务...', 'info');
            }

            // Stage 1: Generate all 3 files in parallel
            // We use Promise.all. If resuming, runGenerationTask handles picking up existing ID.

            const indexLogId = !isResuming ? startTask('正在生成 index.tsx...') : 'resume-index';
            const modalLogId = !isResuming ? startTask('正在生成 modal.tsx...') : 'resume-modal';
            const serviceLogId = !isResuming ? startTask('正在生成 scope.service.ts...') : 'resume-service';

            setProgress(10);

            // Run all 3 file generations in parallel
            const [indexResult, modalResult, serviceResult] = await Promise.all([
                generateSingleFile('index', selectedApis).then(async result => {
                    if (!isResuming) {
                        let promptId: string | undefined;
                        try {
                            promptId = await invoke('save_prompt', { content: result.promptContent });
                        } catch (e) {
                            console.error('Failed to save prompt:', e);
                        }

                        completeTask(
                            indexLogId,
                            'index.tsx 生成完成',
                            'success',
                            { inputTokens: result.inputTokens, outputTokens: result.outputTokens },
                            undefined,
                            promptId
                        );
                    }
                    return result;
                }),
                generateSingleFile('modal', selectedApis).then(async result => {
                    if (!isResuming) {
                        let promptId: string | undefined;
                        try {
                            promptId = await invoke('save_prompt', { content: result.promptContent });
                        } catch (e) {
                            console.error('Failed to save prompt:', e);
                        }

                        completeTask(
                            modalLogId,
                            'modal.tsx 生成完成',
                            'success',
                            { inputTokens: result.inputTokens, outputTokens: result.outputTokens },
                            undefined,
                            promptId
                        );
                    }
                    return result;
                }),
                generateSingleFile('service', selectedApis).then(async result => {
                    if (!isResuming) {
                        let promptId: string | undefined;
                        try {
                            promptId = await invoke('save_prompt', { content: result.promptContent });
                        } catch (e) {
                            console.error('Failed to save prompt:', e);
                        }

                        completeTask(
                            serviceLogId,
                            'scope.service.ts 生成完成',
                            'success',
                            { inputTokens: result.inputTokens, outputTokens: result.outputTokens },
                            undefined,
                            promptId
                        );
                    }
                    return result;
                }),
            ]);

            setProgress(60);

            // Stage 4: Refinement
            setStep('refining');
            setProgress(80);

            const refineLogId = !isResuming ? startTask('正在整合优化代码...') : 'resume-refine';

            const refinementPrompt = buildRefinementPrompt(indexResult.code, modalResult.code, serviceResult.code, selectedApis);

            const refineInputTokenResult = await countTokens(refinementPrompt);
            const refineInputTokens = refineInputTokenResult.count + 500;

            const { code: refinedCode } = await runGenerationTask('refine', refinementPrompt, (content) => {
                setGeneratedCode(stripMarkdownCodeBlock(content));
                // Append wouldn't work easily with full content replacement, so use setGeneratedCode logic or just ignore visuals
            });

            const cleanedCode = stripMarkdownCodeBlock(refinedCode);
            setGeneratedCode(cleanedCode);

            // ... (Parsing logic similar to before) ...

            // Try to parse as JSON first, fallback to file markers
            let indexCode = indexResult.code;
            let modalCode = modalResult.code;
            let serviceCode = serviceResult.code;

            try {
                // Extract JSON from the response (might be wrapped in ```json ... ```)
                let jsonStr = cleanedCode;
                const jsonMatch = cleanedCode.match(/```json\s*([\s\S]*?)\s*```/);
                if (jsonMatch) {
                    jsonStr = jsonMatch[1];
                }
                const jsonObjectMatch = jsonStr.match(/\{[\s\S]*"indexCode"[\s\S]*"modalCode"[\s\S]*"serviceCode"[\s\S]*\}/);
                if (jsonObjectMatch) {
                    jsonStr = jsonObjectMatch[0];
                }

                const parsed = JSON.parse(jsonStr);
                if (parsed.indexCode) indexCode = parsed.indexCode;
                if (parsed.modalCode) modalCode = parsed.modalCode;
                if (parsed.serviceCode) serviceCode = parsed.serviceCode;
                addLog('JSON 格式解析成功', 'info');
            } catch (jsonError) {
                addLog('JSON 解析失败，使用文件标记解析', 'warning');
                const files = parseMultiFileOutput(cleanedCode);
                files.forEach(f => {
                    const name = f.name.toLowerCase();
                    if (name === 'index.tsx') indexCode = f.content || indexCode;
                    else if (name === 'modal.tsx') modalCode = f.content || modalCode;
                    else if (name === 'scope.service.ts') serviceCode = f.content || serviceCode;
                });
            }

            // Clean each file's code
            indexCode = stripMarkdownCodeBlock(indexCode);
            modalCode = stripMarkdownCodeBlock(modalCode);
            serviceCode = stripMarkdownCodeBlock(serviceCode);

            // Create files with both versions
            const filesWithVersions = [
                {
                    id: 'file-1',
                    name: 'index.tsx',
                    type: 'file' as const,
                    content: indexCode,
                    language: 'typescript',
                    versions: [
                        { label: '初始生成', content: indexResult.code, timestamp: Date.now() },
                        { label: '回炉重造', content: indexCode, timestamp: Date.now() },
                    ],
                },
                {
                    id: 'file-2',
                    name: 'modal.tsx',
                    type: 'file' as const,
                    content: modalCode,
                    language: 'typescript',
                    versions: [
                        { label: '初始生成', content: modalResult.code, timestamp: Date.now() },
                        { label: '回炉重造', content: modalCode, timestamp: Date.now() },
                    ],
                },
                {
                    id: 'file-3',
                    name: 'scope.service.ts',
                    type: 'file' as const,
                    content: serviceCode,
                    language: 'typescript',
                    versions: [
                        { label: '初始生成', content: serviceResult.code, timestamp: Date.now() },
                        { label: '回炉重造', content: serviceCode, timestamp: Date.now() },
                    ],
                },
            ];

            setFiles(filesWithVersions);
            const refineOutputTokenResult = await countTokens(cleanedCode);

            if (!isResuming) {
                let promptId: string | undefined;
                try {
                    promptId = await invoke('save_prompt', { content: refinementPrompt });
                } catch (e) {
                    console.error('Failed to save prompt:', e);
                }

                completeTask(
                    refineLogId,
                    '代码整合优化完成',
                    'success',
                    { inputTokens: refineInputTokens, outputTokens: refineOutputTokenResult.count },
                    undefined,
                    promptId
                );
            }
            setStep('done');
            setProgress(100);
            addLog(`代码生成完成! 共 ${filesWithVersions.length} 个文件`, 'success');

            // Save to history
            try {
                const { imagePreview: imgP, selectedApis: apis } = useGeneratorStore.getState();
                addRecord({
                    imagePreview: imgP || undefined,
                    generatedCode: `===FILE: index.tsx===\n${indexCode}\n\n===FILE: modal.tsx===\n${modalCode}\n\n===FILE: scope.service.ts===\n${serviceCode}`,
                    files: filesWithVersions,
                    mode: 'easyform',
                    modelUsed: modelConfig.model || 'gemini-2.0-flash',
                    promptSummary: 'EasyForm 表单生成',
                    selectedApis: apis ? [apis.createApi?.summary, apis.updateApi?.summary, apis.queryApi?.summary].filter(Boolean) as string[] : undefined,
                    inputTokens: indexResult.inputTokens + modalResult.inputTokens + serviceResult.inputTokens + refineInputTokens,
                    outputTokens: indexResult.outputTokens + modalResult.outputTokens + serviceResult.outputTokens + refineOutputTokenResult.count,
                });
            } catch (historyError) {
                console.error(`[Exec ${execId}] Failed to save history:`, historyError);
                // Don't fail the generation just because history save failed
                addLog('生成成功，但保存历史记录失败 (本地存储已满)', 'warning');
            }
        } catch (error) {
            // If the main task flow has already completed successfully (step is done),
            // ignore any subsequent errors (e.g. from phantom parallel tasks or quota issues in background)
            if (useGeneratorStore.getState().step === 'done') {
                console.warn(`[Exec ${execId}] Ignored error after task completion:`, error);
                return;
            }

            console.error(`[Exec ${execId}] Error caught:`, error);
            const message = error instanceof Error ? error.message : '未知错误';
            addLog(`生成失败: ${message}`, 'error');
            setStep('idle');
        } finally {
            console.log(`[Exec ${execId}] Finished (finally block)`);
            setTaskComplete(); // Record end time for duration display
            setIsGenerating(false);
        }
    }, [apiKey, modelConfig, addLog, startTask, completeTask, setIsGenerating, setStep, setProgress, setGeneratedCode, appendCode, setFiles, clearProject, generateSingleFile, addFileVersion, dataURLtoFile, runGenerationTask, setTaskComplete]);

    /**
     * Simple single-file generation (legacy mode)
     */
    const generateCode = useCallback(async () => {
        const { currentImage } = useGeneratorStore.getState();

        if (!currentImage) {
            addLog('请先上传设计图片', 'warning');
            return;
        }

        if (!apiKey) {
            addLog('请先在设置中配置 API Key', 'error');
            return;
        }

        try {
            setIsGenerating(true);
            setGeneratedCode('');
            clearProject();
            setProgress(0);

            const provider = modelConfig.provider || 'google';
            const initLogId = startTask(provider === 'google' ? '初始化 Gemini API...' : '初始化 OpenAI API...');
            if (provider === 'google') {
                initializeGemini(apiKey);
            } else {
                initializeOpenAI(apiKey, modelConfig.openaiBaseUrl);
            }
            completeTask(initLogId, provider === 'google' ? 'Gemini API 初始化完成' : 'OpenAI API 初始化完成', 'success');

            const generateLogId = startTask('正在解析图片并生成代码...');
            setProgress(10);

            const promptContents = prompts.map((p) => p.content);

            const generator = provider === 'google'
                ? generateCodeFromImage(currentImage, promptContents, modelConfig)
                : generateCodeFromImageOpenAI(currentImage, promptContents, modelConfig);

            let fullCode = '';
            for await (const chunk of generator) {
                fullCode += chunk;
                appendCode(chunk);
                const progress = Math.min(10 + (fullCode.length / 100), 90);
                setProgress(progress);
            }

            const cleanedCode = stripMarkdownCodeBlock(fullCode);
            setGeneratedCode(cleanedCode);

            const files = parseMultiFileOutput(cleanedCode);
            setFiles(files);

            completeTask(generateLogId, `代码生成完成! 共 ${files.length} 个文件`, 'success');
            setProgress(100);

            // Save to history
            const { imagePreview } = useGeneratorStore.getState();
            addRecord({
                imagePreview: imagePreview || undefined,
                generatedCode: cleanedCode,
                files: files,
                mode: 'general',
                modelUsed: modelConfig.model || 'gemini-2.0-flash',
                promptSummary: '通用代码生成',
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : '未知错误';
            addLog(`生成失败: ${message}`, 'error');
        } finally {
            setIsGenerating(false);
        }
    }, [apiKey, prompts, modelConfig, addLog, startTask, completeTask, setIsGenerating, setGeneratedCode, appendCode, setProgress, setFiles, clearProject, addRecord]);

    return {
        handleImageUpload,
        handleApiSelection,
        skipApiSelection,
        generateCode,
        generateEasyFormCode,
    };
}
