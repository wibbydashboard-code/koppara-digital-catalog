import React, { useEffect, useState } from 'react';
import { supabase, Producto } from '../lib/supabase';
import { actualizarProductosEnSupabase, productosActualizados } from '../utils/actualizarProductos';
import { X, Save, RefreshCcw, Plus } from 'lucide-react';

const CATEGORIAS = ['Relax', 'Facial', 'Corporal', 'Especializado', 'Capilar', 'Eco'];

type AdminProductForm = {
  referencia: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  precio: number;
  precio_distribuidor: number | null;
  imagen_url: string;
  beneficios: string;
  modo_uso: string;
  ingredientes: string;
  certificaciones: string;
  rituales: string;
  activo: boolean;
};

type AdminPanelProps = {
  onClose: () => void;
};

const parseList = (value: string) =>
  value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);

const mapFromDb = (product: Producto): AdminProductForm => ({
  referencia: product.referencia ?? '',
  nombre: product.nombre ?? '',
  categoria: product.categoria ?? 'Relax',
  descripcion: product.descripcion ?? '',
  precio: Number(product.precio ?? 0),
  precio_distribuidor: product.precio_distribuidor ?? null,
  imagen_url: product.imagen_url ?? '',
  beneficios: (product.beneficios || []).join('\n'),
  modo_uso: product.modo_uso ?? '',
  ingredientes: (product.ingredientes || []).join('\n'),
  certificaciones: (product.certificaciones || []).join('\n'),
  rituales: (product.rituales || []).join('\n'),
  activo: product.activo ?? true
});

