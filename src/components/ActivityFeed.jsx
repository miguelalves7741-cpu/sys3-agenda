import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Activity, PlusCircle, RefreshCw, Edit3, CheckCircle, User, Clock, ShieldAlert } from 'lucide-react';

const ActivityFeed = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca os últimos 50 eventos para não pesar
    const q = query(collection(db, "global_logs"), orderBy("timestamp", "desc"), limit(50));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(lista);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Ícone e Cor baseados no tipo de ação
  const getStyle = (tipo) => {
      switch(tipo) {
          case 'nova_os': return { icon: <PlusCircle size={18}/>, color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200' };
          case 'status': return { icon: <RefreshCw size={18}/>, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' };
          case 'edicao': return { icon: <Edit3 size={18}/>, color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-200' };
          case 'conclusao': return { icon: <CheckCircle size={18}/>, color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200' };
          case 'sistema': return { icon: <ShieldAlert size={18}/>, color: 'text-purple-600', bg: 'bg-purple-100', border: 'border-purple-200' };
          default: return { icon: <Activity size={18}/>, color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' };
      }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Carregando histórico...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
        <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-indigo-600 flex justify-between items-center">
            <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Activity className="text-indigo-600" /> Linha do Tempo
                </h2>
                <p className="text-xs text-gray-500">Monitoramento em tempo real de todas as ações da equipe.</p>
            </div>
            <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
                {logs.length} Eventos Recentes
            </div>
        </div>

        <div className="space-y-4">
            {logs.length === 0 ? (
                <div className="text-center py-10 text-gray-400">Nenhuma atividade registrada ainda.</div>
            ) : (
                logs.map((log) => {
                    const style = getStyle(log.tipo);
                    const dataFormatada = log.timestamp ? format(new Date(log.timestamp), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR }) : 'Data desconhecida';
                    
                    return (
                        <div key={log.id} className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${style.border} flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:bg-gray-50 transition`}>
                            {/* Ícone */}
                            <div className={`p-3 rounded-full ${style.bg} ${style.color} shrink-0`}>
                                {style.icon}
                            </div>

                            {/* Conteúdo */}
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-gray-800 text-sm">{log.titulo}</h3>
                                    <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                                        <Clock size={10}/> {dataFormatada}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{log.detalhe}</p>
                                
                                {/* Rodapé do Card */}
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded flex items-center gap-1">
                                        <User size={10}/> {log.usuario}
                                    </span>
                                    {log.os_id && (
                                        <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-mono">
                                            OS #{log.os_id.slice(0, 5)}...
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    </div>
  );
};

export default ActivityFeed;