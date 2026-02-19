
import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, ShoppingCart, Trash2, MessageCircle, X,
  UserCircle, Sparkles, ArrowRight, Package,
  CheckCircle2, Plus, Minus, Loader2, LogOut,
  Copy, Gift, ShieldCheck, Info, Phone, CreditCard, Wallet, Download,
  Bell
} from 'lucide-react';
import { PRODUCTS as FALLBACK_PRODUCTS, CATEGORIES } from './constants';
import { Product, Distributor, CartItem } from './types';
import { supabase } from './lib/supabase';
import { obtenerProductos } from './services/productos.service';
import { loginConEmail, loginConTelefono, obtenerUsuarioActual, cerrarSesion } from './services/auth.service';
import { guardarPerfilDistribuidora, generarCodigoReferido } from './services/distribuidora.service';
import { registrarLead } from './services/leads.service';
import { Distribuidora, Lead } from './lib/supabase';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AdminPanel } from './components/AdminPanel';
import logoKoppara from './assets/logo_koppara.png';
import { obtenerNotificaciones } from './services/notifications.service';
import { Notificacion } from './lib/supabase';

// --- COMPONENTS ---

const KopparaLogo = ({ className = "h-20", compact = false }: { className?: string; compact?: boolean }) => {
  const [imgError, setImgError] = useState(false);

  if (compact) {
    return (
      <div className={`${className} overflow-hidden w-12 h-12`}>
        <img
          src={logoKoppara}
          alt="Koppara"
          className="h-full w-auto object-cover object-left scale-150"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      {!imgError ? (
        <img
          src={logoKoppara}
          alt="Koppara"
          className="h-full w-auto object-contain"
          style={{ minHeight: '100%' }}
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-8 bg-koppara-green rounded-sm flex items-center justify-center text-white text-xs font-bold shadow-sm">K</div>
          <span className="text-2xl font-bold text-koppara-gray tracking-tight">Koppara</span>
        </div>
      )}
    </div>
  );
};

const EmptyState = ({ message = "No hay resultados", submessage = "Intenta ajustar tu búsqueda." }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fadeIn border border-dashed border-slate-200 rounded-lg bg-slate-50/30">
    <Package className="w-12 h-12 text-slate-200 mb-4" strokeWidth={1} />
    <h3 className="text-lg font-bold text-koppara-gray mb-1">{message}</h3>
    <p className="text-slate-400 max-w-xs mx-auto text-xs leading-relaxed">{submessage}</p>
  </div>
);

const formatCurrency = (val: number) => `$${val.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
const getWhatsAppLink = (phone: string, message: string) => `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;

const KOPPARA_LOGO_DATA_URL = (() => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
    <defs>
      <linearGradient id="leaf" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#9ACD32"/>
        <stop offset="100%" stop-color="#228B22"/>
      </linearGradient>
    </defs>
    <g fill="none" stroke="none">
      <path d="M120 30c-20 30-28 56-22 80 24-8 46-30 62-66-10-6-22-10-40-14z" fill="url(#leaf)"/>
      <path d="M46 106c36 0 62 10 78 30-22 16-52 20-92 12 2-14 6-28 14-42z" fill="url(#leaf)"/>
      <path d="M132 158c10 26 32 44 70 56 6-12 8-26 8-42-32-18-56-22-78-14z" fill="url(#leaf)"/>
      <circle cx="120" cy="120" r="16" fill="#006400"/>
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
})();

const PRODUCT_PLACEHOLDER_DATA_URL = (() => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <rect width="600" height="600" fill="#F5F5F5"/>
    <rect x="140" y="120" width="320" height="360" rx="24" fill="#E5E7EB"/>
    <circle cx="300" cy="230" r="46" fill="#D1D5DB"/>
    <rect x="200" y="300" width="200" height="24" rx="12" fill="#D1D5DB"/>
    <rect x="180" y="340" width="240" height="18" rx="9" fill="#D1D5DB"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
})();

