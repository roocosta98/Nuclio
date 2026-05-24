'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Baby, 
  Users, 
  ClipboardList, 
  PlusCircle, 
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ArrowRight,
  CheckCircle,
  Circle,
  RefreshCw,
  User,
  Loader2,
  HelpCircle,
  X,
  Sparkles,
  Award
} from 'lucide-react';

interface ChildData {
  id: string;
  name: string;
  birthDate: string | null;
  avatarUrl: string | null;
  tasksCount?: number;
  tasksCompleted?: number;
}

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
  children: Array<{ id: string; name: string }>;
  caregiver?: { id: string; name: string } | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  isCompleted: boolean;
  dueDate: string | null;
  recurrence: string;
  childId: string | null;
  caregiverId: string | null;
  child?: { id: string; name: string } | null;
  caregiver?: { id: string; name: string } | null;
}

const MONTHS_BR = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function CaregiverDashboardPage() {
  const [children, setChildren] = useState<ChildData[]>([]);
  const [events, setEvents] = useState<DBEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    childrenCount: 0,
    caregiversCount: 0,
    totalTasksCount: 0,
  });

  // Configurações do arranjo familiar para colorização do calendário
  const [familyType, setFamilyType] = useState<string>('FAMILIA_UNICA');
  const [custodyOption, setCustodyOption] = useState<string | null>(null);
  const [custodyStartAnchor, setCustodyStartAnchor] = useState<string | null>(null);
  const [custodyStartParent, setCustodyStartParent] = useState<string | null>(null);
  const [custodyWeekendStart, setCustodyWeekendStart] = useState<number>(5);
  const [custodyWeekendEnd, setCustodyWeekendEnd] = useState<number>(0);

  // Calendário Interativo Integrado na Home
  const [currentMonth, setCurrentMonth] = useState<number>(4); // Maio
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentDay, setCurrentDay] = useState<number>(24);

  // Estado do Tutorial Guiado
  const [tourStep, setTourStep] = useState<number | null>(null);

  // Mapeamento de convívio/escala
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
              return p2;
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
        console.error('Erro ao calcular custódia:', err);
      }
    }
    return null;
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

  // Helper de Recorrência para Eventos
  const eventAppliesToDate = (event: DBEvent, year: number, month: number, day: number) => {
    const target = new Date(year, month, day);
    const start = parseDateWithoutTimezone(event.date);
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

  // Helper de Recorrência para Tarefas
  const taskAppliesToDate = (task: Task, year: number, month: number, day: number) => {
    if (!task.dueDate) return false;
    const target = new Date(year, month, day);
    const start = parseDateWithoutTimezone(task.dueDate);
    start.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    if (target.getTime() < start.getTime()) return false;

    if (task.recurrence === 'NONE') {
      return target.getTime() === start.getTime();
    }
    if (task.recurrence === 'DAILY') {
      return true;
    }
    if (task.recurrence === 'WEEKLY') {
      return target.getDay() === start.getDay();
    }
    if (task.recurrence === 'MONTHLY') {
      return target.getDate() === start.getDate();
    }
    return false;
  };

  const fetchDashboardData = async () => {
    try {
      // 1. Busca crianças
      const resChildren = await fetch('/api/children');
      if (!resChildren.ok) throw new Error();
      const childrenData: ChildData[] = await resChildren.json();

      // 2. Busca cuidadores
      const resCuidadores = await fetch('/api/cuidadores');
      let caregiversCount = 0;
      if (resCuidadores.ok) {
        const caregivers = await resCuidadores.json();
        caregiversCount = caregivers.length;
      }

      // 3. Busca eventos familiares
      const resEvents = await fetch('/api/events');
      if (resEvents.ok) {
        const eventsData = await resEvents.json();
        setEvents(eventsData);
      }

      // 4. Busca todas as tarefas
      const resTasks = await fetch('/api/tasks');
      let tasksData: Task[] = [];
      if (resTasks.ok) {
        tasksData = await resTasks.json();
        setTasks(tasksData);
      }

      // 5. Calcular progresso das tarefas por criança
      const childrenWithTasks = childrenData.map((child) => {
        const childTasks = tasksData.filter(t => t.childId === child.id);
        const completed = childTasks.filter(t => t.isCompleted).length;
        return {
          ...child,
          tasksCount: childTasks.length,
          tasksCompleted: completed,
        };
      });

      // 6. Configurações de escala da família
      const resFamily = await fetch('/api/family');
      if (resFamily.ok) {
        const familyData = await resFamily.json();
        setFamilyType(familyData.familyType || 'FAMILIA_UNICA');
        setCustodyOption(familyData.custodyOption || null);
        setCustodyStartAnchor(familyData.custodyStartAnchor || null);
        setCustodyStartParent(familyData.custodyStartParent || null);
        setCustodyWeekendStart(familyData.custodyWeekendStart !== null && familyData.custodyWeekendStart !== undefined ? familyData.custodyWeekendStart : 5);
        setCustodyWeekendEnd(familyData.custodyWeekendEnd !== null && familyData.custodyWeekendEnd !== undefined ? familyData.custodyWeekendEnd : 0);
      }

      setChildren(childrenWithTasks);
      setStats({
        childrenCount: childrenData.length,
        caregiversCount: caregiversCount,
        totalTasksCount: tasksData.length,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Iniciar tour se o usuário nunca o viu
    const hasSeenTour = localStorage.getItem('hasSeenDashboardTour');
    if (!hasSeenTour) {
      setTourStep(1);
    }
  }, []);

  // Rolagem inteligente ao alternar passos do tutorial guiado
  useEffect(() => {
    if (tourStep === 2) {
      document.getElementById('tour-children')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (tourStep === 3) {
      document.getElementById('tour-calendar')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (tourStep === 4) {
      document.getElementById('tour-header')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [tourStep]);

  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    // Atualização otimista
    setTasks(prev => 
      prev.map(t => t.id === taskId ? { ...t, isCompleted: !currentStatus } : t)
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

      if (!res.ok) throw new Error();
      fetchDashboardData();
    } catch (e) {
      // Reverte
      setTasks(prev => 
        prev.map(t => t.id === taskId ? { ...t, isCompleted: currentStatus } : t)
      );
    }
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
    setCurrentDay(1);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
    setCurrentDay(1);
  };

  const handleCloseTour = () => {
    setTourStep(null);
    localStorage.setItem('hasSeenDashboardTour', 'true');
  };

  const handleResetTour = () => {
    setTourStep(1);
    document.getElementById('tour-header')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Grade de dias do calendário
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  // Filtrar eventos e tarefas do dia selecionado
  const activeDayEvents = events.filter(evt => eventAppliesToDate(evt, currentYear, currentMonth, currentDay));
  const activeDayTasks = tasks.filter(t => taskAppliesToDate(t, currentYear, currentMonth, currentDay));

  return (
    <div className="space-y-8 relative">
      
      {/* Cabeçalho */}
      <div 
        id="tour-header" 
        className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-2 rounded-2xl transition-all duration-300 ${
          tourStep === 4 ? 'ring-2 ring-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.25)] bg-slate-900/40 border border-indigo-500/20' : ''
        }`}
      >
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-indigo-300 tracking-tight flex items-center gap-2">
            Painel de Controle Familiar
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">
            Visão unificada das escalas de visitas, tarefas diárias e cuidadores ativos
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/children"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            Nova Criança
          </Link>
          <Link
            href="/dashboard/users"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-750 active:bg-slate-850 text-slate-200 border border-slate-700 rounded-xl text-sm transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            Adicionar Cuidador
          </Link>
        </div>
      </div>

      {/* Grid de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 relative overflow-hidden transition-all hover:border-slate-750">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Baby className="w-24 h-24 text-indigo-400" />
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Filhos Cadastrados</span>
            <Baby className="w-4 h-4 text-indigo-400 animate-pulse" />
          </div>
          {loading ? (
            <div className="h-9 w-16 bg-slate-850 animate-pulse rounded-lg"></div>
          ) : (
            <h3 className="text-3xl font-black text-white">{stats.childrenCount}</h3>
          )}
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 relative overflow-hidden transition-all hover:border-slate-750">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Users className="w-24 h-24 text-purple-400" />
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Rede de Apoio</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          {loading ? (
            <div className="h-9 w-16 bg-slate-850 animate-pulse rounded-lg"></div>
          ) : (
            <h3 className="text-3xl font-black text-white">{stats.caregiversCount}</h3>
          )}
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 relative overflow-hidden transition-all hover:border-slate-750">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <ClipboardList className="w-24 h-24 text-pink-400" />
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-pink-400 uppercase tracking-wider">Tarefas Atribuídas</span>
            <ClipboardList className="w-4 h-4 text-pink-400" />
          </div>
          {loading ? (
            <div className="h-9 w-16 bg-slate-850 animate-pulse rounded-lg"></div>
          ) : (
            <h3 className="text-3xl font-black text-white">{stats.totalTasksCount}</h3>
          )}
        </div>
      </div>

      {/* AGENDA FAMILIAR UNIFICADA (CALENDÁRIO GRID + CRONOGRAMA INTEGRADO) */}
      <div 
        id="tour-calendar" 
        className={`bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all duration-300 ${
          tourStep === 3 ? 'ring-2 ring-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.25)] border-indigo-500/20' : ''
        }`}
      >
        
        {/* Detalhe estético */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

        {/* Bloco do Calendário Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800/80">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-indigo-400" />
              Agenda Familiar - {MONTHS_BR[currentMonth]} de {currentYear}
            </h3>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={handlePrevMonth}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-950/45 border border-slate-800 rounded-lg hover:border-slate-700 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={handleNextMonth}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-950/45 border border-slate-800 rounded-lg hover:border-slate-700 cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-xxs font-bold text-slate-500 uppercase tracking-wider">
            <div>D</div><div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {/* Espaços vazios */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-10 bg-slate-950/5 text-transparent rounded-lg select-none flex items-center justify-center text-xs">
                0
              </div>
            ))}

            {/* Dias do Mês */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const isSelected = currentDay === dayNum;
              
              // Verificar compromissos ou tarefas pendentes no dia
              const dayHasEvents = events.some(evt => eventAppliesToDate(evt, currentYear, currentMonth, dayNum));
              const dayHasTasks = tasks.some(t => taskAppliesToDate(t, currentYear, currentMonth, dayNum));
              const hasActivity = dayHasEvents || dayHasTasks;

              const parent = getParentForDay(dayNum, currentMonth, currentYear);

              let dayColorsClass = '';
              if (isSelected) {
                dayColorsClass = 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-950/20';
              } else if (parent === 'MAE') {
                dayColorsClass = 'bg-pink-500/10 border-pink-500/20 text-pink-300 hover:border-pink-400 hover:bg-pink-500/15';
              } else if (parent === 'PAI') {
                dayColorsClass = 'bg-sky-500/10 border-sky-500/20 text-sky-300 hover:border-sky-400 hover:bg-sky-500/15';
              } else {
                dayColorsClass = hasActivity
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:border-indigo-400'
                  : 'bg-slate-950/40 border-slate-850 hover:border-slate-750 text-slate-400';
              }

              return (
                <button
                  key={`day-${dayNum}`}
                  onClick={() => setCurrentDay(dayNum)}
                  className={`
                    h-10 text-xs font-bold rounded-lg flex flex-col items-center justify-center relative border transition-all cursor-pointer
                    ${dayColorsClass}
                  `}
                >
                  <span>{dayNum}</span>
                  {hasActivity && (
                    <span className={`w-1.5 h-1.5 rounded-full absolute bottom-1 animate-pulse ${
                      isSelected ? 'bg-white' : parent === 'MAE' ? 'bg-pink-400' : parent === 'PAI' ? 'bg-sky-400' : 'bg-indigo-400'
                    }`}></span>
                  )}
                </button>
              );
            })}
          </div>

          {familyType !== 'FAMILIA_UNICA' && (
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-4 pt-3 border-t border-slate-800/40 text-[10px] font-bold uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-pink-500 border border-pink-400 shadow-sm"></span>
                <span className="text-pink-400/90">Dias com a Mãe</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500 border border-sky-400 shadow-sm"></span>
                <span className="text-sky-400/90">Dias com o Pai</span>
              </div>
              <div className="text-slate-500 lowercase font-semibold ml-auto sm:ml-0">
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

        {/* Bloco Lateral de Eventos & Tarefas do Dia Selecionado */}
        <div className="bg-slate-950/45 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between min-h-[380px] gap-4">
          <div className="space-y-4">
            <div className="pb-2 border-b border-slate-800/80 flex justify-between items-center">
              <div>
                <p className="text-xxs font-bold text-slate-500 uppercase tracking-wider">Dia Selecionado</p>
                <h4 className="text-sm font-bold text-white mt-0.5">{currentDay} de {MONTHS_BR[currentMonth]}</h4>
              </div>
            </div>

            <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
              
              {/* Seção 1: Compromissos */}
              <div className="space-y-2">
                <h6 className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400">Compromissos</h6>
                
                {activeDayEvents.map((evt) => (
                  <div key={evt.id} className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl space-y-1.5">
                    <div className="flex justify-between items-center gap-2">
                      {evt.children && evt.children.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {evt.children.map((child, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-extrabold uppercase select-none">
                              {child.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-extrabold uppercase select-none">
                          Família
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 font-bold">{evt.time || 'Horário Livre'}</span>
                    </div>
                    <h5 className="text-xs font-bold text-white tracking-tight leading-snug">{evt.title}</h5>
                    {evt.location && (
                      <p className="text-[10px] text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-700" />
                        {evt.location}
                      </p>
                    )}
                  </div>
                ))}

                {activeDayEvents.length === 0 && (
                  <p className="text-xxs text-slate-600 italic pl-1">Sem compromissos nesta data.</p>
                )}
              </div>

              {/* Seção 2: Tarefas da Data */}
              <div className="space-y-2 pt-2 border-t border-slate-850">
                <h6 className="text-[10px] font-extrabold uppercase tracking-wider text-pink-400">Deveres e Rotinas</h6>
                
                {activeDayTasks.map((task) => {
                  const isCaregiver = !!task.caregiverId;
                  const assigneeName = isCaregiver 
                    ? (task.caregiver?.name || 'Cuidador')
                    : (task.child?.name || 'Criança');

                  return (
                    <div 
                      key={task.id} 
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                        task.isCompleted 
                          ? 'bg-slate-950/20 border-emerald-950/20 text-slate-600' 
                          : 'bg-slate-900/60 border-slate-850 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <button
                          onClick={() => handleToggleTask(task.id, task.isCompleted)}
                          className="shrink-0 focus:outline-none cursor-pointer"
                        >
                          {task.isCompleted ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-600 hover:text-indigo-400 shrink-0 transition-colors" />
                          )}
                        </button>
                        <div className="overflow-hidden">
                          <p className={`text-xs font-bold truncate ${task.isCompleted ? 'line-through text-slate-700' : 'text-slate-200'}`}>
                            {task.title}
                          </p>
                          <span className={`inline-flex items-center gap-0.5 text-[9px] font-extrabold uppercase ${isCaregiver ? 'text-sky-400' : 'text-indigo-400'}`}>
                            {isCaregiver ? <User className="w-2 h-2" /> : <Baby className="w-2 h-2" />}
                            {assigneeName}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {activeDayTasks.length === 0 && (
                  <p className="text-xxs text-slate-600 italic pl-1">Sem tarefas agendadas.</p>
                )}
              </div>

            </div>
          </div>

          <Link
            href="/dashboard/calendar"
            className="w-full py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-350 hover:text-white font-bold text-xxs tracking-wider uppercase text-center rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            Acessar Agenda Completa
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>

      {/* Visão Geral dos Filhos */}
      <div 
        id="tour-children" 
        className={`space-y-4 p-4 rounded-3xl transition-all duration-300 ${
          tourStep === 2 ? 'ring-2 ring-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.25)] bg-slate-900/40 border border-indigo-500/20' : ''
        }`}
      >
        <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <Baby className="w-5 h-5 text-indigo-400" />
          Visão Geral dos Filhos
        </h3>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-slate-900/20 border border-slate-855 rounded-2xl p-6 h-48 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children.map((child) => {
              const pct = child.tasksCount 
                ? Math.round((child.tasksCompleted || 0) / child.tasksCount * 100) 
                : 0;

              return (
                <div 
                  key={child.id}
                  className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:border-indigo-500/30 flex flex-col justify-between gap-6 group hover:shadow-lg hover:shadow-indigo-950/10"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-indigo-600/10 border-2 border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                      {child.avatarUrl ? (
                        <img src={child.avatarUrl} alt={child.name} className="w-full h-full object-cover" />
                      ) : (
                        <Baby className="w-7 h-7 text-indigo-400" />
                      )}
                    </div>
                    
                    <div className="overflow-hidden">
                      <h4 className="text-base font-bold text-white leading-tight truncate group-hover:text-indigo-300 transition-colors">
                        {child.name}
                      </h4>
                      {child.birthDate ? (
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
                          <CalendarIcon className="w-3.5 h-3.5 text-slate-600" />
                          {new Date(child.birthDate).toLocaleDateString('pt-BR')}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-655 mt-1 font-medium">Nascimento não informado</p>
                      )}
                    </div>
                  </div>

                  {/* Progresso de Tarefas */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-400">Tarefas Concluídas</span>
                      <span className="text-indigo-400">{child.tasksCompleted}/{child.tasksCount} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1 text-slate-500 text-xxs font-bold uppercase tracking-wider">
                      {pct === 100 && child.tasksCount && child.tasksCount > 0 ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Completo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" />
                          Ativo
                        </span>
                      )}
                    </span>

                    <Link
                      href="/dashboard/children"
                      className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-bold tracking-wide transition-colors cursor-pointer"
                    >
                      Acessar Perfil
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}

            {children.length === 0 && (
              <div className="col-span-full py-12 bg-slate-900/10 border border-dashed border-slate-800 rounded-2xl text-center text-sm text-slate-500">
                <p>Nenhuma criança cadastrada na família ainda.</p>
                <Link
                  href="/dashboard/children"
                  className="inline-flex items-center gap-1.5 text-indigo-400 hover:underline font-bold mt-2"
                >
                  Cadastrar a Primeira Criança
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FLOATING TOUR WIZARD CARD */}
      {tourStep !== null && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm bg-slate-900/95 backdrop-blur-xl border border-indigo-500/30 text-white rounded-2xl shadow-2xl p-6 transition-all duration-300 animate-scale-in">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-t-2xl"></div>

          {/* Close Tour button */}
          <button 
            onClick={handleCloseTour}
            className="absolute top-4 right-4 p-1.5 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Wizard content */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-[10px] tracking-wider uppercase font-extrabold text-indigo-400">
                Guia Rápido • {tourStep} de 4
              </span>
            </div>

            {tourStep === 1 && (
              <div className="space-y-2">
                <h4 className="text-base font-black text-white">👋 Bem-vindo ao Nuclio!</h4>
                <p className="text-xs text-slate-350 leading-relaxed font-medium">
                  Este é o painel de controle principal do cuidador. Aqui você poderá gerenciar a custódia compartilhada de seus filhos, delegar afazeres e acompanhar rotinas importantes de forma totalmente cooperativa.
                </p>
              </div>
            )}

            {tourStep === 2 && (
              <div className="space-y-2">
                <h4 className="text-base font-black text-white">👶 Painel de Desempenho dos Filhos</h4>
                <p className="text-xs text-slate-350 leading-relaxed font-medium">
                  Aqui você acompanha o progresso geral das tarefas ativas atribuídas para cada criança, com barra de progresso em tempo real. Clicar em &quot;Acessar Perfil&quot; leva à loja de recompensas de cada filho!
                </p>
              </div>
            )}

            {tourStep === 3 && (
              <div className="space-y-2">
                <h4 className="text-base font-black text-white">📅 Agenda e Cronograma do Dia</h4>
                <p className="text-xs text-slate-350 leading-relaxed font-medium">
                  Nosso calendário dinâmico exibe os dias sob guarda de cada cuidador (Mãe em rosa, Pai em azul). Selecionar qualquer dia atualiza instantaneamente o painel lateral com compromissos e deveres daquela data.
                </p>
              </div>
            )}

            {tourStep === 4 && (
              <div className="space-y-2">
                <h4 className="text-base font-black text-white">⚡ Crie sua Rede de Apoio</h4>
                <p className="text-xs text-slate-350 leading-relaxed font-medium">
                  Utilize os botões de ação rápida para cadastrar seus filhos ou adicionar novos parceiros, avós e cuidadores para coparentar em sintonia!
                </p>
              </div>
            )}

            {/* Action buttons inside popover */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
              <button 
                onClick={handleCloseTour}
                className="text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                Pular Guia
              </button>

              <div className="flex items-center gap-2">
                {tourStep > 1 && (
                  <button 
                    onClick={() => setTourStep(tourStep - 1)}
                    className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Anterior
                  </button>
                )}

                {tourStep < 4 ? (
                  <button 
                    onClick={() => setTourStep(tourStep + 1)}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold text-white rounded-lg transition-all shadow-md cursor-pointer flex items-center gap-1"
                  >
                    Próximo
                    <ChevronRight className="w-3 h-3" />
                  </button>
                ) : (
                  <button 
                    onClick={handleCloseTour}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-[10px] font-bold text-white rounded-lg transition-all shadow-lg cursor-pointer"
                  >
                    Entendido!
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING ACTION HELP BUTTON */}
      {tourStep === null && (
        <button
          onClick={handleResetTour}
          title="Ajuda / Guia Rápido do Painel"
          className="fixed bottom-6 right-6 z-40 p-3 bg-slate-900/90 hover:bg-slate-850 text-indigo-400 hover:text-indigo-300 border border-slate-800 hover:border-indigo-500/40 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center group"
        >
          <HelpCircle className="w-5 h-5" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-350 text-[10px] font-bold uppercase tracking-wider ml-0 group-hover:ml-2 whitespace-nowrap">
            Guia Rápido
          </span>
        </button>
      )}

    </div>
  );
}
