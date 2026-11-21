import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIOSDevice);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  // Only show if prompt is available OR on iOS device (when not installed)
  if (!deferredPrompt && !isIOS) {
    return null;
  }

  return (
    <>
      <button
        id="btn-pwa-install"
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all cursor-pointer active:scale-95 shadow-xs"
        title="Instalar aplicativo na tela inicial do seu celular ou tablet"
      >
        <Smartphone size={14} className="text-emerald-400" />
        <span className="hidden sm:inline">Instalar App</span>
      </button>

      {/* iOS Install Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-[#1E2128] border border-slate-700/80 rounded-3xl p-6 text-slate-100 relative">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 rounded-2xl overflow-hidden mb-4 border border-emerald-500/30 bg-[#1E2128]">
              <img src="/icon.svg" alt="App Icon" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>

            <h3 className="text-base font-bold text-white mb-2">
              Instalar o AquiGastos no iPhone/iPad
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Para instalar na sua tela inicial como um app nativo:
            </p>

            <ol className="space-y-2 text-xs text-slate-300 list-decimal list-inside bg-slate-900/60 p-3.5 rounded-2xl mb-5">
              <li>Toque no botão <strong>Compartilhar</strong> (ícone de quadrado com seta para cima) na barra inferior do Safari.</li>
              <li>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>.</li>
              <li>Confirme tocando em <strong>"Adicionar"</strong> no canto superior direito.</li>
            </ol>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-500 text-[#15171C] font-bold text-xs hover:bg-emerald-400 transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
};
