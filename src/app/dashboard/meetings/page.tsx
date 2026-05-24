'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessagesSquare, 
  PlusCircle, 
  Calendar, 
  FileText, 
  ClipboardList, 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Trash2,
  Baby,
  ChevronRight,
  BookOpen,
  User
} from 'lucide-react';

interface ChildOption {
  id: string;
  name: string;
}

interface TaskGenerated {
  id: string;
  title: string;
  isCompleted: boolean;
  child?: {
    name: string;
  } | null;
  caregiver?: {
    name: string;
  } | null;
}

interface Meeting {
  id: string;
  title: string;
  date: string;
  minutes: string | null;
  tasks: TaskGenerated[];
  createdAt: string;
}

interface TempTask {
  title: string;
  assigneeType: 'child' | 'caregiver';
  childId: string | null;
  caregiverId: string | null;
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [children, setChildren] = useState<ChildOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados do visualizador de ata
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  // Estados do Modal de Cadastro
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [minutes, setMinutes] = useState('');
  const [tasks, setTasks] = useState<TempTask[]>([]);
  const [caregivers, setCaregivers] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [resMeetings, resChildren, resCaregivers] = await Promise.all([
        fetch('/api/meetings'),
        fetch('/api/children'),
        fetch('/api/cuidadores')
      ]);

