'use client';

import React, { useState, useEffect } from 'react';
import { 
  Baby, 
  PlusCircle, 
  Calendar, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  User as UserIcon,
  Camera,
  Edit2,
  Lock,
  Mail,
  X,
  Home
} from 'lucide-react';

interface ChildData {
  id: string;
  name: string;
  birthDate: string | null;
  avatarUrl: string | null;
  createdAt: string;
  primaryResidenceId?: string | null;
  primaryResidence?: {
    id: string;
    name: string;
  } | null;
  user?: {
    email: string;
  } | null;
}

export default function ChildrenPage() {
  const [children, setChildren] = useState<ChildData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados do formulário em Modal (Criação / Edição)
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState('');
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [primaryResidenceId, setPrimaryResidenceId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Lista de residências cadastradas para o dropdown
  const [residences, setResidences] = useState<{ id: string; name: string }[]>([]);

  // Busca as crianças da família
  const fetchChildren = async () => {
    try {
      const res = await fetch('/api/children');
      if (!res.ok) throw new Error('Erro ao carregar dados.');
      const data = await res.json();
      setChildren(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchResidences = async () => {
    try {
      const res = await fetch('/api/residences');
      if (res.ok) {
        const data = await res.json();
        setResidences(data);
      }
    } catch (err) {
      console.error('Erro ao buscar residências para seleção:', err);
    }
  };

  useEffect(() => {
    fetchChildren();
    fetchResidences();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('A foto da criança deve ter no máximo 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenEdit = (child: ChildData) => {
    setError('');
    setSuccess('');
    setEditMode(true);
    setEditId(child.id);
    setName(child.name);
    setBirthDate(child.birthDate ? new Date(child.birthDate).toISOString().split('T')[0] : '');
    setAvatarUrl(child.avatarUrl || '');
    setEmail(child.user?.email || '');
    setPrimaryResidenceId(child.primaryResidenceId || '');
    setPassword(''); // Não exibe a senha atual
    setShowForm(true);
  };

  const handleOpenCreate = () => {
    setError('');
    setSuccess('');
    setEditMode(false);
    setEditId('');
    setName('');
    setBirthDate('');
    setAvatarUrl('');
    setEmail('');
    setPrimaryResidenceId('');
    setPassword('');
    setShowForm(true);
  };

  const handleSaveChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    const method = editMode ? 'PUT' : 'POST';
    const payload: any = editMode 
      ? { id: editId, name, birthDate: birthDate || null, avatarUrl: avatarUrl || null, email: email || null, primaryResidenceId: primaryResidenceId || null }
      : { name, birthDate: birthDate || null, avatarUrl: avatarUrl || null, email: email || null, primaryResidenceId: primaryResidenceId || null };

    // Se informou senha, envia no payload
    if (password) {
      payload.password = password;
    }

    try {
      const res = await fetch('/api/children', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erro ao salvar dependente.');

      setSuccess(editMode ? 'Perfil da criança atualizado com sucesso!' : 'Criança cadastrada com sucesso!');
      setName('');
      setBirthDate('');
      setAvatarUrl('');
      setEmail('');
      setPassword('');
      setPrimaryResidenceId('');
      setShowForm(false);
      setEditMode(false);
      fetchChildren(); // Recarrega a lista
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Falha ao salvar cadastro.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Gestão do Sistema</p>
          <h1 className="text-2xl font-bold text-white leading-tight">Crianças e Dependentes</h1>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          Cadastrar Criança
        </button>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 flex items-start gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-200 font-medium leading-relaxed">{success}</p>
        </div>
      )}

      {/* Lista de Crianças (Espaço Total) */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        
        <div className="mb-6">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Baby className="w-4 h-4 text-indigo-400" />
            Dependentes na Família
          </h3>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-sm text-slate-500 font-medium">Carregando lista de crianças...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {children.map((child) => (
              <div 
                key={child.id}
                className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-5 hover:border-indigo-500/30 transition-all group flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-4 overflow-hidden">
                  <div className="w-12 h-12 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shrink-0 overflow-hidden">
                    {child.avatarUrl ? (
                      <img src={child.avatarUrl} alt={child.name} className="w-full h-full object-cover" />
                    ) : (
                      <Baby className="w-6 h-6 text-indigo-400" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-sm font-semibold text-white truncate leading-tight">{child.name}</h4>
                    {child.birthDate ? (
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-600" />
                        {new Date(child.birthDate).toLocaleDateString('pt-BR')}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-650 mt-2">Nascimento não informado</p>
                    )}
                    {child.primaryResidence && (
                      <p className="text-xs text-indigo-400 flex items-center gap-1.5 mt-2 font-medium">
                        <Home className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        Mora fixo: {child.primaryResidence.name}
                      </p>
                    )}
                    {child.user?.email && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-400 text-xxs font-bold uppercase mt-2.5 select-none">
                        Login Ativo
                      </span>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => handleOpenEdit(child)}
                  className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-slate-800/40 rounded-lg transition-all cursor-pointer shrink-0"
                  title="Editar Perfil"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {children.length === 0 && (
              <div className="col-span-full py-12 text-center text-sm text-slate-500">
                Nenhuma criança cadastrada nesta família ainda.
              </div>
            )}
          </div>
        )}

      </div>

      {/* FORMULÁRIO DE CADASTRO/EDIÇÃO EM MODAL FLUTUANTE */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden max-h-[90vh] overflow-y-auto">
            
            {/* Detalhe estético no topo */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
              <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Baby className="w-4 h-4 text-indigo-400" />
                {editMode ? 'Editar Criança' : 'Cadastrar Criança'}
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

            <form onSubmit={handleSaveChild} className="space-y-4">
              
              {/* Foto da Criança */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-full bg-slate-950 border-2 border-slate-800 overflow-hidden flex items-center justify-center relative shadow-md">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <Baby className="w-8 h-8 text-slate-650" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-indigo-600 border border-indigo-500 flex items-center justify-center cursor-pointer shadow-md hover:bg-indigo-500 transition-colors">
                    <Camera className="w-3.5 h-3.5 text-white" />
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden" 
                    />
                  </label>
                </div>
                <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider">Foto de Perfil</span>
              </div>

              {/* Nome Completo */}
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nome Completo
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Pedro Henrique"
                    className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-700"
                  />
                </div>
              </div>

              {/* Data de Nascimento */}
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Data de Nascimento (Opcional)
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 text-slate-350 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 text-slate-300"
                  />
                </div>
              </div>

              {/* Residência Fixa (Novo) */}
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Residência Fixa / Principal
                </label>
                <div className="relative">
                  <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
                  <select
                    value={primaryResidenceId}
                    onChange={(e) => setPrimaryResidenceId(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 text-slate-300 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:border-indigo-500/80 cursor-pointer"
                  >
                    <option value="">Sem residência fixa vinculada</option>
                    {residences.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* CONTA DE LOGIN DA CRIANÇA (NOVO) */}
              <div className="pt-3 border-t border-slate-800 space-y-4">
                <div>
                  <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Acesso ao Painel Lúdico</h5>
                  <p className="text-xxs text-slate-500 mt-1 leading-relaxed">
                    Preencha os campos abaixo para que a criança possa entrar com conta própria (verá apenas tarefas e calendário).
                  </p>
                </div>

                {/* E-mail da Criança */}
                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    E-mail do Dependente (Opcional)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="exemplo@crianca.com"
                      className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-700"
                    />
                  </div>
                </div>

                {/* Senha da Criança */}
                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    {editMode ? 'Redefinir Senha do Dependente (Opcional)' : 'Senha do Dependente (Opcional)'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={editMode ? 'Deixe em branco para manter' : 'Mínimo 6 caracteres'}
                      className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* Botão de Enviar */}
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
                  'Salvar Alterações'
                )}
              </button>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}
