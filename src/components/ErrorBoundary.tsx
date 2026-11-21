import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in AquiGastos:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetLocal = () => {
    localStorage.removeItem('aquigastos_active_session');
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#15171C] flex items-center justify-center p-4 text-slate-100">
          <div className="max-w-md w-full bg-[#1E2128] rounded-3xl p-6 sm:p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 text-amber-300 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Ops! Algo deu errado</h2>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              O aplicativo encontrou uma oscilação temporária. Não se preocupe, seus dados financeiros estão protegidos.
            </p>
            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full py-3 px-4 bg-slate-100 hover:bg-white font-bold text-sm text-slate-950 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <RefreshCw size={16} />
                <span>Recarregar Aplicativo</span>
              </button>
              <button
                onClick={this.handleResetLocal}
                className="w-full py-2.5 px-4 bg-[#15171C] hover:bg-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200 rounded-xl border border-slate-800 transition-all cursor-pointer"
              >
                <span>Voltar para tela inicial</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
