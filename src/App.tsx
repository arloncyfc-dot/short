import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { translations, Language } from './i18n';

// Types
interface ShortenedLink {
  id: string;
  originalUrl: string;
  shortUrl: string;
  clicks: number;
  createdAt: string;
  isPremium: boolean;
}

interface User {
  email: string;
  name: string;
  plan: 'free' | 'premium' | 'business';
}

// Context
interface AppContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: typeof translations.id;
  user: User | null;
  setUser: (u: User | null) => void;
  links: ShortenedLink[];
  addLink: (link: ShortenedLink) => void;
  deleteLink: (id: string) => void;
  clearLinks: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

const AppContext = createContext<AppContextType>({} as AppContextType);
const useApp = () => useContext(AppContext);

// Provider
function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('lang') as Language) || 'id';
  });
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [links, setLinks] = useState<ShortenedLink[]>(() => {
    const saved = localStorage.getItem('links');
    return saved ? JSON.parse(saved) : [];
  });
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  useEffect(() => {
    localStorage.setItem('links', JSON.stringify(links));
  }, [links]);

  const t = translations[lang];

  const addLink = (link: ShortenedLink) => {
    setLinks(prev => [link, ...prev]);
  };

  const deleteLink = (id: string) => {
    setLinks(prev => prev.filter(l => l.id !== id));
  };

  const clearLinks = () => {
    setLinks([]);
  };

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <AppContext.Provider value={{ lang, setLang, t, user, setUser, links, addLink, deleteLink, clearLinks, showToast }}>
      {children}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 toast-enter px-6 py-3 rounded-xl shadow-2xl text-white font-medium ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}
    </AppContext.Provider>
  );
}

// Generate short code
function generateShortCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Components
function Navbar() {
  const { lang, setLang, t, user, setUser, clearLinks } = useApp();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showAuth, setShowAuth] = useState<'login' | 'register' | null>(null);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-link text-white text-sm"></i>
              </div>
              <span className="font-bold text-xl text-gray-900">{t.appName}</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#home" className="text-gray-600 hover:text-indigo-600 transition-colors font-medium">{t.home}</a>
              <a href="#features" className="text-gray-600 hover:text-indigo-600 transition-colors font-medium">{t.features}</a>
              <a href="#pricing" className="text-gray-600 hover:text-indigo-600 transition-colors font-medium">{t.pricing}</a>
              {user && <a href="#dashboard" className="text-gray-600 hover:text-indigo-600 transition-colors font-medium">{t.dashboard}</a>}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
                className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium transition-colors"
              >
                {t.language}
              </button>
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    <i className="fas fa-crown text-yellow-500 mr-1"></i>
                    {user.plan === 'free' ? t.free : user.plan === 'premium' ? t.premium : t.business}
                  </span>
                  <button
                    onClick={() => { setUser(null); clearLinks(); }}
                    className="px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-sm font-medium transition-colors"
                  >
                    {t.logout}
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setShowAuth('login')}
                    className="px-4 py-2 rounded-lg text-gray-600 hover:text-indigo-600 text-sm font-medium transition-colors"
                  >
                    {t.login}
                  </button>
                  <button
                    onClick={() => setShowAuth('register')}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
                  >
                    {t.register}
                  </button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <i className={`fas ${mobileMenu ? 'fa-times' : 'fa-bars'} text-gray-600`}></i>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenu && (
          <div className="md:hidden bg-white border-t border-gray-100 py-4 px-4 space-y-3">
            <a href="#home" className="block py-2 text-gray-600 hover:text-indigo-600 font-medium" onClick={() => setMobileMenu(false)}>{t.home}</a>
            <a href="#features" className="block py-2 text-gray-600 hover:text-indigo-600 font-medium" onClick={() => setMobileMenu(false)}>{t.features}</a>
            <a href="#pricing" className="block py-2 text-gray-600 hover:text-indigo-600 font-medium" onClick={() => setMobileMenu(false)}>{t.pricing}</a>
            {user && <a href="#dashboard" className="block py-2 text-gray-600 hover:text-indigo-600 font-medium" onClick={() => setMobileMenu(false)}>{t.dashboard}</a>}
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => { setLang(lang === 'id' ? 'en' : 'id'); setMobileMenu(false); }}
                className="flex-1 px-3 py-2 rounded-lg bg-gray-100 text-sm font-medium"
              >
                {t.language}
              </button>
              {user ? (
                <button
                  onClick={() => { setUser(null); setMobileMenu(false); }}
                  className="flex-1 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-medium"
                >
                  {t.logout}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => { setShowAuth('login'); setMobileMenu(false); }}
                    className="flex-1 px-3 py-2 rounded-lg bg-gray-100 text-sm font-medium"
                  >
                    {t.login}
                  </button>
                  <button
                    onClick={() => { setShowAuth('register'); setMobileMenu(false); }}
                    className="flex-1 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium"
                  >
                    {t.register}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Auth Modal */}
      {showAuth && <AuthModal type={showAuth} onClose={() => setShowAuth(null)} />}
    </>
  );
}

