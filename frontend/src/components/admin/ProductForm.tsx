'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { FormButtons } from '@/components/ui/form-buttons';
import { Category } from '@/types';
import MainImageUpload from './MainImageUpload';
import ImageGalleryUpload from './ImageGalleryUpload';
import { useSlug } from '@/hooks/useSlug';

const productSchema = z.object({
    nombre: z.string().min(1, "El nombre es requerido").max(100, "Máximo 100 caracteres"),
    slug: z
        .string()
        .min(1, "El slug es requerido")
        .max(100, "Máximo 100 caracteres")
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Formato inválido (solo minúsculas, números y guiones)"),
    descripcion: z.string().optional(),
    precio: z.number().min(1, "El precio es requerido y debe ser mayor a 0"),
    precioComparacion: z.number().min(0).optional().nullable(),
    imagenPrincipal: z.string().min(1, "La imagen principal es requerida"),
    imagenes: z.array(z.string()).max(5).optional(),
    novedad: z.boolean().optional(),
    destacado: z.boolean().optional(),
    activo: z.boolean().optional(),
    categoriaId: z.string().min(1, "La categoría es requerida"),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
    initialData?: Partial<ProductFormValues>;
    categories: Category[];
    onSubmit: (data: ProductFormValues) => Promise<void>;
    isLoading: boolean;
    onCancel?: () => void;
}

export function ProductForm({ initialData, categories, onSubmit, isLoading, onCancel }: ProductFormProps) {
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: initialData || {
            novedad: false,
            destacado: false,
            activo: true,
            precio: 0,
            imagenes: [],
            imagenPrincipal: "",
        },
    });

    const slug = useSlug({ watch, setValue });
    const [copied, setCopied] = useState(false);

    const handleCopySlug = async () => {
        await navigator.clipboard.writeText(slug);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const imagenPrincipal = watch('imagenPrincipal') || '';
    const imagenes = watch('imagenes') || [];

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <label>Nombre *</label>
                <Input {...register('nombre')} />
                {errors.nombre && <p className="text-red-500 text-sm">{errors.nombre.message}</p>}
            </div>
            <div>
                <label className="text-muted-foreground text-sm">Slug (auto-generado)</label>
                <div className="flex gap-2">
                    <Input {...register('slug')} readOnly className="bg-muted cursor-default" />
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleCopySlug}
                        title="Copiar slug"
                    >
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </div>
                {errors.slug && <p className="text-red-500 text-sm">{errors.slug.message}</p>}
            </div>
            <div>
                <label>Descripción</label>
                <Textarea {...register('descripcion')} rows={3} />
            </div>
            <div>
                <label>Precio *</label>
                <Input type="number" step="1" {...register('precio', { valueAsNumber: true })} />
                {errors.precio && <p className="text-red-500 text-sm">{errors.precio.message}</p>}
            </div>
            <div>
                <label>Categoría *</label>
                <select {...register('categoriaId')} className="w-full border rounded p-2">
                    <option value="">Seleccione...</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                            {cat.nombre}
                        </option>
                    ))}
                </select>
                {errors.categoriaId && <p className="text-red-500 text-sm">{errors.categoriaId.message}</p>}
            </div>
            <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                    <Checkbox
                        checked={watch('novedad')}
                        onCheckedChange={(checked) => setValue('novedad', !!checked)}
                    />
                    Novedad
                </label>
                <label className="flex items-center gap-2">
                    <Checkbox
                        checked={watch('destacado')}
                        onCheckedChange={(checked) => setValue('destacado', !!checked)}
                    />
                    Destacado
                </label>
                <label className="flex items-center gap-2">
                    <Checkbox
                        checked={watch('activo')}
                        onCheckedChange={(checked) => setValue('activo', !!checked)}
                    />
                    Activo
                </label>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
                <div>
                    <label className="block mb-2 font-medium">Imagen principal</label>
                    <MainImageUpload
                        value={imagenPrincipal}
                        onChange={(url) => setValue('imagenPrincipal', url || '')}
                    />
                    {errors.imagenPrincipal && <p className="text-red-500 text-sm">{errors.imagenPrincipal.message}</p>}
                </div>
                <div>
                    <label className="block mb-2 font-medium">Galería de imágenes</label>
                    <ImageGalleryUpload
                        value={imagenes}
                        onChange={(newImages) => setValue('imagenes', newImages)}
                    />
                </div>
            </div>

            <FormButtons isLoading={isLoading} onCancel={onCancel} />
        </form>
    );
}
