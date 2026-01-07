import { useState } from 'react';
import { MainLayout } from './components/Layout/MainLayout';
import { TopBar } from './components/Layout/TopBar';
import { StatusBar } from './components/Layout/StatusBar';
import { SidePanel } from './components/SidePanel/SidePanel';
import { CodeEditor } from './components/CodeEditor/CodeEditor';
import { SettingsPage } from './components/Settings/SettingsPage';
import { ApiSelector } from './components/ApiSelector/ApiSelector';
import { SandboxPreview } from './components/Sandbox/SandboxPreview';
import { ToastContainer } from './components/Toast/Toast';
import { useGeneratorStore } from './stores/generatorStore';
import { useCodeGenerator } from './hooks/useCodeGenerator';
import { useProjectStore, parseMultiFileOutput } from './stores/projectStore';
import './App.css';
import './styles/global.css';

// Wrapper component that includes API selector overlay
function ApiSelectorOverlay() {
  const { step } = useGeneratorStore();
  const { handleApiSelection, skipApiSelection, generateEasyFormCode } = useCodeGenerator();

  if (step !== 'api-select') {
    return null;
  }

  return (
    <div className="api-selector-overlay">
      <ApiSelector
        onConfirm={(apis) => {
          handleApiSelection(apis);
          generateEasyFormCode();
        }}
        onSkip={() => {
          skipApiSelection();
        }}
      />
    </div>
  );
}

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');
  const { setGeneratedCode } = useGeneratorStore();
  const { setFiles } = useProjectStore();

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
      <ApiSelectorOverlay />
      <ToastContainer />
    </>
  );
}

export default App;
