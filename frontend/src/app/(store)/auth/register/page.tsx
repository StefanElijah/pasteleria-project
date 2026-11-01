'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toTitleCase } from '@/lib/format';

export default function RegisterPage() {
    const router = useRouter();
    const register = useAuthStore((state) => state.register);
    const isLoading = useAuthStore((state) => state.isLoading);
    const [isPasswordValid, setIsPasswordValid] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        primerNombre: '',
        segundoNombre: '',
        primerApellido: '',
        segundoApellido: '',
        telefono: '',
    });

    // Prefill del email cuando viene desde el checkout invitado (?email=)
    useEffect(() => {
        const email = new URLSearchParams(window.location.search).get('email');
        if (email) setFormData((prev) => (prev.email ? prev : { ...prev, email }));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await register(formData);
            router.push('/auth/login?registered=true');
        } catch (error) {
            alert('Error al registrarse');
        }
    };

    return (
        <div className="flex items-center justify-center py-8 sm:py-12">
            <Card className="w-full max-w-md mx-4 sm:mx-auto">
                <CardHeader>
                    <CardTitle className="text-xl sm:text-2xl text-center font-bold">
                        Crear cuenta
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label htmlFor="email" className="block text-sm font-medium">
                                Email
                            </label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="tu@correo.cl"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="password" className="block text-sm font-medium">
                                Contraseña
                            </label>
                            <PasswordInput
                                id="password"
                                name="password"
                                placeholder="••••••••"
                                showStrength
                                value={formData.password}
                                onChange={handleChange}
                                onValidityChange={setIsPasswordValid}
                                required
                                autoComplete="new-password"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div className="space-y-1.5">
                                <label htmlFor="primerNombre" className="block text-sm font-medium">
                                    Primer nombre
                                </label>
                                <Input
                                    id="primerNombre"
                                    name="primerNombre"
                                    placeholder="Daniel"
                                    value={formData.primerNombre}
                                    onChange={handleChange}
                                    onBlur={(e) => setFormData((prev) => ({ ...prev, primerNombre: toTitleCase(e.target.value) }))}
                                    required
                                    autoComplete="given-name"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label htmlFor="segundoNombre" className="block text-sm font-medium">
                                    Segundo nombre <span className="text-muted-foreground font-normal">(opcional)</span>
                                </label>
                                <Input
                                    id="segundoNombre"
                                    name="segundoNombre"
                                    placeholder="Luis"
                                    value={formData.segundoNombre}
                                    onChange={handleChange}
                                    onBlur={(e) => setFormData((prev) => ({ ...prev, segundoNombre: toTitleCase(e.target.value) }))}
                                    autoComplete="additional-name"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label htmlFor="primerApellido" className="block text-sm font-medium">
                                    Primer apellido
                                </label>
                                <Input
                                    id="primerApellido"
                                    name="primerApellido"
                                    placeholder="Gutiérrez"
                                    value={formData.primerApellido}
                                    onChange={handleChange}
                                    onBlur={(e) => setFormData((prev) => ({ ...prev, primerApellido: toTitleCase(e.target.value) }))}
                                    required
                                    autoComplete="family-name"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label htmlFor="segundoApellido" className="block text-sm font-medium">
                                    Segundo apellido <span className="text-muted-foreground font-normal">(opcional)</span>
                                </label>
                                <Input
                                    id="segundoApellido"
                                    name="segundoApellido"
                                    placeholder="Pérez"
                                    value={formData.segundoApellido}
                                    onChange={handleChange}
                                    onBlur={(e) => setFormData((prev) => ({ ...prev, segundoApellido: toTitleCase(e.target.value) }))}
                                    autoComplete="additional-name"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="telefono" className="block text-sm font-medium">
                                Teléfono <span className="text-muted-foreground font-normal">(opcional)</span>
                            </label>
                            <Input
                                id="telefono"
                                name="telefono"
                                type="tel"
                                placeholder="+56 9 1234 5678"
                                value={formData.telefono}
                                onChange={handleChange}
                                autoComplete="tel"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading || !isPasswordValid}
                            className="w-full bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50"
                        >
                            {isLoading ? 'Registrando...' : 'Registrarse'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center border-t-0 pt-0">
                    <p className="text-sm text-muted-foreground">
                        ¿Ya tienes cuenta?{' '}
                        <Link href="/auth/login" className="text-rose-600 hover:underline font-medium">
                            Inicia sesión
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
