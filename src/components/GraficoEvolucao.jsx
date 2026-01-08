import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase'; // Verifique se o caminho do firebase está certo no seu projeto
import { format, parseISO, isSameMonth, getDate } from 'date-fns';

const GraficoEvolucao = () => {
  const [dadosGrafico, setDadosGrafico] = useState([]);
  const [totais, setTotais] = useState({ instalacoes: 0, cancelamentos: 0 });

  useEffect(() => {
    const buscarDados = async () => {
      const hoje = new Date();

      try {
        const querySnapshot = await getDocs(collection(db, "os"));
        const listaOS = querySnapshot.docs.map(doc => doc.data());

        const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
        const dadosAgrupados = Array.from({ length: diasNoMes }, (_, i) => ({
          dia: i + 1,
          instalacoes: 0,
          cancelamentos: 0
        }));

        let totalInst = 0;
        let totalCanc = 0;

        listaOS.forEach(os => {
            if (!os.data) return;
            const dataOS = parseISO(os.data); 

            if (isSameMonth(dataOS, hoje)) {
                const dia = getDate(dataOS);
                const index = dia - 1;

                const tipo = os.tipo ? os.tipo.toLowerCase() : "";
                const status = os.status;

                // Regra: Instalação Encerrada
                if (tipo.includes('instala') && status === 'Encerrada') {
                    dadosAgrupados[index].instalacoes += 1;
                    totalInst += 1;
                }
                
                // Regra: Cancelamento/Retirada Encerrada
                if ((tipo.includes('retirada') || tipo.includes('cancel')) && status === 'Encerrada') {
                    dadosAgrupados[index].cancelamentos += 1;
                    totalCanc += 1;
                }
            }
        });

        setDadosGrafico(dadosAgrupados);
        setTotais({ instalacoes: totalInst, cancelamentos: totalCanc });

      } catch (error) {
        console.error("Erro ao buscar dados do gráfico:", error);
      }
    };

    buscarDados();
  }, []);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-6">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h3 className="text-lg font-bold text-gray-800">Evolução Diária (Automático)</h3>
            <p className="text-sm text-gray-500">Dados reais do Robô</p>
        </div>
        <div className="flex gap-4">
            <div className="text-right">
                <p className="text-xs text-gray-400">Instalações</p>
                <p className="text-xl font-bold text-emerald-500">{totais.instalacoes}</p>
            </div>
        </div>
      </div>

      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={dadosGrafico} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
                dataKey="dia" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
            />
            <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#9ca3af', fontSize: 12 }} 
            />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Legend />
            <Line name="Instalações" type="monotone" dataKey="instalacoes" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
            <Line name="Cancelamentos" type="monotone" dataKey="cancelamentos" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, fill: '#f43f5e', strokeWidth: 2, stroke: '#fff' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default GraficoEvolucao;