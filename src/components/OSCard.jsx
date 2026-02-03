import React from 'react';
import { useDrag } from 'react-dnd';
import { Clock, MapPin, Edit2, Trash2, MessageCircle, Calendar, PhoneCall, Check, Sun, Moon, AlertTriangle } from 'lucide-react';

const OSCard = ({ os, handleEditOS, handleDelete, sendWhatsApp, handleToggleConfirm, isExtra }) => {
  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'OS',
    item: { uid: os.uid, tecnico: os.tecnico, data: os.data, horario: os.horario, tipo: os.tipo },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const getBorderColor = (st) => {
      switch(st) {
          case 'Encerrada': return 'border-green-500';
          case 'Em Execução': return 'border-blue-500';
          case 'Pendente': return 'border-yellow-500';
          default: return 'border-gray-300';
      }
  };

  const getStatusBadge = (st) => {
      switch(st) {
          case 'Encerrada': return 'bg-green-100 text-green-700';
          case 'Em Execução': return 'bg-blue-100 text-blue-700';
          case 'Pendente': return 'bg-yellow-100 text-yellow-800';
          default: return 'bg-gray-100 text-gray-600';
      }
  };

  return (
    <div 
        ref={drag}
        className={`bg-white rounded-xl p-3 shadow-sm border-l-[6px] mb-3 hover:shadow-md transition-all relative group ${isDragging ? 'opacity-50' : 'opacity-100'} ${getBorderColor(os.status)}`}
    >
      <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                <Calendar size={10}/> {new Date(os.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
            </div>
            
            {os.horario === 'Tarde' ? (
                <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                    <Moon size={10}/> TARDE
                </div>
            ) : (
                <div className="flex items-center gap-1 text-[10px] font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded border border-yellow-100">
                    <Sun size={10}/> MANHÃ
                </div>
            )}

            {os.confirmado && (
                <div className="flex items-center gap-1 text-[9px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100 animate-pulse">
                    <Check size={10}/> OK
                </div>
            )}

            {/* SELO DE ENCAIXE / SOBREAVISO */}
            {isExtra && (
                <div className="flex items-center gap-1 text-[9px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100 animate-pulse">
                    <AlertTriangle size={10}/> EXTRA
                </div>
            )}
          </div>

          <div className={`flex flex-col items-end justify-center ${getStatusBadge(os.status)} px-3 py-1.5 rounded-lg min-w-[80px]`}>
              <span className="text-[9px] font-bold opacity-70 mb-0.5">#{os.id_sgp || '---'}</span>
              <span className="text-[10px] font-bold uppercase leading-none whitespace-nowrap">{os.status}</span>
          </div>
      </div>

      <h4 className="font-bold text-gray-800 text-sm uppercase truncate mb-1.5 pr-2" title={os.cliente}>
          {os.cliente}
      </h4>
      
      <div className="flex flex-wrap gap-2 mb-3">
          <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-wide">
              {os.tipo}
          </span>
          {os.plano && (
              <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 truncate max-w-[180px]">
                  {os.plano}
              </span>
          )}
      </div>

      <div className="flex items-start gap-1.5 mb-3 text-gray-500">
          <MapPin size={12} className="mt-0.5 shrink-0 text-gray-400"/>
          <div className="text-[10px] leading-tight">
              <p className="uppercase font-medium line-clamp-2">{os.endereco}</p>
              {os.referencia && <p className="text-[9px] text-orange-400 italic mt-0.5 truncate max-w-[250px]">Ref: {os.referencia}</p>}
          </div>
      </div>

      <div className="flex items-center bg-gray-50 rounded-lg border border-gray-100 mb-3 overflow-hidden">
          <div className="flex-1 p-1.5 text-center border-r border-gray-200">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Início</p>
              <p className="text-xs font-bold text-gray-700 flex items-center justify-center gap-1">
                  {os.hora_inicio || '--:--'}
                  {os.hora_inicio && <Clock size={10} className="text-blue-500"/>}
              </p>
          </div>
          <div className="flex-1 p-1.5 text-center">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Fim</p>
              <p className="text-xs font-bold text-gray-700">
                  {os.hora_fim || '--:--'}
              </p>
          </div>
      </div>

      <div className="flex justify-between items-center pt-1">
          <div className="flex items-center gap-2 bg-gray-100 rounded-full px-2 py-1 pr-3 max-w-[120px]">
              <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-[9px] font-bold text-gray-600 border border-white shrink-0">
                  {os.tecnico ? os.tecnico.charAt(0) : '?'}
              </div>
              <span className="text-[10px] font-bold text-gray-600 truncate uppercase">
                  {os.tecnico || 'A definir'}
              </span>
          </div>

          <div className="flex items-center gap-1.5">
              <button 
                onClick={() => handleToggleConfirm && handleToggleConfirm(os.uid, os.confirmado)} 
                title={os.confirmado ? "Remover confirmação" : "Confirmar via ligação"}
                className={`w-7 h-7 flex items-center justify-center rounded-full transition shadow-sm border ${os.confirmado ? 'bg-green-100 text-green-600 border-green-200' : 'bg-white text-gray-400 border-gray-200 hover:text-green-500 hover:border-green-300'}`}
              >
                  <PhoneCall size={14} />
              </button>

              <button onClick={() => sendWhatsApp(os.telefone, os.cliente, os.tipo)} className="w-7 h-7 flex items-center justify-center bg-white text-green-600 border border-gray-200 hover:border-green-300 rounded-full transition shadow-sm" title="WhatsApp">
                  <MessageCircle size={14}/>
              </button>
              
              <button onClick={() => handleEditOS(os)} className="w-7 h-7 flex items-center justify-center bg-white text-blue-600 border border-gray-200 hover:border-blue-300 rounded-full transition shadow-sm" title="Editar">
                  <Edit2 size={14}/>
              </button>
              
              {handleDelete && (
                  <button onClick={() => handleDelete(os.uid)} className="w-7 h-7 flex items-center justify-center bg-white text-red-500 border border-gray-200 hover:border-red-300 rounded-full transition shadow-sm" title="Excluir">
                      <Trash2 size={14}/>
                  </button>
              )}
          </div>
      </div>
    </div>
  );
};

export default OSCard;