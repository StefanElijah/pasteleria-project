'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Descuento, Category, Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const emptyForm = {
    nombre: '',
    codigo: '',
    tipo: 'PORCENTAJE',
    valor: 0,
    objetivo: 'TODO',
    fechaInicio: '',
    fechaFin: '',
    valorMinimoPedido: '',
    limiteUso: '',
    limiteUsoPorUsuario: '',
    activo: true,
    productoIds: [] as string[],
    categoriaIds: [] as string[],
};

export default function AdminCuponesPage() {
    const [cupones, setCupones] = useState<Descuento[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...emptyForm });
    const [saving, setSaving] = useState(false);

    const fetchAll = async () => {
        const { data } = await api.get('/discounts');
        setCupones(data);
    };

    useEffect(() => {
        fetchAll();
        api.get('/categories?activo=all').then(({ data }) => setCategories(data)).catch(() => { });
        api.get('/products?activo=all').then(({ data }) => setProducts(data)).catch(() => { });
    }, []);

    const reset = () => {
        setForm({ ...emptyForm });
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (c: Descuento) => {
        setEditingId(c.id);
        setShowForm(true);
        setForm({
            nombre: c.nombre,
            codigo: c.codigo || '',
            tipo: c.tipo,
            valor: c.valor,
            objetivo: c.objetivo,
            fechaInicio: c.fechaInicio ? c.fechaInicio.slice(0, 10) : '',
            fechaFin: c.fechaFin ? c.fechaFin.slice(0, 10) : '',
            valorMinimoPedido: c.valorMinimoPedido ? String(c.valorMinimoPedido) : '',
            limiteUso: c.limiteUso ? String(c.limiteUso) : '',
            limiteUsoPorUsuario: c.limiteUsoPorUsuario ? String(c.limiteUsoPorUsuario) : '',
            activo: c.activo,
            productoIds: c.productos?.map((p) => p.id) || [],
            categoriaIds: c.categorias?.map((p) => p.id) || [],
        });
    };

    const toggle = (arr: string[], id: string) => arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.nombre) { toast.error('El nombre es obligatorio'); return; }
        setSaving(true);
        try {
            const payload: any = {
                nombre: form.nombre,
                codigo: form.codigo || undefined,
                tipo: form.tipo,
                valor: Number(form.valor) || 0,
                objetivo: form.objetivo,
                activo: form.activo,
                fechaInicio: form.fechaInicio || undefined,
                fechaFin: form.fechaFin || undefined,
                valorMinimoPedido: form.valorMinimoPedido ? Number(form.valorMinimoPedido) : undefined,
                limiteUso: form.limiteUso ? Number(form.limiteUso) : undefined,
                limiteUsoPorUsuario: form.limiteUsoPorUsuario ? Number(form.limiteUsoPorUsuario) : undefined,
                productoIds: form.objetivo === 'PRODUCTOS_ESPECIFICOS' ? form.productoIds : [],
                categoriaIds: form.objetivo === 'CATEGORIAS_ESPECIFICAS' ? form.categoriaIds : [],
            };
            if (editingId) {
                await api.patch(`/discounts/${editingId}`, payload);
                toast.success('Cupón actualizado');
            } else {
                await api.post('/discounts', payload);
                toast.success('Cupón creado');
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
        if (!confirm('¿Desactivar este cupón?')) return;
        await api.delete(`/discounts/${id}`).catch(() => toast.error('No se pudo desactivar'));
        fetchAll();
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Cupones</h1>
                <Button onClick={() => { reset(); setShowForm(true); }}>Nuevo cupón</Button>
            </div>

            {showForm && (
                <Card className="mb-6">
                    <CardHeader><CardTitle className="text-base">{editingId ? 'Editar cupón' : 'Nuevo cupón'}</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Nombre *</label>
                                    <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Código (opcional)</label>
                                    <Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Tipo</label>
                                    <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PORCENTAJE">Porcentaje</SelectItem>
                                            <SelectItem value="MONTO_FIJO">Monto fijo</SelectItem>
                                            <SelectItem value="ENVIO_GRATIS">Envío gratis</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Valor</label>
                                    <Input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })} disabled={form.tipo === 'ENVIO_GRATIS'} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Objetivo</label>
                                    <Select value={form.objetivo} onValueChange={(v) => setForm({ ...form, objetivo: v })}>
                                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="TODO">Toda la tienda</SelectItem>
                                            <SelectItem value="PRODUCTOS_ESPECIFICOS">Productos específicos</SelectItem>
                                            <SelectItem value="CATEGORIAS_ESPECIFICAS">Categorías específicas</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {form.objetivo === 'PRODUCTOS_ESPECIFICOS' && (
                                <div className="border rounded p-3 max-h-40 overflow-y-auto grid grid-cols-2 gap-1">
                                    {products.map((p) => (
                                        <label key={p.id} className="flex items-center gap-2 text-sm">
                                            <input type="checkbox" checked={form.productoIds.includes(p.id)} onChange={() => setForm({ ...form, productoIds: toggle(form.productoIds, p.id) })} />
                                            {p.nombre}
                                        </label>
                                    ))}
                                </div>
                            )}
                            {form.objetivo === 'CATEGORIAS_ESPECIFICAS' && (
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
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Monto mínimo</label>
                                    <Input type="number" value={form.valorMinimoPedido} onChange={(e) => setForm({ ...form, valorMinimoPedido: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Límite total de usos</label>
                                    <Input type="number" value={form.limiteUso} onChange={(e) => setForm({ ...form, limiteUso: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Límite por usuario</label>
                                    <Input type="number" value={form.limiteUsoPorUsuario} onChange={(e) => setForm({ ...form, limiteUsoPorUsuario: e.target.value })} />
                                </div>
                            </div>
                            <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
                                Activo
                            </label>
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={reset}>Cancelar</Button>
                                <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
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
                                <TableHead>Código</TableHead>
                                <TableHead>Descuento</TableHead>
                                <TableHead>Objetivo</TableHead>
                                <TableHead>Vigencia</TableHead>
                                <TableHead>Activo</TableHead>
                                <TableHead>Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {cupones.length === 0 ? (
                                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No hay cupones</TableCell></TableRow>
                            ) : cupones.map((c) => (
                                <TableRow key={c.id}>
                                    <TableCell className="font-medium">{c.nombre}{c.usuarioId && <span className="ml-2 text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">Personal</span>}</TableCell>
                                    <TableCell className="font-mono text-xs">{c.codigo || '—'}</TableCell>
                                    <TableCell>{c.tipo === 'PORCENTAJE' ? `${c.valor}%` : c.tipo === 'MONTO_FIJO' ? `$${c.valor.toLocaleString()}` : 'Envío gratis'}</TableCell>
                                    <TableCell className="text-xs">{c.objetivo === 'TODO' ? 'Todo' : c.objetivo === 'PRODUCTOS_ESPECIFICOS' ? 'Productos' : 'Categorías'}</TableCell>
                                    <TableCell className="text-xs">{c.fechaFin ? new Date(c.fechaFin).toLocaleDateString('es-CL') : 'Sin fin'}</TableCell>
                                    <TableCell>
                                        <Switch checked={c.activo} onCheckedChange={async () => { await api.patch(`/discounts/${c.id}`, { activo: !c.activo }); fetchAll(); }} />
                                    </TableCell>
                                    <TableCell className="space-x-1">
                                        <Button variant="outline" size="sm" onClick={() => handleEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleDelete(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