      if (resMeetings.ok) {
        const meetingsData = await resMeetings.json();
        setMeetings(meetingsData);
        if (meetingsData.length > 0) {
          setSelectedMeeting(meetingsData[0]);
        }
      }
      if (resChildren.ok) {
        const childrenData = await resChildren.json();
        setChildren(childrenData);
      }
      if (resCaregivers.ok) {
        const caregiversData = await resCaregivers.json();
        setCaregivers(caregiversData);
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

  const handleAddTaskRow = () => {
    setTasks([...tasks, { title: '', assigneeType: 'child', childId: children[0]?.id || '', caregiverId: null }]);
  };

  const handleRemoveTaskRow = (idx: number) => {
    setTasks(tasks.filter((_, i) => i !== idx));
  };

  const handleTaskRowChange = (idx: number, field: keyof TempTask, val: any) => {
    setTasks(tasks.map((t, i) => i === idx ? { ...t, [field]: val } : t));
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          date,
          minutes: minutes || null,
          tasks: tasks.filter(t => t.title && (t.childId || t.caregiverId)),
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erro ao criar reunião.');

      setSuccess('Reunião e tarefas criadas com sucesso!');
      setTitle('');
      setDate('');
      setMinutes('');
      setTasks([]);
      setShowForm(false);
      
      fetchData(); // Recarrega os dados

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Falha ao agendar reunião.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Acordos & Governança</p>
          <h1 className="text-2xl font-bold text-white leading-tight">Reuniões e Atas</h1>
        </div>

        <button
          onClick={() => {
            setError('');
            setSuccess('');
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 cursor-pointer animate-fade-in"
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          Agendar Reunião
        </button>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 flex items-start gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-200 font-medium leading-relaxed">{success}</p>
        </div>
      )}

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Buscando atas de reuniões...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* PAINEL ESQUERDO: LINHA DO TEMPO DE REUNIÕES */}
          <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-6 max-h-[600px] overflow-y-auto pr-2">
            
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider pb-3 border-b border-slate-800/80 flex items-center gap-2">
              <MessagesSquare className="w-4 h-4 text-indigo-400" />
              Histórico de Encontros
            </h3>

            <div className="space-y-4 relative pl-3 border-l-2 border-slate-850">
              {meetings.map((meet) => {
                const isSelected = selectedMeeting?.id === meet.id;
                return (
                  <div 
                    key={meet.id}
                    onClick={() => setSelectedMeeting(meet)}
                    className={`
                      relative p-4 rounded-xl border transition-all cursor-pointer select-none text-left group
                      ${isSelected 
                        ? 'bg-gradient-to-r from-indigo-950/20 to-slate-900/40 border-indigo-500/50 shadow-md' 
                        : 'bg-slate-950/40 border-slate-850 hover:border-slate-800 text-slate-400 hover:text-slate-200'
                      }
                    `}
                  >
                    {/* Indicador de Bola da Timeline */}
                    <span className={`
                      w-3.5 h-3.5 rounded-full absolute -left-[23px] top-1/2 -translate-y-1/2 border-2 transition-all
                      ${isSelected ? 'bg-indigo-500 border-slate-900' : 'bg-slate-950 border-slate-850'}
                    `}></span>

                    <p className="text-xxs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(meet.date).toLocaleDateString('pt-BR')}
                    </p>
                    <h4 className={`text-sm font-bold tracking-tight mt-1 truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                      {meet.title}
                    </h4>
                    
                    {meet.tasks.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-xxs font-bold text-pink-400 bg-pink-500/10 border border-pink-500/20 px-1.5 py-0.5 rounded mt-2.5">
                        <ClipboardList className="w-3 h-3" />
                        {meet.tasks.length} pendências
                      </span>
                    )}
                  </div>
                );
              })}

              {meetings.length === 0 && (
                <p className="text-xs text-slate-550 text-center py-12">Nenhuma reunião registrada ainda.</p>
              )}
            </div>

          </div>

          {/* PAINEL DIREITO: VISUALIZADOR DA ATA SELECIONADA */}
          <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden h-fit flex flex-col gap-6 min-h-[500px]">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

            {selectedMeeting ? (
              <div className="space-y-6">
                
                {/* Cabeçalho da Ata */}
                <div className="pb-4 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xxs font-bold text-indigo-400 uppercase tracking-wider bg-indigo-550/10 border border-indigo-500/20 px-2 py-0.5 rounded flex items-center gap-1.5 w-fit">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(selectedMeeting.date).toLocaleDateString('pt-BR', { dateStyle: 'full' })}
                    </span>
                    <h2 className="text-xl font-bold text-white tracking-tight mt-2 leading-tight">
                      {selectedMeeting.title}
                    </h2>
                  </div>
                  
                  <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider select-none shrink-0">
                    Ata Oficial Família
                  </span>
                </div>

                {/* Conteúdo da Ata */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-400" />
                    Decisões & Histórico da Discussão
                  </h4>
                  <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-5 text-sm text-slate-300 leading-relaxed font-sans min-h-[120px] whitespace-pre-wrap">
                    {selectedMeeting.minutes || 'Nenhuma anotação formalizada nesta ata.'}
                  </div>
                </div>

                {/* Tarefas Originadas */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4 text-pink-400 animate-pulse" />
                    Tarefas Pendentes Geradas nesta Reunião
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedMeeting.tasks.map((task) => (
                      <div 
                        key={task.id}
                        className={`
                          p-4 rounded-xl border flex items-center justify-between gap-3
                          ${task.isCompleted 
                            ? 'bg-slate-950/20 border-emerald-950/40 text-slate-650' 
                            : 'bg-slate-950/45 border-slate-850 text-slate-200'
                          }
                        `}
                      >
                        <div className="overflow-hidden">
                          <h5 className={`text-xs font-bold truncate leading-tight ${task.isCompleted ? 'line-through text-slate-700' : 'text-white'}`}>
                            {task.title}
                          </h5>
                          {task.child ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-xxs font-bold uppercase mt-2">
                              <Baby className="w-3 h-3" />
                              {task.child.name}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 text-xxs font-bold uppercase mt-2">
                              <User className="w-3 h-3" />
                              {task.caregiver?.name || 'Responsável'}
                            </span>
                          )}
                        </div>

                        <span className={`
                          text-xxs font-bold px-2 py-0.5 rounded uppercase tracking-wider select-none
                          ${task.isCompleted ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-900 text-slate-500'}
                        `}>
                          {task.isCompleted ? 'Feito' : 'Pendente'}
                        </span>
                      </div>
                    ))}

                    {selectedMeeting.tasks.length === 0 && (
                      <p className="col-span-full text-xs text-slate-550 text-center py-6">Nenhum compromisso pendente gerado para a família.</p>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="py-24 text-center text-slate-500 space-y-4">
                <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center mx-auto border border-slate-850">
                  <MessagesSquare className="w-8 h-8 text-indigo-400/50" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-bold text-slate-400">Nenhum alinhamento selecionado</p>
                  <p className="text-xs text-slate-650 max-w-xs mx-auto">Selecione uma ata na lateral ou crie uma nova reunião para iniciar.</p>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* FORMULÁRIO DE NOVA REUNIÃO EM MODAL FLUTUANTE */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden max-h-[90vh] overflow-y-auto">
            
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
              <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <MessagesSquare className="w-4 h-4 text-indigo-400" />
                Agendar Reunião & Lavrar Ata
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

            <form onSubmit={handleCreateMeeting} className="space-y-4">
              
              {/* Título */}
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Título da Reunião / Pauta
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Alinhamento Escolar Pedro e Rotinas"
                  className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-2 px-3 text-sm outline-none focus:border-indigo-500/80"
                />
              </div>

              {/* Data e Hora */}
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Data e Hora do Encontro
                </label>
                <input
                  type="datetime-local"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 text-slate-350 rounded-xl py-2 px-3 text-sm outline-none focus:border-indigo-500/80"
                />
              </div>

              {/* Ata / Anotações */}
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Ata da Reunião (Decisões e Acordos)
                </label>
                <textarea
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  placeholder="Digite as decisões tomadas, divisões de tarefas ou recados acordados..."
                  rows={4}
                  className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-2 px-3 text-sm outline-none focus:border-indigo-500/80 resize-none font-sans"
                />
              </div>

              {/* TAREFAS PENDENTES DA REUNIÃO */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="text-xs font-bold text-pink-400 uppercase tracking-wider">Cadastrar Pendências / Tarefas</h5>
                    <p className="text-xxs text-slate-500 mt-0.5">Cadastre deveres originados deste alinhamento para os filhos.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTaskRow}
                    disabled={children.length === 0}
                    className="flex items-center gap-1 text-xxs font-bold bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 active:scale-95 px-2.5 py-1.5 rounded-lg border border-pink-500/20 cursor-pointer select-none transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar Linha
                  </button>
                </div>

                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                  {tasks.map((task, idx) => (
                    <div key={idx} className="flex flex-wrap sm:flex-nowrap gap-2 items-center bg-slate-950/20 p-2 rounded-xl border border-slate-850">
                      {/* Input do Título do Dever */}
                      <input
                        type="text"
                        required
                        placeholder="Ex: Pegar relatório na escola"
                        value={task.title}
                        onChange={(e) => handleTaskRowChange(idx, 'title', e.target.value)}
                        className="flex-1 bg-slate-950/50 border border-slate-800 text-white rounded-lg py-1.5 px-3 text-xs outline-none focus:border-indigo-500 min-w-[120px]"
                      />

                      {/* Tipo de Destinatário */}
                      <select
                        value={task.assigneeType}
                        onChange={(e) => {
                          const type = e.target.value as 'child' | 'caregiver';
                          handleTaskRowChange(idx, 'assigneeType', type);
                          if (type === 'child') {
                            handleTaskRowChange(idx, 'childId', children[0]?.id || '');
                            handleTaskRowChange(idx, 'caregiverId', null);
                          } else {
                            handleTaskRowChange(idx, 'caregiverId', caregivers[0]?.id || '');
                            handleTaskRowChange(idx, 'childId', null);
                          }
                        }}
                        className="bg-slate-950/50 border border-slate-800 text-slate-350 rounded-lg py-1.5 px-2 text-xs outline-none focus:border-indigo-500 cursor-pointer font-bold shrink-0"
                      >
                        <option value="child">Filho</option>
                        <option value="caregiver">Cuidador</option>
                      </select>

                      {/* Seleção de Criança ou Cuidador */}
                      {task.assigneeType === 'child' ? (
                        <select
                          value={task.childId || ''}
                          onChange={(e) => handleTaskRowChange(idx, 'childId', e.target.value)}
                          className="bg-slate-950/50 border border-slate-800 text-slate-350 rounded-lg py-1.5 px-2 text-xs outline-none focus:border-indigo-500 cursor-pointer max-w-[140px] truncate"
                        >
                          {children.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      ) : (
                        <select
                          value={task.caregiverId || ''}
                          onChange={(e) => handleTaskRowChange(idx, 'caregiverId', e.target.value)}
                          className="bg-slate-950/50 border border-slate-800 text-slate-350 rounded-lg py-1.5 px-2 text-xs outline-none focus:border-indigo-500 cursor-pointer max-w-[140px] truncate font-semibold text-slate-400"
                        >
                          {caregivers.map((c) => {
                            let relationText = '';
                            if (c.guardianOf && c.guardianOf.length > 0) {
                              const links = c.guardianOf.map((g: any) => `${g.relationship === 'MAE' ? 'Mãe' : g.relationship === 'PAI' ? 'Pai' : 'Responsável'} de ${g.child.name}`).join(', ');
                              relationText = ` (${links})`;
                            }
                            return (
                              <option key={c.id} value={c.id}>{c.name}{relationText}</option>
                            );
                          })}
                        </select>
                      )}

                      {/* Botão de Excluir */}
                      <button
                        type="button"
                        onClick={() => handleRemoveTaskRow(idx)}
                        className="p-1.5 text-slate-500 hover:text-red-400 rounded transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {tasks.length === 0 && (
                    <p className="text-xxs text-slate-650 text-center py-2">Nenhuma tarefa pendente adicionada à reunião ainda.</p>
                  )}
                </div>
              </div>

              {/* Botões de Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Agendando Reunião...
                  </>
                ) : (
                  'Salvar Reunião & Atas'
                )}
              </button>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}
