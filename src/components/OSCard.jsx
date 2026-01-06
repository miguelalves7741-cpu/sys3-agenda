import React from 'react';
import { CalendarDays, Sun, Moon, Wrench, MapPin, AlertTriangle, User, History, Trash2, MessageCircle } from 'lucide-react';
import { calcDuration, getStatusColor, isOvertime } from '../utils';

export default function OSCard({ os, handleDragStart, handleUpdateDate, handleUpdateField, handleUpdateStatus, handleDelete, verHistorico, listaTecnicos, sendWhatsApp, userRole }) {
  
  const isAdmin = userRole === 'admin';

  return (
    <div 
      draggable // Todos podem arrastar agora
      onDragStart={(e) => handleDragStart(e, os)}
      className="p-3 bg-white rounded-lg shadow-sm border border-gray-200 mb-3 hover:shadow-md transition-all border-l-4 hover:border-l-[#EB6410] cursor-grab active:cursor-grabbing"
    >
      <div className="flex flex-wrap items-center gap-2 mb-2">
        
        {/* DATA: Liberado para todos */}
        <div className="flex items-center bg-gray-50 rounded border px-2 py-0.5 relative cursor-pointer hover:bg-gray-100" title="Reagendar Data">
            <CalendarDays size={12} className="text-[#EB6410] mr-1"/>
            <span className="text-[10px] font-bold text-gray-600">{new Date(os.data).toLocaleDateString('pt-BR',{timeZone:'UTC'})}</span>
            <input type="date" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={(e) => handleUpdateDate(os.uid, e.target.value, os.data)} />
        </div>

        {/* TURNO: Liberado para todos */}
        <div className="flex items-center bg-gray-50 rounded border px-1 py-0.5" title="Alterar Turno">
          {os.horario === 'Manhã' ? <Sun size={12} className="text-orange-400 mr-1"/> : <Moon size={12} className="text-blue-400 mr-1"/>}
          <select 
            value={os.horario} 
            onChange={(e) => handleUpdateField(os.uid, 'horario', e.target.value, os)} 
            className="bg-transparent text-[10px] font-bold text-gray-600 outline-none cursor-pointer appearance-none"
          >
            <option value="Manhã">M</option>
            <option value="Tarde">T</option>
          </select>
        </div>

        {/* STATUS: Liberado para todos */}
        <select value={os.status} onChange={(e) => handleUpdateStatus(os.uid, e.target.value)} className={`text-[10px] px-2 py-0.5 rounded-full border font-bold outline-none cursor-pointer ${getStatusColor(os.status)}`}>
          <option>Pendente</option><option>Em Andamento</option><option>Concluído</option>
        </select>
      </div>
      
      <h3 className="font-bold text-gray-800 text-sm leading-tight mb-1">{os.cliente}</h3>
      
      <div className="flex items-center gap-1 mb-2">
        <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 flex items-center gap-1"><Wrench size={10} /> {os.tipo}</span>
        {os.telefone && (
          <button onClick={() => sendWhatsApp(os.telefone, os.cliente, os.tipo)} className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-200 flex items-center gap-1 hover:bg-green-100 transition" title="Enviar WhatsApp">
            <MessageCircle size={10} /> Avisar
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500 flex items-center gap-1 mb-2 truncate"><MapPin size={12}/> {os.endereco}</p>
      
      <div className="bg-gray-50 p-2 rounded border border-gray-100 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1"><label className="text-[9px] font-bold text-gray-400">INI</label>
          <input type="time" className="bg-white border rounded px-1 text-[10px] w-14 focus:border-[#EB6410] outline-none" value={os.hora_inicio || ''} onChange={(e) => handleUpdateField(os.uid, 'hora_inicio', e.target.value, os)} />
        </div>
        <div className="flex items-center gap-1"><label className="text-[9px] font-bold text-gray-400">FIM</label>
          <input type="time" className={`bg-white border rounded px-1 text-[10px] w-14 outline-none ${isOvertime(os.hora_fim) ? 'border-red-500 text-red-600 font-bold' : 'focus:border-[#EB6410]'}`} value={os.hora_fim || ''} onChange={(e) => handleUpdateField(os.uid, 'hora_fim', e.target.value, os)} />
        </div>
        {os.hora_inicio && os.hora_fim && (<span className="text-[10px] font-bold text-[#EB6410] ml-auto">{calcDuration(os.hora_inicio, os.hora_fim)}h</span>)}
      </div>

      {isOvertime(os.hora_fim) && <div className="mt-1 flex items-center gap-1 text-[10px] text-red-500 font-bold bg-red-50 px-2 py-1 rounded"><AlertTriangle size={10} /> Hora Extra (+18:00)</div>}

      <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
        {/* TÉCNICO: Liberado para todos */}
        <div className="flex items-center bg-gray-50 rounded border px-2 py-1 max-w-[120px]" title="Atribuir Técnico">
           <User size={12} className="text-gray-400 mr-1"/>
           <select 
             value={os.tecnico || ''} 
             onChange={(e) => handleUpdateField(os.uid, 'tecnico', e.target.value, os)} 
             className="bg-transparent text-[10px] font-bold text-gray-600 outline-none cursor-pointer w-full truncate appearance-none hover:text-[#EB6410]"
             onClick={(e) => e.stopPropagation()}
           >
             <option value="">A definir</option>{listaTecnicos.map(t => <option key={t} value={t}>{t}</option>)}
           </select>
        </div>
        
        <div className="flex gap-1">
           <button onClick={() => verHistorico(os.uid)} className="text-gray-400 hover:text-[#EB6410] p-1 rounded hover:bg-orange-50"><History size={14}/></button>
           
           {/* EXCLUIR: SOMENTE ADMIN */}
           {isAdmin && (
             <button onClick={() => handleDelete(os.uid)} className="text-gray-300 hover:text-red-500 p-1 rounded hover:bg-red-50" title="Excluir"><Trash2 size={14}/></button>
           )}
        </div>
      </div>
    </div>
  );
}