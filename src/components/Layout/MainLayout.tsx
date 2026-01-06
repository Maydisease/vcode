import { ReactNode } from 'react';
import './MainLayout.css';

interface MainLayoutProps {
    topBar: ReactNode;
    leftPanel: ReactNode;
    rightPanel: ReactNode;
    extraPanel?: ReactNode;
    statusBar: ReactNode;
}

export function MainLayout({ topBar, leftPanel, rightPanel, extraPanel, statusBar }: MainLayoutProps) {
    return (
        <div className="main-layout">
            {topBar}
            <div className="main-layout__content">
                {leftPanel && (
                    <div className="main-layout__left">
                        {leftPanel}
                    </div>
                )}
                <div className="main-layout__right">
                    {rightPanel}
                </div>
                {extraPanel && (
                    <div className="main-layout__extra">
                        {extraPanel}
                    </div>
                )}
            </div>
            {statusBar}
        </div>
    );
}
