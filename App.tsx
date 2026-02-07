
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, ShoppingCart, Trash2, MessageCircle, X, 
  UserCircle, Sparkles, ArrowRight, Package, 
  CheckCircle2, Plus, Minus, Loader2, LogOut, 
  Copy, Gift, ShieldCheck, Info, Phone, CreditCard, Wallet
} from 'lucide-react';
import { PRODUCTS as FALLBACK_PRODUCTS, CATEGORIES } from './constants';
import { Product, Distributor, CartItem } from './types';
import { supabase } from './supabase';
import { obtenerProductos } from './productos.service';
import { loginConEmail, loginConTelefono, obtenerUsuarioActual, cerrarSesion } from './auth.service';

// --- COMPONENTS ---

const KopparaLogo = ({ className = "h-12" }: { className?: string }) => {
  const [imgError, setImgError] = useState(false);
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {!imgError ? (
        <img 
          src="assets/images/logo_koppara.png" 
          alt="Koppara Logo" 
          className="h-full w-auto object-contain"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-koppara-green rounded-full flex items-center justify-center text-white font-bold">K</div>
          <span className="text-2xl font-bold text-koppara-gray tracking-tight font-sans">Koppara</span>
        </div>
      )}
    </div>
  );
};

const formatCurrency = (val: number) => `$${val.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
const getWhatsAppLink = (phone: string, message: string) => `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;

// --- MODALS ---

const LoginModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [metodo, setMetodo] = useState<'email' | 'telefono'>('email');
  const [contacto, setContacto] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);
    try {
      if (metodo === 'email') {
        await loginConEmail(contacto);
        setMensaje({ text: '✅ Revisa tu email para el link de acceso', type: 'success' });
      } else {
        await loginConTelefono(contacto);
        setMensaje({ text: '✅ Revisa tu WhatsApp para el código de acceso', type: 'success' });
      }
    } catch (error: any) {
      setMensaje({ text: '❌ Error: ' + error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-[2rem] p-10 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-300 hover:text-slate-600"><X size={24} /></button>
        <div className="text-center mb-8">
          <KopparaLogo className="h-10 mx-auto mb-6" />
          <h2 className="text-2xl font-bold font-display text-slate-800">Acceso Distribuidora</h2>
          <p className="text-slate-400 text-sm mt-2">Gestiona tu red y catálogo digital.</p>
        </div>

        <div className="flex gap-2 mb-6 bg-slate-50 p-1 rounded-xl">
          <button onClick={() => setMetodo('email')} className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${metodo === 'email' ? 'bg-white text-koppara-green shadow-sm' : 'text-slate-400'}`}>Email</button>
          <button onClick={() => setMetodo('telefono')} className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${metodo === 'telefono' ? 'bg-white text-koppara-green shadow-sm' : 'text-slate-400'}`}>WhatsApp</button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type={metodo === 'email' ? 'email' : 'tel'} 
            placeholder={metodo === 'email' ? 'tu@email.com' : '+52 477 123 4567'} 
            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-4 outline-none focus:border-koppara-green transition"
            value={contacto}
            onChange={(e) => setContacto(e.target.value)}
            required
          />
          <button type="submit" disabled={loading} className="w-full bg-koppara-green text-white py-4 rounded-xl font-bold shadow-lg shadow-koppara-green/20 hover:bg-koppara-forest transition active:scale-95 disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Empezar a Vender'}
          </button>
        </form>

        {mensaje && (
          <p className={`mt-6 text-center text-sm font-medium ${mensaje.type === 'success' ? 'text-koppara-forest' : 'text-red-500'}`}>
            {mensaje.text}
          </p>
        )}
      </div>
    </div>
  );
};

