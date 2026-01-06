import React from 'react';
import { X, Sparkles, Rocket, Calendar, CheckCircle2 } from 'lucide-react';

// --- LISTA DE ATUALIZAÇÕES (Adicione novas aqui no topo) ---
const updatesData = [
  {
    version: '2.1',
    date: '06/01/2026',
    title: 'Gestão de Escalas e Folgas',
    description: 'Agora é possível cadastrar folgas totais ou parciais para os técnicos. O sistema avisa visualmente no Kanban e no Calendário quando um técnico está indisponível.',
    type: 'major' // major = destaque
  },
  {
    version: '2.0',
    date: '05/01/2026',
    title: 'Painel Comercial & Notificações',
    description: 'Nova aba com indicadores manuais de vendas/cancelamentos e sistema de notificações em tempo real para alterações de OS.',
    type: 'feature'
  },
  {
    version: '1.5',
    date: '02/01/2026',
    title: 'Controle de Acesso',
    description: 'Separação total entre perfil Admin (Configurações) e Interno (Operacional).',
    type: 'fix'
  }
];

// --- COMPONENTE 1: BANNER DO LOGIN (Animado) ---
export function UpdateBanner() {
  const latest = updatesData[0]; // Pega a última atualização

  return (
    <div className="mb-6 relative group cursor-default">
      <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-indigo-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
      <div className="relative px-4 py-3 bg-white ring-1 ring-gray-900/5 rounded-lg leading-none flex items-top justify-start space-x-4 shadow-sm border-l-4 border-[#EB6410]">
        <div className="space-y-1">
          <p className="text-slate-800 font-bold text-sm flex items-center gap-2">
            <Sparkles size={16} className="text-[#EB6410]" /> 
            Novidade: {latest.title}
            <span className="bg-indigo-100 text-indigo-700 text-[9px] px-2 py-0.5 rounded-full uppercase font-extrabold tracking-wider">v{latest.version}</span>
          </p>
          <p className="text-slate-500 text-xs line-clamp-2">
            {latest.description}
          </p>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTE 2: SIDEBAR DE HISTÓRICO (Pop-up Lateral) ---
export function UpdatesDrawer({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay Escuro (Clica para fechar) */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      {/* Conteúdo Lateral */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-slide-in-right flex flex-col border-l border-gray-200">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-full text-[#EB6410]">
              <Rocket size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg text-gray-800">Notas de Atualização</h2>
              <p className="text-xs text-gray-500">Histórico de evoluções do sistema</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Lista de Updates (Timeline) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {updatesData.map((up, idx) => (
            <div key={idx} className="relative pl-8 border-l-2 border-gray-200 last:border-0">
              {/* Bolinha da Timeline */}
              <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${idx === 0 ? 'bg-[#EB6410]' : 'bg-gray-300'}`}></div>
              
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${idx === 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                    v{up.version}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar size={10} /> {up.date}
                  </span>
                </div>
                
                <h3 className="font-bold text-gray-800 text-sm">{up.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100 mt-1">
                  {up.description}
                </p>
              </div>
            </div>
          ))}
          
          <div className="text-center pt-8 opacity-50">
            <CheckCircle2 size={32} className="mx-auto text-gray-300 mb-2"/>
            <p className="text-xs text-gray-400">Você está na versão mais recente.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 text-center">
          <p className="text-[10px] text-gray-400">Sys3 Internet © 2026 - Desenvolvido por Miguel</p>
        </div>
      </div>
    </div>
  );
}