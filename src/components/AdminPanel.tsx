import React, { useEffect, useState } from 'react';
import { supabase, Producto, Notificacion } from '../lib/supabase';
import {
  X, Save, RefreshCcw, Plus, Bell, Package,
  FileText, Megaphone, Send, Trash2, Eye, EyeOff,
  TrendingUp, Users, DollarSign, Upload, MessageCircle,
  Activity, Award, Target, BarChart3, ChevronRight,
  Clock, Edit, Image as ImageIcon, CheckCircle2
} from 'lucide-react';
import { enviarNotificacion } from '../services/notifications.service';
import { obtenerEstadisticasAdmin, PromotoraStats, ProductStat } from '../services/admin.service';

const CATEGORIAS = ['Relax', 'Facial', 'Corporal', 'Especializado', 'Capilar', 'Eco'];

type AdminProductForm = Producto & {
  isEditing?: boolean;
};

type AdminPanelProps = {
  onClose: () => void;
  descargarPDF: () => Promise<void>;
  catalogoUrl: string;
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, descargarPDF, catalogoUrl }) => {
  const [activeTab, setActiveTab] = useState<'products' | 'notifications' | 'sync' | 'stats'>('products');
  const [editingProduct, setEditingProduct] = useState<AdminProductForm | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [items, setItems] = useState<AdminProductForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // Notification State
  const [notifForm, setNotifForm] = useState({
    titulo: '',
    cuerpo: '',
    categoria: 'promocion' as any,
    nivel_objetivo: 'todas' as any
  });

  const loadProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setMessage({ text: `Error: ${error.message}`, type: 'error' });
    } else {
      setItems(data as AdminProductForm[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
    loadStats();
  }, []);

  const loadStats = async () => {
    const data = await obtenerEstadisticasAdmin();
    setStats(data);
  };

  const handleProductChange = (id: string, field: keyof Producto, value: any) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const saveProduct = async (product: AdminProductForm) => {
    // Validación de campos obligatorios
    if (!product.nombre?.trim() || product.precio <= 0 || !product.referencia?.trim()) {
      setMessage({
        text: '⚠️ Faltan datos: Nombre, Precio y SKU son obligatorios.',
        type: 'error'
      });
      return;
    }

    const { isEditing, ...dataToSave } = product;

    // Asegurar que guardamos en 'description' para coincidir con la nueva columna
    const finalData = {
      ...dataToSave,
      description: dataToSave.description || (dataToSave as any).descripcion || ''
    };

    const { error } = await supabase.from('productos').upsert(finalData);
    if (error) {
      setMessage({ text: `Error al guardar: ${error.message}`, type: 'error' });
    } else {
      setMessage({ text: '✅ Producto guardado correctamente', type: 'success' });
      loadProducts();
    }
  };

  const calculateDiscount = (price: number, percent: number) => price * (1 - percent / 100);

  const handleSendNotif = async () => {
    try {
      await enviarNotificacion(notifForm);
      setMessage({ text: 'Notificación enviada y registrada', type: 'success' });
      setNotifForm({ titulo: '', cuerpo: '', categoria: 'promocion', nivel_objetivo: 'todas' });
    } catch (err: any) {
      setMessage({ text: `Error: ${err.message}`, type: 'error' });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setMessage({ text: 'Error: Solo se permiten archivos PDF', type: 'error' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const fileName = 'catalogo_maestro_koppara.pdf';
      const { error } = await supabase.storage
        .from('catalogo-assets')
        .upload(fileName, file, {
          upsert: true,
          contentType: 'application/pdf',
          cacheControl: '3600'
        });

      if (error) {
        if (error.message.includes('bucket not found')) {
          const { error: errorFallback } = await supabase.storage
            .from('public')
            .upload(fileName, file, { upsert: true });
          if (errorFallback) throw errorFallback;
        } else {
          throw error;
        }
      }

      setMessage({ text: '✅ Catálogo subido y sincronizado correctamente', type: 'success' });
    } catch (err: any) {
      console.error('Upload error:', err);
      setMessage({ text: `❌ Error al subir: ${err.message}`, type: 'error' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm('¿Estás segura de que deseas eliminar este producto? Esta acción no se puede deshacer.')) return;
    try {
      const { error } = await supabase.from('productos').delete().eq('id', id);
      if (error) throw error;
      setItems(items.filter(i => i.id !== id));
      setMessage({ text: 'Producto eliminado correctamente', type: 'success' });
    } catch (err: any) {
      setMessage({ text: `Error: ${err.message}`, type: 'error' });
    }
  };
  const handleRemoveCatalog = async () => {
    if (!window.confirm('¿Estás segura de que deseas eliminar el catálogo actual? Las vendedoras ya no podrán descargarlo.')) return;

    setUploading(true);
    try {
      const fileName = 'catalogo_maestro_koppara.pdf';
      const { error } = await supabase.storage
        .from('catalogo-assets')
        .remove([fileName]);

      if (error) throw error;
      setMessage({ text: '✅ Catálogo eliminado correctamente del sistema', type: 'success' });
    } catch (err: any) {
      console.error('Remove error:', err);
      setMessage({ text: `❌ Error al eliminar: ${err.message}`, type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[230] bg-slate-900/95 backdrop-blur-xl flex flex-col md:p-4 animate-fadeIn font-sans">
      <div className="flex-1 bg-white md:rounded-[1.5rem] shadow-2xl flex flex-col overflow-hidden max-w-[1600px] mx-auto w-full">

        {/* Header Admin */}
        <header className="px-6 py-3 border-b flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-koppara-green rounded-xl flex items-center justify-center text-white shadow-md shadow-koppara-green/20">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Panel Maestro Koppara</h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Control Central de Operaciones</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-white hover:text-red-500 transition-all shadow-sm">
            <X size={20} />
          </button>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Nav */}
          <aside className="w-20 md:w-52 border-r bg-slate-50/50 flex flex-col p-3 gap-1.5">
            {[
              { id: 'products', icon: Package, label: 'Productos' },
              { id: 'stats', icon: BarChart3, label: 'Estadísticas' },
              { id: 'notifications', icon: Megaphone, label: 'Avisos' },
              { id: 'sync', icon: RefreshCcw, label: 'Sincronización' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-bold text-xs uppercase tracking-wider ${activeTab === tab.id
                  ? 'bg-koppara-green text-white shadow-md shadow-koppara-green/20'
                  : 'text-slate-400 hover:bg-white hover:text-koppara-green'
                  }`}
              >
                <tab.icon size={16} />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            ))}

            <div className="mt-auto bg-white p-3 rounded-xl border border-slate-100 hidden md:block">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Estado DB</span>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              </div>
              <p className="text-[10px] font-medium text-slate-600">Conexión Segura</p>
            </div>
          </aside>

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full">
            {message && (
              <div className={`mb-6 p-3 rounded-xl flex items-center justify-between animate-slideDown ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                <span className="font-bold text-xs">{message.text}</span>
                <button onClick={() => setMessage(null)}><X size={14} /></button>
              </div>
            )}

            {activeTab === 'products' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-800 tracking-tight">Catálogo de Productos</h3>
                  <button
                    onClick={() => setItems([{ id: crypto.randomUUID(), nombre: 'Nuevo Producto', referencia: 'KOP-', categoria: 'Relax', description: '', precio: 0, activo: true, status: 'draft', imagen_url: '', beneficios: [], modo_uso: '', ingredientes: [], certificaciones: [], rituales: [], created_at: new Date().toISOString() }, ...items])}
                    className="flex items-center gap-2 bg-koppara-green text-white px-5 py-2.5 rounded-full font-bold shadow-lg shadow-koppara-green/20 hover:scale-105 transition-transform text-xs"
                  >
                    <Plus size={18} /> Nuevo Producto
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">
                        <th className="px-4 py-3">Producto</th>
                        <th className="px-4 py-3">Categoría / SKU</th>
                        <th className="px-4 py-3">Precio Público</th>
                        <th className="px-4 py-3">Márgenes Socia</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map(product => (
                        <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 group relative">
                                <img src={product.image || product.imagen_url} className="w-full h-full object-cover" />
                                <button className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Upload size={12} />
                                </button>
                              </div>
                              <div className="flex flex-col">
                                <input
                                  className="font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 text-xs w-36"
                                  value={product.nombre}
                                  onKeyDown={e => e.stopPropagation()}
                                  onChange={e => handleProductChange(product.id, 'nombre', e.target.value)}
                                  placeholder="Nombre..."
                                />
                                <span className="text-[9px] text-slate-400 font-mono tracking-tighter">{product.id.slice(0, 8)}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              className="text-[10px] font-bold text-slate-500 bg-slate-100 border-none rounded px-1.5 py-0.5 mb-1 block"
                              value={product.categoria}
                              onChange={e => handleProductChange(product.id, 'categoria', e.target.value)}
                            >
                              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <input
                              className="text-[10px] text-slate-400 bg-transparent border-none p-0 focus:ring-0 w-20 font-mono"
                              value={product.referencia}
                              onKeyDown={e => e.stopPropagation()}
                              onChange={e => handleProductChange(product.id, 'referencia', e.target.value)}
                              placeholder="KOP-..."
                            />
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-700">
                            <div className="flex items-center gap-0.5">
                              <span className="text-xs">$</span>
                              <input
                                type="number"
                                className="w-16 bg-transparent border-none p-0 focus:ring-0 text-xs font-bold"
                                value={product.precio}
                                onKeyDown={e => e.stopPropagation()}
                                onChange={e => handleProductChange(product.id, 'precio', Number(e.target.value))}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="text-[8px] text-slate-400 uppercase">Bas: <b>${calculateDiscount(product.precio, 15).toFixed(0)}</b></span>
                              <span className="text-[8px] text-koppara-forest font-bold border-l-2 border-koppara-green pl-1 my-0.5">Lux: <b>${calculateDiscount(product.precio, 25).toFixed(0)}</b></span>
                              <span className="text-[8px] text-slate-400 uppercase">Eli: <b>${calculateDiscount(product.precio, 35).toFixed(0)}</b></span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleProductChange(product.id, 'status', product.status === 'published' ? 'draft' : 'published')}
                              className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${product.status === 'published'
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : 'bg-slate-100 text-slate-400 border border-slate-200'
                                }`}
                            >
                              {product.status === 'published' ? 'Publicado' : 'Borrador'}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setEditingProduct(product)}
                                className="p-1.5 bg-slate-100 text-slate-600 rounded flex items-center justify-center hover:bg-slate-200 transition-colors"
                                title="Editar detalles completos"
                              >
                                <Edit size={14} />
                              </button>
                              <button onClick={() => saveProduct(product)} className="p-1.5 bg-slate-900 text-white rounded flex items-center justify-center hover:bg-black transition-colors shadow-sm"><Save size={14} /></button>
                              <button onClick={() => deleteProduct(product.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors flex items-center justify-center"><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="max-w-3xl space-y-8 animate-fadeIn">
                <h3 className="text-3xl font-bold text-slate-800">Centro de Avisos</h3>

                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categoría del Mensaje</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-koppara-green"
                        value={notifForm.categoria}
                        onChange={e => setNotifForm({ ...notifForm, categoria: e.target.value as any })}
                      >
                        <option value="promocion">Promoción ✨</option>
                        <option value="urgente">Urgente 🚨</option>
                        <option value="lanzamiento">Lanzamiento 🆕</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dirigido a:</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-koppara-green"
                        value={notifForm.nivel_objetivo}
                        onChange={e => setNotifForm({ ...notifForm, nivel_objetivo: e.target.value as any })}
                      >
                        <option value="todas">Todas las socias</option>
                        <option value="basica">Solo Básica</option>
                        <option value="luxury">Solo Luxury</option>
                        <option value="elite">Solo Elite</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asunto</label>
                    <input
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 font-bold text-sm outline-none focus:border-koppara-green"
                      placeholder="Ej: Nuevos precios de temporada..."
                      value={notifForm.titulo}
                      onKeyDown={e => e.stopPropagation()}
                      onChange={e => setNotifForm({ ...notifForm, titulo: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cuerpo del Mensaje</label>
                    <textarea
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm min-h-[120px] outline-none focus:border-koppara-green"
                      placeholder="Escribe el contenido detallado aquí..."
                      value={notifForm.cuerpo}
                      onKeyDown={e => e.stopPropagation()}
                      onChange={e => setNotifForm({ ...notifForm, cuerpo: e.target.value })}
                    />
                  </div>

                  <div className="pt-6 flex flex-col md:flex-row gap-4">
                    <button
                      onClick={handleSendNotif}
                      className="flex-1 bg-koppara-green text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-koppara-green/20 hover:scale-[1.02] transition-all"
                    >
                      <Send size={20} /> Enviar Aviso a la App
                    </button>
                    {notifForm.categoria === 'urgente' && (
                      <button className="flex-1 bg-slate-900 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-black transition-all">
                        <MessageCircle size={20} /> Notificar por WhatsApp
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sync' && (
              <div className="max-w-2xl space-y-8 animate-fadeIn">
                <h3 className="text-3xl font-bold text-slate-800">Sincronización del Sistema</h3>
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-8">
                  <div className="flex items-start gap-6">
                    <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shrink-0">
                      <FileText size={28} />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-slate-800">Catálogo Maestro Centralizado</h4>
                      <p className="text-sm text-slate-500 mt-2 mb-6">
                        Sube una nueva versión del catálogo PDF. Este archivo se distribuirá automáticamente a todas las socias.
                        Actualizar aquí ahorra tiempo de carga y garantiza que todos compartan la misma información.
                      </p>

                      <div className="flex flex-col sm:flex-row gap-4">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          className="hidden"
                          accept=".pdf"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className={`bg-koppara-green text-white px-8 py-4 rounded-full font-bold shadow-xl shadow-koppara-green/20 hover:scale-105 transition-all flex items-center gap-3 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Upload size={20} /> {uploading ? 'Subiendo...' : 'Subir Nuevo Catálogo Maestro (PDF)'}
                        </button>

                        <a
                          href={catalogoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-slate-100 text-slate-600 px-8 py-4 rounded-full font-bold hover:bg-slate-200 transition-all flex items-center gap-3"
                        >
                          <Eye size={20} /> Ver Actual
                        </a>

                        <button
                          onClick={handleRemoveCatalog}
                          disabled={uploading}
                          className="bg-red-50 text-red-500 px-6 py-4 rounded-full font-bold hover:bg-red-100 transition-all flex items-center gap-2"
                        >
                          <Trash2 size={18} /> Eliminar
                        </button>
                      </div>

                      <p className="text-[10px] text-slate-400 mt-4 font-mono italic">
                        Ruta Destino: storage/catalogo-assets/catalogo_maestro_koppara.pdf
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'stats' && stats && (
              <div className="space-y-10 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="w-12 h-12 bg-koppara-green/10 text-koppara-green rounded-2xl flex items-center justify-center mb-4">
                      <Activity size={24} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conversión Global</p>
                    <h4 className="text-3xl font-black text-slate-800 mt-1">{stats.global.conversionPromedio.toFixed(1)}%</h4>
                  </div>
                  <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-4">
                      <DollarSign size={24} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto en Cotizaciones</p>
                    <h4 className="text-3xl font-black text-slate-800 mt-1">${(stats.global.totalMonto / 1000).toFixed(1)}k</h4>
                  </div>
                  <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-4">
                      <Target size={24} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Ventas</p>
                    <h4 className="text-3xl font-black text-slate-800 mt-1">{stats.global.totalVentas}</h4>
                  </div>
                  <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center mb-4">
                      <Users size={24} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Socias Activas</p>
                    <h4 className="text-3xl font-black text-slate-800 mt-1">{stats.promotoras.length}</h4>
                  </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Eficiencia por Promotora */}
                  <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      Eficiencia por Promotora
                    </h3>
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                      <div className="p-8 border-b bg-slate-50/50">
                        <p className="text-xs text-slate-400">Embudo de ventas y tasa de efectividad por socia.</p>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {stats.promotoras.map((p: any) => (
                          <div key={p.id} className="p-6 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-400">
                                  {p.nombre.charAt(0)}
                                </div>
                                <div>
                                  <h5 className="font-bold text-slate-800">{p.nombre}</h5>
                                  <p className="text-[10px] text-slate-400 font-mono uppercase">ID: {p.id.slice(0, 8)}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`text-[10px] font-black px-3 py-1 rounded-full ${p.slaIndex < 70 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                  SLA: {p.slaIndex.toFixed(0)}%
                                </span>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mb-4">
                              <div className="bg-slate-50 p-3 rounded-2xl text-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase">Contactos</p>
                                <p className="font-bold text-slate-700">{p.contactos}</p>
                              </div>
                              <div className="bg-slate-50 p-3 rounded-2xl text-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase">Compartidos</p>
                                <p className="font-bold text-slate-700">{p.compartidos}</p>
                              </div>
                              <div className="bg-koppara-green/5 p-3 rounded-2xl text-center">
                                <p className="text-[9px] font-black text-koppara-green uppercase">Ventas</p>
                                <p className="font-bold text-koppara-green">{p.ventas}</p>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                                <span>Conversión</span>
                                <span>{p.conversion.toFixed(1)}%</span>
                              </div>
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-koppara-green transition-all"
                                  style={{ width: `${p.conversion}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Ranking y Productos */}
                  <div className="space-y-8">
                    <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-10 opacity-10">
                        <Award size={100} />
                      </div>
                      <h3 className="text-xl font-bold mb-6 flex items-center gap-2 relative z-10">
                        <Award className="text-amber-400" /> Líderes del Mes
                      </h3>
                      <div className="space-y-4 relative z-10">
                        {stats.promotoras.sort((a: any, b: any) => b.montoTotal - a.montoTotal).slice(0, 3).map((p: any, idx: number) => (
                          <div key={p.id} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-black text-white/20 italic">0{idx + 1}</span>
                              <span className="font-bold text-sm truncate w-24">{p.nombre.split(' ')[0]}</span>
                            </div>
                            <span className="text-xs font-mono font-bold text-amber-400">${(p.montoTotal / 1000).toFixed(1)}k</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
                      <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <TrendingUp className="text-koppara-green" /> Top Productos
                      </h3>
                      <div className="space-y-4">
                        {stats.productos.slice(0, 5).map((prod: any) => (
                          <div key={prod.nombre} className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-700">{prod.nombre}</span>
                              <span className="text-[10px] text-slate-400 uppercase font-bold">{prod.cantidad} cotizados</span>
                            </div>
                            <ChevronRight size={16} className="text-slate-200" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100">
                      <h4 className="text-xs font-black text-red-600 uppercase mb-4 flex items-center gap-2">
                        <Clock size={14} /> Alerta de Seguimiento
                      </h4>
                      <p className="text-[11px] text-red-500/80 leading-relaxed">
                        {stats.promotoras.filter((p: any) => p.slaIndex < 50).length} promotoras tienen un índice de seguimiento crítico (menor al 50%). Se recomienda capacitación inmediata.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Modal de Edición Completa */}
      {editingProduct && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl">
            <div className="px-10 py-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Edit className="text-koppara-green" />
                <h3 className="text-xl font-bold text-slate-800">Editar Detalles: {editingProduct.nombre}</h3>
              </div>
              <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-red-500"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Columna Izquierda: Información Básica */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Descripción del Producto</label>
                    <textarea
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs focus:border-koppara-green min-h-[100px]"
                      placeholder="Describe la experiencia de lujo..."
                      value={editingProduct.description || ''}
                      onKeyDown={e => e.stopPropagation()}
                      onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Modo de Uso / Ritual</label>
                    <textarea
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs focus:border-koppara-green min-h-[80px]"
                      placeholder="Paso a paso del ritual..."
                      value={editingProduct.modo_uso || ''}
                      onKeyDown={e => e.stopPropagation()}
                      onChange={e => setEditingProduct({ ...editingProduct, modo_uso: e.target.value })}
                    />
                  </div>
                </div>

                {/* Columna Derecha: Listas (Beneficios, Ingredientes) */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Beneficios Clave (Separados por coma)</label>
                    <textarea
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs focus:border-koppara-green min-h-[60px]"
                      placeholder="Relajación profunda, Piel hidratada, etc..."
                      value={(editingProduct.beneficios || []).join(', ')}
                      onKeyDown={e => e.stopPropagation()}
                      onChange={e => setEditingProduct({ ...editingProduct, beneficios: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Ingredientes Botánicos (Separados por coma)</label>
                    <textarea
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs focus:border-koppara-green min-h-[60px]"
                      placeholder="Aceite de coco, Menta piperita, etc..."
                      value={(editingProduct.ingredientes || []).join(', ')}
                      onKeyDown={e => e.stopPropagation()}
                      onChange={e => setEditingProduct({ ...editingProduct, ingredientes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t flex justify-end gap-4">
              <button
                onClick={() => setEditingProduct(null)}
                className="px-8 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  setItems(items.map(i => i.id === editingProduct.id ? editingProduct : i));
                  await saveProduct(editingProduct);
                  setEditingProduct(null);
                }}
                className="bg-koppara-green text-white px-10 py-3 rounded-xl font-bold shadow-lg shadow-koppara-green/20 hover:scale-105 transition"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ShieldCheck: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
