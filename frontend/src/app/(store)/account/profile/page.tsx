'use client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toTitleCase } from '@/lib/format';

const profileSchema = z.object({
    primerNombre: z.string().min(1, 'Requerido'),
    segundoNombre: z.string().optional(),
    primerApellido: z.string().min(1, 'Requerido'),
    segundoApellido: z.string().optional(),
    telefono: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
    const { user, updateProfile } = useAuthStore();

    const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            primerNombre: '',
            segundoNombre: '',
            primerApellido: '',
            segundoApellido: '',
            telefono: '',
        },
    });

    useEffect(() => {
        if (user) {
            reset({
                primerNombre: user.primerNombre || '',
                segundoNombre: user.segundoNombre || '',
                primerApellido: user.primerApellido || '',
                segundoApellido: user.segundoApellido || '',
                telefono: user.telefono || '',
            });
        }
    }, [user, reset]);

    const onSubmit = async (data: ProfileForm) => {
        try {
            await updateProfile(data);
            toast.success('Perfil actualizado');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'No se pudo actualizar el perfil');
        }
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-6">Mi perfil</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Datos personales</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Primer nombre *</label>
                                <Input
                                    {...register('primerNombre')}
                                    onBlur={(e) => setValue('primerNombre', toTitleCase(e.target.value), { shouldValidate: true, shouldDirty: true })}
                                />
                                {errors.primerNombre && <p className="text-red-500 text-xs mt-1">{errors.primerNombre.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Segundo nombre</label>
                                <Input
                                    {...register('segundoNombre')}
                                    onBlur={(e) => setValue('segundoNombre', toTitleCase(e.target.value), { shouldDirty: true })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Primer apellido *</label>
                                <Input
                                    {...register('primerApellido')}
                                    onBlur={(e) => setValue('primerApellido', toTitleCase(e.target.value), { shouldValidate: true, shouldDirty: true })}
                                />
                                {errors.primerApellido && <p className="text-red-500 text-xs mt-1">{errors.primerApellido.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Segundo apellido</label>
                                <Input
                                    {...register('segundoApellido')}
                                    onBlur={(e) => setValue('segundoApellido', toTitleCase(e.target.value), { shouldDirty: true })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Teléfono</label>
                                <Input type="tel" placeholder="+56 9 1234 5678" {...register('telefono')} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Acceso</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <Input value={user?.email || ''} disabled readOnly />
                            <p className="text-xs text-muted-foreground mt-1">El email no se puede modificar por ahora.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Contraseña</label>
                            <Input value="••••••••" disabled readOnly />
                            <p className="text-xs text-muted-foreground mt-1">
                                El cambio de contraseña estará disponible próximamente (verificación por correo y recuperación).
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting} className="bg-rose-600 hover:bg-rose-700">
                        {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
