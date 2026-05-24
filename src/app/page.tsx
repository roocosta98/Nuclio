'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Sparkles, 
  Calendar, 
  DollarSign, 
  Award, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ArrowRight,
  Shield,
  Volume2,
  Users,
  Heart,
  MessageSquare,
  MapPin,
  CheckCircle,
  TrendingUp,
  Target,
  Compass,
  Baby
} from 'lucide-react';
import Logo from '@/components/Logo';

export default function LandingPage() {
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqItems = [
    {
      q: 'O Nuclio é seguro para armazenar documentos pessoais?',
      a: 'Sim, absolutamente. O Nuclio utiliza criptografia avançada de dados no cofre de documentos e separação multi-tenant estrita. Apenas cuidadores principais cadastrados com papel administrativo conseguem visualizar e gerenciar os arquivos anexados.'
    },
    {
      q: 'Como funciona a divisão de despesas 50/50?',
      a: 'Ao lançar um custo (como mensalidades escolares, remédios ou brinquedos), você pode escolher dividi-lo. O Nuclio automaticamente fatia o valor total ao meio gerando duas metades de cobrança. A confirmação definitiva de pagamento no saldo consolidado é computada apenas após o respectivo envio do comprovante bancário.'
    },
    {
      q: 'E se meu filho ainda não souber ler? Como ele acompanha as tarefas?',
      a: 'Pensamos em total inclusividade e autonomia! Nossa plataforma conta com um assistente de voz nativo integrado para acessibilidade infantil. A criança pode simplesmente tocar no ícone de alto-falante na lista de tarefas para ouvir o dever falado por áudio.'
    },
    {
      q: 'Posso convidar outros parentes, motoristas ou terapeutas?',
      a: 'Sim! É super simples adicionar cuidadores secundários para compor sua rede de apoio familiar. Você define níveis de privacidade, permitindo que eles acompanhem a agenda, transição de custódia e horários escolares sem expor dados financeiros.'
    },
    {
      q: 'Existe algum limite de cadastros de filhos ou residências?',
      a: 'Não há limites. O Nuclio foi feito para se adequar ao desenho de qualquer lar brasileiro, permitindo gerenciar rotinas de múltiplos filhos, cadastrar endereços distintos e adicionar cuidadores extras de forma livre e unificada.'
    }
  ];

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const onboardingSteps = [
    {
      title: '👋 Bem-vindo ao Nuclio',
      subtitle: 'Coparentalidade saudável e organizada',
      description: 'Uma plataforma inovadora e lúdica para simplificar a rotina de pais e filhos. Centralize o gerenciamento familiar em um espaço seguro, moderno e projetado para manter a harmonia no dia a dia.',
      icon: <Users className="w-16 h-16 text-indigo-400" />,
      color: 'from-indigo-500/20 to-purple-500/20',
      borderColor: 'border-indigo-500/30'
    },
    {
      title: '📅 Escala de Convivência & Agenda',
      subtitle: 'Organização transparente e sem conflitos',
      description: 'Acompanhe as datas de custódia e visitas de forma automatizada. Adicione compromissos de saúde, reuniões escolares e atividades extracurriculares em um calendário unificado e inteligente para toda a família.',
      icon: <Calendar className="w-16 h-16 text-emerald-400" />,
      color: 'from-emerald-500/20 to-teal-500/20',
      borderColor: 'border-emerald-500/30'
    },
    {
      title: '💰 Despesas Compartilhadas 50/50',
      subtitle: 'Divisão justa e prestação de contas simplificada',
      description: 'Crie despesas e opte por dividir 50% para cada responsável instantaneamente. A despesa é confirmada e dada como paga somente quando o comprovante de pagamento é enviado, garantindo transparência financeira.',
      icon: <DollarSign className="w-16 h-16 text-amber-400" />,
      color: 'from-amber-500/20 to-orange-500/20',
      borderColor: 'border-amber-500/30'
    },
    {
      title: '🏆 Deveres, Gamificação & Acessibilidade',
      subtitle: 'Estimule a autonomia e rotina do seu filho',
      description: 'Crie tarefas e rotinas diárias com recompensas em pontos para a loja de prêmios. Especialmente planejado para os pequenos: se a criança ainda não souber ler, ela pode clicar e ouvir a tarefa por voz com nosso sintetizador de áudio!',
      icon: <Award className="w-16 h-16 text-pink-400" />,
      color: 'from-pink-500/20 to-rose-500/20',
      borderColor: 'border-pink-500/30',
      hasAudioTip: true
    }
  ];

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowOnboarding(false);
      router.push('/login');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setShowOnboarding(false);
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500 selection:text-white relative overflow-x-hidden font-sans flex flex-col justify-between">
      {/* Decorative blurred background lights */}
      <div className="absolute top-0 left-0 w-[50vw] h-[50vw] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[50vw] h-[50vw] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute top-[35%] right-[5%] w-[35vw] h-[35vw] bg-pink-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[65%] left-[5%] w-[40vw] h-[40vw] bg-emerald-500/5 rounded-full blur-[130px] pointer-events-none"></div>

      {/* Header / Navbar */}
      <header className="w-full max-w-7xl mx-auto px-8 py-8 flex items-center justify-between relative z-10 shrink-0">
        <Logo size="md" variant="light" />
        
        <div className="flex items-center gap-6">
          <button 
            onClick={() => { setShowOnboarding(true); setCurrentStep(0); }}
            className="text-sm font-bold text-slate-300 hover:text-white transition-colors cursor-pointer px-4 py-2 hover:bg-slate-900/50 rounded-xl"
          >
            Conhecer Nuclio
          </button>
          <Link 
            href="/login"
            className="px-6 py-3 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-sm font-bold rounded-xl text-indigo-300 hover:text-indigo-200 transition-all active:scale-[0.98] shadow-md cursor-pointer"
          >
            Entrar
          </Link>
          <Link 
            href="/register"
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 text-sm font-bold rounded-xl text-white transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/10 cursor-pointer hidden sm:block"
          >
            Criar Família
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-8 pt-12 pb-24 relative z-10 flex-1 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center w-full">
          {/* Left Column: Text Content */}
          <div className="lg:col-span-7 flex flex-col space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center justify-center lg:justify-start gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-5 py-2 rounded-full text-xs font-bold tracking-wide self-center lg:self-start animate-fade-in shadow-sm">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span>O FUTURO DA COPARENTALIDADE</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black tracking-tight leading-[1.1] bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
              Coparentalidade mais <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent font-black">
                harmônica e integrada
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-400 font-medium max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Simplifique as escalas de visitas, divida despesas financeiras sem ruídos, gerencie deveres com gamificação e garanta acessibilidade e escuta em cada etapa da vida dos seus filhos.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5 pt-4">
              <button 
                onClick={() => { setShowOnboarding(true); setCurrentStep(0); }}
                className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-extrabold rounded-2xl transition-all shadow-xl shadow-indigo-600/25 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-3.5 group text-lg"
              >
                Começar Agora
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1.5 transition-transform" />
              </button>
              <Link 
                href="/register"
                className="w-full sm:w-auto px-10 py-5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 text-slate-350 hover:text-white font-extrabold rounded-2xl transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 text-lg"
              >
                Cadastrar Família
              </Link>
            </div>

            {/* Quick trust metrics */}
            <div className="pt-10 border-t border-slate-900 grid grid-cols-3 gap-10 max-w-xl mx-auto lg:mx-0">
              <div>
                <p className="text-3xl font-black text-indigo-400">100%</p>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-2">Transparente</p>
              </div>
              <div>
                <p className="text-3xl font-black text-emerald-400">50/50</p>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-2">Divisão Finanças</p>
              </div>
              <div>
                <p className="text-3xl font-black text-pink-400">Voz</p>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-2">Acessibilidade</p>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Showcase Mockup */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            {/* Visual Glassmorphic Dashboard mockup */}
            <div className="w-full max-w-[440px] bg-slate-900/40 backdrop-blur-xl border border-slate-800/85 rounded-[32px] p-8 shadow-2xl relative overflow-hidden transition-all duration-500 hover:border-slate-700/60 group hover:shadow-indigo-500/10">
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-indigo-500/50 via-purple-500/50 to-pink-500/50"></div>
              
              {/* Fake Dashboard Header */}
              <div className="flex items-center justify-between pb-6 border-b border-slate-800/60 mb-8">
                <div className="flex items-center gap-3">
                  <Logo size="sm" variant="light" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Painel Nuclio</h4>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Família Unida</p>
                  </div>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              </div>

              {/* Fake Calendar Widget */}
              <div className="space-y-5">
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      Próxima Transição
                    </span>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-300 font-bold px-2.5 py-0.5 rounded-full">Amanhã</span>
                  </div>
                  <p className="text-sm font-bold text-slate-200">Retorno de Custódia com Papai</p>
                  <p className="text-[11px] text-slate-500">Domingo, 24 de Maio às 18:00</p>
                </div>

                {/* Fake Expense Widget */}
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-amber-400" />
                      Mural Financeiro (50% / 50%)
                    </span>
                    <span className="text-[9px] bg-amber-500/10 text-amber-400 font-bold px-2.5 py-0.5 rounded-full">Pendente Comprovante</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-200">Mensalidade do Inglês</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-base font-black text-white">R$ 150,00</span>
                      <span className="text-xs text-slate-500 line-through">R$ 300,00 total</span>
                    </div>
                  </div>
                </div>

                {/* Fake Task Gamification */}
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-2">
                      <Award className="w-4 h-4 text-pink-400" />
                      Deveres & Gamificação
                    </span>
                    <span className="text-[10px] text-pink-300 font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-spin-slow" />
                      +45 pts
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-800/50">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" defaultChecked className="rounded border-slate-800 text-indigo-600 bg-slate-950 focus:ring-0 w-4 h-4 cursor-not-allowed" disabled />
                      <span className="text-xs text-slate-350 line-through decoration-slate-600 font-medium">Arrumar a cama</span>
                    </div>
                    <button className="p-1.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 cursor-not-allowed">
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Float badges around the mockup */}
            <div className="absolute -top-4 -right-4 bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-extrabold text-[10px] uppercase tracking-wider px-4 py-2 rounded-full shadow-lg border border-indigo-400/20 animate-bounce">
              🔒 100% Seguro
            </div>
            <div className="absolute -bottom-4 -left-4 bg-slate-900/90 border border-slate-800 text-xs font-bold text-slate-300 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              Guarda unificada
            </div>
          </div>
        </div>
      </main>

      {/* CORE FEATURES GRID */}
      <section className="bg-slate-950 border-t border-slate-900/60 relative z-10 py-36">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center max-w-3xl mx-auto mb-24">
            <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-widest">FUNCIONALIDADES NUCLEARES</span>
            <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mt-3">
              Um ecossistema completo de convivência
            </h2>
            <p className="text-base text-slate-400 mt-4 leading-relaxed font-medium">
              Desenvolvemos ferramentas robustas de acordo com a realidade das famílias modernas. Tudo simples, prático e auditável.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-900/30 hover:bg-slate-900/50 border border-slate-900 hover:border-slate-800 rounded-3xl p-8 transition-all duration-350 group">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-8 group-hover:scale-105 transition-transform">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Escalas de Convivência</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                Regras claras de finais de semana alternados e datas festivas mapeadas automaticamente no calendário unificado.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-900/30 hover:bg-slate-900/50 border border-slate-900 hover:border-slate-800 rounded-3xl p-8 transition-all duration-350 group">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-8 group-hover:scale-105 transition-transform">
                <DollarSign className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Mural Financeiro 50/50</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                Adicione despesas e divida instantaneamente em metades. Pagamentos comprovados e auditados de forma simples.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-900/30 hover:bg-slate-900/50 border border-slate-900 hover:border-slate-800 rounded-3xl p-8 transition-all duration-350 group">
              <div className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-8 group-hover:scale-105 transition-transform">
                <Award className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Gamificação Infantil</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                Sistemas de deveres que somam pontos. Botões de áudio para crianças ouvirem tarefas mesmo sem saber ler.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-900/30 hover:bg-slate-900/50 border border-slate-900 hover:border-slate-800 rounded-3xl p-8 transition-all duration-350 group">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-8 group-hover:scale-105 transition-transform">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Cofre de Documentos</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                Armazene certidões, carteiras de vacinação, passaportes e RG das crianças em um local seguro e sempre acessível.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* NEW SECTION: ADDITIONAL FEATURES SECTION (Not listed on home page before) */}
      <section className="bg-slate-950/60 border-t border-slate-900/60 relative z-10 py-36">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center max-w-3xl mx-auto mb-24">
            <span className="text-xs font-extrabold text-purple-400 uppercase tracking-widest">AMPLIANDO O SUPORTE</span>
            <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mt-3">
              Muito mais recursos para sua harmonia familiar
            </h2>
            <p className="text-base text-slate-400 mt-4 leading-relaxed font-medium">
              O Nuclio vai além do básico. Oferecemos ferramentas complementares que atendem às complexidades do convívio real.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Additional 1 */}
            <div className="flex gap-6 p-8 bg-slate-900/20 border border-slate-900/80 rounded-3xl hover:border-slate-800 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">Reuniões e Atas de Acordos</h3>
                <p className="text-sm text-slate-400 leading-relaxed font-medium">
                  Agende chamadas ou encontros presenciais importantes. Crie e assine atas digitais em conjunto, formalizando acordos de forma pacífica, transparente e compartilhada.
                </p>
              </div>
            </div>

            {/* Additional 2 */}
            <div className="flex gap-6 p-8 bg-slate-900/20 border border-slate-900/80 rounded-3xl hover:border-slate-800 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">Multi-Residências</h3>
                <p className="text-sm text-slate-400 leading-relaxed font-medium">
                  Cadastre as residências ativas (Casa da Mãe e Casa do Pai) com endereços, regras básicas de convivência, contatos de vizinhos e logística de transição de forma integrada.
                </p>
              </div>
            </div>

            {/* Additional 3 */}
            <div className="flex gap-6 p-8 bg-slate-900/20 border border-slate-900/80 rounded-3xl hover:border-slate-800 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">Loja de Recompensas Customizada</h3>
                <p className="text-sm text-slate-400 leading-relaxed font-medium">
                  Crie prêmios atrativos (como cinema, passeio favorito ou tempo extra de jogo) que os filhos podem resgatar usando a pontuação obtida com o cumprimento dos deveres.
                </p>
              </div>
            </div>

            {/* Additional 4 */}
            <div className="flex gap-6 p-8 bg-slate-900/20 border border-slate-900/80 rounded-3xl hover:border-slate-800 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">Segurança de Dados Familiar</h3>
                <p className="text-sm text-slate-400 leading-relaxed font-medium">
                  Isolamento total dos dados financeiros e documentos. Somente os cuidadores responsáveis possuem credenciais administrativas para gerenciar orçamentos e informações privadas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEW SECTION: USER DASHBOARDS SHOWCASE (Adult vs Child customized views) */}
      <section className="bg-slate-950 border-t border-slate-900/60 relative z-10 py-36">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center max-w-3xl mx-auto mb-24">
            <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-widest font-sans">DUAS EXPERIÊNCIAS INTEGRADAS</span>
            <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent mt-3">
              Painéis sob medida para Cuidadores e Filhos
            </h2>
            <p className="text-base text-slate-400 mt-4 leading-relaxed font-medium">
              O Nuclio oferece duas interfaces totalmente integradas, desenhadas especificamente de acordo com as necessidades e o vocabulário de cada tipo de usuário.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            
            {/* Adult View Dashboard Presentation (Caregivers) */}
            <div className="space-y-8 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-4 py-1.5 rounded-full text-xs font-bold">
                  <Users className="w-4 h-4" />
                  <span>Painel Administrativo do Adulto</span>
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight">Foco em Organização, Finanças e Segurança</h3>
                <p className="text-sm text-slate-400 leading-relaxed font-medium">
                  A área dos pais e cuidadores foi desenhada para centralizar toda a logística familiar com segurança e sem ruído. Acompanhe a custódia, divida despesas com auditoria e gerencie toda a rede de apoio de forma unificada.
                </p>
              </div>

              {/* Adult Dashboard Element Mockups */}
              <div className="p-8 bg-slate-900/20 border border-slate-900 rounded-[32px] space-y-6 relative overflow-hidden group hover:border-slate-800 transition-colors">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-indigo-500/30 to-purple-500/30"></div>
                
                {/* Element 1: Logistic custody */}
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-850 space-y-2">
                  <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-extrabold text-slate-450">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-indigo-400" /> Calendário de Guarda</span>
                    <span className="text-indigo-400">Escala Ativa</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 font-extrabold text-xs">Mãe</div>
                    <div className="text-xs font-bold text-slate-200">Semana Alternada (7x7) • Próxima transição amanhã</div>
                  </div>
                </div>

                {/* Element 2: Financial auditing splits */}
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-850 space-y-2">
                  <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-extrabold text-slate-450">
                    <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Divisão Splitwise 50/50</span>
                    <span className="bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded text-[8px]">Comprovante Pendente</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-slate-200">Mensalidade Escolar</p>
                      <p className="text-[10px] text-slate-500">Valor Total: R$ 300,00 • Sua metade: R$ 150,00</p>
                    </div>
                    <span className="text-xs font-black text-white">R$ 150,00</span>
                  </div>
                </div>

                {/* Element 3: Encrypted Document Vault */}
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-850 space-y-2">
                  <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-extrabold text-slate-450">
                    <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-purple-400" /> Cofre Criptografado</span>
                    <span className="text-purple-400 font-bold text-[9px] flex items-center gap-1">🔒 Seguro</span>
                  </div>
                  <div className="flex items-center justify-between text-xs p-2 bg-slate-900/60 rounded-xl border border-slate-800/50">
                    <span className="font-bold text-slate-350 truncate">Carteira_Vacinacao_Julia.pdf</span>
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider">Acessar</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Child View Dashboard Presentation (Dependent/Kids) */}
            <div className="space-y-8 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-500/20 text-pink-300 px-4 py-1.5 rounded-full text-xs font-bold">
                  <Baby className="w-4 h-4" />
                  <span>Painel Lúdico da Criança</span>
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight">Gamificação, Prêmios e Acessibilidade por Voz</h3>
                <p className="text-sm text-slate-400 leading-relaxed font-medium">
                  A interface dos filhos foi desenhada de forma super lúdica e simplificada para incentivar a autonomia. As crianças ganham moedas ao completar rotinas diárias e contam com leitor de áudio para quem ainda não sabe ler.
                </p>
              </div>

              {/* Child Dashboard Element Mockups */}
              <div className="p-8 bg-slate-900/20 border border-slate-900 rounded-[32px] space-y-6 relative overflow-hidden group hover:border-slate-800 transition-colors">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-pink-500/30 to-purple-500/30"></div>
                
                {/* Element 1: Interactive task chores with Voice reader */}
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-850 space-y-3">
                  <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-extrabold text-slate-450">
                    <span className="flex items-center gap-1.5 text-pink-400"><Award className="w-3.5 h-3.5" /> Deveres do Dia</span>
                    <span className="text-pink-400 font-bold">+15 Pts</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-800/50">
                    <div className="flex items-center gap-2.5">
                      <input type="checkbox" className="rounded border-slate-800 text-pink-500 bg-slate-950 focus:ring-0 w-4 h-4 cursor-not-allowed" disabled />
                      <span className="text-xs font-bold text-slate-200">Arrumar meu quarto</span>
                    </div>
                    <button className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400 animate-pulse">
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Element 2: Coins chest / gamification points */}
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-850 space-y-2">
                  <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-extrabold text-slate-450">
                    <span className="flex items-center gap-1.5 text-amber-400">⭐ Meu Baú de Moedas</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🏆</span>
                    <div>
                      <p className="text-base font-black text-white">350 Moedas de Ouro</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Acumuladas este mês! Complete tarefas para ganhar mais</p>
                    </div>
                  </div>
                </div>

                {/* Element 3: Reward unlock shop items */}
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-850 space-y-2.5">
                  <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-extrabold text-slate-450">
                    <span className="flex items-center gap-1.5 text-indigo-400">🎁 Loja de Prêmios Nuclio</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-900/40 rounded-xl border border-slate-800/40">
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-200">Sessão de Cinema Completa</p>
                      <p className="text-[9px] text-slate-500">Custo: 100 Moedas</p>
                    </div>
                    <button className="px-3 py-1 bg-gradient-to-r from-pink-500 to-indigo-500 text-[10px] font-bold rounded-lg text-white">Desbloquear</button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* NEW SECTION: WHY CHOOSE NUCLIO (Reasons & Differentiators) */}
      <section className="bg-slate-950 border-t border-slate-900/60 relative z-10 py-36">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            {/* Left Column: Heading and graphics */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-extrabold text-amber-400 uppercase tracking-widest">DIFERENCIAIS NÚCLEO</span>
              <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent leading-tight">
                Por que escolher o Nuclio como base?
              </h2>
              <p className="text-base text-slate-400 leading-relaxed font-medium">
                Desenvolvemos o Nuclio porque acreditamos que a tecnologia tem o dever de construir pontes, simplificar atritos e proteger as relações familiares.
              </p>
              
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm text-slate-200 font-bold">Redução de atritos de rotina em até 90%</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm text-slate-200 font-bold">Total transparência na divisão financeira</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm text-slate-200 font-bold">Ambiente seguro com gamificação educacional</span>
                </div>
              </div>
            </div>

            {/* Right Column: Key differentiators grid */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* Diff 1 */}
              <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-3xl space-y-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Automatização Logística</h3>
                <p className="text-xs text-slate-450 leading-relaxed font-medium">
                  Evite discussões intermináveis sobre datas. Nosso algoritmo inteligente assume a escala baseando-se nas preferências estabelecidas.
                </p>
              </div>

              {/* Diff 2 */}
              <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-3xl space-y-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Transparência Auditável</h3>
                <p className="text-xs text-slate-450 leading-relaxed font-medium">
                  Cada movimentação financeira ou transição de compromissos é registrada. Sem conversas perdidas, sem incertezas nas metades das despesas.
                </p>
              </div>

              {/* Diff 3 */}
              <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-3xl space-y-3">
                <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400">
                  <Volume2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Acessibilidade Total</h3>
                <p className="text-xs text-slate-450 leading-relaxed font-medium">
                  O Nuclio ouve e fala. Crianças que ainda não sabem ler podem tocar no ícone e ouvir a voz da tarefa, estimulando autonomia e responsabilidade.
                </p>
              </div>

              {/* Diff 4 */}
              <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-3xl space-y-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Rede de Apoio Ativa</h3>
                <p className="text-xs text-slate-450 leading-relaxed font-medium">
                  Integre avós, tios, motoristas e cuidadores de forma controlada. Delegue acessos de visualização para que todos joguem no mesmo time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEW SECTION: VISION & MISSION (Visão e Missão da plataforma) */}
      <section className="bg-slate-950/60 border-t border-slate-900/60 relative z-10 py-36">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center max-w-3xl mx-auto mb-24">
            <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest">CONEXÃO E FUTURO</span>
            <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent mt-3">
              O coração da nossa jornada
            </h2>
            <p className="text-base text-slate-400 mt-4 leading-relaxed font-medium">
              Conheça as diretrizes que impulsionam o Nuclio na construção de ferramentas pacíficas de integração.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Missão Card */}
            <div className="bg-slate-900/20 border border-slate-900 hover:border-slate-800/80 rounded-[32px] p-10 relative overflow-hidden group transition-all duration-350">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Target className="w-32 h-32 text-indigo-400" />
              </div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight">Nossa Missão</h3>
              </div>
              <p className="text-base text-slate-350 leading-relaxed font-medium">
                Transformar a coparentalidade de um desafio logístico tenso em uma jornada colaborativa harmoniosa. Garantimos que o desenvolvimento emocional e a segurança das crianças sejam preservados por meio de processos digitais altamente organizados, justos, transparentes e focados no diálogo construtivo.
              </p>
            </div>

            {/* Visão Card */}
            <div className="bg-slate-900/20 border border-slate-900 hover:border-slate-800/80 rounded-[32px] p-10 relative overflow-hidden group transition-all duration-350">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Compass className="w-32 h-32 text-emerald-400" />
              </div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Compass className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight">Nossa Visão</h3>
              </div>
              <p className="text-base text-slate-350 leading-relaxed font-medium">
                Ser a principal referência global em soluções digitais de integração familiar e guarda compartilhada. Almejamos erradicar ruídos operacionais de coparentalidade, promovendo ambientes saudáveis de convivência mútua e empoderando os filhos com tecnologias acessíveis, inclusivas, intuitivas e seguras.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-slate-950 border-t border-slate-900/60 relative z-10 py-24">
        <div className="max-w-4xl mx-auto px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-widest">DÚVIDAS FREQUENTES</span>
            <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent mt-3">
              Perguntas & Respostas
            </h2>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, idx) => (
              <div 
                key={idx} 
                className="bg-slate-900/20 border border-slate-900 rounded-2xl overflow-hidden transition-colors hover:border-slate-800"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left p-6 flex justify-between items-center gap-4 hover:bg-slate-900/30 transition-colors cursor-pointer"
                >
                  <span className="text-sm sm:text-base font-bold text-slate-200">{item.q}</span>
                  <span className="text-indigo-400 shrink-0">
                    {openFaq === idx ? (
                      <X className="w-5 h-5 text-indigo-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-500" />
                    )}
                  </span>
                </button>
                
                {openFaq === idx && (
                  <div className="p-6 pt-0 text-xs sm:text-sm text-slate-400 leading-relaxed font-semibold border-t border-slate-900/30 animate-fade-in">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900/80 py-16 bg-black/60 relative z-10">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <Logo size="md" variant="light" />
          
          <p className="text-sm text-slate-500 font-bold flex items-center flex-wrap justify-center gap-1.5 leading-relaxed">
            Desenvolvido com 
            <Heart className="w-4.5 h-4.5 text-rose-500 animate-pulse fill-rose-500 mx-0.5" /> 
            por{' '}
            <a 
              href="https://tagashira.tech" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4 decoration-indigo-400/40 hover:decoration-indigo-300 font-black transition-colors"
            >
              Tagashira.tech
            </a>{' '}
            © 2026 nuclio. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* OVERLAY SPLASH ONBOARDING MODAL CAROUSEL */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur with fade anim */}
          <div 
            onClick={handleSkip}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md cursor-pointer"
          ></div>

          {/* Modal Container */}
          <div className="w-full max-w-lg bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative z-10 animate-fade-in flex flex-col max-h-[90vh]">
            {/* Top color bar indicator based on slide index */}
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

            {/* Close Button */}
            <button 
              onClick={handleSkip}
              className="absolute top-4 right-4 p-2 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Main Carousel Slides area */}
            <div className="p-8 flex-1 overflow-y-auto space-y-6">
              <div className="flex flex-col items-center text-center space-y-6">
                {/* Slide Custom Icon with visual bubble */}
                <div className={`p-6 rounded-2xl bg-gradient-to-tr ${onboardingSteps[currentStep].color} border ${onboardingSteps[currentStep].borderColor} shadow-inner animate-scale-in`}>
                  {onboardingSteps[currentStep].icon}
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] tracking-wider uppercase font-extrabold text-indigo-400">
                    Módulo de Integração • Passo {currentStep + 1} de {onboardingSteps.length}
                  </span>
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    {onboardingSteps[currentStep].title}
                  </h3>
                  <p className="text-xs font-bold text-slate-450">
                    {onboardingSteps[currentStep].subtitle}
                  </p>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed font-medium max-w-sm">
                  {onboardingSteps[currentStep].description}
                </p>

                {onboardingSteps[currentStep].hasAudioTip && (
                  <div className="flex items-center gap-2 bg-pink-500/10 border border-pink-500/20 text-pink-300 px-3 py-1.5 rounded-lg text-xs font-bold animate-pulse">
                    <Volume2 className="w-4 h-4 shrink-0" />
                    <span>Acessível para crianças em alfabetização</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Navigation Bar */}
            <div className="p-6 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between">
              {/* Dots progress indicator */}
              <div className="flex gap-2">
                {onboardingSteps.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentStep(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                      currentStep === idx 
                        ? 'bg-indigo-400 w-6' 
                        : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                  ></button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <button
                    onClick={handleBack}
                    className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Voltar
                  </button>
                )}
                
                {currentStep < onboardingSteps.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    Avançar
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link
                      href="/login"
                      onClick={() => setShowOnboarding(false)}
                      className="px-4 py-2.5 bg-slate-900 border border-slate-800 text-xs font-bold text-indigo-400 hover:text-indigo-300 rounded-xl transition-all active:scale-95 cursor-pointer text-center"
                    >
                      Já tenho Conta
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setShowOnboarding(false)}
                      className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-xs font-bold text-white rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer text-center"
                    >
                      Criar Família
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
