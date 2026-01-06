import { useCallback } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { useGeneratorStore } from '../stores/generatorStore';
import { useLogStore } from '../stores/logStore';
import { useProjectStore, parseMultiFileOutput } from '../stores/projectStore';
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
    const { addLog, startTask, completeTask, clearLogs } = useLogStore();
    const { setFiles, clearProject, addFileVersion } = useProjectStore();

    const handleImageUpload = useCallback(async (file: File) => {
        reset();
        clearLogs();
        clearProject();

        setImage(file);

        const reader = new FileReader();
        reader.onload = (e) => {
            const previewUrl = e.target?.result as string;
            setImagePreview(previewUrl);
            addLog(`已上传图片: ${file.name}`, 'info', previewUrl);
            // Show API selector after image upload
            setStep('api-select');
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

    /**
     * Generate a single file using selected AI provider
     * Returns the generated code and token counts
     */
    const generateSingleFile = useCallback(async (
        fileType: 'index' | 'modal' | 'service',
        selectedApis: SelectedApis | null
    ): Promise<{ code: string; inputTokens: number; outputTokens: number; promptContent: string }> => {
        const { currentImage } = useGeneratorStore.getState();
        if (!currentImage) throw new Error('No image uploaded');

        const customPrompt = buildEasyFormPrompt(selectedApis, fileType);
        const promptContents = [customPrompt, ...prompts.map(p => p.content)];

        // Calculate input tokens (prompts + image estimation)
        const combinedPrompts = promptContents.join('\n');


        console.log("combinedPrompts----->:", combinedPrompts);

        const inputTokenResult = await countTokens(combinedPrompts);
        // Add estimation for image tokens (typically ~250-750 tokens for Gemini/OpenAI)
        const imageTokenEstimate = 500;
        const inputTokens = inputTokenResult.count + imageTokenEstimate;

        const provider = modelConfig.provider || 'google';
        const generator = provider === 'google'
            ? generateCodeFromImage(currentImage, promptContents, modelConfig)
            : generateCodeFromImageOpenAI(currentImage, promptContents, modelConfig);

        let fullCode = '';
        for await (const chunk of generator) {
            fullCode += chunk;
        }

        const cleanedCode = stripMarkdownCodeBlock(fullCode);

        // Calculate output tokens
        const outputTokenResult = await countTokens(cleanedCode);

        return {
            code: cleanedCode,
            inputTokens,
            outputTokens: outputTokenResult.count,
            promptContent: combinedPrompts,
        };
    }, [prompts, modelConfig]);

    /**
     * Multi-stage code generation with 3 fixed files
     */
    const generateEasyFormCode = useCallback(async () => {
        const { currentImage, selectedApis } = useGeneratorStore.getState();

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
            setStep('generating');
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

            // Stage 1: Generate index.tsx
            const indexLogId = startTask('正在生成 index.tsx...');
            setProgress(10);
            const indexResult = await generateSingleFile('index', selectedApis);
            completeTask(indexLogId, 'index.tsx 生成完成', 'success', {
                inputTokens: indexResult.inputTokens,
                outputTokens: indexResult.outputTokens,
            }, indexResult.promptContent);

            // Stage 2: Generate modal.tsx
            const modalLogId = startTask('正在生成 modal.tsx...');
            setProgress(35);
            const modalResult = await generateSingleFile('modal', selectedApis);
            completeTask(modalLogId, 'modal.tsx 生成完成', 'success', {
                inputTokens: modalResult.inputTokens,
                outputTokens: modalResult.outputTokens,
            }, modalResult.promptContent);

            // Stage 3: Generate scope.service.ts
            const serviceLogId = startTask('正在生成 scope.service.ts...');
            setProgress(60);
            const serviceResult = await generateSingleFile('service', selectedApis);
            completeTask(serviceLogId, 'scope.service.ts 生成完成', 'success', {
                inputTokens: serviceResult.inputTokens,
                outputTokens: serviceResult.outputTokens,
            }, serviceResult.promptContent);

            // Stage 4: Refinement (merge and fix relationships)
            const refineLogId = startTask('正在整合优化代码...');
            setStep('refining');
            setProgress(80);

            const refinementPrompt = buildRefinementPrompt(indexResult.code, modalResult.code, serviceResult.code);
            const { currentImage: img } = useGeneratorStore.getState();

            // Calculate refinement input tokens
            const refineInputTokenResult = await countTokens(refinementPrompt);
            const refineInputTokens = refineInputTokenResult.count + 500; // Add image token estimate

            // Use correct API based on provider
            const refineGenerator = provider === 'google'
                ? generateCodeFromImage(img!, [refinementPrompt], modelConfig)
                : generateCodeFromImageOpenAI(img!, [refinementPrompt], modelConfig);

            let refinedCode = '';
            for await (const chunk of refineGenerator) {
                refinedCode += chunk;
                appendCode(chunk);
            }

            const cleanedCode = stripMarkdownCodeBlock(refinedCode);
            setGeneratedCode(cleanedCode);

            // Calculate refinement output tokens
            const refineOutputTokenResult = await countTokens(cleanedCode);

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
                // Also try to find raw JSON object
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
                // Fallback to file marker parsing
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

            completeTask(refineLogId, '代码整合优化完成', 'success', {
                inputTokens: refineInputTokens,
                outputTokens: refineOutputTokenResult.count,
            }, refinementPrompt);
            setStep('done');
            setProgress(100);
            addLog(`代码生成完成! 共 ${filesWithVersions.length} 个文件`, 'success');
        } catch (error) {
            const message = error instanceof Error ? error.message : '未知错误';
            addLog(`生成失败: ${message}`, 'error');
            setStep('idle');
        } finally {
            setIsGenerating(false);
        }
    }, [apiKey, modelConfig, addLog, startTask, completeTask, setIsGenerating, setStep, setProgress, setGeneratedCode, appendCode, setFiles, clearProject, generateSingleFile, addFileVersion]);

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
        } catch (error) {
            const message = error instanceof Error ? error.message : '未知错误';
            addLog(`生成失败: ${message}`, 'error');
        } finally {
            setIsGenerating(false);
        }
    }, [apiKey, prompts, modelConfig, addLog, startTask, completeTask, setIsGenerating, setGeneratedCode, appendCode, setProgress, setFiles, clearProject]);

    return {
        handleImageUpload,
        handleApiSelection,
        skipApiSelection,
        generateCode,
        generateEasyFormCode,
    };
}
