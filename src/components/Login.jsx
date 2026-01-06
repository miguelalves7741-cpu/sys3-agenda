import React, { useState, useEffect, useRef } from 'react';
import { Lock, Sparkles } from 'lucide-react';
import logoSys3 from '../assets/imgLOGO.png'; 
import { UpdateBanner, UpdatesDrawer } from './SystemUpdates'; // <--- IMPORT DA SIDEBAR TAMBÉM

// --- CÓDIGO DO ROBÔ ---
const AdvancedRobot = ({ isPasswordFocused }) => {
  const [eyePos, setEyePos] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const faceRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isPasswordFocused || !faceRef.current) return;
      const { left, top, width, height } = faceRef.current.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      const x = Math.min(Math.max((e.clientX - centerX) / 15, -12), 12);
      const y = Math.min(Math.max((e.clientY - centerY) / 15, -8), 8);
      setEyePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isPasswordFocused]);

  useEffect(() => {
    const blinkLoop = setInterval(() => {
      if (!isPasswordFocused) {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 200);
      }
    }, 4000);
    return () => clearInterval(blinkLoop);
  }, [isPasswordFocused]);

  return (
    <div className="relative w-40 h-40 mx-auto mb-2 flex justify-center items-center">
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .eye-glow { filter: drop-shadow(0 0 5px #00FFFF); }
      `}</style>
      <div className="relative w-full h-full animate-float">
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl">
          <path d="M100,40 L100,20" stroke="#EB6410" strokeWidth="4" strokeLinecap="round" />
          <circle cx="100" cy="15" r="5" fill="#EB6410"><animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" /></circle>
          <rect x="40" y="40" width="120" height="100" rx="25" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="2" />
          <rect x="45" y="45" width="110" height="90" rx="20" fill="url(#gradOrange)" />
          <defs><linearGradient id="gradOrange" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#EB6410" /><stop offset="100%" stopColor="#c04d05" /></linearGradient></defs>
          <rect ref={faceRef} x="55" y="65" width="90" height="50" rx="15" fill="#1F2937" stroke="#374151" strokeWidth="2" />
          {isPasswordFocused ? (
            <g className="eye-glow">
              <line x1="70" y1="90" x2="90" y2="90" stroke="#00FFFF" strokeWidth="4" strokeLinecap="round" />
              <line x1="110" y1="90" x2="130" y2="90" stroke="#00FFFF" strokeWidth="4" strokeLinecap="round" />
            </g>
          ) : (
            <g style={{ transform: `translate(${eyePos.x}px, ${eyePos.y}px)`, transition: 'transform 0.1s ease-out' }}>
              {isBlinking ? (
                <g className="eye-glow"><line x1="70" y1="90" x2="90" y2="90" stroke="#00FFFF" strokeWidth="2" strokeLinecap="round" opacity="0.5" /><line x1="110" y1="90" x2="130" y2="90" stroke="#00FFFF" strokeWidth="2" strokeLinecap="round" opacity="0.5" /></g>
              ) : (
                <g><circle cx="80" cy="90" r="8" fill="#00FFFF" className="eye-glow" /><circle cx="83" cy="87" r="3" fill="white" opacity="0.8" /><circle cx="120" cy="90" r="8" fill="#00FFFF" className="eye-glow" /><circle cx="123" cy="87" r="3" fill="white" opacity="0.8" /></g>
              )}
            </g>
          )}
        </svg>
      </div>
      <div className="absolute bottom-4 w-20 h-2 bg-black/10 rounded-full blur-sm animate-pulse"></div>
    </div>
  );
};

// --- COMPONENTE LOGIN (COM SIDEBAR CONECTADA) ---
export default function Login({ onLogin, error }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPwdFocused, setIsPwdFocused] = useState(false);
  
  // ESTADO PARA ABRIR A SIDEBAR
  const [showUpdates, setShowUpdates] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-4">
      <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#EB6410 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      
      {/* RENDERIZA A SIDEBAR AQUI */}
      <UpdatesDrawer isOpen={showUpdates} onClose={() => setShowUpdates(false)} />

      <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl w-full max-w-4xl border border-white relative z-10 flex flex-col md:flex-row overflow-hidden">
        
        {/* ÁREA LATERAL ESQUERDA (NOVIDADES) */}
        <div className="hidden md:flex md:w-5/12 bg-orange-50/50 border-r border-orange-100 p-8 flex-col justify-center items-center text-center">
           <div className="mb-6">
             <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 text-[#EB6410]">
                <Sparkles size={24} />
             </div>
             <h3 className="text-[#EB6410] font-bold text-lg">O que há de novo?</h3>
             <p className="text-xs text-gray-500 mt-1">Acompanhe as melhorias da versão 2.1</p>
           </div>
           
           {/* O BANNER AGORA É CLICÁVEL */}
           <div className="w-full transform transition hover:scale-105 duration-300 cursor-pointer" onClick={() => setShowUpdates(true)}>
             <UpdateBanner />
           </div>

           <p className="text-[10px] text-gray-400 mt-8 leading-relaxed max-w-[200px]">
             Clique no card acima para ler os detalhes completos.
           </p>
        </div>

        {/* ÁREA DIREITA (LOGIN + ROBÔ) */}
        <div className="w-full md:w-7/12 p-8 md:p-12 flex flex-col justify-center">
          <div className="flex justify-center mb-4"><img src={logoSys3} className="h-14 object-contain" alt="Logo" /></div>
          <AdvancedRobot isPasswordFocused={isPwdFocused} />
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-1">Bem-vindo</h2>
          <p className="text-center text-gray-500 mb-6 text-sm font-medium">Faça login para gerenciar a rede.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">E-mail</label>
              <input type="email" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:border-[#EB6410] focus:ring-2 focus:ring-orange-100 outline-none transition font-medium text-gray-700" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@sys3.com.br" onFocus={() => setIsPwdFocused(false)}/>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Senha</label>
              <input type="password" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:border-[#EB6410] focus:ring-2 focus:ring-orange-100 outline-none transition font-medium text-gray-700" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" onFocus={() => setIsPwdFocused(true)} onBlur={() => setIsPwdFocused(false)}/>
            </div>
            {error && <p className="text-red-500 text-sm font-bold text-center bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}
            <button type="submit" className="w-full bg-gradient-to-r from-[#EB6410] to-[#c04d05] hover:opacity-90 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-200 transition transform hover:scale-[1.02]"><Lock size={18} /> Acessar Painel</button>
          </form>
          <p className="text-center text-[10px] text-gray-400 mt-6 font-medium">SYS3 INTERNET © 2026</p>
        </div>
      </div>
    </div>
  );
}