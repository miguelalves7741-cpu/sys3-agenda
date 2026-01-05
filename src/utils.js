// Funções auxiliares puras (Cálculos e Formatação)

export const calcDuration = (start, end) => {
  if (!start || !end) return null;
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (diff < 0) diff += 24 * 60;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const timeToMinutes = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export const formatDataBr = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
};

export const getStatusColor = (s) => {
  if (s === 'Pendente') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  if (s === 'Em Andamento') return 'bg-blue-100 text-blue-800 border-blue-200';
  return 'bg-green-100 text-green-800 border-green-200';
};

export const isOvertime = (timeStr) => {
  if (!timeStr) return false;
  const [h, m] = timeStr.split(':').map(Number);
  return h > 18 || (h === 18 && m > 0);
};

export const addTimes = (startTime, duration) => {
  if (!startTime || !duration) return '';
  const [h1, m1] = startTime.split(':').map(Number);
  const [h2, m2] = duration.split(':').map(Number);
  let totalM = m1 + m2;
  let totalH = h1 + h2 + Math.floor(totalM / 60);
  totalM = totalM % 60;
  return `${String(totalH % 24).padStart(2, '0')}:${String(totalM).padStart(2, '0')}`;
};