const CheckoutModal: React.FC<{ 
  plan: string; 
  precio: number; 
  codigoReferido?: string | null;
  onClose: () => void;
  onSuccess: (data: any) => void;
}> = ({ plan, precio, codigoReferido, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '', email: '', telefono: '', direccion: '', ciudad: '', cp: '', metodo: 'card'
  });

  const finalPrice = codigoReferido ? precio * 0.9 : precio;

  const handlePay = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      onSuccess({ ...formData, plan, monto: finalPrice });
    } catch (e) {
      alert("Error al procesar el registro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn font-sans">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        <div className="bg-slate-900 text-white p-10 md:w-1/3 flex flex-col justify-between">
          <div>
            <div className="mb-8 opacity-50"><KopparaLogo className="h-6 filter brightness-0 invert" /></div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-koppara-green mb-2">Registro de Socia</p>
            <h3 className="text-2xl font-bold font-display mb-6">Plan {plan}</h3>
            <div className="space-y-4 mb-8 text-sm">
              <div className="flex justify-between opacity-60"><span>Subtotal</span><span>{formatCurrency(precio)}</span></div>
              {codigoReferido && (
                <div className="flex justify-between text-koppara-green"><span>Ref. 10% Off</span><span>-{formatCurrency(precio * 0.1)}</span></div>
              )}
              <div className="h-px bg-white/10 my-4" />
              <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{formatCurrency(finalPrice)}</span></div>
            </div>
          </div>
          <div className="text-[10px] opacity-40 leading-relaxed">Pago seguro con encriptación de 256 bits.</div>
        </div>

        <div className="p-10 flex-1 overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <div className="flex gap-2">
              {[1, 2, 3].map(s => (
                <div key={s} className={`h-1.5 w-8 rounded-full transition-all ${step >= s ? 'bg-koppara-green' : 'bg-slate-100'}`} />
              ))}
            </div>
            <button onClick={onClose} className="text-slate-300 hover:text-red-500"><X size={24}/></button>
          </div>

          {step === 1 && (
            <div className="animate-fadeIn space-y-4">
              <h4 className="text-xl font-bold text-slate-800 mb-2 font-display">Información Personal</h4>
              <input placeholder="Nombre Completo" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
              <input placeholder="Email" type="email" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              <input placeholder="WhatsApp" type="tel" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
              <button onClick={() => setStep(2)} disabled={!formData.nombre || !formData.email || !formData.telefono} className="w-full mt-4 bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50">Continuar <ArrowRight size={18} /></button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fadeIn space-y-4">
              <h4 className="text-xl font-bold text-slate-800 mb-2 font-display">Dirección de Envío</h4>
              <input placeholder="Calle y Número" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Ciudad" className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3" value={formData.ciudad} onChange={e => setFormData({...formData, ciudad: e.target.value})} />
                <input placeholder="C.P." className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3" value={formData.cp} onChange={e => setFormData({...formData, cp: e.target.value})} />
              </div>
              <div className="flex gap-4 mt-4">
                <button onClick={() => setStep(1)} className="flex-1 border border-slate-100 py-4 rounded-xl text-slate-400">Volver</button>
                <button onClick={() => setStep(3)} className="flex-[2] bg-slate-900 text-white py-4 rounded-xl font-bold">Método de Pago</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fadeIn space-y-4">
              <h4 className="text-xl font-bold text-slate-800 mb-4 font-display">Finalizar Pago</h4>
              <button onClick={() => setFormData({...formData, metodo: 'card'})} className={`w-full p-4 rounded-xl border flex items-center justify-between ${formData.metodo === 'card' ? 'border-koppara-green bg-koppara-green/5' : 'border-slate-100'}`}>
                <div className="flex items-center gap-4"><CreditCard className="text-slate-400" /> <span className="text-sm font-bold">Tarjeta Crédito/Débito</span></div>
                <div className={`w-4 h-4 rounded-full border-2 ${formData.metodo === 'card' ? 'border-koppara-green bg-koppara-green' : 'border-slate-200'}`} />
              </button>
              <button onClick={() => setFormData({...formData, metodo: 'transfer'})} className={`w-full p-4 rounded-xl border flex items-center justify-between ${formData.metodo === 'transfer' ? 'border-koppara-green bg-koppara-green/5' : 'border-slate-100'}`}>
                <div className="flex items-center gap-4"><Wallet className="text-slate-400" /> <span className="text-sm font-bold">Transferencia SPEI</span></div>
                <div className={`w-4 h-4 rounded-full border-2 ${formData.metodo === 'transfer' ? 'border-koppara-green bg-koppara-green' : 'border-slate-200'}`} />
              </button>
              <button onClick={handlePay} disabled={loading} className="w-full mt-6 bg-koppara-green text-white py-5 rounded-2xl font-bold shadow-xl shadow-koppara-green/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
                {loading ? 'Procesando...' : `Pagar ${formatCurrency(finalPrice)}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---

export default function App() {
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [user, setUser] = useState<any>(null);
  const [distributor, setDistributor] = useState<Distributor | null>(null);
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('koppara_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isCartAnimating, setIsCartAnimating] = useState(false);
  const [currentView, setCurrentView] = useState<'catalog' | 'socias' | 'join'>('catalog');
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [selectedCheckoutPlan, setSelectedCheckoutPlan] = useState<{name: string, price: number} | null>(null);

  useEffect(() => {
    // Cargar productos de Supabase
    async function loadProducts() {
      try {
        const data = await obtenerProductos();
        if (data && data.length > 0) setProducts(data);
      } catch (err) {
        console.warn("Supabase no disponible. Usando catálogo de respaldo.");
      }
    }
    loadProducts();

    // Persistencia de Carrito
    localStorage.setItem('koppara_cart', JSON.stringify(cart));

    // Detección de Referido
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferralCode(ref);
      setCurrentView('join');
    }

    // Auth Observer
    obtenerUsuarioActual().then(u => setUser(u)).catch(() => {});

    // Scroll Observer
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [cart]);

  const handleAddToCart = (product: Product) => {
    setIsCartAnimating(true);
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
    setTimeout(() => setIsCartAnimating(false), 600);
  };

  const handleLogout = async () => {
    try { await cerrarSesion(); } catch (e) {}
    setUser(null);
    setDistributor(null);
    setCurrentView('catalog');
  };

  const handleCheckoutSuccess = (data: any) => {
    const newSocia: Distributor = {
      name: data.nombre, phone: data.telefono, email: data.email, isSocia: true,
      nivel: data.plan as any,
      codigoReferido: data.nombre.split(' ')[0].toUpperCase() + Math.floor(1000 + Math.random() * 9000),
      referidosActivos: 0, gananciasAcumuladas: 0
    };
    setDistributor(newSocia);
    setSelectedCheckoutPlan(null);
    setCurrentView('socias');
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter(p => {
      const matchesCategory = activeCategory === 'Todos' || p.category === activeCategory;
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery, products]);

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-white font-sans text-koppara-gray">
      {/* Official Header */}
      <header className={`no-print sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'py-2' : 'py-6 px-4 md:px-12'}`}>
        <div className={`max-w-7xl mx-auto flex items-center justify-between rounded-full floating-nav transition-all duration-300 ${scrolled ? 'px-6 py-2 border-b' : 'px-8 py-4 border border-slate-100 shadow-lg'}`}>
          <nav className="hidden lg:flex items-center gap-8 text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] flex-1">
            <button onClick={() => setCurrentView('catalog')} className={`hover:text-koppara-green transition ${currentView === 'catalog' ? 'text-koppara-green' : ''}`}>Catálogo</button>
            <button onClick={() => setCurrentView(distributor?.isSocia ? 'socias' : 'join')} className={`hover:text-koppara-green transition ${currentView === 'socias' || currentView === 'join' ? 'text-koppara-green' : ''}`}>Membresía</button>
          </nav>

          <div className="flex-1 flex justify-center cursor-pointer group" onClick={() => { setCurrentView('catalog'); window.scrollTo({top: 0, behavior: 'smooth'}); }}>
            <KopparaLogo className="h-10 md:h-12 group-hover:scale-105 transition-transform" />
          </div>

          <div className="flex-1 flex items-center justify-end gap-4">
            <div className="hidden md:flex items-center bg-slate-50 rounded-full px-4 py-2 border border-slate-100 focus-within:border-koppara-green transition-all">
              <Search size={16} className="text-slate-300" />
              <input type="text" placeholder="Buscar..." className="bg-transparent border-none outline-none text-xs ml-2 w-24 focus:w-40 transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <button onClick={() => setIsCartOpen(true)} className={`relative flex items-center gap-3 bg-slate-50 hover:bg-koppara-green hover:text-white px-5 py-2.5 rounded-full transition group ${isCartAnimating ? 'animate-cart-bounce' : ''}`}>
              <ShoppingCart size={18} className="text-slate-500 group-hover:text-white" />
              <span className="hidden md:inline text-[11px] font-bold">{formatCurrency(cartTotal)}</span>
              {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-koppara-green text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">{cart.length}</span>}
            </button>
            {user || distributor ? (
              <button onClick={handleLogout} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 hover:text-red-500 transition"><LogOut size={20} /></button>
            ) : (
              <button onClick={() => setIsLoginModalOpen(true)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 hover:text-koppara-green transition"><UserCircle size={24} /></button>
            )}
          </div>
        </div>
      </header>

      {/* Views */}
      <main>
        {currentView === 'catalog' && (
          <div className="animate-fadeIn">
            <section className="pt-20 pb-12 text-center max-w-4xl mx-auto px-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-koppara-green/10 text-koppara-green rounded-full text-[10px] font-bold uppercase tracking-[0.3em] mb-6">
                <Sparkles size={12} /> Colección Luxury 2024
              </div>
              <h1 className="text-5xl md:text-7xl font-bold font-display text-slate-800 mb-8 leading-tight">Tu belleza,<br/>desde la raíz.</h1>
              <div className="flex flex-wrap justify-center gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-6 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest border transition-all ${activeCategory === cat ? 'bg-koppara-green text-white border-koppara-green shadow-xl' : 'bg-white text-slate-400 border-slate-100 hover:border-koppara-green'}`}>{cat}</button>
                ))}
              </div>
            </section>

            <section className="max-w-7xl mx-auto px-4 md:px-12 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProducts.map(p => (
                <div key={p.id} className="luxury-card group bg-white rounded-[2rem] border border-slate-50 p-4 flex flex-col cursor-pointer" onClick={() => setSelectedProduct(p)}>
                  <div className="h-64 rounded-[1.5rem] overflow-hidden relative mb-6">
                    <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-koppara-green">{p.category}</div>
                  </div>
                  <div className="px-2 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold font-display text-slate-800 mb-2">{p.name}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-6">"{p.description}"</p>
                    <div className="mt-auto flex items-center justify-between">
                      <p className="text-2xl font-bold text-slate-800 tracking-tight">{formatCurrency(p.price)}</p>
                      <button onClick={(e) => { e.stopPropagation(); handleAddToCart(p); }} className="w-12 h-12 bg-koppara-green/5 hover:bg-koppara-green text-koppara-green hover:text-white rounded-2xl transition-all flex items-center justify-center border border-koppara-green/10">
                        <Plus size={24} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          </div>
        )}

        {currentView === 'join' && (
          <div className="animate-fadeIn py-20 max-w-7xl mx-auto px-4">
             {referralCode && (
              <div className="bg-koppara-green/5 py-8 mb-12 border-y border-koppara-green/10 text-center rounded-3xl">
                <p className="text-lg font-display italic text-slate-800 mb-1">"Has recibido una invitación exclusiva"</p>
                <p className="text-[10px] font-bold text-koppara-green uppercase tracking-[0.3em]">Beneficio Especial Activado: 10% OFF</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                { name: 'Básica', price: 0, perks: ['15% descuento', 'Catálogo Digital', 'Grupo WhatsApp'] },
                { name: 'Luxury', price: 1500, perks: ['25% descuento', 'Kit Inicio Premium', '10% comisión referidos'], popular: true },
                { name: 'Elite', price: 3500, perks: ['35% descuento', 'Kit Elite Gold', 'Envíos Gratis SIEMPRE'] },
              ].map(plan => (
                <div key={plan.name} className={`p-10 rounded-[3rem] border relative flex flex-col ${plan.popular ? 'bg-slate-900 text-white shadow-2xl scale-105 z-10' : 'bg-white border-slate-100 shadow-xl'}`}>
                  {plan.popular && <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-koppara-green text-white text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-full">Más Popular</span>}
                  <h3 className="text-2xl font-bold font-display mb-2">{plan.name}</h3>
                  <div className="mb-10">
                    <span className="text-4xl font-bold">{plan.price === 0 ? 'Gratis' : formatCurrency(plan.price)}</span>
                    {plan.price > 0 && <span className="text-[10px] uppercase font-bold opacity-40 ml-2">/ año</span>}
                  </div>
                  <ul className="space-y-4 mb-10 flex-1 text-sm font-medium opacity-80">
                    {plan.perks.map(perk => <li key={perk} className="flex items-center gap-2"><CheckCircle2 size={16} className="text-koppara-green" /> {perk}</li>)}
                  </ul>
                  <button onClick={() => plan.price === 0 ? setCurrentView('catalog') : setSelectedCheckoutPlan(plan)} className={`w-full py-5 rounded-2xl font-bold transition uppercase tracking-widest text-xs ${plan.popular ? 'bg-koppara-green text-white' : 'bg-slate-50 text-slate-800'}`}>
                    {plan.name === 'Básica' ? 'Registrarme' : 'Unirme Ahora'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'socias' && distributor && (
          <div className="max-w-7xl mx-auto px-4 py-20 animate-fadeIn flex flex-col md:flex-row gap-10">
             <div className="md:w-1/3 bg-white p-10 rounded-[2rem] border border-slate-100 text-center">
                <div className="w-24 h-24 bg-koppara-green/10 rounded-full flex items-center justify-center mx-auto mb-6 text-koppara-green"><UserCircle size={64} /></div>
                <h3 className="text-2xl font-bold font-display text-slate-800">{distributor.name}</h3>
                <span className="bg-koppara-forest/10 text-koppara-forest text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full mt-2 inline-block">Socia {distributor.nivel}</span>
                <div className="mt-10 p-6 bg-slate-900 text-white rounded-2xl text-left relative overflow-hidden">
                   <h4 className="text-sm font-bold font-display mb-2 relative z-10">Código de Referido</h4>
                   <div className="flex items-center justify-between relative z-10 bg-white/10 p-2 rounded-xl">
                      <span className="text-koppara-green font-bold text-lg">{distributor.codigoReferido}</span>
                      <button onClick={() => { navigator.clipboard.writeText(window.location.origin + '/unete?ref=' + distributor.codigoReferido); alert('Copiado!'); }} className="p-2 bg-white/10 rounded-lg"><Copy size={16}/></button>
                   </div>
                   <div className="absolute top-0 right-0 p-4 opacity-10"><Gift size={60} /></div>
                </div>
             </div>
             <div className="flex-1 space-y-8">
                <div className="bg-white p-10 rounded-[2rem] border border-slate-100">
                   <h4 className="text-2xl font-bold font-display mb-8">Estadísticas</h4>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="p-8 bg-slate-50 rounded-2xl text-center"><p className="text-[10px] font-bold text-slate-300 uppercase mb-1">Referidos</p><p className="text-3xl font-bold">0</p></div>
                      <div className="p-8 bg-slate-50 rounded-2xl text-center"><p className="text-[10px] font-bold text-slate-300 uppercase mb-1">Comisiones</p><p className="text-3xl font-bold text-koppara-green">$0.00</p></div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slideIn">
            <div className="p-10 flex items-center justify-between border-b">
              <div className="flex items-center gap-4"><ShoppingCart className="text-koppara-green" /><h2 className="text-2xl font-bold font-display">Mi Cotización</h2></div>
              <button onClick={() => setIsCartOpen(false)}><X size={28}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-6">
              {cart.length === 0 ? <p className="text-center opacity-30 mt-20">Bolsa vacía</p> : cart.map(item => (
                <div key={item.id} className="flex gap-4 items-center">
                  <img src={item.image} className="w-16 h-16 rounded-xl object-cover" />
                  <div className="flex-1"><p className="font-bold text-sm">{item.name}</p><p className="text-koppara-green font-bold text-sm">{formatCurrency(item.price)}</p></div>
                  <div className="flex items-center bg-slate-50 rounded-full px-2">
                    <button onClick={() => setCart(prev => prev.map(i => i.id === item.id && i.quantity > 1 ? {...i, quantity: i.quantity - 1} : i))} className="p-2"><Minus size={14}/></button>
                    <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                    <button onClick={() => setCart(prev => prev.map(i => i.id === item.id ? {...i, quantity: i.quantity + 1} : i))} className="p-2"><Plus size={14}/></button>
                  </div>
                  <button onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
            <div className="p-10 bg-slate-50 border-t">
               <div className="flex justify-between items-end mb-6"><span className="text-slate-400 font-bold uppercase text-[10px]">Total</span><span className="text-4xl font-bold text-slate-800">{formatCurrency(cartTotal)}</span></div>
               <button disabled={cart.length === 0} onClick={() => window.open(getWhatsAppLink("524771234567", `Hola! Quiero cotizar:\n${cart.map(i => `- ${i.name} (${i.quantity})`).join('\n')}\nTotal: ${formatCurrency(cartTotal)}`), '_blank')} className="w-full bg-koppara-green text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl uppercase tracking-widest text-xs"><MessageCircle size={22} /> Cerrar Venta WhatsApp</button>
            </div>
          </div>
        </div>
      )}

      {isLoginModalOpen && <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />}
      {selectedCheckoutPlan && <CheckoutModal plan={selectedCheckoutPlan.name} precio={selectedCheckoutPlan.price} codigoReferido={referralCode} onClose={() => setSelectedCheckoutPlan(null)} onSuccess={handleCheckoutSuccess} />}
      {selectedProduct && <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAddToCart={handleAddToCart} />}

      <footer className="py-20 bg-slate-50 text-center mt-20">
         <KopparaLogo className="h-10 mx-auto mb-6 opacity-30 grayscale" />
         <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.4em]">&copy; 2024 Koppara México • Luxury Experience</p>
      </footer>
    </div>
  );
}

const ProductModal: React.FC<{ product: Product; onClose: () => void; onAddToCart: (p: Product) => void; }> = ({ product, onClose, onAddToCart }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
    <div className="bg-white w-full max-w-5xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-slideUp">
      <div className="md:w-1/2 h-80 md:h-auto relative"><img src={product.image} className="w-full h-full object-cover" /><button onClick={onClose} className="absolute top-6 right-6 bg-black/20 text-white p-2 rounded-full"><X size={20}/></button></div>
      <div className="p-12 md:w-1/2 flex flex-col">
        <span className="text-[10px] font-bold text-koppara-green uppercase tracking-widest mb-4">{product.category}</span>
        <h2 className="text-4xl font-bold font-display text-slate-800 mb-6">{product.name}</h2>
        <p className="text-slate-500 mb-8 font-medium italic">"{product.description}"</p>
        <div className="bg-slate-50 rounded-3xl p-8 mb-8 text-xs font-bold text-slate-600">
           <h4 className="uppercase text-slate-300 mb-4 tracking-widest">Incluye ritual:</h4>
           <ul className="grid grid-cols-2 gap-2">{product.products.map(it => <li key={it} className="flex items-center gap-2"><CheckCircle2 size={12} className="text-koppara-green" /> {it}</li>)}</ul>
        </div>
        <div className="mt-auto flex items-center justify-between pt-8 border-t">
          <div><p className="text-[10px] font-bold text-slate-300 uppercase mb-1">Precio Sugerido</p><p className="text-3xl font-bold text-slate-800">{formatCurrency(product.price)}</p></div>
          <button onClick={() => { onAddToCart(product); onClose(); }} className="bg-koppara-green text-white font-bold px-10 py-5 rounded-2xl shadow-xl hover:bg-koppara-forest flex items-center gap-2 uppercase tracking-widest text-[10px]">Añadir <ArrowRight size={16}/></button>
        </div>
      </div>
    </div>
  </div>
);
