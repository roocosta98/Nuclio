'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  Mail, 
  Database, 
  Save, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  Home,
  Users,
  Calendar,
  Sparkles
} from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Estados dos inputs de configuração familiar
  const [familyName, setFamilyName] = useState('');
  const [familyType, setFamilyType] = useState('FAMILIA_UNICA');
  const [custodyOption, setCustodyOption] = useState('7X7');
  const [custodyStartAnchor, setCustodyStartAnchor] = useState('');
  const [custodyStartParent, setCustodyStartParent] = useState('MAE');
  const [custodyWeekendStart, setCustodyWeekendStart] = useState(5); // Default: Sexta-feira
  const [custodyWeekendEnd, setCustodyWeekendEnd] = useState(0);     // Default: Domingo

  // Estados fictícios secundários mantidos para UX de painel completo
  const [jwtExpire, setJwtExpire] = useState('24h');
  const [allowRegistration, setAllowRegistration] = useState(false);
  const [emailSender, setEmailSender] = useState('contato@coparental.com');

  const fetchFamilySettings = async () => {
    try {
      const res = await fetch('/api/family');
      if (res.ok) {
        const data = await res.json();
        setFamilyName(data.name || '');
        setFamilyType(data.familyType || 'FAMILIA_UNICA');
        setCustodyOption(data.custodyOption || '7X7');
        if (data.custodyStartAnchor) {
          setCustodyStartAnchor(new Date(data.custodyStartAnchor).toISOString().split('T')[0]);
        } else {
          setCustodyStartAnchor('');
        }
        setCustodyStartParent(data.custodyStartParent || 'MAE');
        setCustodyWeekendStart(data.custodyWeekendStart !== null && data.custodyWeekendStart !== undefined ? data.custodyWeekendStart : 5);
        setCustodyWeekendEnd(data.custodyWeekendEnd !== null && data.custodyWeekendEnd !== undefined ? data.custodyWeekendEnd : 0);
      }
    } catch (err) {
      console.error('Erro ao buscar dados da família:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFamilySettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');

    try {
      const res = await fetch('/api/family', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: familyName,
          familyType,
          custodyOption: familyType === 'FAMILIA_UNICA' ? null : custodyOption,
          custodyStartAnchor: familyType === 'FAMILIA_UNICA' ? null : (custodyStartAnchor || null),
          custodyStartParent: familyType === 'FAMILIA_UNICA' ? null : custodyStartParent,
          custodyWeekendStart: familyType === 'FAMILIA_UNICA' ? null : Number(custodyWeekendStart),
          custodyWeekendEnd: familyType === 'FAMILIA_UNICA' ? null : Number(custodyWeekendEnd),
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erro ao salvar configurações.');

      setSuccess('Configurações salvas com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar alterações da família.');
    } finally {
      setSaving(false);
    }
  };

  const getCustodyExplanation = (option: string) => {
    switch (option) {
      case '7X7':
        return '🔄 Alternado: A criança passa 7 dias seguidos na residência da Mãe e, após troca (geralmente sexta-feira), 7 dias seguidos com o Pai.';
      case '15X15':
        return '📅 Quinzenal: Trocas a cada duas semanas, permitindo viagens ou períodos mais longos de convivência fixa.';
      case '2X2X3':
        return '☀️ Rotativo 2-2-3: 2 dias com o Pai, 2 dias com a Mãe e 3 dias (fim de semana) alternados. Perfeito para crianças pequenas.';
      case '15D_FDS':
        return '🚗 Fim de Semana Alternado: A criança mora fixamente com a mãe (ou pai) e passa 1 fim de semana completo a cada 15 dias (quinzenal) com o outro responsável.';
      default:
        return '✏️ Personalizado: Defina de forma customizada as datas e escalas de feriados e férias diretamente na agenda.';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Cabeçalho */}
      <div>
        <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Configurações Gerais</p>
        <h1 className="text-2xl font-bold text-white leading-tight">Ajustes do Sistema</h1>
      </div>

      {loading ? (
        <div className="py-24 bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm text-slate-500 font-semibold">Carregando configurações da família...</p>
        </div>
      ) : (
        <div className="max-w-3xl bg-slate-900/40 border border-slate-800 rounded-2xl shadow-xl p-8 relative overflow-hidden">
          
          {/* Detalhe Estético */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 flex items-start gap-3 animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-200 font-medium leading-relaxed">{success}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/80 flex items-start gap-3 animate-shake">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-200 font-medium leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* SEÇÃO 1: NOME E IDENTIFICAÇÃO */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <Home className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">1. Identificador Familiar</h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Nome do Agrupador Familiar
                </label>
                <input
                  type="text"
                  required
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="Ex: Família Silva Santos"
                  className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-3 px-4 text-sm outline-none transition-all focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-700"
                />
              </div>
            </div>

            {/* SEÇÃO 2: TIPO DE FAMÍLIA E GUARDA (NOVO!) */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <Users className="w-4 h-4 text-pink-400 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">2. Arranjo Familiar & Escala de Guarda</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Tipo de Arranjo */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Tipo de Família
                  </label>
                  <select 
                    value={familyType}
                    onChange={(e) => setFamilyType(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 text-slate-200 rounded-xl py-3 px-4 text-sm outline-none transition-all focus:border-indigo-500/80 cursor-pointer"
                  >
                    <option value="FAMILIA_UNICA">Família Única</option>
                    <option value="GUARDA_COMPARTILHADA">Guarda Compartilhada</option>
                    <option value="COPARENTALIDADE">Coparentalidade</option>
                  </select>
                </div>

                {/* Opções de Escala de Guarda (Condicional) */}
                {familyType !== 'FAMILIA_UNICA' && (
                  <div className="animate-fade-in">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Modelo Padrão de Escala
                    </label>
                    <select 
                      value={custodyOption}
                      onChange={(e) => setCustodyOption(e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-800 text-slate-200 rounded-xl py-3 px-4 text-sm outline-none transition-all focus:border-indigo-500/80 cursor-pointer"
                    >
                      <option value="7X7">7 dias Pai / 7 dias Mãe (Alternado)</option>
                      <option value="15X15">15 dias Pai / 15 dias Mãe (Quinzenal)</option>
                      <option value="2X2X3">2 dias Pai / 2 dias Mãe / 3 dias alternados</option>
                      <option value="15D_FDS">1 fim de semana a cada 15 dias (Alternado)</option>
                      <option value="CUSTOM">Personalizado</option>
                    </select>
                  </div>
                )}

                {/* Parâmetros avançados de início da contagem (Condicional) */}
                {familyType !== 'FAMILIA_UNICA' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 col-span-full animate-fade-in pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Data de Início da Contagem da Escala
                      </label>
                      <input 
                        type="date"
                        required
                        value={custodyStartAnchor}
                        onChange={(e) => setCustodyStartAnchor(e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-800 text-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none transition-all focus:border-indigo-500/80 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Quem inicia a escala nesta data?
                      </label>
                      <select 
                        value={custodyStartParent}
                        onChange={(e) => setCustodyStartParent(e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-800 text-slate-200 rounded-xl py-3 px-4 text-sm outline-none transition-all focus:border-indigo-500/80 cursor-pointer"
                      >
                        <option value="MAE">Mãe (Rosa)</option>
                        <option value="PAI">Pai (Azul)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Customização de Fim de Semana (Condicional para 15D_FDS) */}
                {familyType !== 'FAMILIA_UNICA' && custodyOption === '15D_FDS' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 col-span-full animate-fade-in pt-2 border-t border-slate-850 mt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Retirada do Filho (Início)
                      </label>
                      <select 
                        value={custodyWeekendStart}
                        onChange={(e) => setCustodyWeekendStart(Number(e.target.value))}
                        className="w-full bg-slate-950/50 border border-slate-800 text-slate-200 rounded-xl py-3 px-4 text-sm outline-none transition-all focus:border-indigo-500/80 cursor-pointer"
                      >
                        <option value={4}>Quinta-feira</option>
                        <option value={5}>Sexta-feira</option>
                        <option value={6}>Sábado</option>
                        <option value={0}>Domingo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Devolução do Filho (Término)
                      </label>
                      <select 
                        value={custodyWeekendEnd}
                        onChange={(e) => setCustodyWeekendEnd(Number(e.target.value))}
                        className="w-full bg-slate-950/50 border border-slate-800 text-slate-200 rounded-xl py-3 px-4 text-sm outline-none transition-all focus:border-indigo-500/80 cursor-pointer"
                      >
                        <option value={0}>Domingo</option>
                        <option value={1}>Segunda-feira</option>
                        <option value={2}>Terça-feira</option>
                        <option value={3}>Quarta-feira</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Explicação da Escala Ativa */}
              {familyType !== 'FAMILIA_UNICA' && (
                <div className="p-4 bg-indigo-950/15 border border-indigo-900/40 rounded-xl space-y-2 animate-fade-in">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    Funcionamento da Agenda Compartilhada
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                    {getCustodyExplanation(custodyOption)}
                  </p>
                </div>
              )}
            </div>

            {/* SEÇÃO 3: SEGURANÇA E COMUNICAÇÕES (MANTIDO PARA COMPLETUDE DO PAINEL) */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">3. Segurança e Infraestrutura</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Expiração do Token (JWT)
                  </label>
                  <select 
                    value={jwtExpire}
                    onChange={(e) => setJwtExpire(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 text-slate-350 rounded-xl py-3 px-4 text-sm outline-none"
                  >
                    <option value="24h">24 Horas (Recomendado)</option>
                    <option value="7d">7 Dias</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Permitir Registro Público?
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setAllowRegistration(!allowRegistration)}
                      className={`
                        w-12 h-6.5 rounded-full p-1 transition-all duration-200 cursor-pointer outline-none
                        ${allowRegistration ? 'bg-indigo-600' : 'bg-slate-850 border border-slate-800'}
                      `}
                    >
                      <div className={`
                        w-4.5 h-4.5 rounded-full bg-white transition-all duration-200
                        ${allowRegistration ? 'translate-x-5.5' : 'translate-x-0'}
                      `} />
                    </button>
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                      {allowRegistration ? 'Habilitado' : 'Desabilitado'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Botão de Enviar */}
            <div className="pt-6 border-t border-slate-800/80 flex items-center justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer w-full md:w-auto"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Salvando Ajustes...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 shrink-0" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>

          </form>

        </div>
      )}

    </div>
  );
}
