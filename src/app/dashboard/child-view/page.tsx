'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  CheckCircle, 
  Circle, 
  Loader2, 
  Trophy, 
  Star, 
  Calendar,
  AlertCircle,
  Gift,
  History,
  Lock,
  Volume2,
  VolumeX
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string | null;
  isCompleted: boolean;
  dueDate: string | null;
  points: number;
}

interface Reward {
  id: string;
  title: string;
  description: string | null;
  pointsCost: number;
  imageUrl?: string | null;
}

interface Redemption {
  id: string;
  pointsSpent: number;
  status: string;
  createdAt: string;
  reward: {
    title: string;
    description: string | null;
  };
}

export default function ChildViewPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [childProfile, setChildProfile] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [rewardsLoading, setRewardsLoading] = useState(false);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState<'tasks' | 'rewards'>('tasks');
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [speakingTaskId, setSpeakingTaskId] = useState<string | null>(null);

  const speakTask = (taskId: string, title: string, description: string | null) => {
    if (!('speechSynthesis' in window)) {
      alert('Seu navegador não suporta leitura de áudio de tarefas.');
      return;
    }

    if (speakingTaskId === taskId) {
      window.speechSynthesis.cancel();
      setSpeakingTaskId(null);
      return;
    }

    window.speechSynthesis.cancel();
    setSpeakingTaskId(taskId);

    const textToSpeak = `Tarefa: ${title}.${description ? ` Detalhes: ${description}.` : ''}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'pt-BR';

    // Garante que o sotaque seja brasileiro pegando a voz do navegador
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang.includes('pt-BR') || v.lang.includes('pt_BR'));
    if (ptVoice) {
      utterance.voice = ptVoice;
    }

    utterance.onend = () => {
      setSpeakingTaskId(null);
    };

    utterance.onerror = () => {
      setSpeakingTaskId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      if (!res.ok) {
        throw new Error('Falha ao buscar tarefas. Peça para o seu responsável configurar o seu perfil!');
      }
      const data = await res.json();
      setTasks(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados do seu dia.');
    } finally {
      setLoading(false);
    }
  };

  const fetchChildProfileAndRewards = async (userId: string) => {
    try {
      // Buscar crianças da família
      const res = await fetch('/api/children');
      if (res.ok) {
        const data = await res.json();
        const matched = data.find((c: any) => c.userId === userId);
        if (matched) {
          setChildProfile(matched);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
    }
  };

  const fetchRewardsAndRedemptions = async () => {
    try {
      setRewardsLoading(true);
      const [resRewards, resRedemptions] = await Promise.all([
        fetch('/api/rewards'),
        fetch('/api/rewards/redemptions')
      ]);
      if (resRewards.ok) {
        setRewards(await resRewards.json());
      }
      if (resRedemptions.ok) {
        setRedemptions(await resRedemptions.json());
      }
    } catch (err) {
      console.error('Erro ao buscar recompensas:', err);
    } finally {
      setRewardsLoading(false);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      fetchChildProfileAndRewards(parsedUser.id);
    }
    fetchTasks();
  }, []);

  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    // Encontrar tarefa para saber os pontos
    const task = tasks.find(t => t.id === taskId);
    const taskPoints = task ? task.points : 10;

    // 1. Atualização Otimista no State do Cliente para Micro-Animação Instantânea
    setTasks(prevTasks => 
      prevTasks.map(t => t.id === taskId ? { ...t, isCompleted: !currentStatus } : t)
    );

    // Ajustar pontos do perfil otimista
    if (childProfile) {
      setChildProfile((prev: any) => prev ? {
        ...prev,
        points: prev.points + (!currentStatus ? taskPoints : -taskPoints)
      } : null);
    }

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
        throw new Error('Erro ao salvar no servidor.');
      }
    } catch (error) {
      console.error(error);
      // Reverte o status otimista se falhar a chamada HTTP
      setTasks(prevTasks => 
        prevTasks.map(t => t.id === taskId ? { ...t, isCompleted: currentStatus } : t)
      );
      if (childProfile) {
        setChildProfile((prev: any) => prev ? {
          ...prev,
          points: prev.points + (currentStatus ? taskPoints : -taskPoints)
        } : null);
      }
    }
  };

  const handleRedeem = async (rewardId: string, cost: number) => {
    if (!childProfile) return;
    if (childProfile.points < cost) {
      alert('Você não tem pontos suficientes! Faça mais tarefas para ganhar mais pontos! 💪✨');
      return;
    }

    setRedeemingId(rewardId);
    try {
      const res = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao resgatar recompensa.');
      }

      // Atualiza pontos locais
      setChildProfile((prev: any) => prev ? { ...prev, points: data.pointsRemaining } : null);
      
      // Ativa efeito de confete
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);

      // Recarrega as recompensas e históricos
      await fetchRewardsAndRedemptions();
    } catch (err: any) {
      alert(err.message || 'Falha ao resgatar recompensa.');
    } finally {
      setRedeemingId(null);
    }
  };

  const completedCount = tasks.filter(t => t.isCompleted).length;
  const totalCount = tasks.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Frases motivacionais dinâmicas com base no progresso
  const getMotivationMessage = () => {
    if (totalCount === 0) return 'Você não tem tarefas para hoje! Divirta-se! 🎈';
    if (percentage === 100) return 'Incrível! Você completou 100% das tarefas! Você é uma super estrela! 🌟🏆';
    if (percentage >= 50) return 'Muito bem! Metade das tarefas já foi. Falta pouco! 🚀';
    return 'Vamos começar o dia com muita energia! Uma tarefa de cada vez. 💪✨';
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto selection:bg-pink-500 selection:text-white pb-10 animate-fade-in">
      
      {/* Estilos e Simulação de Confete */}
      {showConfetti && (
        <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden flex items-center justify-center">
          <style>{`
            @keyframes confetti-fall {
              0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
              100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
            }
            .confetti-piece {
              position: absolute;
              width: 10px;
              height: 10px;
              background-color: #ffd700;
              animation: confetti-fall 4s linear forwards;
            }
            @keyframes spin-slow {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .animate-spin-slow {
              animation: spin-slow 12s linear infinite;
            }
          `}</style>
          {Array.from({ length: 80 }).map((_, i) => {
            const left = Math.random() * 100;
            const delay = Math.random() * 2;
            const colors = ['#ff69b4', '#ffd700', '#00f5ff', '#ab82ff', '#ff6a6a', '#34d399'];
            const bg = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 8 + 6;
            return (
              <div
                key={i}
                className="confetti-piece"
                style={{
                  left: `${left}%`,
                  animationDelay: `${delay}s`,
                  backgroundColor: bg,
                  width: `${size}px`,
                  height: `${size}px`,
                  borderRadius: Math.random() > 0.5 ? '50%' : '20%',
                }}
              />
            );
          })}
        </div>
      )}

      {/* Decorações Flutuantes Premium com Tons Pastéis e Opacidade */}
      <div className="absolute top-10 left-10 w-48 h-48 bg-pink-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Bloco de Boas-Vindas Lúdico */}
      <div className="bg-gradient-to-br from-indigo-950/20 via-slate-900/40 to-violet-950/15 border border-indigo-900/30 rounded-3xl p-8 relative overflow-hidden shadow-xl">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
        
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="space-y-3 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-xs font-bold text-pink-400">
              <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-spin" />
              Meu Dia Divertido
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Olá, {user?.name || 'Criança'}!
            </h1>
            <p className="text-sm text-slate-300 font-medium leading-relaxed max-w-md">
              {getMotivationMessage()}
            </p>
          </div>

          {/* Troféu ou Estrela Animada de Progresso */}
          <div className="relative shrink-0 flex flex-col gap-2 items-center justify-center bg-slate-950/50 border border-indigo-900/40 w-32 h-32 rounded-2xl shadow-inner p-2 select-none group hover:border-pink-500/30 transition-colors">
            <div className="flex items-center gap-1.5 text-yellow-400">
              <Star className="w-8 h-8 fill-yellow-400 animate-spin-slow" />
              <span className="text-xl font-black tracking-tight text-white">{childProfile?.points ?? 0}</span>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Meus Pontos</span>
          </div>
        </div>

        {/* Barra de Progresso Lúdica */}
        {totalCount > 0 && (
          <div className="mt-8 space-y-2">
            <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-bold text-slate-400">
              <span>{completedCount} feitas ({percentage}%)</span>
              <span>{totalCount - completedCount} faltando</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/80 flex items-start gap-3 animate-shake">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-200 font-semibold leading-relaxed">{error}</p>
        </div>
      )}

      {/* Abas Lúdicas */}
      <div className="flex gap-2 p-1.5 bg-slate-950/40 border border-slate-800/80 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-6 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'tasks'
              ? 'bg-gradient-to-r from-pink-500 to-indigo-500 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Minhas Tarefas
        </button>
        <button
          onClick={() => {
            setActiveTab('rewards');
            fetchRewardsAndRedemptions();
          }}
          className={`px-6 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'rewards'
              ? 'bg-gradient-to-r from-pink-500 to-indigo-500 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Loja de Recompensas
        </button>
      </div>

      {/* Exibição Condicional de Conteúdo */}
      {activeTab === 'tasks' ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <h3 className="text-lg font-bold text-slate-200 tracking-tight mb-6 flex items-center gap-2 border-b border-slate-800/60 pb-3">
            <CheckCircle className="w-5 h-5 text-indigo-400" />
            Minhas Tarefas de Hoje
          </h3>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
              <p className="text-sm text-slate-500 font-bold">Buscando suas tarefas diárias...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div 
                  key={task.id}
                  onClick={() => handleToggleTask(task.id, task.isCompleted)}
                  className={`
                    p-5 rounded-2xl border transition-all flex items-center gap-4 cursor-pointer select-none group
                    ${task.isCompleted 
                      ? 'bg-slate-950/20 border-emerald-950/60 hover:border-emerald-900 text-slate-500' 
                      : 'bg-slate-950/40 border-slate-800 hover:border-indigo-500/30 text-slate-200 hover:shadow-lg hover:shadow-indigo-950/5'
                    }
                  `}
                >
                  {/* Checkbox Visual Lúdico */}
                  <button
                    type="button"
                    className="shrink-0 focus:outline-none"
                  >
                    {task.isCompleted ? (
                      <CheckCircle className="w-7 h-7 text-emerald-400 shrink-0 drop-shadow-[0_0_8px_rgba(52,211,153,0.2)] animate-scale-up" />
                    ) : (
                      <Circle className="w-7 h-7 text-slate-600 group-hover:text-indigo-400 shrink-0 transition-colors" />
                    )}
                  </button>

                  {/* Título e descrição */}
                  <div className="overflow-hidden flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h4 className={`text-base font-bold tracking-tight transition-all truncate leading-tight ${task.isCompleted ? 'line-through text-slate-650' : 'text-slate-100'}`}>
                        {task.title}
                      </h4>

                      {/* Botão de Ouvir a Tarefa */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation(); // Evita marcar a tarefa como concluída ao clicar para ouvir!
                          speakTask(task.id, task.title, task.description);
                        }}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center shrink-0 active:scale-[0.9] ${
                          speakingTaskId === task.id
                            ? 'bg-pink-500/20 border-pink-500/30 text-pink-400 animate-pulse'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/20'
                        }`}
                        title="Ouvir a Tarefa"
                      >
                        {speakingTaskId === task.id ? (
                          <VolumeX className="w-3.5 h-3.5" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {task.points > 0 && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider shrink-0 flex items-center gap-0.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                          +{task.points} pts
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className={`text-xs mt-1 truncate max-w-xl ${task.isCompleted ? 'text-slate-700' : 'text-slate-450'}`}>
                        {task.description}
                      </p>
                    )}
                  </div>

                  {/* Prazo */}
                  {task.dueDate && !task.isCompleted && (
                    <div className="shrink-0 flex items-center gap-1 text-xxs font-bold uppercase tracking-wider text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2.5 py-1 rounded-lg">
                      <Calendar className="w-3 h-3" />
                      {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>
              ))}

              {tasks.length === 0 && (
                <div className="py-16 text-center text-slate-500 space-y-4">
                  <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center mx-auto border border-slate-850">
                    <Sparkles className="w-8 h-8 text-pink-400/50" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-bold text-slate-400">Tudo limpo por aqui!</p>
                    <p className="text-xs text-slate-655 max-w-xs mx-auto">Você não tem tarefas atribuídas para hoje. Divirta-se e brinque bastante! 🎈🧸</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in">
          {/* Loja de Recompensas */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <h3 className="text-lg font-bold text-slate-200 tracking-tight flex items-center gap-2 border-b border-slate-800/60 pb-3">
              <Gift className="w-5 h-5 text-indigo-400" />
              Vitrine de Prêmios
            </h3>

            {rewardsLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
                <p className="text-sm text-slate-500 font-bold">Organizando vitrine de prêmios...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rewards.map((reward) => {
                  const currentPoints = childProfile?.points ?? 0;
                  const canAfford = currentPoints >= reward.pointsCost;
                  const isRedeeming = redeemingId === reward.id;

                  return (
                    <div 
                      key={reward.id}
                      className={`
                        bg-slate-950/45 border rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all relative overflow-hidden group
                        ${canAfford 
                          ? 'border-indigo-800/60 hover:border-indigo-500/40 hover:shadow-lg' 
                          : 'border-slate-800/60 opacity-80'
                        }
                      `}
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-pink-500/5 to-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform"></div>

                      <div className="space-y-4">
                        {reward.imageUrl && (
                          <div className="w-full h-32 bg-slate-900 rounded-xl overflow-hidden border border-slate-800/80">
                            <img src={reward.imageUrl} alt={reward.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-350" />
                          </div>
                        )}
                        <div className="space-y-2">
                          <div className="flex justify-between items-start gap-4">
                            <h4 className="text-base font-bold text-white leading-tight group-hover:text-indigo-300 transition-colors">
                              {reward.title}
                            </h4>
                            <span className="shrink-0 flex items-center gap-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs font-black px-2.5 py-1 rounded-xl">
                              <Star className="w-3.5 h-3.5 fill-yellow-400/20" />
                              {reward.pointsCost} pts
                            </span>
                          </div>
                          {reward.description && (
                            <p className="text-xs text-slate-400 font-medium leading-relaxed">
                              {reward.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleRedeem(reward.id, reward.pointsCost)}
                        disabled={!canAfford || isRedeeming}
                        className={`
                          w-full py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]
                          ${isRedeeming
                            ? 'bg-slate-800 text-slate-450 cursor-not-allowed'
                            : !canAfford
                              ? 'bg-slate-950/80 border border-slate-850 text-slate-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-pink-500 to-indigo-500 hover:from-pink-400 hover:to-indigo-400 text-white shadow-md shadow-pink-500/10'
                          }
                        `}
                      >
                        {isRedeeming ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Resgatando...
                          </>
                        ) : !canAfford ? (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            Falta {reward.pointsCost - currentPoints} pts
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            Resgatar Prêmio!
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}

                {rewards.length === 0 && (
                  <div className="col-span-full py-16 text-center text-slate-500 space-y-2">
                    <Gift className="w-10 h-10 text-slate-700 mx-auto" />
                    <p className="text-base font-bold text-slate-400">Nenhum prêmio cadastrado</p>
                    <p className="text-xs text-slate-655 max-w-xs mx-auto">Peça para os seus pais criarem recompensas legais no gerenciador deles! 🎁🎨</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Histórico de Resgates */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <h3 className="text-lg font-bold text-slate-200 tracking-tight flex items-center gap-2 border-b border-slate-800/60 pb-3">
              <History className="w-5 h-5 text-indigo-400" />
              Meus Prêmios Resgatados
            </h3>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {redemptions.map((red) => {
                const isPending = red.status === 'PENDING';
                const isDelivered = red.status === 'DELIVERED';
                
                return (
                  <div 
                    key={red.id}
                    className="p-4 bg-slate-950/45 border border-slate-800/60 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-white leading-tight">
                          {red.reward.title}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-bold">
                          {new Date(red.createdAt).toLocaleDateString('pt-BR')} às {new Date(red.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {red.reward.description && (
                        <p className="text-xs text-slate-450 truncate max-w-lg">
                          {red.reward.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xxs font-black text-slate-450 uppercase tracking-widest bg-slate-900/80 border border-slate-850 px-2.5 py-1 rounded-xl">
                        Custou {red.pointsSpent} pts
                      </span>
                      
                      {isPending ? (
                        <span className="px-2.5 py-1 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xxs font-black uppercase tracking-wider animate-pulse flex items-center gap-1 select-none">
                          Aguardando pais...
                        </span>
                      ) : isDelivered ? (
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xxs font-black uppercase tracking-wider flex items-center gap-1 select-none">
                          Entregue! 🎉
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xxs font-black uppercase tracking-wider flex items-center gap-1 select-none">
                          Aprovado
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {redemptions.length === 0 && (
                <div className="py-12 text-center text-slate-500">
                  Você ainda não resgatou nenhum prêmio. Comece a ganhar pontos completando suas tarefas! 💪🏆
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
