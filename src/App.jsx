import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar as CalIcon, ClipboardList, User, MapPin, Clock, X, Save, 
  Filter, Trash2, LogOut, Lock, CheckCircle, ChevronLeft, ChevronRight, 
  Timer, History, CalendarDays, GripHorizontal, Sun, Moon, Settings, Plus, Wrench, AlertTriangle, Briefcase, Activity 
} from 'lucide-react';
import logoSys3 from './assets/imgLOGO.png';
import { db, auth } from './firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, getDocs, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';

// --- MASCOTE ROBÔ AVANÇADO (VERSÃO 2.0 - PRIVACIDADE) ---
const AdvancedRobot = ({ isPasswordFocused }) => {
  const [eyePos, setEyePos] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const faceRef = useRef(null);

  // 1. Seguir Mouse (Só funciona se o olho estiver aberto)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isPasswordFocused || !faceRef.current) return;
      const { left, top, width, height } = faceRef.current.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      
      // Limita movimento dentro do visor
      const x = Math.min(Math.max((e.clientX - centerX) / 15, -12), 12);
      const y = Math.min(Math.max((e.clientY - centerY) / 15, -8), 8);
      
      setEyePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isPasswordFocused]);

  // 2. Piscar Aleatório (Só se não estiver na senha)
  useEffect(() => {
    const blinkLoop = setInterval(() => {
      if (!isPasswordFocused) {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 200);
      }
    }, 4000);
    return () => clearInterval(blinkLoop);
  }, [isPasswordFocused]);

  return (
    <div className="relative w-40 h-40 mx-auto mb-2 flex justify-center items-center">
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .eye-glow { filter: drop-shadow(0 0 5px #00FFFF); }
      `}</style>

      <div className="relative w-full h-full animate-float">
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl">
          {/* ANTENA */}
          <path d="M100,40 L100,20" stroke="#EB6410" strokeWidth="4" strokeLinecap="round" />
          <circle cx="100" cy="15" r="5" fill="#EB6410">
            <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
          </circle>

          {/* CABEÇA */}
          <rect x="40" y="40" width="120" height="100" rx="25" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="2" />
          <rect x="45" y="45" width="110" height="90" rx="20" fill="url(#gradOrange)" />
          
          <defs>
            <linearGradient id="gradOrange" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EB6410" />
              <stop offset="100%" stopColor="#c04d05" />
            </linearGradient>
          </defs>

          {/* VISOR PRETO */}
          <rect ref={faceRef} x="55" y="65" width="90" height="50" rx="15" fill="#1F2937" stroke="#374151" strokeWidth="2" />

          {/* LÓGICA DOS OLHOS */}
          {isPasswordFocused ? (
            // --- MODO PRIVACIDADE (OLHOS FECHADOS) ---
            <g className="eye-glow">
              {/* Olho Esquerdo Fechado (Traço) */}
              <line x1="70" y1="90" x2="90" y2="90" stroke="#00FFFF" strokeWidth="4" strokeLinecap="round" />
              {/* Olho Direito Fechado (Traço) */}
              <line x1="110" y1="90" x2="130" y2="90" stroke="#00FFFF" strokeWidth="4" strokeLinecap="round" />
            </g>
          ) : (
            // --- MODO VIGILANTE (OLHOS ABERTOS) ---
            <g style={{ 
                transform: `translate(${eyePos.x}px, ${eyePos.y}px)`, 
                transition: 'transform 0.1s ease-out' 
              }}>
              
              {isBlinking ? (
                // Piscada Rápida
                <g className="eye-glow">
                  <line x1="70" y1="90" x2="90" y2="90" stroke="#00FFFF" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
                  <line x1="110" y1="90" x2="130" y2="90" stroke="#00FFFF" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
                </g>
              ) : (
                // Olhos Abertos
                <g>
                  <circle cx="80" cy="90" r="8" fill="#00FFFF" className="eye-glow" />
                  <circle cx="83" cy="87" r="3" fill="white" opacity="0.8" />
                  
                  <circle cx="120" cy="90" r="8" fill="#00FFFF" className="eye-glow" />
                  <circle cx="123" cy="87" r="3" fill="white" opacity="0.8" />
                </g>
              )}
            </g>
          )}
        </svg>
      </div>
      
      {/* Sombra Chão */}
      <div className="absolute bottom-4 w-20 h-2 bg-black/10 rounded-full blur-sm animate-pulse"></div>
    </div>
  );
};

function App() {
  // --- AUTH STATES ---
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  
  // State para animação do mascote
  const [isPwdFocused, setIsPwdFocused] = useState(false);

  // --- APP STATES ---
  const [currentTab, setCurrentTab] = useState('hoje');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [osList, setOsList] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [filter, setFilter] = useState('Todos');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null); 

  // --- CONFIGURAÇÕES ---
  const [listaTecnicos, setListaTecnicos] = useState(['Técnico 1', 'Técnico 2']);
  const [listaTipos, setListaTipos] = useState([]); 
  const [limites, setLimites] = useState({ instalacao: 2, chamado: 2 });

  const [novoTecnico, setNovoTecnico] = useState("");
  const [novoTipoNome, setNovoTipoNome] = useState("");
  const [novoTipoDuracao, setNovoTipoDuracao] = useState("01:00");
  const [novoTipoCategoria, setNovoTipoCategoria] = useState("chamado"); 

  // --- DRAG AND DROP ---
  const [draggedOS, setDraggedOS] = useState(null);
  const [dragOverDate, setDragOverDate] = useState(null); 
  const [dragOverTech, setDragOverTech] = useState(null); 

  // --- HISTÓRICO ---
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [currentHistory, setCurrentHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [formData, setFormData] = useState({ 
    cliente: '', endereco: '', tipo: '', 
    data: new Date().toISOString().split('T')[0], 
    horario: 'Manhã', tecnico: '',
    hora_inicio: '', hora_fim: ''
  });

  // --- EFEITOS ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, "os"), orderBy("data", "asc"));
      const unsubOS = onSnapshot(q, (snapshot) => {
        setOsList(snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id })));
        setLoadingData(false);
      });

      const docRef = doc(db, "configuracoes", "geral");
      const unsubConfig = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setListaTecnicos(data.tecnicos || []);
          setLimites(data.limites || { instalacao: 2, chamado: 2 });
          
          const tiposRaw = data.tipos || [];
          const tiposFormatados = tiposRaw.map(t => {
            if (typeof t === 'string') return { nome: t, duracao: '01:00', categoria: 'chamado' };
            if (!t.categoria) return { ...t, categoria: 'chamado' }; 
            return t;
          });
          setListaTipos(tiposFormatados);

        } else {
          setDoc(docRef, { 
            tecnicos: ['Carlos', 'Ana'], 
            limites: { instalacao: 2, chamado: 2 },
            tipos: [
              { nome: 'Instalação Fibra', duracao: '02:00', categoria: 'instalacao' }, 
              { nome: 'Manutenção', duracao: '01:00', categoria: 'chamado' }
            ] 
          });
        }
      });

      return () => { unsubOS(); unsubConfig(); };
    }
  }, [user]);

  // --- LÓGICA DE NEGÓCIO ---
  const getCategoria = (nomeTipo) => {
    const tipo = listaTipos.find(t => t.nome === nomeTipo);
    if (!tipo) {
      const lower = nomeTipo.toLowerCase();
      if (lower.includes('instala') || lower.includes('transf')) return 'instalacao';
      return 'chamado';
    }
    return tipo.categoria || 'chamado';
  };

  const checkCapacity = (techName, dateStr, turno, tipoServico, ignoreUid = null) => {
    if (!techName || techName === "") return true;
    const categoriaAtual = getCategoria(tipoServico);
    const limiteAtual = categoriaAtual === 'instalacao' ? limites.instalacao : limites.chamado;
    const count = osList.filter(os => 
      os.tecnico === techName && os.data === dateStr && os.horario === turno &&
      getCategoria(os.tipo) === categoriaAtual && os.uid !== ignoreUid
    ).length;
    if (count >= limiteAtual) {
      const nomeCat = categoriaAtual === 'instalacao' ? 'Instalações/Transf.' : 'Chamados/Manut.';
      alert(`🚫 CAPACIDADE EXCEDIDA!\n\nO técnico ${techName} já possui ${count} ${nomeCat} agendadas para ${turno} do dia ${new Date(dateStr).toLocaleDateString('pt-BR')}.\n\nO limite configurado é de ${limiteAtual}.`);
      return false;
    }
    return true;
  };

  const checkExpediente = (horaFim, osDate) => {
    if (osDate) {
      const diaSemana = new Date(osDate).getUTCDay();
      if (diaSemana === 0) { alert("⚠️ ALERTA DE ESCALA:\nEsta atividade está marcada para um DOMINGO."); return; }
    }
    if (horaFim) {
      const [hora, minuto] = horaFim.split(':').map(Number);
      if (hora > 18 || (hora === 18 && minuto > 0)) alert(`⚠️ ALERTA DE HORA EXTRA:\nTérmino previsto (${horaFim}) ultrapassa 18:00.`);
    }
  };

  const addTimes = (startTime, duration) => {
    if (!startTime || !duration) return '';
    const [h1, m1] = startTime.split(':').map(Number);
    const [h2, m2] = duration.split(':').map(Number);
    let totalM = m1 + m2;
    let totalH = h1 + h2 + Math.floor(totalM / 60);
    totalM = totalM % 60;
    return `${String(totalH % 24).padStart(2, '0')}:${String(totalM).padStart(2, '0')}`;
  };

  // --- ACTIONS ---
  const registrarHistorico = async (osId, acao, detalhe) => { if (!user) return; try { await addDoc(collection(db, "os", osId, "historico"), { data: new Date().toISOString(), usuario: user.email, acao, detalhe }); } catch (e) {} };
  const verHistorico = async (osId) => { setLoadingHistory(true); setIsHistoryModalOpen(true); setCurrentHistory([]); try { const q = query(collection(db, "os", osId, "historico"), orderBy("data", "desc")); const snap = await getDocs(q); setCurrentHistory(snap.docs.map(d => d.data())); } catch (e) { alert("Erro histórico"); } setLoadingHistory(false); };
  const handleLogin = async (e) => { e.preventDefault(); try { await signInWithEmailAndPassword(auth, email, password); } catch (e) { setLoginError("Erro login"); } };
  const handleLogout = async () => await signOut(auth);

  const handleSaveOS = async (e) => {
    e.preventDefault();
    if (!checkCapacity(formData.tecnico, formData.data, formData.horario, formData.tipo)) return;
    try {
      checkExpediente('data', null, formData.data);
      const docRef = await addDoc(collection(db, "os"), { id: Date.now(), ...formData, status: 'Pendente', hora_inicio: '', hora_fim: '' });
      await registrarHistorico(docRef.id, "Criação", `OS criada por ${user.email}`);
      setIsModalOpen(false);
      setFormData({ cliente: '', endereco: '', tipo: listaTipos[0]?.nome || '', data: new Date().toISOString().split('T')[0], horario: 'Manhã', tecnico: '', hora_inicio: '', hora_fim: '' });
    } catch (e) { alert("Erro salvar"); }
  };

  const handleUpdateStatus = async (uid, novoStatus) => { await updateDoc(doc(db, "os", uid), { status: novoStatus }); await registrarHistorico(uid, "Status", novoStatus); };
  
  const handleUpdateField = async (uid, field, value, currentOS = null) => {
    if (currentOS) {
      if (field === 'tecnico' && !checkCapacity(value, currentOS.data, currentOS.horario, currentOS.tipo, uid)) return;
      if (field === 'horario' && !checkCapacity(currentOS.tecnico, currentOS.data, value, currentOS.tipo, uid)) return;
    }
    let updateData = { [field]: value };
    let acao = "Edição";
    if (field === 'hora_inicio' && currentOS) {
      acao = "Apontamento";
      const configTipo = listaTipos.find(t => t.nome === currentOS.tipo);
      if (configTipo) {
        const novoFim = addTimes(value, configTipo.duracao);
        updateData.hora_fim = novoFim;
        checkExpediente(novoFim, currentOS.data);
      }
    } else if (field === 'hora_fim') { checkExpediente(value, currentOS?.data); }
    if (field === 'tecnico') acao = "Atribuição"; 
    await updateDoc(doc(db, "os", uid), updateData);
    await registrarHistorico(uid, acao, `${field} -> ${value}`);
  };

  const handleUpdateDate = async (uid, novaData, dataAntiga) => {
    if (!novaData || novaData === dataAntiga) return;
    const os = osList.find(o => o.uid === uid);
    if (!checkCapacity(os.tecnico, novaData, os.horario, os.tipo, uid)) return;
    checkExpediente(os?.hora_fim, novaData);
    await updateDoc(doc(db, "os", uid), { data: novaData });
    await registrarHistorico(uid, "Reagendamento", `Para ${novaData}`);
  };

  const handleDelete = async (uid) => { if(confirm("Excluir?")) await deleteDoc(doc(db, "os", uid)); };

  const handleUpdateLimites = async (campo, valor) => { const novosLimites = { ...limites, [campo]: Number(valor) }; setLimites(novosLimites); await updateDoc(doc(db, "configuracoes", "geral"), { limites: novosLimites }); };
  const handleAddTecnico = async (e) => { e.preventDefault(); if(!novoTecnico.trim()) return; await updateDoc(doc(db, "configuracoes", "geral"), { tecnicos: [...listaTecnicos, novoTecnico.trim()] }); setNovoTecnico(""); };
  const handleRemoveTecnico = async (nome) => { if(confirm("Remover?")) await updateDoc(doc(db, "configuracoes", "geral"), { tecnicos: listaTecnicos.filter(t => t !== nome) }); };
  const handleAddTipo = async (e) => { e.preventDefault(); if(!novoTipoNome.trim()) return; const novoObj = { nome: novoTipoNome.trim(), duracao: novoTipoDuracao, categoria: novoTipoCategoria }; await updateDoc(doc(db, "configuracoes", "geral"), { tipos: [...listaTipos, novoObj] }); setNovoTipoNome(""); setNovoTipoDuracao("01:00"); };
  const handleRemoveTipo = async (nomeAlvo) => { if(confirm("Remover?")) { const novaLista = listaTipos.filter(t => t.nome !== nomeAlvo); await updateDoc(doc(db, "configuracoes", "geral"), { tipos: novaLista }); } };

  const handleDragStart = (e, os) => { setDraggedOS(os); e.dataTransfer.effectAllowed = "move"; };
  const handleDragOverDate = (e, dateStr) => { e.preventDefault(); setDragOverDate(dateStr); };
  const handleDropDate = async (e, targetDate) => { e.preventDefault(); setDragOverDate(null); if (draggedOS && targetDate) { await handleUpdateDate(draggedOS.uid, targetDate, draggedOS.data); setDraggedOS(null); } };
  const handleDragOverTech = (e, techName) => { e.preventDefault(); setDragOverTech(techName); };
  const handleDropTech = async (e, targetTech) => { e.preventDefault(); setDragOverTech(null); if (draggedOS) { if (!checkCapacity(targetTech, draggedOS.data, draggedOS.horario, draggedOS.tipo, draggedOS.uid)) return; await handleUpdateField(draggedOS.uid, 'tecnico', targetTech); setDraggedOS(null); } };

  // --- HELPERS ---
  const calcDuration = (start, end) => { if (!start || !end) return null; const [h1, m1] = start.split(':').map(Number); const [h2, m2] = end.split(':').map(Number); let diff = (h2 * 60 + m2) - (h1 * 60 + m1); if (diff < 0) diff += 24 * 60; const h = Math.floor(diff / 60); const m = diff % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; };
  const timeToMinutes = (t) => { if(!t) return 0; const [h,m] = t.split(':').map(Number); return h*60+m; };
  const formatDataBr = (iso) => { if(!iso) return ''; const d = new Date(iso); return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`; };
  const getStatusColor = (s) => { if(s==='Pendente') return 'bg-yellow-100 text-yellow-800 border-yellow-200'; if(s==='Em Andamento') return 'bg-blue-100 text-blue-800 border-blue-200'; return 'bg-green-100 text-green-800 border-green-200'; };
  const isOvertime = (timeStr) => { if (!timeStr) return false; const [h, m] = timeStr.split(':').map(Number); return h > 18 || (h === 18 && m > 0); };
  const getDaysInMonth = (d) => new Date(d.getFullYear(), d.getMonth()+1, 0).getDate();
  const getFirstDayOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1).getDay();
  const changeMonth = (offset) => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + offset)));
  const getTodayOS = () => { const hoje = new Date().toISOString().split('T')[0]; return osList.filter(os => os.data === hoje && (filter === 'Todos' || os.status === filter)); };
  const getDayOS = (dateStr) => osList.filter(os => os.data === dateStr);
  const getTechStats = () => { const stats = {}; osList.forEach(os => { const t = os.tecnico?.trim() || 'Sem Técnico'; if(!stats[t]) stats[t] = { total: 0, concluidas: 0, tmaMin: 0, tmaCount: 0 }; stats[t].total++; if(os.status === 'Concluído') { stats[t].concluidas++; if(os.hora_inicio && os.hora_fim) { stats[t].tmaMin += timeToMinutes(calcDuration(os.hora_inicio, os.hora_fim)); stats[t].tmaCount++; } } }); return Object.entries(stats); };

  // --- CARD COMPONENT ---
  const OSCard = ({ os }) => (
    <div draggable onDragStart={(e) => handleDragStart(e, os)} className="p-3 bg-white rounded-lg shadow-sm border border-gray-200 mb-3 hover:shadow-md cursor-grab active:cursor-grabbing border-l-4 hover:border-l-[#EB6410]">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <div className="flex items-center bg-gray-50 rounded border px-2 py-0.5 relative cursor-pointer hover:bg-gray-100 transition" title="Reagendar">
            <CalendarDays size={12} className="text-[#EB6410] mr-1"/>
            <span className="text-[10px] font-bold text-gray-600">{new Date(os.data).toLocaleDateString('pt-BR',{timeZone:'UTC'})}</span>
            <input type="date" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={(e) => handleUpdateDate(os.uid, e.target.value, os.data)} />
        </div>
        <div className="flex items-center bg-gray-50 rounded border px-1 py-0.5" title="Turno">
          {os.horario === 'Manhã' ? <Sun size={12} className="text-orange-400 mr-1"/> : <Moon size={12} className="text-blue-400 mr-1"/>}
          <select value={os.horario} onChange={(e) => handleUpdateField(os.uid, 'horario', e.target.value, os)} className="bg-transparent text-[10px] font-bold text-gray-600 outline-none cursor-pointer">
            <option value="Manhã">M</option><option value="Tarde">T</option>
          </select>
        </div>
        <select value={os.status} onChange={(e) => handleUpdateStatus(os.uid, e.target.value)} className={`text-[10px] px-2 py-0.5 rounded-full border font-bold outline-none ${getStatusColor(os.status)}`}><option>Pendente</option><option>Em Andamento</option><option>Concluído</option></select>
      </div>
      <h3 className="font-bold text-gray-800 text-sm leading-tight mb-1">{os.cliente}</h3>
      <div className="flex items-center gap-1 mb-2"><span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 flex items-center gap-1"><Wrench size={10} /> {os.tipo}</span></div>
      <p className="text-xs text-gray-500 flex items-center gap-1 mb-2 truncate"><MapPin size={12}/> {os.endereco}</p>
      <div className="bg-gray-50 p-2 rounded border border-gray-100 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1"><label className="text-[9px] font-bold text-gray-400">INI</label><input type="time" className="bg-white border rounded px-1 text-[10px] w-14 focus:border-[#EB6410] outline-none" value={os.hora_inicio || ''} onChange={(e) => handleUpdateField(os.uid, 'hora_inicio', e.target.value, os)} /></div>
        <div className="flex items-center gap-1"><label className="text-[9px] font-bold text-gray-400">FIM</label><input type="time" className={`bg-white border rounded px-1 text-[10px] w-14 outline-none ${isOvertime(os.hora_fim) ? 'border-red-500 text-red-600 font-bold' : 'focus:border-[#EB6410]'}`} value={os.hora_fim || ''} onChange={(e) => handleUpdateField(os.uid, 'hora_fim', e.target.value, os)} /></div>
        {os.hora_inicio && os.hora_fim && (<span className="text-[10px] font-bold text-[#EB6410] ml-auto">{calcDuration(os.hora_inicio, os.hora_fim)}h</span>)}
      </div>
      {isOvertime(os.hora_fim) && <div className="mt-1 flex items-center gap-1 text-[10px] text-red-500 font-bold bg-red-50 px-2 py-1 rounded"><AlertTriangle size={10} /> Hora Extra (+18:00)</div>}
      <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center bg-gray-50 rounded border px-2 py-1 max-w-[120px]" title="Atribuir Técnico">
           <User size={12} className="text-gray-400 mr-1"/>
           <select value={os.tecnico || ''} onChange={(e) => handleUpdateField(os.uid, 'tecnico', e.target.value, os)} className="bg-transparent text-[10px] font-bold text-gray-600 outline-none cursor-pointer w-full truncate" onClick={(e) => e.stopPropagation()}>
             <option value="">A definir</option>{listaTecnicos.map(t => <option key={t} value={t}>{t}</option>)}
           </select>
        </div>
        <div className="flex gap-1"><button onClick={() => verHistorico(os.uid)} className="text-gray-400 hover:text-[#EB6410] p-1 rounded hover:bg-orange-50"><History size={14}/></button><button onClick={() => handleDelete(os.uid)} className="text-gray-300 hover:text-red-500 p-1 rounded hover:bg-red-50"><Trash2 size={14}/></button></div>
      </div>
    </div>
  );

  // --- RENDER ---
  if (loadingAuth) return <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6]">Carregando...</div>;
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-4">
        <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#EB6410 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        <div className="bg-white/80 backdrop-blur-lg p-8 rounded-3xl shadow-2xl w-full max-w-sm border border-white relative z-10">
          <div className="flex justify-center mb-4"><img src={logoSys3} className="h-14 object-contain" /></div>
          <AdvancedRobot isPasswordFocused={isPwdFocused} />
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-1">Bem-vindo</h2>
          <p className="text-center text-gray-500 mb-6 text-sm font-medium">Faça login para gerenciar a rede.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">E-mail</label><input type="email" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:border-[#EB6410] focus:ring-2 focus:ring-orange-100 outline-none transition font-medium text-gray-700" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@sys3.com.br" onFocus={() => setIsPwdFocused(false)}/></div>
            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Senha</label><input type="password" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:border-[#EB6410] focus:ring-2 focus:ring-orange-100 outline-none transition font-medium text-gray-700" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" onFocus={() => setIsPwdFocused(true)} onBlur={() => setIsPwdFocused(false)}/></div>
            {loginError && <p className="text-red-500 text-sm font-bold text-center bg-red-50 p-3 rounded-xl border border-red-100">{loginError}</p>}
            <button type="submit" className="w-full bg-gradient-to-r from-[#EB6410] to-[#c04d05] hover:opacity-90 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-200 transition transform hover:scale-[1.02]"><Lock size={18} /> Acessar Painel</button>
          </form>
          <p className="text-center text-[10px] text-gray-400 mt-6 font-medium">SYS3 INTERNET © 2026</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans bg-[#f3f4f6] text-[#000000] flex flex-col">
      <header className="mb-6 flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border-t-4 border-[#EB6410]">
        <div className="flex items-center gap-4 mb-4 md:mb-0"><img src={logoSys3} className="h-10 object-contain" /><div className="hidden md:block h-6 w-px bg-gray-200"></div><span className="text-sm font-bold text-gray-600 hidden md:block">Gestão Inteligente</span></div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button onClick={() => setCurrentTab('hoje')} className={`px-4 py-2 rounded-md text-sm font-bold transition ${currentTab === 'hoje' ? 'bg-white text-[#EB6410] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Hoje (Kanban)</button>
          <button onClick={() => setCurrentTab('calendario')} className={`px-4 py-2 rounded-md text-sm font-bold transition ${currentTab === 'calendario' ? 'bg-white text-[#EB6410] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Calendário</button>
          <button onClick={() => setCurrentTab('tecnicos')} className={`px-4 py-2 rounded-md text-sm font-bold transition ${currentTab === 'tecnicos' ? 'bg-white text-[#EB6410] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Performance</button>
          <button onClick={() => setCurrentTab('config')} className={`px-4 py-2 rounded-md text-sm font-bold transition flex items-center gap-1 ${currentTab === 'config' ? 'bg-white text-[#EB6410] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Settings size={14}/> Config</button>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0"><button onClick={() => setIsModalOpen(true)} className="bg-[#EB6410] text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold hover:opacity-90"><ClipboardList size={18} /> Nova OS</button><button onClick={handleLogout} className="bg-gray-200 text-gray-600 px-3 py-2 rounded-lg"><LogOut size={18} /></button></div>
      </header>

      {/* KANBAN */}
      {currentTab === 'hoje' && (
        <div className="flex-1 overflow-x-auto pb-4">
           <div className="flex flex-col md:flex-row justify-between items-center mb-4 px-1 gap-4">
             <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm"><Clock className="text-[#EB6410]" size={20}/><span className="font-bold text-gray-700">Atividades do Dia: {new Date().toLocaleDateString('pt-BR')}</span></div>
             <div className="flex gap-2 bg-white p-1 rounded-lg shadow-sm">{['Todos', 'Pendente', 'Em Andamento', 'Concluído'].map(st => <button key={st} onClick={() => setFilter(st)} className={`px-3 py-1 rounded text-xs font-bold transition ${filter === st ? 'bg-[#DFDAC6] text-[#EB6410]' : 'text-gray-500 hover:bg-gray-50'}`}>{st}</button>)}</div>
           </div>
           <div className="flex gap-4 min-w-full items-start">
              <div onDragOver={(e) => handleDragOverTech(e, '')} onDrop={(e) => handleDropTech(e, '')} className={`min-w-[300px] w-[300px] bg-gray-100 rounded-xl p-3 border-2 transition-colors ${dragOverTech === '' ? 'border-[#EB6410] bg-orange-50' : 'border-transparent'}`}>
                <div className="flex justify-between items-center mb-3 px-1"><h3 className="font-bold text-gray-600 flex items-center gap-2"><User size={16}/> A Definir</h3><span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{getTodayOS().filter(os => !os.tecnico).length}</span></div>
                <div className="space-y-2">{getTodayOS().filter(os => !os.tecnico).map(os => <OSCard key={os.uid} os={os} />)}</div>
              </div>
              {listaTecnicos.map(tec => (
                <div key={tec} onDragOver={(e) => handleDragOverTech(e, tec)} onDrop={(e) => handleDropTech(e, tec)} className={`min-w-[300px] w-[300px] bg-gray-100 rounded-xl p-3 border-2 transition-colors ${dragOverTech === tec ? 'border-[#EB6410] bg-orange-50' : 'border-transparent'}`}>
                  <div className="flex justify-between items-center mb-3 px-1"><h3 className="font-bold text-[#EB6410] flex items-center gap-2 uppercase truncate"><User size={16}/> {tec}</h3><span className="bg-orange-200 text-orange-800 text-xs font-bold px-2 py-0.5 rounded-full">{getTodayOS().filter(os => os.tecnico === tec).length}</span></div>
                  <div className="space-y-2">{getTodayOS().filter(os => os.tecnico === tec).map(os => <OSCard key={os.uid} os={os} />)}</div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* CALENDÁRIO */}
      {currentTab === 'calendario' && (<div className="bg-white p-6 rounded-xl shadow-sm"><div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold flex items-center gap-2 text-[#EB6410]"><CalIcon /> Visão Macro</h2><div className="flex items-center gap-4 bg-gray-100 rounded-lg p-1"><button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white rounded shadow-sm"><ChevronLeft size={20}/></button><span className="font-bold w-32 text-center capitalize">{currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span><button onClick={() => changeMonth(1)} className="p-2 hover:bg-white rounded shadow-sm"><ChevronRight size={20}/></button></div></div><div className="grid grid-cols-7 gap-2 mb-2">{['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => <div key={d} className="text-center text-sm font-bold text-gray-400 py-2">{d}</div>)}</div><div className="grid grid-cols-7 gap-2">{Array.from({ length: getFirstDayOfMonth(currentMonth) }).map((_, i) => <div key={`empty-${i}`} className="h-24 bg-gray-50/50 rounded-lg"></div>)}{Array.from({ length: getDaysInMonth(currentMonth) }).map((_, i) => { const day = i + 1; const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`; const osDoDia = osList.filter(os => os.data === dateStr); const isDragOver = dragOverDate === dateStr; return (<div key={day} onDragOver={(e) => handleDragOverDate(e, dateStr)} onDrop={(e) => handleDropDate(e, dateStr)} onClick={() => setSelectedDay(dateStr)} className={`h-28 border rounded-lg p-2 flex flex-col transition duration-200 cursor-pointer ${isDragOver ? 'bg-orange-100 border-[#EB6410] scale-105 shadow-lg z-10' : 'hover:border-[#EB6410] hover:shadow-md'} ${osDoDia.length > 0 ? 'bg-white' : 'bg-gray-50 text-gray-300'}`}><span className="font-bold text-sm mb-1">{day}</span><div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">{osDoDia.map(os => (<div key={os.uid} draggable onDragStart={(e) => handleDragStart(e, os)} onClick={(e) => e.stopPropagation()} className={`text-[10px] px-1 py-1 rounded border truncate cursor-grab active:cursor-grabbing shadow-sm flex items-center gap-1 ${os.status === 'Concluído' ? 'bg-green-100 border-green-200 text-green-800' : 'bg-white border-orange-100 text-gray-700 hover:bg-orange-50'}`}><GripHorizontal size={10} className="text-gray-300"/><span className="font-bold text-[#EB6410]">{os.horario === 'Manhã' ? 'M' : 'T'}</span><span>{os.cliente.split(' ')[0]}</span></div>))}</div></div>)})}</div></div>)}
      
      {/* PERFORMANCE */}
      {currentTab === 'tecnicos' && (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{getTechStats().map(([nome, dados]) => { const avgMinutes = dados.tmaCount > 0 ? Math.floor(dados.tmaMin / dados.tmaCount) : 0; return (<div key={nome} className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-[#EB6410] hover:shadow-md transition"><div className="flex justify-between items-start mb-4"><div className="bg-gray-100 p-3 rounded-full"><User className="text-[#EB6410]" size={24}/></div><div className="text-right"><p className="text-xs text-gray-500 font-bold uppercase">Total OS</p><p className="text-2xl font-bold text-[#EB6410]">{dados.total}</p></div></div><h3 className="text-lg font-bold mb-4">{nome}</h3><div className="space-y-3"><div className="flex justify-between items-center text-sm"><span className="flex items-center gap-2 text-gray-600"><CheckCircle size={16} className="text-green-500"/> Finalizadas</span><span className="font-bold">{dados.concluidas}</span></div><div className="bg-orange-50 p-3 rounded-lg border border-orange-100 mt-2"><p className="text-xs font-bold text-[#EB6410] uppercase mb-1">Tempo Médio (TMA)</p><p className="text-xl font-extrabold text-gray-800 flex items-center gap-2"><Timer size={20} className="text-gray-400"/> {Math.floor(avgMinutes/60)}h {avgMinutes%60}m</p></div></div></div>) })}</div>)}
      
      {/* CONFIG */}
      {currentTab === 'config' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-[#EB6410]"><h2 className="text-xl font-bold mb-4 flex items-center gap-2"><User className="text-[#EB6410]" /> Equipe Técnica</h2><form onSubmit={handleAddTecnico} className="flex gap-2 mb-6"><input type="text" placeholder="Nome" className="flex-1 border-2 rounded-lg px-4 py-2" value={novoTecnico} onChange={e => setNovoTecnico(e.target.value)} /><button type="submit" className="bg-[#EB6410] text-white px-4 rounded-lg"><Plus/></button></form><div className="space-y-2">{listaTecnicos.map((tec, idx) => (<div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border hover:border-[#EB6410]"><span className="font-medium">{tec}</span><button onClick={() => handleRemoveTecnico(tec)} className="text-gray-400 hover:text-red-500"><Trash2 size={18}/></button></div>))}</div></div>
          
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-purple-500">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Activity className="text-purple-500" /> Regras de Capacidade (Por Turno)</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">Max. Instalações</label>
                  <input type="number" min="0" className="w-full border-2 rounded-lg px-3 py-2" value={limites.instalacao} onChange={e => handleUpdateLimites('instalacao', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">Max. Chamados</label>
                  <input type="number" min="0" className="w-full border-2 rounded-lg px-3 py-2" value={limites.chamado} onChange={e => handleUpdateLimites('chamado', e.target.value)} />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">* Esses limites bloqueiam o agendamento se excedidos por técnico/turno.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-blue-500">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><ClipboardList className="text-blue-500" /> Tipos de Serviço</h2>
              <form onSubmit={handleAddTipo} className="flex flex-col gap-2 mb-6">
                <input type="text" placeholder="Nome (Ex: Instalação Fibra)" className="w-full border-2 rounded-lg px-3 py-2 text-sm" value={novoTipoNome} onChange={e => setNovoTipoNome(e.target.value)} />
                <div className="flex gap-2">
                  <input type="time" title="Duração Padrão" className="w-24 border-2 rounded-lg px-2 py-2 text-sm" value={novoTipoDuracao} onChange={e => setNovoTipoDuracao(e.target.value)} />
                  <select className="flex-1 border-2 rounded-lg px-2 py-2 text-sm bg-white" value={novoTipoCategoria} onChange={e => setNovoTipoCategoria(e.target.value)}>
                    <option value="instalacao">Instalação/Transferência</option>
                    <option value="chamado">Manutenção/Chamado</option>
                  </select>
                  <button type="submit" className="bg-blue-500 text-white px-4 rounded-lg"><Plus/></button>
                </div>
              </form>
              <div className="space-y-2">
                {listaTipos.map((t, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border hover:border-blue-500">
                    <div className="flex flex-col">
                      <span className="font-medium">{t.nome}</span>
                      <div className="flex gap-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Timer size={10}/> {t.duracao}h</span>
                        <span className="flex items-center gap-1"><Briefcase size={10}/> {t.categoria === 'instalacao' ? 'Instalação' : 'Chamado'}</span>
                      </div>
                    </div>
                    <button onClick={() => handleRemoveTipo(t.nome)} className="text-gray-400 hover:text-red-500"><Trash2 size={18}/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOVA OS */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border-t-8 border-[#EB6410]"><div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50"><h3 className="font-bold text-xl text-[#000000]">Nova OS</h3><button onClick={() => setIsModalOpen(false)}><X size={24} className="text-gray-400 hover:text-[#EB6410]"/></button></div>
        <form onSubmit={handleSaveOS} className="p-6 space-y-4">
          <div><label className="block text-sm font-bold mb-1">Data</label><input type="date" required className="w-full border-2 rounded-lg px-4 py-2" value={formData.data} onChange={e => { setFormData({...formData, data: e.target.value}); checkExpediente(formData.hora_fim, e.target.value); }} /></div>
          <div><label className="block text-sm font-bold mb-1">Cliente</label><input required className="w-full border-2 rounded-lg px-4 py-2" value={formData.cliente} onChange={e => setFormData({...formData, cliente: e.target.value})} /></div>
          <div><label className="block text-sm font-bold mb-1">Endereço</label><input required className="w-full border-2 rounded-lg px-4 py-2" value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1">Tipo</label>
              <select className="w-full border-2 rounded-lg px-4 py-2 bg-white" required value={formData.tipo} 
                onChange={e => {
                  const t = listaTipos.find(tip => tip.nome === e.target.value);
                  const novoFim = addTimes(formData.hora_inicio, t?.duracao);
                  setFormData({...formData, tipo: e.target.value, hora_fim: novoFim});
                  if(novoFim) checkExpediente(novoFim, formData.data);
                }}>
                <option value="" disabled>Selecione...</option>
                {listaTipos.map(t => <option key={t.nome} value={t.nome}>{t.nome}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-bold mb-1">Turno</label><select className="w-full border-2 rounded-lg px-4 py-2 bg-white" value={formData.horario} onChange={e => setFormData({...formData, horario: e.target.value})}><option>Manhã</option><option>Tarde</option></select></div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 grid grid-cols-2 gap-4">
             <div><label className="block text-xs font-bold text-[#EB6410] mb-1">INÍCIO PREVISTO</label><input type="time" className="w-full bg-white border border-orange-200 rounded px-2 py-1 text-sm font-bold" value={formData.hora_inicio} 
               onChange={e => {
                 const t = listaTipos.find(tip => tip.nome === formData.tipo);
                 const novoFim = addTimes(e.target.value, t?.duracao);
                 setFormData({...formData, hora_inicio: e.target.value, hora_fim: novoFim});
                 if(novoFim) checkExpediente(novoFim, formData.data);
               }} /></div>
             <div><label className="block text-xs font-bold text-[#EB6410] mb-1">FIM (AUTO)</label><input type="time" disabled className="w-full bg-gray-100 border border-gray-200 rounded px-2 py-1 text-sm font-bold text-gray-500" value={formData.hora_fim} /></div>
          </div>
          <div><label className="block text-sm font-bold mb-1">Técnico</label><select className="w-full border-2 rounded-lg px-4 py-2 bg-white" value={formData.tecnico} onChange={e => setFormData({...formData, tecnico: e.target.value})}><option value="">A definir</option>{listaTecnicos.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
          <button type="submit" className="w-full bg-[#EB6410] text-white font-bold py-3 rounded-lg mt-2">Salvar Agendamento</button>
        </form></div></div>
      )}

      {/* MODAL DETALHES DO DIA */}
      {selectedDay && (<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden border-t-8 border-[#EB6410]"><div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50"><h3 className="font-bold text-xl text-[#000000] flex items-center gap-2"><CalendarDays className="text-[#EB6410]" /> Atividades: {new Date(selectedDay).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</h3><button onClick={() => setSelectedDay(null)}><X size={24} className="text-gray-400 hover:text-[#EB6410]"/></button></div><div className="p-6 bg-gray-50 flex-1 overflow-y-auto">{getDayOS(selectedDay).length === 0 ? (<div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2"><CalendarDays size={48} className="opacity-20"/><p>Nenhuma atividade para este dia.</p><button onClick={() => { setIsModalOpen(true); setFormData({...formData, data: selectedDay}); setSelectedDay(null); }} className="text-[#EB6410] font-bold hover:underline">Criar Nova OS para esta data</button></div>) : (getDayOS(selectedDay).map(os => <OSCard key={os.uid} os={os} />))}</div></div></div>)}
    </div>
  );
}

export default App;