'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  PlusCircle, 
  ShieldCheck, 
  ShieldAlert,
  UserCheck, 
  Mail,
  Lock,
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Baby,
  UserPlus,
  Camera,
  Edit2,
  Phone,
  FileText,
  X,
  User as UserIcon
} from 'lucide-react';

interface CaregiverData {
  id: string;
  name: string;
  email: string;
  role: string;
  cpf: string | null;
  phone: string | null;
  avatarUrl: string | null;
  createdAt: string;
  guardianOf: Array<{
    childId: string;
    relationship: string;
    accessLevel: string;
    child: {
      name: string;
    };
  }>;
}

interface ChildOption {
  id: string;
  name: string;
}

export default function UsersPage() {
  const [caregivers, setCaregivers] = useState<CaregiverData[]>([]);
  const [children, setChildren] = useState<ChildOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados do formulário em Modal (Criação / Edição)
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [relationship, setRelationship] = useState('OUTRO');
  const [accessLevel, setAccessLevel] = useState('READ');
  
  // Estado para múltiplos vínculos de crianças (array de IDs selecionados)
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Busca cuidadores e crianças
  const fetchData = async () => {
    try {
      const [resCuidadores, resChildren] = await Promise.all([
        fetch('/api/cuidadores'),
        fetch('/api/children')
      ]);

      if (resCuidadores.ok) {
        const data = await resCuidadores.json();
        setCaregivers(data);
      }
      if (resChildren.ok) {
        const data = await resChildren.json();
        setChildren(data);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('A foto de perfil deve ter no máximo 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenCreate = () => {
    setError('');
    setSuccess('');
    setEditMode(false);
    setEditId('');
    setName('');
    setEmail('');
    setPassword('');
    setCpf('');
    setPhone('');
    setAvatarUrl('');
    setRelationship('OUTRO');
    setAccessLevel('READ');
    setSelectedChildIds([]);
    setShowForm(true);
  };

  const handleOpenEdit = (cg: CaregiverData) => {
    setError('');
    setSuccess('');
    setEditMode(true);
    setEditId(cg.id);
    setName(cg.name);
    setEmail(cg.email);
    setPassword(''); // Não exibe a senha por motivos de segurança
    setCpf(cg.cpf || '');
    setPhone(cg.phone || '');
    setAvatarUrl(cg.avatarUrl || '');
    
    // Se o cuidador já possui vínculos, carrega o parentesco e nível de acesso do primeiro vínculo
    if (cg.guardianOf && cg.guardianOf.length > 0) {
      setRelationship(cg.guardianOf[0].relationship);
      setAccessLevel(cg.guardianOf[0].accessLevel);
      setSelectedChildIds(cg.guardianOf.map(link => link.childId));
    } else {
      setRelationship('OUTRO');
      setAccessLevel('READ');
      setSelectedChildIds([]);
    }
    setShowForm(true);
  };

  const handleChildCheckboxChange = (childId: string) => {
    if (selectedChildIds.includes(childId)) {
      setSelectedChildIds(selectedChildIds.filter(id => id !== childId));
    } else {
      setSelectedChildIds([...selectedChildIds, childId]);
    }
  };

  const handleSaveCaregiver = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    const method = editMode ? 'PUT' : 'POST';
    
    const payload: any = {
      id: editMode ? editId : undefined,
      name,
      email,
      relationship,
      accessLevel,
      childIds: selectedChildIds,
      cpf: cpf || null,
      phone: phone || null,
      avatarUrl: avatarUrl || null
    };

    if (!editMode) {
      payload.password = password;
    } else if (password) {
      payload.password = password;
    }

    try {
      const res = await fetch('/api/cuidadores', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erro ao salvar cuidador.');

      setSuccess(editMode ? 'Perfil do Cuidador e seus vínculos atualizados com sucesso!' : 'Cuidador cadastrado e vinculado com sucesso!');
      setName('');
      setEmail('');
      setPassword('');
      setCpf('');
      setPhone('');
      setAvatarUrl('');
      setRelationship('OUTRO');
      setAccessLevel('READ');
      setSelectedChildIds([]);
      setShowForm(false);
      setEditMode(false);
      fetchData(); // Recarrega a lista

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Falha ao salvar cuidador.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCaregivers = caregivers.filter(cg => 
    cg.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    cg.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Gestão do Sistema</p>
          <h1 className="text-2xl font-bold text-white leading-tight">Cuidadores e Responsáveis</h1>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 cursor-pointer"
        >
          <UserPlus className="w-4 h-4 shrink-0" />
          Adicionar Cuidador
        </button>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 flex items-start gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-200 font-medium leading-relaxed">{success}</p>
        </div>
      )}

      {/* Lista de Cuidadores (Espaço Total) */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl shadow-xl p-6 relative overflow-hidden">
        
        {/* Barra de Ações */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar cuidador por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-indigo-500/85 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-700"
            />
          </div>
        </div>

        {/* Tabela de Cuidadores */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-sm text-slate-500 font-medium">Carregando cuidadores...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pl-4">Cuidadores / Vínculos</th>
                  <th className="pb-3">E-mail</th>
                  <th className="pb-3">Contato / CPF</th>
                  <th className="pb-3 pr-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredCaregivers.map((cg) => (
                  <tr key={cg.id} className="text-sm text-slate-300 hover:bg-slate-850/10 transition-colors">
                    {/* Avatar e Nome */}
                    <td className="py-4 pl-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-600/10 border border-indigo-500/20 overflow-hidden flex items-center justify-center shrink-0">
                          {cg.avatarUrl ? (
                            <img src={cg.avatarUrl} alt={cg.name} className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon className="w-5 h-5 text-indigo-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-white leading-none">{cg.name}</p>
                            {cg.role === 'SUPER_ADMIN' && (
                              <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-xxs font-extrabold uppercase select-none">Titular</span>
                            )}
                            {cg.role === 'DEPENDENT' && (
                              <span className="px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-400 text-xxs font-extrabold uppercase select-none">Criança</span>
                            )}
                          </div>
                          
                          {cg.guardianOf && cg.guardianOf.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {cg.guardianOf.map((link, idx) => (
                                <span 
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-550/10 text-indigo-400 text-xxs font-bold uppercase tracking-wider"
                                >
                                  {link.relationship} de {link.child.name} ({link.accessLevel})
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xxs text-slate-650 mt-1 block">Sem vínculos ativos</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* E-mail */}
                    <td className="py-4">
                      <div className="flex items-center gap-1.5 text-slate-455 truncate max-w-40" title={cg.email}>
                        <Mail className="w-3.5 h-3.5 text-slate-550 shrink-0" />
                        {cg.email}
                      </div>
                    </td>

                    {/* Contato & CPF */}
                    <td className="py-4 text-slate-400">
                      <div className="space-y-0.5 text-xs">
                        {cg.phone && (
                          <p className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-550 shrink-0" />
                            {cg.phone}
                          </p>
                        )}
                        {cg.cpf && (
                          <p className="flex items-center gap-1">
                            <FileText className="w-3 h-3 text-slate-550 shrink-0" />
                            CPF: {cg.cpf}
                          </p>
                        )}
                        {!cg.phone && !cg.cpf && <span className="text-slate-650 text-xxs">Não informado</span>}
                      </div>
                    </td>

                    {/* Ações */}
                    <td className="py-4 pr-4 text-right">
                      {cg.role !== 'DEPENDENT' ? (
                        <button
                          onClick={() => handleOpenEdit(cg)}
                          className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-slate-800/40 rounded-lg transition-all cursor-pointer"
                          title="Editar Perfil"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-xxs text-slate-650">Gerenciar em Crianças</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredCaregivers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-sm text-slate-500">
                      Nenhum cuidador encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* FORMULÁRIO EM MODAL FLUTUANTE */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden max-h-[90vh] overflow-y-auto">
            
            {/* Detalhe estético no topo */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
              <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                {editMode ? 'Editar Cuidador' : 'Adicionar Cuidador'}
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

            <form onSubmit={handleSaveCaregiver} className="space-y-4">
              
              {/* Foto de Perfil (Base64) */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative group">
                  <div className="w-18 h-18 rounded-full bg-slate-950 border-2 border-slate-800 overflow-hidden flex items-center justify-center relative shadow-md">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-7 h-7 text-slate-650" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 w-6.5 h-6.5 rounded-full bg-indigo-600 border border-indigo-500 flex items-center justify-center cursor-pointer shadow-md hover:bg-indigo-500 transition-colors">
                    <Camera className="w-3 h-3 text-white" />
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden" 
                    />
                  </label>
                </div>
                <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider">Foto do Cuidador</span>
              </div>

              {/* Nome */}
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do cuidador"
                  className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-2 px-3 text-sm outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-700"
                />
              </div>

              {/* E-mail */}
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  E-mail de Acesso
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-2 px-3 text-sm outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-700"
                />
              </div>

              {/* CPF e Telefone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    CPF (Opcional)
                  </label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-2 px-3 text-xs outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Telefone (Opcional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-2 px-3 text-xs outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-700"
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  {editMode ? 'Alterar Senha (Opcional)' : 'Senha Provisória'}
                </label>
                <input
                  type="password"
                  required={!editMode}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editMode ? 'Deixe em branco para manter' : 'Mínimo 6 dígitos'}
                  className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-2.5 px-3 text-sm outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-700"
                />
              </div>

              {/* Parentesco e Acesso */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Parentesco
                  </label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 text-slate-350 rounded-xl py-2 px-2 text-xs outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10"
                  >
                    <option value="PAI">Pai</option>
                    <option value="MAE">Mãe</option>
                    <option value="PADRASTO">Padrasto</option>
                    <option value="MADRASTA">Madrasta</option>
                    <option value="AVO">Avô/Avó</option>
                    <option value="TIO">Tio/Tia</option>
                    <option value="TUTOR_LEGAL">Tutor Legal</option>
                    <option value="OUTRO">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Nível Acesso
                  </label>
                  <select
                    value={accessLevel}
                    onChange={(e) => setAccessLevel(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 text-slate-355 rounded-xl py-2 px-2 text-xs outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10"
                  >
                    <option value="READ">Ver Apenas (Leitura)</option>
                    <option value="WRITE">Pode Criar (Escrita)</option>
                    <option value="FULL">Total (Administrador)</option>
                  </select>
                </div>
              </div>

              {/* Múltiplo Vínculo de Crianças */}
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Vincular a Crianças (Múltipla Seleção)
                </label>
                <div className="max-h-28 overflow-y-auto border border-slate-800 bg-slate-950/50 rounded-xl p-3 space-y-2">
                  {children.map((child) => (
                    <label key={child.id} className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={selectedChildIds.includes(child.id)}
                        onChange={() => handleChildCheckboxChange(child.id)}
                        className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-900 w-4 h-4 cursor-pointer"
                      />
                      {child.name}
                    </label>
                  ))}
                  {children.length === 0 && (
                    <p className="text-xxs text-slate-650 text-center py-2">Nenhuma criança cadastrada para vincular.</p>
                  )}
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
                  'Salvar Cuidador'
                )}
              </button>
            </form>

          </div>

        </div>
      )}

    </div>
  );
}
