
import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, ShoppingCart, Trash2, MessageCircle, X,
  UserCircle, Sparkles, ArrowRight, Package,
  CheckCircle2, Plus, Minus, Loader2, LogOut,
  Copy, Gift, ShieldCheck, Info, Phone, CreditCard, Wallet, Download,
  Bell, Users, Megaphone, FileText
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
import { Notificacion, Prospecto } from './lib/supabase';
import {
  registrarProspectoYCompartir,
  obtenerProspectos,
  obtenerHistorialLeads,
  actualizarEstadoProspecto
} from './services/crm.service';

// ... rest of imports

// --- COMPONENTS ---

const KopparaLogo = ({ className = "h-20", compact = false }: { className?: string; compact?: boolean }) => {
  const [imgError, setImgError] = useState(false);
  const logoSrc = "/icon-512.png";

  if (compact) {
    return (
      <div className={`${className} overflow-hidden w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm`}>
        {!imgError ? (
          <img src={logoSrc} alt="K" className="h-4/5 w-auto object-contain" onError={() => setImgError(true)} />
        ) : (
          <span className="text-koppara-green font-black text-xl">K</span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-4 ${className} group`}>
      <div className="h-full aspect-square relative flex items-center justify-center">
        {!imgError ? (
          <img
            src={logoSrc}
            alt="Koppara"
            className="h-full w-auto object-contain transition-transform group-hover:scale-110 duration-500"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-12 h-12 bg-koppara-green rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-koppara-green/20">K</div>
        )}
      </div>
      <div className="flex flex-col justify-center">
        <span className="text-2xl md:text-3xl font-black text-koppara-gray tracking-[-0.05em] leading-none mb-1">
          Koppara<span className="text-koppara-green">.</span>
        </span>
        <span className="text-[7px] md:text-[9px] uppercase font-black tracking-[0.4em] text-slate-400 leading-none">
          Cosmética Botánica
        </span>
      </div>
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
      const isNetworkError = error.message === 'Failed to fetch' || error.message?.includes('network');
      setMensaje({
        text: isNetworkError
          ? '❌ Error de Conexión: El servidor no responde. Verifica si tu proyecto de Supabase está PAUSADO o si el ID es correcto.'
          : '❌ Error: ' + error.message,
        type: 'error'
      });
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

// URL Fija del Catálogo Maestro en Supabase Storage
const MASTER_CATALOG_URL = 'https://rgrdogwwczlxakeggnbu.supabase.co/storage/v1/object/public/catalogo-assets/catalogo_maestro_koppara.pdf';

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
  const [prospectos, setProspectos] = useState<Prospecto[]>([]);
  const [historialLeads, setHistorialLeads] = useState<Lead[]>([]);
  const [isCrmLoading, setIsCrmLoading] = useState(false);
  const [crmView, setCrmView] = useState<'notifs' | 'prospectos' | 'historial'>('notifs');

  // Popup de registro de prospecto
  const [showProspectoPopup, setShowProspectoPopup] = useState(false);
  const [prospectoTemp, setProspectoTemp] = useState({ nombre: '', telefono: '' });
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
      try {
        const { data: { user } } = await supabase.auth.getUser();

        // Hardcoded admin for initial setup of owner
        if (user?.email === 'wibbydashboard@gmail.com') {
          setIsAdmin(true);
        } else if (user?.user_metadata?.role === 'admin') {
          setIsAdmin(true);
        } else if (currentView === 'admin') {
          setCurrentView(distributor ? 'socias' : 'catalog');
        }
      } catch (err) {
        console.error("Auth Check Error", err);
      }
    };
    checkRole();
  }, [currentView, distributor]);

  useEffect(() => {
    if (distributor) {
      const loadCrm = async () => {
        setIsCrmLoading(true);
        try {
          const listNotifs = await obtenerNotificaciones(distributor.nivel, distributor.id);
          setNotificaciones(listNotifs);
          setUnreadNotif(listNotifs.filter(n => !n.leida).length);

          const listProspectos = await obtenerProspectos(distributor.id);
          setProspectos(listProspectos);

          const listLeads = await obtenerHistorialLeads(distributor.id);
          setHistorialLeads(listLeads);
        } catch (e) {
          console.error("Error cargando CRM", e);
        } finally {
          setIsCrmLoading(false);
        }
      };
      loadCrm();
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

  const handleShareWithCrm = async () => {
    if (!prospectoTemp.nombre || !prospectoTemp.telefono) {
      alert("Por favor ingresa el nombre y teléfono del cliente para continuar.");
      return;
    }

    if (distributor) {
      try {
        await registrarProspectoYCompartir(
          distributor.id,
          { nombre: prospectoTemp.nombre, telefono: prospectoTemp.telefono },
          cart.map(i => ({ id: i.id, name: i.name, qty: i.quantity })),
          cartTotal
        );

        // Recargar datos
        const updatedProspectos = await obtenerProspectos(distributor.id);
        setProspectos(updatedProspectos);
        const updatedLeads = await obtenerHistorialLeads(distributor.id);
        setHistorialLeads(updatedLeads);
      } catch (e) {
        console.error("Error en CRM auto-registro", e);
      }
    }

    const message = `¡Hola ${prospectoTemp.nombre}! 👋 Soy ${distributor?.nombre || 'tu distribuidora'} de Koppara México. Es un gusto saludarte.\n\nAquí tienes el desglose de lo que platicamos:\n\n${cart.map(i => `✅ ${i.name} (${i.quantity}) - ${formatCurrency(i.price)}`).join('\n')}\n\n*Total a pagar: ${formatCurrency(cartTotal)}*\n\n📂 *Descarga nuestro catálogo completo aquí:* ${MASTER_CATALOG_URL}\n\n¿Quieres que agendemos tu entrega hoy mismo? ✨`;
    window.open(getWhatsAppLink(prospectoTemp.telefono, message), '_blank');
    setShowProspectoPopup(false);
    setCart([]);
  };

  const checkNeedsFollowUp = (date: string) => {
    const interactionDate = new Date(date);
    const now = new Date();
    const diffHours = Math.abs(now.getTime() - interactionDate.getTime()) / 36e5;
    return diffHours >= 48 && diffHours < 72; // Ventana de 48h a 72h
  };

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter(p => {
      const matchesCategory = activeCategory === 'Todos' || p.category === activeCategory;
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      const isPublished = p.status !== 'draft';
      // Admins can see drafts in the main catalog for preview
      return matchesCategory && matchesSearch && (isPublished || isAdmin);
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
      <header className={`no-print sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'py-1' : 'py-3 px-4 md:px-8'}`}>
        <div className={`max-w-7xl mx-auto flex items-center justify-between rounded-full floating-nav transition-all duration-300 ${scrolled ? 'px-4 py-1.5 border-b' : 'px-6 py-2.5 border border-slate-100 shadow-lg'}`}>
          <nav className="hidden lg:flex items-center gap-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex-1">
            <button onClick={() => setCurrentView('catalog')} className={`hover:text-koppara-green transition ${currentView === 'catalog' ? 'text-koppara-green' : ''}`}>Catálogo</button>
            <button onClick={() => setCurrentView(distributor?.isSocia ? 'socias' : 'join')} className={`hover:text-koppara-green transition ${currentView === 'socias' || currentView === 'join' ? 'text-koppara-green' : ''}`}>Membresía</button>
          </nav>

          <div className="flex-[2] flex items-center justify-center cursor-pointer group" onClick={() => { setCurrentView('catalog'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <KopparaLogo className="h-[60px] group-hover:scale-105 transition-transform" />
          </div>

          <div className="flex-1 flex items-center justify-end gap-2 md:gap-4">
            {/* Search (Desktop only) */}
            <div className="hidden md:flex items-center bg-koppara-lightGray rounded-full px-4 py-2 border border-slate-100 focus-within:border-koppara-green transition-all max-w-[300px]">
              <Search size={16} className="text-slate-300" />
              <input type="text" placeholder="Buscar..." className="bg-transparent border-none outline-none text-xs ml-2 w-full focus:ring-0 transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            {/* Admin Shield (More prominent) */}
            {isAdmin && (
              <button
                onClick={() => setCurrentView('admin')}
                className={`flex items-center gap-2 p-2 md:px-4 md:py-2 rounded-full transition-all shadow-sm ${currentView === 'admin' ? 'bg-koppara-green text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                <ShieldCheck size={20} />
                <span className="hidden sm:inline text-[9px] font-black uppercase tracking-widest">Maestro</span>
              </button>
            )}

            {/* Cart */}
            <button onClick={() => setIsCartOpen(true)} className={`relative flex items-center gap-2 bg-white border border-slate-100 hover:border-koppara-green/30 hover:bg-koppara-lightGray p-2.5 md:px-5 md:py-2.5 rounded-full transition-all group ${isCartAnimating ? 'animate-cart-bounce' : ''}`}>
              <ShoppingCart size={18} className="text-koppara-gray group-hover:text-koppara-green transition-colors" />
              {cartTotal > 0 && <span className="hidden md:inline text-[11px] font-bold text-koppara-gray">{formatCurrency(cartTotal)}</span>}
              {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-koppara-green text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">{cart.length}</span>}
            </button>

            {/* User Profile / Login */}
            {user || distributor ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentView(distributor?.isSocia ? 'socias' : 'catalog')}
                  className={`flex items-center gap-2 p-2 md:px-4 md:py-2 rounded-full transition-all ${currentView === 'socias' ? 'bg-koppara-dark text-white' : 'bg-slate-100 text-slate-500'}`}
                >
                  <UserCircle size={20} />
                  <span className="hidden sm:inline text-[9px] font-black uppercase tracking-widest">Socia</span>
                </button>
                <button onClick={handleLogout} className="p-2.5 rounded-full bg-slate-50 text-slate-300 hover:text-red-500 transition"><LogOut size={18} /></button>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center gap-2 bg-slate-100 text-slate-500 hover:bg-koppara-green hover:text-white px-4 py-2.5 rounded-full transition-all group shadow-sm active:scale-95"
              >
                <UserCircle size={20} className="group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Acceso</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Views */}
      <main>
        {currentView === 'catalog' && (
          <div className="animate-fadeIn">
            <section className="pt-12 pb-8 text-center max-w-4xl mx-auto px-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-koppara-green/10 text-koppara-green rounded-full text-[9px] font-bold uppercase tracking-[0.3em] mb-4">
                <Sparkles size={10} /> Colección Luxury 2024
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-koppara-gray mb-6 leading-tight">Tu belleza,<br />desde la raíz.</h1>
              <div className="flex flex-wrap justify-center gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${activeCategory === cat ? 'bg-koppara-green text-white border-koppara-green shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-koppara-green'}`}>{cat}</button>
                ))}
              </div>
            </section>

            <section className="max-w-7xl mx-auto px-4 md:px-8 py-8">
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map(p => (
                    <div key={p.id} className="luxury-card group bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex flex-col cursor-pointer transition-all hover:border-koppara-green/20" onClick={() => setSelectedProduct(p)}>
                      <div className="h-48 rounded-lg shadow-sm border border-slate-50 mb-4 overflow-hidden relative">
                        <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-koppara-green shadow-sm">{p.category}</div>
                      </div>
                      <div className="px-1 flex-1 flex flex-col">
                        <h3 className="text-lg font-bold text-koppara-gray mb-1.5">{p.name}</h3>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mb-4 leading-relaxed">"{p.description}"</p>
                        <div className="mt-auto flex items-center justify-between">
                          <p className="text-xl font-bold text-koppara-gray tracking-tight">{formatCurrency(p.price)}</p>
                          <button onClick={(e) => { e.stopPropagation(); handleAddToCart(p); }} className="w-10 h-10 bg-koppara-green/5 hover:bg-koppara-green text-koppara-green hover:text-white rounded-xl transition-all flex items-center justify-center border border-koppara-green/10">
                            <Plus size={20} />
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
          <div className="animate-fadeIn py-12 max-w-7xl mx-auto px-4">
            {referralCode && (
              <div className="bg-koppara-green/5 py-4 mb-8 border-y border-koppara-green/10 text-center rounded-2xl">
                <p className="text-base font-display italic text-koppara-gray mb-0.5">"Has recibido una invitación exclusiva"</p>
                <p className="text-[9px] font-bold text-koppara-green uppercase tracking-[0.3em]">Beneficio Especial Activado: 10% OFF</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {[
                { name: 'Básica', price: 0, perks: ['15% descuento', 'Catálogo Digital', 'Grupo WhatsApp'] },
                { name: 'Luxury', price: 1500, perks: ['25% descuento', 'Kit Inicio Premium', '10% comisión referidos'], popular: true },
                { name: 'Elite', price: 3500, perks: ['35% descuento', 'Kit Elite Gold', 'Envíos Gratis SIEMPRE'] },
              ].map(plan => (
                <div key={plan.name} className={`p-8 rounded-xl border flex flex-col relative transition-all ${plan.popular ? 'bg-koppara-dark text-white shadow-xl scale-102 z-10 border-transparent' : 'bg-white border-slate-100 shadow-lg text-koppara-gray'}`}>
                  {plan.popular && <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-koppara-green text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">Más Popular</span>}
                  <h3 className={`text-xl font-bold mb-1 ${plan.popular ? 'text-white' : 'text-koppara-gray'}`}>{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-3xl font-bold">{plan.price === 0 ? 'Gratis' : formatCurrency(plan.price)}</span>
                    {plan.price > 0 && <span className={`text-[9px] uppercase font-bold ml-1.5 ${plan.popular ? 'text-white/40' : 'opacity-40'}`}>/ año</span>}
                  </div>
                  <ul className={`space-y-2.5 mb-8 flex-1 text-xs font-medium ${plan.popular ? 'text-white/90' : 'text-slate-600'}`}>
                    {plan.perks.map(perk => (
                      <li key={perk} className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-koppara-green shrink-0" />
                        <span className={perk.includes('Envíos Gratis') ? 'text-[#FFD700] font-black' : ''}>{perk}</span>
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => plan.price === 0 ? setCurrentView('catalog') : setSelectedCheckoutPlan(plan)} className={`w-full py-4 rounded-xl font-bold transition uppercase tracking-widest text-[10px] ${plan.popular ? 'bg-koppara-green text-white' : 'bg-koppara-lightGray text-koppara-gray'}`}>
                    {plan.name === 'Básica' ? 'Registrarme' : 'Unirme Ahora'}
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-center">
              <button onClick={() => setShowProspectoPopup(true)} className="max-w-md w-full bg-koppara-green text-white py-4 rounded-xl font-bold font-display shadow-lg shadow-koppara-green/20 hover:scale-105 transition-all text-xs uppercase tracking-widest">Compartir con Cliente</button>
            </div>
          </div>
        )}

        {currentView === 'socias' && distributor && (
          <div className="bg-white animate-fadeIn">
            <div className="max-w-7xl mx-auto px-6 py-8">

              {/* Nav CRM Interno */}
              <div className="flex gap-3 mb-8 overflow-x-auto pb-2 no-scrollbar">
                {[
                  { id: 'notifs', label: 'Mi Actividad', icon: Sparkles },
                  { id: 'prospectos', label: 'Mis Clientes', icon: Users },
                  { id: 'historial', label: 'Mis Compartidos', icon: MessageCircle }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setCrmView(t.id as any)}
                    className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full font-bold text-[10px] uppercase tracking-widest whitespace-nowrap transition-all ${crmView === t.id ? 'bg-koppara-green text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                      }`}
                  >
                    <t.icon size={14} /> {t.label}
                  </button>
                ))}
              </div>

              {crmView === 'notifs' && (
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-6">
                    <div className="bg-koppara-dark p-6 md:p-10 rounded-2xl text-white overflow-hidden relative group">
                      <div className="absolute top-0 right-0 w-48 h-48 bg-koppara-green/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                      <div className="relative z-10 flex items-center justify-between">
                        <div>
                          <div className="text-[9px] uppercase font-black tracking-widest text-koppara-green mb-3 opacity-80">Socia Nivel {distributor.nivel}</div>
                          <h2 className="text-3xl md:text-3xl font-black mb-3 tracking-tight">¡Hola, {distributor.nombre.split(' ')[0]}!</h2>
                          <div className="flex flex-wrap gap-3 items-center">
                            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                              <span className="text-[9px] font-bold text-white/50 lowercase">balance:</span>
                              <span className="font-bold text-xs">{formatCurrency(distributor.gananciasAcumuladas)}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                              <span className="text-[9px] font-bold text-white/50 lowercase">referidos:</span>
                              <span className="font-bold text-xs">{distributor.referidosActivos}</span>
                            </div>
                          </div>
                        </div>
                        <div className="hidden md:flex w-16 h-16 bg-white/5 rounded-2xl items-center justify-center text-koppara-green border border-white/10 transform group-hover:rotate-6 transition-transform">
                          <UserCircle size={32} />
                        </div>
                      </div>
                    </div>

                    {/* Avisos App Section */}
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Bell size={20} className="text-koppara-green" /> Avisos para ti
                      </h3>
                      <div className="space-y-4">
                        {notificaciones.length === 0 ? (
                          <div className="p-8 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                            <p className="text-sm text-slate-400">No hay avisos por ahora.</p>
                          </div>
                        ) : (
                          notificaciones.map(n => (
                            <div key={n.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-start gap-4">
                              <div className={`p-3 rounded-2xl ${n.categoria === 'urgente' ? 'bg-red-50 text-red-500' : 'bg-koppara-lightGreen text-koppara-green'}`}>
                                {n.categoria === 'urgente' ? <Megaphone size={20} /> : <Gift size={20} />}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-800">{n.titulo}</h4>
                                <p className="text-sm text-slate-500 mt-1">{n.cuerpo}</p>
                                <span className="text-[10px] font-medium text-slate-300 mt-2 block uppercase">{new Date(n.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 group shadow-sm">
                      <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Sparkles size={18} className="text-amber-500" /> Comparte tu Catálogo
                      </h4>
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 mb-6">
                        <p className="text-[10px] font-black tracking-widest text-slate-300 uppercase mb-2">Tu link único</p>
                        <div className="bg-slate-50 p-3 rounded-xl text-[11px] font-mono text-slate-400 overflow-hidden text-ellipsis mb-4">
                          koppara.vercel.app/?ref={distributor.codigoReferido}
                        </div>
                        <button onClick={() => { navigator.clipboard.writeText(`https://koppara.vercel.app/?ref=${distributor.codigoReferido}`); alert("¡Copiado al portapapeles!"); }} className="w-full bg-koppara-dark text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-black transition">
                          <Copy size={16} /> Copiar Link
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed text-center">Gana el 10% de comisión por cada compra que realicen tus clientes.</p>
                    </div>
                  </div>
                </div>
              )}

              {crmView === 'prospectos' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black text-slate-800">Mis Clientes</h3>
                    <div className="text-xs font-bold text-slate-400 bg-slate-100 px-4 py-2 rounded-full">{prospectos.length} contactos</div>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {prospectos.map(p => (
                      <div key={p.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
                        {checkNeedsFollowUp(p.ultima_interaccion) && (
                          <div className="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-black uppercase px-4 py-1.5 rounded-bl-xl flex items-center gap-1">
                            <Bell size={10} /> Seguimiento 48h
                          </div>
                        )}
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 font-black text-xl">
                            {p.nombre.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800">{p.nombre}</h4>
                            <p className="text-xs text-slate-400">{p.telefono}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-6">
                          <select
                            className={`text-[9px] font-black uppercase py-1.5 px-3 rounded-full border-none outline-none cursor-pointer transition-all ${p.estado === 'venta_cerrada' ? 'bg-green-100 text-green-700' :
                              p.estado === 'en_proceso' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                              }`}
                            value={p.estado}
                            onChange={async (e) => {
                              await actualizarEstadoProspecto(p.id, e.target.value as any);
                              const updated = await obtenerProspectos(distributor.id);
                              setProspectos(updated);
                            }}
                          >
                            <option value="interesado">Interesado</option>
                            <option value="en_proceso">En Proceso</option>
                            <option value="venta_cerrada">Venta Cerrada</option>
                          </select>
                          <span className="text-[9px] text-slate-300 font-bold ml-auto">Última vez: {new Date(p.ultima_interaccion).toLocaleDateString()}</span>
                        </div>
                        <button
                          onClick={() => window.open(`https://wa.me/${p.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`¡Hola ${p.nombre.split(' ')[0]}! 👋 Solo pasaba a saludarte y ver si pudiste revisar los productos de Koppara que te compartí. ¿Tienes alguna duda?`)}`, '_blank')}
                          className="w-full bg-slate-50 group-hover:bg-koppara-green group-hover:text-white text-slate-400 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-100 flex items-center justify-center gap-2"
                        >
                          <MessageCircle size={14} /> Recontactar WhatsApp
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {crmView === 'historial' && (
                <div className="space-y-6 animate-fadeIn">
                  <h3 className="text-2xl font-black text-slate-800">Historial de Compartición</h3>
                  <div className="grid gap-4">
                    {historialLeads.map(lead => (
                      <div key={lead.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
                            <FileText size={20} />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800">{lead.nombre_cliente}</h4>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {lead.productos?.map((prod: any) => (
                                <span key={prod.id} className="text-[9px] font-bold text-koppara-green bg-koppara-lightGreen px-2 py-0.5 rounded-full">
                                  {prod.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-6">
                          <div className="hidden md:block">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Monto Cotizado</p>
                            <p className="font-bold text-slate-700">{formatCurrency(lead.monto)}</p>
                          </div>
                          <div className="px-4 py-2 bg-slate-50 rounded-xl text-center">
                            <p className="text-[9px] font-black text-slate-300 uppercase">Fecha</p>
                            <p className="text-xs font-bold text-slate-500">{new Date(lead.fecha_pedido).toLocaleDateString()}</p>
                          </div>
                          <button
                            onClick={() => window.open(`https://wa.me/${lead.whatsapp_cliente.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${lead.nombre_cliente.split(' ')[0]}, ¿qué te parecieron los ${lead.productos.length} productos que te coticé?`)}`, '_blank')}
                            className="bg-slate-900 text-white p-3 rounded-2xl hover:scale-110 transition-transform"
                          >
                            <MessageCircle size={20} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {historialLeads.length === 0 && (
                      <div className="py-20 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                        <Package size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-slate-400 font-bold">Sin actividad de compartición reciente.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between">
                <button onClick={handleLogout} className="flex items-center gap-2 text-slate-400 font-bold text-xs hover:text-red-500 transition-colors">
                  <LogOut size={16} /> Cerrar Sesión
                </button>
                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Dashboard V.2.1 • CRM Activo</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Prospecto Registration Popup */}
      {showProspectoPopup && (
        <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800 mb-1.5">Registro de Cliente</h3>
            <p className="text-[11px] text-slate-400 mb-5">Para llevar un orden, por favor dinos a quién le envías esta cotización.</p>
            <div className="space-y-3">
              <input
                placeholder="Nombre del Cliente"
                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-koppara-green"
                value={prospectoTemp.nombre}
                onChange={e => setProspectoTemp({ ...prospectoTemp, nombre: e.target.value })}
              />
              <input
                placeholder="WhatsApp (Ej: 4771234567)"
                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-koppara-green"
                value={prospectoTemp.telefono}
                onChange={e => setProspectoTemp({ ...prospectoTemp, telefono: e.target.value })}
              />
              <button
                onClick={handleShareWithCrm}
                className="w-full bg-koppara-green text-white py-3.5 rounded-xl font-bold shadow-md shadow-koppara-green/20 text-xs"
              >
                Abrir WhatsApp y Registrar
              </button>
              <button onClick={() => setShowProspectoPopup(false)} className="w-full text-slate-400 text-[10px] font-bold py-1">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col animate-slideIn">
            <div className="p-6 flex items-center justify-between border-b">
              <div className="flex items-center gap-3"><ShoppingCart size={20} className="text-koppara-green" /><h2 className="text-xl font-bold font-display tracking-tight">Mi Cotización</h2></div>
              <button onClick={() => setIsCartOpen(false)}><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
            <div className="p-6 bg-koppara-lightGray border-t">
              <div className="flex justify-between items-end mb-4"><span className="text-slate-400 font-bold uppercase text-[9px]">Total</span><span className="text-2xl font-bold text-koppara-gray">{formatCurrency(cartTotal)}</span></div>
              <button
                disabled={cart.length === 0}
                onClick={handleShareWithCrm}
                className="w-full bg-koppara-green text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg uppercase tracking-widest text-[10px]"
              >
                <MessageCircle size={18} /> Cerrar Venta WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoginModalOpen && <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />}
      {selectedCheckoutPlan && <CheckoutModal plan={selectedCheckoutPlan.name} precio={selectedCheckoutPlan.price} codigoReferido={referralCode} onClose={() => setSelectedCheckoutPlan(null)} onSuccess={handleCheckoutSuccess} />}
      {selectedProduct && <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAddToCart={handleAddToCart} />}

      {
        isPdfModalOpen && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
            <div className="bg-white w-full max-w-lg rounded-lg shadow-md border border-slate-100">
              <button onClick={() => setIsPdfModalOpen(false)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-600"><X size={24} /></button>
              <div className="text-center mb-8">
                <KopparaLogo className="h-10 mx-auto mb-5" />
                <h2 className="text-2xl font-bold text-koppara-gray">Descargar Catalogo PDF</h2>
                <p className="text-slate-400 text-sm mt-2">Personaliza tu portada antes de generar el PDF.</p>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-6">
                  <p className="text-sm text-slate-500 mb-4 font-medium leading-relaxed">
                    Hemos optimizado el sistema. Ahora puedes descargar el <b>Catálogo Maestro 2026</b> de forma instantánea. No necesitas esperar a que se genere.
                  </p>
                  <a
                    href={MASTER_CATALOG_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-koppara-green text-white py-5 rounded-xl font-bold shadow-lg shadow-koppara-green/20 hover:bg-koppara-forest transition active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                  >
                    <Download size={20} /> Descargar Catálogo Maestro
                  </a>
                </div>

                <p className="text-[10px] text-slate-300 text-center px-8">
                  * Este catálogo contiene todos los productos publicados y precios vigentes actualizados por la central.
                </p>
              </div>
            </div>
          </div>
        )
      }
      {/* Removed duplicate modals here */}

      <footer className="py-12 bg-koppara-lightGray text-center mt-12">
        <KopparaLogo className="h-8 mx-auto mb-4 opacity-30 grayscale" />
        <p className="text-[9px] text-slate-300 font-bold uppercase tracking-[0.4em]">&copy; 2024 Koppara México • Luxury Experience</p>
      </footer>
      {/* Notification List Modal if Bell Clicked */}
      {
        unreadNotif === 0 && notificaciones.length > 0 && (
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
        )
      }

      {
        currentView === 'admin' && isAdmin && (
          <AdminPanel
            onClose={() => setCurrentView('catalog')}
            descargarPDF={() => descargarCatalogoPDF(true)}
            catalogoUrl={MASTER_CATALOG_URL}
          />
        )
      }
    </div>
  );
}

const ProductModal: React.FC<{ product: Product; onClose: () => void; onAddToCart: (p: Product) => void; }> = ({ product, onClose, onAddToCart }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-0 md:p-6 animate-fadeIn">
    <div className="bg-white w-full h-full md:h-auto md:max-w-5xl md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-slideUp relative">

      {/* Botón Cerrar Flotante (Visible en todo momento) */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 bg-white/90 md:bg-slate-100 text-slate-800 p-3 rounded-full shadow-lg hover:bg-red-50 hover:text-red-500 transition-all active:scale-90"
        aria-label="Cerrar vista"
      >
        <X size={24} />
      </button>

      {/* Área de Imagen */}
      <div className="w-full md:w-1/2 h-[40vh] md:h-auto relative bg-slate-50">
        <img
          src={product.image}
          className="w-full h-full object-cover"
          alt={product.name}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent md:hidden" />
      </div>

      {/* Área de Contenido con Scroll Propio */}
      <div className="flex-1 overflow-y-auto p-6 md:p-12 flex flex-col">
        <div className="mb-8">
          <span className="inline-block px-3 py-1 bg-koppara-green/10 text-koppara-green text-[10px] font-black uppercase tracking-widest rounded-full mb-4">
            {product.category}
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-koppara-gray mb-4 leading-tight">
            {product.name}
          </h2>
          <p className="text-slate-500 text-sm md:text-base font-medium italic leading-relaxed">
            "{product.description}"
          </p>
        </div>

        {/* Sección Ritual / Detalles */}
        {product.products && product.products.length > 0 && (
          <div className="bg-slate-50 rounded-3xl p-6 md:p-8 mb-8 border border-slate-100">
            <h4 className="text-[10px] uppercase font-black text-slate-400 mb-4 tracking-[0.2em]">Incluye en el ritual:</h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {product.products.map(it => (
                <li key={it} className="flex items-center gap-3 text-xs md:text-sm font-bold text-slate-600">
                  <div className="w-5 h-5 bg-koppara-green/20 rounded-full flex items-center justify-center text-koppara-green">
                    <CheckCircle2 size={12} />
                  </div>
                  {it}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer del Modal (Fijado abajo en Desktop) */}
        <div className="mt-auto pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <p className="text-[10px] font-bold text-slate-300 uppercase mb-1 tracking-widest">Inversión Sugerida</p>
            <p className="text-3xl md:text-4xl font-black text-koppara-gray tracking-tighter">
              {formatCurrency(product.price)}
            </p>
          </div>
          <button
            onClick={() => { onAddToCart(product); onClose(); }}
            className="w-full sm:w-auto bg-koppara-green text-white font-black px-10 py-5 rounded-2xl shadow-xl shadow-koppara-green/20 hover:bg-koppara-forest flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[10px] transition-all hover:-translate-y-1 active:scale-95"
          >
            Añadir a Bolsa <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  </div>
);
