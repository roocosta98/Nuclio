'use client';

import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  PlusCircle, 
  Home, 
  Users, 
  Edit3, 
  Trash2, 
  Loader2, 
  X, 
  Save, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface Caregiver {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: string;
}

interface Residence {
  id: string;
  name: string;
  address: string | null;
  users: Caregiver[];
}

export default function ResidencesPage() {
  const [residences, setResidences] = useState<Residence[]>([]);
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Estados dos modais
  const [modalOpen, setModalOpen] = useState(false);
  const [editingResidence, setEditingResidence] = useState<Residence | null>(null);

  // Estados dos inputs do formulário
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [selectedCaregiverIds, setSelectedCaregiverIds] = useState<string[]>([]);

  const fetchResidences = async () => {
    try {
      const res = await fetch('/api/residences');
      if (res.ok) {
        const data = await res.json();
        setResidences(data);
      }
    } catch (err) {
      console.error('Erro ao carregar residências:', err);
    }
  };

  const fetchCaregivers = async () => {
    try {
      const res = await fetch('/api/cuidadores');
      if (res.ok) {
        const data = await res.json();
        setCaregivers(data);
      }
    } catch (err) {
      console.error('Erro ao carregar cuidadores:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchResidences(), fetchCaregivers()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingResidence(null);
    setName('');
    setAddress('');
    setSelectedCaregiverIds([]);
    setError('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (residence: Residence) => {
    setEditingResidence(residence);
    setName(residence.name);
    setAddress(residence.address || '');
    setSelectedCaregiverIds(residence.users.map(u => u.id));
    setError('');
    setModalOpen(true);
  };

  const handleToggleCaregiver = (caregiverId: string) => {
    setSelectedCaregiverIds(prev => 
      prev.includes(caregiverId) 
        ? prev.filter(id => id !== caregiverId) 
        : [...prev, caregiverId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome da residência é obrigatório.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const isEdit = !!editingResidence;
      const url = isEdit ? `/api/residences/${editingResidence.id}` : '/api/residences';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          address: address.trim() || null,
          userIds: selectedCaregiverIds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar residência.');
      }

      setSuccess(isEdit ? 'Residência atualizada com sucesso!' : 'Residência cadastrada com sucesso!');
      await fetchResidences();
      setModalOpen(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao processar requisição.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (residenceId: string) => {
    if (!confirm('Tem certeza de que deseja excluir esta residência? As crianças associadas a ela ficarão sem residência fixa definida.')) {
      return;
    }

    try {
      const res = await fetch(`/api/residences/${residenceId}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao excluir residência.');
      }

      setSuccess('Residência removida com sucesso!');
      await fetchResidences();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Lares & Cuidadores</p>
          <h1 className="text-2xl font-bold text-white leading-tight">Mapeamento de Residências</h1>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 cursor-pointer w-fit"
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          Nova Residência
        </button>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 flex items-start gap-3 animate-fade-in max-w-3xl">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-200 font-medium leading-relaxed">{success}</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/80 flex items-start gap-3 animate-shake max-w-3xl">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-200 font-medium leading-relaxed">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="py-24 bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm text-slate-500 font-semibold">Carregando residências familiares...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {residences.map((residence) => (
            <div 
              key={residence.id}
              className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:border-indigo-500/30 flex flex-col justify-between gap-5 group hover:shadow-lg hover:shadow-indigo-950/10"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                      <Home className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {residence.name}
                      </h4>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <p className="text-slate-400 flex items-start gap-2 leading-relaxed">
                    <MapPin className="w-4 h-4 text-slate-650 shrink-0 mt-0.5" />
                    {residence.address || <span className="text-slate-600 italic">Endereço não informado</span>}
                  </p>
                </div>

                {/* Cuidadores Vinculados */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-650" />
                    Cuidadores na Residência
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {residence.users.map((c) => (
                      <span 
                        key={c.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/50 border border-slate-850 text-xxs font-bold text-slate-350"
                      >
                        <div className="w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center text-[8px] text-indigo-400 font-extrabold border border-indigo-500/10 select-none">
                          {c.name.substring(0, 2).toUpperCase()}
                        </div>
                        {c.name}
                      </span>
                    ))}
                    {residence.users.length === 0 && (
                      <span className="text-xxs text-slate-600 italic">Sem cuidadores associados</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenEditModal(residence)}
                  className="p-2 text-slate-400 hover:text-white bg-slate-950/40 border border-slate-850 hover:border-slate-750 rounded-lg transition-all cursor-pointer"
                  title="Editar Residência"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(residence.id)}
                  className="p-2 text-slate-450 hover:text-red-400 bg-slate-950/40 border border-slate-850 hover:border-red-950/40 rounded-lg transition-all cursor-pointer"
                  title="Excluir Residência"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {residences.length === 0 && (
            <div className="col-span-full py-16 bg-slate-900/10 border border-dashed border-slate-850 rounded-2xl text-center text-sm text-slate-500 space-y-2">
              <p>Nenhuma residência cadastrada na família ainda.</p>
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1 text-indigo-400 hover:underline font-bold"
              >
                Cadastrar a Primeira Residência
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL DE CADASTRO / EDIÇÃO */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

            {/* Cabeçalho */}
            <div className="p-6 border-b border-slate-800/60 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Home className="w-5 h-5 text-indigo-400" />
                {editingResidence ? 'Editar Residência' : 'Nova Residência'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-550 hover:text-white hover:bg-slate-800/40 rounded-lg cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {error && (
                <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/80 flex items-start gap-3 animate-shake">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-200 font-semibold leading-relaxed">{error}</p>
                </div>
              )}

              {/* Nome */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Identificação da Residência *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Casa da Mãe, Casa do Pai, Casa da Vovó"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-3 px-4 text-sm outline-none focus:border-indigo-500 placeholder:text-slate-700 transition-all"
                />
              </div>

              {/* Endereço */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Endereço Físico (Opcional)
                </label>
                <textarea
                  placeholder="Rua, Número, Bairro, Cidade..."
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-3 px-4 text-sm outline-none focus:border-indigo-500 placeholder:text-slate-700 transition-all resize-none"
                />
              </div>

              {/* Cuidadores Checklist */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Vincular Cuidadores a esta Residência
                </label>
                <p className="text-xxs text-slate-500">
                  Os cuidadores marcados serão associados a esta moradia como moradores ou tutores responsáveis locais.
                </p>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 border border-slate-800/40 p-2.5 rounded-xl bg-slate-950/30">
                  {caregivers.map((c) => {
                    const isChecked = selectedCaregiverIds.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => handleToggleCaregiver(c.id)}
                        className={`
                          p-3 rounded-xl border flex items-center justify-between cursor-pointer select-none transition-all
                          ${isChecked 
                            ? 'bg-indigo-950/20 border-indigo-900/50 text-indigo-300' 
                            : 'bg-slate-950/40 border-slate-850 hover:border-slate-800 text-slate-400'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-750 flex items-center justify-center text-xxs font-bold text-indigo-400">
                            {c.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-200">{c.name}</p>
                            <p className="text-[10px] text-slate-500 lowercase">perfil: {c.role === 'SUPER_ADMIN' ? 'admin geral' : 'responsável'}</p>
                          </div>
                        </div>

                        <div className={`
                          w-5.5 h-5.5 rounded border flex items-center justify-center transition-all
                          ${isChecked ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-750'}
                        `}>
                          {isChecked && <Save className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })}

                  {caregivers.length === 0 && (
                    <p className="text-xs text-slate-600 italic text-center py-6">Nenhum cuidador cadastrado.</p>
                  )}
                </div>
              </div>

              {/* Botões do Rodapé */}
              <div className="pt-4 border-t border-slate-800/60 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-350 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      {editingResidence ? 'Salvar Alterações' : 'Cadastrar Lar'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
