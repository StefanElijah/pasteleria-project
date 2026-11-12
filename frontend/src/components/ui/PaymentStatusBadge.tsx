import { Badge } from '@/components/ui/badge';
import type { EstadoPago } from '@/types';

const CONFIG: Record<EstadoPago, { label: string; className: string }> = {
    PENDIENTE: {
        label: 'Pago pendiente',
        className: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    PAGADO: {
        label: 'Pagado',
        className: 'bg-green-100 text-green-800 border-green-200',
    },
    FALLIDO: {
        label: 'Pago fallido',
        className: 'bg-red-100 text-red-800 border-red-200',
    },
    CANCELADO: {
        label: 'Pago cancelado',
        className: 'bg-gray-100 text-gray-700 border-gray-200',
    },
    REEMBOLSADO: {
        label: 'Reembolsado',
        className: 'bg-purple-100 text-purple-800 border-purple-200',
    },
};

export function PaymentStatusBadge({
    status,
    className,
}: {
    status?: string | null;
    className?: string;
}) {
    const config = CONFIG[(status as EstadoPago) || 'PENDIENTE'] || CONFIG.PENDIENTE;
    return (
        <Badge variant="outline" className={`${config.className} ${className || ''}`}>
            {config.label}
        </Badge>
    );
}
