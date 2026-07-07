import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, CreditCard, Landmark, Check, Upload, Trash2, Smartphone, Loader2 } from "lucide-react";
import { CartItem, CustomerInfo, PaymentMethodType } from "../types";

// Simulated districts with shipping fees based on proximity to Punta Hermosa
const DISTRICTS = [
  // Cercanos
  { name: "Punta Hermosa", fee: 5, zone: "Cercano" },
  { name: "Punta Negra", fee: 5, zone: "Cercano" },
  { name: "San Bartolo", fee: 5, zone: "Cercano" },
  { name: "Santa María del Mar", fee: 5, zone: "Cercano" },
  // Distantes
  { name: "Lurín", fee: 10, zone: "Moderado" },
  { name: "Pachacámac", fee: 10, zone: "Moderado" },
  { name: "Villa El Salvador", fee: 10, zone: "Moderado" },
  { name: "Chorrillos", fee: 10, zone: "Moderado" },
  // Lejanos
  { name: "Miraflores", fee: 15, zone: "Lejano" },
  { name: "San Isidro", fee: 15, zone: "Lejano" },
  { name: "Santiago de Surco", fee: 15, zone: "Lejano" },
  { name: "Barranco", fee: 15, zone: "Lejano" },
  { name: "San Borja", fee: 15, zone: "Lejano" },
  { name: "La Molina", fee: 15, zone: "Lejano" },
  // Muy Lejanos
  { name: "Centro de Lima", fee: 20, zone: "Muy Lejano" },
  { name: "San Miguel", fee: 20, zone: "Muy Lejano" },
  { name: "Magdalena del Mar", fee: 20, zone: "Muy Lejano" },
  { name: "Los Olivos", fee: 20, zone: "Muy Lejano" },
  { name: "La Victoria", fee: 20, zone: "Muy Lejano" },
];

interface CheckoutPortalProps {
  cart: CartItem[];
  total: number;
  onClose: () => void;
  onSuccess: (orderDetails: any) => void;
}