function AuthModal({ type, onClose }: { type: 'login' | 'register'; onClose: () => void }) {
  const { t, setUser, showToast } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'login') {
      if (email && password) {
        setUser({ email, name: email.split('@')[0], plan: 'free' });
        showToast(t.successShorten, 'success');
        onClose();
      } else {
        showToast(t.errorLogin, 'error');
      }
    } else {
      if (email && password && name && password === confirmPassword) {
        setUser({ email, name, plan: 'free' });
        showToast(t.successRegister, 'success');
        onClose();
      } else {
        showToast(t.errorUrl, 'error');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {type === 'login' ? t.loginTitle : t.registerTitle}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <i className="fas fa-times text-gray-400"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.name}</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="input-field"
                required
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.email}</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.password}</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input-field"
              required
            />
          </div>
          {type === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.confirmPassword}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="input-field"
                required
              />
            </div>
          )}
          <button type="submit" className="btn-primary w-full">
            {type === 'login' ? t.loginBtn : t.registerBtn}
          </button>
          <p className="text-center text-sm text-gray-500">
            {type === 'login' ? t.noAccount : t.haveAccount}{' '}
            <button type="button" className="text-indigo-600 font-medium hover:underline">
              {type === 'login' ? t.register : t.login}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

function HeroSection() {
  const { t, addLink, showToast, user } = useApp();
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<ShortenedLink | null>(null);
  const [copied, setCopied] = useState(false);

  const handleShorten = () => {
    if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
      showToast(t.errorUrl, 'error');
      return;
    }

    const newLink: ShortenedLink = {
      id: Date.now().toString(),
      originalUrl: url,
      shortUrl: `https://lnk.pd/${generateShortCode()}`,
      clicks: Math.floor(Math.random() * 100),
      createdAt: new Date().toISOString(),
      isPremium: user?.plan !== 'free',
    };

    addLink(newLink);
    setResult(newLink);
    setUrl('');
    showToast(t.successShorten, 'success');
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section id="home" className="pt-24 pb-16 sm:pt-32 sm:pb-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-cyan-50"></div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse-slow"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse-slow"></div>
      <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse-slow"></div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-full text-indigo-700 text-sm font-medium mb-6">
          <i className="fas fa-bolt"></i>
          {user ? (user.plan === 'free' ? `${t.free} Plan` : `${t.premium} Plan`) : t.free}
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-4 leading-tight">
          {t.heroTitle.split(' ').map((word, i) => (
            <span key={i} className={i === 0 || i === 1 ? 'gradient-text' : ''}>{word} </span>
          ))}
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          {t.heroSubtitle}
        </p>

        {/* URL Input */}
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-3 p-3 bg-white rounded-2xl shadow-xl border border-gray-100">
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder={t.placeholder}
              className="flex-1 px-4 py-3 rounded-xl border-0 focus:ring-2 focus:ring-indigo-200 outline-none text-gray-700 text-base"
              onKeyDown={e => e.key === 'Enter' && handleShorten()}
            />
            <button
              onClick={handleShorten}
              className="btn-primary whitespace-nowrap flex items-center justify-center gap-2"
            >
              <i className="fas fa-scissors"></i>
              {t.shortenBtn}
            </button>
          </div>

          {/* Result */}
          {result && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl animate-float">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-left">
                  <p className="text-sm text-gray-500 truncate max-w-[200px] sm:max-w-xs">{result.originalUrl}</p>
                  <p className="text-indigo-600 font-bold text-lg">{result.shortUrl}</p>
                </div>
                <button
                  onClick={handleCopy}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${copied ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                >
                  {copied ? <><i className="fas fa-check mr-1"></i>{t.copied}</> : <><i className="fas fa-copy mr-1"></i>{t.copyBtn}</>}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-3 gap-4 max-w-lg mx-auto">
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold text-indigo-600">12K+</p>
            <p className="text-sm text-gray-500">{t.statsLinks}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold text-cyan-600">5K+</p>
            <p className="text-sm text-gray-500">{t.statsUsers}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold text-purple-600">1M+</p>
            <p className="text-sm text-gray-500">{t.statsClicks}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const { t } = useApp();

  const features = [
    { icon: 'fa-bolt', title: t.feature1Title, desc: t.feature1Desc, color: 'bg-yellow-100 text-yellow-600' },
    { icon: 'fa-chart-line', title: t.feature2Title, desc: t.feature2Desc, color: 'bg-blue-100 text-blue-600' },
    { icon: 'fa-pen-fancy', title: t.feature3Title, desc: t.feature3Desc, color: 'bg-purple-100 text-purple-600' },
    { icon: 'fa-qrcode', title: t.feature4Title, desc: t.feature4Desc, color: 'bg-green-100 text-green-600' },
    { icon: 'fa-shield-alt', title: t.feature5Title, desc: t.feature5Desc, color: 'bg-red-100 text-red-600' },
    { icon: 'fa-code', title: t.feature6Title, desc: t.feature6Desc, color: 'bg-cyan-100 text-cyan-600' },
  ];

  return (
    <section id="features" className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{t.featuresTitle}</h2>
          <p className="text-lg text-gray-600">{t.featuresSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div key={i} className="card-hover p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                <i className={`fas ${feature.icon} text-xl`}></i>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const { t, user, setUser, showToast } = useApp();

  const plans = [
    {
      name: t.free,
      price: 'Rp 0',
      period: t.perMonth,
      features: [t.freeFeature1, t.freeFeature2, t.freeFeature3, t.freeFeature4, t.freeFeature5],
      color: 'border-gray-200',
      btnClass: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
      popular: false,
      plan: 'free' as const,
    },
    {
      name: t.premium,
      price: 'Rp 49.000',
      period: t.perMonth,
      features: [t.premFeature1, t.premFeature2, t.premFeature3, t.premFeature4, t.premFeature5, t.premFeature6, t.premFeature7],
      color: 'border-indigo-500',
      btnClass: 'bg-indigo-600 text-white hover:bg-indigo-700',
      popular: true,
      plan: 'premium' as const,
    },
    {
      name: t.business,
      price: 'Rp 149.000',
      period: t.perMonth,
      features: [t.bizFeature1, t.bizFeature2, t.bizFeature3, t.bizFeature4, t.bizFeature5, t.bizFeature6, t.bizFeature7, t.bizFeature8],
      color: 'border-purple-500',
      btnClass: 'bg-purple-600 text-white hover:bg-purple-700',
      popular: false,
      plan: 'business' as const,
    },
  ];

  const handleChoose = (plan: 'free' | 'premium' | 'business') => {
    if (!user) {
      showToast(t.errorLogin, 'error');
      return;
    }
    setUser({ ...user, plan });
    showToast(t.successShorten, 'success');
  };

  return (
    <section id="pricing" className="py-16 sm:py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{t.pricingTitle}</h2>
          <p className="text-lg text-gray-600">{t.pricingSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`relative card-hover bg-white rounded-2xl p-6 sm:p-8 border-2 ${plan.color} shadow-sm ${plan.popular ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full">
                  {t.popular}
                </div>
              )}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-end justify-center gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500 text-sm mb-1">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-gray-600">
                    <i className="fas fa-check text-green-500 text-xs"></i>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleChoose(plan.plan)}
                className={`w-full py-3 rounded-xl font-semibold transition-all ${
                  user?.plan === plan.plan
                    ? 'bg-green-100 text-green-700 cursor-default'
                    : plan.btnClass
                }`}
                disabled={user?.plan === plan.plan}
              >
                {user?.plan === plan.plan ? (
                  <><i className="fas fa-check mr-1"></i>{t.currentPlan}</>
                ) : (
                  t.choosePlan
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardSection() {
  const { t, lang, user, links, deleteLink, showToast } = useApp();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!user) {
    return (
      <section id="dashboard" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-lock text-indigo-600 text-2xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.dashboardTitle}</h2>
            <p className="text-gray-600">{t.errorLogin}</p>
          </div>
        </div>
      </section>
    );
  }

  const handleCopy = (shortUrl: string, id: string) => {
    navigator.clipboard.writeText(shortUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: string) => {
    deleteLink(id);
    showToast(t.successDelete, 'success');
  };

  const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0);
  const maxLinks = user.plan === 'free' ? 50 : user.plan === 'premium' ? 500 : 9999;

  return (
    <section id="dashboard" className="py-16 sm:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{t.dashboardTitle}</h2>
            <p className="text-gray-600 mt-1">
              <i className="fas fa-crown text-yellow-500 mr-1"></i>
              {t.currentPlanLabel}: <span className="font-semibold capitalize">{user.plan}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200">
            <span className="text-sm text-gray-600">{t.linksUsed}: {links.length}/{maxLinks}</span>
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all"
                style={{ width: `${Math.min((links.length / maxLinks) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-link text-indigo-600"></i>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{links.length}</p>
                <p className="text-xs text-gray-500">{t.totalLinks}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-mouse-pointer text-green-600"></i>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalClicks}</p>
                <p className="text-xs text-gray-500">{t.totalClicks}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-check-circle text-cyan-600"></i>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{links.length}</p>
                <p className="text-xs text-gray-500">{t.activeLinks}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-times-circle text-red-600"></i>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-xs text-gray-500">{t.expiredLinks}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Links List */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">{t.recentLinks}</h3>
          </div>
          {links.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-inbox text-gray-400 text-xl"></i>
              </div>
              <p className="text-gray-500">{t.noLinks}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {links.map(link => (
                <div key={link.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-indigo-600 font-semibold text-sm sm:text-base truncate">{link.shortUrl}</p>
                      <p className="text-gray-500 text-xs sm:text-sm truncate mt-1">{link.originalUrl}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-400">
                          <i className="fas fa-mouse-pointer mr-1"></i>{link.clicks} {t.clicks}
                        </span>
                        <span className="text-xs text-gray-400">
                          <i className="fas fa-clock mr-1"></i>{new Date(link.createdAt).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(link.shortUrl, link.id)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          copiedId === link.id ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {copiedId === link.id ? <><i className="fas fa-check mr-1"></i>{t.copied}</> : <><i className="fas fa-copy mr-1"></i>{t.copyBtn}</>}
                      </button>
                      <button
                        onClick={() => handleDelete(link.id)}
                        className="px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-medium transition-all"
                      >
                        <i className="fas fa-trash mr-1"></i>{t.deleteBtn}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const { t } = useApp();

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-link text-white text-sm"></i>
              </div>
              <span className="font-bold text-xl">{t.appName}</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">{t.footerDesc}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">{t.quickLinks}</h4>
            <ul className="space-y-2">
              <li><a href="#home" className="text-gray-400 hover:text-white text-sm transition-colors">{t.home}</a></li>
              <li><a href="#features" className="text-gray-400 hover:text-white text-sm transition-colors">{t.features}</a></li>
              <li><a href="#pricing" className="text-gray-400 hover:text-white text-sm transition-colors">{t.pricing}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">{t.about}</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">{t.privacy}</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">{t.terms}</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">{t.contact}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">{t.contact}</h4>
            <ul className="space-y-2">
              <li className="text-gray-400 text-sm flex items-center gap-2">
                <i className="fas fa-envelope"></i> info@linkpendek.id
              </li>
              <li className="text-gray-400 text-sm flex items-center gap-2">
                <i className="fas fa-phone"></i> +62 812-3456-7890
              </li>
              <li className="text-gray-400 text-sm flex items-center gap-2">
                <i className="fas fa-map-marker-alt"></i> Jakarta, Indonesia
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800 text-center">
          <p className="text-gray-400 text-sm">{t.rights}</p>
        </div>
      </div>
    </footer>
  );
}



// Main App
export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-white">
        <Navbar />
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <DashboardSection />
        <Footer />
      </div>
    </AppProvider>
  );
}
