'use client';

import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  PlusCircle, 
  Baby, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  CheckCircle,
  Circle,
  Sparkles,
  X,
  RefreshCw,
  User
} from 'lucide-react';

interface Child {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

interface Caregiver {
  id: string;
  name: string;
  avatarUrl?: string | null;
  guardianOf?: Array<{
    relationship: string;
    child: { name: string };
  }>;
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
  child?: Child | null;
  caregiver?: Caregiver | null;
  points: number;
}

export default function CaregiverTasksPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados do formulário de criação em Modal
  const [showForm, setShowForm] = useState(false);
  const [assigneeType, setAssigneeType] = useState<'child' | 'caregiver'>('child');
  const [selectedChildId, setSelectedChildId] = useState('');
  const [selectedCaregiverId, setSelectedCaregiverId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [recurrence, setRecurrence] = useState('NONE');
  const [points, setPoints] = useState(10);
  
  const [filterChildId, setFilterChildId] = useState('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      const resChildren = await fetch('/api/children');
      if (resChildren.ok) {
        const childrenData = await resChildren.json();
        setChildren(childrenData);
        if (childrenData.length > 0) {
          setSelectedChildId(childrenData[0].id);
        }
      }

      const resCaregivers = await fetch('/api/cuidadores');
      if (resCaregivers.ok) {
        const caregiversData = await resCaregivers.json();
        setCaregivers(caregiversData);
        if (caregiversData.length > 0) {
          setSelectedCaregiverId(caregiversData[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasksForChild = async (childId: string) => {
    if (!childId) return;
    try {
      setLoading(true);
      const resTasks = await fetch(`/api/tasks?childId=${childId}`);
      if (resTasks.ok) {
        const tasksData = await resTasks.json();
        setTasks(tasksData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const reloadTasks = async () => {
    setLoading(true);
    try {
      if (filterChildId === 'all') {
        const res = await fetch('/api/tasks');
        if (res.ok) {
          const tasksData = await res.json();
          setTasks(tasksData);
        }
      } else if (filterChildId === 'caregivers') {
        const res = await fetch('/api/tasks');
        if (res.ok) {
          const tasksData = await res.json();
          setTasks(tasksData.filter((t: Task) => t.caregiverId !== null));
        }
      } else {
        await fetchTasksForChild(filterChildId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadTasks();
  }, [filterChildId]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    if (assigneeType === 'child' && !selectedChildId) {
      setError('Selecione uma criança.');
      return;
    }
    if (assigneeType === 'caregiver' && !selectedCaregiverId) {
      setError('Selecione um cuidador.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || null,
          childId: assigneeType === 'child' ? selectedChildId : null,
          caregiverId: assigneeType === 'caregiver' ? selectedCaregiverId : null,
          dueDate: dueDate || null,
          recurrence: recurrence,
          points: assigneeType === 'child' ? Number(points) : 0,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erro ao criar tarefa.');

      setSuccess('Tarefa criada e atribuída com sucesso!');
      setTitle('');
      setDescription('');
      setDueDate('');
      setRecurrence('NONE');
      setPoints(10);
      setShowForm(false);

      reloadTasks();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Falha ao cadastrar tarefa.');
    } finally {
      setSubmitting(false);
    }
  };

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
    } catch (e) {
      // Reverte
      setTasks(prev => 
        prev.map(t => t.id === taskId ? { ...t, isCompleted: currentStatus } : t)
      );
    }
  };

  const getRecurrenceLabel = (rec: string) => {
    switch (rec) {
      case 'DAILY': return 'Diária';
      case 'WEEKLY': return 'Semanal';
      case 'MONTHLY': return 'Mensal';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Gestão do Dia a Dia</p>
          <h1 className="text-2xl font-bold text-white leading-tight">Tarefas & Obrigações Familiares</h1>
        </div>

        <button
          onClick={() => {
            setError('');
            setSuccess('');
            setAssigneeType('child');
            if (children.length > 0) setSelectedChildId(children[0].id);
            if (caregivers.length > 0) setSelectedCaregiverId(caregivers[0].id);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          Nova Tarefa
        </button>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 flex items-start gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-200 font-medium leading-relaxed">{success}</p>
        </div>
      )}

      {/* Lista de tarefas (Espaço Total) */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between gap-6 min-h-[400px]">
        
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-800/80 pb-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-indigo-400" />
              Mural de Tarefas
            </h3>
            
            {/* Filtros de Visualização */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold uppercase">Filtrar:</span>
              <select
                value={filterChildId}
                onChange={(e) => setFilterChildId(e.target.value)}
                className="bg-slate-950/60 border border-slate-800 text-slate-350 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-indigo-500/80 cursor-pointer"
              >
                <option value="all">Todas as Tarefas</option>
                <option value="caregivers">Apenas Cuidadores</option>
                {children.map((c) => (
                  <option key={c.id} value={c.id}>Criança: {c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-sm text-slate-500 font-medium">Buscando tarefas...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
              {tasks.map((task) => {
                const recLabel = getRecurrenceLabel(task.recurrence);
                
                // Resolver nome e estilo com base em ser tarefa de criança ou cuidador
                const isCaregiverTask = !!task.caregiverId;
                const assigneeName = isCaregiverTask 
                  ? (task.caregiver?.name || caregivers.find(c => c.id === task.caregiverId)?.name || 'Cuidador')
                  : (task.child?.name || children.find(c => c.id === task.childId)?.name || 'Criança');

                return (
                  <div 
                    key={task.id}
                    className={`
                      p-4 rounded-xl border flex items-center justify-between gap-4 transition-all group
                      ${task.isCompleted 
                        ? 'bg-slate-950/20 border-emerald-950/40 text-slate-500' 
                        : 'bg-slate-950/45 border-slate-800/60 hover:border-slate-700 text-slate-200 hover:shadow-lg'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <button
                        onClick={() => handleToggleTask(task.id, task.isCompleted)}
                        className="shrink-0 focus:outline-none cursor-pointer"
                      >
                        {task.isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 animate-scale-up" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 shrink-0 transition-colors" />
                        )}
                      </button>

                      <div className="overflow-hidden">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h4 className={`text-sm font-bold truncate leading-tight ${task.isCompleted ? 'line-through text-slate-650' : 'text-slate-100'}`}>
                            {task.title}
                          </h4>
                          
                          {isCaregiverTask ? (
                            <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 text-xxs font-extrabold uppercase shrink-0 flex items-center gap-1 select-none">
                              <User className="w-2.5 h-2.5" />
                              {assigneeName}
                            </span>
                          ) : (
                            <>
                              <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-xxs font-extrabold uppercase shrink-0 flex items-center gap-1 select-none">
                                <Baby className="w-2.5 h-2.5" />
                                {assigneeName}
                              </span>
                              {task.points > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xxs font-extrabold uppercase shrink-0 flex items-center gap-1 select-none">
                                  <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                                  +{task.points} pts
                                </span>
                              )}
                            </>
                          )}

                          {recLabel && (
                            <span className="px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-400 text-xxs font-extrabold uppercase shrink-0 flex items-center gap-1 select-none animate-pulse">
                              <RefreshCw className="w-2.5 h-2.5" />
                              {recLabel}
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <p className={`text-xs mt-1 truncate max-w-sm ${task.isCompleted ? 'text-slate-700' : 'text-slate-500'}`}>
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {task.dueDate && !task.isCompleted && (
                      <span className="shrink-0 text-xxs font-bold uppercase tracking-wider text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                );
              })}

              {tasks.length === 0 && (
                <div className="col-span-full py-16 text-center text-slate-500">
                  Nenhuma tarefa atribuída encontrada para os filtros aplicados.
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* FORMULÁRIO DE TAREFA EM MODAL FLUTUANTE */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden max-h-[90vh] overflow-y-auto">
            
            {/* Detalhe estético no topo */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
              <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-indigo-400" />
                Criar Nova Tarefa
              </h4>
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-450 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/80 flex items-start gap-2 mb-4 animate-shake">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-200 font-medium leading-relaxed">{error}</p>
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-4">
              
              {/* Tipo de Destinatário */}
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Destinatário da Tarefa
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAssigneeType('child')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      assigneeType === 'child'
                        ? 'bg-indigo-600/25 border-indigo-500 text-indigo-300'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Baby className="w-4 h-4" />
                    Criança / Filho
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssigneeType('caregiver')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      assigneeType === 'caregiver'
                        ? 'bg-sky-600/25 border-sky-500 text-sky-300'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    Cuidador / Responsável
                  </button>
                </div>
              </div>

              {/* Atribuição Condicional */}
              {assigneeType === 'child' ? (
                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Selecione a Criança
                  </label>
                  <select
                    value={selectedChildId}
                    onChange={(e) => setSelectedChildId(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 text-slate-350 rounded-xl py-2 px-3 text-sm outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
                  >
                    {children.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Selecione o Cuidador Responsável
                  </label>
                  <select
                    value={selectedCaregiverId}
                    onChange={(e) => setSelectedCaregiverId(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 text-slate-350 rounded-xl py-2 px-3 text-sm outline-none focus:border-sky-500/80 focus:ring-2 focus:ring-sky-500/10 cursor-pointer"
                  >
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
              )}

              {/* Título */}
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Título do Dever / Obrigação
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={assigneeType === 'child' ? "Ex: Fazer dever de casa, Tomar vacina" : "Ex: Comprar remédios, Marcar pediatra"}
                  className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-2 px-3 text-sm outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-700"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Detalhes / Instruções (Opcional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva detalhes como horário, local ou observações importantes..."
                  rows={3}
                  className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-2 px-3 text-sm outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-700 resize-none font-sans"
                />
              </div>

              {/* Pontos Concedidos */}
              {assigneeType === 'child' && (
                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                    Pontos Concedidos *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={points}
                    onChange={(e) => setPoints(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-2 px-3 text-sm outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-700"
                  />
                </div>
              )}

              {/* Recorrência */}
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Frequência / Recorrência
                </label>
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 text-slate-350 rounded-xl py-2.5 px-3 text-sm outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
                >
                  <option value="NONE">Apenas para o Dia</option>
                  <option value="DAILY">Diária (Todo dia)</option>
                  <option value="WEEKLY">Semanal (Toda semana)</option>
                  <option value="MONTHLY">Mensal (Todo mês)</option>
                </select>
              </div>

              {/* Data Limite */}
              {recurrence === 'NONE' && (
                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Data Limite (Opcional)
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 text-slate-300 rounded-xl py-2 px-3 text-sm outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
                  />
                </div>
              )}

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
                    Atribuir Dever
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