const splitBenefits = (benefit?: string) => {
  if (!benefit) return [] as string[];
  return benefit
    .split(/[.;•]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const waitForImages = async (root: HTMLElement) => {
  const images = Array.from(root.querySelectorAll('img')) as HTMLImageElement[];
  await Promise.all(
    images.map(
      (img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          })
    )
  );
};

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
      <div className="bg-white w-full max-w-md rounded-lg shadow-md border border-slate-100">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-300 hover:text-slate-600"><X size={24} /></button>
        <div className="text-center mb-8">
          <KopparaLogo className="h-10 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-koppara-gray">Acceso Distribuidora</h2>
          <p className="text-slate-400 text-sm mt-2">Gestiona tu red y catálogo digital.</p>
        </div>

        <div className="flex gap-2 mb-6 bg-koppara-lightGray p-1 rounded-xl">
          <button onClick={() => setMetodo('email')} className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${metodo === 'email' ? 'bg-white text-koppara-green shadow-sm' : 'text-slate-400'}`}>Email</button>
          <button onClick={() => setMetodo('telefono')} className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${metodo === 'telefono' ? 'bg-white text-koppara-green shadow-sm' : 'text-slate-400'}`}>WhatsApp</button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type={metodo === 'email' ? 'email' : 'tel'}
            placeholder={metodo === 'email' ? 'tu@email.com' : '+52 477 123 4567'}
            className="w-full bg-koppara-lightGray border border-slate-100 rounded-xl px-4 py-4 outline-none focus:border-koppara-green transition"
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
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-md overflow-hidden flex flex-col md:flex-row max-h-[85vh]">
        <div className="bg-koppara-dark text-white p-10 md:w-1/3 flex flex-col justify-between">
          <div>
            <div className="mb-8 opacity-50"><KopparaLogo className="h-6 filter brightness-0 invert" /></div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-koppara-green mb-2">Registro de Socia</p>
            <h3 className="text-2xl font-bold text-koppara-gray mb-6">Plan {plan}</h3>
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
            <button onClick={onClose} className="text-slate-300 hover:text-red-500"><X size={24} /></button>
          </div>

          {step === 1 && (
            <div className="animate-fadeIn space-y-4">
              <h4 className="text-xl font-bold text-koppara-gray mb-2">Información Personal</h4>
              <input placeholder="Nombre Completo" className="w-full bg-koppara-lightGray border border-slate-100 rounded-xl px-4 py-3" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
              <input placeholder="Email" type="email" className="w-full bg-koppara-lightGray border border-slate-100 rounded-xl px-4 py-3" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              <input placeholder="WhatsApp" type="tel" className="w-full bg-koppara-lightGray border border-slate-100 rounded-xl px-4 py-3" value={formData.telefono} onChange={e => setFormData({ ...formData, telefono: e.target.value })} />
              <button onClick={() => setStep(2)} disabled={!formData.nombre || !formData.email || !formData.telefono} className="w-full mt-4 bg-koppara-dark text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50">Continuar <ArrowRight size={18} /></button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fadeIn space-y-4">
              <h4 className="text-xl font-bold text-koppara-gray mb-2">Dirección de Envío</h4>
              <input placeholder="Calle y Número" className="w-full bg-koppara-lightGray border border-slate-100 rounded-xl px-4 py-3" value={formData.direccion} onChange={e => setFormData({ ...formData, direccion: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Ciudad" className="bg-koppara-lightGray border border-slate-100 rounded-xl px-4 py-3" value={formData.ciudad} onChange={e => setFormData({ ...formData, ciudad: e.target.value })} />
                <input placeholder="C.P." className="bg-koppara-lightGray border border-slate-100 rounded-xl px-4 py-3" value={formData.cp} onChange={e => setFormData({ ...formData, cp: e.target.value })} />
              </div>
              <div className="flex gap-4 mt-4">
                <button onClick={() => setStep(1)} className="flex-1 border border-slate-100 py-4 rounded-xl text-slate-400">Volver</button>
                <button onClick={() => setStep(3)} className="flex-[2] bg-koppara-dark text-white py-4 rounded-xl font-bold">Método de Pago</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fadeIn space-y-4">
              <h4 className="text-xl font-bold text-koppara-gray mb-4">Finalizar Pago</h4>
              <button onClick={() => setFormData({ ...formData, metodo: 'card' })} className={`w-full p-4 rounded-xl border flex items-center justify-between ${formData.metodo === 'card' ? 'border-koppara-green bg-koppara-green/5' : 'border-slate-100'}`}>
                <div className="flex items-center gap-4"><CreditCard className="text-slate-400" /> <span className="text-sm font-bold">Tarjeta Crédito/Débito</span></div>
                <div className={`w-4 h-4 rounded-full border-2 ${formData.metodo === 'card' ? 'border-koppara-green bg-koppara-green' : 'border-slate-200'}`} />
              </button>
              <button onClick={() => setFormData({ ...formData, metodo: 'transfer' })} className={`w-full p-4 rounded-xl border flex items-center justify-between ${formData.metodo === 'transfer' ? 'border-koppara-green bg-koppara-green/5' : 'border-slate-100'}`}>
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
  const [currentView, setCurrentView] = useState<'catalog' | 'socias' | 'join' | 'admin'>('catalog');
  const [isAdmin, setIsAdmin] = useState(false);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [selectedCheckoutPlan, setSelectedCheckoutPlan] = useState<{ name: string, price: number } | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfNombre, setPdfNombre] = useState('');
  const [pdfWhatsapp, setPdfWhatsapp] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const isDevHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.role === 'admin') {
        setIsAdmin(true);
      }
    };
    checkRole();
  }, []);

  useEffect(() => {
    if (distributor) {
      const loadNotifs = async () => {
        try {
          const list = await obtenerNotificaciones(distributor.nivel, distributor.id);
          setNotificaciones(list);
          setUnreadNotif(list.filter(n => !n.leida).length);
        } catch (e) {
          console.error("Error cargando notificaciones", e);
        }
      };
      loadNotifs();
    }
  }, [distributor]);

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
    obtenerUsuarioActual().then(u => setUser(u)).catch(() => { });

    // Scroll Observer
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [cart]);

  useEffect(() => {
    if (distributor?.name && !pdfNombre) setPdfNombre(distributor.name);
    if (distributor?.phone && !pdfWhatsapp) setPdfWhatsapp(distributor.phone);
  }, [distributor, pdfNombre, pdfWhatsapp]);

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
    try { await cerrarSesion(); } catch (e) { }
    setUser(null);
    setDistributor(null);
    setCurrentView('catalog');
  };

  const handleCheckoutSuccess = async (data: any) => {
    const sociaData: Partial<Distribuidora> = {
      nombre: data.nombre,
      telefono: data.telefono,
      email: data.email,
      nivel: data.plan.toLowerCase() as any,
      codigo_referido: generarCodigoReferido(data.nombre),
      ganancias_total: 0
    };

    if (user) {
      sociaData.id = user.id;
      try {
        await guardarPerfilDistribuidora(sociaData);
      } catch (err) {
        console.error("Error persistiendo socia:", err);
      }
    }

    const newSocia: Distributor = {
      name: data.nombre,
      phone: data.telefono,
      email: data.email,
      isSocia: true,
      nivel: data.plan as any,
      codigoReferido: sociaData.codigo_referido || '',
      referidosActivos: 0,
      gananciasAcumuladas: 0
    };
    setDistributor(newSocia);
    setSelectedCheckoutPlan(null);
    setCurrentView('socias');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleWhatsAppCheckout = async () => {
    if (cart.length === 0) return;

    // Registrar Lead en DB primero (si hay distribuidora activa)
    if (distributor || user) {
      try {
        await registrarLead({
          distribuidora_id: user?.id || '', // Si no hay login, se registra como huérfano o se omite
          nombre_cliente: 'Cliente Web',
          whatsapp_cliente: '',
          productos: cart.map(i => ({ id: i.id, name: i.name, qty: i.quantity })),
          monto: cartTotal,
          estado: 'pendiente'
        });
      } catch (err) {
        console.error("Error al registrar lead:", err);
      }
    }

    const message = `Hola! Quiero cotizar:\n${cart.map(i => `- ${i.name} (${i.quantity})`).join('\n')}\nTotal: ${formatCurrency(cartTotal)}`;
    window.open(getWhatsAppLink("524771234567", message), '_blank');
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

  const descargarCatalogoPDF = async (onlyPublished = false) => {
    if (pdfLoading) return;
    let catalogProducts = products.length ? products : FALLBACK_PRODUCTS;
    if (onlyPublished) {
      catalogProducts = products.filter(p => p.status === 'published');
    }

    if (!catalogProducts.length) {
      window.alert('No hay productos disponibles para generar el catálogo.');
      return;
    }

    const distributorName = pdfNombre.trim() || distributor?.name || 'Distribuidora Koppara';
    const distributorPhone = pdfWhatsapp.trim() || distributor?.phone || '52 000 000 0000';
    const generationDate = new Date();
    const dateLabel = generationDate.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: '2-digit'
    });
    const fileDate = generationDate.toISOString().slice(0, 10);

    const categoryColor = (category: string) => {
      const map: Record<string, string> = {
        Facial: '#228B22',
        Corporal: '#9ACD32',
        Capilar: '#006400',
        Especializado: '#83a332',
        Relax: '#5C8A2E',
        Eco: '#2F6F3E'
      };
      return map[category] || '#9ACD32';
    };

    const renderPage = (content: string, pageNum: number, totalPages: number) => `
      <div class="pdf-page" style="width:210mm;height:297mm;box-sizing:border-box;padding:12mm;background:#ffffff;font-family:'Poppins',sans-serif;color:#4D4D4D;display:flex;flex-direction:column;position:relative;">
        <!-- Header -->
        <div style="display:flex;justify-content:center;margin-bottom:10px;border-bottom:1px solid #f0f0f0;padding-bottom:10px;">
          <img src="/logo_koppara.png" style="width:25%;height:auto;object-contain:contain;" />
        </div>
        
        <!-- Content -->
        <div style="flex:1;">
          ${content}
        </div>

        <!-- Footer -->
        <div style="margin-top:10px;padding-top:10px;border-top:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center;">
          <div style="font-size:9px;color:#999;">
            <span style="color:#328B2C;font-weight:700;">WhatsApp:</span> ${distributorPhone} | 
            <span style="color:#328B2C;font-weight:700;">IG:</span> @koppara.oficial
          </div>
          <div style="font-size:9px;color:#999;font-weight:bold;">Página ${pageNum} de ${totalPages}</div>
        </div>
      </div>
    `;

    const productTemplate = (product: Product) => {
      const benefits = splitBenefits(product.benefit).slice(0, 3);
      return `
        <div style="width:48%;margin-bottom:15px;border:1px solid #f3f4f6;border-radius:8px;padding:10px;display:flex;flex-direction:column;break-inside:avoid;background:#fafafa;">
          <div style="height:120px;margin-bottom:8px;border-radius:4px;overflow:hidden;">
            <img src="${product.image || PRODUCT_PLACEHOLDER_DATA_URL}" style="width:100%;height:100%;object-fit:cover;" />
          </div>
          <h4 style="font-size:14px;font-weight:bold;margin:0 0 4px 0;color:#1B4D1A;line-height:1.2;">${product.name}</h4>
          <p style="font-size:10px;color:#666;margin:0 0 8px 0;line-clamp:2;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;height:30px;">${product.description}</p>
          
          <div style="margin-bottom:10px;flex:1;">
            ${benefits.map(b => `<div style="font-size:9px;display:flex;align-items:center;gap:4px;margin-bottom:2px;color:#4D4D4D;"><span style="color:#9ACD32;font-weight:bold;">✓</span> ${b}</div>`).join('')}
          </div>
          
          <div style="background:#f0f7e6;padding:6px;border-radius:4px;text-align:center;">
            <span style="font-size:14px;font-weight:800;color:#328B2C;">${formatCurrency(product.price)}</span>
          </div>
        </div>
      `;
    };

    const chunkedProducts: Product[][] = [];
    for (let i = 0; i < catalogProducts.length; i += 4) {
      chunkedProducts.push(catalogProducts.slice(i, i + 4));
    }

    const totalPages = chunkedProducts.length + 2; // Portada, Productos, Final

    const coverPage = renderPage(`
      <div style="height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;">
        <img src="/logo_koppara.png" style="width:50%;margin-bottom:30px;" />
        <h1 style="font-size:42px;font-weight:800;color:#1B4D1A;margin-bottom:10px;letter-spacing:-1px;">Catálogo Digital</h1>
        <p style="font-size:16px;color:#4D4D4D;letter-spacing:4px;text-transform:uppercase;margin-bottom:40px;">Colección Luxury 2026</p>
        
        <div style="background:#9ACD32;color:white;padding:20px 40px;border-radius:12px;display:inline-block;">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;opacity:0.8;">Atención Personalizada</div>
          <div style="font-size:24px;font-weight:bold;">${distributorName}</div>
        </div>
      </div>
    `, 1, totalPages);

    const productPagesHtml = chunkedProducts.map((group, idx) => {
      const content = `
        <div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;margin-top:10px;">
          ${group.map(p => productTemplate(p)).join('')}
        </div>
      `;
      return renderPage(content, idx + 2, totalPages);
    });

    const finalPage = renderPage(`
      <div style="height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;">
        <h3 style="font-size:28px;font-weight:bold;color:#1B4D1A;margin-bottom:20px;">¿Lista para iniciar tu ritual?</h3>
        <p style="font-size:14px;color:#666;max-width:300px;margin-bottom:30px;">Contacta a tu distribuidora oficial para pedidos y asesoría personalizada.</p>
        
        <div style="border:2px dashed #9ACD32;padding:20px;border-radius:16px;width:80%;">
          <div style="font-size:12px;color:#9ACD32;font-weight:bold;margin-bottom:8px;">DISTRIBUIDORA AUTORIZADA</div>
          <div style="font-size:22px;font-weight:bold;color:#4D4D4D;">${distributorName}</div>
          <div style="font-size:18px;color:#328B2C;font-weight:bold;margin-top:10px;">WhatsApp: ${distributorPhone}</div>
        </div>
      </div>
    `, totalPages, totalPages);

    let container: HTMLDivElement | null = null;
    try {
      setPdfLoading(true);
      container = document.createElement('div');
      container.id = 'koppara-pdf-container';
      container.style.position = 'fixed';
      container.style.left = '-99999px';
      container.style.top = '0';
      container.style.width = '210mm';
      container.style.background = '#ffffff';
      container.innerHTML = [coverPage, ...productPagesHtml, finalPage].join('');
      document.body.appendChild(container);

      await waitForImages(container);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pages = Array.from(container.querySelectorAll('.pdf-page')) as HTMLElement[];

      for (let i = 0; i < pages.length; i += 1) {
        const canvas = await html2canvas(pages[i], {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff'
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      }

      pdf.save(`catalogo-koppara-${fileDate}.pdf`);
      if (!onlyPublished) setIsPdfModalOpen(false);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      window.alert('No se pudo generar el catalogo PDF. Intenta nuevamente.');
    } finally {
      setPdfLoading(false);
      if (container && container.parentElement) container.parentElement.removeChild(container);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-koppara-gray">
      {/* Official Header */}
      <header className={`no-print sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'py-2' : 'py-6 px-4 md:px-12'}`}>
        <div className={`max-w-7xl mx-auto flex items-center justify-between rounded-full floating-nav transition-all duration-300 ${scrolled ? 'px-6 py-2 border-b' : 'px-8 py-4 border border-slate-100 shadow-lg'}`}>
          <nav className="hidden lg:flex items-center gap-8 text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] flex-1">
            <button onClick={() => setCurrentView('catalog')} className={`hover:text-koppara-green transition ${currentView === 'catalog' ? 'text-koppara-green' : ''}`}>Catálogo</button>
            <button onClick={() => setCurrentView(distributor?.isSocia ? 'socias' : 'join')} className={`hover:text-koppara-green transition ${currentView === 'socias' || currentView === 'join' ? 'text-koppara-green' : ''}`}>Membresía</button>
          </nav>

          <div className="flex-[2] flex justify-center cursor-pointer group" onClick={() => { setCurrentView('catalog'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <KopparaLogo className="h-16 md:h-20 group-hover:scale-105 transition-transform" />
          </div>

          <div className="flex-1 flex items-center justify-end gap-4">
            <div className="hidden md:flex items-center bg-koppara-lightGray rounded-full px-4 py-2 border border-slate-100 focus-within:border-koppara-green transition-all">
              <Search size={16} className="text-slate-300" />
              <input type="text" placeholder="Buscar..." className="bg-transparent border-none outline-none text-xs ml-2 w-24 focus:w-40 transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <button
              onClick={() => setIsPdfModalOpen(true)}
              className="hidden md:flex items-center gap-2 bg-koppara-green text-white px-5 py-2.5 rounded-full font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-koppara-green/20 hover:bg-koppara-forest transition"
            >
              <Download size={16} />
              Descargar Catálogo PDF
            </button>
            <button
              onClick={() => setIsPdfModalOpen(true)}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-full bg-koppara-green text-white shadow-lg shadow-koppara-green/20 hover:bg-koppara-forest transition"
              aria-label="Descargar catalogo PDF"
            >
              <Download size={18} />
            </button>
            <div className="relative cursor-pointer group" onClick={() => distributor && setUnreadNotif(0)}>
              <Bell size={24} className="text-slate-400 group-hover:text-koppara-green transition" />
              {unreadNotif > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm ring-2 ring-red-500/20">
                  {unreadNotif}
                </span>
              )}
            </div>

            {isAdmin && (
              <button onClick={() => setCurrentView('admin')} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:bg-koppara-green hover:text-white transition shadow-sm">
                <ShieldCheck size={20} />
              </button>
            )}
            <button onClick={() => setIsCartOpen(true)} className={`relative flex items-center gap-3 bg-white border border-slate-100 hover:border-koppara-green/30 hover:bg-koppara-lightGray px-5 py-2.5 rounded-full transition-all group ${isCartAnimating ? 'animate-cart-bounce' : ''}`}>
              <ShoppingCart size={18} className="text-koppara-gray group-hover:text-koppara-green transition-colors" />
              <span className="hidden md:inline text-[11px] font-bold text-koppara-gray">{formatCurrency(cartTotal)}</span>
              {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-koppara-green text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">{cart.length}</span>}
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
              <h1 className="text-5xl md:text-7xl font-bold text-koppara-gray mb-8 leading-tight">Tu belleza,<br />desde la raíz.</h1>
              <div className="flex flex-wrap justify-center gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-6 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest border transition-all ${activeCategory === cat ? 'bg-koppara-green text-white border-koppara-green shadow-xl' : 'bg-white text-slate-400 border-slate-100 hover:border-koppara-green'}`}>{cat}</button>
                ))}
              </div>
            </section>

            <section className="max-w-7xl mx-auto px-4 md:px-12 py-12">
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {filteredProducts.map(p => (
                    <div key={p.id} className="luxury-card group bg-white rounded-lg border border-slate-100 shadow-sm p-8 flex flex-col cursor-pointer transition-all hover:border-koppara-green/20" onClick={() => setSelectedProduct(p)}>
                      <div className="h-64 rounded-lg shadow-sm border border-slate-50 mb-6">
                        <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-koppara-green shadow-sm">{p.category}</div>
                      </div>
                      <div className="px-2 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-koppara-gray mb-2">{p.name}</h3>
                        <p className="text-xs text-slate-400 line-clamp-2 mb-6 leading-relaxed">"{p.description}"</p>
                        <div className="mt-auto flex items-center justify-between">
                          <p className="text-2xl font-bold text-koppara-gray tracking-tight">{formatCurrency(p.price)}</p>
                          <button onClick={(e) => { e.stopPropagation(); handleAddToCart(p); }} className="w-12 h-12 bg-koppara-green/5 hover:bg-koppara-green text-koppara-green hover:text-white rounded-2xl transition-all flex items-center justify-center border border-koppara-green/10">
                            <Plus size={24} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState />
              )}
            </section>
          </div>
        )}

        {currentView === 'join' && (
          <div className="animate-fadeIn py-20 max-w-7xl mx-auto px-4">
            {referralCode && (
              <div className="bg-koppara-green/5 py-8 mb-12 border-y border-koppara-green/10 text-center rounded-3xl">
                <p className="text-lg font-display italic text-koppara-gray mb-1">"Has recibido una invitación exclusiva"</p>
                <p className="text-[10px] font-bold text-koppara-green uppercase tracking-[0.3em]">Beneficio Especial Activado: 10% OFF</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                { name: 'Básica', price: 0, perks: ['15% descuento', 'Catálogo Digital', 'Grupo WhatsApp'] },
                { name: 'Luxury', price: 1500, perks: ['25% descuento', 'Kit Inicio Premium', '10% comisión referidos'], popular: true },
                { name: 'Elite', price: 3500, perks: ['35% descuento', 'Kit Elite Gold', 'Envíos Gratis SIEMPRE'] },
              ].map(plan => (
                <div key={plan.name} className={`p-10 rounded-lg border flex flex-col relative ${plan.popular ? 'bg-koppara-dark text-white shadow-2xl scale-105 z-10 border-transparent' : 'bg-white border-slate-100 shadow-xl text-koppara-gray'}`}>
                  {plan.popular && <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-koppara-green text-white text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-full">Más Popular</span>}
                  <h3 className={`text-2xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-koppara-gray'}`}>{plan.name}</h3>
                  <div className="mb-10">
                    <span className="text-4xl font-bold">{plan.price === 0 ? 'Gratis' : formatCurrency(plan.price)}</span>
                    {plan.price > 0 && <span className={`text-[10px] uppercase font-bold ml-2 ${plan.popular ? 'text-white/40' : 'opacity-40'}`}>/ año</span>}
                  </div>
                  <ul className={`space-y-4 mb-10 flex-1 text-sm font-medium ${plan.popular ? 'text-white/90' : 'text-slate-600'}`}>
                    {plan.perks.map(perk => (
                      <li key={perk} className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-koppara-green shrink-0" />
                        <span className={perk.includes('Envíos Gratis') ? 'text-[#D4AF37] font-bold' : ''}>{perk}</span>
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => plan.price === 0 ? setCurrentView('catalog') : setSelectedCheckoutPlan(plan)} className={`w-full py-5 rounded-2xl font-bold transition uppercase tracking-widest text-xs ${plan.popular ? 'bg-koppara-green text-white' : 'bg-koppara-lightGray text-koppara-gray'}`}>
                    {plan.name === 'Básica' ? 'Registrarme' : 'Unirme Ahora'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'socias' && distributor && (
          <div className="max-w-7xl mx-auto px-4 py-20 animate-fadeIn flex flex-col md:flex-row gap-10">
            <div className="md:w-1/3 bg-white p-10 rounded-lg border border-slate-100 shadow-sm p-4 md:p-10">
              <div className="w-24 h-24 bg-koppara-green/10 rounded-full flex items-center justify-center mx-auto mb-6 text-koppara-green"><UserCircle size={64} /></div>
              <h3 className="text-2xl font-bold text-koppara-gray">{distributor.name}</h3>
              <span className="bg-koppara-forest/10 text-koppara-forest text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full mt-2 inline-block">Socia {distributor.nivel}</span>
              <div className="mt-10 p-6 bg-koppara-dark text-white rounded-2xl text-left relative overflow-hidden">
                <h4 className="text-sm font-bold font-display mb-2 relative z-10">Código de Referido</h4>
                <div className="flex items-center justify-between relative z-10 bg-white/10 p-2 rounded-xl">
                  <span className="text-koppara-green font-bold text-lg">{distributor.codigoReferido}</span>
                  <button onClick={() => { navigator.clipboard.writeText(window.location.origin + '/unete?ref=' + distributor.codigoReferido); alert('Copiado!'); }} className="p-2 bg-white/10 rounded-lg"><Copy size={16} /></button>
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-10"><Gift size={60} /></div>
              </div>
            </div>
            <div className="flex-1 space-y-8">
              <div className="bg-white p-10 rounded-[2rem] border border-slate-100">
                <h4 className="text-2xl font-bold text-koppara-gray mb-8">Estadísticas</h4>
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-8 bg-koppara-lightGray rounded-2xl text-center"><p className="text-[10px] font-bold text-slate-300 uppercase mb-1">Referidos</p><p className="text-3xl font-bold">0</p></div>
                  <div className="p-8 bg-koppara-lightGray rounded-2xl text-center"><p className="text-[10px] font-bold text-slate-300 uppercase mb-1">Comisiones</p><p className="text-3xl font-bold text-koppara-green">$0.00</p></div>
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
              <button onClick={() => setIsCartOpen(false)}><X size={28} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-6">
              {cart.length === 0 ? <p className="text-center opacity-30 mt-20">Bolsa vacía</p> : cart.map(item => (
                <div key={item.id} className="flex gap-4 items-center">
                  <img src={item.image} className="w-16 h-16 rounded-xl object-cover" />
                  <div className="flex-1"><p className="font-bold text-sm">{item.name}</p><p className="text-koppara-green font-bold text-sm">{formatCurrency(item.price)}</p></div>
                  <div className="flex items-center bg-koppara-lightGray rounded-full px-2">
                    <button onClick={() => setCart(prev => prev.map(i => i.id === item.id && i.quantity > 1 ? { ...i, quantity: i.quantity - 1 } : i))} className="p-2"><Minus size={14} /></button>
                    <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                    <button onClick={() => setCart(prev => prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))} className="p-2"><Plus size={14} /></button>
                  </div>
                  <button onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
            <div className="p-10 bg-koppara-lightGray border-t">
              <div className="flex justify-between items-end mb-6"><span className="text-slate-400 font-bold uppercase text-[10px]">Total</span><span className="text-4xl font-bold text-koppara-gray">{formatCurrency(cartTotal)}</span></div>
              <button
                disabled={cart.length === 0}
                onClick={handleWhatsAppCheckout}
                className="w-full bg-koppara-green text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl uppercase tracking-widest text-xs"
              >
                <MessageCircle size={22} /> Cerrar Venta WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {isDevHost && isAdminOpen && <AdminPanel onClose={() => setIsAdminOpen(false)} />}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-md border border-slate-100">
            <button onClick={() => setIsPdfModalOpen(false)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-600"><X size={24} /></button>
            <div className="text-center mb-8">
              <KopparaLogo className="h-10 mx-auto mb-5" />
              <h2 className="text-2xl font-bold text-koppara-gray">Descargar Catalogo PDF</h2>
              <p className="text-slate-400 text-sm mt-2">Personaliza tu portada antes de generar el PDF.</p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nombre de la distribuidora"
                className="w-full bg-koppara-lightGray border border-slate-100 rounded-xl px-4 py-4 outline-none focus:border-koppara-green transition"
                value={pdfNombre}
                onChange={(e) => setPdfNombre(e.target.value)}
              />
              <input
                type="tel"
                placeholder="WhatsApp"
                className="w-full bg-koppara-lightGray border border-slate-100 rounded-xl px-4 py-4 outline-none focus:border-koppara-green transition"
                value={pdfWhatsapp}
                onChange={(e) => setPdfWhatsapp(e.target.value)}
              />
              <button
                onClick={descargarCatalogoPDF}
                disabled={pdfLoading}
                className="w-full bg-koppara-green text-white py-4 rounded-xl font-bold shadow-lg shadow-koppara-green/20 hover:bg-koppara-forest transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {pdfLoading ? <Loader2 className="animate-spin" /> : <Download size={18} />}
                {pdfLoading ? 'Generando PDF...' : 'Descargar Catalogo PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
      {isLoginModalOpen && <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />}
      {selectedCheckoutPlan && <CheckoutModal plan={selectedCheckoutPlan.name} precio={selectedCheckoutPlan.price} codigoReferido={referralCode} onClose={() => setSelectedCheckoutPlan(null)} onSuccess={handleCheckoutSuccess} />}
      {selectedProduct && <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAddToCart={handleAddToCart} />}

      <footer className="py-20 bg-koppara-lightGray text-center mt-20">
        <KopparaLogo className="h-10 mx-auto mb-6 opacity-30 grayscale" />
        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.4em]">&copy; 2024 Koppara México • Luxury Experience</p>
      </footer>
      {/* Notification List Modal if Bell Clicked */}
      {unreadNotif === 0 && notificaciones.length > 0 && (
        <div className="fixed bottom-24 right-10 z-[200] w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 animate-slideUp">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-slate-800">Avisos Recientes</h4>
            <button onClick={() => setNotificaciones([])} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
          </div>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {notificaciones.map(n => (
              <div key={n.id} className={`p-3 rounded-2xl border ${n.categoria === 'urgente' ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${n.categoria === 'urgente' ? 'bg-red-500 text-white' : 'bg-koppara-green text-white'
                    }`}>{n.categoria}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{new Date(n.created_at).toLocaleDateString()}</span>
                </div>
                <div className="font-bold text-xs text-slate-800">{n.titulo}</div>
                <p className="text-[10px] text-slate-500 line-clamp-2 mt-1">{n.cuerpo}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentView === 'admin' && isAdmin && (
        <AdminPanel
          onClose={() => setCurrentView('catalog')}
          descargarPDF={() => descargarCatalogoPDF(true)}
        />
      )}
    </div>
  );
}

const ProductModal: React.FC<{ product: Product; onClose: () => void; onAddToCart: (p: Product) => void; }> = ({ product, onClose, onAddToCart }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
    <div className="bg-white w-full max-w-5xl rounded-lg shadow-md overflow-hidden flex flex-col md:flex-row animate-slideUp border border-slate-100">
      <div className="md:w-1/2 h-80 md:h-auto relative"><img src={product.image} className="w-full h-full object-cover" /><button onClick={onClose} className="absolute top-6 right-6 bg-black/20 text-white p-2 rounded-full"><X size={20} /></button></div>
      <div className="p-12 md:w-1/2 flex flex-col">
        <span className="text-[10px] font-bold text-koppara-green uppercase tracking-widest mb-4">{product.category}</span>
        <h2 className="text-4xl font-bold text-koppara-gray mb-6">{product.name}</h2>
        <p className="text-slate-500 mb-8 font-medium italic">"{product.description}"</p>
        <div className="bg-koppara-lightGray rounded-3xl p-8 mb-8 text-xs font-bold text-slate-600">
          <h4 className="uppercase text-slate-300 mb-4 tracking-widest">Incluye ritual:</h4>
          <ul className="grid grid-cols-2 gap-2">{product.products.map(it => <li key={it} className="flex items-center gap-2"><CheckCircle2 size={12} className="text-koppara-green" /> {it}</li>)}</ul>
        </div>
        <div className="mt-auto flex items-center justify-between pt-8 border-t">
          <div><p className="text-[10px] font-bold text-slate-300 uppercase mb-1">Precio Sugerido</p><p className="text-3xl font-bold text-koppara-gray">{formatCurrency(product.price)}</p></div>
          <button onClick={() => { onAddToCart(product); onClose(); }} className="bg-koppara-green text-white font-bold px-10 py-5 rounded-2xl shadow-xl hover:bg-koppara-forest flex items-center gap-2 uppercase tracking-widest text-[10px]">Añadir <ArrowRight size={16} /></button>
        </div>
      </div>
    </div>
  </div>
);
