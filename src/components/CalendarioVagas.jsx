import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Sun, Moon, Wrench, Activity, Ban, Settings, Save, X, RotateCcw } from 'lucide-react'; 
import { collection, onSnapshot, query, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const CalendarioVagas = ({ onDayClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [agendamentos, setAgendamentos] = useState([]);
  const [folgas, setFolgas] = useState([]); 
  const [excecoes, setExcecoes] = useState({}); 
  const [loadingConfig, setLoadingConfig] = useState(true);

  const [editingDate, setEditingDate] = useState(null);
  const [editValues, setEditValues] = useState(null);

  const [configVagas, setConfigVagas] = useState({
    manha: { instalacao: 2, reparo: 2 },
    tarde: { instalacao: 2, reparo: 2 }
  });

  useEffect(() => {
    try {
        const qOS = query(collection(db, "os"));
        const unsubOS = onSnapshot(qOS, (snapshot) => {
          const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setAgendamentos(lista);
        });

        const docConfig = doc(db, "configuracoes", "geral");
        const unsubConfig = onSnapshot(docConfig, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setFolgas(data.folgas || []);
                
                // Proteção contra dados vazios
                if (data.vagas_padrao && data.vagas_padrao.manha) {
                    setConfigVagas(data.vagas_padrao);
                }
                if (data.excecoes_vagas) {
                    setExcecoes(data.excecoes_vagas);
                }
            }
            setLoadingConfig(false);
        });
        return () => { unsubOS(); unsubConfig(); };
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
        setLoadingConfig(false);
    }
  }, []);

  // Funções de Ação
  const atualizarMetaPadrao = async (novoConfig) => {
      setConfigVagas(novoConfig);
      try { await updateDoc(doc(db, "configuracoes", "geral"), { vagas_padrao: novoConfig }); } catch (e) {}
  };

  const salvarExcecaoDia = async () => {
      if (!editingDate || !editValues) return;
      const novasExcecoes = { ...excecoes, [editingDate]: editValues };
      setExcecoes(novasExcecoes); setEditingDate(null);
      try { await updateDoc(doc(db, "configuracoes", "geral"), { excecoes_vagas: novasExcecoes }); } catch (e) { alert("Erro ao salvar"); }
  };

  const resetarDia = async () => {
      if (!editingDate) return;
      const novasExcecoes = { ...excecoes };
      delete novasExcecoes[editingDate];
      setExcecoes(novasExcecoes); setEditingDate(null);
      try { await updateDoc(doc(db, "configuracoes", "geral"), { excecoes_vagas: novasExcecoes }); } catch (e) {}
  };

  const abrirEdicaoDia = (e, dataStr, valoresCalculados) => {
      e.stopPropagation(); 
      setEditingDate(dataStr);
      if (excecoes && excecoes[dataStr]) setEditValues(excecoes[dataStr]);
      else setEditValues({
          manha: { instalacao: valoresCalculados.mInstCap, reparo: valoresCalculados.mRepCap },
          tarde: { instalacao: valoresCalculados.tInstCap, reparo: valoresCalculados.tRepCap }
      });
  };

  // Navegação
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const diasDaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const hoje = startOfDay(new Date());

  // Lógica de Negócio
  const classificarTipo = (tipoString) => {
    if (!tipoString) return 'reparo';
    const t = tipoString.toLowerCase();
    if (t.includes('retirada') || t.includes('cancel') || t.includes('inviabil') || t.includes('reducao') || t.includes('desistencia')) return 'ignorar'; 
    if (t.includes('instala') || t.includes('transf') || t.includes('mudan')) return 'instalacao';
    return 'reparo';
  };

  const getContagem = (dia, turno, categoria) => {
    const dataStr = format(dia, 'yyyy-MM-dd');
    return agendamentos.filter(os => {
        const mesmoDia = os.data === dataStr;
        const naoEncerrada = os.status !== 'Encerrada';
        const mesmoTurno = os.horario === turno;
        const tipo = classificarTipo(os.tipo);
        return mesmoDia && naoEncerrada && mesmoTurno && tipo === categoria;
    }).length;
  };

  const getFolgasDia = (dia) => {
    const dataStr = format(dia, 'yyyy-MM-dd');
    return folgas.filter(f => f.data === dataStr);
  };

  const getCapacidadeDoDia = (dia) => {
      const dataStr = format(dia, 'yyyy-MM-dd');
      
      // Se tem regra manual
      if (excecoes && excecoes[dataStr]) {
          return {
              mInstCap: excecoes[dataStr]?.manha?.instalacao || 0,
              mRepCap: excecoes[dataStr]?.manha?.reparo || 0,
              tInstCap: excecoes[dataStr]?.tarde?.instalacao || 0,
              tRepCap: excecoes[dataStr]?.tarde?.reparo || 0,
              isManual: true
          };
      }

      // Cálculo Automático
      const folgasDoDia = getFolgasDia(dia).length;
      const isSaturday = dia.getDay() === 6;

      let mInst = configVagas?.manha?.instalacao || 0;
      let mRep = configVagas?.manha?.reparo || 0;
      let tInst = configVagas?.tarde?.instalacao || 0;
      let tRep = configVagas?.tarde?.reparo || 0;

      if (folgasDoDia > 0) {
          mInst = Math.max(0, mInst - folgasDoDia);
          tInst = Math.max(0, tInst - folgasDoDia);
      }
      if (isSaturday) {
          mInst = Math.max(0, mInst - 1);
          tInst = Math.max(0, tInst - 1);
      }

      return { mInstCap: mInst, mRepCap: mRep, tInstCap: tInst, tRepCap: tRep, isManual: false };
  };

  const MiniBarra = ({ atual, max, corBg, corBarra }) => {
    const maximo = max > 0 ? max : 1; 
    const pct = Math.min((atual / maximo) * 100, 100);
    const estourou = atual > max;
    if (!max || max === 0) return <div className="h-1.5 w-full rounded-full bg-gray-200 mt-0.5"></div>;
    return (
        <div className={`h-1.5 w-full rounded-full ${corBg} mt-0.5 overflow-hidden`}>
            <div className={`h-full rounded-full ${estourou ? 'bg-red-500' : corBarra}`} style={{ width: `${pct}%` }}></div>
        </div>
    );
  };

  if (loadingConfig) return <div className="p-10 text-center text-gray-400">Carregando agenda...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
      
      {/* MODAL EDIÇÃO */}
      {editingDate && editValues && (
          <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex items-center justify-center rounded-xl animate-fade-in p-4">
              <div className="bg-white shadow-2xl border-2 border-[#EB6410] rounded-xl w-full max-w-sm overflow-hidden">
                  <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                      <h3 className="font-bold text-lg text-gray-700 flex items-center gap-2">
                          <Settings size={20} className="text-[#EB6410]"/> Regra do Dia
                      </h3>
                      <button onClick={() => setEditingDate(null)} className="text-gray-400 hover:text-red-500"><X size={24}/></button>
                  </div>
                  <div className="p-6 space-y-6">
                      <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                          <h4 className="text-xs font-bold text-yellow-700 uppercase mb-2 flex items-center gap-1"><Sun size={14}/> Manhã</h4>
                          <div className="grid grid-cols-2 gap-4">
                              <div><label className="text-[10px] font-bold text-gray-500">Instalação</label><input type="number" min="0" className="w-full border rounded p-1 text-center font-bold" value={editValues.manha.instalacao} onChange={(e) => setEditValues({...editValues, manha: {...editValues.manha, instalacao: Number(e.target.value)}})}/></div>
                              <div><label className="text-[10px] font-bold text-gray-500">Reparo</label><input type="number" min="0" className="w-full border rounded p-1 text-center font-bold" value={editValues.manha.reparo} onChange={(e) => setEditValues({...editValues, manha: {...editValues.manha, reparo: Number(e.target.value)}})}/></div>
                          </div>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <h4 className="text-xs font-bold text-blue-700 uppercase mb-2 flex items-center gap-1"><Moon size={14}/> Tarde</h4>
                          <div className="grid grid-cols-2 gap-4">
                              <div><label className="text-[10px] font-bold text-gray-500">Instalação</label><input type="number" min="0" className="w-full border rounded p-1 text-center font-bold" value={editValues.tarde.instalacao} onChange={(e) => setEditValues({...editValues, tarde: {...editValues.tarde, instalacao: Number(e.target.value)}})}/></div>
                              <div><label className="text-[10px] font-bold text-gray-500">Reparo</label><input type="number" min="0" className="w-full border rounded p-1 text-center font-bold" value={editValues.tarde.reparo} onChange={(e) => setEditValues({...editValues, tarde: {...editValues.tarde, reparo: Number(e.target.value)}})}/></div>
                          </div>
                      </div>
                  </div>
                  <div className="p-4 bg-gray-50 border-t flex justify-between">
                      <button onClick={resetarDia} className="text-xs font-bold text-gray-500 hover:text-red-500 flex items-center gap-1 px-3 py-2 rounded hover:bg-gray-200 transition"><RotateCcw size={14}/> Voltar ao Padrão</button>
                      <button onClick={salvarExcecaoDia} className="bg-[#EB6410] text-white text-xs font-bold px-4 py-2 rounded shadow-sm hover:bg-orange-600 flex items-center gap-2 transition"><Save size={14}/> Salvar Regra</button>
                  </div>
              </div>
          </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-center mb-6 gap-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-800 capitalize">{format(currentDate, 'MMMM yyyy', { locale: ptBR })}</h2>
          <div className="flex gap-1">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full transition"><ChevronLeft size={20}/></button>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full transition"><ChevronRight size={20}/></button>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 items-center justify-center bg-gray-50 p-3 rounded-xl border border-gray-200">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">Meta Padrão:</span>
            <div className="flex items-center gap-2 pr-4 border-r border-gray-300">
                <Sun size={16} className="text-yellow-600"/>
                <div className="flex flex-col">
                    <div className="flex items-center gap-1"><Wrench size={10} className="text-gray-500"/><input type="number" min="0" value={configVagas?.manha?.instalacao || 0} onChange={(e) => atualizarMetaPadrao({...configVagas, manha: {...configVagas.manha, instalacao: Number(e.target.value)}})} className="w-10 text-center text-xs font-bold border rounded focus:outline-yellow-500"/></div>
                    <div className="flex items-center gap-1 mt-1"><Activity size={10} className="text-gray-500"/><input type="number" min="0" value={configVagas?.manha?.reparo || 0} onChange={(e) => atualizarMetaPadrao({...configVagas, manha: {...configVagas.manha, reparo: Number(e.target.value)}})} className="w-10 text-center text-xs font-bold border rounded focus:outline-yellow-500"/></div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Moon size={16} className="text-blue-600"/>
                <div className="flex flex-col">
                    <div className="flex items-center gap-1"><Wrench size={10} className="text-gray-500"/><input type="number" min="0" value={configVagas?.tarde?.instalacao || 0} onChange={(e) => atualizarMetaPadrao({...configVagas, tarde: {...configVagas.tarde, instalacao: Number(e.target.value)}})} className="w-10 text-center text-xs font-bold border rounded focus:outline-blue-500"/></div>
                    <div className="flex items-center gap-1 mt-1"><Activity size={10} className="text-gray-500"/><input type="number" min="0" value={configVagas?.tarde?.reparo || 0} onChange={(e) => atualizarMetaPadrao({...configVagas, tarde: {...configVagas.tarde, reparo: Number(e.target.value)}})} className="w-10 text-center text-xs font-bold border rounded focus:outline-blue-500"/></div>
                </div>
            </div>
        </div>
      </div>

      {/* GRID */}
      <div className="flex justify-end gap-3 text-[10px] text-gray-500 mb-2">
         <span className="flex items-center gap-1"><Wrench size={10}/> Instalação</span>
         <span className="flex items-center gap-1"><Activity size={10}/> Reparo</span>
         <span className="flex items-center gap-1 ml-2"><Settings size={10} className="text-[#EB6410]"/> Regra Manual</span>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
        {diasDaSemana.map(dia => (<div key={dia} className={`p-2 text-center text-xs font-bold uppercase ${dia === 'Dom' ? 'bg-red-50 text-red-400' : 'bg-gray-50 text-gray-500'}`}>{dia}</div>))}
        {days.map((day) => {
          const dataStr = format(day, 'yyyy-MM-dd');
          const isPastDate = isBefore(day, hoje);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isSunday = day.getDay() === 0;
          const folgasDoDia = getFolgasDia(day);
          
          const cap = getCapacidadeDoDia(day);
          const mInst = getContagem(day, 'Manhã', 'instalacao');
          const mRep = getContagem(day, 'Manhã', 'reparo');
          const tInst = getContagem(day, 'Tarde', 'instalacao');
          const tRep = getContagem(day, 'Tarde', 'reparo');

          if (isSunday) {
            return (<div key={day.toString()} className="min-h-[130px] bg-gray-100 flex flex-col items-center justify-center opacity-70"><span className="text-sm font-bold text-gray-400">{format(day, 'd')}</span><Ban size={20} className="text-gray-300 mt-2"/><span className="text-[10px] text-gray-400 font-bold mt-1">DOMINGO</span></div>);
          }

          return (
            <div key={day.toString()} onClick={() => onDayClick && onDayClick(dataStr)} className={`min-h-[130px] bg-white p-1 flex flex-col gap-1 transition-colors cursor-pointer group hover:bg-gray-50 ${isToday(day) ? "ring-2 ring-indigo-500 ring-inset z-10" : ""} ${!isCurrentMonth ? 'opacity-40 bg-gray-50' : ''} relative`}>
              {isCurrentMonth && !isPastDate && (
                  <button onClick={(e) => abrirEdicaoDia(e, dataStr, cap)} className={`absolute top-1 right-1 p-1 rounded-full z-20 transition-all ${cap.isManual ? 'text-[#EB6410] opacity-100 bg-orange-50' : 'text-gray-300 opacity-0 group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-600'}`}><Settings size={12} fill={cap.isManual ? "currentColor" : "none"} /></button>
              )}
              <div className="flex justify-between items-start pl-1">
                <span className={`text-sm font-bold ${isPastDate ? 'text-gray-300' : 'text-gray-700'}`}>{format(day, 'd')}</span>
                {folgasDoDia.length > 0 && !cap.isManual && (<div className="flex -space-x-1 mr-4">{folgasDoDia.map((f, i) => (<div key={i} title={`${f.tecnico} (Folga)`} className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white ring-1 ring-white ${Number(f.limite)===0 ? 'bg-red-500' : 'bg-yellow-500'}`}>{f.tecnico.charAt(0)}</div>))}</div>)}
              </div>

              {!isPastDate && isCurrentMonth ? (
                  <div className="flex flex-col gap-1 mt-1 flex-1 justify-end">
                      <div className={`border rounded p-1 ${cap.isManual ? 'bg-orange-50/30 border-orange-200' : 'bg-yellow-50 border-yellow-100'}`}>
                          <div className="flex justify-between items-center mb-0.5"><span className="text-[8px] font-bold text-yellow-700 uppercase flex items-center gap-1"><Sun size={8}/> Manhã</span></div>
                          <div className="flex justify-between items-center text-[9px] text-gray-600"><span className="flex items-center gap-0.5"><Wrench size={8}/> Inst.</span><span className={`${mInst > cap.mInstCap ? "text-red-600 font-bold" : ""} ${cap.mInstCap < (configVagas?.manha?.instalacao || 0) && !cap.isManual ? "text-orange-600" : ""}`}>{mInst}/{cap.mInstCap}</span></div>
                          <MiniBarra atual={mInst} max={cap.mInstCap} corBg="bg-yellow-200" corBarra="bg-yellow-500" />
                          <div className="flex justify-between items-center text-[9px] text-gray-600 mt-1"><span className="flex items-center gap-0.5"><Activity size={8}/> Rep.</span><span className={mRep > cap.mRepCap ? "text-red-600 font-bold" : ""}>{mRep}/{cap.mRepCap}</span></div>
                          <MiniBarra atual={mRep} max={cap.mRepCap} corBg="bg-yellow-200" corBarra="bg-emerald-500" />
                      </div>
                      <div className={`border rounded p-1 ${cap.isManual ? 'bg-orange-50/30 border-orange-200' : 'bg-blue-50 border-blue-100'}`}>
                          <div className="flex justify-between items-center mb-0.5"><span className="text-[8px] font-bold text-blue-700 uppercase flex items-center gap-1"><Moon size={8}/> Tarde</span></div>
                          <div className="flex justify-between items-center text-[9px] text-gray-600"><span className="flex items-center gap-0.5"><Wrench size={8}/> Inst.</span><span className={`${tInst > cap.tInstCap ? "text-red-600 font-bold" : ""} ${cap.tInstCap < (configVagas?.tarde?.instalacao || 0) && !cap.isManual ? "text-orange-600" : ""}`}>{tInst}/{cap.tInstCap}</span></div>
                          <MiniBarra atual={tInst} max={cap.tInstCap} corBg="bg-blue-200" corBarra="bg-blue-500" />
                          <div className="flex justify-between items-center text-[9px] text-gray-600 mt-1"><span className="flex items-center gap-0.5"><Activity size={8}/> Rep.</span><span className={tRep > cap.tRepCap ? "text-red-600 font-bold" : ""}>{tRep}/{cap.tRepCap}</span></div>
                          <MiniBarra atual={tRep} max={cap.tRepCap} corBg="bg-blue-200" corBarra="bg-emerald-500" />
                      </div>
                  </div>
              ) : (
                  <div className="flex-1 flex items-end justify-center pb-2"><span className="text-[10px] text-gray-200 font-medium">{isSunday ? "" : "Encerrado"}</span></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarioVagas;