import React, { Component, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import '@fontsource-variable/fraunces';
import '@fontsource-variable/jetbrains-mono';
import '@fontsource-variable/plus-jakarta-sans';
import './index.css';

interface ErrorBoundaryState {
  hasError: boolean;
}

class PlannerErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  handleReset = () => {
    const ok = window.confirm(
      'Esto borrará todas tus tareas y plantillas guardadas en este navegador. Esta acción no se puede deshacer. ¿Continuar?'
    );
    if (!ok) return;
    try {
      localStorage.removeItem('mi_dia_24h_time_format_v1');
      localStorage.removeItem('mi_dia_24h_days_v1');
      localStorage.removeItem('mi_dia_24h_templates_v1');
      localStorage.removeItem('mi_dia_24h_initialized_v1');
    } catch {
      // Ignore storage errors
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#EEF5FC] text-[#223A5E] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#FAFBFD] border border-[#C7DCF2] rounded-3xl p-6 text-center space-y-4 shadow-lg">
            <h1 className="font-display text-xl font-semibold">
              Ocurrió un problema al cargar tu hoja
            </h1>
            <p className="text-sm text-[#5E7A9E]">
              Puedes recargar la aplicación o restablecer los datos locales si el
              problema continúa.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2.5 rounded-xl border border-[#C7DCF2] text-sm font-medium hover:bg-[#E1EEFA] transition-colors"
              >
                Recargar
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2.5 rounded-xl bg-[#568FD1] text-white text-sm font-semibold hover:bg-[#4279BA] transition-colors"
              >
                Restablecer datos
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <PlannerErrorBoundary>
    <App />
  </PlannerErrorBoundary>
);
