import React, { useState, useEffect } from 'react';
import { Calendar, ClipboardList, User, MapPin, Clock, X, Save, Filter, Trash2, LogOut, Lock } from 'lucide-react';
import logoSys3 from './assets/imgLOGO.png';
import { db, auth } from './firebase'; // Importando auth
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'; // Funções de login

function App() {
  // ESTADO DE USUÁRIO (Logado ou não?)
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  // Login States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Verifica se já está logado ao abrir
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // --- LÓGICA DA AGENDA (Mantida igual) ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [osList, setOsList] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [filter, setFilter] = useState('Todos');
  const [formData, setFormData] = useState({ cliente: '', endereco: '', tipo: 'Instalação Fibra', horario: '', tecnico: '' });

  useEffect(() => {
    if (user) { // Só busca dados se estiver logado
      const q = query(collection(db, "os"), orderBy("id", "desc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setOsList(snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id })));
        setLoadingData(false);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setLoginError("E-mail ou senha incorretos.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleSaveOS = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "os"), { id: Date.now(), ...formData, status: 'Pendente' });
      setIsModalOpen(false);
      setFormData({ cliente: '', endereco: '', tipo: 'Instalação Fibra', horario: '', tecnico: '' });
    } catch (error) { alert("Erro ao salvar OS"); }
  };

  const handleUpdateStatus = async (uid, novoStatus) => {
    await updateDoc(doc(db, "os", uid), { status: novoStatus });
  };

  const handleDelete = async (uid) => {
    if (confirm("Tem certeza que deseja excluir esta OS?")) {
      await deleteDoc(doc(db, "os", uid));
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Em Andamento': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Concluído': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOS = filter === 'Todos' ? osList : osList.filter(os => os.status === filter);

  // --- TELA DE CARREGAMENTO ---
  if (loadingAuth) return <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6] text-[#EB6410] font-bold">Carregando Sistema...</div>;

  // --- TELA DE LOGIN (Se não estiver logado) ---
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6] p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border-t-8 border-[#EB6410]">
          <div className="flex justify-center mb-6">
            <img src={logoSys3} alt="Sys3" className="h-16 object-contain" />
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Acesso Restrito</h2>
          <p className="text-center text-gray-500 mb-6 text-sm">Digite suas credenciais para acessar a agenda.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">E-mail</label>
              <input 
                type="email" required 
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-[#EB6410] outline-none transition"
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Senha</label>
              <input 
                type="password" required 
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-[#EB6410] outline-none transition"
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
              />
            </div>
            
            {loginError && <p className="text-red-500 text-sm font-bold text-center bg-red-50 p-2 rounded">{loginError}</p>}

            <button type="submit" className="w-full bg-[#EB6410] hover:opacity-90 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-md transition">
              <Lock size={18} /> Entrar no Sistema
            </button>
          </form>
          <p className="text-center text-xs text-gray-400 mt-6">Sistema Interno Sys3 Internet © 2026</p>
        </div>
      </div>
    );
  }

  // --- TELA PRINCIPAL (Se estiver logado) ---
  return (
    <div className="min-h-screen p-4 md:p-8 font-sans bg-[#f3f4f6] text-[#000000]">
      {/* HEADER */}
      <header className="mb-8 flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-sm border-t-4 border-[#EB6410]">
        <div className="mb-4 md:mb-0 flex items-center gap-4">
          <img src={logoSys3} alt="Sys3 Internet" className="h-12 object-contain" />
          <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Usuário Logado</p>
            <p className="text-sm font-medium text-gray-700">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={handleLogout} className="flex-1 md:flex-none bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition font-bold border border-gray-200">
            <LogOut size={18} /> Sair
          </button>
          <button onClick={() => setIsModalOpen(true)} className="flex-1 md:flex-none bg-[#EB6410] hover:opacity-90 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition shadow-sm font-bold">
            <ClipboardList size={20} /> Nova OS
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* FILTROS (Igual) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-[#DFDAC6]/50">
            <h2 className="font-bold mb-4 flex items-center gap-2 text-[#000000]"><Filter size={20} className="text-[#EB6410]"/> Filtros</h2>
            <div className="space-y-2">
              {['Todos', 'Pendente', 'Em Andamento', 'Concluído'].map(status => (
                <button key={status} onClick={() => setFilter(status)} className={`w-full text-left px-4 py-3 rounded-lg text-sm transition font-medium border ${filter === status ? 'bg-[#DFDAC6] text-[#000000] border-[#EB6410]' : 'hover:bg-[#DFDAC6]/30 text-gray-600 border-transparent'}`}>{status}</button>
              ))}
            </div>
          </div>
        </div>

        {/* LISTA (Igual) */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-[#DFDAC6]/50 overflow-hidden">
            <div className="p-6 border-b border-[#DFDAC6]/30 bg-[#DFDAC6]/10 flex justify-between items-center">
              <h2 className="font-bold text-lg text-[#000000] flex items-center gap-2"><Calendar className="text-[#EB6410]" size={20}/> Agenda ({filteredOS.length})</h2>
            </div>
            <div className="divide-y divide-[#DFDAC6]/30">
              {filteredOS.length === 0 && !loadingData ? <div className="p-12 text-center text-gray-400">Nenhuma OS encontrada.</div> : 
                filteredOS.map((os) => (
                  <div key={os.uid} className="p-6 hover:bg-[#DFDAC6]/10 transition flex flex-col md:flex-row justify-between gap-4 border-l-4 border-transparent hover:border-[#EB6410] group">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <select value={os.status} onChange={(e) => handleUpdateStatus(os.uid, e.target.value)} className={`text-xs px-2 py-1 rounded-full border font-bold cursor-pointer outline-none ${getStatusColor(os.status)}`}>
                          <option value="Pendente">Pendente</option><option value="Em Andamento">Em Andamento</option><option value="Concluído">Concluído</option>
                        </select>
                        <span className="text-xs font-medium text-gray-500 flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-gray-100"><Clock size={13} className="text-[#EB6410]" /> {os.horario}</span>
                      </div>
                      <h3 className="font-bold text-xl text-[#000000]">{os.cliente}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1 font-medium"><MapPin size={15} className="text-gray-400" /> {os.endereco}</p>
                    </div>
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-3 text-sm text-gray-700">
                      <div className="flex items-center gap-2 bg-[#DFDAC6]/20 px-3 py-2 rounded-md font-medium border border-[#DFDAC6]/50"><User size={16} className="text-[#000000]" /> {os.tecnico || 'A definir'}</div>
                      <div className="font-bold text-[#EB6410] bg-orange-50 px-3 py-2 rounded-md border border-orange-100">{os.tipo}</div>
                      <button onClick={() => handleDelete(os.uid)} className="p-2 text-gray-300 hover:text-red-500 transition" title="Excluir OS"><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>

      {/* MODAL (Igual) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border-t-8 border-[#EB6410]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50"><h3 className="font-bold text-xl text-[#000000] flex items-center gap-2"><ClipboardList className="text-[#EB6410]" /> Nova OS</h3><button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-[#EB6410]"><X size={24} /></button></div>
            <form onSubmit={handleSaveOS} className="p-6 space-y-5">
              <div><label className="block text-sm font-bold mb-1">Cliente</label><input required className="w-full border-2 rounded-lg px-4 py-2" value={formData.cliente} onChange={e => setFormData({...formData, cliente: e.target.value})} /></div>
              <div><label className="block text-sm font-bold mb-1">Endereço</label><input required className="w-full border-2 rounded-lg px-4 py-2" value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-bold mb-1">Tipo</label><select className="w-full border-2 rounded-lg px-4 py-2 bg-white" value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})}><option>Instalação Fibra</option><option>Manutenção</option><option>Troca de Roteador</option></select></div><div><label className="block text-sm font-bold mb-1">Horário</label><input type="time" required className="w-full border-2 rounded-lg px-4 py-2" value={formData.horario} onChange={e => setFormData({...formData, horario: e.target.value})} /></div></div>
              <div><label className="block text-sm font-bold mb-1">Técnico</label><input className="w-full border-2 rounded-lg px-4 py-2" value={formData.tecnico} onChange={e => setFormData({...formData, tecnico: e.target.value})} /></div>
              <button type="submit" className="w-full bg-[#EB6410] text-white font-bold py-3 rounded-lg mt-4">Salvar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;