import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Target, Calendar, BarChart3, Activity, AlertCircle, RefreshCw, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase';
import { parseISO, isSameMonth } from 'date-fns';
import GraficoEvolucao from './GraficoEvolucao';

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [osList, setOsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Busca todas as OSs para garantir que temos o histórico completo
    const q = query(collection(db, "os"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => doc.data());
      setOsList(lista);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ... Imports iguais ...
// Substitua APENAS a lógica do useMemo (stats) dentro do componente:

  const stats = useMemo(() => {
    let instalacoes = 0;
    let cancelamentos = 0;
    const mesRef = parseISO(`${selectedMonth}-01`); 

    osList.forEach(os => {
        if (!os.data) return;
        const dataOS = parseISO(os.data);
        
        // 1. Filtro de Data
        if (!isSameMonth(dataOS, mesRef)) return;

        // 2. Filtro de Status (Apenas Encerrada/Concluída conta)
        if (os.status !== 'Encerrada' && os.status !== 'Concluído') return;

        // 3. Normalização
        const tipoOriginal = os.tipo ? os.tipo.toUpperCase() : '';
        const tipo = tipoOriginal.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        // --- INSTALAÇÕES (Nomes exatos: INSTALAÇÃO, INSTALAÇÃO INDICAÇÃO) ---
        // Usamos includes('INSTALA') que pega ambos
        if (tipo.includes('INSTALA')) {
            instalacoes++;
        } 
        
        // --- CANCELAMENTOS ---
        // Lista fornecida: 
        // CANCELAMENTO INSATISFAÇÃO, CANCELAMENTO POR INADIMPLENCIA, CANCELAMENTO DE CONTRATO
        // INVIABILIDADE TECNICA, Tempo cancelado
        else if (
            tipo.includes('CANCEL') ||  // Pega todos os "Cancelamento..." e "Tempo cancelado"
            tipo.includes('INVIABIL') || // Pega "Inviabilidade Tecnica"
            tipo.includes('RETIRADA') || // Pega Retirada
            tipo.includes('REDUCAO')
        ) {
            cancelamentos++;
        }
    });

    return { instalacoes, cancelamentos };
  }, [osList, selectedMonth]);

// ... Restante do código igual ...

  const inst = stats.instalacoes;
  const canc = stats.cancelamentos;
  
  // Projeção
  const projecaoChurn = Math.ceil(canc * 0.20); 
  const cancelamentoTotalProjetado = canc + projecaoChurn;
  const saldoLiquido = inst - canc;

  const getMax = () => {
    const maxVal = Math.max(inst, canc, cancelamentoTotalProjetado);
    return maxVal === 0 ? 10 : maxVal;
  };
  const getHeight = (val) => `${(val / getMax()) * 100}%`;

  if (loading) return <div className="flex justify-center p-10 text-gray-500 animate-pulse">Carregando indicadores...</div>;

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      <div className="bg-white p-5 rounded-xl shadow-sm border-t-4 border-indigo-600 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-2 rounded-lg"><BarChart3 className="text-indigo-600" size={24} /></div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Controle Comercial</h2>
            <p className="text-xs text-gray-500 flex items-center gap-1"><RefreshCw size={10} className="animate-spin"/> Dados sincronizados do Robô</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border hover:border-indigo-300 transition">
          <Calendar size={18} className="text-gray-400" />
          <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-transparent font-bold text-gray-700 outline-none cursor-pointer"/>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 md:col-span-1 flex flex-col justify-center space-y-6">
          <div className="border-l-4 border-emerald-500 pl-4 py-1">
             <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><ArrowUpRight size={14} className="text-emerald-500"/> Instalações Ativas</p>
             <span className="text-4xl font-extrabold text-gray-800">{inst}</span>
             <p className="text-[10px] text-gray-400 mt-1">Finalizadas no mês</p>
          </div>
          <div className="w-full h-px bg-gray-100"></div>
          <div className="border-l-4 border-rose-500 pl-4 py-1">
             <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><ArrowDownRight size={14} className="text-rose-500"/> Cancelamentos</p>
             <span className="text-4xl font-extrabold text-gray-800">{canc}</span>
             <p className="text-[10px] text-gray-400 mt-1">Retiradas Finalizadas</p>
          </div>
        </div>

        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={`p-6 rounded-xl shadow-sm border flex flex-col justify-between text-white transition-colors duration-500 ${saldoLiquido >= 0 ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-rose-500 to-red-600'}`}>
            <div className="flex justify-between items-start"><span className="text-white/80 font-bold text-xs uppercase">Saldo Líquido</span><TrendingUp className="text-white" size={20} /></div>
            <div><span className="text-5xl font-extrabold tracking-tight">{saldoLiquido > 0 ? `+${saldoLiquido}` : saldoLiquido}</span></div>
            <p className="text-[10px] text-white/80 mt-1 font-medium bg-white/20 w-fit px-2 py-0.5 rounded">Crescimento Real da Base</p>
          </div>

          <div className="p-6 rounded-xl shadow-sm border bg-white flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition"><Target size={80}/></div>
            <div className="flex justify-between items-start z-10"><span className="text-gray-500 font-bold text-xs uppercase">Risco Churn (+20%)</span><Activity className="text-orange-500" size={20} /></div>
            <div className="z-10 mt-2"><div className="flex items-baseline gap-2"><span className="text-4xl font-extrabold text-gray-800">{cancelamentoTotalProjetado}</span><span className="text-xs font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">Margem: {projecaoChurn}</span></div></div>
            <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400 z-10"><AlertCircle size={10} /> Previsão pessimista automática</div>
          </div>

          <div className="sm:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="h-40 flex items-end justify-around px-4 relative">
               <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5"><div className="border-t border-black w-full"></div><div className="border-t border-black w-full"></div><div className="border-t border-black w-full"></div></div>
               <div className="flex flex-col items-center gap-2 w-1/4 group"><span className="text-xs font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity mb-[-20px]">{inst}</span><div style={{height: getHeight(inst)}} className="w-full bg-emerald-400 rounded-t-md shadow-lg shadow-emerald-100 transition-all duration-700 hover:bg-emerald-500"></div><span className="text-[10px] font-bold text-gray-400 uppercase">Instal.</span></div>
               <div className="flex flex-col items-center gap-2 w-1/4 group"><span className="text-xs font-bold text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity mb-[-20px]">{canc}</span><div style={{height: getHeight(canc)}} className="w-full bg-rose-400 rounded-t-md shadow-lg shadow-rose-100 transition-all duration-700 hover:bg-rose-500"></div><span className="text-[10px] font-bold text-gray-400 uppercase">Cancel.</span></div>
               <div className="flex flex-col items-center gap-2 w-1/4 group"><span className="text-xs font-bold text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity mb-[-20px]">{cancelamentoTotalProjetado}</span><div style={{height: getHeight(cancelamentoTotalProjetado)}} className="w-full bg-orange-300 rounded-t-md shadow-lg shadow-orange-100 opacity-80 transition-all duration-700 relative overflow-hidden"><div className="absolute inset-0 opacity-30" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, #fff 5px, #fff 10px)'}}></div></div><span className="text-[10px] font-bold text-orange-500 uppercase">Projeção</span></div>
            </div>
          </div>
          <div className="sm:col-span-2"><GraficoEvolucao /></div>
        </div> 
      </div>   
    </div>     
  );
}