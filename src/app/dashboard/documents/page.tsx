'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Baby, 
  Download, 
  PlusCircle, 
  File, 
  Calendar,
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Trash2,
  FolderOpen,
  X
} from 'lucide-react';

interface Document {
  id: string;
  name: string;
  category: string;
  size: string;
  fileData: string;
  createdAt: string;
  childId: string;
  child: {
    name: string;
  };
}

interface Child {
  id: string;
  name: string;
}

const CATEGORIES = [
  'Identificação',
  'Saúde',
  'Educação',
  'Financeiro',
  'Outros'
];

export default function DocumentsPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Identificação');
  const [documents, setDocuments] = useState<Document[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form Modal States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocCategory, setNewDocCategory] = useState('Identificação');
  const [newDocFileData, setNewDocFileData] = useState('');
  const [newDocSize, setNewDocSize] = useState('');

  const fetchChildrenAndDocs = async () => {
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

      const resDocs = await fetch('/api/documents');
      if (resDocs.ok) {
        const docsData = await resDocs.json();
        setDocuments(docsData);
      }
    } catch (err) {
      console.error('Erro ao carregar dados dos documentos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildrenAndDocs();
  }, []);

  const refreshDocuments = async () => {
    try {
      const resDocs = await fetch('/api/documents');
      if (resDocs.ok) {
        const docsData = await resDocs.json();
        setDocuments(docsData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('O arquivo deve ter no máximo 5MB.');
        return;
      }
      
      // Formata o tamanho legível
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
      const formattedSize = file.size >= 1024 * 1024 ? `${sizeInMB} MB` : `${Math.round(file.size / 1024)} KB`;
      setNewDocSize(formattedSize);
      setNewDocName(file.name);

      const reader = new FileReader();
      reader.onloadend = () => {
        setNewDocFileData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName || !newDocFileData || !selectedChildId) {
      setError('Por favor selecione um arquivo válido.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDocName,
          fileData: newDocFileData,
          category: newDocCategory,
          size: newDocSize,
          childId: selectedChildId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar documento.');

      setSuccess('Documento enviado e catalogado com sucesso!');
      setNewDocName('');
      setNewDocFileData('');
      setNewDocSize('');
      setShowUploadModal(false);
      
      refreshDocuments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Falha ao fazer upload do arquivo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Deseja realmente excluir este documento permanentemente?')) return;

    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSuccess('Documento excluído com sucesso!');
        refreshDocuments();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao excluir documento.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao excluir documento.');
    }
  };

  const activeChild = children.find(c => c.id === selectedChildId);
  const filteredDocs = documents.filter(doc => doc.childId === selectedChildId && doc.category === selectedCategory);

  return (
    <div className="space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Mural e Repositório</p>
          <h1 className="text-2xl font-bold text-white leading-tight">Documentos das Crianças</h1>
        </div>

        {children.length > 0 && (
          <button
            onClick={() => {
              setError('');
              setSuccess('');
              setNewDocName('');
              setNewDocFileData('');
              setNewDocCategory(selectedCategory);
              setShowUploadModal(true);
            }}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 cursor-pointer animate-fade-in"
          >
            <Upload className="w-4 h-4 shrink-0" />
            Enviar Documento
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
          <p className="text-sm text-slate-500 font-medium">Buscando pastas de documentos...</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* 1. Abas por Criança (Tabs por Criança) */}
          <div className="flex flex-wrap gap-2 p-1.5 bg-slate-950/40 border border-slate-800/80 rounded-2xl w-fit">
            {children.map((child) => {
              const isSelected = selectedChildId === child.id;
              return (
                <button
                  key={child.id}
                  onClick={() => setSelectedChildId(child.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-pink-500 to-indigo-500 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Baby className="w-4 h-4 shrink-0" />
                  {child.name}
                </button>
              );
            })}

            {children.length === 0 && (
              <p className="text-xs text-slate-500 px-4 py-2">Nenhuma criança cadastrada ainda.</p>
            )}
          </div>

          {children.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              
              {/* 2. Categorias de Documentos (Pastas Verticais na Esquerda) */}
              <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3 h-fit">
                <h3 className="text-xxs font-bold text-slate-500 uppercase tracking-widest px-2 mb-2">Pastas de Arquivos</h3>
                <div className="space-y-1.5">
                  {CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat;
                    const catCount = documents.filter(doc => doc.childId === selectedChildId && doc.category === cat).length;

                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`
                          w-full flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-left
                          ${isSelected
                            ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-sm'
                            : 'bg-slate-950/40 border-slate-850 hover:border-slate-800 text-slate-400 hover:text-slate-200'
                          }
                        `}
                      >
                        <span className="flex items-center gap-2.5">
                          <FolderOpen className={`w-4.5 h-4.5 shrink-0 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                          {cat}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-900 text-slate-500'}`}>
                          {catCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Visualizador de Arquivos Catalogados */}
              <div className="lg:col-span-3 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col gap-6 min-h-[400px]">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

                <div className="pb-3 border-b border-slate-800/80 flex items-center justify-between gap-4">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    Arquivos em: {selectedCategory} ({activeChild?.name})
                  </h3>
                </div>

                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {filteredDocs.map((doc) => (
                    <div 
                      key={doc.id}
                      className="bg-slate-950/45 border border-slate-800/85 hover:border-indigo-500/20 transition-all rounded-xl p-4 flex items-center justify-between gap-4 group"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                          <File className="w-5 h-5 text-indigo-400" />
                        </div>
                        
                        <div className="overflow-hidden">
                          <h4 className="text-sm font-bold text-white leading-tight truncate group-hover:text-indigo-300 transition-all">
                            {doc.name}
                          </h4>
                          <p className="text-xxs text-slate-500 mt-1.5">
                            Tamanho: {doc.size} • Enviado em: {new Date(doc.createdAt).toLocaleDateString('pt-BR')} às {new Date(doc.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Baixar / Visualizar arquivo Base64 */}
                        <a 
                          href={doc.fileData}
                          download={doc.name}
                          className="p-2 text-slate-400 hover:text-white bg-slate-900/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg transition-all cursor-pointer flex items-center justify-center"
                          title="Baixar Arquivo"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button 
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-2 text-slate-500 hover:text-red-400 bg-slate-900/50 hover:bg-red-950/20 border border-slate-800 hover:border-red-900/30 rounded-lg transition-all cursor-pointer flex items-center justify-center"
                          title="Excluir Arquivo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {filteredDocs.length === 0 && (
                    <div className="py-20 text-center text-slate-500 space-y-3">
                      <FolderOpen className="w-12 h-12 text-slate-800 mx-auto" />
                      <div className="space-y-1">
                        <p className="text-base font-bold text-slate-400">Pasta Vazia</p>
                        <p className="text-xs text-slate-650 max-w-xs mx-auto">Nenhum documento arquivado nesta pasta para {activeChild?.name} ainda.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* MODAL DE UPLOAD DE DOCUMENTO */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
            
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
              <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-400" />
                Enviar Documento ({activeChild?.name})
              </h4>
              <button 
                type="button" 
                onClick={() => setShowUploadModal(false)}
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

            <form onSubmit={handleUploadDocument} className="space-y-4">
              
              {/* File Input */}
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Escolher Arquivo (PDF, Imagens, Docs - Máx 5MB)
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-800 rounded-xl cursor-pointer bg-slate-950/40 hover:bg-slate-950/60 hover:border-indigo-500/50 transition-all p-4">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-slate-650 group-hover:text-indigo-400 mb-2" />
                      <p className="text-xs font-bold text-slate-350 text-center truncate max-w-xs">
                        {newDocName ? newDocName : 'Clique para selecionar arquivo'}
                      </p>
                      {newDocSize && (
                        <p className="text-[10px] text-slate-550 mt-1 font-semibold">Tamanho: {newDocSize}</p>
                      )}
                    </div>
                    <input 
                      type="file" 
                      required
                      onChange={handleFileChange}
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Pasta / Categoria Destino
                </label>
                <select
                  value={newDocCategory}
                  onChange={(e) => setNewDocCategory(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 text-slate-350 rounded-xl py-2.5 px-3 text-sm outline-none focus:border-indigo-500/80 cursor-pointer font-bold"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting || !newDocFileData}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando Arquivo...
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    Catalogar Documento
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
