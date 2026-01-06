import { useState } from 'react';
import { MainLayout } from './components/Layout/MainLayout';
import { TopBar } from './components/Layout/TopBar';
import { StatusBar } from './components/Layout/StatusBar';
import { WorkLog } from './components/WorkLog/WorkLog';
import { CodeEditor } from './components/CodeEditor/CodeEditor';
import { SettingsPage } from './components/Settings/SettingsPage';
import { ApiSelector } from './components/ApiSelector/ApiSelector';
import { SandboxPreview } from './components/Sandbox/SandboxPreview';
import { ToastContainer } from './components/Toast/Toast';
import { useGeneratorStore } from './stores/generatorStore';
import { useCodeGenerator } from './hooks/useCodeGenerator';
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
          />
        }
        leftPanel={viewMode === 'editor' ? <WorkLog /> : null}
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
