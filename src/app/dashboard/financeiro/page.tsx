'use client';

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  ArrowDownRight, 
  ArrowUpRight, 
  PlusCircle, 
  FileText, 
  Calendar,
  Percent,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Trash2,
  X,
  User,
  Baby,
  RefreshCw,
  Gift,
  Upload
} from 'lucide-react';

interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  paidById: string;
  childId: string;
  expenseType: string;
  recurrence: string;
  toBeSplit: boolean;
  isPaid: boolean;
  receiptData?: string | null;
  paidBy: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
  child: {
    id: string;
    name: string;
  };
}

interface Child {
  id: string;
  name: string;
}

interface Caregiver {
  id: string;
  name: string;
  guardianOf?: Array<{
    relationship: string;
    child: { name: string };
  }>;
}

export default function FinanceiroPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filtros
  const [filterChildId, setFilterChildId] = useState('all');
  const [filterExpenseType, setFilterExpenseType] = useState('all');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [paidById, setPaidById] = useState('');
  const [childId, setChildId] = useState('');
  const [expenseType, setExpenseType] = useState('VARIABLE');
  const [recurrence, setRecurrence] = useState('NONE');
  const [toBeSplit, setToBeSplit] = useState(true);
  const [receiptData, setReceiptData] = useState('');
  const [receiptName, setReceiptName] = useState('');

  // Receipt visualizer and late uploader modal states
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState('');
  const [showUploadReceiptModal, setShowUploadReceiptModal] = useState(false);
  const [uploadingReceiptExpenseId, setUploadingReceiptExpenseId] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resExpenses, resChildren, resCaregivers] = await Promise.all([
        fetch('/api/expenses'),
        fetch('/api/children'),
        fetch('/api/cuidadores')
      ]);

      if (resExpenses.ok) {
        setExpenses(await resExpenses.json());
      }
      if (resChildren.ok) {
        const childrenData = await resChildren.json();
        setChildren(childrenData);
        if (childrenData.length > 0) {
          setChildId(childrenData[0].id);
        }
      }
      if (resCaregivers.ok) {
        const caregiversData = await resCaregivers.json();
        setCaregivers(caregiversData);
        if (caregiversData.length > 0) {
          setPaidById(caregiversData[0].id);
        }
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

  const refreshExpenses = async () => {
    try {
      const res = await fetch('/api/expenses');
      if (res.ok) {
        setExpenses(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('O comprovante deve ter no máximo 5MB.');
        return;
      }
      setReceiptName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadReceipt = async () => {
    if (!uploadingReceiptExpenseId || !receiptData) {
      alert('Selecione um arquivo de comprovante válido.');
      return;
    }

    setUploadingFile(true);
    try {
      const res = await fetch(`/api/expenses/${uploadingReceiptExpenseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptData }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar comprovante.');

      setSuccess('Comprovante enviado e pagamento confirmado com sucesso!');
      setShowUploadReceiptModal(false);
      setUploadingReceiptExpenseId('');
      setReceiptName('');
      setReceiptData('');

      await refreshExpenses();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Falha ao enviar comprovante.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !date || !paidById || !childId) {
      setError('Por favor preencha todos os campos obrigatórios.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          amount: Number(amount),
          date: new Date(date).toISOString(),
          expenseType,
          recurrence: expenseType === 'RECURRENT' ? recurrence : 'NONE',
          childId,
          paidById,
          toBeSplit,
          receiptData: receiptData || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao lançar despesa.');

      setSuccess(receiptData ? 'Despesa lançada e pagamento confirmado!' : 'Despesa lançada com sucesso (Aguardando comprovante)!');
      setDescription('');
      setAmount('');
      setDate('');
      setExpenseType('VARIABLE');
      setRecurrence('NONE');
      setToBeSplit(true);
      setReceiptData('');
      setReceiptName('');
      setShowForm(false);
      
      await refreshExpenses();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Falha ao lançar despesa.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta despesa?')) return;

    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSuccess('Despesa excluída com sucesso!');
        await refreshExpenses();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao excluir despesa.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao conectar com o servidor.');
    }
  };

  // 1. Calcular soma total das despesas filtradas ou gerais no mês (Apenas as confirmadas como pagas)
  const totalAmount = expenses.filter(exp => exp.isPaid).reduce((acc, curr) => acc + curr.amount, 0);

  // 2. Calcular gastos por Cuidador (Splitwise automatizado entre as duas contas principais, apenas despesas PAGAS e COMPARTILHADAS)
  const paymentsByCaregiver: { [name: string]: number } = {};
  caregivers.forEach(cg => {
    paymentsByCaregiver[cg.name] = 0;
  });

  expenses.filter(exp => exp.isPaid && exp.toBeSplit).forEach(exp => {
    const cgName = exp.paidBy?.name;
    if (cgName) {
      paymentsByCaregiver[cgName] = (paymentsByCaregiver[cgName] || 0) + exp.amount;
    }
  });

  // Determinar o acerto de contas (quem deve a quem) se houver pelo menos 2 cuidadores com despesas
  let settlementMessage = 'Tudo equilibrado na divisão!';
  let settlementValue = 0;
  let owesTo = '';
  let owesFrom = '';

  const activeCaregivers = Object.keys(paymentsByCaregiver);
  if (activeCaregivers.length >= 2) {
    // Pegar os dois cuidadores principais
    const cg1 = activeCaregivers[0];
    const cg2 = activeCaregivers[1];
    const val1 = paymentsByCaregiver[cg1];
    const val2 = paymentsByCaregiver[cg2];

    const total = val1 + val2;
    if (total > 0) {
      const fairShare = total / 2;
      if (val1 > val2) {
        settlementValue = val1 - fairShare;
        owesFrom = cg2;
        owesTo = cg1;
        settlementMessage = `${cg2} deve R$ ${settlementValue.toFixed(2).replace('.', ',')} para ${cg1}`;
      } else if (val2 > val1) {
        settlementValue = val2 - fairShare;
        owesFrom = cg1;
        owesTo = cg2;
        settlementMessage = `${cg1} deve R$ ${settlementValue.toFixed(2).replace('.', ',')} para ${cg2}`;
      }
    }
  }

  // Filtrar despesas para a tabela
  const filteredExpenses = expenses.filter(exp => {
    const childMatch = filterChildId === 'all' || exp.childId === filterChildId;
    const typeMatch = filterExpenseType === 'all' || exp.expenseType === filterExpenseType;
    return childMatch && typeMatch;
  });

  return (
    <div className="space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Gestão e Divisão</p>
          <h1 className="text-2xl font-bold text-white leading-tight">Mural Financeiro Compartilhado</h1>
        </div>

        {caregivers.length > 0 && children.length > 0 && (
          <button
            onClick={() => {
              setError('');
              setSuccess('');
              setDescription('');
              setAmount('');
              setDate('');
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 cursor-pointer animate-fade-in"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            Registrar Despesa
          </button>
        )}
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
          <p className="text-sm text-slate-500 font-medium">Buscando lançamentos financeiros...</p>
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in">
          
          {/* Grid de Resumos Financeiros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Total Despesas do Mês */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:border-slate-750 flex flex-col justify-between min-h-[140px]">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <DollarSign className="w-24 h-24 text-indigo-400" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Despesas Totais</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-550/10 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-indigo-400" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">R$ {totalAmount.toFixed(2).replace('.', ',')}</h3>
                <p className="text-[10px] text-slate-500 mt-1">Soma geral de todos os gastos registrados</p>
              </div>
            </div>

            {/* Saldo de Acerto (Splitwise) */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:border-slate-750 flex flex-col justify-between min-h-[140px]">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <ArrowUpRight className="w-24 h-24 text-emerald-400" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saldo de Acerto</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-550/10 flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
              <div>
                {settlementValue > 0 ? (
                  <>
                    <h3 className="text-2xl font-black text-emerald-400">R$ {settlementValue.toFixed(2).replace('.', ',')}</h3>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold leading-snug">{settlementMessage}</p>
                  </>
                ) : (
                  <>
                    <h3 className="text-2xl font-black text-slate-350">R$ 0,00</h3>
                    <p className="text-[10px] text-slate-500 mt-1">Nenhum reembolso pendente. Divisão em 50% em dia!</p>
                  </>
                )}
              </div>
            </div>

            {/* Acordo de Divisão Proporcional */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:border-slate-750 flex flex-col justify-between min-h-[140px]">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Percent className="w-24 h-24 text-purple-400" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Acordo Familiar</span>
                <div className="w-8 h-8 rounded-lg bg-purple-550/10 flex items-center justify-center">
                  <Percent className="w-4 h-4 text-purple-400" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">50% / 50%</h3>
                <p className="text-[10px] text-slate-500 mt-1">Proporção fixada entre os responsáveis para as despesas</p>
              </div>
            </div>

          </div>

          {/* Lista de Lançamentos */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-800/80 pb-4 mb-6">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-indigo-400" />
                Histórico de Lançamentos
              </h3>

              {/* Filtros de Lançamentos */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xxs text-slate-550 font-bold uppercase select-none">Filho:</span>
                  <select
                    value={filterChildId}
                    onChange={(e) => setFilterChildId(e.target.value)}
                    className="bg-slate-950/60 border border-slate-800 text-slate-350 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-indigo-500/80 cursor-pointer font-bold"
                  >
                    <option value="all">Todos</option>
                    {children.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xxs text-slate-550 font-bold uppercase select-none">Tipo:</span>
                  <select
                    value={filterExpenseType}
                    onChange={(e) => setFilterExpenseType(e.target.value)}
                    className="bg-slate-950/60 border border-slate-800 text-slate-350 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-indigo-500/80 cursor-pointer font-bold"
                  >
                    <option value="all">Todas as Despesas</option>
                    <option value="VARIABLE">Despesas Variáveis</option>
                    <option value="RECURRENT">Despesas Recorrentes</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/60 text-xs font-bold text-slate-400 uppercase tracking-wider select-none">
                    <th className="pb-3 pl-4">Descrição / Criança</th>
                    <th className="pb-3">Data</th>
                    <th className="pb-3">Pago Por</th>
                    <th className="pb-3">Divisão</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Tipo / Recorrência</th>
                    <th className="pb-3 text-right">Valor</th>
                    <th className="pb-3 pr-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="text-sm text-slate-350 hover:bg-slate-850/10 transition-colors">
                      <td className="py-4 pl-4 font-semibold text-white">
                        <div className="flex items-center gap-2.5">
                          {exp.description}
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-xxs font-extrabold uppercase select-none">
                            <Baby className="w-2.5 h-2.5" />
                            {exp.child?.name || 'Geral'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 text-slate-450">{new Date(exp.date).toLocaleDateString('pt-BR')}</td>
                      <td className="py-4 text-slate-400 font-bold">{exp.paidBy?.name}</td>
                      <td className="py-4">
                        {exp.toBeSplit ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xxs font-extrabold uppercase select-none">
                            Dividida 50/50
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-xxs font-extrabold uppercase select-none">
                            Individual
                          </span>
                        )}
                      </td>
                      <td className="py-4">
                        {exp.isPaid ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xxs font-black uppercase tracking-wider select-none">
                              Pago
                            </span>
                            {exp.receiptData && (
                              <button
                                onClick={() => {
                                  setViewingReceiptUrl(exp.receiptData || '');
                                  setShowReceiptModal(true);
                                }}
                                className="text-xxs text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer shrink-0"
                              >
                                Ver Comprovante
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-start gap-1">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xxs font-black uppercase tracking-wider select-none animate-pulse">
                              Pendente
                            </span>
                            <button
                              onClick={() => {
                                setUploadingReceiptExpenseId(exp.id);
                                setShowUploadReceiptModal(true);
                              }}
                              className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer shrink-0"
                            >
                              <Upload className="w-2.5 h-2.5" />
                              Confirmar Pago
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-4">
                        {exp.expenseType === 'RECURRENT' ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20 text-xxs font-black uppercase tracking-wider animate-pulse select-none">
                            <RefreshCw className="w-3 h-3 shrink-0" />
                            Recorrente ({exp.recurrence === 'MONTHLY' ? 'Mensal' : exp.recurrence === 'WEEKLY' ? 'Semanal' : 'Fixa'})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-xxs font-black uppercase tracking-wider select-none">
                            Variável
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-right font-black text-white">
                        R$ {exp.amount.toFixed(2).replace('.', ',')}
                      </td>
                      <td className="py-4 pr-4 text-right">
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1.5 hover:bg-red-950/30 rounded-lg text-slate-500 hover:text-red-400 transition-colors cursor-pointer shrink-0"
                          title="Excluir Lançamento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredExpenses.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500 text-sm">
                        Nenhum lançamento financeiro encontrado para os filtros aplicados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* MODAL DE CADASTRO DE DESPESA */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden max-h-[90vh] overflow-y-auto">
            
            {/* Detalhe estético */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
              <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-indigo-400" />
                Registrar Despesa
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

            <form onSubmit={handleCreateExpense} className="space-y-4">
              
              {/* Como será dividida a despesa? (PRIMEIRA PERGUNTA) */}
              <div className="space-y-2">
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider">
                  Como será dividida a despesa? *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setToBeSplit(true)}
                    className={`flex flex-col items-start gap-1 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      toBeSplit
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-black uppercase tracking-wider">Dividir 50% / 50%</span>
                    <span className="text-[10px] opacity-80 leading-normal">Cria duas despesas na metade do valor (uma para cada responsável)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setToBeSplit(false)}
                    className={`flex flex-col items-start gap-1 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      !toBeSplit
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-black uppercase tracking-wider">Lançamento Único</span>
                    <span className="text-[10px] opacity-80 leading-normal">Sem divisão (valor total atribuído ao responsável que pagou)</span>
                  </button>
                </div>
              </div>

              {/* Título / Descrição */}
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Descrição da Despesa *
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Mensalidade Escolar, Farmácia, Tênis de Basquete"
                  className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-2 px-3 text-sm outline-none focus:border-indigo-500/80 placeholder:text-slate-700"
                />
              </div>

              {/* Valor (R$) e Data */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-2 px-3 text-sm outline-none focus:border-indigo-500/80 placeholder:text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Data da Despesa *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 text-slate-350 rounded-xl py-2 px-3 text-sm outline-none focus:border-indigo-500/80 cursor-pointer"
                  />
                </div>
              </div>

              {/* Pago Por e Atribuído ao Filho */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Pago Por (Quem pagou) *
                  </label>
                  <select
                    value={paidById}
                    onChange={(e) => setPaidById(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 text-slate-350 rounded-xl py-2.5 px-3 text-sm outline-none focus:border-indigo-500/80 cursor-pointer font-bold"
                  >
                    {caregivers.map(cg => {
                      let relationText = '';
                      if (cg.guardianOf && cg.guardianOf.length > 0) {
                        const links = cg.guardianOf.map(g => `${g.relationship === 'MAE' ? 'Mãe' : g.relationship === 'PAI' ? 'Pai' : 'Responsável'} de ${g.child.name}`).join(', ');
                        relationText = ` (${links})`;
                      }
                      return (
                        <option key={cg.id} value={cg.id}>{cg.name}{relationText}</option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Atribuído ao Filho *
                  </label>
                  <select
                    value={childId}
                    onChange={(e) => setChildId(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 text-slate-350 rounded-xl py-2.5 px-3 text-sm outline-none focus:border-indigo-500/80 cursor-pointer font-bold"
                  >
                    {children.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tipo de Despesa */}
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Frequência / Tipo de Despesa
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setExpenseType('VARIABLE')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      expenseType === 'VARIABLE'
                        ? 'bg-indigo-600/25 border-indigo-500 text-indigo-300'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    Despesa Variável
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpenseType('RECURRENT')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      expenseType === 'RECURRENT'
                        ? 'bg-pink-600/25 border-pink-500 text-pink-300 animate-pulse'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    Despesa Recorrente
                  </button>
                </div>
              </div>

              {/* Período de Recorrência (Condicional) */}
              {expenseType === 'RECURRENT' && (
                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5 text-pink-400 animate-spin-slow" />
                    Frequência da Recorrência
                  </label>
                  <select
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 text-slate-355 rounded-xl py-2.5 px-3 text-sm outline-none focus:border-indigo-500/80 cursor-pointer font-bold"
                  >
                    <option value="MONTHLY">Mensal (Todo Mês)</option>
                    <option value="WEEKLY">Semanal (Toda Semana)</option>
                  </select>
                </div>
              )}

              {/* Comprovante de Pagamento */}
              <div className="space-y-2">
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider">
                  Comprovante de Pagamento (Opcional)
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-950/65 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer transition-colors active:scale-[0.98]">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    {receiptName ? 'Alterar Comprovante' : 'Selecionar Arquivo'}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={handleReceiptFileChange}
                    />
                  </label>
                  {receiptName && (
                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
                      <span>✓ {receiptName}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setReceiptName('');
                          setReceiptData('');
                        }}
                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 font-medium">A despesa é criada, mas só é confirmada como paga ao enviar o comprovante. Caso contrário, ficará como "Pendente" no acerto.</p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Registrando Despesa...
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    Registrar Despesa
                  </>
                )}
              </button>

            </form>

          </div>

        </div>
      )}

      {/* MODAL PARA VISUALIZAR COMPROVANTE */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
              <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                Comprovante de Pagamento
              </h4>
              <button
                type="button"
                onClick={() => {
                  setShowReceiptModal(false);
                  setViewingReceiptUrl('');
                }}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex flex-col items-center justify-center bg-slate-950/40 border border-slate-800 rounded-xl p-4 max-h-[60vh] overflow-y-auto">
              {viewingReceiptUrl.startsWith('data:image') ? (
                <img
                  src={viewingReceiptUrl}
                  alt="Comprovante"
                  className="max-w-full max-h-[50vh] object-contain rounded-lg shadow"
                />
              ) : (
                <div className="flex flex-col items-center gap-4 py-8">
                  <FileText className="w-16 h-16 text-indigo-400" />
                  <p className="text-sm text-slate-350 font-bold">Arquivo de Comprovante (PDF ou Outro formato)</p>
                  <a
                    href={viewingReceiptUrl}
                    download="comprovante"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition-colors shadow-lg cursor-pointer"
                  >
                    Baixar Documento
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA ENVIAR COMPROVANTE POSTERIORMENTE */}
      {showUploadReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-indigo-500"></div>

            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
              <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-400" />
                Confirmar Pagamento
              </h4>
              <button
                type="button"
                onClick={() => {
                  setShowUploadReceiptModal(false);
                  setUploadingReceiptExpenseId('');
                  setReceiptName('');
                  setReceiptData('');
                }}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Envie o comprovante de pagamento para confirmar esta despesa como <strong>Paga</strong>. Ela será computada no acerto mensal após o envio.
              </p>

              <div className="flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl p-6 bg-slate-950/20">
                <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-950/65 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer transition-colors active:scale-[0.98]">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  {receiptName ? 'Alterar Arquivo' : 'Selecionar Arquivo'}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleReceiptFileChange}
                  />
                </label>
                {receiptName && (
                  <div className="mt-3 text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                    <span>✓ {receiptName}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptName('');
                        setReceiptData('');
                      }}
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={handleUploadReceipt}
                disabled={!receiptData || uploadingFile}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
              >
                {uploadingFile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando Comprovante...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmar Pagamento
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
