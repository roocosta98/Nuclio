'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Trophy, 
  Star, 
  Gift, 
  CheckCircle2, 
  Loader2, 
  PlusCircle, 
  AlertCircle, 
  X, 
  Check, 
  Trash2, 
  Calendar,
  ClipboardList
} from 'lucide-react';

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
  child: {
    name: string;
  };
}

export default function RewardsAdminPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pointsCost, setPointsCost] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [resRewards, resRedemptions] = await Promise.all([
        fetch('/api/rewards'),
        fetch('/api/rewards/redemptions')
      ]);

      if (resRewards.ok) {
        const rewardsData = await resRewards.json();
        setRewards(rewardsData);
      }
      if (resRedemptions.ok) {
        const redemptionsData = await resRedemptions.json();
        setRedemptions(redemptionsData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !pointsCost) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || null,
          pointsCost: Number(pointsCost),
          imageUrl: imageUrl || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar prêmio.');

      setSuccess('Prêmio cadastrado com sucesso!');
      setTitle('');
      setDescription('');
      setPointsCost('');
      setImageUrl('');
      setShowForm(false);
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Falha ao cadastrar prêmio.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReward = async (id: string) => {
    if (!confirm('Deseja realmente remover esta recompensa?')) return;

    try {
      const res = await fetch(`/api/rewards/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        loadData();
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao remover prêmio.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao remover prêmio.');
    }
  };

  const handleApproveRedemption = async (redemptionId: string) => {
    try {
      const res = await fetch('/api/rewards/redemptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: redemptionId,
          status: 'DELIVERED',
        }),
      });

      if (res.ok) {
        setSuccess('Parabéns! Recompensa marcada como entregue!');
        loadData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao processar entrega.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao conectar com o servidor.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Gamificação & Estímulo</p>
          <h1 className="text-2xl font-bold text-white leading-tight">Painel de Recompensas</h1>
        </div>

        <button
          onClick={() => {
            setError('');
            setSuccess('');
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          Novo Prêmio
        </button>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 flex items-start gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-200 font-medium leading-relaxed">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Painel Esquerdo: Lista de Recompensas */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between gap-6 min-h-[400px]">
          
          <div className="space-y-4 w-full">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800/80 pb-4">
              <Gift className="w-4 h-4 text-indigo-400" />
              Recompensas Cadastradas
            </h3>

            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="text-sm text-slate-500 font-medium">Carregando prêmios...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
                {rewards.map((reward) => (
                  <div 
                    key={reward.id}
                    className="p-4 rounded-xl border bg-slate-950/45 border-slate-800/60 hover:border-slate-700 text-slate-200 hover:shadow-lg transition-all group flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                        {reward.imageUrl ? (
                          <img src={reward.imageUrl} alt={reward.title} className="w-full h-full object-cover" />
                        ) : (
                          <Gift className="w-6 h-6 text-slate-655" />
                        )}
                      </div>
                      
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-400 text-xxs font-extrabold uppercase shrink-0 flex items-center gap-1 select-none">
                            <Star className="w-3 h-3 fill-pink-500/30" />
                            {reward.pointsCost} pts
                          </span>
                          <h4 className="text-sm font-bold text-slate-100 truncate">{reward.title}</h4>
                        </div>
                        {reward.description && (
                          <p className="text-xs mt-1 truncate max-w-xs text-slate-500">
                            {reward.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteReward(reward.id)}
                      className="p-1.5 hover:bg-red-950/30 rounded-lg text-slate-500 hover:text-red-400 transition-colors shrink-0 cursor-pointer"
                      title="Excluir Recompensa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {rewards.length === 0 && (
                  <div className="col-span-full py-16 text-center text-slate-500 text-sm">
                    Nenhuma recompensa cadastrada. Crie um prêmio lúdico para estimular as crianças! 🌟
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Painel Direito: Histórico de Resgates */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden h-fit space-y-6">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

          <div>
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              Solicitações de Resgate
            </h4>
            <p className="text-xxs text-slate-500 leading-relaxed">
              Resgates efetuados pelas crianças que precisam ser aprovados ou entregues.
            </p>
          </div>

          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
            {redemptions.map((red) => {
              const isPending = red.status === 'PENDING';
              return (
                <div 
                  key={red.id}
                  className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 space-y-3"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xxs font-extrabold bg-indigo-500/10 text-indigo-400 uppercase tracking-wider">
                      {red.child.name}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xxs font-extrabold uppercase tracking-wider ${
                      isPending 
                        ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' 
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {isPending ? 'Pendente' : 'Entregue'}
                    </span>
                  </div>

                  <h5 className="text-xs font-bold text-white tracking-tight leading-tight">{red.reward.title}</h5>

                  <div className="space-y-1 text-xxs text-slate-500">
                    <p className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-slate-650 shrink-0" />
                      Gastou {red.pointsSpent} pontos
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-650 shrink-0" />
                      {new Date(red.createdAt).toLocaleDateString('pt-BR')} às {new Date(red.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {isPending && (
                    <button
                      onClick={() => handleApproveRedemption(red.id)}
                      className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xxs tracking-wider uppercase rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Entregar Prêmio
                    </button>
                  )}
                </div>
              );
            })}

            {redemptions.length === 0 && (
              <div className="py-12 text-center text-slate-500 text-xs italic">
                Nenhum resgate efetuado ainda.
              </div>
            )}
          </div>

        </div>

      </div>

      {/* MODAL DE CADASTRO DE RECOMPENSA */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
            
            {/* Detalhe estético */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
              <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Gift className="w-4 h-4 text-indigo-400" />
                Cadastrar Prêmio
              </h4>
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
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

            <form onSubmit={handleCreateReward} className="space-y-4">
              
              {/* Foto / Imagem do Prêmio (Base64) */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative group">
                  <div className="w-20 h-20 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center relative shadow-md">
                    {imageUrl ? (
                      <img src={imageUrl} alt="Imagem do Prêmio" className="w-full h-full object-cover animate-fade-in" />
                    ) : (
                      <Gift className="w-8 h-8 text-slate-700 group-hover:text-indigo-400 transition-colors" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-indigo-600 border border-indigo-500 flex items-center justify-center cursor-pointer shadow-md hover:bg-indigo-500 transition-colors">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 2 * 1024 * 1024) {
                            setError('A imagem do prêmio deve ter no máximo 2MB.');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setImageUrl(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden" 
                    />
                  </label>
                </div>
                <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider">Imagem do Prêmio (Opcional)</span>
              </div>
              
              {/* Título */}
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Título do Prêmio *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Escolher filme da noite, Ganhar sobremesa"
                  className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-2 px-3 text-sm outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-700"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Descrição (Opcional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva detalhes ou regras lúdicas do prêmio..."
                  rows={2}
                  className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-2 px-3 text-sm outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-700 resize-none font-sans"
                />
              </div>

              {/* Custo em Pontos */}
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Custo em Pontos *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={pointsCost}
                  onChange={(e) => setPointsCost(e.target.value)}
                  placeholder="Ex: 100"
                  className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-2 px-3 text-sm outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-700"
                />
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
                    Salvar Recompensa
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
