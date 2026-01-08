import React, { useMemo, useState } from 'react';
import { Trophy, Timer, CheckCircle, AlertCircle, TrendingUp, User, Activity, X, Calendar, MapPin } from 'lucide-react';

const PerformanceTecnica = ({ osList, listaTecnicos }) => {
  const [techSelecionado, setTechSelecionado] = useState(null);

  // --- LÓGICA DE CÁLCULO GERAL ---
  const stats = useMemo(() => {
    const dados = {};

    // 1. Inicializa
    listaTecnicos.forEach(tec => {
        dados[tec] = { 
            nome: tec, 
            total: 0, 
            concluidas: 0, 
            pendentes: 0,
            minutosTotais: 0, 
            qtdComTempo: 0 
        };
    });

    // 2. Processa
    osList.forEach(os => {
        const tec = os.tecnico;
        if (!tec || !dados[tec]) return;

        dados[tec].total += 1;

        if (os.status === 'Encerrada' || os.status === 'Concluído') {
            dados[tec].concluidas += 1;

            if (os.hora_inicio && os.hora_fim) {
                const duracao = calcularMinutos(os.hora_inicio, os.hora_fim);
                if (duracao > 0 && duracao < 600) { 
                    dados[tec].minutosTotais += duracao;
                    dados[tec].qtdComTempo += 1;
                }
            }
        } else {
            dados[tec].pendentes += 1;
        }
    });

    // 3. Médias
    return Object.values(dados)
        .map(d => ({
            ...d,
            tma: d.qtdComTempo > 0 ? Math.floor(d.minutosTotais / d.qtdComTempo) : 0,
            taxaConclusao: d.total > 0 ? Math.round((d.concluidas / d.total) * 100) : 0
        }))
        .sort((a, b) => b.concluidas - a.concluidas);

  }, [osList, listaTecnicos]);

  // --- HELPERS ---
  function calcularMinutos(inicio, fim) {
      if (!inicio || !fim) return 0;
      try {
          // Garante que é string antes de dar split
          const sIni = String(inicio);
          const sFim = String(fim);
          
          if (!sIni.includes(':') || !sFim.includes(':')) return 0;

          const [hIni, mIni] = sIni.split(':').map(Number);
          const [hFim, mFim] = sFim.split(':').map(Number);
          
          return (hFim * 60 + mFim) - (hIni * 60 + mIni);
      } catch (e) {
          return 0;
      }
  }

  const formatTMA = (minutos) => {
      // CORREÇÃO AQUI: troquei 'minutes' por 'minutos'
      if (!minutos || minutos <= 0) return "--";
      const h = Math.floor(minutos / 60);
      const m = minutos % 60;
      if (h > 0) return `${h}h ${m}m`;
      return `${m} min`;
  };

  // Prepara dados para o Modal
  const getDetalhesTech = () => {
      if (!techSelecionado) return [];
      return osList
        .filter(os => os.tecnico === techSelecionado.nome && (os.status === 'Encerrada' || os.status === 'Concluído'))
        .map(os => ({
            ...os,
            duracao: calcularMinutos(os.hora_inicio, os.hora_fim)
        }))
        .sort((a, b) => {
            // Ordena por data (mais recente) e depois hora
            if (a.data !== b.data) return a.data > b.data ? -1 : 1;
            return (a.hora_inicio || '') > (b.hora_inicio || '') ? -1 : 1;
        });
  };

  const topProdutor = stats.length > 0 ? stats[0] : null;
  const topVelocidade = [...stats].filter(s => s.tma > 0).sort((a, b) => a.tma - b.tma)[0];

  return (
    <div className="space-y-6 animate-fade-in relative">
      
      {/* --- MODAL DE DETALHES (DRILL-DOWN) --- */}
      {techSelecionado && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-in">
                  
                  {/* Header do Modal */}
                  <div className="bg-gray-50 p-5 border-b border-gray-100 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                          <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
                              <User size={24} />
                          </div>
                          <div>
                              <h3 className="text-xl font-bold text-gray-800">{techSelecionado.nome}</h3>
                              <p className="text-xs text-gray-500">Auditoria de Produção</p>
                          </div>
                      </div>
                      <div className="flex gap-4 text-right">
                          <div>
                              <p className="text-[10px] text-gray-400 font-bold uppercase">Finalizadas</p>
                              <p className="font-bold text-gray-800 text-lg">{techSelecionado.concluidas}</p>
                          </div>
                          <div>
                              <p className="text-[10px] text-gray-400 font-bold uppercase">TMA Geral</p>
                              <p className="font-bold text-indigo-600 text-lg">{formatTMA(techSelecionado.tma)}</p>
                          </div>
                          <button onClick={() => setTechSelecionado(null)} className="ml-4 text-gray-400 hover:text-red-500 transition">
                              <X size={24} />
                          </button>
                      </div>
                  </div>

                  {/* Lista de OSs */}
                  <div className="p-4 overflow-y-auto bg-gray-50/50 flex-1 space-y-3">
                      {getDetalhesTech().length === 0 ? (
                          <div className="text-center py-10 text-gray-400">Nenhuma OS finalizada com horário registrado.</div>
                      ) : (
                          getDetalhesTech().map((os, idx) => (
                              <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-indigo-300 transition">
                                  
                                  {/* Info Principal */}
                                  <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                          <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded border flex items-center gap-1">
                                              <Calendar size={10}/> {new Date(os.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                                          </span>
                                          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">{os.tipo}</span>
                                      </div>
                                      <h4 className="font-bold text-sm text-gray-800 uppercase truncate max-w-[250px]">{os.cliente}</h4>
                                      <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                                          <MapPin size={10}/> {os.endereco}
                                      </p>
                                  </div>

                                  {/* Tempos */}
                                  <div className="flex items-center gap-4 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                                      <div className="text-center">
                                          <p className="text-[9px] text-gray-400 font-bold uppercase">Início</p>
                                          <p className="text-xs font-mono font-bold text-gray-700">{os.hora_inicio || '--:--'}</p>
                                      </div>
                                      <div className="text-gray-300">➜</div>
                                      <div className="text-center">
                                          <p className="text-[9px] text-gray-400 font-bold uppercase">Fim</p>
                                          <p className="text-xs font-mono font-bold text-gray-700">{os.hora_fim || '--:--'}</p>
                                      </div>
                                      <div className="w-px h-6 bg-gray-200 mx-1"></div>
                                      <div className="text-right">
                                          <p className="text-[9px] text-gray-400 font-bold uppercase">Duração</p>
                                          <p className={`text-sm font-extrabold flex items-center gap-1 ${os.duracao > 120 ? 'text-orange-500' : 'text-green-600'}`}>
                                              {os.duracao > 120 && <AlertCircle size={12}/>}
                                              {formatTMA(os.duracao)}
                                          </p>
                                      </div>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* --- CARDS DE DESTAQUE --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Maior Produtor */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 p-4 opacity-10"><Trophy size={80}/></div>
            <div className="flex items-center gap-3 mb-2">
                <div className="bg-white/20 p-2 rounded-lg"><Trophy size={24} className="text-yellow-300"/></div>
                <h3 className="font-bold text-sm uppercase tracking-wide">Maior Entrega</h3>
            </div>
            <div className="mt-2">
                <span className="text-2xl font-extrabold">{topProdutor?.nome || "---"}</span>
                <p className="text-sm text-indigo-100 flex items-center gap-1 mt-1">
                    <CheckCircle size={14}/> {topProdutor?.concluidas || 0} OSs Finalizadas
                </p>
            </div>
        </div>

        {/* Mais Rápido */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 p-4 opacity-10"><Timer size={80}/></div>
            <div className="flex items-center gap-3 mb-2">
                <div className="bg-white/20 p-2 rounded-lg"><Activity size={24} className="text-white"/></div>
                <h3 className="font-bold text-sm uppercase tracking-wide">Mais Ágil (TMA)</h3>
            </div>
            <div className="mt-2">
                <span className="text-2xl font-extrabold">{topVelocidade?.nome || "---"}</span>
                <p className="text-sm text-emerald-100 flex items-center gap-1 mt-1">
                    <Timer size={14}/> Média: {formatTMA(topVelocidade?.tma)}
                </p>
            </div>
        </div>

        {/* Pendências */}
        <div className="bg-white border-l-4 border-orange-500 rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-500 text-xs uppercase mb-2 flex items-center gap-2">
                <AlertCircle size={14} className="text-orange-500"/> Total em Aberto
            </h3>
            <span className="text-3xl font-bold text-gray-800">
                {stats.reduce((acc, curr) => acc + curr.pendentes, 0)}
            </span>
            <p className="text-xs text-gray-400 mt-1">OSs aguardando finalização</p>
        </div>
      </div>

      {/* --- TABELA DE RANKING (CLICÁVEL) --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <TrendingUp size={18} className="text-[#EB6410]"/> Ranking da Equipe
            </h3>
            <span className="text-[10px] text-gray-400 italic">Clique no técnico para ver detalhes</span>
        </div>
        
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                    <tr>
                        <th className="px-4 py-3">Técnico</th>
                        <th className="px-4 py-3 text-center">Finalizadas</th>
                        <th className="px-4 py-3 text-center">TMA (Média)</th>
                        <th className="px-4 py-3 text-center">Eficiência</th>
                        <th className="px-4 py-3 w-1/3">Carga de Trabalho</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {stats.map((tec, idx) => (
                        <tr 
                            key={idx} 
                            onClick={() => setTechSelecionado(tec)}
                            className="hover:bg-indigo-50 transition cursor-pointer group"
                            title="Clique para ver auditoria"
                        >
                            <td className="px-4 py-3 font-bold text-gray-700 flex items-center gap-2 group-hover:text-indigo-600">
                                <div className="bg-gray-100 group-hover:bg-indigo-200 p-1.5 rounded-full transition"><User size={14} className="text-gray-500 group-hover:text-indigo-700"/></div>
                                {tec.nome}
                                {idx === 0 && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 rounded border border-yellow-200">👑</span>}
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-green-600 bg-green-50/30">
                                {tec.concluidas}
                            </td>
                            <td className="px-4 py-3 text-center font-mono text-gray-600">
                                {formatTMA(tec.tma)}
                            </td>
                            <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tec.taxaConclusao >= 80 ? 'bg-emerald-100 text-emerald-700' : tec.taxaConclusao >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                    {tec.taxaConclusao}%
                                </span>
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#EB6410]" style={{ width: `${Math.min((tec.total / 10) * 100, 100)}%` }}></div>
                                    </div>
                                    <span className="text-xs text-gray-400 font-bold w-6">{tec.total}</span>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {stats.length === 0 && (
                        <tr>
                            <td colSpan="5" className="px-4 py-8 text-center text-gray-400">
                                Nenhuma atividade registrada ainda.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default PerformanceTecnica;