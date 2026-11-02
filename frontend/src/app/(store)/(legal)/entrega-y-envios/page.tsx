import { FaTruck, FaMapMarkerAlt, FaClock, FaWhatsapp, FaEnvelope, FaShieldAlt, FaExclamationTriangle } from 'react-icons/fa';
import { MdLocalShipping, MdPayment } from 'react-icons/md';

export default function EntregaEnviosPage() {
    return (
        <>
            <h1 className="text-3xl font-bold mb-6 text-center">Política de Entrega y Envíos</h1>
            <p className="text-sm text-gray-500 text-center mb-6"><strong>Última actualización:</strong> 02/11/2026</p>

            {/* Info destacada */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
                <p className="font-semibold text-blue-800">¡Envío gratis! En compras sobre $40.000 en Región Metropolitana y $45.000 en otras regiones</p>
            </div>

            <div className="bg-rose-50 border-l-4 border-rose-500 p-4 mb-6 rounded">
                <h3 className="font-bold text-rose-800">Reservas y producción por encargo</h3>
                <p className="text-rose-700">Los productos se preparan según las reservas confirmadas. La fecha estimada de entrega se calcula automáticamente según la comuna y el método de envío, y se muestra antes de confirmar la reserva. Al no mantener stock inmediato, los plazos pueden ajustarse por disponibilidad de producción; cualquier cambio se informará oportunamente.</p>
            </div>

            {/* Tarjetas de zonas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="border rounded-lg p-4 shadow-sm">
                    <h2 className="text-xl font-semibold text-green-700 flex items-center gap-2"><FaMapMarkerAlt /> Región Metropolitana</h2>
                    <ul className="mt-2 space-y-1">
                        <li><strong>Costo:</strong> $2.500 (Gratis sobre $40.000)</li>
                        <li><strong>Tiempo:</strong> 24-48 horas</li>
                        <li><strong>Horario:</strong> 9:00 - 20:00 hrs</li>
                        <li><strong>Cobertura:</strong> Todas las comunas</li>
                    </ul>
                </div>
                <div className="border rounded-lg p-4 shadow-sm">
                    <h2 className="text-xl font-semibold text-blue-700 flex items-center gap-2"><FaTruck /> Zona Centro (V, VI, VII)</h2>
                    <ul className="mt-2 space-y-1">
                        <li><strong>Costo:</strong> $3.000 (Gratis sobre $45.000)</li>
                        <li><strong>Tiempo:</strong> 2-3 días hábiles</li>
                        <li><strong>Regiones:</strong> Valparaíso, O'Higgins, Maule</li>
                    </ul>
                </div>
                <div className="border rounded-lg p-4 shadow-sm">
                    <h2 className="text-xl font-semibold text-indigo-700 flex items-center gap-2"><FaTruck /> Zona Sur (VIII, IX, X, XIV, XVI)</h2>
                    <ul className="mt-2 space-y-1">
                        <li><strong>Costo:</strong> $4.000 (Gratis sobre $45.000)</li>
                        <li><strong>Tiempo:</strong> 3-4 días hábiles</li>
                        <li><strong>Regiones:</strong> Biobío, Araucanía, Los Lagos</li>
                    </ul>
                </div>
                <div className="border rounded-lg p-4 shadow-sm">
                    <h2 className="text-xl font-semibold text-yellow-700 flex items-center gap-2"><FaTruck /> Zona Norte (XV, I, II, III, IV)</h2>
                    <ul className="mt-2 space-y-1">
                        <li><strong>Costo:</strong> $4.000 (Gratis sobre $45.000)</li>
                        <li><strong>Tiempo:</strong> 4-5 días hábiles</li>
                        <li><strong>Regiones:</strong> Arica a Coquimbo</li>
                    </ul>
                </div>
            </div>

            {/* Entregas especiales */}
            <div className="border rounded-lg p-4 mb-8 bg-gray-50">
                <h2 className="text-xl font-semibold flex items-center gap-2"><FaClock /> Entregas Especiales</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <ul className="list-disc list-inside space-y-1">
                        <li><strong>Fines de semana:</strong> Disponible con cargo adicional de $2.000</li>
                        <li><strong>Horario extendido:</strong> 20:00 - 22:00 hrs (+$1.500)</li>
                    </ul>
                    <ul className="list-disc list-inside space-y-1">
                        <li><strong>Pedidos express:</strong> Mismo día, sujeto a disponibilidad de producción (+50% del valor envío)</li>
                        <li><strong>Zonas extremas:</strong> Consultar disponibilidad y costos</li>
                    </ul>
                </div>
            </div>

            {/* Políticas de entrega */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                    <h2 className="text-xl font-semibold mb-2">Gestión de Retrasos</h2>
                    <div className="border rounded-lg p-4">
                        <ul className="space-y-1">
                            <li><strong>Retraso 1-2 horas:</strong> Notificación inmediata</li>
                            <li><strong>Retraso +2 horas:</strong> Reembolso 50% costo envío</li>
                            <li><strong>Retraso +4 horas:</strong> Reembolso 100% costo envío</li>
                            <li><strong>Cancelación nuestra:</strong> Reembolso total + voucher $5.000</li>
                        </ul>
                    </div>
                </div>
                <div>
                    <h2 className="text-xl font-semibold mb-2">Condiciones de Recepción</h2>
                    <div className="border rounded-lg p-4">
                        <ul className="space-y-1">
                            <li><strong>Verificación obligatoria:</strong> Revisar producto al recibir</li>
                            <li><strong>Daños visibles:</strong> Rechazar y contactarnos inmediatamente</li>
                            <li><strong>Temperatura:</strong> Productos refrigerados deben recibirse fríos</li>
                            <li><strong>Embalaje:</strong> Verificar integridad del packaging</li>
                        </ul>
                    </div>
                </div>
                <div>
                    <h2 className="text-xl font-semibold mb-2">Responsabilidades</h2>
                    <div className="border rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <strong className="text-green-700">Nuestra responsabilidad:</strong>
                                <ul className="list-disc list-inside text-sm mt-1">
                                    <li>Daños durante transporte</li>
                                    <li>Incumplimiento de horarios</li>
                                    <li>Productos incorrectos</li>
                                </ul>
                            </div>
                            <div>
                                <strong className="text-amber-700">Responsabilidad del cliente:</strong>
                                <ul className="list-disc list-inside text-sm mt-1">
                                    <li>Informar dirección correcta</li>
                                    <li>Disponibilidad para recepción</li>
                                    <li>Almacenamiento post-entrega</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <h2 className="text-xl font-semibold mb-2">Ausencia del Receptor</h2>
                    <div className="border rounded-lg p-4">
                        <ul className="space-y-1">
                            <li><strong>1ra visita:</strong> Llamado de coordinación</li>
                            <li><strong>2da visita:</strong> Reprogramación con costo $1.500</li>
                            <li><strong>3ra visita:</strong> Producto regresa a la pastelería</li>
                            <li><strong>Productos perecederos:</strong> No se guardan más de 24h</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Alerta productos perecederos */}
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-8 rounded">
                <div className="flex items-start gap-2">
                    <FaExclamationTriangle className="text-yellow-600 mt-1" />
                    <div>
                        <h3 className="font-bold text-yellow-800">Importante: Productos Perecederos</h3>
                        <p className="text-yellow-700">Por la naturaleza de nuestros productos, recomendamos:<br />
                            • <strong>Consumo inmediato</strong> post-entrega<br />
                            • <strong>Refrigeración</strong> si no se consume de inmediato (2-4°C)<br />
                            • <strong>No dejar</strong> a temperatura ambiente por más de 2 horas<br />
                            • <strong>Vida útil:</strong> 3-5 días refrigerado (consultar por producto específico)</p>
                    </div>
                </div>
            </div>

            {/* Resumen de costos */}
            <div className="bg-gray-100 p-4 rounded-lg mb-8">
                <h2 className="text-xl font-semibold text-center mb-3">Resumen de Costos de Envío</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div><strong className="text-green-700">RM</strong><br />$2.500<br /><span className="text-sm">Gratis desde $40.000</span></div>
                    <div><strong className="text-blue-700">Zona Centro</strong><br />$3.000<br /><span className="text-sm">Gratis desde $45.000</span></div>
                    <div><strong className="text-indigo-700">Zona Sur</strong><br />$4.000<br /><span className="text-sm">Gratis desde $45.000</span></div>
                    <div><strong className="text-yellow-700">Zona Norte</strong><br />$4.000<br /><span className="text-sm">Gratis desde $45.000</span></div>
                </div>
            </div>

            {/* Contacto */}
            <div className="border rounded-lg p-6 text-center">
                <h2 className="text-xl font-semibold mb-4">¿Necesitas ayuda con tu envío?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><FaWhatsapp className="inline-block text-green-600 text-2xl mb-1" /><br /><strong>WhatsApp</strong><br />+56 9 1234 5678</div>
                    <div><FaEnvelope className="inline-block text-blue-600 text-2xl mb-1" /><br /><strong>Email</strong><br />envios@milsabores.cl</div>
                    <div><FaClock className="inline-block text-amber-600 text-2xl mb-1" /><br /><strong>Horario</strong><br />Lunes a Sábado<br />9:00 - 21:00 hrs</div>
                </div>
            </div>
        </>
    );
}