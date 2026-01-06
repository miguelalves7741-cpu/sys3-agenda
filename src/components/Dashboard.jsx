import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, Calendar, BarChart3, Save, AlertCircle, Loader2, Settings } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Estado inicial seguro
  const [inputs, setInputs] = useState({
    instalacoes: 0,
    cancelamentos: 0
  });

  // Carregar dados
  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "comercial_stats", selectedMonth);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Proteção: Converte para Number ou usa 0 se não existir
          setInputs({
            instalacoes: Number(data.instalacoes) || 0,
            cancelamentos: Number(data.cancelamentos) || 0
          });
        } else {
          setInputs({ instalacoes: 0, cancelamentos: 0 });
        }
      } catch (error) {
        console.error("Erro ao carregar stats:", error);
        setInputs({ instalacoes: 0, cancelamentos: 0 }); // Fallback
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [selectedMonth]);

  // Salvar dados
  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "comercial_stats", selectedMonth), {
        instalacoes: Number(inputs.instalacoes),
        cancelamentos: Number(inputs.cancelamentos)
      });
      alert("Dados atualizados!");
    } catch (error) {
      console.error("Erro salvando:", error);
      alert("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  // --- CÁLCULOS SEGUROS ---
  const inst = Number(inputs.instalacoes) || 0;
  const canc = Number(inputs.cancelamentos) || 0;

  // Perspectiva: 20% sobre a taxa de cancelamento
  const projecaoChurn = Math.ceil(canc * 0.20); 
  const cancelamentoTotalProjetado = canc + projecaoChurn;
  
  const saldoLiquido = inst - canc;

  // Helpers Grafico (Evita divisão por zero)
  const getMax = () => {
    const maxVal = Math.max(inst, canc, cancelamentoTotalProjetado);
    return maxVal === 0 ? 10 : maxVal;
  };
  const getHeight = (val) => `${(val / getMax()) * 100}%`;

  if (loading) return <div className="flex justify-center p-10 text-gray-500">Carregando dados...</div>;

  return (
    <div className="space-y-6 pb-10">
      
      {/* --- CABEÇALHO --- */}
      <div className="bg-white p-5 rounded-xl shadow-sm border-t-4 border-indigo-600 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <BarChart3 className="text-indigo-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Controle Comercial</h2>
            <p className="text-xs text-gray-500">Indicadores mensais manuais</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border">
          <Calendar size={18} className="text-gray-400" />
          <input 
            type="month" 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent font-bold text-gray-700 outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Painel de Entrada */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 md:col-span-1">
          <h3 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider flex items-center gap-2">
            <Settings size={14}/> Entrada de Dados
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Total Instalações</label>
              <input 
                type="number" 
                min="0"
                className="w-full border-2 border-green-100 rounded-lg px-3 py-2 focus:border-green-500 outline-none font-bold text-green-700 text-lg"
                value={inputs.instalacoes}
                onChange={(e) => setInputs({...inputs, instalacoes: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Total Cancelamentos</label>
              <input 
                type="number" 
                min="0"
                className="w-full border-2 border-red-100 rounded-lg px-3 py-2 focus:border-red-500 outline-none font-bold text-red-700 text-lg"
                value={inputs.cancelamentos}
                onChange={(e) => setInputs({...inputs, cancelamentos: e.target.value})}
              />
            </div>

            <button 
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition mt-2"
            >
              {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
              {saving ? "Salvando..." : "Atualizar Gráficos"}
            </button>
          </div>
        </div>

        {/* --- INDICADORES VISUAIS --- */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Saldo Líquido */}
          <div className={`p-6 rounded-xl shadow-sm border flex flex-col justify-between text-white ${saldoLiquido >= 0 ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-rose-600'}`}>
            <div className="flex justify-between items-start">
              <span className="text-white/80 font-bold text-xs uppercase">Saldo Líquido</span>
              <TrendingUp className="text-white" size={20} />
            </div>
            <span className="text-4xl font-extrabold mt-2">{saldoLiquido > 0 ? `+${saldoLiquido}` : saldoLiquido}</span>
            <p className="text-[10px] text-white/80 mt-1">Crescimento da base (Inst. - Cancel.)</p>
          </div>

          {/* Perspectiva */}
          <div className="p-6 rounded-xl shadow-sm border bg-white flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-start z-10">
              <span className="text-gray-500 font-bold text-xs uppercase">Projeção Churn (+20%)</span>
              <Target className="text-orange-500" size={20} />
            </div>
            <div className="z-10 mt-2">
               <span className="text-4xl font-extrabold text-gray-800">{cancelamentoTotalProjetado}</span>
               <span className="text-sm font-bold text-orange-500 ml-2">(Margem: {projecaoChurn})</span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400 z-10">
              <AlertCircle size={10} /> Previsão pessimista
            </div>
          </div>

          {/* Gráfico Barras CSS */}
          <div className="sm:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="h-48 flex items-end justify-around px-4 relative">
               {/* Grid */}
               <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5">
                 <div className="border-t border-black w-full"></div><div className="border-t border-black w-full"></div><div className="border-t border-black w-full"></div>
               </div>

               {/* Barra Verde */}
               <div className="flex flex-col items-center gap-2 w-1/4">
                 <span className="text-xs font-bold text-green-600">{inst}</span>
                 <div style={{height: getHeight(inst)}} className="w-full bg-green-400 rounded-t-md shadow-lg shadow-green-100 transition-all duration-500"></div>
                 <span className="text-[10px] font-bold text-gray-400 uppercase">Instal.</span>
               </div>

               {/* Barra Vermelha */}
               <div className="flex flex-col items-center gap-2 w-1/4">
                 <span className="text-xs font-bold text-red-600">{canc}</span>
                 <div style={{height: getHeight(canc)}} className="w-full bg-red-400 rounded-t-md shadow-lg shadow-red-100 transition-all duration-500"></div>
                 <span className="text-[10px] font-bold text-gray-400 uppercase">Cancel.</span>
               </div>

               {/* Barra Laranja (Projeção) */}
               <div className="flex flex-col items-center gap-2 w-1/4">
                 <span className="text-xs font-bold text-orange-600">{cancelamentoTotalProjetado}</span>
                 <div style={{height: getHeight(cancelamentoTotalProjetado)}} className="w-full bg-orange-300 rounded-t-md shadow-lg shadow-orange-100 opacity-80 transition-all duration-500 relative overflow-hidden">
                    {/* Efeito Listrado CSS */}
                    <div className="absolute inset-0 opacity-30" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, #fff 5px, #fff 10px)'}}></div>
                 </div>
                 <span className="text-[10px] font-bold text-orange-500 uppercase">Projeção</span>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}