import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Code2, 
  Rocket, 
  User, 
  Palette, 
  GraduationCap, 
  Check, 
  Sparkles, 
  Layers, 
  ArrowRight, 
  ArrowLeft,
  Key,
  Mail,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Cloud,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import { GameEngine } from '../engine/GameEngine';
import { audioManager } from '../utils/audioManager';
import { hashPassword } from '../utils/cryptoUtils';
import { 
  checkPlayerNameExists, 
  registerCloudUser, 
  loginCloudUser, 
  uploadCloudSaveWithAntiFraud,
  fetchCloudSave 
} from '../utils/supabaseClient';

interface WelcomeModalProps {
  engine: GameEngine;
  onClose: (programmerName: string) => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ engine, onClose }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [authTab, setAuthTab] = useState<'register' | 'login'>('register');

  // Form Fields
  const [nameInput, setNameInput] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('terrascript_programmer_name');
      return saved && saved !== 'Dev Master' && saved !== 'Programador Anônimo' ? saved : 'Cmd. Python';
    }
    return 'Cmd. Python';
  });
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>('');

  // Migration & User state
  const [isPreImplementation, setIsPreImplementation] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const migrated = localStorage.getItem('terrascript_migrated');
      return migrated !== 'true';
    }
    return true;
  });

  const [educationalErrors, setEducationalErrors] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('terrascript_educational_errors') !== 'false';
    }
    return true;
  });

  // Validation & Loading States
  const [isCheckingName, setIsCheckingName] = useState<boolean>(false);
  const [nameStatus, setNameStatus] = useState<{ available?: boolean; message?: string }>({});
  const [authError, setAuthError] = useState<string>('');
  const [authSuccess, setAuthSuccess] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const presetTitles = [
    'Cmd. Python',
    'Ninja do JS',
    'Senior do Café',
    'Ninja do Indent',
    'Engenheiro(a) Chefe'
  ];

  // Debounced check for player name availability in step 2
  useEffect(() => {
    if (step !== 2 || authTab !== 'register' || !nameInput.trim() || nameInput.trim().length < 3) {
      setNameStatus({});
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingName(true);
      const res = await checkPlayerNameExists(nameInput.trim());
      setIsCheckingName(false);
      if (res.exists) {
        setNameStatus({ available: false, message: 'Nome já em uso na nuvem' });
      } else {
        setNameStatus({ available: true, message: 'Nome disponível!' });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [nameInput, step, authTab]);

  const handleNextStep1 = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    audioManager.playClick();
    setStep(2);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const cleanName = nameInput.trim();
    if (!cleanName || cleanName.length < 3) {
      setAuthError('O nome de jogador deve conter pelo menos 3 caracteres.');
      return;
    }

    if (!passwordInput || passwordInput.length < 4) {
      setAuthError('A senha deve conter pelo menos 4 caracteres.');
      return;
    }

    setIsSubmitting(true);
    audioManager.playClick();

    try {
      const passHash = await hashPassword(passwordInput);

      if (authTab === 'register') {
        if (!emailInput || !emailInput.includes('@')) {
          setAuthError('Por favor, informe um e-mail válido para registro.');
          setIsSubmitting(false);
          return;
        }

        const regRes = await registerCloudUser(cleanName, emailInput, passHash);
        if (!regRes.success) {
          setAuthError(regRes.message);
          setIsSubmitting(false);
          return;
        }
      } else {
        const loginRes = await loginCloudUser(cleanName, passHash);
        if (!loginRes.success) {
          setAuthError(loginRes.message);
          setIsSubmitting(false);
          return;
        }
      }

      // Sync local save data to cloud & set migrated flag
      const saveData = engine.exportSaveData();
      const resources = engine.getResources();
      const prestigeLevel = typeof engine.getPrestigeLevel === 'function' ? engine.getPrestigeLevel() : engine.getPrestige().level;

      const syncRes = await uploadCloudSaveWithAntiFraud(
        cleanName, 
        saveData, 
        resources.fiber, 
        prestigeLevel,
        saveData.currentTick || 0,
        0
      );

      if (typeof window !== 'undefined') {
        localStorage.setItem('terrascript_programmer_name', cleanName);
        localStorage.setItem('terrascript_migrated', 'true');
      }

      setIsPreImplementation(false);
      setAuthSuccess('🎉 Usuário autenticado e progresso sincronizado com a nuvem!');
      audioManager.playSuccess();

      setTimeout(() => {
        setIsSubmitting(false);
        setStep(3);
      }, 700);

    } catch (err: any) {
      console.error('Erro de autenticação:', err);
      setAuthError(err.message || 'Erro inesperado na autenticação.');
      setIsSubmitting(false);
    }
  };

  const handleFinalSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalName = nameInput.trim() || 'Cmd. Python';
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('terrascript_programmer_name', finalName);
      localStorage.setItem('terrascript_welcome_seen', 'true');
      localStorage.setItem('terrascript_educational_errors', educationalErrors ? 'true' : 'false');
      localStorage.setItem('terrascript_migrated', 'true');
    }

    engine.addLog(
      1,
      'system',
      `🎉 Seja bem-vindo(a), ${finalName}! Sistema de Sincronização em Nuvem ATIVO e pronto para executar scripts em main.py!`
    );

    audioManager.playSuccess();
    onClose(finalName);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#08090a]/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 font-pixel-body select-none">
      <div className="bg-[#0f1011] pixel-box-amber w-full max-w-lg overflow-hidden flex flex-col shadow-2xl">
        
        {/* Banner Header */}
        <div className="bg-[#08090a] p-4 sm:p-5 border-b-2 border-[#23252a] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Bot className="w-40 h-40 text-[#ffffff]" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 pixel-box bg-[#161718] text-[#22c55e] shrink-0">
                <Rocket className="w-5 h-5" />
              </div>
              <div>
                <span className="pixel-badge bg-[#22c55e] text-[#052e16] font-bold">
                  Estação Agro-Planetária
                </span>
                <h2 className="text-sm font-pixel-header text-[#ffffff] tracking-tight mt-1">
                  TerraScript 3D - Central de Comando
                </h2>
              </div>
            </div>

            {/* Step Badge */}
            <div className="px-2.5 py-1 pixel-badge bg-[#161718] text-[#8a8f98]">
              Etapa <span className="text-white font-bold">{step}</span>/3
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 text-xs leading-relaxed text-[#d0d6e0] max-h-[70vh] overflow-y-auto font-pixel-body">
          
          {/* STEP 1: Game Story & Lore */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
              <div className="p-4 pixel-box bg-[#161718] space-y-3 border-l-4 border-[#facc15]">
                <div className="flex items-center gap-2 text-[#facc15] font-pixel-header text-xs">
                  <Sparkles className="w-4 h-4 text-[#facc15]" />
                  <span>História & Contexto Missionário</span>
                </div>
                <p className="text-[#d0d6e0] font-pixel-body text-xs leading-relaxed">
                  No ano de 2088, seres extraterrestres altamente evoluídos selecionaram a Terra como o quadrante bio-tecnológico para cultivo de super-espécies. Para automatizar a colheita de Fibras, Madeiras e Flores de Energia, construímos Naves e Agentes robóticos inteligentes.
                </p>
                <p className="text-[#8a8f98] font-pixel-body text-xs leading-relaxed">
                  Sua missão é atuar como <strong className="text-[#ffffff]">Engenheiro(a) de Software Chefe</strong>, programando em <span className="text-[#facc15] font-pixel-mono">Python</span> ou <span className="text-[#38bdf8] font-pixel-mono">JavaScript</span> para automatizar a colheita, expandir a grade do quadrante e evoluir na Árvore Tecnológica!
                </p>
              </div>

              {isPreImplementation && (
                <div className="p-3.5 pixel-box bg-[#38bdf8]/10 border-[#38bdf8] space-y-1.5">
                  <div className="flex items-center gap-2 text-[#38bdf8] font-pixel-header text-xs">
                    <Cloud className="w-4 h-4 text-[#38bdf8]" />
                    <span>Nova Sincronização na Nuvem Ativa!</span>
                  </div>
                  <p className="text-[11px] text-[#d0d6e0] leading-normal font-pixel-body">
                    Identificamos que seu progresso é de uma versão anterior. Na próxima etapa, você criará ou entrará em sua conta em nuvem para migrar seus dados locais com segurança!
                  </p>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleNextStep1}
                  className="w-full py-2.5 pixel-btn pixel-btn-amber font-pixel-header text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Avançar para Criar / Acessar Conta em Nuvem</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Cloud Account Creation / Login & Migration */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
              
              {/* Migration Alert Banner */}
              {isPreImplementation && (
                <div className="p-3.5 pixel-box bg-[#f59e0b]/15 border-[#f59e0b] space-y-1">
                  <div className="flex items-center gap-2 text-[#f59e0b] font-pixel-header text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Migração Obrigatória de Progresso Local</span>
                  </div>
                  <p className="text-[11px] text-[#d0d6e0] font-pixel-body leading-normal">
                    Para garantir que seu progresso local não seja perdido, registre sua conta abaixo. Seus dados locais serão sincronizados e vinculados à nuvem imediatamente!
                  </p>
                </div>
              )}

              {/* Tab Selector: Criar Conta vs Entrar */}
              <div className="flex bg-[#08090a] p-1 pixel-box gap-1">
                <button
                  type="button"
                  onClick={() => { setAuthTab('register'); setAuthError(''); }}
                  className={`flex-1 py-1.5 pixel-btn text-xs font-bold transition-all ${
                    authTab === 'register' ? 'pixel-btn-amber text-[#0f172a]' : 'text-[#8a8f98] hover:text-white'
                  }`}
                >
                  <User className="w-3.5 h-3.5 inline mr-1" />
                  Criar Nova Conta
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthTab('login'); setAuthError(''); }}
                  className={`flex-1 py-1.5 pixel-btn text-xs font-bold transition-all ${
                    authTab === 'login' ? 'pixel-btn-cyan text-[#083344]' : 'text-[#8a8f98] hover:text-white'
                  }`}
                >
                  <Key className="w-3.5 h-3.5 inline mr-1" />
                  Já Tenho uma Conta
                </button>
              </div>

              {/* Auth Form */}
              <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                
                {/* Player Name Field */}
                <div>
                  <label className="block text-xs font-pixel-body text-[#ffffff] mb-1 flex items-center justify-between">
                    <span>Nome Único do(a) Programador(a)</span>
                    {authTab === 'register' && isCheckingName && (
                      <span className="text-[10px] text-[#38bdf8] flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Verificando...
                      </span>
                    )}
                    {authTab === 'register' && !isCheckingName && nameStatus.available !== undefined && (
                      <span className={`text-[10px] flex items-center gap-1 font-bold ${
                        nameStatus.available ? 'text-[#22c55e]' : 'text-[#ef4444]'
                      }`}>
                        {nameStatus.available ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {nameStatus.message}
                      </span>
                    )}
                  </label>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8a8f98]">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Ex: Cmd. Python, DevNinja, Carlos_TS..."
                      maxLength={24}
                      className="w-full pl-9 pr-3.5 py-2 bg-[#08090a] pixel-box focus:border-[#facc15] text-[#ffffff] font-pixel-mono text-xs outline-none transition-all placeholder:text-[#62666d]"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Preset Titles for Register */}
                  {authTab === 'register' && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {presetTitles.map((title) => (
                        <button
                          type="button"
                          key={title}
                          onClick={() => setNameInput(title)}
                          className={`px-2 py-0.5 pixel-btn text-[10px] transition-all cursor-pointer ${
                            nameInput === title
                              ? 'pixel-btn-amber text-[#0f172a]'
                              : 'text-[#8a8f98] hover:text-[#ffffff]'
                          }`}
                        >
                          + {title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Email Field (Only in Register mode) */}
                {authTab === 'register' && (
                  <div>
                    <label className="block text-xs font-pixel-body text-[#ffffff] mb-1 flex items-center justify-between">
                      <span>E-mail para Registro e Recuperação</span>
                      <span className="text-[10px] text-[#8a8f98]">Apenas para histórico</span>
                    </label>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8a8f98]">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="seu.email@exemplo.com"
                        className="w-full pl-9 pr-3.5 py-2 bg-[#08090a] pixel-box focus:border-[#facc15] text-[#ffffff] font-pixel-mono text-xs outline-none transition-all placeholder:text-[#62666d]"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                )}

                {/* Password Field */}
                <div>
                  <label className="block text-xs font-pixel-body text-[#ffffff] mb-1 flex items-center justify-between">
                    <span>Senha de Acesso em Nuvem</span>
                    <span className="text-[10px] text-[#8a8f98]">Mínimo 4 caracteres</span>
                  </label>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8a8f98]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3.5 py-2 bg-[#08090a] pixel-box focus:border-[#facc15] text-[#ffffff] font-pixel-mono text-xs outline-none transition-all placeholder:text-[#62666d]"
                      required
                      minLength={4}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Status Messages */}
                {authError && (
                  <div className="p-2.5 bg-[#ef4444]/15 border border-[#ef4444] text-[#ef4444] text-xs font-pixel-body flex items-start gap-2">
                    <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                {authSuccess && (
                  <div className="p-2.5 bg-[#22c55e]/15 border border-[#22c55e] text-[#22c55e] text-xs font-pixel-body flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{authSuccess}</span>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 pixel-btn pixel-btn-amber font-pixel-header text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sincronizando com a Nuvem...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>{authTab === 'register' ? 'Criar Conta e Sincronizar Progresso' : 'Entrar e Carregar Save Remoto'}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-[#8a8f98] hover:text-white text-[11px] flex items-center gap-1 transition-all cursor-pointer font-pixel-body"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Voltar para História</span>
                  </button>
                </div>

              </form>

            </div>
          )}

          {/* STEP 3: Progressive UI & Educational Helper Preferences */}
          {step === 3 && (
            <form onSubmit={handleFinalSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">

              {/* Highlight Notice: Game Interface Evolution */}
              <div className="p-3.5 pixel-box-amber bg-[#0f1011] space-y-1.5 relative overflow-hidden">
                <div className="flex items-center gap-2 text-[#facc15] font-pixel-header text-xs">
                  <div className="p-1.5 bg-[#facc15]/20 shrink-0">
                    <Layers className="w-4 h-4 text-[#facc15]" />
                  </div>
                  <span className="text-white text-xs font-pixel-header">
                    Evolução Progressiva da Interface
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-[#facc15] ml-auto animate-pulse" />
                </div>
                <p className="text-[11px] text-[#d0d6e0] leading-relaxed font-pixel-body">
                  <strong>A interface do jogo evolui junto com o seu progresso!</strong> Novos menus, botões avançados, barra de prestígio e robôs de frota surgirão organicamente à medida que você explora o código e desbloqueia pesquisas.
                </p>
              </div>

              {/* Educational Errors Toggle */}
              <div>
                <label className="block text-xs font-pixel-body text-[#ffffff] mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-[#a855f7]" />
                    <span>Auxílio Educativo para Erros (Modo Didático)</span>
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => setEducationalErrors(!educationalErrors)}
                  className={`w-full p-3 pixel-box flex items-start gap-3 transition-all text-left cursor-pointer ${
                    educationalErrors
                      ? 'bg-[#a855f7]/20 border-[#a855f7]'
                      : 'bg-[#08090a]'
                  }`}
                >
                  <div className={`mt-0.5 w-4 h-4 flex items-center justify-center shrink-0 transition-all ${
                    educationalErrors
                      ? 'bg-[#a855f7] text-white'
                      : 'bg-[#161718]'
                  }`}>
                    {educationalErrors && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div>
                    <div className="font-pixel-header text-xs text-[#ffffff]">
                      Exibir dicas explicativas em português em caso de erro de sintaxe
                    </div>
                    <div className="text-[11px] text-[#8a8f98] mt-0.5 leading-normal font-pixel-body">
                      Explicará causas comuns e dicas em linguagem amigável quando o robô encontrar falhas no código.
                    </div>
                  </div>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  className="w-full py-2.5 pixel-btn pixel-btn-green font-pixel-header text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Code2 className="w-4 h-4" />
                  <span>Assumir Comando e Iniciar Código!</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full py-1.5 text-[#8a8f98] hover:text-white text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer font-pixel-body"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Voltar para Conta em Nuvem</span>
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer info */}
        <div className="px-6 py-2.5 bg-[#08090a] border-t-2 border-[#23252a] flex items-center justify-between text-[10px] text-[#8a8f98] font-pixel-mono">
          <span>STATUS DA NUVEM: Sincronizado</span>
          <span>PROGRAMADOR: {nameInput.trim() || 'CMD. PYTHON'}</span>
        </div>

      </div>
    </div>
  );
};

