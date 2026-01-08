import React, { useState, useEffect, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  Calendar as CalIcon, ClipboardList, User, Clock, X, Search, LogOut, CheckCircle, 
  ChevronLeft, ChevronRight, Timer, History, CalendarDays, GripHorizontal, Settings, 
  Plus, Briefcase, Activity, Shield, Lock, Trash2, MessageCircle, AlertTriangle, 
  Coffee, CalendarOff, Bell, BarChart3, Volume2, VolumeX, PlayCircle, Sun, Moon, Zap, UserCheck, ScrollText
} from 'lucide-react';
import logoSys3 from './assets/imgLOGO.png';
import { db, auth } from './firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, getDocs, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';

import Login from './components/Login';
import OSCard from './components/OSCard';
import Dashboard from './components/Dashboard';
import NotificationToast from './components/NotificationToast';
import PerformanceTecnica from './components/PerformanceTecnica';
import { UpdatesDrawer } from './components/SystemUpdates'; 
import { calcDuration, timeToMinutes, formatDataBr, addTimes } from './utils';
import CalendarioVagas from './components/CalendarioVagas';
import ActivityFeed from './components/ActivityFeed'; 

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("interno"); 
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loginError, setLoginError] = useState("");
  const [currentTab, setCurrentTab] = useState('hoje');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [osList, setOsList] = useState([]);
  const [filter, setFilter] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null); 
  const [showUpdates, setShowUpdates] = useState(false); 
  const [notification, setNotification] = useState(null);
  const isFirstLoad = useRef(true);

  // Audio e Configs
  const [audioContext, setAudioContext] = useState(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('sys3_sound_enabled') !== 'false');
  const [listaTecnicos, setListaTecnicos] = useState([]);
  const [listaTipos, setListaTipos] = useState([]); 
  const [limites, setLimites] = useState({ instalacao: 2, chamado: 2 });
  const [folgas, setFolgas] = useState([]); 
  const [usuariosSistema, setUsuariosSistema] = useState([]); 

  // Forms
  const [novoTecnico, setNovoTecnico] = useState("");
  const [novoTipoNome, setNovoTipoNome] = useState("");
  const [novoTipoDuracao, setNovoTipoDuracao] = useState("01:00");
  const [novoTipoCategoria, setNovoTipoCategoria] = useState("chamado"); 
  const [folgaTecnico, setFolgaTecnico] = useState("");
  const [folgaData, setFolgaData] = useState("");
  const [folgaLimite, setFolgaLimite] = useState(0); 
  const [draggedOS, setDraggedOS] = useState(null);
  const [dragOverTech, setDragOverTech] = useState(null); 
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [currentHistory, setCurrentHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [formData, setFormData] = useState({ uid: '', cliente: '', telefone: '', endereco: '', tipo: '', data: new Date().toISOString().split('T')[0], horario: 'Manhã', tecnico: '', hora_inicio: '', hora_fim: '' });

  const initAudio = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    ctx.resume().then(() => { setAudioContext(ctx); setAudioUnlocked(true); playBeep(ctx); });
  };

  const playBeep = (ctxRef = null) => {
    if (!soundEnabled) return;
    const ctx = ctxRef || audioContext;
    if (!ctx) return;
    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode); gainNode.connect(ctx.destination);
      oscillator.type = 'sine'; oscillator.frequency.value = 880; 
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
      oscillator.start(); oscillator.stop(ctx.currentTime + 0.5);
    } catch (e) {}
  };

  const toggleSound = () => { const newState = !soundEnabled; setSoundEnabled(newState); localStorage.setItem('sys3_sound_enabled', newState); };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) setUserRole(userSnap.data().role || 'interno');
          else {
            const usersColl = await getDocs(collection(db, "users"));
            const newRole = usersColl.empty ? 'admin' : 'interno';
            await setDoc(userRef, { email: currentUser.email, role: newRole });
            setUserRole(newRole);
          }
        } catch (error) { setUserRole('interno'); }
      } else { setUser(null); setUserRole('interno'); }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, "os"), orderBy("data", "asc"));
      const unsubOS = onSnapshot(q, (snapshot) => {
        setOsList(snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id })));
        if (!isFirstLoad.current) {
          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data();
            const autor = data.last_editor || "Sistema";
            if ((change.type === "added" || change.type === "modified") && autor !== user.email) {
              playBeep(); 
              if (change.type === "added") setNotification({ type: 'success', title: 'Nova OS SGP', message: `${data.tipo} - ${data.cliente.split(' ')[0]}`, user: 'SGP' });
              if (change.type === "modified") setNotification({ type: 'info', title: 'Atualização SGP', message: `${data.cliente.split(' ')[0]}: ${data.status}`, user: 'SGP' });
            }
          });
        }
        isFirstLoad.current = false;
      });

      const docRef = doc(db, "configuracoes", "geral");
      const unsubConfig = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setListaTecnicos(Array.isArray(data.tecnicos) ? data.tecnicos : []);
          setLimites(data.limites || { instalacao: 2, chamado: 2 });
          setFolgas(Array.isArray(data.folgas) ? data.folgas : []); 
          const tiposRaw = Array.isArray(data.tipos) ? data.tipos : [];
          setListaTipos(tiposRaw.map(t => typeof t === 'string' ? { nome: t, duracao: '01:00', categoria: 'chamado' } : { nome: t.nome || "Sem Nome", duracao: t.duracao || '01:00', categoria: t.categoria || 'chamado' }));
        } else { setDoc(docRef, { tecnicos: ['Técnico 1'], limites: { instalacao: 2, chamado: 2 }, tipos: [], folgas: [] }); }
      });

      let unsubUsers = () => {};
      if (userRole === 'admin') {
        const qUsers = query(collection(db, "users"));
        unsubUsers = onSnapshot(qUsers, (snap) => setUsuariosSistema(snap.docs.map(d => ({ uid: d.id, email: d.data().email || "Sem Email", role: d.data().role || "interno" }))));
      }
      return () => { unsubOS(); unsubConfig(); unsubUsers(); };
    }
  }, [user, userRole]);

  // --- LOG GLOBAL ---
  const registrarLogGlobal = async (tipo, titulo, detalhe, osId = null) => {
      if (!user) return;
      try {
          await addDoc(collection(db, "global_logs"), {
              timestamp: new Date().toISOString(),
              tipo, // nova_os, status, edicao, conclusao, sistema
              titulo,
              detalhe,
              usuario: user.email.split('@')[0],
              os_id: osId
          });
      } catch (e) { console.error("Erro ao gravar log global", e); }
  };

  // Helpers
  const getCategoria = (nomeTipo) => {
    if (!listaTipos || listaTipos.length === 0) return 'chamado';
    const tipo = listaTipos.find(t => t.nome === nomeTipo);
    if (!tipo) { const lower = (nomeTipo || "").toLowerCase(); return (lower.includes('instala') || lower.includes('transf')) ? 'instalacao' : 'chamado'; }
    return tipo.categoria || 'chamado';
  };
  const getFolgaInfo = (techName, dateStr) => folgas.find(f => f.tecnico === techName && f.data === dateStr);
  const checkCapacity = (techName, dateStr, turno, tipoServico, ignoreUid = null) => {
    if (!techName || techName === "") return true;
    const folga = getFolgaInfo(techName, dateStr);
    const categoriaAtual = getCategoria(tipoServico);
    const limiteInstalacao = folga ? Number(folga.limite) : (limites?.instalacao || 2);
    const limiteChamado = folga ? Number(folga.limite) : (limites?.chamado || 2);
    const limiteAtual = categoriaAtual === 'instalacao' ? limiteInstalacao : limiteChamado;
    if (limiteAtual === 0) return window.confirm(`🚫 TÉCNICO DE FOLGA!\n\n${techName} está marcado com folga total.\nDeseja forçar o agendamento?`);
    const count = osList.filter(os => os.tecnico === techName && os.data === dateStr && os.horario === turno && getCategoria(os.tipo) === categoriaAtual && os.uid !== ignoreUid).length;
    if (count >= limiteAtual) return window.confirm(`⚠️ CAPACIDADE EXCEDIDA para ${techName}!\nLimite: ${limiteAtual} | Agendados: ${count}\nDeseja realizar um ENCAIXE?`);
    return true;
  };
  const ehAtividadeOperacional = (os) => {
      const t = (os.tipo || "").toLowerCase();
      if (t.includes('retirada') || t.includes('cancel') || t.includes('inviabil') || t.includes('reducao') || t.includes('desistencia')) return false;
      return true;
  };
  const getTecnicosOciosos = () => {
      const now = new Date();
      const hour = now.getHours();
      if (hour < 8 || hour >= 18) return [];
      const hoje = new Date().toISOString().split('T')[0];
      const ociosos = [];
      listaTecnicos.forEach(tec => {
          const folga = getFolgaInfo(tec, hoje);
          if (folga && Number(folga.limite) === 0) return;
          const temTrabalho = osList.filter(os => os.data === hoje && os.tecnico === tec).some(os => os.status === 'Em Execução' || os.status === 'Pendente' || os.status === 'Aberta');
          if (!temTrabalho) ociosos.push(tec);
      });
      return ociosos;
  };
  const checkExpediente = (horaFim, osDate) => {
    if (osDate) { const diaSemana = new Date(osDate).getUTCDay(); if (diaSemana === 0) alert("⚠️ ALERTA: Domingo."); }
    if (horaFim) { const [hora, minuto] = horaFim.split(':').map(Number); if (hora > 18 || (hora === 18 && minuto > 0)) alert(`⚠️ ALERTA: Hora Extra.`); }
  };
  const sendWhatsApp = (telefone, cliente, tipo) => {
    if (!telefone) return alert("Telefone não cadastrado.");
    window.open(`https://wa.me/55${telefone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${cliente.split(' ')[0]}, técnico da Sys3 a caminho para ${tipo}.`)}`, '_blank');
  };
  const applyFilters = (lista) => {
    let result = lista || [];
    if (filter !== 'Todos') result = result.filter(os => os.status === filter);
    if (searchTerm) { const lower = searchTerm.toLowerCase(); result = result.filter(os => os.cliente.toLowerCase().includes(lower) || os.endereco.toLowerCase().includes(lower) || (os.tecnico && os.tecnico.toLowerCase().includes(lower))); }
    return result.filter(ehAtividadeOperacional);
  };
  const isTecnicoConhecido = (tecName) => listaTecnicos.includes(tecName);
  const handleLogin = async (email, password) => { try { await signInWithEmailAndPassword(auth, email, password); } catch (e) { setLoginError("Erro login"); } };
  const handleLogout = async () => { setAudioUnlocked(false); await signOut(auth); };
  const registrarHistorico = async (osId, acao, detalhe) => { if (!user) return; try { await addDoc(collection(db, "os", osId, "historico"), { data: new Date().toISOString(), usuario: user.email, acao, detalhe }); } catch (e) {} };
  const verHistorico = async (osId) => { setLoadingHistory(true); setIsHistoryModalOpen(true); setCurrentHistory([]); try { const q = query(collection(db, "os", osId, "historico"), orderBy("data", "desc")); const snap = await getDocs(q); setCurrentHistory(snap.docs.map(d => d.data())); } catch (e) { alert("Erro histórico"); } setLoadingHistory(false); };
  
  // --- ACTIONS COM LOG GLOBAL ---
  
  const handleEditOS = (os) => { setFormData({ uid: os.uid, cliente: os.cliente || '', telefone: os.telefone || '', endereco: os.endereco || '', tipo: os.tipo || '', data: os.data || new Date().toISOString().split('T')[0], horario: os.horario || 'Manhã', tecnico: os.tecnico || '', hora_inicio: os.hora_inicio || '', hora_fim: os.hora_fim || '' }); setIsModalOpen(true); };
  
  const handleSaveOS = async (e) => { 
      e.preventDefault(); 
      if (!checkCapacity(formData.tecnico, formData.data, formData.horario, formData.tipo, formData.uid)) return; 
      try { 
          checkExpediente(formData.hora_fim, formData.data); 
          const dados = { cliente: formData.cliente, telefone: formData.telefone, endereco: formData.endereco, tipo: formData.tipo, data: formData.data, horario: formData.horario, tecnico: formData.tecnico, hora_inicio: formData.hora_inicio, hora_fim: formData.hora_fim, last_editor: user.email, sync_pendente: true }; 
          
          if (formData.uid) { 
              await updateDoc(doc(db, "os", formData.uid), dados); 
              await registrarHistorico(formData.uid, "Edição Completa", `Atualizado por ${user.email}`);
              await registrarLogGlobal("edicao", "OS Editada", `Cliente: ${formData.cliente} (${formData.tipo})`, formData.uid);
          } else { 
              const docRef = await addDoc(collection(db, "os"), { id: Date.now(), ...dados, status: 'Pendente' }); 
              await registrarHistorico(docRef.id, "Criação", `OS criada por ${user.email}`); 
              await registrarLogGlobal("nova_os", "Nova OS Criada", `${formData.tipo} para ${formData.cliente}`, docRef.id);
          } 
          setIsModalOpen(false); 
          setFormData({ uid: '', cliente: '', telefone: '', endereco: '', tipo: listaTipos[0]?.nome || '', data: new Date().toISOString().split('T')[0], horario: 'Manhã', tecnico: '', hora_inicio: '', hora_fim: '' }); 
      } catch (e) { console.error(e); alert("Erro ao salvar."); } 
  };

  const handleUpdateStatus = async (uid, novoStatus) => { 
      await updateDoc(doc(db, "os", uid), { status: novoStatus, last_editor: user.email, sync_pendente: true }); 
      await registrarHistorico(uid, "Status", novoStatus);
      
      const tipoLog = novoStatus === 'Encerrada' ? 'conclusao' : 'status';
      const osAtual = osList.find(o => o.uid === uid);
      await registrarLogGlobal(tipoLog, `Status: ${novoStatus}`, `Técnico: ${osAtual?.tecnico || '?'} - Cliente: ${osAtual?.cliente}`, uid);
  };

  // --- NOVA FUNÇÃO: TOGGLE CONFIRMAÇÃO ---
  const handleToggleConfirm = async (uid, currentStatus) => {
      try {
          const novoStatus = !currentStatus;
          await updateDoc(doc(db, "os", uid), { confirmado: novoStatus });
          
          if (novoStatus) {
              const osAtual = osList.find(o => o.uid === uid);
              await registrarLogGlobal("status", "Agendamento Confirmado", `Contato realizado com ${osAtual?.cliente}`, uid);
          }
      } catch (e) { console.error("Erro ao confirmar:", e); }
  };

  const handleUpdateField = async (uid, field, value, currentOS = null) => { 
      if (currentOS) { 
          if (field === 'tecnico' && !checkCapacity(value, currentOS.data, currentOS.horario, currentOS.tipo, uid)) return; 
          if (field === 'horario' && !checkCapacity(currentOS.tecnico, currentOS.data, value, currentOS.tipo, uid)) return; 
      } 
      let updateData = { [field]: value, last_editor: user.email, sync_pendente: true }; 
      let acao = "Edição"; 
      
      if (field === 'hora_inicio' && currentOS) { 
          acao = "Apontamento"; 
          const configTipo = listaTipos.find(t => t.nome === currentOS.tipo); 
          if (configTipo) { 
              const novoFim = addTimes(value, configTipo.duracao); 
              updateData.hora_fim = novoFim; checkExpediente(novoFim, currentOS.data); 
          } 
      } else if (field === 'hora_fim') { checkExpediente(value, currentOS?.data); } 
      
      if (field === 'tecnico') acao = "Atribuição"; 
      
      await updateDoc(doc(db, "os", uid), updateData); 
      await registrarHistorico(uid, acao, `${field} -> ${value}`);
      
      // LOG GLOBAL
      if (field === 'tecnico') await registrarLogGlobal("edicao", "Troca de Técnico", `De ${currentOS.tecnico} para ${value}`, uid);
      if (field === 'hora_inicio') await registrarLogGlobal("status", "Início de Execução", `Iniciado às ${value}`, uid);
  };

  const handleUpdateDate = async (uid, novaData, dataAntiga) => { 
      if (!novaData || novaData === dataAntiga) return; 
      const os = osList.find(o => o.uid === uid); 
      if (!checkCapacity(os.tecnico, novaData, os.horario, os.tipo, uid)) return; 
      checkExpediente(os?.hora_fim, novaData); 
      await updateDoc(doc(db, "os", uid), { data: novaData, last_editor: user.email, sync_pendente: true }); 
      await registrarHistorico(uid, "Reagendamento", `Para ${novaData}`); 
      await registrarLogGlobal("edicao", "Reagendamento", `De ${formatDataBr(dataAntiga)} para ${formatDataBr(novaData)}`, uid);
  };

  const handleDelete = async (uid) => { 
      if (userRole !== 'admin') return alert("Permissão negada."); 
      if(confirm("Excluir?")) {
          await deleteDoc(doc(db, "os", uid));
          await registrarLogGlobal("sistema", "OS Excluída", `ID: ${uid}`, uid);
      }
  };

  const handleDragStart = (e, os) => { setDraggedOS(os); }; 
  const handleDropTech = async (e, targetTech) => { e.preventDefault(); setDragOverTech(null); if (draggedOS) { if (!checkCapacity(targetTech, draggedOS.data, draggedOS.horario, draggedOS.tipo, draggedOS.uid)) return; await handleUpdateField(draggedOS.uid, 'tecnico', targetTech, draggedOS); setDraggedOS(null); } };
  
  // Config Actions (Admin)
  const handleUpdateLimites = async (campo, valor) => { if (userRole !== 'admin') return; const novos = { ...limites, [campo]: Number(valor) }; setLimites(novos); await updateDoc(doc(db, "configuracoes", "geral"), { limites: novos }); }; 
  const handleAddTecnico = async (e) => { e.preventDefault(); if (userRole !== 'admin') return; if(!novoTecnico.trim()) return; await updateDoc(doc(db, "configuracoes", "geral"), { tecnicos: [...listaTecnicos, novoTecnico.trim()] }); setNovoTecnico(""); }; 
  const handleRemoveTecnico = async (nome) => { if (userRole !== 'admin') return; if(confirm("Remover?")) await updateDoc(doc(db, "configuracoes", "geral"), { tecnicos: listaTecnicos.filter(t => t !== nome) }); }; 
  const handleAddTipo = async (e) => { e.preventDefault(); if (userRole !== 'admin') return; if(!novoTipoNome.trim()) return; const novoObj = { nome: novoTipoNome.trim(), duracao: novoTipoDuracao, categoria: novoTipoCategoria }; await updateDoc(doc(db, "configuracoes", "geral"), { tipos: [...listaTipos, novoObj] }); setNovoTipoNome(""); setNovoTipoDuracao("01:00"); }; 
  const handleRemoveTipo = async (nomeAlvo) => { if (userRole !== 'admin') return; if(confirm("Remover?")) { const novaLista = listaTipos.filter(t => t.nome !== nomeAlvo); await updateDoc(doc(db, "configuracoes", "geral"), { tipos: novaLista }); } }; 
  const handleToggleRole = async (uid, currentRole) => { if (userRole !== 'admin') return; const newRole = currentRole === 'admin' ? 'interno' : 'admin'; if (confirm(`Alterar cargo para ${newRole}?`)) { await updateDoc(doc(db, "users", uid), { role: newRole }); } }; 
  const handleAddFolga = async (e) => { e.preventDefault(); if (userRole !== 'admin') return; if (!folgaTecnico || !folgaData) return alert("Selecione técnico e data."); const exists = folgas.find(f => f.tecnico === folgaTecnico && f.data === folgaData); if (exists) return alert("Já existe uma regra para este técnico nesta data."); const novaFolga = { tecnico: folgaTecnico, data: folgaData, limite: Number(folgaLimite) }; await updateDoc(doc(db, "configuracoes", "geral"), { folgas: [...folgas, novaFolga] }); setFolgaTecnico(""); setFolgaData(""); setFolgaLimite(0); }; 
  const handleRemoveFolga = async (tecnico, data) => { if (userRole !== 'admin') return; if (confirm("Remover esta folga/regra?")) { await updateDoc(doc(db, "configuracoes", "geral"), { folgas: folgas.filter(f => !(f.tecnico === tecnico && f.data === data)) }); } };
  
  const getTodayOS = () => { const hoje = new Date().toISOString().split('T')[0]; return applyFilters(osList.filter(os => os.data === hoje)); }; 
  const getDayOS = (dateStr) => { return applyFilters(osList.filter(os => os.data === dateStr)); };
  
  if (loadingAuth) return <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6]">Carregando...</div>;
  if (!user) return <Login onLogin={handleLogin} error={loginError} />;

  const tecnicosOciosos = getTecnicosOciosos();

  if (!audioUnlocked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f3f4f6] p-4 text-center">
        <div className="bg-white p-10 rounded-2xl shadow-xl flex flex-col items-center max-w-md w-full border-b-8 border-[#EB6410]">
          <img src={logoSys3} className="h-16 mb-6 object-contain" alt="Logo" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Monitoramento Sys3</h1>
          <p className="text-gray-500 mb-8">Clique abaixo para ativar o som e iniciar.</p>
          <button onClick={initAudio} className="w-full bg-[#EB6410] text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:bg-orange-600 transition transform hover:scale-105 flex items-center justify-center gap-3"><PlayCircle size={24} /> INICIAR SISTEMA</button>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen p-4 md:p-8 font-sans bg-[#f3f4f6] text-[#000000] flex flex-col">
        <NotificationToast notification={notification} onClose={() => setNotification(null)} />
        <UpdatesDrawer isOpen={showUpdates} onClose={() => setShowUpdates(false)} />

        <header className="mb-6 flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border-t-4 border-[#EB6410]">
          <div className="flex items-center gap-4 mb-4 md:mb-0"><img src={logoSys3} className="h-10 object-contain" /><div className="hidden md:block h-6 w-px bg-gray-200"></div><span className="text-sm font-bold text-gray-600 hidden md:block">Gestão Inteligente</span></div>
          <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto">
            <button onClick={() => setCurrentTab('hoje')} className={`px-4 py-2 rounded-md text-sm font-bold transition whitespace-nowrap ${currentTab === 'hoje' ? 'bg-white text-[#EB6410] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Hoje</button>
            <button onClick={() => setCurrentTab('calendario')} className={`px-4 py-2 rounded-md text-sm font-bold transition whitespace-nowrap ${currentTab === 'calendario' ? 'bg-white text-[#EB6410] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Calendário</button>
            <button onClick={() => setCurrentTab('tecnicos')} className={`px-4 py-2 rounded-md text-sm font-bold transition whitespace-nowrap ${currentTab === 'tecnicos' ? 'bg-white text-[#EB6410] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Performance</button>
            <button onClick={() => setCurrentTab('feed')} className={`px-4 py-2 rounded-md text-sm font-bold transition whitespace-nowrap flex items-center gap-1 ${currentTab === 'feed' ? 'bg-white text-[#EB6410] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><ScrollText size={14}/> Atividades</button>
            <button onClick={() => setCurrentTab('dashboard')} className={`px-4 py-2 rounded-md text-sm font-bold transition flex items-center gap-1 whitespace-nowrap ${currentTab === 'dashboard' ? 'bg-white text-[#EB6410] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><BarChart3 size={14}/> Comercial</button>
            <button onClick={() => setCurrentTab('config')} className={`px-4 py-2 rounded-md text-sm font-bold transition flex items-center gap-1 whitespace-nowrap ${currentTab === 'config' ? 'bg-white text-[#EB6410] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Settings size={14}/> Config</button>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
             <button onClick={toggleSound} className={`px-3 py-2 rounded-lg transition border ${soundEnabled ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' : 'bg-gray-100 text-gray-400 border-transparent hover:bg-gray-200'}`} title={soundEnabled ? "Som Ligado" : "Som Mudo"}>{soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}</button>
            <button onClick={() => setShowUpdates(true)} className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-200 relative"><Bell size={18} /> <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full"></span></button>
            <button onClick={() => { setFormData({ uid: '', cliente: '', telefone: '', endereco: '', tipo: listaTipos[0]?.nome || '', data: new Date().toISOString().split('T')[0], horario: 'Manhã', tecnico: '', hora_inicio: '', hora_fim: '' }); setIsModalOpen(true); }} className="bg-[#EB6410] text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold hover:opacity-90"><ClipboardList size={18} /> Nova OS</button>
            <button onClick={handleLogout} className="bg-gray-200 text-gray-600 px-3 py-2 rounded-lg"><LogOut size={18} /></button>
          </div>
        </header>

        <div className="mb-4 px-1 flex justify-between items-end"><p className="text-gray-500 text-sm">Olá, <span className="font-bold text-gray-800">{user.email.split('@')[0]}</span> <span className="ml-2 text-xs uppercase bg-gray-200 px-2 py-0.5 rounded text-gray-600 font-bold tracking-wider">{userRole}</span></p></div>

        {currentTab === 'hoje' && (
          <div className="flex-1 overflow-x-auto pb-4">
              {tecnicosOciosos.length > 0 && (
                  <div className="mb-4 bg-yellow-100 border-l-4 border-yellow-500 p-3 rounded-r-lg shadow-sm flex items-center justify-between animate-pulse">
                      <div className="flex items-center gap-3">
                          <UserCheck size={24} className="text-yellow-700"/>
                          <div>
                              <h3 className="font-bold text-yellow-800 text-sm uppercase">Radar de Ociosidade Ativo</h3>
                              <p className="text-xs text-yellow-700">Técnicos sem atividade agora: <span className="font-bold">{tecnicosOciosos.join(', ')}</span></p>
                          </div>
                      </div>
                      <button onClick={() => { setFormData({ uid: '', cliente: '', telefone: '', endereco: '', tipo: listaTipos[0]?.nome || '', data: new Date().toISOString().split('T')[0], horario: 'Manhã', tecnico: tecnicosOciosos[0] || '', hora_inicio: '', hora_fim: '' }); setIsModalOpen(true); }} className="bg-yellow-500 text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-yellow-600 transition">
                          Atribuir OS
                      </button>
                  </div>
              )}

              <div className="flex flex-col md:flex-row justify-between items-center mb-4 px-1 gap-4">
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm"><Clock className="text-[#EB6410]" size={20}/><span className="font-bold text-gray-700">Dia: {new Date().toLocaleDateString('pt-BR')}</span></div>
                <div className="flex-1 max-w-md relative"><input type="text" placeholder="Buscar..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-[#EB6410] outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /><Search className="absolute left-3 top-2.5 text-gray-400" size={18} /></div>
                <div className="flex gap-2 bg-white p-1 rounded-lg shadow-sm">{['Todos', 'Aberta', 'Pendente', 'Em Execução', 'Encerrada'].map(st => <button key={st} onClick={() => setFilter(st)} className={`px-3 py-1 rounded text-xs font-bold transition ${filter === st ? 'bg-[#DFDAC6] text-[#EB6410]' : 'text-gray-500 hover:bg-gray-50'}`}>{st}</button>)}</div>
              </div>
              <div className="flex gap-4 min-w-full items-start">
                 <div className={`min-w-[300px] w-[300px] bg-gray-100 rounded-xl p-3 border-2 border-transparent`}>
                   <div className="flex justify-between items-center mb-3 px-1"><h3 className="font-bold text-gray-600 flex items-center gap-2"><User size={16}/> A Definir / Outros</h3><span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{getTodayOS().filter(os => !isTecnicoConhecido(os.tecnico)).length}</span></div>
                   <div className="space-y-2">{getTodayOS().filter(os => !isTecnicoConhecido(os.tecnico)).map(os => (<div key={os.uid}>{os.tecnico && !isTecnicoConhecido(os.tecnico) && (<div className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-1 rounded mb-1 text-center font-bold">⚠️ SGP: {os.tecnico}</div>)}<OSCard key={os.uid} os={os} handleEditOS={handleEditOS} handleDragStart={handleDragStart} handleUpdateDate={handleUpdateDate} handleUpdateField={handleUpdateField} handleUpdateStatus={handleUpdateStatus} handleDelete={handleDelete} verHistorico={verHistorico} listaTecnicos={listaTecnicos} sendWhatsApp={sendWhatsApp} userRole={userRole} handleToggleConfirm={handleToggleConfirm} /></div>))}</div>
                 </div>
                 {(listaTecnicos || []).map(tec => {
                   const hojeStr = new Date().toISOString().split('T')[0];
                   const folgaHoje = getFolgaInfo(tec, hojeStr);
                   const isFolgaTotal = folgaHoje && Number(folgaHoje.limite) === 0;
                   const isOcioso = tecnicosOciosos.includes(tec); 
                   return (
                     <div key={tec} onDrop={(e) => !isFolgaTotal && handleDropTech(e, tec)} onDragOver={(e) => e.preventDefault()} className={`min-w-[300px] w-[300px] rounded-xl p-3 border-2 transition-colors ${isFolgaTotal ? 'bg-red-50 border-red-200 opacity-90 cursor-not-allowed' : 'border-transparent bg-gray-100'}`}>
                       <div className="flex justify-between items-center mb-3 px-1">
                           <div className="flex items-center gap-2 overflow-hidden">
                               <h3 className={`font-bold flex items-center gap-2 uppercase truncate ${isFolgaTotal ? 'text-red-600' : 'text-[#EB6410]'}`}><User size={16}/> {tec}</h3>
                               {isOcioso && <span className="text-[8px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200 animate-pulse">LIVRE</span>}
                           </div>
                           <span className={`${isFolgaTotal ? 'bg-red-200 text-red-800' : 'bg-orange-200 text-orange-800'} text-xs font-bold px-2 py-0.5 rounded-full`}>{getTodayOS().filter(os => os.tecnico === tec).length}</span>
                       </div>
                       {folgaHoje && (<div className={`p-3 mb-3 rounded-lg border-l-4 shadow-sm flex items-center gap-3 animate-fade-in ${Number(folgaHoje.limite) === 0 ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-yellow-500'}`}><div className={`p-2 rounded-full ${Number(folgaHoje.limite) === 0 ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>{Number(folgaHoje.limite) === 0 ? <Coffee size={20}/> : <AlertTriangle size={20}/>}</div><div><h4 className={`text-xs font-bold uppercase ${Number(folgaHoje.limite) === 0 ? 'text-red-700' : 'text-yellow-700'}`}>{Number(folgaHoje.limite) === 0 ? 'Folga Total' : 'Escala Ajustada'}</h4><p className="text-[10px] text-gray-500 font-medium leading-tight">{Number(folgaHoje.limite) === 0 ? 'Indisponível hoje.' : `Capacidade: ${folgaHoje.limite} vagas.`}</p></div></div>)}
                       <div className="space-y-2">{getTodayOS().filter(os => os.tecnico === tec).map(os => <OSCard key={os.uid} os={os} handleEditOS={handleEditOS} handleDragStart={handleDragStart} handleUpdateDate={handleUpdateDate} handleUpdateField={handleUpdateField} handleUpdateStatus={handleUpdateStatus} handleDelete={handleDelete} verHistorico={verHistorico} listaTecnicos={listaTecnicos} sendWhatsApp={sendWhatsApp} userRole={userRole} handleToggleConfirm={handleToggleConfirm} />)}</div>
                     </div>
                   );
                 })}
              </div>
          </div>
        )}

        {currentTab === 'calendario' && <CalendarioVagas onDayClick={setSelectedDay} />}
        {currentTab === 'tecnicos' && <PerformanceTecnica osList={osList} listaTecnicos={listaTecnicos} />}
        {currentTab === 'feed' && <ActivityFeed />} 
        {currentTab === 'dashboard' && <Dashboard />}
        {currentTab === 'config' && (<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">{userRole !== 'admin' && (<div className="col-span-full bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 rounded-md flex items-center gap-2"><Lock size={20} /><div><p className="font-bold">Modo de Visualização</p><p className="text-xs">Apenas administradores podem alterar configurações.</p></div></div>)}<div className="space-y-6"><div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-[#EB6410]"><h2 className="text-xl font-bold mb-4 flex items-center gap-2"><User className="text-[#EB6410]" /> Equipe Técnica</h2>{userRole === 'admin' && (<form onSubmit={handleAddTecnico} className="flex gap-2 mb-6"><input type="text" placeholder="Nome" className="flex-1 border-2 rounded-lg px-4 py-2" value={novoTecnico} onChange={e => setNovoTecnico(e.target.value)} /><button type="submit" className="bg-[#EB6410] text-white px-4 rounded-lg"><Plus/></button></form>)}<div className="space-y-2">{(listaTecnicos || []).map((tec, idx) => (<div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border hover:border-[#EB6410]"><span className="font-medium">{tec}</span>{userRole === 'admin' && <button onClick={() => handleRemoveTecnico(tec)} className="text-gray-400 hover:text-red-500"><Trash2 size={18}/></button>}</div>))}</div></div><div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-red-500"><h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Coffee className="text-red-500" /> Escala de Folgas</h2>{userRole === 'admin' && (<form onSubmit={handleAddFolga} className="bg-red-50 p-4 rounded-lg mb-4 border border-red-100"><div className="grid grid-cols-2 gap-3 mb-3"><select className="border rounded px-2 py-1.5 w-full bg-white" value={folgaTecnico} onChange={e => setFolgaTecnico(e.target.value)}><option value="">Selecione Técnico...</option>{(listaTecnicos || []).map(t => <option key={t} value={t}>{t}</option>)}</select><input type="date" className="border rounded px-2 py-1.5 w-full" value={folgaData} onChange={e => setFolgaData(e.target.value)} /></div><div className="flex gap-2 items-center"><label className="text-xs font-bold text-red-700">Vagas Disponíveis:</label><input type="number" min="0" max="10" className="border rounded w-16 px-2 py-1 text-center font-bold" value={folgaLimite} onChange={e => setFolgaLimite(e.target.value)} /><span className="text-xs text-gray-500">(0 = Folga Total)</span><button type="submit" className="ml-auto bg-red-500 text-white px-3 py-1 rounded text-xs font-bold hover:bg-red-600">Agendar</button></div></form>)}<div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">{(folgas || []).map((f, idx) => (<div key={idx} className="flex justify-between items-center p-2 bg-white rounded border border-red-100 text-sm"><div><span className="font-bold text-gray-700">{f.tecnico}</span><span className="mx-2 text-gray-300">|</span><span>{new Date(f.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</span><span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded ${Number(f.limite)===0 ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>{Number(f.limite) === 0 ? 'FOLGA TOTAL' : `${f.limite} VAGAS`}</span></div>{userRole === 'admin' && <button onClick={() => handleRemoveFolga(f.tecnico, f.data)} className="text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>}</div>))}</div></div>{userRole === 'admin' && (<div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-gray-700"><h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Shield className="text-gray-700" /> Acesso de Usuários</h2><div className="space-y-2">{(usuariosSistema || []).map((u) => (<div key={u.uid} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border"><div className="flex flex-col"><span className="font-bold text-sm text-gray-800">{u.email}</span><span className={`text-xs font-bold uppercase ${u.role === 'admin' ? 'text-green-600' : 'text-gray-500'}`}>{u.role}</span></div>{u.email !== user.email && (<button onClick={() => handleToggleRole(u.uid, u.role)} className="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded font-bold transition">Mudar Cargo</button>)}</div>))}</div></div>)}</div><div className="space-y-6"><div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-purple-500"><h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Activity className="text-purple-500" /> Regras Globais</h2><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-bold text-gray-600 mb-1">Max. Instalações</label><input type="number" min="0" disabled={userRole !== 'admin'} className="w-full border-2 rounded-lg px-3 py-2 disabled:bg-gray-100" value={limites?.instalacao || 0} onChange={e => handleUpdateLimites('instalacao', e.target.value)} /></div><div><label className="block text-sm font-bold text-gray-600 mb-1">Max. Chamados</label><input type="number" min="0" disabled={userRole !== 'admin'} className="w-full border-2 rounded-lg px-3 py-2 disabled:bg-gray-100" value={limites?.chamado || 0} onChange={e => handleUpdateLimites('chamado', e.target.value)} /></div></div></div><div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-blue-500"><h2 className="text-xl font-bold mb-4 flex items-center gap-2"><ClipboardList className="text-blue-500" /> Tipos de Serviço</h2>{userRole === 'admin' && (<form onSubmit={handleAddTipo} className="flex flex-col gap-2 mb-6"><input type="text" placeholder="Nome" className="w-full border-2 rounded-lg px-3 py-2 text-sm" value={novoTipoNome} onChange={e => setNovoTipoNome(e.target.value)} /><div className="flex gap-2"><input type="time" className="w-24 border-2 rounded-lg px-2 py-2 text-sm" value={novoTipoDuracao} onChange={e => setNovoTipoDuracao(e.target.value)} /><select className="flex-1 border-2 rounded-lg px-2 py-2 text-sm bg-white" value={novoTipoCategoria} onChange={e => setNovoTipoCategoria(e.target.value)}><option value="instalacao">Instalação</option><option value="chamado">Manutenção</option></select><button type="submit" className="bg-blue-500 text-white px-4 rounded-lg"><Plus/></button></div></form>)}<div className="space-y-2">{(listaTipos || []).map((t, idx) => (<div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border hover:border-blue-500"><div className="flex flex-col"><span className="font-medium">{t.nome}</span><div className="flex gap-2 text-xs text-gray-400"><span className="flex items-center gap-1"><Timer size={10}/> {t.duracao}h</span><span className="flex items-center gap-1"><Briefcase size={10}/> {t.categoria}</span></div></div>{userRole === 'admin' && <button onClick={() => handleRemoveTipo(t.nome)} className="text-gray-400 hover:text-red-500"><Trash2 size={18}/></button>}</div>))}</div></div></div></div>)}
        
        {/* --- MODAL DO DIA SELECIONADO (CORRIGIDO: PASSAR handleToggleConfirm) --- */}
        {selectedDay && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden border-t-8 border-[#EB6410]">
                    <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-xl text-[#000000] flex items-center gap-2">
                            <CalendarDays className="text-[#EB6410]" /> Atividades: {new Date(selectedDay).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                        </h3>
                        <button onClick={() => setSelectedDay(null)}><X size={24} className="text-gray-400 hover:text-[#EB6410]"/></button>
                    </div>

                    <div className="p-6 bg-gray-50 flex-1 overflow-y-auto">
                        {getDayOS(selectedDay).length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                                <CalendarDays size={48} className="opacity-20"/>
                                <p>Nenhuma atividade técnica para este dia.</p>
                                <button onClick={() => { setIsModalOpen(true); setFormData({...formData, data: selectedDay}); setSelectedDay(null); }} className="text-[#EB6410] font-bold hover:underline">
                                    Criar Nova OS para esta data
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* BLOCO MANHÃ */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 border-b pb-2 border-yellow-200">
                                        <div className="bg-yellow-100 p-1.5 rounded-lg text-yellow-600"><Sun size={20}/></div>
                                        <h4 className="text-lg font-bold text-gray-700">MANHÃ</h4>
                                        <span className="text-xs font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                                            {getDayOS(selectedDay).filter(os => !os.horario || os.horario === 'Manhã').length} Agendamentos
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {getDayOS(selectedDay)
                                            .filter(os => !os.horario || os.horario === 'Manhã')
                                            .map(os => (
                                            <OSCard key={os.uid} os={os} handleEditOS={handleEditOS} handleDragStart={handleDragStart} handleUpdateDate={handleUpdateDate} handleUpdateField={handleUpdateField} handleUpdateStatus={handleUpdateStatus} handleDelete={handleDelete} verHistorico={verHistorico} listaTecnicos={listaTecnicos} sendWhatsApp={sendWhatsApp} userRole={userRole} handleToggleConfirm={handleToggleConfirm} />
                                        ))}
                                    </div>
                                </div>

                                {/* BLOCO TARDE */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 border-b pb-2 border-blue-200">
                                        <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600"><Moon size={20}/></div>
                                        <h4 className="text-lg font-bold text-gray-700">TARDE</h4>
                                        <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                            {getDayOS(selectedDay).filter(os => os.horario === 'Tarde').length} Agendamentos
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {getDayOS(selectedDay)
                                            .filter(os => os.horario === 'Tarde')
                                            .map(os => (
                                            <OSCard key={os.uid} os={os} handleEditOS={handleEditOS} handleDragStart={handleDragStart} handleUpdateDate={handleUpdateDate} handleUpdateField={handleUpdateField} handleUpdateStatus={handleUpdateStatus} handleDelete={handleDelete} verHistorico={verHistorico} listaTecnicos={listaTecnicos} sendWhatsApp={sendWhatsApp} userRole={userRole} handleToggleConfirm={handleToggleConfirm} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {isHistoryModalOpen && (<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border-t-8 border-gray-600"><div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50"><h3 className="font-bold text-xl text-[#000000] flex items-center gap-2"><History className="text-gray-600" /> Histórico</h3><button onClick={() => setIsHistoryModalOpen(false)}><X size={24} className="text-gray-400 hover:text-black"/></button></div><div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">{loadingHistory ? <p className="text-center py-4">Carregando...</p> : currentHistory.length === 0 ? <p className="text-center text-gray-400">Vazio.</p> : <div className="relative border-l-2 border-gray-200 ml-3 space-y-6">{currentHistory.map((log, i) => (<div key={i} className="ml-6 relative"><div className="absolute -left-[31px] bg-gray-200 h-4 w-4 rounded-full border-2 border-white"></div><p className="text-xs text-gray-400 font-bold mb-1">{formatDataBr(log.data)}</p><p className="text-sm font-bold text-gray-800">{log.acao}</p><p className="text-sm text-gray-600 mt-1">{log.detalhe}</p><p className="text-xs text-[#EB6410] mt-1 bg-orange-50 w-fit px-2 py-0.5 rounded">{log.usuario}</p></div>))}</div>}</div></div></div>)}
      </div>
    </DndProvider>
  );
}

export default App;