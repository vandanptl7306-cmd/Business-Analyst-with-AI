// client/src/pages/StockManagement.jsx
import React, { useState, useEffect } from 'react';
import {
  Package, Plus, Pencil, Trash2, AlertTriangle, CheckCircle,
  RefreshCw, X, Save, Loader2, Search, ShieldAlert, CalendarClock,
} from 'lucide-react';
import {
  getProductsList, createProduct, updateProduct, deleteProduct,
} from '../services/product';

// ── helpers ──────────────────────────────────────────────────────────────────
const today = () => new Date();

const expiryStatus = (expiryDate) => {
  if (!expiryDate) return null;
  const exp = new Date(expiryDate);
  const diff = Math.ceil((exp - today()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: 'Expired', color: 'red', days: diff };
  if (diff <= 30) return { label: `Exp. in ${diff}d`, color: 'amber', days: diff };
  return { label: `Exp. in ${diff}d`, color: 'green', days: diff };
};

const stockStatus = (qty, threshold) => {
  if (qty === 0) return { label: 'Out of Stock', color: 'red' };
  if (qty <= threshold) return { label: 'Low Stock', color: 'amber' };
  return { label: 'In Stock', color: 'green' };
};

const badgeClass = (color) => {
  const map = {
    red: 'bg-red-50 text-red-600 border-red-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  };
  return `text-[10px] font-bold px-2 py-0.5 rounded-lg border ${map[color]}`;
};

// ── blank form ────────────────────────────────────────────────────────────────
const blankForm = () => ({
  name: '', sku: '', mrp: '', sellingPrice: '', taxRate: 18,
  quantity: '', unit: 'pcs', lowStockThreshold: 5, expiryDate: '',
});

// ── component ─────────────────────────────────────────────────────────────────
export default function StockManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blankForm());
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const flash = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await getProductsList();
      if (data.success) setProducts(data.products);
    } catch (e) {
      console.error('Failed to load products', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── derived lists ─────────────────────────────────────────────────────────
  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filterStatus === 'out') return p.quantity === 0;
    if (filterStatus === 'low') return p.quantity > 0 && p.quantity <= p.lowStockThreshold;
    if (filterStatus === 'expiring') {
      if (!p.expiryDate) return false;
      const diff = Math.ceil((new Date(p.expiryDate) - today()) / (1000 * 60 * 60 * 24));
      return diff <= 30;
    }
    return true;
  });

  const alertCount = products.filter(
    (p) => p.quantity <= p.lowStockThreshold ||
      (p.expiryDate && Math.ceil((new Date(p.expiryDate) - today()) / (1000 * 60 * 60 * 24)) <= 30)
  ).length;

  // ── form handlers ─────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingId(null);
    setForm(blankForm());
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditingId(p._id);
    setForm({
      name: p.name,
      sku: p.sku,
      mrp: p.mrp,
      sellingPrice: p.sellingPrice || '',
      taxRate: p.taxRate || 18,
      quantity: p.quantity,
      unit: p.unit || 'pcs',
      lowStockThreshold: p.lowStockThreshold ?? 5,
      expiryDate: p.expiryDate ? new Date(p.expiryDate).toISOString().split('T')[0] : '',
    });
    setFormError('');
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditingId(null); };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim() || !form.sku.trim() || form.mrp === '') {
      setFormError('Name, SKU and MRP are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        mrp: Number(form.mrp),
        sellingPrice: form.sellingPrice !== '' ? Number(form.sellingPrice) : Number(form.mrp),
        taxRate: Number(form.taxRate),
        quantity: Number(form.quantity) || 0,
        lowStockThreshold: Number(form.lowStockThreshold) || 5,
        expiryDate: form.expiryDate || null,
      };
      if (editingId) {
        await updateProduct(editingId, payload);
        flash('Stock updated successfully.');
      } else {
        await createProduct(payload);
        flash('Product added to stock.');
      }
      closeForm();
      load();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product from stock? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await deleteProduct(id);
      flash('Product removed from stock.');
      load();
    } catch (err) {
      alert('Failed to delete product.');
    } finally {
      setDeletingId(null);
    }
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-in fade-in duration-300">

      {/* Header banner — matches Dashboard banner style */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-indigo-50/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Stock Management</h1>
              <p className="text-xs text-slate-500 font-medium mt-1">Live inventory — add stock, track expiry, monitor low levels</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={load}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button onClick={openAdd}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm">
              <Plus className="h-3.5 w-3.5" />
              <span>Add Stock</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success flash */}
      {successMsg && (
        <div className="flex items-center space-x-2 p-3 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700 text-sm">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Alert banner */}
      {alertCount > 0 && (
        <div className="flex items-center space-x-3 p-4 rounded-xl border border-amber-100 bg-amber-50 text-amber-700 text-sm">
          <ShieldAlert className="h-5 w-5 flex-shrink-0 text-amber-500" />
          <span>
            <span className="font-bold">{alertCount} item{alertCount > 1 ? 's' : ''}</span> need attention — low stock or expiring soon.
          </span>
        </div>
      )}

      {/* Stats cards — matches Dashboard card-module grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        {[
          { label: 'Total Products', value: products.length, icon: Package, bgGradient: 'bg-indigo-50 text-indigo-600' },
          { label: 'In Stock', value: products.filter(p => p.quantity > p.lowStockThreshold).length, icon: CheckCircle, bgGradient: 'bg-emerald-50 text-emerald-600' },
          { label: 'Low / Out of Stock', value: products.filter(p => p.quantity <= p.lowStockThreshold).length, icon: AlertTriangle, bgGradient: 'bg-amber-50 text-amber-600' },
          { label: 'Expiring ≤30 days', value: products.filter(p => p.expiryDate && Math.ceil((new Date(p.expiryDate) - today()) / (1000*60*60*24)) <= 30).length, icon: CalendarClock, bgGradient: 'bg-red-50 text-red-600' },
        ].map((s) => (
          <div key={s.label} className="card-module flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</span>
              <div className={`p-2 rounded-lg ${s.bgGradient} flex items-center justify-center`}>
                <s.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-xl font-bold tracking-tight text-slate-800 font-mono">{s.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filters + Table — matches Dashboard card-module */}
      <div className="card-module space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Inventory Catalog</h2>
            <p className="text-xs text-slate-500 leading-normal mt-0.5">Search, filter and manage all stock items in real-time</p>
          </div>

          {/* Search + filter tabs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or SKU..."
                className="pl-8 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-300 w-52"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[['all', 'All'], ['low', 'Low Stock'], ['out', 'Out of Stock'], ['expiring', 'Expiring Soon']].map(([val, label]) => (
                <button key={val} onClick={() => setFilterStatus(val)}
                  className={`text-[11px] font-bold px-3 py-2 rounded-xl border transition-all ${
                    filterStatus === val
                      ? 'bg-indigo-50 border-indigo-100 text-indigo-600'
                      : 'border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-3 bg-slate-50/50">
            <Package className="h-10 w-10 text-slate-400 mx-auto" />
            <p className="text-slate-400 text-xs font-medium">No products match your filter.</p>
            <button onClick={openAdd} className="text-xs font-bold text-indigo-600 hover:text-indigo-500">
              Add your first product
            </button>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-left">SKU</th>
                  <th className="px-4 py-3 text-center">Qty / Unit</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">MRP</th>
                  <th className="px-4 py-3 text-center">GST</th>
                  <th className="px-4 py-3 text-center">Expiry</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                {filtered.map((p) => {
                  const ss = stockStatus(p.quantity, p.lowStockThreshold);
                  const es = expiryStatus(p.expiryDate);
                  return (
                    <tr key={p._id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-4 py-3.5 font-semibold text-slate-800">{p.name}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-500">{p.sku}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="font-bold text-slate-800">{p.quantity}</span>
                        <span className="text-slate-400 ml-1">{p.unit || 'pcs'}</span>
                        <div className="text-[10px] text-slate-400 mt-0.5">threshold: {p.lowStockThreshold}</div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={badgeClass(ss.color)}>{ss.label}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-800">₹{p.mrp}</td>
                      <td className="px-4 py-3.5 text-center text-slate-500">{p.taxRate || 18}%</td>
                      <td className="px-4 py-3.5 text-center">
                        {es ? (
                          <div className="flex items-center justify-center space-x-1">
                            {es.color !== 'green' && <CalendarClock className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />}
                            <span className={badgeClass(es.color)}>{es.label}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEdit(p)}
                            className="inline-flex items-center space-x-1 text-[11px] text-indigo-600 hover:text-indigo-500 font-bold bg-indigo-50 border border-indigo-100 px-2.5 py-1.5 rounded-lg transition-all">
                            <Pencil className="h-3 w-3" />
                            <span>Edit</span>
                          </button>
                          <button onClick={() => handleDelete(p._id)} disabled={deletingId === p._id}
                            className="inline-flex items-center space-x-1 text-[11px] text-red-600 hover:text-red-500 font-bold bg-red-50 border border-red-100 px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-40">
                            {deletingId === p._id
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <Trash2 className="h-3 w-3" />}
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ─────────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Package className="h-4 w-4" />
                </div>
                <h2 className="text-base font-bold text-slate-800">
                  {editingId ? 'Edit Stock Item' : 'Add New Stock'}
                </h2>
              </div>
              <button onClick={closeForm} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl border border-red-100 bg-red-50 text-red-600 text-xs flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Row 1: Name + SKU */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Product Name <span className="text-red-500">*</span></label>
                  <input type="text" required value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="e.g. Basmati Rice"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">SKU <span className="text-red-500">*</span></label>
                  <input type="text" required value={form.sku}
                    onChange={e => setForm({...form, sku: e.target.value.toUpperCase()})}
                    placeholder="e.g. RIC-BAS-01"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 font-mono outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
              </div>

              {/* Row 2: MRP + Selling Price + GST */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">MRP (₹) <span className="text-red-500">*</span></label>
                  <input type="number" required min="0" step="0.01" value={form.mrp}
                    onChange={e => setForm({...form, mrp: e.target.value})}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Selling Price (₹)</label>
                  <input type="number" min="0" step="0.01" value={form.sellingPrice}
                    onChange={e => setForm({...form, sellingPrice: e.target.value})}
                    placeholder="Same as MRP"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">GST Rate</label>
                  <select value={form.taxRate} onChange={e => setForm({...form, taxRate: Number(e.target.value)})}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-300">
                    {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </div>
              </div>

              {/* Row 3: Quantity + Unit + Low Stock Threshold */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Quantity <span className="text-red-500">*</span></label>
                  <input type="number" required min="0" value={form.quantity}
                    onChange={e => setForm({...form, quantity: e.target.value})}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Unit</label>
                  <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-300">
                    {['pcs','kg','g','litre','ml','box','pack','dozen','metre'].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Low Stock Alert At</label>
                  <input type="number" min="0" value={form.lowStockThreshold}
                    onChange={e => setForm({...form, lowStockThreshold: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
              </div>

              {/* Row 4: Expiry Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  Expiry Date <span className="text-slate-400 font-normal">(optional — leave blank if not applicable)</span>
                </label>
                <input type="date" value={form.expiryDate}
                  onChange={e => setForm({...form, expiryDate: e.target.value})}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={closeForm}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 text-sm font-semibold transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all disabled:opacity-50 shadow-sm">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>{saving ? 'Saving...' : editingId ? 'Update Stock' : 'Add to Stock'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
