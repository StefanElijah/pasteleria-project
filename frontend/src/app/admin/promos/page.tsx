'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Promocion, Category, Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const emptyForm = {
    nombre: '',
    bonoPorcentaje: 100,
    objetivo: 'TODO',
    fechaInicio: '',
    fechaFin: '',
    prioridad: 0,
    activo: true,
    productoIds: [] as string[],
    categoriaIds: [] as string[],
};

export default function AdminPromosPage() {
    const [promos, setPromos] = useState<Promocion[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...emptyForm });
    const [saving, setSaving] = useState(false);
    const [warnings, setWarnings] = useState<string[]>([]);

    const fetchAll = async () => setPromos((await api.get('/promociones')).data);

    useEffect(() => {
        fetchAll();
        api.get('/categories?activo=all').then(({ data }) => setCategories(data)).catch(() => { });
        api.get('/products?activo=all').then(({ data }) => setProducts(data)).catch(() => { });
    }, []);

    const reset = () => { setForm({ ...emptyForm }); setEditingId(null); setShowForm(false); setWarnings([]); };

    const toggle = (arr: string[], id: string) => arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];

    const payload = () => ({
        nombre: form.nombre,
        bonoPorcentaje: Number(form.bonoPorcentaje) || 0,
        objetivo: form.objetivo,
        activo: form.activo,
        prioridad: Number(form.prioridad) || 0,
        fechaInicio: form.fechaInicio || undefined,
        fechaFin: form.fechaFin || undefined,
        productoIds: form.objetivo === 'PRODUCTOS' ? form.productoIds : [],
        categoriaIds: form.objetivo === 'CATEGORIAS' ? form.categoriaIds : [],
    });

    const handleEdit = (p: Promocion) => {
        setEditingId(p.id);
        setShowForm(true);
        setForm({
            nombre: p.nombre,
            bonoPorcentaje: p.bonoPorcentaje,
            objetivo: p.objetivo,
            fechaInicio: p.fechaInicio ? p.fechaInicio.slice(0, 10) : '',
            fechaFin: p.fechaFin ? p.fechaFin.slice(0, 10) : '',
            prioridad: p.prioridad,
            activo: p.activo,
            productoIds: p.productos?.map((x) => x.id) || [],
            categoriaIds: p.categorias?.map((x) => x.id) || [],
        });
    };

    const validar = async () => {
        try {
            const { data } = await api.post('/promociones/validar', payload());
            setWarnings(data.parciales?.map((p: any) => `Se solapa parcialmente con "${p.nombre}"`) || []);
        } catch { /* ignore */ }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.nombre) { toast.error('El nombre es obligatorio'); return; }
        setSaving(true);
        try {
            if (editingId) {
                await api.patch(`/promociones/${editingId}`, payload());
                toast.success('Promoción actualizada');
            } else {
                await api.post('/promociones', payload());
                toast.success('Promoción creada');
            }
            reset();
            fetchAll();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'No se pudo guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Desactivar esta promoción?')) return;
        await api.delete(`/promociones/${id}`).catch(() => toast.error('No se pudo desactivar'));
        fetchAll();
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Promociones de puntos</h1>
                <Button onClick={() => { reset(); setShowForm(true); }}>Nueva promoción</Button>
            </div>

            {showForm && (
                <Card className="mb-6">
                    <CardHeader><CardTitle className="text-base">{editingId ? 'Editar promoción' : 'Nueva promoción'}</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Nombre *</label>
                                    <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Bono de puntos (%)</label>
                                    <Input type="number" value={form.bonoPorcentaje} onChange={(e) => setForm({ ...form, bonoPorcentaje: Number(e.target.value) })} />
                                    <p className="text-xs text-muted-foreground mt-1">100 = x2 puntos</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Prioridad (desempate)</label>
                                    <Input type="number" value={form.prioridad} onChange={(e) => setForm({ ...form, prioridad: Number(e.target.value) })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Alcance</label>
                                <Select value={form.objetivo} onValueChange={(v) => setForm({ ...form, objetivo: v })}>
                                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TODO">Toda la tienda</SelectItem>
                                        <SelectItem value="PRODUCTOS">Productos específicos</SelectItem>
                                        <SelectItem value="CATEGORIAS">Categorías específicas</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {form.objetivo === 'PRODUCTOS' && (
                                <div className="border rounded p-3 max-h-40 overflow-y-auto grid grid-cols-2 gap-1">
                                    {products.map((p) => (
                                        <label key={p.id} className="flex items-center gap-2 text-sm">
                                            <input type="checkbox" checked={form.productoIds.includes(p.id)} onChange={() => setForm({ ...form, productoIds: toggle(form.productoIds, p.id) })} />
                                            {p.nombre}
                                        </label>
                                    ))}
                                </div>
                            )}
                            {form.objetivo === 'CATEGORIAS' && (
                                <div className="border rounded p-3 max-h-40 overflow-y-auto grid grid-cols-2 gap-1">
                                    {categories.map((c) => (
                                        <label key={c.id} className="flex items-center gap-2 text-sm">
                                            <input type="checkbox" checked={form.categoriaIds.includes(c.id)} onChange={() => setForm({ ...form, categoriaIds: toggle(form.categoriaIds, c.id) })} />
                                            {c.nombre}
                                        </label>
                                    ))}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Inicio</label>
                                    <Input type="date" value={form.fechaInicio} onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Fin (opcional)</label>
                                    <Input type="date" value={form.fechaFin} onChange={(e) => setForm({ ...form, fechaFin: e.target.value })} />
                                </div>
                            </div>

                            {warnings.length > 0 && (
                                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded p-3 text-sm space-y-1">
                                    {warnings.map((w, i) => (
                                        <p key={i} className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {w}</p>
                                    ))}
                                </div>
                            )}

                            <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
                                Activa
                            </label>

                            <div className="flex justify-between">
                                <Button type="button" variant="outline" onClick={validar}>Validar solapamiento</Button>
                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" onClick={reset}>Cancelar</Button>
                                    <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Bono</TableHead>
                                <TableHead>Alcance</TableHead>
                                <TableHead>Vigencia</TableHead>
                                <TableHead>Prioridad</TableHead>
                                <TableHead>Activa</TableHead>
                                <TableHead>Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {promos.length === 0 ? (
                                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No hay promociones</TableCell></TableRow>
                            ) : promos.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-medium">{p.nombre}</TableCell>
                                    <TableCell>+{p.bonoPorcentaje}%</TableCell>
                                    <TableCell className="text-xs">{p.objetivo === 'TODO' ? 'Todo' : p.objetivo === 'PRODUCTOS' ? 'Productos' : 'Categorías'}</TableCell>
                                    <TableCell className="text-xs">{p.fechaFin ? new Date(p.fechaFin).toLocaleDateString('es-CL') : 'Sin fin'}</TableCell>
                                    <TableCell>{p.prioridad}</TableCell>
                                    <TableCell>
                                        <Switch checked={p.activo} onCheckedChange={async () => { await api.patch(`/promociones/${p.id}`, { activo: !p.activo }); fetchAll(); }} />
                                    </TableCell>
                                    <TableCell className="space-x-1">
                                        <Button variant="outline" size="sm" onClick={() => handleEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleDelete(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
