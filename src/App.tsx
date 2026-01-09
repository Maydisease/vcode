import { useState, useEffect } from 'react';
import { getVersion } from '@tauri-apps/api/app';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { MainLayout } from './components/Layout/MainLayout';
import { TopBar } from './components/Layout/TopBar';
import { StatusBar } from './components/Layout/StatusBar';
import { SidePanel } from './components/SidePanel/SidePanel';
import { CodeEditor } from './components/CodeEditor/CodeEditor';
import { SettingsPage } from './components/Settings/SettingsPage';
import { UploadWizard } from './components/UploadWizard/UploadWizard';
import { SandboxPreview } from './components/Sandbox/SandboxPreview';
import { ToastContainer } from './components/Toast/Toast';
import { useGeneratorStore } from './stores/generatorStore';
import { useCodeGenerator } from './hooks/useCodeGenerator';
import { useProjectStore, parseMultiFileOutput } from './stores/projectStore';
import { useHistoryStore } from './stores/historyStore';
import './App.css';
import './styles/global.css';

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');
  const { setGeneratedCode, needsResume, setNeedsResume, imagePreview, selectedApis } = useGeneratorStore();
  const { setFiles } = useProjectStore();
  const { generateEasyFormCode } = useCodeGenerator();

  useEffect(() => {
    const updateTitle = async () => {
      try {
        const version = await getVersion();
        const appWindow = getCurrentWindow();
        await appWindow.setTitle(`vcode v${version}`);
      } catch (error) {
        console.error('Failed to set window title:', error);
      }
    };
    updateTitle();

    // Initialize history from backend
    useHistoryStore.getState().fetchHistory();

  }, []);

  // Auto-resume generation on page load if there are pending tasks
  useEffect(() => {
    if (needsResume && imagePreview) {
      // Clear the resume flag first to prevent infinite loop
      setNeedsResume(false);

      // Small delay to ensure all stores are hydrated
      const timer = setTimeout(() => {
        console.log('Resuming interrupted generation...');
        generateEasyFormCode();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [needsResume, imagePreview, selectedApis, setNeedsResume, generateEasyFormCode]);

  const handleRestoreCode = (code: string) => {
    setGeneratedCode(code);
    const files = parseMultiFileOutput(code);
    setFiles(files);
  };

  if (showSettings) {
    return <SettingsPage onBack={() => setShowSettings(false)} />;
  }

  return (
    <>
      <MainLayout
        topBar={
          <TopBar
            onSettingsClick={() => setShowSettings(true)}
            onPreviewClick={() => setViewMode('preview')}
            onHistoryClick={() => {
              // Maybe implement auto-switch to history tab?
              // For now simpler to just remove the button or use it to focus history tab
              // But SidePanel manages its own state. 
              // We'll leave the button for now or remove it if user prefers.
              // Given the request "merge", typically we rely on tabs.
            }}
          />
        }
        leftPanel={viewMode === 'editor' ? <SidePanel onRestoreCode={handleRestoreCode} /> : null}
        rightPanel={
          viewMode === 'editor' ? (
            <CodeEditor />
          ) : (
            <SandboxPreview onBack={() => setViewMode('editor')} />
          )
        }
        statusBar={<StatusBar />}
      />
      <UploadWizard />
      <ToastContainer />
    </>
  );
}

export default App;