export default function CheckoutPortal({ cart, total, onClose, onSuccess }: CheckoutPortalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("culqi");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delivery states
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("Punta Hermosa");

  // Form states
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  const shippingFee = deliveryType === "delivery"
    ? (DISTRICTS.find((d) => d.name === selectedDistrict)?.fee || 0)
    : 0;

  const finalTotal = total + shippingFee;

  const finalCustomerInfo = {
    ...customerInfo,
    address: deliveryType === "pickup" ? "Recojo en Tienda - Decoasis Punta Hermosa" : customerInfo.address,
    deliveryType,
    district: deliveryType === "delivery" ? selectedDistrict : undefined,
    shippingFee,
  };

  // Dynamic Culqi registration and listener
  React.useEffect(() => {
    (window as any).culqi = async () => {
      const Culqi = (window as any).Culqi;
      if (Culqi && Culqi.token) {
        const tokenObj = Culqi.token;
        console.log("Token de Culqi obtenido:", tokenObj);
        
        try {
          Culqi.close();
        } catch (e) {}

        setLoading(true);
        setError(null);

        try {
          const response = await fetch("/api/create-culqi-charge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: tokenObj.id,
              email: tokenObj.email,
              amount: Math.round(finalTotal * 100),
              items: cart,
              customerInfo: finalCustomerInfo,
            }),
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || "Error al procesar el cargo de Culqi.");
          }

          onSuccess({
            id: data.chargeId || `CULQI-${Math.floor(100000 + Math.random() * 900000)}`,
            items: cart,
            customerInfo: finalCustomerInfo,
            paymentMethod: "culqi",
            total: finalTotal,
            date: `${new Date().toLocaleDateString("es-PE")} ${new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: true })}`,
            status: "paid",
          });
        } catch (err: any) {
          setError(err.message || "Ocurrió un error al procesar el cargo con Culqi.");
          setLoading(false);
        }
      } else if (Culqi && Culqi.order) {
        const orderObj = Culqi.order;
        console.log("Orden de Culqi recibida:", orderObj);
        try {
          Culqi.close();
        } catch (e) {}

        onSuccess({
          id: orderObj.id || `CULQI-${Math.floor(100000 + Math.random() * 900000)}`,
          items: cart,
          customerInfo: finalCustomerInfo,
          paymentMethod: "culqi",
          total: finalTotal,
          date: `${new Date().toLocaleDateString("es-PE")} ${new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: true })}`,
          status: "paid",
        });
      } else {
        const culqiError = Culqi ? Culqi.error : null;
        if (culqiError) {
          console.error("Culqi error:", culqiError);
          setError(culqiError.user_message || culqiError.merchant_message || "El pago fue cancelado o declinado.");
        }
        setLoading(false);
      }
    };

    return () => {
      (window as any).culqi = null;
    };
  }, [cart, finalTotal, finalCustomerInfo, onSuccess]);

  // Manual payment states
  const [transactionCode, setTransactionCode] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Handle inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCustomerInfo((prev) => ({ ...prev, [name]: value }));
  };

  // Handle step 1 validation
  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone || (deliveryType === "delivery" && !customerInfo.address)) {
      setError("Por favor, completa todos los campos requeridos.");
      return;
    }
    setError(null);
    setStep(2);
  };

  // File Upload Handlers (Screenshot)
  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Solo se permiten archivos de imagen (JPG, PNG).");
      return;
    }
    setScreenshotName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshot(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setScreenshotName(null);
  };

  // Process Checkout Completion
  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      if (paymentMethod === "culqi") {
        // Culqi Online integration
        const publishableKey = (import.meta as any).env.VITE_CULQI_PUBLISHABLE_KEY;
        const Culqi = (window as any).Culqi;

        if (!publishableKey || publishableKey === "pk_test_..." || !Culqi) {
          // Simulation flow when SDK not present or config is placeholder
          console.warn("CULQI publishable key is not configured or SDK is missing. Simulating payment.");
          
          setTimeout(async () => {
            try {
              const response = await fetch("/api/create-culqi-charge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  token: "tkn_sim_" + Math.random().toString(36).substring(2, 11),
                  email: customerInfo.email || "sofia@gmail.com",
                  amount: Math.round(finalTotal * 100),
                  items: cart,
                  customerInfo: finalCustomerInfo,
                }),
              });

              const data = await response.json();
              if (!response.ok) {
                throw new Error(data.error || "Error al procesar el cargo simulado.");
              }

              onSuccess({
                id: data.chargeId || `CULQI-SIM-${Math.floor(100000 + Math.random() * 900000)}`,
                items: cart,
                customerInfo: finalCustomerInfo,
                paymentMethod: "culqi",
                total: finalTotal,
                date: `${new Date().toLocaleDateString("es-PE")} ${new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: true })}`,
                status: "paid",
              });
            } catch (err: any) {
              setError(err.message || "Error al procesar el cargo simulado.");
              setLoading(false);
            }
          }, 1500);
          return;
        }

        // Real Culqi flow
        Culqi.publicKey = publishableKey;

        Culqi.settings({
          title: "DECOASIS PERÚ",
          currency: "PEN",
          amount: Math.round(finalTotal * 100),
        });

        Culqi.options({
          lang: "es",
          modal: true,
          paymentMethods: {
            tarjeta: true,
            yape: true,
            bancaMovil: true,
            agente: true,
            billetera: true
          }
        });

        Culqi.open();
        setLoading(false); // Hand over interaction to Culqi popup
      } else {
        // Plin or Bank Transfer checkout
        if (!transactionCode.trim()) {
          throw new Error("Por favor, ingresa el código de operación de la transferencia.");
        }
        if (!screenshot) {
          throw new Error("Por favor, sube una captura o foto de la constancia de pago.");
        }

        const response = await fetch("/api/submit-manual-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: cart,
            method: paymentMethod,
            transactionCode,
            customerInfo: finalCustomerInfo,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Ocurrió un error al procesar el pedido.");
        }

        // Success! Callback to parent
        onSuccess({
          id: data.orderId || `DEC-${Math.floor(100000 + Math.random() * 900000)}`,
          items: cart,
          customerInfo: finalCustomerInfo,
          paymentMethod,
          transactionCode,
          screenshot,
          total: finalTotal,
          date: `${new Date().toLocaleDateString("es-PE")} ${new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: true })}`,
          status: "pending",
        });
      }
    } catch (err: any) {
      setError(err.message || "Error al procesar el pago. Inténtalo de nuevo.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#5a3c3c]/60 backdrop-blur-sm z-[1100] flex items-center justify-center p-4 overflow-y-auto">
      {/* Floating Error Notification Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -80, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[1500] w-full max-w-md px-4"
          >
            <div className="bg-[#fdfcf8] border-2 border-red-200 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[2rem] p-6 flex items-start gap-4 border-l-8 border-l-red-500">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 flex-shrink-0 mt-0.5 border border-red-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-grow text-left">
                <h4 className="font-serif font-bold text-[#5a3c3c] text-base italic">Atención con el Pago</h4>
                <p className="text-xs text-[#5a3c3c]/90 mt-1.5 leading-relaxed">
                  {error}
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setError(null)}
                    className="bg-[#5a3c3c] hover:bg-red-600 text-white text-[9px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-full transition-colors cursor-pointer shadow-md"
                  >
                    Entendido / Cerrar
                  </button>
                </div>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-[#5a3c3c]/40 hover:text-red-600 p-1.5 rounded-full transition-colors text-xs"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#fdfcf8] w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-[#5a3c3c]/10 flex flex-col my-8"
      >
        {/* Header */}
        <div className="p-8 md:p-10 border-b border-[#5a3c3c]/5 flex items-center justify-between bg-[#5a3c3c]/5">
          <div>
            <h3 className="text-3xl font-serif italic text-[#5a3c3c]">Pasarela de Pago</h3>
            <p className="text-[10px] uppercase tracking-widest text-[#5a3c3c]/60 mt-1">
              Decoasis Perú • Punta Hermosa
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-[#5a3c3c]/10 rounded-full transition-colors border border-[#5a3c3c]/10 text-[#5a3c3c]"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        {/* Steps Tracker */}
        <div className="flex px-8 py-4 bg-white/60 border-b border-[#5a3c3c]/5 justify-center gap-12 text-xs uppercase tracking-widest font-semibold">
          <span className={`flex items-center gap-2 ${step === 1 ? "text-[#81b896]" : "text-[#5a3c3c]/50"}`}>
            <span className="w-5 h-5 rounded-full bg-[#81b896]/10 flex items-center justify-center text-[10px]">1</span>
            Datos de Envío
          </span>
          <span className={`flex items-center gap-2 ${step === 2 ? "text-[#81b896]" : "text-[#5a3c3c]/50"}`}>
            <span className="w-5 h-5 rounded-full bg-[#81b896]/10 flex items-center justify-center text-[10px]">2</span>
            Pago Seguro
          </span>
        </div>

        {/* Content Area */}
        <div className="p-8 md:p-10 flex-grow max-h-[60vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-xs mb-6 font-medium">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleNextStep}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5a3c3c]/70 mb-2">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={customerInfo.name}
                      onChange={handleInputChange}
                      className="w-full bg-[#5a3c3c]/5 border border-[#5a3c3c]/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-[#81b896] transition-colors"
                      placeholder="Ej. Sofia Alva"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5a3c3c]/70 mb-2">
                      Celular / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={customerInfo.phone}
                      onChange={handleInputChange}
                      className="w-full bg-[#5a3c3c]/5 border border-[#5a3c3c]/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-[#81b896] transition-colors"
                      placeholder="Ej. 933836011"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5a3c3c]/70 mb-2">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={customerInfo.email}
                    onChange={handleInputChange}
                    className="w-full bg-[#5a3c3c]/5 border border-[#5a3c3c]/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-[#81b896] transition-colors"
                    placeholder="Ej. sofia@gmail.com"
                  />
                </div>

                {/* Método de Entrega */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5a3c3c]/70 mb-3">
                    Método de Entrega *
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setDeliveryType("pickup")}
                      className={`flex items-center justify-center py-4 px-5 rounded-2xl border text-xs font-semibold gap-2 transition-all cursor-pointer ${
                        deliveryType === "pickup"
                          ? "bg-[#5a3c3c] text-white border-[#5a3c3c] shadow-md"
                          : "bg-white text-[#5a3c3c] border-[#5a3c3c]/15 hover:border-[#81b896]"
                      }`}
                    >
                      <span>🏪</span> Recojo en Tienda (Gratis)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryType("delivery")}
                      className={`flex items-center justify-center py-4 px-5 rounded-2xl border text-xs font-semibold gap-2 transition-all cursor-pointer ${
                        deliveryType === "delivery"
                          ? "bg-[#5a3c3c] text-white border-[#5a3c3c] shadow-md"
                          : "bg-white text-[#5a3c3c] border-[#5a3c3c]/15 hover:border-[#81b896]"
                      }`}
                    >
                      <span>🛵</span> Delivery a Domicilio
                    </button>
                  </div>
                </div>

                {deliveryType === "delivery" ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-6"
                  >
                    <div className="bg-[#81b896]/10 border border-[#81b896]/20 rounded-2xl p-4 text-xs text-[#5a3c3c] flex items-start gap-2.5">
                      <span className="text-base">🚚</span>
                      <div>
                        <p className="font-bold mb-0.5">Plazo de entrega</p>
                        <p className="opacity-90">Los envíos a domicilio se realizan en un plazo máximo de 24 horas.</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5a3c3c]/70 mb-2">
                        Distrito de Envío *
                      </label>
                      <select
                        value={selectedDistrict}
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                        className="w-full bg-[#5a3c3c]/5 border border-[#5a3c3c]/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-[#81b896] transition-colors text-[#5a3c3c] font-medium"
                      >
                        {DISTRICTS.map((dist) => (
                          <option key={dist.name} value={dist.name} className="text-[#5a3c3c]">
                            {dist.name} ({dist.zone}: S/ {dist.fee.toFixed(2)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5a3c3c]/70 mb-2">
                        Dirección de Entrega *
                      </label>
                      <input
                        type="text"
                        name="address"
                        required={deliveryType === "delivery"}
                        value={customerInfo.address}
                        onChange={handleInputChange}
                        className="w-full bg-[#5a3c3c]/5 border border-[#5a3c3c]/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-[#81b896] transition-colors"
                        placeholder="Ej. Av. San Pedro 450, Punta Hermosa"
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="bg-[#81b896]/10 border border-[#81b896]/20 rounded-2xl p-5 text-left text-xs text-[#5a3c3c]/90 leading-relaxed"
                  >
                    <p className="font-semibold text-sm mb-1 text-[#5a3c3c] flex items-center gap-1.5">
                      📍 Dirección de Recojo en Tienda
                    </p>
                    <p>Av. García Rada, Punta Hermosa 15846, Lima</p>
                    <p className="mt-2 font-medium">🕒 Horario de Atención:</p>
                    <p>Lunes a Sábado: 10:00 AM — 8:00 PM</p>
                  </motion.div>
                )}

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5a3c3c]/70 mb-2">
                    Notas o Instrucciones (Opcional)
                  </label>
                  <textarea
                    name="notes"
                    value={customerInfo.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full bg-[#5a3c3c]/5 border border-[#5a3c3c]/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-[#81b896] transition-colors resize-none"
                    placeholder="Ej. Entregar en portería, coordinar antes de llegar..."
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-[#5a3c3c] text-white py-5 rounded-full font-bold uppercase text-[10px] tracking-[0.3em] hover:bg-[#81b896] transition-colors shadow-lg cursor-pointer text-center"
                  >
                    Elegir Método de Pago
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-8"
              >
                {/* Method selector */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5a3c3c]/70 mb-4">
                    Selecciona tu pasarela de pago:
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("culqi")}
                      className={`flex flex-col items-center justify-center p-6 rounded-3xl border transition-all text-center gap-3 cursor-pointer ${
                        paymentMethod === "culqi"
                          ? "border-[#81b896] bg-[#81b896]/10 text-[#5a3c3c]"
                          : "border-[#5a3c3c]/10 hover:border-[#81b896]/50 bg-white"
                      }`}
                    >
                      <CreditCard className="w-6 h-6 text-[#5a3c3c]" />
                      <div className="font-semibold text-xs">Tarjeta o Yape (Culqi)</div>
                      <div className="text-[9px] text-[#5a3c3c]/60">Pago online inmediato</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("plin")}
                      className={`flex flex-col items-center justify-center p-6 rounded-3xl border transition-all text-center gap-3 cursor-pointer ${
                        paymentMethod === "plin"
                          ? "border-[#81b896] bg-[#81b896]/10 text-[#5a3c3c]"
                          : "border-[#5a3c3c]/10 hover:border-[#81b896]/50 bg-white"
                      }`}
                    >
                      <Smartphone className="w-6 h-6 text-cyan-600" />
                      <div className="font-semibold text-xs">Plin Directo</div>
                      <div className="text-[9px] text-[#5a3c3c]/60">Banca móvil instantánea</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("transfer")}
                      className={`flex flex-col items-center justify-center p-6 rounded-3xl border transition-all text-center gap-3 cursor-pointer col-span-2 ${
                        paymentMethod === "transfer"
                          ? "border-[#81b896] bg-[#81b896]/10 text-[#5a3c3c]"
                          : "border-[#5a3c3c]/10 hover:border-[#81b896]/50 bg-white"
                      }`}
                    >
                      <Landmark className="w-6 h-6 text-[#5a3c3c]" />
                      <div className="font-semibold text-xs">Transferencia Directa</div>
                      <div className="text-[9px] text-[#5a3c3c]/60">BCP / Interbank / BBVA</div>
                    </button>
                  </div>
                </div>

                {/* Method instructions */}
                <div className="bg-[#5a3c3c]/5 p-6 rounded-3xl border border-[#5a3c3c]/5 space-y-4">
                  {paymentMethod === "culqi" && (
                    <div className="space-y-2">
                      <h4 className="font-serif text-lg italic font-semibold text-[#5a3c3c]">Pago con Tarjeta Seguro (Culqi)</h4>
                      <p className="text-xs text-[#5a3c3c]/80 leading-relaxed">
                        Se abrirá nuestra pasarela de pagos segura provista por **Culqi** (Visa, MasterCard, Amex, Diners, y Yape). El procesamiento es inmediato y recibirás tu boleta de compra.
                      </p>
                    </div>
                  )}

                  {paymentMethod === "plin" && (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row items-center gap-6">
                        {/* Mock QR code representing Plin */}
                        <div className="bg-white p-3 border border-[#5a3c3c]/10 rounded-2xl flex-shrink-0 flex flex-col items-center">
                          <img
                            src="https://images.unsplash.com/photo-1595079676339-1534801ad6cf?q=80&w=200&auto=format&fit=crop"
                            alt="Plin QR"
                            className="w-28 h-28 object-cover rounded-lg opacity-80"
                          />
                          <span className="text-[9px] font-bold text-[#5a3c3c] mt-2">DECOASIS QR</span>
                        </div>
                        <div className="space-y-2 text-center sm:text-left">
                          <h4 className="font-serif text-lg italic font-semibold text-[#5a3c3c]">Plin al instante</h4>
                          <p className="text-xs text-[#5a3c3c]/80">
                            1. Escanea el código QR o transfiere por Plin al número:<br />
                            <strong className="text-sm text-[#81b896] block my-1 font-bold">+51 933 836 011</strong>
                            Titular: <strong>Decoasis Perú</strong>
                          </p>
                          <p className="text-[11px] text-[#5a3c3c]/60">
                            Monto exacto a transferir: <strong className="text-[#5a3c3c]">S/ {finalTotal.toFixed(2)}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-[#5a3c3c]/10 pt-4 space-y-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5a3c3c]/70 mb-2">
                            Código de Operación (6 dígitos) *
                          </label>
                          <input
                            type="text"
                            maxLength={8}
                            required
                            value={transactionCode}
                            onChange={(e) => setTransactionCode(e.target.value)}
                            className="w-full bg-white border border-[#5a3c3c]/15 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-[#81b896]"
                            placeholder="Ej. 123456"
                          />
                        </div>

                        {/* Drag and Drop Screenshot */}
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5a3c3c]/70 mb-2">
                            Constancia de Pago (Captura/Imagen) *
                          </label>
                          
                          {!screenshot ? (
                            <div
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={handleDrop}
                              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 bg-white ${
                                isDragging ? "border-[#81b896] bg-[#81b896]/5" : "border-[#5a3c3c]/20 hover:border-[#81b896]"
                              }`}
                              onClick={() => document.getElementById("file-upload")?.click()}
                            >
                              <Upload className="w-8 h-8 text-[#5a3c3c]/40" />
                              <span className="text-xs font-semibold text-[#5a3c3c]/80">
                                Arrastra tu captura aquí o haz clic para buscar
                              </span>
                              <span className="text-[10px] text-[#5a3c3c]/50">
                                Formatos permitidos: JPG, PNG
                              </span>
                              <input
                                id="file-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                              />
                            </div>
                          ) : (
                            <div className="bg-white border border-[#5a3c3c]/10 rounded-2xl p-4 flex items-center justify-between">
                              <div className="flex items-center gap-4 overflow-hidden">
                                <img
                                  src={screenshot}
                                  alt="Preview"
                                  className="w-12 h-12 object-cover rounded-lg border border-[#5a3c3c]/10"
                                />
                                <div className="text-left overflow-hidden">
                                  <div className="text-xs font-semibold text-[#5a3c3c] truncate">
                                    {screenshotName || "constancia.jpg"}
                                  </div>
                                  <div className="text-[10px] text-[#81b896] font-bold flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Cargado correctamente
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={removeScreenshot}
                                className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "transfer" && (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <h4 className="font-serif text-lg italic font-semibold text-[#5a3c3c]">Cuentas de Transferencia</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div className="bg-white p-4 rounded-2xl border border-[#5a3c3c]/10 text-left">
                            <span className="font-bold text-[#5a3c3c]">BCP Soles</span>
                            <p className="font-mono text-[11px] mt-1 select-all">191-93383601-1-98</p>
                            <span className="text-[10px] text-[#5a3c3c]/60">CCI: 002-19119338360119854</span>
                          </div>

                          <div className="bg-white p-4 rounded-2xl border border-[#5a3c3c]/10 text-left">
                            <span className="font-bold text-blue-600">Interbank Soles</span>
                            <p className="font-mono text-[11px] mt-1 select-all">200-3001933836</p>
                            <span className="text-[10px] text-[#5a3c3c]/60">CCI: 003-20000300193383688</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-[#5a3c3c]/70 text-left">
                          Titular de las cuentas: <strong>Decoasis Perú S.A.C.</strong><br />
                          Monto exacto a transferir: <strong className="text-sm font-bold text-[#81b896]">S/ {finalTotal.toFixed(2)}</strong>
                        </p>
                      </div>

                      <div className="border-t border-[#5a3c3c]/10 pt-4 space-y-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5a3c3c]/70 mb-2">
                            Código o Número de Operación *
                          </label>
                          <input
                            type="text"
                            required
                            value={transactionCode}
                            onChange={(e) => setTransactionCode(e.target.value)}
                            className="w-full bg-white border border-[#5a3c3c]/15 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-[#81b896]"
                            placeholder="Ej. BCP-58493"
                          />
                        </div>

                        {/* Drag and Drop Screenshot */}
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5a3c3c]/70 mb-2">
                            Constancia de Pago (Captura/Imagen) *
                          </label>
                          
                          {!screenshot ? (
                            <div
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={handleDrop}
                              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 bg-white ${
                                isDragging ? "border-[#81b896] bg-[#81b896]/5" : "border-[#5a3c3c]/20 hover:border-[#81b896]"
                              }`}
                              onClick={() => document.getElementById("file-upload")?.click()}
                            >
                              <Upload className="w-8 h-8 text-[#5a3c3c]/40" />
                              <span className="text-xs font-semibold text-[#5a3c3c]/80">
                                Arrastra tu captura aquí o haz clic para buscar
                              </span>
                              <span className="text-[10px] text-[#5a3c3c]/50">
                                Formatos permitidos: JPG, PNG
                              </span>
                              <input
                                id="file-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                              />
                            </div>
                          ) : (
                            <div className="bg-white border border-[#5a3c3c]/10 rounded-2xl p-4 flex items-center justify-between">
                              <div className="flex items-center gap-4 overflow-hidden">
                                <img
                                  src={screenshot}
                                  alt="Preview"
                                  className="w-12 h-12 object-cover rounded-lg border border-[#5a3c3c]/10"
                                />
                                <div className="text-left overflow-hidden">
                                  <div className="text-xs font-semibold text-[#5a3c3c] truncate">
                                    {screenshotName || "transfer_screenshot.png"}
                                  </div>
                                  <div className="text-[10px] text-[#81b896] font-bold flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Cargado correctamente
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={removeScreenshot}
                                className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation and Checkout buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 border border-[#5a3c3c]/30 text-[#5a3c3c] py-5 rounded-full font-bold uppercase text-[10px] tracking-[0.3em] hover:bg-[#5a3c3c] hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    disabled={loading}
                  >
                    <ArrowLeft className="w-3 h-3" /> Regresar
                  </button>

                   <button
                    type="button"
                    onClick={handleCheckout}
                    className="flex-1 bg-[#81b896] text-white py-5 rounded-full font-bold uppercase text-[10px] tracking-[0.3em] hover:bg-[#5a3c3c] transition-colors shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Procesando...
                      </>
                    ) : paymentMethod === "culqi" ? (
                      "Pagar S/ " + finalTotal.toFixed(2)
                    ) : (
                      "Confirmar Pedido S/ " + finalTotal.toFixed(2)
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Summary */}
        <div className="p-8 md:p-10 border-t border-[#5a3c3c]/5 bg-[#5a3c3c]/5 text-sm space-y-2">
          {deliveryType === "delivery" && (
            <div className="flex justify-between items-center text-xs text-[#5a3c3c]/70">
              <span>Subtotal Productos:</span>
              <span>S/ {total.toFixed(2)}</span>
            </div>
          )}
          {deliveryType === "delivery" && (
            <div className="flex justify-between items-center text-xs text-[#5a3c3c]/70">
              <span>Costo de Envío ({selectedDistrict}):</span>
              <span>S/ {shippingFee.toFixed(2)}</span>
            </div>
          )}
          {deliveryType === "pickup" && (
            <div className="flex justify-between items-center text-xs text-[#5a3c3c]/70">
              <span>Método de Entrega:</span>
              <span className="font-semibold text-[#81b896]">Recojo en Tienda (Gratis)</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-3 border-t border-[#5a3c3c]/10">
            <span className="uppercase text-[9px] tracking-[0.3em] font-bold text-[#5a3c3c]/60">Total a Invertir</span>
            <span className="text-2xl font-serif text-[#5a3c3c] font-semibold">S/ {finalTotal.toFixed(2)}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
