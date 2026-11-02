export default function DevolucionReembolsoPage() {
    return (
        <>
            <h1 className="text-3xl font-bold mb-6 text-center">Política de Devolución y Reembolso</h1>
            <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
                <p><strong>Última actualización:</strong> 02/11/2026</p>

                <h2>1. Aceptación General</h2>
                <p>Al realizar una compra o reserva en Pastelería Mil Sabores, aceptas nuestra política de devolución y reembolso, diseñada conforme a la Ley del Consumidor Chilena (Ley N° 19.496) y considerando la naturaleza perecedera de nuestros productos.</p>

                <h2>2. Derecho a Retracto en Productos Perecederos</h2>
                <p><strong>Por la naturaleza perecedera de nuestros productos:</strong><br />
                    • <strong>NO aplica el derecho a retracto de 10 días</strong> establecido en el artículo 3 bis de la Ley del Consumidor<br />
                    • Los productos de pastelería son de consumo inmediato y tienen vida útil limitada<br />
                    • Esta excepción está reconocida en la ley para bienes que por su naturaleza no pueden ser devueltos</p>

                <h2>3. Devoluciones por Defectos o No Conformidad</h2>
                <p>Aceptamos devoluciones en los siguientes casos:</p>
                <ul>
                    <li><strong>Producto en mal estado:</strong> Evidencia de descomposición, mal olor o sabor</li>
                    <li><strong>No conformidad con el pedido:</strong> Recibes un producto diferente al solicitado</li>
                    <li><strong>Daños durante el transporte:</strong> Producto maltratado que afecte su calidad</li>
                    <li><strong>Alergenos no declarados:</strong> Contenido no especificado que cause riesgo a la salud</li>
                </ul>

                <h2>4. Plazos para Reclamos</h2>
                <p>• <strong>Productos con defectos evidentes:</strong> 24 horas desde la recepción<br />
                    • <strong>No conformidad con el pedido:</strong> 48 horas desde la entrega<br />
                    • <strong>Problemas de calidad:</strong> Hasta la fecha de vencimiento del producto</p>

                <h2>5. Procedimiento para Devoluciones</h2>
                <p>Para solicitar una devolución:</p>
                <ol>
                    <li>Contacta a <a href="mailto:devoluciones@milsabores.cl">devoluciones@milsabores.cl</a> dentro de los plazos establecidos</li>
                    <li>Proporciona tu número de pedido y fotografías del producto</li>
                    <li>Describe detalladamente el problema encontrado</li>
                    <li>Nuestro equipo evaluará tu caso dentro de 48 horas hábiles</li>
                </ol>

                <h2>6. Opciones de Solución</h2>
                <p>Una vez aprobada la devolución, ofrecemos:</p>
                <ul>
                    <li><strong>Reposición del producto:</strong> Envío de un nuevo producto igual, sujeto a disponibilidad de producción</li>
                    <li><strong>Cambio por producto equivalente:</strong> Mismo valor o características similares</li>
                    <li><strong>Crédito en la tienda:</strong> Para futuras compras (válido por 90 días)</li>
                    <li><strong>Reembolso total:</strong> Devolución del monto pagado (procesado en 5-10 días hábiles)</li>
                </ul>

                <h2>7. Productos Personalizados</h2>
                <p><strong>Los productos personalizados (tortas con mensajes, decoraciones específicas) NO son elegibles para devolución</strong>, excepto en casos de defectos de fabricación o no conformidad con lo acordado.</p>

                <h2>8. Cancelaciones de Reservas y Pedidos</h2>
                <p>Las reservas se preparan por encargo; no se mantiene inventario disponible. Los porcentajes se aplican sobre el monto pagado:</p>
                <p>• <strong>Antes de la preparación:</strong> Reembolso del 100%<br />
                    • <strong>Durante la preparación:</strong> Reembolso del 50% (por ingredientes utilizados)<br />
                    • <strong>Una vez enviado:</strong> No aplica cancelación</p>

                <h2>9. Cumplimiento Normativo</h2>
                <p>Nuestra política se rige por:</p>
                <ul>
                    <li>Ley N° 19.496 sobre Protección de los Derechos de los Consumidores</li>
                    <li>Reglamento Sanitario de los Alimentos (Decreto N° 977/96 del MINSAL)</li>
                    <li>Normas de inocuidad alimentaria aplicables</li>
                </ul>

                <h2>10. Contacto para Reclamos</h2>
                <p><strong>Correo electrónico:</strong> <a href="mailto:devoluciones@milsabores.cl">devoluciones@milsabores.cl</a><br />
                    <strong>Teléfono:</strong> +56 9 1234 5678<br />
                    <strong>Horario de atención:</strong> Lunes a Viernes 9:00 - 18:00 hrs<br />
                    <strong>Dirección:</strong> [Dirección completa para reclamos presenciales]</p>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-4">
                    <p className="text-blue-700"><strong>Nota importante:</strong> Por la naturaleza perecedera de nuestros productos y normas de inocuidad alimentaria, los productos devueltos NO pueden ser reutilizados ni puestos nuevamente en venta. Todas las devoluciones aprobadas resultan en la destrucción segura del producto.</p>
                </div>
            </div>
        </>
    );
}