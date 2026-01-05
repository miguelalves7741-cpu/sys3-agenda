import React, { useState } from 'react';
import { Calendar, ClipboardList, User, MapPin, Clock, X, Save, Filter } from 'lucide-react';
import logoSys3 from './assets/imgLOGO.png'; // Importando a logo

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Dados iniciais
  const [osList, setOsList] = useState([
    { id: 1, cliente: 'João Silva', tipo: 'Instalação Fibra', endereco: 'Rua das Flores, 123', status: 'Pendente', horario: '08:00', tecnico: 'Carlos' },
    { id: 2, cliente: 'Padaria Central', tipo: 'Manutenção', endereco: 'Av. Principal, 500', status: 'Em Andamento', horario: '10:30', tecnico: 'Roberto' },
    { id: 3, cliente: 'Maria Oliveira', tipo: 'Troca de Roteador', endereco: 'Beco do Sol, 45', status: 'Concluído', horario: '14:00', tecnico: 'Carlos' },
  ]);

  const [formData, setFormData] = useState({
    cliente: '', endereco: '', tipo: 'Instalação', horario: '', tecnico: ''
  });

  const [filter, setFilter] = useState('Todos');

  const handleSaveOS = (e) => {
    e.preventDefault();
    const novaOS = {
      id: Date.now(),
      ...formData,
      status: 'Pendente'
    };
    setOsList([novaOS, ...osList]);
    setIsModalOpen(false);
    setFormData({ cliente: '', endereco: '', tipo: 'Instalação', horario: '', tecnico: '' });
  };

  const getStatusColor = (status) => {
    switch(status) {
      // Usando cores padrão do Tailwind para status (mais seguro e visualmente funcional)
      case 'Pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Em Andamento': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Concluído': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOS = filter === 'Todos' ? osList : osList.filter(os => os.status === filter);

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans bg-[#f3f4f6] text-[#000000]">
      
      {/* Cabeçalho */}
      <header className="mb-8 flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-sm border-t-4 border-[#EB6410]">
        <div className="mb-4 md:mb-0">
          {/* Logo da Sys3 */}
          <img src={logoSys3} alt="Sys3 Internet" className="h-12 object-contain mb-1" />
          <p className="text-sm text-gray-500 font-medium pl-1">Gestão de Ordens de Serviço</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          // Botão com Laranja Cáqui exato (#EB6410)
          className="bg-[#EB6410] hover:opacity-90 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition shadow-sm font-bold"
        >
          <ClipboardList size={20} />
          Nova OS
        </button>
      </header>

      {/* Conteúdo Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Barra Lateral (Filtros) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-[#DFDAC6]/50">
            <h2 className="font-bold mb-4 flex items-center gap-2 text-[#000000]">
              <Filter size={20} className="text-[#EB6410]"/> Filtros
            </h2>
            <div className="space-y-2">
              {['Todos', 'Pendente', 'Em Andamento', 'Concluído'].map(status => (
                <button 
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm transition font-medium border ${
                    filter === status 
                      ? 'bg-[#DFDAC6] text-[#000000] border-[#EB6410]' // Ativo (Bege + Borda Laranja)
                      : 'hover:bg-[#DFDAC6]/30 text-gray-600 border-transparent' // Inativo
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lista de OS */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-[#DFDAC6]/50 overflow-hidden">
            <div className="p-6 border-b border-[#DFDAC6]/30 bg-[#DFDAC6]/10 flex justify-between items-center">
              <h2 className="font-bold text-lg text-[#000000] flex items-center gap-2">
                <Calendar className="text-[#EB6410]" size={20}/>
                Agenda ({filteredOS.length})
              </h2>
            </div>
            
            <div className="divide-y divide-[#DFDAC6]/30">
              {filteredOS.length === 0 ? (
                <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-2">
                  <ClipboardList size={40} className="text-[#DFDAC6]" />
                  Nenhuma OS encontrada.
                </div>
              ) : (
                filteredOS.map((os) => (
                  <div key={os.id} className="p-6 hover:bg-[#DFDAC6]/10 transition flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-transparent hover:border-[#EB6410]">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`text-xs px-3 py-1 rounded-full border font-bold ${getStatusColor(os.status)}`}>
                          {os.status}
                        </span>
                        <span className="text-xs font-medium text-gray-500 flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-gray-100 shadow-sm">
                          <Clock size={13} className="text-[#EB6410]" /> {os.horario}
                        </span>
                      </div>
                      <h3 className="font-bold text-xl text-[#000000]">{os.cliente}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1 font-medium">
                        <MapPin size={15} className="text-gray-400" /> {os.endereco}
                      </p>
                    </div>
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-3 text-sm text-gray-700">
                      <div className="flex items-center gap-2 bg-[#DFDAC6]/20 px-3 py-2 rounded-md font-medium border border-[#DFDAC6]/50">
                        <User size={16} className="text-[#000000]" />
                        {os.tecnico || 'A definir'}
                      </div>
                      <div className="font-bold text-[#EB6410] bg-orange-50 px-3 py-2 rounded-md border border-orange-100">
                        {os.tipo}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border-t-8 border-[#EB6410]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-xl text-[#000000] flex items-center gap-2">
                <ClipboardList className="text-[#EB6410]" /> Nova OS
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-[#EB6410] hover:bg-orange-50 rounded-full p-1 transition">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSaveOS} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-[#000000] mb-1">Nome do Cliente</label>
                <input 
                  type="text" required
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:border-[#EB6410] focus:ring-0 outline-none transition font-medium"
                  value={formData.cliente}
                  onChange={(e) => setFormData({...formData, cliente: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#000000] mb-1">Endereço</label>
                <input 
                  type="text" required
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:border-[#EB6410] focus:ring-0 outline-none transition font-medium"
                  value={formData.endereco}
                  onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#000000] mb-1">Tipo de Serviço</label>
                  <select 
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:border-[#EB6410] focus:ring-0 outline-none transition font-medium bg-white"
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                  >
                    <option>Instalação Fibra</option>
                    <option>Manutenção</option>
                    <option>Troca de Roteador</option>
                    <option>Visita Técnica</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#000000] mb-1">Horário</label>
                  <input 
                    type="time" required
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:border-[#EB6410] focus:ring-0 outline-none transition font-medium"
                    value={formData.horario}
                    onChange={(e) => setFormData({...formData, horario: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#000000] mb-1">Técnico (Opcional)</label>
                <input 
                  type="text" 
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:border-[#EB6410] focus:ring-0 outline-none transition font-medium"
                  value={formData.tecnico}
                  onChange={(e) => setFormData({...formData, tecnico: e.target.value})}
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-[#EB6410] hover:opacity-90 text-white font-bold text-lg py-3 rounded-lg flex items-center justify-center gap-2 mt-6 shadow-md transition"
              >
                <Save size={20} />
                Salvar Agenda
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;