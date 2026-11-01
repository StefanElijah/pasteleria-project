'use client';
import { useCheckoutStore } from '@/store/checkoutStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { toTitleCase } from '@/lib/format';
import { Region, Ciudad, Comuna, Address } from '@/types';

const SHIPPING_METHODS = [
    { value: 'Chilexpress', label: 'Chilexpress' },
    { value: 'Starken', label: 'Starken' },
];

const TIPOS_VIVIENDA = [
    { value: 'CASA', label: 'Casa' },
    { value: 'DEPARTAMENTO', label: 'Departamento' },
    { value: 'OFICINA', label: 'Oficina' },
    { value: 'LOCAL_COMERCIAL', label: 'Local comercial' },
    { value: 'OTRO', label: 'Otro' },
];

export default function ShippingStep() {
    const { user } = useAuthStore();
    const {
        shippingInfo, setShippingInfo, setShippingMethod, shippingMethod,
        saveAddress, setSaveAddress, selectedAddressId, setSelectedAddressId,
    } = useCheckoutStore();
    const router = useRouter();

    const [form, setForm] = useState(shippingInfo);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [localShippingMethod, setLocalShippingMethod] = useState(shippingMethod);
    const [regions, setRegions] = useState<Region[]>([]);
    const [ciudades, setCiudades] = useState<Ciudad[]>([]);
    const [comunas, setComunas] = useState<Comuna[]>([]);
    const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);

    useEffect(() => {
        if (user && !shippingInfo.primerNombreDestinatario) {
            setForm((prev) => ({
                ...prev,
                primerNombreDestinatario: user.primerNombre || '',
                primerApellidoDestinatario: user.primerApellido || '',
                emailDestinatario: user.email || '',
                telefonoDestinatario: user.telefono || '',
            }));
        }
    }, []);

    // Cargar direcciones guardadas y precargar la predeterminada (usuario logueado)
    useEffect(() => {
        if (!user) return;
        api.get('/addresses')
            .then(({ data }) => {
                const lista: Address[] = data;
                setSavedAddresses(lista);
                if (!shippingInfo.calle && lista.length > 0) {
                    const elegida = lista.find((a) => a.isDefault) || lista[0];
                    setSelectedAddressId(elegida.id);
                    setForm((prev) => ({
                        ...prev,
                        calle: elegida.calle || '',
                        numero: elegida.numero || '',
                        regionId: (elegida.comuna as any)?.region?.id || prev.regionId,
                        regionNombre: (elegida.comuna as any)?.region?.nombre || prev.regionNombre,
                        comunaId: elegida.comunaId || '',
                        comunaNombre: elegida.comuna?.nombre || '',
                        ciudadId: (elegida as any).ciudadId || '',
                        ciudadNombre: (elegida as any).ciudad?.nombre || '',
                        tipoVivienda: elegida.tipoVivienda || '',
                    }));
                }
            })
            .catch(() => setSavedAddresses([]));
    }, [user]);

    // Cargar regiones y preseleccionar si hay una sola
    useEffect(() => {
        api.get('/regiones')
            .then(({ data }) => {
                const lista: Region[] = data;
                setRegions(lista);
                setForm((prev) => {
                    if (prev.regionId || lista.length !== 1) return prev;
                    return { ...prev, regionId: lista[0].id, regionNombre: lista[0].nombre };
                });
            })
            .catch(() => setRegions([]));
    }, []);

    // Cargar ciudades al cambiar la región
    useEffect(() => {
        if (!form.regionId) return;
        let active = true;
        api.get('/ciudades', { params: { regionId: form.regionId } })
            .then(({ data }) => { if (active) setCiudades(data); })
            .catch(() => { if (active) setCiudades([]); });
        return () => { active = false; };
    }, [form.regionId]);

    // Cargar comunas al cambiar la ciudad
    useEffect(() => {
        if (!form.ciudadId) return;
        let active = true;
        api.get('/comunas', { params: { ciudadId: form.ciudadId } })
            .then(({ data }) => { if (active) setComunas(data); })
            .catch(() => { if (active) setComunas([]); });
        return () => { active = false; };
    }, [form.ciudadId]);

    const handleRegionChange = (regionId: string) => {
        const region = regions.find((r) => r.id === regionId);
        setForm((prev) => ({
            ...prev,
            regionId,
            regionNombre: region?.nombre || '',
            ciudadId: '',
            ciudadNombre: '',
            comunaId: '',
            comunaNombre: '',
        }));
    };

    const handleCiudadChange = (ciudadId: string) => {
        const ciudad = ciudades.find((c) => c.id === ciudadId);
        setForm((prev) => ({
            ...prev,
            ciudadId,
            ciudadNombre: ciudad?.nombre || '',
            comunaId: '',
            comunaNombre: '',
        }));
    };

    const handleComunaChange = (comunaId: string) => {
        const comuna = comunas.find((c) => c.id === comunaId);
        setForm((prev) => ({ ...prev, comunaId, comunaNombre: comuna?.nombre || '' }));
    };

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!form.primerNombreDestinatario.trim()) errs.primerNombreDestinatario = 'Requerido';
        if (!form.primerApellidoDestinatario.trim()) errs.primerApellidoDestinatario = 'Requerido';
        if (!form.emailDestinatario.trim()) errs.emailDestinatario = 'Requerido';
        if (!form.telefonoDestinatario.trim()) errs.telefonoDestinatario = 'Requerido';
        if (!form.calle.trim()) errs.calle = 'Requerida';
        if (!form.numero.trim()) errs.numero = 'Requerido';
        if (!form.regionId) errs.regionId = 'Requerida';
        if (!form.ciudadId) errs.ciudadId = 'Requerida';
        if (!form.comunaId) errs.comunaId = 'Requerida';
        if (!form.tipoVivienda) errs.tipoVivienda = 'Requerido';
        return errs;
    };

    const handleNext = () => {
        const errs = validate();
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;
        setShippingInfo(form);
        setShippingMethod(localShippingMethod);
        router.push('/checkout/payment');
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-6">Información de envío</h2>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nombre destinatario *</label>
                        <Input
                            value={form.primerNombreDestinatario}
                            onChange={(e) => setForm({ ...form, primerNombreDestinatario: e.target.value })}
                            onBlur={(e) => setForm((prev) => ({ ...prev, primerNombreDestinatario: toTitleCase(e.target.value) }))}
                            placeholder="Nombre"
                        />
                        {errors.primerNombreDestinatario && <p className="text-red-500 text-xs mt-1">{errors.primerNombreDestinatario}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Apellido destinatario *</label>
                        <Input
                            value={form.primerApellidoDestinatario}
                            onChange={(e) => setForm({ ...form, primerApellidoDestinatario: e.target.value })}
                            onBlur={(e) => setForm((prev) => ({ ...prev, primerApellidoDestinatario: toTitleCase(e.target.value) }))}
                            placeholder="Apellido"
                        />
                        {errors.primerApellidoDestinatario && <p className="text-red-500 text-xs mt-1">{errors.primerApellidoDestinatario}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Email *</label>
                        <Input
                            type="email"
                            value={form.emailDestinatario}
                            onChange={(e) => setForm({ ...form, emailDestinatario: e.target.value })}
                            placeholder="correo@ejemplo.com"
                        />
                        {errors.emailDestinatario && <p className="text-red-500 text-xs mt-1">{errors.emailDestinatario}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Teléfono *</label>
                        <Input
                            value={form.telefonoDestinatario}
                            onChange={(e) => setForm({ ...form, telefonoDestinatario: e.target.value })}
                            placeholder="+56 9..."
                        />
                        {errors.telefonoDestinatario && <p className="text-red-500 text-xs mt-1">{errors.telefonoDestinatario}</p>}
                    </div>
                </div>

                {user && savedAddresses.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium mb-1">Usar una dirección guardada</label>
                        <Select
                            value={selectedAddressId || ''}
                            onValueChange={(id) => {
                                const dir = savedAddresses.find((a) => a.id === id);
                                if (!dir) return;
                                setSelectedAddressId(id);
                                setForm((prev) => ({
                                    ...prev,
                                    calle: dir.calle || '',
                                    numero: dir.numero || '',
                                    regionId: (dir.comuna as any)?.region?.id || prev.regionId,
                                    regionNombre: (dir.comuna as any)?.region?.nombre || prev.regionNombre,
                                    comunaId: dir.comunaId || '',
                                    comunaNombre: dir.comuna?.nombre || '',
                                    ciudadId: (dir as any).ciudadId || '',
                                    ciudadNombre: (dir as any).ciudad?.nombre || '',
                                    tipoVivienda: dir.tipoVivienda || '',
                                }));
                            }}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecciona una dirección guardada" />
                            </SelectTrigger>
                            <SelectContent>
                                {savedAddresses.map((dir) => (
                                    <SelectItem key={dir.id} value={dir.id}>
                                        {dir.calle} {dir.numero}, {dir.comuna?.nombre}{dir.isDefault ? ' (Predeterminada)' : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium mb-1">Calle *</label>
                    <Input
                        value={form.calle}
                        onChange={(e) => setForm({ ...form, calle: e.target.value })}
                        onBlur={(e) => setForm((prev) => ({ ...prev, calle: toTitleCase(e.target.value) }))}
                        placeholder="Ej: Av. Providencia"
                    />
                    {errors.calle && <p className="text-red-500 text-xs mt-1">{errors.calle}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Región *</label>
                        <Select value={form.regionId || ''} onValueChange={handleRegionChange}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecciona una región" />
                            </SelectTrigger>
                            <SelectContent>
                                {regions.map((region) => (
                                    <SelectItem key={region.id} value={region.id}>
                                        {region.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.regionId && <p className="text-red-500 text-xs mt-1">{errors.regionId}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Ciudad *</label>
                        <Select value={form.ciudadId || ''} onValueChange={handleCiudadChange} disabled={!form.regionId}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={form.regionId ? 'Selecciona una ciudad' : 'Elige una región'} />
                            </SelectTrigger>
                            <SelectContent>
                                {ciudades.map((ciudad) => (
                                    <SelectItem key={ciudad.id} value={ciudad.id}>
                                        {ciudad.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.ciudadId && <p className="text-red-500 text-xs mt-1">{errors.ciudadId}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Comuna *</label>
                        <Select value={form.comunaId || ''} onValueChange={handleComunaChange} disabled={!form.ciudadId}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={form.ciudadId ? 'Selecciona una comuna' : 'Elige una ciudad'} />
                            </SelectTrigger>
                            <SelectContent>
                                {comunas.map((comuna) => (
                                    <SelectItem key={comuna.id} value={comuna.id}>
                                        {comuna.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.comunaId && <p className="text-red-500 text-xs mt-1">{errors.comunaId}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Número *</label>
                        <Input
                            value={form.numero}
                            onChange={(e) => setForm({ ...form, numero: e.target.value })}
                            placeholder="Ej: 1234"
                        />
                        {errors.numero && <p className="text-red-500 text-xs mt-1">{errors.numero}</p>}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Tipo de vivienda *</label>
                    <Select
                        value={form.tipoVivienda || ''}
                        onValueChange={(v) => setForm({ ...form, tipoVivienda: v })}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecciona tipo vivienda" />
                        </SelectTrigger>
                        <SelectContent>
                            {TIPOS_VIVIENDA.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                    {t.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.tipoVivienda && <p className="text-red-500 text-xs mt-1">{errors.tipoVivienda}</p>}
                </div>

                {user && (
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                            type="checkbox"
                            checked={saveAddress}
                            onChange={(e) => setSaveAddress(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-rose-600"
                        />
                        Guardar esta información en mi perfil para futuras compras
                    </label>
                )}

                <div>
                    <label className="block text-sm font-medium mb-2">Método de envío</label>
                    <div className="grid grid-cols-2 gap-3">
                        {SHIPPING_METHODS.map((method) => (
                            <button
                                key={method.value}
                                type="button"
                                onClick={() => setLocalShippingMethod(method.value)}
                                className={`border rounded-lg p-3 text-sm font-medium transition-colors ${localShippingMethod === method.value ? 'border-rose-600 bg-rose-50 text-rose-600' : 'border-gray-200 hover:border-gray-300'}`}
                            >
                                {method.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={() => router.push('/checkout')}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Anterior
                </Button>
                <Button onClick={handleNext}>
                    Siguiente: Pago <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        </div>
    );
}