const createEmpty = (): AdminProductForm => ({
  referencia: '',
  nombre: '',
  categoria: 'Relax',
  descripcion: '',
  precio: 0,
  precio_distribuidor: null,
  imagen_url: '',
  beneficios: '',
  modo_uso: '',
  ingredientes: '',
  certificaciones: '',
  rituales: '',
  activo: true
});

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [items, setItems] = useState<AdminProductForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingRef, setSavingRef] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkCurrent, setBulkCurrent] = useState(0);
  const [bulkTotal, setBulkTotal] = useState(0);
  const [bulkSuccessCount, setBulkSuccessCount] = useState(0);

  const loadProducts = async () => {
    setLoading(true);
    setMessage(null);
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setMessage(`Error al cargar productos: ${error.message}`);
      setLoading(false);
      return;
    }

    const mapped = (data as Producto[]).map(mapFromDb);
    setItems(mapped);
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleChange = (index: number, field: keyof AdminProductForm, value: string | number | boolean | null) => {
    setItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[index], [field]: value } as AdminProductForm;
      copy[index] = item;
      return copy;
    });
  };

  const saveProduct = async (product: AdminProductForm) => {
    if (!product.referencia.trim()) {
      setMessage('La referencia es obligatoria.');
      return;
    }
    setSavingRef(product.referencia);
    setMessage(null);

    const payload = {
      referencia: product.referencia.trim(),
      nombre: product.nombre.trim(),
      categoria: product.categoria,
      descripcion: product.descripcion.trim(),
      precio: Number(product.precio) || 0,
      precio_distribuidor: product.precio_distribuidor === null || product.precio_distribuidor === undefined
        ? null
        : Number(product.precio_distribuidor) || 0,
      imagen_url: product.imagen_url.trim(),
      beneficios: parseList(product.beneficios),
      modo_uso: product.modo_uso.trim(),
      ingredientes: parseList(product.ingredientes),
      certificaciones: parseList(product.certificaciones),
      rituales: parseList(product.rituales),
      activo: product.activo
    };

    const { error } = await supabase
      .from('productos')
      .upsert(payload, { onConflict: 'referencia' });

    if (error) {
      setMessage(`Error al guardar ${product.referencia}: ${error.message}`);
      setSavingRef(null);
      return;
    }

    setMessage(`Producto ${product.referencia} actualizado.`);
    setSavingRef(null);
    loadProducts();
  };

  const handleBulkUpdate = async () => {
    if (bulkLoading) return;
    setBulkLoading(true);
    setMessage(null);
    setBulkCurrent(0);
    setBulkTotal(productosActualizados.length);
    setBulkSuccessCount(0);
    try {
      const updated = await actualizarProductosEnSupabase(productosActualizados, (current, total) => {
        setBulkCurrent(current);
        setBulkTotal(total);
      });
      setBulkSuccessCount(updated.length);
      setMessage(`✅ ${updated.length} productos actualizados correctamente`);
      loadProducts();
    } catch (error: any) {
      setMessage(`Error en actualizacion masiva: ${error.message || 'Error desconocido'}`);
    } finally {
      setBulkLoading(false);
    }
  };

  const progressPercent = bulkTotal > 0 ? Math.round((bulkCurrent / bulkTotal) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[230] bg-black/60 backdrop-blur-md p-4 overflow-auto">
      <div className="max-w-6xl mx-auto bg-white rounded-[2rem] p-8 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold font-display text-slate-800">Admin Panel Productos</h2>
            <p className="text-slate-400 text-sm">Edicion rapida para desarrollo local.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadProducts}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-400 transition"
            >
              <RefreshCcw size={16} />
              Recargar
            </button>
            <button
              onClick={() => setItems((prev) => [createEmpty(), ...prev])}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-koppara-green text-white font-bold shadow-md shadow-koppara-green/30 hover:bg-koppara-forest transition"
            >
              <Plus size={16} />
              Nuevo
            </button>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-koppara-green/20 bg-koppara-green/10 p-4">
          <div>
            <div className="text-sm font-bold text-slate-700">Actualizar Productos desde Template</div>
            <div className="text-xs text-slate-500">Sincroniza todos los productos usando el template.</div>
          </div>
          <button
            onClick={() => setBulkModalOpen(true)}
            disabled={bulkLoading}
            className="flex items-center gap-2 rounded-full bg-koppara-green px-4 py-2 text-white font-bold shadow-md shadow-koppara-green/30 hover:bg-koppara-forest transition disabled:opacity-60"
          >
            <RefreshCcw size={16} />
            Actualizar Productos desde Template
          </button>
        </div>

        {bulkLoading && (
          <div className="mb-4 rounded-2xl border border-slate-100 bg-white p-4">
            <div className="text-sm text-slate-600">Actualizando producto {bulkCurrent} de {bulkTotal}...</div>
            <div className="mt-3 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-koppara-green transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-slate-400">{progressPercent}% completado</div>
          </div>
        )}

        {message && <div className="mb-4 text-sm text-slate-600">{message}</div>}

        {loading ? (
          <div className="text-slate-400">Cargando productos...</div>
        ) : (
          <div className="space-y-6">
            {items.map((item, index) => (
              <div key={`${item.referencia}-${index}`} className="border border-slate-100 rounded-3xl p-6 shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  <div className="lg:col-span-4">
                    <div className="aspect-square bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center">
                      {item.imagen_url ? (
                        <img src={item.imagen_url} alt={item.nombre} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-slate-300 text-sm">Sin imagen</span>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="URL imagen"
                      className="mt-3 w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2"
                      value={item.imagen_url}
                      onChange={(e) => handleChange(index, 'imagen_url', e.target.value)}
                    />
                  </div>

                  <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Referencia"
                      className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2"
                      value={item.referencia}
                      onChange={(e) => handleChange(index, 'referencia', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Nombre"
                      className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2"
                      value={item.nombre}
                      onChange={(e) => handleChange(index, 'nombre', e.target.value)}
                    />
                    <select
                      className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2"
                      value={item.categoria}
                      onChange={(e) => handleChange(index, 'categoria', e.target.value)}
                    >
                      {CATEGORIAS.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Precio"
                        className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2"
                        value={item.precio}
                        onChange={(e) => handleChange(index, 'precio', Number(e.target.value))}
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Precio distribuidor"
                        className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2"
                        value={item.precio_distribuidor ?? ''}
                        onChange={(e) => handleChange(index, 'precio_distribuidor', e.target.value === '' ? null : Number(e.target.value))}
                      />
                    </div>
                    <textarea
                      placeholder="Descripcion"
                      className="md:col-span-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 min-h-[90px]"
                      value={item.descripcion}
                      onChange={(e) => handleChange(index, 'descripcion', e.target.value)}
                    />
                    <textarea
                      placeholder="Beneficios (uno por linea)"
                      className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 min-h-[90px]"
                      value={item.beneficios}
                      onChange={(e) => handleChange(index, 'beneficios', e.target.value)}
                    />
                    <textarea
                      placeholder="Ingredientes (uno por linea)"
                      className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 min-h-[90px]"
                      value={item.ingredientes}
                      onChange={(e) => handleChange(index, 'ingredientes', e.target.value)}
                    />
                    <textarea
                      placeholder="Modo de uso"
                      className="md:col-span-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 min-h-[90px]"
                      value={item.modo_uso}
                      onChange={(e) => handleChange(index, 'modo_uso', e.target.value)}
                    />
                    <textarea
                      placeholder="Certificaciones (uno por linea)"
                      className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 min-h-[90px]"
                      value={item.certificaciones}
                      onChange={(e) => handleChange(index, 'certificaciones', e.target.value)}
                    />
                    <textarea
                      placeholder="Rituales (uno por linea)"
                      className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 min-h-[90px]"
                      value={item.rituales}
                      onChange={(e) => handleChange(index, 'rituales', e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-slate-500">
                    <input
                      type="checkbox"
                      checked={item.activo}
                      onChange={(e) => handleChange(index, 'activo', e.target.checked)}
                    />
                    Activo
                  </label>
                  <button
                    onClick={() => saveProduct(item)}
                    disabled={savingRef === item.referencia}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white font-bold hover:bg-black transition disabled:opacity-60"
                  >
                    <Save size={16} />
                    {savingRef === item.referencia ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {bulkModalOpen && (
        <div className="fixed inset-0 z-[240] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            <h3 className="text-xl font-bold font-display text-slate-800">Actualizar productos</h3>
            <p className="mt-3 text-sm text-slate-500">¿Estas seguro de actualizar todos los productos?</p>
            <p className="mt-1 text-xs text-slate-400">Se actualizaran {productosActualizados.length} productos en total.</p>
            <p className="mt-2 text-xs text-slate-400">Esto sobrescribira los datos existentes si las referencias coinciden.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setBulkModalOpen(false)}
                className="rounded-full border border-slate-200 px-4 py-2 text-slate-500 hover:text-slate-900 hover:border-slate-400 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setBulkModalOpen(false);
                  handleBulkUpdate();
                }}
                className="rounded-full bg-koppara-green px-4 py-2 text-white font-bold shadow-md shadow-koppara-green/30 hover:bg-koppara-forest transition"
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
