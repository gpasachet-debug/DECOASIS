import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, FileText, RefreshCw, BookOpen, X, AlertCircle, Check, Loader2 } from "lucide-react";
import { db } from "../firebase";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";

// Merchant Constant details for legal compliance
export const MERCHANT_DETAILS = {
  razonSocial: "DECOASIS PERÚ S.A.C.",
  ruc: "20608543210",
  address: "Av. García Rada, Punta Hermosa 15846, Lima, Perú",
  phone: "+51 933 836 011",
  email: "gpasachet@gmail.com",
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 1. TERMS & CONDITIONS MODAL
export function TermsModal({ isOpen, onClose }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#5a3c3c]/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#fdfcf8] w-full max-w-3xl h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative z-10 text-left border border-[#5a3c3c]/10"
          >
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-[#5a3c3c]/10 flex justify-between items-center bg-[#5a3c3c] text-[#fdfcf8]">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-[#81b896]" />
                <div>
                  <h3 className="text-xl font-serif italic">Términos y Condiciones</h3>
                  <p className="text-[10px] uppercase tracking-wider text-white/70">DECOASIS PERÚ S.A.C.</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5 text-[#fdfcf8]" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-y-auto p-6 md:p-8 space-y-6 text-sm text-[#5a3c3c]/80 leading-relaxed custom-scrollbar font-sans">
              <section className="space-y-2">
                <h4 className="font-serif text-base font-semibold text-[#5a3c3c] italic">1. Generalidades</h4>
                <p>
                  Este sitio web es operado por <strong>{MERCHANT_DETAILS.razonSocial}</strong> con RUC <strong>{MERCHANT_DETAILS.ruc}</strong>.
                  Al utilizar este sitio y comprar nuestros productos de diseño botánico y decoración, aceptas quedar vinculado por los siguientes términos y condiciones.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-serif text-base font-semibold text-[#5a3c3c] italic">2. Precios y Moneda</h4>
                <p>
                  Todos los precios de los productos en nuestra tienda virtual están expresados en Soles Peruanos (S/) e incluyen el Impuesto General a las Ventas (IGV).
                  Los costos de envío se calculan de manera independiente según el distrito seleccionado durante el proceso de compra.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-serif text-base font-semibold text-[#5a3c3c] italic">3. Medios de Pago Seguro</h4>
                <p>
                  Ofrecemos pagos 100% seguros a través de la pasarela de pagos <strong>Culqi</strong>, que acepta tarjetas de crédito/débito Visa, MasterCard,
                  American Express, Diners Club, además del sistema de pago móvil Yape. También disponemos de Plin Directo y Transferencia Bancaria (BCP, Interbank, BBVA). El procesamiento del pago online a través de Culqi es seguro e inmediato.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-serif text-base font-semibold text-[#5a3c3c] italic">4. Envío y Entrega de Pedidos</h4>
                <p>
                  El cliente puede elegir entre dos opciones:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Recojo en Tienda:</strong> Disponible sin costo en nuestro local de {MERCHANT_DETAILS.address}. El horario es de Lunes a Sábado de 10:00 AM a 8:00 PM.</li>
                  <li><strong>Delivery Express:</strong> Despachamos pedidos a distritos de Lima Metropolitana con tarifas calculadas automáticamente por zonas geográficas. El tiempo promedio de despacho para el delivery express es de 24 a 48 horas hábiles tras confirmado el pago.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="font-serif text-base font-semibold text-[#5a3c3c] italic">5. Limitación de Responsabilidad</h4>
                <p>
                  Debido a la naturaleza orgánica de las plantas y macetas artesanales, los productos entregados pueden variar sutilmente en color, forma y tamaño respecto de las fotos referenciales expuestas. Esto no califica como falla de producto, sino como cualidad artesanal y biológica.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-serif text-base font-semibold text-[#5a3c3c] italic">6. Legislación Aplicable</h4>
                <p>
                  Cualquier controversia relacionada con el uso de este sitio web se regirá por la legislación de la República del Perú y se someterá a la jurisdicción de los tribunales de Lima.
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// 2. PRIVACY POLICY MODAL
export function PrivacyModal({ isOpen, onClose }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#5a3c3c]/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#fdfcf8] w-full max-w-3xl h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative z-10 text-left border border-[#5a3c3c]/10"
          >
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-[#5a3c3c]/10 flex justify-between items-center bg-[#5a3c3c] text-[#fdfcf8]">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-[#81b896]" />
                <div>
                  <h3 className="text-xl font-serif italic">Políticas de Privacidad</h3>
                  <p className="text-[10px] uppercase tracking-wider text-white/70">Ley de Protección de Datos Personales N° 29733 (Perú)</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5 text-[#fdfcf8]" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-y-auto p-6 md:p-8 space-y-6 text-sm text-[#5a3c3c]/80 leading-relaxed custom-scrollbar font-sans">
              <section className="space-y-2">
                <h4 className="font-serif text-base font-semibold text-[#5a3c3c] italic">1. Compromiso de Confidencialidad</h4>
                <p>
                  En <strong>{MERCHANT_DETAILS.razonSocial}</strong>, nos tomamos muy en serio la seguridad y confidencialidad de tus datos.
                  En cumplimiento de la <strong>Ley de Protección de Datos Personales (Ley N° 29733)</strong> y su Reglamento,
                  garantizamos que el tratamiento de tus datos personales se realiza de manera segura y confidencial.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-serif text-base font-semibold text-[#5a3c3c] italic">2. Datos Personales Recopilados</h4>
                <p>
                  Para procesar pedidos y coordinar las entregas botánicas de forma óptima, recopilamos los siguientes datos personales:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Nombres y Apellidos completos.</li>
                  <li>Documento de Identidad (DNI / CE).</li>
                  <li>Dirección de envío y ubicación.</li>
                  <li>Correo electrónico de contacto.</li>
                  <li>Número de teléfono o celular.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="font-serif text-base font-semibold text-[#5a3c3c] italic">3. Finalidad del Tratamiento de Datos</h4>
                <p>
                  Tus datos personales se recopilan únicamente con las siguientes finalidades:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Procesar las compras y emitir comprobantes de pago correspondientes (boleta de venta electrónica).</li>
                  <li>Coordinar el despacho de productos (delivery) o la confirmación de recojo en local.</li>
                  <li>Brindar soporte postventa, atender consultas o resolver incidencias del pedido.</li>
                  <li>Notificarte sobre el estado de tu pedido mediante correos automatizados y WhatsApp.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="font-serif text-base font-semibold text-[#5a3c3c] italic">4. Custodia y Seguridad</h4>
                <p>
                  Tus datos personales se guardan en servidores altamente seguros provistos por Google Cloud/Firestore con acceso restringido.
                  No vendemos, intercambiamos ni transferimos tus datos personales a terceras empresas bajo ningún concepto.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-serif text-base font-semibold text-[#5a3c3c] italic">5. Derechos ARCO</h4>
                <p>
                  Como titular de tus datos personales, puedes ejercer tus derechos de Acceso, Rectificación, Cancelación y Oposición (Derechos ARCO)
                  enviándonos un correo electrónico a <strong>{MERCHANT_DETAILS.email}</strong> o comunicándote al <strong>{MERCHANT_DETAILS.phone}</strong>.
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// 3. REFUND & RETURN POLICY MODAL
export function RefundModal({ isOpen, onClose }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#5a3c3c]/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#fdfcf8] w-full max-w-3xl h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative z-10 text-left border border-[#5a3c3c]/10"
          >
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-[#5a3c3c]/10 flex justify-between items-center bg-[#5a3c3c] text-[#fdfcf8]">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-6 h-6 text-[#81b896]" />
                <div>
                  <h3 className="text-xl font-serif italic">Políticas de Devolución</h3>
                  <p className="text-[10px] uppercase tracking-wider text-white/70">Tiempos y condiciones de reembolso y cambio</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5 text-[#fdfcf8]" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-y-auto p-6 md:p-8 space-y-6 text-sm text-[#5a3c3c]/80 leading-relaxed custom-scrollbar font-sans">
              <section className="space-y-2">
                <h4 className="font-serif text-base font-semibold text-[#5a3c3c] italic">1. Cambios de Producto</h4>
                <p>
                  Dado que vendemos plantas vivas y macetas hechas a mano, aceptamos solicitudes de cambio de productos dentro de un plazo máximo de
                  <strong> 7 días calendario</strong> contados a partir del momento de la recepción o recojo del pedido.
                </p>
                <p>
                  Para proceder al cambio, el producto (plantas, tierra, macetas, fertilizantes) debe encontrarse en perfectas condiciones,
                  con su embalaje original intacto y con la boleta de compra física o electrónica.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-serif text-base font-semibold text-[#5a3c3c] italic">2. Devoluciones y Reembolsos</h4>
                <p>
                  Solo se admiten devoluciones de dinero en los siguientes casos demostrables:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Que la planta haya sufrido daños irreparables en el transporte (delivery) antes de la entrega al cliente.</li>
                  <li>Que las macetas presenten rajaduras, roturas o fallas severas de fabricación visibles al momento de recibir el pedido.</li>
                  <li>Quiebre de stock no advertido en el sitio web al realizar el pago.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="font-serif text-base font-semibold text-[#5a3c3c] italic">3. Procedimiento y Plazos de Extorno</h4>
                <p>
                  Para iniciar una reclamación o devolución, ponte en contacto directo a través de nuestro WhatsApp al <strong>{MERCHANT_DETAILS.phone}</strong> o por correo a <strong>{MERCHANT_DETAILS.email}</strong>, adjuntando fotos del estado del producto recibido.
                </p>
                <p>
                  Una vez aprobada la devolución:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Pagos con tarjeta (Culqi):</strong> Procederemos con la orden de extorno a través del panel de Culqi. El tiempo de reflejo en tu cuenta bancaria dependerá enteramente de tu banco (suele tardar entre 10 y 25 días hábiles según la entidad).</li>
                  <li><strong>Pagos con Plin / Transferencia:</strong> El reembolso se efectuará mediante transferencia directa en un plazo de 24 a 48 horas hábiles tras la validación.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="font-serif text-base font-semibold text-[#5a3c3c] italic">4. Costo del Retorno de Delivery</h4>
                <p>
                  Si la devolución o el cambio se debe a un error de Decoasis Perú o falla de origen del producto, los costos de transporte de retorno y nueva entrega serán asumidos al 100% por nuestra empresa. De lo contrario, los costos logísticos deberán ser cubiertos por el cliente.
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// 4. INTERACTIVE VIRTUAL COMPLAINTS BOOK MODAL (LIBRO DE RECLAMACIONES)
export function ComplaintsBookModal({ isOpen, onClose }: ModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [claimNumber, setClaimNumber] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    dni: "",
    phone: "",
    email: "",
    address: "",
    isMinor: false,
    parentName: "",
    parentDni: "",
    itemType: "producto", // producto / servicio
    itemDescription: "",
    itemAmount: "",
    claimType: "reclamo", // reclamo (disconformidad relacionada al producto) / queja (malestar por mala atencion)
    claimDetails: "",
    claimRequest: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate a unique correlative number
      const code = `DEC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      
      // Save claim to Firestore
      const claimRef = doc(collection(db, "claims"), code);
      await setDoc(claimRef, {
        id: code,
        ...formData,
        timestamp: serverTimestamp(),
        date: new Date().toLocaleDateString("es-PE"),
        status: "pendiente",
      });

      // Send confirmation emails using our backend proxy
      await fetch("/api/send-claim-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimId: code,
          claimData: formData,
        }),
      }).catch((e) => console.error("Error al enviar correo de reclamo:", e));

      setClaimNumber(code);
      setSuccess(true);
    } catch (err) {
      console.error("Error submitting claim:", err);
      alert("Ocurrió un error al registrar el reclamo. Por favor, inténtelo de nuevo o escríbanos directamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#5a3c3c]/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#fdfcf8] w-full max-w-4xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative z-10 text-left border border-[#5a3c3c]/10"
          >
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-[#5a3c3c]/10 flex justify-between items-center bg-[#5a3c3c] text-[#fdfcf8]">
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-[#81b896]" />
                <div>
                  <h3 className="text-xl font-serif italic">Libro de Reclamaciones Virtual</h3>
                  <p className="text-[10px] uppercase tracking-wider text-white/70">
                    Conforme al Código de Protección y Defensa del Consumidor de Perú (INDECOPI)
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5 text-[#fdfcf8]" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-grow overflow-y-auto p-6 md:p-8 custom-scrollbar">
              {success ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-12"
                >
                  <div className="w-16 h-16 bg-[#81b896]/20 rounded-full flex items-center justify-center text-[#81b896] mb-6">
                    <Check className="w-8 h-8" />
                  </div>
                  <h4 className="text-2xl font-serif italic text-[#5a3c3c] mb-2">¡Reclamación Registrada!</h4>
                  <p className="text-sm text-[#5a3c3c]/80 mb-6 leading-relaxed">
                    Su queja o reclamo ha sido recibido correctamente bajo el siguiente número correlativo:
                  </p>
                  <div className="bg-[#5a3c3c] text-white font-mono text-lg font-bold px-6 py-4 rounded-2xl mb-6 tracking-wider">
                    {claimNumber}
                  </div>
                  <p className="text-xs text-[#5a3c3c]/60 leading-relaxed mb-8">
                    Le hemos enviado una copia firmada en formato digital a su correo electrónico.
                    De acuerdo con el Reglamento de INDECOPI, le responderemos en un plazo máximo de
                    <strong> 15 días hábiles</strong>.
                  </p>
                  <button
                    onClick={() => {
                      setSuccess(false);
                      onClose();
                    }}
                    className="bg-[#5a3c3c] text-white px-8 py-3.5 rounded-full uppercase text-[10px] tracking-[0.3em] font-bold hover:bg-[#81b896] transition-colors"
                  >
                    Entendido
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8 text-xs text-[#5a3c3c]">
                  {/* Info Warning Banner */}
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-800">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
                    <div className="space-y-1">
                      <p className="font-semibold text-xs">Información Importante:</p>
                      <p className="leading-relaxed">
                        <strong>RECLAMO:</strong> Disconformidad relacionada con los productos adquiridos.<br />
                        <strong>QUEJA:</strong> Malestar o descontento respecto a la atención al cliente o servicios brindados.
                      </p>
                    </div>
                  </div>

                  {/* 1. CONSUMER INFORMATION */}
                  <div className="space-y-4">
                    <h5 className="text-[10px] uppercase tracking-wider font-bold text-[#81b896] border-b border-[#5a3c3c]/10 pb-2">
                      1. Identificación del Consumidor Reclamante
                    </h5>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block uppercase tracking-wider text-[9px] font-bold mb-1.5">Nombre y Apellidos *</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full bg-[#fdfcf8] border border-[#5a3c3c]/20 rounded-xl px-4 py-3 focus:outline-none focus:border-[#81b896] text-sm"
                          placeholder="Ej. Juan Pérez Ramos"
                        />
                      </div>
                      <div>
                        <label className="block uppercase tracking-wider text-[9px] font-bold mb-1.5">DNI o Carné de Extranjería *</label>
                        <input
                          type="text"
                          name="dni"
                          value={formData.dni}
                          onChange={handleChange}
                          required
                          className="w-full bg-[#fdfcf8] border border-[#5a3c3c]/20 rounded-xl px-4 py-3 focus:outline-none focus:border-[#81b896] text-sm"
                          placeholder="Ej. 45678912"
                        />
                      </div>
                      <div>
                        <label className="block uppercase tracking-wider text-[9px] font-bold mb-1.5">Teléfono o Celular *</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                          className="w-full bg-[#fdfcf8] border border-[#5a3c3c]/20 rounded-xl px-4 py-3 focus:outline-none focus:border-[#81b896] text-sm"
                          placeholder="Ej. 987654321"
                        />
                      </div>
                      <div>
                        <label className="block uppercase tracking-wider text-[9px] font-bold mb-1.5">Correo Electrónico *</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full bg-[#fdfcf8] border border-[#5a3c3c]/20 rounded-xl px-4 py-3 focus:outline-none focus:border-[#81b896] text-sm"
                          placeholder="Ej. juan@correo.com"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block uppercase tracking-wider text-[9px] font-bold mb-1.5">Dirección de Domicilio *</label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          required
                          className="w-full bg-[#fdfcf8] border border-[#5a3c3c]/20 rounded-xl px-4 py-3 focus:outline-none focus:border-[#81b896] text-sm"
                          placeholder="Dirección, Distrito, Provincia y Departamento"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="flex items-center gap-2 cursor-pointer font-semibold">
                        <input
                          type="checkbox"
                          name="isMinor"
                          checked={formData.isMinor}
                          onChange={handleChange}
                          className="rounded border-[#5a3c3c]/30 text-[#81b896] focus:ring-[#81b896]"
                        />
                        <span>¿Es menor de edad? (Se requiere datos de padre/tutor legal)</span>
                      </label>
                    </div>

                    {formData.isMinor && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#5a3c3c]/5 p-4 rounded-2xl">
                        <div>
                          <label className="block uppercase tracking-wider text-[9px] font-bold mb-1.5">Nombre del Padre/Tutor *</label>
                          <input
                            type="text"
                            name="parentName"
                            value={formData.parentName}
                            onChange={handleChange}
                            required={formData.isMinor}
                            className="w-full bg-white border border-[#5a3c3c]/20 rounded-xl px-4 py-3 focus:outline-none focus:border-[#81b896] text-sm"
                            placeholder="Nombre del apoderado"
                          />
                        </div>
                        <div>
                          <label className="block uppercase tracking-wider text-[9px] font-bold mb-1.5">DNI del Padre/Tutor *</label>
                          <input
                            type="text"
                            name="parentDni"
                            value={formData.parentDni}
                            onChange={handleChange}
                            required={formData.isMinor}
                            className="w-full bg-white border border-[#5a3c3c]/20 rounded-xl px-4 py-3 focus:outline-none focus:border-[#81b896] text-sm"
                            placeholder="DNI del apoderado"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. CONTRACTED ITEM */}
                  <div className="space-y-4">
                    <h5 className="text-[10px] uppercase tracking-wider font-bold text-[#81b896] border-b border-[#5a3c3c]/10 pb-2">
                      2. Detalle del Bien Contratado
                    </h5>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block uppercase tracking-wider text-[9px] font-bold mb-1.5">Tipo de Bien *</label>
                        <select
                          name="itemType"
                          value={formData.itemType}
                          onChange={handleChange}
                          className="w-full bg-[#fdfcf8] border border-[#5a3c3c]/20 rounded-xl px-4 py-3 focus:outline-none focus:border-[#81b896] text-sm h-[46px]"
                        >
                          <option value="producto">Producto (Plantas, Macetas, Tierra)</option>
                          <option value="servicio">Servicio (Diseño, Delivery, Asesoría)</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block uppercase tracking-wider text-[9px] font-bold mb-1.5">Monto del Bien (S/)</label>
                        <input
                          type="number"
                          step="0.01"
                          name="itemAmount"
                          value={formData.itemAmount}
                          onChange={handleChange}
                          className="w-full bg-[#fdfcf8] border border-[#5a3c3c]/20 rounded-xl px-4 py-3 focus:outline-none focus:border-[#81b896] text-sm"
                          placeholder="Monto reclamado (opcional). Ej. 85.00"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block uppercase tracking-wider text-[9px] font-bold mb-1.5">Descripción de Productos o Servicio *</label>
                        <textarea
                          name="itemDescription"
                          value={formData.itemDescription}
                          onChange={handleChange}
                          required
                          rows={2}
                          className="w-full bg-[#fdfcf8] border border-[#5a3c3c]/20 rounded-xl px-4 py-3 focus:outline-none focus:border-[#81b896] text-sm resize-none"
                          placeholder="Ej. Maceta monstera grande con Monstera Deliciosa..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. CLAIM DETAILS */}
                  <div className="space-y-4">
                    <h5 className="text-[10px] uppercase tracking-wider font-bold text-[#81b896] border-b border-[#5a3c3c]/10 pb-2">
                      3. Detalle de la Reclamación y Pedido del Consumidor
                    </h5>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block uppercase tracking-wider text-[9px] font-bold mb-1.5">Tipo de Disconformidad *</label>
                        <select
                          name="claimType"
                          value={formData.claimType}
                          onChange={handleChange}
                          className="w-full bg-[#fdfcf8] border border-[#5a3c3c]/20 rounded-xl px-4 py-3 focus:outline-none focus:border-[#81b896] text-sm h-[46px]"
                        >
                          <option value="reclamo">Reclamo (Disconformidad con el producto adquirido)</option>
                          <option value="queja">Queja (Descontento con el servicio, la atención o el trato)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block uppercase tracking-wider text-[9px] font-bold mb-1.5">Detalle, Hechos y Explicación *</label>
                        <textarea
                          name="claimDetails"
                          value={formData.claimDetails}
                          onChange={handleChange}
                          required
                          rows={4}
                          className="w-full bg-[#fdfcf8] border border-[#5a3c3c]/20 rounded-xl px-4 py-3 focus:outline-none focus:border-[#81b896] text-sm"
                          placeholder="Explique los hechos ocurridos de la manera más detallada posible..."
                        />
                      </div>

                      <div>
                        <label className="block uppercase tracking-wider text-[9px] font-bold mb-1.5">Pedido o Solicitud del Consumidor *</label>
                        <textarea
                          name="claimRequest"
                          value={formData.claimRequest}
                          onChange={handleChange}
                          required
                          rows={3}
                          className="w-full bg-[#fdfcf8] border border-[#5a3c3c]/20 rounded-xl px-4 py-3 focus:outline-none focus:border-[#81b896] text-sm"
                          placeholder="¿Qué solución concreta solicita? (Cambio, devolución, disculpas formales, etc.)"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SUBMIT BUTTON */}
                  <div className="pt-4 border-t border-[#5a3c3c]/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-[10px] text-[#5a3c3c]/50 text-center sm:text-left leading-relaxed">
                      Al enviar el formulario, declara que toda la información brindada es fidedigna y acepta la custodia de la misma conforme a nuestras políticas de protección de datos.
                    </p>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-[#81b896] hover:bg-[#5a3c3c] text-white py-4 px-10 rounded-full font-bold uppercase text-[10px] tracking-[0.3em] transition-colors shadow-lg flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Procesando...
                        </>
                      ) : (
                        "Enviar Reclamación"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
