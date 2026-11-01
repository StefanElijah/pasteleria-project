'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Address, Region, Ciudad, Comuna } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { MapPin, Pencil, Trash2, Star } from 'lucide-react';
import { toTitleCase } from '@/lib/format';

const TIPOS_VIVIENDA = [
    { value: 'CASA', label: 'Casa' },
    { value: 'DEPARTAMENTO', label: 'Departamento' },
    { value: 'OFICINA', label: 'Oficina' },
    { value: 'LOCAL_COMERCIAL', label: 'Local comercial' },
    { value: 'OTRO', label: 'Otro' },
];

const emptyForm = {
    calle: '',
    numero: '',
    regionId: '',
    ciudadId: '',
    comunaId: '',
    tipoVivienda: '',
    codigoPostal: '',
};

export default function AddressesPage() {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...emptyForm });
    const [regions, setRegions] = useState<Region[]>([]);
    const [ciudades, setCiudades] = useState<Ciudad[]>([]);
    const [comunas, setComunas] = useState<Comuna[]>([]);
    const [saving, setSaving] = useState(false);

    const fetchAddresses = async () => {
        try {
            const { data } = await api.get('/addresses');
            setAddresses(data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAddresses();
        api.get('/regiones').then(({ data }) => setRegions(data)).catch(() => { });
    }, []);

    useEffect(() => {
        if (!form.regionId) return;
        let active = true;
        api.get('/ciudades', { params: { regionId: form.regionId } })
            .then(({ data }) => { if (active) setCiudades(data); })
            .catch(() => { if (active) setCiudades([]); });
        return () => { active = false; };
    }, [form.regionId]);

    useEffect(() => {
        if (!form.ciudadId) return;
        let active = true;
        api.get('/comunas', { params: { ciudadId: form.ciudadId } })
            .then(({ data }) => { if (active) setComunas(data); })
            .catch(() => { if (active) setComunas([]); });
        return () => { active = false; };
    }, [form.ciudadId]);

    const resetForm = () => {
        setForm({ ...emptyForm });
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (dir: Address) => {
        setEditingId(dir.id);
        setShowForm(true);
        setForm({
            calle: dir.calle || '',
            numero: dir.numero || '',
            regionId: (dir.comuna as any)?.region?.id || '',
            ciudadId: (dir as any).ciudadId || '',
            comunaId: dir.comunaId || '',
            tipoVivienda: dir.tipoVivienda || '',
            codigoPostal: dir.codigoPostal || '',
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.calle || !form.numero || !form.comunaId || !form.tipoVivienda) {
            toast.error('Completa calle, número, comuna y tipo de vivienda');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                calle: form.calle,
                numero: form.numero,
                comunaId: form.comunaId,
                ciudadId: form.ciudadId || undefined,
                tipoVivienda: form.tipoVivienda,
                codigoPostal: form.codigoPostal || undefined,
            };
            if (editingId) {
                await api.patch(`/addresses/${editingId}`, payload);
                toast.success('Dirección actualizada');
            } else {
                await api.post('/addresses', payload);
                toast.success('Dirección agregada');
            }
            resetForm();
            fetchAddresses();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'No se pudo guardar la dirección');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar esta dirección?')) return;
        try {
            await api.delete(`/addresses/${id}`);
            fetchAddresses();
        } catch {
            toast.error('No se pudo eliminar');
        }
    };

    const handleDefault = async (id: string) => {
        try {
            await api.patch(`/addresses/${id}`, { isDefault: true });
            fetchAddresses();
        } catch {
            toast.error('No se pudo marcar como predeterminada');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Mis direcciones</h2>
                <Button onClick={() => { resetForm(); setShowForm(true); }}>Agregar dirección</Button>
            </div>

            {showForm && (
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Calle *</label>
                                    <Input
                                        value={form.calle}
                                        onChange={(e) => setForm({ ...form, calle: e.target.value })}
                                        onBlur={(e) => setForm((prev) => ({ ...prev, calle: toTitleCase(e.target.value) }))}
                                        placeholder="Av. Providencia"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Número *</label>
                                    <Input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} placeholder="1234" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Región *</label>
                                    <Select value={form.regionId} onValueChange={(v) => setForm({ ...form, regionId: v, ciudadId: '', comunaId: '' })}>
                                        <SelectTrigger className="w-full"><SelectValue placeholder="Selecciona una región" /></SelectTrigger>
                                        <SelectContent>
                                            {regions.map((r) => <SelectItem key={r.id} value={r.id}>{r.nombre}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Ciudad *</label>
                                    <Select value={form.ciudadId} onValueChange={(v) => setForm({ ...form, ciudadId: v, comunaId: '' })} disabled={!form.regionId}>
                                        <SelectTrigger className="w-full"><SelectValue placeholder="Selecciona una ciudad" /></SelectTrigger>
                                        <SelectContent>
                                            {ciudades.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Comuna *</label>
                                    <Select value={form.comunaId} onValueChange={(v) => setForm({ ...form, comunaId: v })} disabled={!form.ciudadId}>
                                        <SelectTrigger className="w-full"><SelectValue placeholder="Selecciona una comuna" /></SelectTrigger>
                                        <SelectContent>
                                            {comunas.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Tipo de vivienda *</label>
                                    <Select value={form.tipoVivienda} onValueChange={(v) => setForm({ ...form, tipoVivienda: v })}>
                                        <SelectTrigger className="w-full"><SelectValue placeholder="Selecciona tipo vivienda" /></SelectTrigger>
                                        <SelectContent>
                                            {TIPOS_VIVIENDA.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                                <Button type="submit" disabled={saving} className="bg-rose-600 hover:bg-rose-700">
                                    {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Agregar'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {loading ? (
                <p className="text-muted-foreground">Cargando...</p>
            ) : addresses.length === 0 ? (
                <div className="text-center py-12">
                    <MapPin className="w-14 h-14 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No tienes direcciones guardadas.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {addresses.map((dir) => (
                        <Card key={dir.id}>
                            <CardContent className="pt-6 flex items-start justify-between gap-4">
                                <div className="text-sm">
                                    <p className="font-medium">
                                        {dir.calle} {dir.numero}
                                        {dir.isDefault && (
                                            <span className="ml-2 text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">Predeterminada</span>
                                        )}
                                    </p>
                                    <p className="text-gray-500">
                                        {[(dir as any).ciudad?.nombre, dir.comuna?.nombre, (dir.comuna as any)?.region?.nombre]
                                            .filter(Boolean).join(', ')}
                                    </p>
                                    <p className="text-gray-400 text-xs capitalize">{dir.tipoVivienda?.toLowerCase()}</p>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    {!dir.isDefault && (
                                        <Button variant="ghost" size="sm" title="Marcar predeterminada" onClick={() => handleDefault(dir.id)}>
                                            <Star className="w-4 h-4" />
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="sm" title="Editar" onClick={() => handleEdit(dir)}>
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" title="Eliminar" onClick={() => handleDelete(dir.id)}>
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
