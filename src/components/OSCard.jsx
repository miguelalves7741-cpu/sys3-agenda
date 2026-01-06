import React from 'react';
import { useDrag } from 'react-dnd';
import { 
  MapPin, Clock, PenTool, Trash2, Smartphone, 
  MessageCircle, Hash, Navigation, Wifi 
} from 'lucide-react';

function OSCard({ os, handleEditOS, handleDragStart, handleUpdateDate, handleUpdateField, handleUpdateStatus, handleDelete, verHistorico, listaTecnicos, sendWhatsApp, userRole }) {
  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'OS_CARD',
    item: os,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [os]);

  // --- NOVAS CORES BASEADAS NOS STATUS DO SGP ---
  const getStatusColor = (status) => {
    switch(status) {
      case 'Encerrada': return 'bg-green-100 border-green-200'; // 1 - Verde
      case 'Em Execução': return 'bg-blue-50 border-blue-200';   // 2 - Azul
      case 'Pendente': return 'bg-white border-orange-200';      // 3 - Laranja/Branco
      case 'Aberta': return 'bg-gray-50 border-gray-200';        // 0 - Cinza
      default: return 'bg-white border-gray-100';
    }
  };

  return (
    <div ref={drag} onDragStart={(e) => handleDragStart(e, os)} className={`relative p-3 rounded-xl border-2 shadow-sm transition-all duration-200 group ${getStatusColor(os.status)} ${isDragging ? 'opacity-50 scale-95' : 'hover:shadow-md hover:border-orange-300'}`}>
      
      {/* HEADER: DATA E STATUS */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-1">
          <input type="date" className="text-[10px] font-bold bg-white border border-gray-300 rounded px-1 py-0.5 text-gray-600 focus:border-[#EB6410] outline-none cursor-pointer hover:bg-gray-50" value={os.data} onChange={(e) => handleUpdateDate(os.uid, e.target.value, os.data)} onClick={(e) => e.stopPropagation()} />
          <select className="text-[10px] font-bold bg-white border border-gray-300 rounded px-1 py-0.5 text-gray-600 outline-none cursor-pointer" value={os.horario} onChange={(e) => handleUpdateField(os.uid, 'horario', e.target.value, os)}><option value="Manhã">M</option><option value="Tarde">T</option></select>
        </div>

        {/* SELECTOR DE STATUS COM OS NOMES NOVOS */}
        <select 
          className={`text-[10px] font-bold border rounded px-2 py-0.5 outline-none cursor-pointer appearance-none text-center min-w-[80px]
          ${os.status === 'Encerrada' ? 'bg-green-200 text-green-800 border-green-300' : 
            os.status === 'Em Execução' ? 'bg-blue-200 text-blue-800 border-blue-300' : 
            os.status === 'Aberta' ? 'bg-gray-200 text-gray-700 border-gray-300' :
            'bg-[#FCECD8] text-[#9D4D00] border-orange-200'}
          `}
          value={os.status}
          // Nota: Como o robô é espelho, essa mudança aqui é visual, mas o SGP é quem manda na próxima leitura.
          // Se quiser manter manual, ok. Se for espelho total, esse select vira apenas visualização.
          onChange={(e) => handleUpdateStatus(os.uid, e.target.value)}
        >
          <option>Aberta</option>
          <option>Pendente</option>
          <option>Em Execução</option>
          <option>Encerrada</option>
        </select>
      </div>

      <div onClick={() => handleEditOS(os)} className="cursor-pointer">
        <h4 className="font-bold text-gray-800 leading-tight mb-1 truncate">{os.cliente}</h4>
        
        <div className="flex flex-wrap gap-1 mb-2">
          <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded flex items-center gap-1 border border-gray-200"><PenTool size={10} /> {os.tipo}</span>
          {os.plano && <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded flex items-center gap-1 border border-blue-200 truncate max-w-full"><Wifi size={10} /> {os.plano}</span>}
        </div>

        <div className="text-[10px] text-gray-500 mb-2 space-y-0.5">
          <p className="flex items-center gap-1 truncate"><MapPin size={10} className="shrink-0"/> {os.endereco}</p>
          {os.referencia && <p className="flex items-center gap-1 truncate text-orange-600 font-medium"><Navigation size={10} className="shrink-0"/> Ref: {os.referencia}</p>}
        </div>

        <div className="flex gap-2 items-center bg-gray-50 p-1.5 rounded-lg border border-gray-200" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1 flex-1"><span className="text-[9px] font-bold text-gray-400">INI</span><input type="time" className="w-full bg-white border border-gray-300 rounded px-1 py-0.5 text-[10px] font-bold text-gray-700 text-center focus:border-[#EB6410]" value={os.hora_inicio} onChange={(e) => handleUpdateField(os.uid, 'hora_inicio', e.target.value, os)}/></div>
          <div className="flex items-center gap-1 flex-1"><span className="text-[9px] font-bold text-gray-400">FIM</span><input type="time" className="w-full bg-gray-100 border border-transparent rounded px-1 py-0.5 text-[10px] font-bold text-gray-500 text-center" value={os.hora_fim} disabled /></div>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
        <select className={`text-[10px] font-bold bg-white border border-gray-200 rounded px-1 py-1 max-w-[100px] truncate outline-none focus:border-[#EB6410] ${!os.tecnico || os.tecnico === 'A Definir' ? 'text-red-500' : 'text-gray-700'}`} value={os.tecnico || ""} onChange={(e) => handleUpdateField(os.uid, 'tecnico', e.target.value, os)}><option value="">A definir</option>{(listaTecnicos || []).map(t => <option key={t} value={t}>{t}</option>)}</select>
        <div className="flex items-center gap-1">
           <button onClick={() => sendWhatsApp(os.telefone, os.cliente, os.tipo)} className="text-green-500 hover:bg-green-50 p-1 rounded transition" title="WhatsApp"><MessageCircle size={14} /></button>
          <button onClick={() => verHistorico(os.uid)} className="text-gray-400 hover:text-[#EB6410] hover:bg-orange-50 p-1 rounded transition" title="Histórico"><Clock size={14} /></button>
          {userRole === 'admin' && <button onClick={() => handleDelete(os.uid)} className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1 rounded transition" title="Excluir"><Trash2 size={14} /></button>}
        </div>
      </div>
      
      {os.protocolo && <div className="absolute top-1 right-1 text-[8px] text-gray-300 flex items-center gap-0.5"><Hash size={8} /> {os.protocolo}</div>}
    </div>
  );
}
export default OSCard;