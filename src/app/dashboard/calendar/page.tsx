'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Baby, 
  PlusCircle, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  Edit2,
  User,
  Loader2,
  AlertCircle,
  CheckCircle,
  Circle
} from 'lucide-react';

interface DBEvent {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string | null;
  location: string | null;
  type: string;
  recurrence: string;
  caregiverId: string | null;
  children: Array<{ id: string; name: string; avatarUrl?: string | null }>;
  caregiver?: { id: string; name: string; avatarUrl?: string | null } | null;
}

interface Caregiver {
  id: string;
  name: string;
  guardianOf?: Array<{
    relationship: string;
    child: { name: string };
  }>;
}

interface Child {
  id: string;
  name: string;
}

const MONTHS_BR = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function CalendarPage() {
  const [currentUserProfile, setCurrentUserProfile] = useState<{ role: string } | null>(null);

  // Estados de Escala da Família
  const [familyType, setFamilyType] = useState<string>('FAMILIA_UNICA');
  const [custodyOption, setCustodyOption] = useState<string | null>(null);
  const [custodyStartAnchor, setCustodyStartAnchor] = useState<string | null>(null);
  const [custodyStartParent, setCustodyStartParent] = useState<string | null>(null);
  const [custodyWeekendStart, setCustodyWeekendStart] = useState<number>(5);
  const [custodyWeekendEnd, setCustodyWeekendEnd] = useState<number>(0);

  // Dados do Banco
  const [events, setEvents] = useState<DBEvent[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros Globais e Locais
  const [filterChildId, setFilterChildId] = useState('all');
  const [taskFilter, setTaskFilter] = useState<'all' | 'children' | 'caregivers'>('all');

  // Controle de Navegação do Calendário
  const [currentMonth, setCurrentMonth] = useState<number>(4); // Maio (Index 4)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [selectedDay, setSelectedDay] = useState<number>(24);

  // Estados do Modal de Cadastro / Edição
  const [showModal, setShowModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [modalDate, setModalDate] = useState('');
  const [modalTime, setModalTime] = useState('');
  const [modalLocation, setModalLocation] = useState('');
  const [modalType, setModalType] = useState('Saúde');
  const [modalRecurrence, setModalRecurrence] = useState('NONE');
  const [modalChildIds, setModalChildIds] = useState<string[]>([]);
  const [modalCaregiverId, setModalCaregiverId] = useState('');
  const [recurrenceDayOfWeek, setRecurrenceDayOfWeek] = useState<number>(1); // 1 = Segunda
  const [recurrenceDayOfMonth, setRecurrenceDayOfMonth] = useState<number>(15);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setCurrentUserProfile(JSON.parse(savedUser));
    }

    const loadData = async () => {
      try {
        setLoading(true);
        // Buscar dados da família / escala
        const resFamily = await fetch('/api/family');
        if (resFamily.ok) {
          const data = await resFamily.json();
          setFamilyType(data.familyType || 'FAMILIA_UNICA');
          setCustodyOption(data.custodyOption || null);
          setCustodyStartAnchor(data.custodyStartAnchor || null);
          setCustodyStartParent(data.custodyStartParent || null);
          setCustodyWeekendStart(data.custodyWeekendStart !== null && data.custodyWeekendStart !== undefined ? data.custodyWeekendStart : 5);
          setCustodyWeekendEnd(data.custodyWeekendEnd !== null && data.custodyWeekendEnd !== undefined ? data.custodyWeekendEnd : 0);
        }

        // Buscar crianças
        const resChildren = await fetch('/api/children');
        if (resChildren.ok) {
          const childData = await resChildren.json();
          setChildren(childData);
        }

        // Buscar cuidadores
        const resCaregivers = await fetch('/api/cuidadores');
        if (resCaregivers.ok) {
          const caregiverData = await resCaregivers.json();
          setCaregivers(caregiverData);
        }

        // Buscar tarefas da família
        const resTasks = await fetch('/api/tasks');
        if (resTasks.ok) {
          const tasksData = await resTasks.json();
          setTasks(tasksData);
        }

        // Buscar eventos reais
        await fetchEvents();
      } catch (err) {
        console.error('Erro ao carregar dados do calendário:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const eventsData = await res.json();
        setEvents(eventsData);
      }
    } catch (e) {
      console.error('Erro ao buscar eventos:', e);
    }
  };

  const refreshTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        setTasks(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const parseDateWithoutTimezone = (dateInput: string | Date | null | undefined): Date => {
    if (!dateInput) return new Date();
    if (dateInput instanceof Date) {
      return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
    }
    const datePart = dateInput.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return new Date(y, m, d);
    }
    const parsed = new Date(dateInput);
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  };

  const isTaskOnDay = (task: any, year: number, month: number, dayNumber: number) => {
    const baseDate = task.dueDate || task.createdAt;
    if (!baseDate) return false;
    const taskDate = parseDateWithoutTimezone(baseDate);
    const targetDate = new Date(year, month, dayNumber);
    
    const tY = taskDate.getFullYear();
    const tM = taskDate.getMonth();
    const tD = taskDate.getDate();

    const targetY = targetDate.getFullYear();
    const targetM = targetDate.getMonth();
    const targetD = targetDate.getDate();

    if (task.recurrence === 'NONE') {
      return tY === targetY && tM === targetM && tD === targetD;
    } else if (task.recurrence === 'DAILY') {
      return targetDate >= new Date(tY, tM, tD);
    } else if (task.recurrence === 'WEEKLY') {
      return targetDate >= new Date(tY, tM, tD) && taskDate.getDay() === targetDate.getDay();
    } else if (task.recurrence === 'MONTHLY') {
      return targetDate >= new Date(tY, tM, tD) && taskDate.getDate() === targetDate.getDate();
    }
    return false;
  };

  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    setTasks(prevTasks =>
      prevTasks.map(t => t.id === taskId ? { ...t, isCompleted: !currentStatus } : t)
    );

    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: taskId,
          isCompleted: !currentStatus,
        }),
      });

      if (!res.ok) {
        setTasks(prevTasks =>
          prevTasks.map(t => t.id === taskId ? { ...t, isCompleted: currentStatus } : t)
        );
        const data = await res.json();
        alert(data.error || 'Erro ao atualizar tarefa.');
      } else {
        await refreshTasks();
      }
    } catch (err) {
      console.error(err);
      setTasks(prevTasks =>
        prevTasks.map(t => t.id === taskId ? { ...t, isCompleted: currentStatus } : t)
      );
      alert('Erro de conexão ao atualizar tarefa.');
    }
  };

  // Mapeamento matemático preciso dos dias de custódia da escala para qualquer data baseando-se no início configurado
  const getParentForDay = (dayNum: number, month: number, year: number): 'MAE' | 'PAI' | null => {
    if (familyType === 'FAMILIA_UNICA' || !custodyOption) return null;

    if (custodyStartAnchor && custodyStartParent) {
      try {
        const anchorDate = new Date(custodyStartAnchor);
        const targetDate = new Date(year, month, dayNum);

        anchorDate.setHours(0, 0, 0, 0);
        targetDate.setHours(0, 0, 0, 0);

        const diffTime = targetDate.getTime() - anchorDate.getTime();
        const daysDiff = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        const p1 = custodyStartParent as 'MAE' | 'PAI';
        const p2 = p1 === 'MAE' ? 'PAI' : 'MAE';

        switch (custodyOption) {
          case '7X7': {
            const cycleDay = (daysDiff % 14 + 14) % 14;
            return cycleDay < 7 ? p1 : p2;
          }
          case '15X15': {
            const cycleDay = (daysDiff % 30 + 30) % 30;
            return cycleDay < 15 ? p1 : p2;
          }
          case '2X2X3': {
            const cycleDay = (daysDiff % 14 + 14) % 14;
            if (cycleDay === 0 || cycleDay === 1) return p1;
            if (cycleDay === 2 || cycleDay === 3) return p2;
            if (cycleDay >= 4 && cycleDay <= 6) return p1;
            if (cycleDay === 7 || cycleDay === 8) return p2;
            if (cycleDay === 9 || cycleDay === 10) return p1;
            return p2;
          }
          case '15D_FDS': {
            const start = custodyWeekendStart !== null && custodyWeekendStart !== undefined ? custodyWeekendStart : 5;
            const end = custodyWeekendEnd !== null && custodyWeekendEnd !== undefined ? custodyWeekendEnd : 0;

            const dayOfWeek = targetDate.getDay();
            
            const isWeekendVisitDay = start <= end
              ? (dayOfWeek >= start && dayOfWeek <= end)
              : (dayOfWeek >= start || dayOfWeek <= end);

            if (!isWeekendVisitDay) {
              return p2; // Dias úteis com o genitor residente fixo
            }

            const getWeekendSunday = (d: Date) => {
              const copy = new Date(d);
              const day = copy.getDay();
              if (day === 5 || day === 6) {
                copy.setDate(copy.getDate() + (7 - day));
              } else {
                copy.setDate(copy.getDate() - day);
              }
              copy.setHours(0, 0, 0, 0);
              return copy;
            };

            const sunA = getWeekendSunday(anchorDate);
            const sunD = getWeekendSunday(targetDate);
            const weekDiff = Math.round((sunD.getTime() - sunA.getTime()) / (7 * 24 * 60 * 60 * 1000));
            const isEvenWeek = Math.abs(weekDiff) % 2 === 0;

            return isEvenWeek ? p1 : p2;
          }
          default:
            return null;
        }
      } catch (err) {
        console.error('Erro ao calcular custódia dinâmica:', err);
      }
    }
    return null;
  };

  // Helper para verificar se um evento ocorre em um determinado dia (suporta recorrência)
  const eventAppliesToDate = (event: DBEvent, year: number, month: number, day: number) => {
    const target = new Date(year, month, day);
    const start = parseDateWithoutTimezone(event.date);
    
    // Configura horas como 0 para comparação precisa
    start.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    if (target.getTime() < start.getTime()) return false;

    if (event.recurrence === 'NONE') {
      return target.getTime() === start.getTime();
    }
    if (event.recurrence === 'DAILY') {
      return true;
    }
    if (event.recurrence === 'WEEKLY') {
      return target.getDay() === start.getDay();
    }
    if (event.recurrence === 'MONTHLY') {
      return target.getDate() === start.getDate();
    }
    return false;
  };

  // Eventos do dia selecionado (considerando filtro por filho)
  const selectedDayEvents = events.filter(evt => {
    const childMatch = filterChildId === 'all' || (evt.children && evt.children.some(c => c.id === filterChildId));
    return childMatch && eventAppliesToDate(evt, currentYear, currentMonth, selectedDay);
  });

  // Tarefas do dia selecionado (considerando filtro por filho)
  const selectedDayTasks = tasks.filter(tsk => {
    const childMatch = filterChildId === 'all' || tsk.childId === filterChildId;
    return childMatch && isTaskOnDay(tsk, currentYear, currentMonth, selectedDay);
  });

  // Função para mudar o mês
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
    setSelectedDay(1);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
    setSelectedDay(1);
  };

  // Gera dias da grade do calendário
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Domingo, 1 = Segunda...

  // Abre formulário para criação
  const handleOpenCreateModal = () => {
    setEditingEventId(null);
    setModalTitle('');
    setModalDescription('');
    // Data formatada para input date (yyyy-MM-dd)
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(selectedDay).padStart(2, '0');
    setModalDate(`${currentYear}-${formattedMonth}-${formattedDay}`);
    setModalTime('');
    setModalLocation('');
    setModalType('Saúde');
    setModalRecurrence('NONE');
    setModalChildIds([]);
    setModalCaregiverId('');
    const d = new Date(currentYear, currentMonth, selectedDay);
    setRecurrenceDayOfWeek(d.getDay());
    setRecurrenceDayOfMonth(selectedDay);
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  // Abre formulário para edição
  const handleOpenEditModal = (evt: DBEvent) => {
    setEditingEventId(evt.id);
    setModalTitle(evt.title);
    setModalDescription(evt.description || '');
    // Converter data ISO para YYYY-MM-DD
    const d = new Date(evt.date);
    const formattedMonth = String(d.getMonth() + 1).padStart(2, '0');
    const formattedDay = String(d.getDate()).padStart(2, '0');
    setModalDate(`${d.getFullYear()}-${formattedMonth}-${formattedDay}`);
    setModalTime(evt.time || '');
    setModalLocation(evt.location || '');
    setModalType(evt.type);
    setModalRecurrence(evt.recurrence);
    setModalChildIds(evt.children ? evt.children.map(c => c.id) : []);
    setModalCaregiverId(evt.caregiverId || '');
    setRecurrenceDayOfWeek(d.getDay());
    setRecurrenceDayOfMonth(d.getDate());
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  // Submeter formulário
  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle || !modalDate || !modalType) {
      setError('Por favor preencha os campos obrigatórios.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    // Ajustar a data para fuso local
    let dateObj = new Date(modalDate + 'T00:00:00');

    // Ajuste dinâmico baseado na recorrência
    if (modalRecurrence === 'WEEKLY') {
      while (dateObj.getDay() !== recurrenceDayOfWeek) {
        dateObj.setDate(dateObj.getDate() + 1);
      }
    } else if (modalRecurrence === 'MONTHLY') {
      dateObj.setDate(recurrenceDayOfMonth);
    }

    const payload = {
      title: modalTitle,
      description: modalDescription || null,
      date: dateObj.toISOString(),
      time: modalTime || null,
      location: modalLocation || null,
      type: modalType,
      recurrence: modalRecurrence,
      childIds: modalChildIds,
      caregiverId: modalCaregiverId || null,
    };

    try {
      const url = editingEventId ? `/api/events/${editingEventId}` : '/api/events';
      const method = editingEventId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erro ao processar compromisso.');

      setSuccess(editingEventId ? 'Compromisso atualizado!' : 'Compromisso criado com sucesso!');
      setShowModal(false);
      await fetchEvents();
    } catch (err: any) {
      setError(err.message || 'Falha ao salvar evento.');
    } finally {
      setSubmitting(false);
    }
  };

  // Excluir evento
  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Deseja realmente excluir este compromisso?')) return;

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setShowModal(false);
        await fetchEvents();
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao excluir compromisso.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao excluir compromisso.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Compromissos & Agenda</p>
          <h1 className="text-2xl font-bold text-white leading-tight">Calendário Compartilhado</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950/40 border border-slate-800 rounded-xl px-3 py-2">
            <span className="text-xxs text-indigo-400 font-bold uppercase select-none">Filtrar por Filho:</span>
            <select
              value={filterChildId}
              onChange={(e) => setFilterChildId(e.target.value)}
              className="bg-transparent text-slate-200 font-bold text-xs outline-none cursor-pointer border-none"
            >
              <option value="all" className="bg-slate-905 text-white">Todos</option>
              {children.map(c => (
                <option key={c.id} value={c.id} className="bg-slate-905 text-white">{c.name}</option>
              ))}
            </select>
          </div>

          {currentUserProfile?.role !== 'DEPENDENT' && (
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              Adicionar Evento
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-sm text-slate-500 font-semibold">Sincronizando calendário...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          
          {/* Painel Esquerdo: Calendário Grid */}
          <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/65">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-indigo-400" />
                {MONTHS_BR[currentMonth]} de {currentYear}
              </h3>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={handlePrevMonth}
                  className="p-2 text-slate-450 hover:text-white bg-slate-950/45 border border-slate-800 rounded-lg hover:border-slate-700 cursor-pointer transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleNextMonth}
                  className="p-2 text-slate-450 hover:text-white bg-slate-950/45 border border-slate-800 rounded-lg hover:border-slate-700 cursor-pointer transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Grid de Dias da Semana */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <div>Dom</div>
              <div>Seg</div>
              <div>Ter</div>
              <div>Qua</div>
              <div>Qui</div>
              <div>Sex</div>
              <div>Sáb</div>
            </div>

            {/* Grid de Dias */}
            <div className="grid grid-cols-7 gap-2 min-h-72">
              {/* Espaços vazios para alinhar o primeiro dia do mês */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="p-2 bg-slate-950/5 text-transparent rounded-xl select-none">0</div>
              ))}

              {/* Dias do mês */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const parent = getParentForDay(dayNum, currentMonth, currentYear);
                const isSelected = selectedDay === dayNum;

                // Verificar se este dia tem alguma atividade (considerando filtro por filho)
                const dayHasEvent = events.some(evt => {
                  const childMatch = filterChildId === 'all' || (evt.children && evt.children.some(c => c.id === filterChildId));
                  return childMatch && eventAppliesToDate(evt, currentYear, currentMonth, dayNum);
                });

                const dayHasTask = tasks.some(tsk => {
                  const childMatch = filterChildId === 'all' || tsk.childId === filterChildId;
                  return childMatch && isTaskOnDay(tsk, currentYear, currentMonth, dayNum);
                });

                const dayHasActivity = dayHasEvent || dayHasTask;

                // Estilização com cores de guarda: Mãe = Rosa, Pai = Azul, Neutro = Padrão
                let dayColorsClass = '';
                if (isSelected) {
                  dayColorsClass = 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20';
                } else if (parent === 'MAE') {
                  dayColorsClass = 'bg-pink-500/10 border-pink-500/20 text-pink-300 hover:border-pink-400 hover:bg-pink-500/15';
                } else if (parent === 'PAI') {
                  dayColorsClass = 'bg-sky-500/10 border-sky-500/20 text-sky-300 hover:border-sky-400 hover:bg-sky-500/15';
                } else {
                  dayColorsClass = dayHasActivity
                    ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-400 hover:border-indigo-400'
                    : 'bg-slate-950/40 border-slate-800/40 hover:border-slate-700 text-slate-355';
                }

                return (
                  <button 
                    key={dayNum} 
                    onClick={() => setSelectedDay(dayNum)}
                    className={`
                      p-2 rounded-xl flex flex-col items-center justify-center relative font-bold transition-all cursor-pointer border text-xs sm:text-sm h-12 w-full
                      ${dayColorsClass}
                    `}
                  >
                    <span>{dayNum}</span>
                    {dayHasActivity && (
                      <span className={`w-1.5 h-1.5 rounded-full absolute bottom-1.5 animate-pulse ${
                        isSelected ? 'bg-white' : parent === 'MAE' ? 'bg-pink-400' : parent === 'PAI' ? 'bg-sky-400' : 'bg-indigo-400'
                      }`}></span>
                    )}
                  </button>
                );
              })}
            </div>

            {familyType !== 'FAMILIA_UNICA' && (
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-6 pt-4 border-t border-slate-800/40 text-[10px] font-bold uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500 border border-pink-400 shadow-sm"></span>
                  <span className="text-pink-400/90">Dias com a Mãe (Rosa)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 border border-sky-400 shadow-sm"></span>
                  <span className="text-sky-400/90">Dias com o Pai (Azul)</span>
                </div>
                <div className="text-slate-500 lowercase font-semibold ml-auto">
                  escala ativa: {
                    custodyOption === '7X7' ? 'alternada 7x7' :
                    custodyOption === '15X15' ? 'quinzenal 15x15' :
                    custodyOption === '2X2X3' ? 'rotativa 2-2-3' :
                    custodyOption === '15D_FDS' ? 'fins de semana quinzenais' : 'personalizada'
                  }
                </div>
              </div>
            )}
          </div>

          {/* Painel Direito: Agenda do Dia */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden h-fit space-y-6">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Dia {selectedDay} de {MONTHS_BR[currentMonth]}</h4>
                <p className="text-xxs text-slate-500 mt-1">
                  Atividades agendadas para esta data.
                </p>
              </div>
            </div>

            {/* SEÇÃO 1: COMPROMISSOS E EVENTOS */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800/50 pb-2">
                <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
                Compromissos e Eventos ({selectedDayEvents.length})
              </h4>
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {selectedDayEvents.map((evt) => {
                  const isHealth = evt.type === 'Saúde';
                  const isEducation = evt.type === 'Educação';
                  const isSport = evt.type === 'Esporte';
                  const isLogistic = evt.type === 'Logística';

                  let typeColor = 'bg-slate-500/10 text-slate-400';
                  if (isHealth) typeColor = 'bg-red-500/10 text-red-400 border border-red-500/20';
                  if (isEducation) typeColor = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                  if (isSport) typeColor = 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
                  if (isLogistic) typeColor = 'bg-pink-500/10 text-pink-400 border border-pink-500/20';

                  return (
                    <div 
                      key={evt.id}
                      onClick={() => currentUserProfile?.role !== 'DEPENDENT' && handleOpenEditModal(evt)}
                      className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 space-y-2.5 hover:border-indigo-500/40 cursor-pointer transition-all hover:bg-slate-950/60 relative group"
                    >
                      {currentUserProfile?.role !== 'DEPENDENT' && (
                        <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Edit2 className="w-3 h-3 text-slate-400 hover:text-white cursor-pointer" />
                        </div>
                      )}

                      <div className="flex justify-between items-start gap-2">
                        {evt.children && evt.children.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {evt.children.map((child, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-indigo-500/10 text-indigo-400 uppercase tracking-wider">
                                <Baby className="w-2.5 h-2.5" />
                                {child.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-slate-800 text-slate-400 uppercase tracking-wider">
                            Família
                          </span>
                        )}
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${typeColor}`}>
                          {evt.type}
                        </span>
                      </div>

                      <h5 className="text-xs font-bold text-white tracking-tight leading-snug">{evt.title}</h5>

                      {evt.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-2">{evt.description}</p>
                      )}

                      <div className="space-y-0.5 text-[11px] text-slate-450">
                        {evt.time && (
                          <p className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-600 shrink-0" />
                            {evt.time}
                          </p>
                        )}
                        {evt.location && (
                          <p className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-600 shrink-0" />
                            {evt.location}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-800/40 flex justify-between items-center text-[10px] text-slate-500 font-bold">
                        <span>Responsável:</span>
                        <span className="text-slate-350 flex items-center gap-1">
                          <User className="w-2.5 h-2.5 text-sky-400" />
                          {evt.caregiver?.name || 'Não atribuído'}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {selectedDayEvents.length === 0 && (
                  <div className="py-8 text-center text-slate-500 text-[11px] font-bold">
                    Nenhum compromisso cadastrado para esta data.
                  </div>
                )}
              </div>
            </div>

            {/* SEÇÃO 2: PAINEL EXCLUSIVO DE TAREFAS (DEVERES E ROTINAS) */}
            <div className="space-y-4 pt-4 border-t border-slate-800/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/50 pb-2">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-pink-400 shrink-0 animate-pulse" />
                  Deveres e Rotinas ({selectedDayTasks.length})
                </h4>
                
                {/* Mini Filtro de Atribuição */}
                <div className="flex gap-1 p-0.5 bg-slate-950/65 border border-slate-800/80 rounded-lg w-fit">
                  <button
                    onClick={() => setTaskFilter('all')}
                    className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      taskFilter === 'all'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-550 hover:text-slate-300'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setTaskFilter('children')}
                    className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      taskFilter === 'children'
                        ? 'bg-pink-650 text-white shadow'
                        : 'text-slate-550 hover:text-slate-300'
                    }`}
                  >
                    Filhos
                  </button>
                  <button
                    onClick={() => setTaskFilter('caregivers')}
                    className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      taskFilter === 'caregivers'
                        ? 'bg-sky-650 text-white shadow'
                        : 'text-slate-550 hover:text-slate-300'
                    }`}
                  >
                    Adultos
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {selectedDayTasks
                  .filter(tsk => {
                    if (taskFilter === 'children') return tsk.childId !== null;
                    if (taskFilter === 'caregivers') return tsk.caregiverId !== null;
                    return true;
                  })
                  .map((task) => (
                    <div 
                      key={task.id}
                      onClick={() => handleToggleTask(task.id, task.isCompleted)}
                      className={`
                        p-3 rounded-xl border transition-all flex items-start gap-2.5 cursor-pointer group select-none
                        ${task.isCompleted 
                          ? 'bg-slate-950/15 border-emerald-950/50 text-slate-500' 
                          : 'bg-slate-950/45 border-slate-800/80 text-slate-300 hover:border-slate-700'
                        }
                      `}
                    >
                      {/* Checkbox */}
                      <button type="button" className="shrink-0 mt-0.5 focus:outline-none">
                        {task.isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_4px_rgba(52,211,153,0.15)]" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                        )}
                      </button>

                      {/* Conteúdo */}
                      <div className="overflow-hidden flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h5 className={`text-xs font-bold leading-tight ${task.isCompleted ? 'line-through text-slate-600' : 'text-slate-205'}`}>
                            {task.title}
                          </h5>
                          {task.points > 0 && task.childId && !task.isCompleted && (
                            <span className="px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-wider flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                              +{task.points} pts
                            </span>
                          )}
                        </div>

                        {task.description && (
                          <p className={`text-[11px] leading-tight ${task.isCompleted ? 'text-slate-700' : 'text-slate-450'}`}>
                            {task.description}
                          </p>
                        )}

                        {/* Atribuição */}
                        <div className="flex items-center gap-2 pt-1">
                          {task.childId ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-pink-500/10 text-pink-400 uppercase tracking-wider select-none border border-pink-500/15">
                              <Baby className="w-2.5 h-2.5 shrink-0" />
                              Filho: {task.child?.name || 'Dependente'}
                            </span>
                          ) : task.caregiverId ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-sky-500/10 text-sky-400 uppercase tracking-wider select-none border border-sky-500/15">
                              <User className="w-2.5 h-2.5 shrink-0" />
                              Adulto: {task.caregiver?.name || 'Cuidador'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-slate-800 text-slate-500 uppercase tracking-wider select-none">
                              Família
                            </span>
                          )}

                          {task.recurrence !== 'NONE' && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold bg-indigo-500/10 text-indigo-400 uppercase tracking-wider border border-indigo-500/15 px-1 rounded">
                              Fixa
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                {selectedDayTasks.length === 0 && (
                  <div className="py-8 text-center text-slate-500 text-[11px] font-bold">
                    Nenhuma tarefa ou rotina cadastrada para esta data.
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* MODAL DE CADASTRO / EDIÇÃO DE COMPROMISSO */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden max-h-[90vh] overflow-y-auto">
            
            {/* Detalhe estético */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
              <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-indigo-400" />
                {editingEventId ? 'Editar Compromisso' : 'Novo Compromisso'}
              </h4>
              <div className="flex items-center gap-2">
                {editingEventId && (
                  <button 
                    type="button"
                    onClick={() => handleDeleteEvent(editingEventId)}
                    className="p-1.5 hover:bg-red-950/30 rounded-lg text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                    title="Excluir evento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/80 flex items-start gap-2 mb-4 animate-shake">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-200 font-medium leading-relaxed">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmitEvent} className="space-y-4">
              
              {/* 1. Frequência / Recorrência (Primeiro campo!) */}
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Frequência / Recorrência *
                </label>
                <select
                  value={modalRecurrence}
                  onChange={(e) => {
                    const newRec = e.target.value;
                    setModalRecurrence(newRec);
                    // Pré-popular valores convenientes
                    if (newRec === 'NONE') {
                      const formattedMonth = String(currentMonth + 1).padStart(2, '0');
                      const formattedDay = String(selectedDay).padStart(2, '0');
                      setModalDate(`${currentYear}-${formattedMonth}-${formattedDay}`);
                    } else if (newRec === 'WEEKLY') {
                      const d = new Date(currentYear, currentMonth, selectedDay);
                      setRecurrenceDayOfWeek(d.getDay());
                    } else if (newRec === 'MONTHLY') {
                      setRecurrenceDayOfMonth(selectedDay);
                    }
                  }}
                  className="w-full bg-slate-950/50 border border-slate-800 text-slate-350 rounded-xl py-2.5 px-3 text-sm outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
                >
                  <option value="NONE">Uma Vez (Apenas no Dia)</option>
                  <option value="DAILY">Diário (Todo dia)</option>
                  <option value="WEEKLY">Semanal (Toda semana)</option>
                  <option value="MONTHLY">Mensal (Todo mês)</option>
                </select>
              </div>

              {/* 2. Condicionais baseadas na Frequência */}
              {modalRecurrence === 'NONE' && (
                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Data do Compromisso *
                  </label>
                  <input
                    type="date"
                    required
                    value={modalDate}
                    onChange={(e) => setModalDate(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 text-slate-350 rounded-xl py-2 px-3 text-sm outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
                  />
                </div>
              )}

              {modalRecurrence === 'DAILY' && (
                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Data de Início *
                  </label>
                  <input
                    type="date"
                    required
                    value={modalDate}
                    onChange={(e) => setModalDate(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 text-slate-350 rounded-xl py-2 px-3 text-sm outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
                  />
                </div>
              )}

              {modalRecurrence === 'WEEKLY' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Dia da Semana *
                    </label>
                    <select
                      value={recurrenceDayOfWeek}
                      onChange={(e) => setRecurrenceDayOfWeek(Number(e.target.value))}
                      className="w-full bg-slate-950/50 border border-slate-800 text-slate-350 rounded-xl py-2.5 px-3 text-sm outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
                    >
                      <option value={1}>Segunda-feira</option>
                      <option value={2}>Terça-feira</option>
                      <option value={3}>Quarta-feira</option>
                      <option value={4}>Quinta-feira</option>
                      <option value={5}>Sexta-feira</option>
                      <option value={6}>Sábado</option>
                      <option value={0}>Domingo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Começar a contar de *
                    </label>
                    <input
                      type="date"
                      required
                      value={modalDate}
                      onChange={(e) => setModalDate(e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-800 text-slate-350 rounded-xl py-2.5 px-3 text-sm outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {modalRecurrence === 'MONTHLY' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Dia do Mês (1 a 31) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      required
                      value={recurrenceDayOfMonth}
                      onChange={(e) => setRecurrenceDayOfMonth(Math.max(1, Math.min(31, Number(e.target.value))))}
                      className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-2 px-3 text-sm outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Começar a contar de *
                    </label>
                    <input
                      type="date"
                      required
                      value={modalDate}
                      onChange={(e) => setModalDate(e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-800 text-slate-350 rounded-xl py-2.5 px-3 text-sm outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Título */}
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Título do Compromisso *
                </label>
                <input
                  type="text"
                  required
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder="Ex: Pediatra, Aula de Judô, Troca de Guarda"
                  className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-2 px-3 text-sm outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-700"
                />
              </div>

              {/* Detalhes / Descrição */}
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Descrição (Opcional)
                </label>
                <textarea
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                  placeholder="Instruções, observações especiais, etc."
                  rows={2}
                  className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-2 px-3 text-sm outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-700 resize-none font-sans"
                />
              </div>

              {/* Horário & Categoria do Evento */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Categoria do Evento *
                  </label>
                  <select
                    value={modalType}
                    onChange={(e) => setModalType(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 text-slate-350 rounded-xl py-2 px-3 text-sm outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
                  >
                    <option value="Saúde">Saúde</option>
                    <option value="Educação">Educação</option>
                    <option value="Esporte">Esporte</option>
                    <option value="Lazer">Lazer</option>
                    <option value="Logística">Logística / Guarda</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Horário (Opcional)
                  </label>
                  <input
                    type="text"
                    value={modalTime}
                    onChange={(e) => setModalTime(e.target.value)}
                    placeholder="Ex: 14:30"
                    className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-2 px-3 text-sm outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-700"
                  />
                </div>
              </div>

              {/* Local */}
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Localização (Opcional)
                </label>
                <input
                  type="text"
                  value={modalLocation}
                  onChange={(e) => setModalLocation(e.target.value)}
                  placeholder="Ex: Consultório, Academia, Escola"
                  className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-2 px-3 text-sm outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-700"
                />
              </div>

              {/* Vinculação de Filho e Cuidador */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Atribuir às Crianças (Múltipla Seleção)
                  </label>
                  <div className="max-h-28 overflow-y-auto border border-slate-800 bg-slate-950/50 rounded-xl p-3 space-y-2">
                    {children.map((c) => (
                      <label key={c.id} className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={modalChildIds.includes(c.id)}
                          onChange={() => {
                            if (modalChildIds.includes(c.id)) {
                              setModalChildIds(modalChildIds.filter(id => id !== c.id));
                            } else {
                              setModalChildIds([...modalChildIds, c.id]);
                            }
                          }}
                          className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-900 w-4 h-4 cursor-pointer"
                        />
                        {c.name}
                      </label>
                    ))}
                    {children.length === 0 && (
                      <p className="text-xxs text-slate-600 text-center">Nenhuma criança cadastrada.</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Cuidador Responsável (Opcional)
                  </label>
                  <select
                    value={modalCaregiverId}
                    onChange={(e) => setModalCaregiverId(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 text-slate-350 rounded-xl py-2.5 px-3 text-sm outline-none focus:border-sky-500/80 focus:ring-2 focus:ring-sky-500/10 cursor-pointer"
                  >
                    <option value="">Não atribuído</option>
                    {caregivers.map((c) => {
                      let relationText = '';
                      if (c.guardianOf && c.guardianOf.length > 0) {
                        const links = c.guardianOf.map(g => `${g.relationship === 'MAE' ? 'Mãe' : g.relationship === 'PAI' ? 'Pai' : 'Responsável'} de ${g.child.name}`).join(', ');
                        relationText = ` (${links})`;
                      }
                      return (
                        <option key={c.id} value={c.id}>
                          {c.name}{relationText}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Salvar Evento
                  </>
                )}
              </button>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}
