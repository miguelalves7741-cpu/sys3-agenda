import React from 'react';
import { X, Zap } from 'lucide-react';

// Mantemos o nome UpdatesDrawer que o App.jsx usa
export const UpdatesDrawer = ({ isOpen, onClose }) => {
  
  const updates = [
    {
      version: "3.5.0",
      date: "08/01/2026",
      title: "O Salto de Gestão 360°",
      type: "major",
      desc: "Implementação completa dos módulos de Inteligência Comercial e Auditoria Operacional.",
      changes: [
        "Agenda Inteligente: Adicionada 'Regra do Dia' para definir vagas manualmente.",
        "Comercial Automático: Gráficos de Vendas e Churn agora são lidos em tempo real.",
        "Auditoria de Performance: Clique no nome do técnico para ver a lista detalhada.",
        "Robô V33: Leitura exata da 'Data de Finalização' do SGP.",
        "Filtros Visuais: 'Retiradas' e 'Cancelamentos' contam no financeiro mas não ocupam a agenda."
      ]
    },
    {
      version: "3.2.1",
      date: "08/01/2026",
      title: "Refinamentos Visuais",
      type: "minor",
      desc: "Melhorias na identificação visual de turnos e organização dos cards.",
      changes: [
        "Novos selos de Turno: Ícones de Sol (Manhã) e Lua (Tarde).",
        "Correção na exibição de OSs misturadas no modal do dia.",
        "Sincronização em tempo real das Metas de Vagas."
      ]
    }
  ];

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <div className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Zap className="text-[#EB6410]" size={20} /> Atualizações
            </h2>
            <p className="text-xs text-gray-500">Histórico de evoluções</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-5 h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar space-y-8">
          {updates.map((update, index) => (
            <div key={index} className="relative pl-6 border-l-2 border-gray-200 last:border-0">
              <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${index === 0 ? 'bg-[#EB6410] ring-4 ring-orange-100' : 'bg-gray-300'}`}></div>
              
              <div className="mb-1 flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${index === 0 ? 'bg-orange-100 text-[#EB6410]' : 'bg-gray-100 text-gray-500'}`}>
                  v{update.version}
                </span>
                <span className="text-xs text-gray-400 font-medium">{update.date}</span>
              </div>

              <h3 className="text-lg font-bold text-gray-800 mb-1">{update.title}</h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">{update.desc}</p>

              <div className="space-y-2">
                {update.changes.map((text, i) => (
                  <div key={i} className="flex items-start gap-3 bg-gray-50 p-2 rounded border border-gray-100">
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0"></div>
                    <p className="text-xs text-gray-600 font-medium leading-snug">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

// --- AQUI ESTÁ A MÁGICA ---
// Exportamos TAMBÉM com o nome antigo 'UpdateBanner' para o Login.jsx não quebrar
export const UpdateBanner = UpdatesDrawer;