import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Activity, PlusCircle, RefreshCw, Edit3, CheckCircle, User, Clock, ShieldAlert, Hash } from 'lucide-react';

const ActivityFeed = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca no banco (traz ordenado por texto, o que pode falhar entre fuso horários)
    const q = query(collection(db, "global_logs"), orderBy("timestamp", "desc"), limit(100));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // --- CORREÇÃO DE ORDEM (CLIENT-SIDE) ---
      // Converte as datas para objetos reais e ordena do mais recente para o mais antigo
      // Isso resolve o conflito entre horário do Robô (Local) vs Site (UTC)
      lista.sort((a, b) => {
          const dateA = new Date(a.timestamp);
          const dateB = new Date(b.timestamp);
          return dateB - dateA; 
      });

      setLogs(lista);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getStyle = (tipo) => {
      switch(tipo) {
          case 'nova_os': return { icon: <PlusCircle size={14}/>, color: 'text-green-600', bg: 'bg-green-50' };
          case 'status': return { icon: <RefreshCw size={14}/>, color: 'text-blue-600', bg: 'bg-blue-50' };
          case 'edicao': return { icon: <Edit3 size={14}/>, color: 'text-orange-600', bg: 'bg-orange-50' };
          case 'conclusao': return { icon: <CheckCircle size={14}/>, color: 'text-emerald-600', bg: 'bg-emerald-50' };
          case 'sistema': return { icon: <ShieldAlert size={14}/>, color: 'text-purple-600', bg: 'bg-purple-50' };
          default: return { icon: <Activity size={14}/>, color: 'text-gray-600', bg: 'bg-gray-50' };
      }
  };

  if (loading) return <div className="p-8 text-center text-gray-400 text-sm">Carregando histórico...</div>;

  return (
    <div className="max-w-5xl mx-auto pb-6">
        
        {/* HEADER */}
        <div className="bg-white px-6 py-4 rounded-t-xl shadow-sm border-b border-gray-100 flex justify-between items-center">
            <div>
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Activity className="text-indigo-600" size={20} /> Histórico de Atividades
                </h2>
                <p className="text-xs text-gray-500">Registro completo de ações do sistema e robô.</p>
            </div>
            <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
                {logs.length} Eventos
            </div>
        </div>

        {/* LISTA COMPACTA COM SCROLL FIXO */}
        <div className="bg-white rounded-b-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                {logs.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm">Nenhuma atividade registrada ainda.</div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-2 w-12 text-center">Tipo</th>
                                <th className="px-4 py-2">Ação / Detalhe</th>
                                <th className="px-4 py-2 w-32">OS ID</th>
                                <th className="px-4 py-2 w-40">Usuário</th>
                                <th className="px-4 py-2 w-32 text-right">Horário</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm text-gray-600">
                            {logs.map((log) => {
                                const style = getStyle(log.tipo);
                                const dataHora = log.timestamp ? new Date(log.timestamp) : new Date();
                                const diaMes = format(dataHora, "dd/MM", { locale: ptBR });
                                const horaMin = format(dataHora, "HH:mm", { locale: ptBR });
                                
                                return (
                                    <tr key={log.id} className="hover:bg-indigo-50/30 transition-colors group">
                                        {/* Ícone */}
                                        <td className="px-4 py-2.5 text-center">
                                            <div className={`w-8 h-8 rounded-full ${style.bg} ${style.color} flex items-center justify-center mx-auto`}>
                                                {style.icon}
                                            </div>
                                        </td>

                                        {/* Título e Detalhe */}
                                        <td className="px-4 py-2.5">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-800 text-xs">{log.titulo}</span>
                                                <span className="text-xs text-gray-500 truncate max-w-md" title={log.detalhe}>
                                                    {log.detalhe}
                                                </span>
                                            </div>
                                        </td>

                                        {/* OS ID */}
                                        <td className="px-4 py-2.5">
                                            {log.os_id ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                                    <Hash size={10}/> {log.os_id}
                                                </span>
                                            ) : (
                                                <span className="text-gray-300 text-xs">-</span>
                                            )}
                                        </td>

                                        {/* Usuário */}
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${log.usuario.includes('Robô') ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    <User size={10} className="inline mr-1 mb-0.5"/>
                                                    {log.usuario.split('@')[0]}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Data/Hora */}
                                        <td className="px-4 py-2.5 text-right text-xs text-gray-400 font-medium">
                                            <div className="flex flex-col items-end">
                                                <span className="text-gray-800 font-bold">{horaMin}</span>
                                                <span className="text-[10px]">{diaMes}</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    </div>
  );
};

export default ActivityFeed;