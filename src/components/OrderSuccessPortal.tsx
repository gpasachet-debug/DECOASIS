import { motion } from "motion/react";
import { CheckCircle2, ShoppingBag, Send, PhoneCall, Copy, Check, Home } from "lucide-react";
import { useState } from "react";
import { CartItem, CustomerInfo, PaymentMethodType } from "../types";

interface OrderSuccessPortalProps {
  orderDetails: {
    id: string;
    items: CartItem[];
    customerInfo: CustomerInfo;
    paymentMethod: PaymentMethodType;
    transactionCode?: string;
    screenshot?: string | null;
    total: number;
    date: string;
    simulated?: boolean;
  };
  onClose: () => void;
}

export default function OrderSuccessPortal({ orderDetails, onClose }: OrderSuccessPortalProps) {
  const [copied, setCopied] = useState(false);
  const { id, items, customerInfo, paymentMethod, transactionCode, total, date, simulated } = orderDetails;

  const getMethodLabel = (method: PaymentMethodType) => {
    switch (method) {
      case "culqi":
        return "Tarjeta de Crédito / Débito (Culqi)";
      case "plin":
        return "Plin Móvil";
      case "transfer":
        return "Transferencia Bancaria Directa";
      default:
        return "Pago Coordinado";
    }
  };

  const copyOrderId = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Create customized WhatsApp message for order confirmation and delivery coordination
  const sendWhatsAppUpdate = () => {
    const phone = "51933836011"; // Decoasis phone
    let text = `🌿 *¡Hola DECOASIS PERÚ!* Acabo de realizar una compra en su boutique online.%0A%0A`;
    text += `*Detalles del Pedido:*%0A`;
    text += `▪️ *Código:* ${id}%0A`;
    text += `▪️ *Fecha:* ${date}%0A`;
    text += `▪️ *Método de Pago:* ${getMethodLabel(paymentMethod)}%0A`;
    if (transactionCode) {
      text += `▪️ *Código de Operación:* ${transactionCode}%0A`;
    }
    text += `%0A*Artículos:*%0A`;
    items.forEach((item) => {
      text += `• ${item.name} x${item.quantity} (S/ ${(item.price * item.quantity).toFixed(2)})%0A`;
    });
    
    const deliveryTypeLabel = customerInfo.deliveryType === "delivery" ? "🛵 Delivery a Domicilio" : "🏪 Recojo en Tienda";
    text += `%0A*Método de Entrega:* ${deliveryTypeLabel}%0A`;
    if (customerInfo.deliveryType === "delivery" && customerInfo.district) {
      text += `▪️ *Distrito de Envío:* ${customerInfo.district}%0A`;
      text += `▪️ *Costo de Envío:* S/ ${Number(customerInfo.shippingFee || 0).toFixed(2)}%0A`;
    }
    
    text += `▪️ *Monto Total:* S/ ${total.toFixed(2)}%0A%0A`;
    text += `*Datos del Cliente:*%0A`;
    text += `▪️ *Nombre:* ${customerInfo.name}%0A`;
    text += `▪️ *Celular:* ${customerInfo.phone}%0A`;
    text += `▪️ *Dirección:* ${customerInfo.address}%0A`;
    if (customerInfo.notes) {
      text += `▪️ *Notas:* ${customerInfo.notes}%0A`;
    }
    
    if (customerInfo.deliveryType === "delivery") {
      text += `%0A_Quedo atento(a) para coordinar el despacho del delivery a mi domicilio. ¡Muchas gracias!_ 🌸`;
    } else {
      text += `%0A_Coordinaré para acercarme a su tienda en Punta Hermosa a recoger mi pedido. ¡Muchas gracias!_ 🌸`;
    }

    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#fdfcf8] flex items-center justify-center p-6 pt-32 pb-16">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1491147334573-44cbb4602074?q=80&w=2000&auto=format&fit=crop"
          className="w-full h-full object-cover opacity-5 scale-105"
          alt="Fondo Botánico"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl border border-[#5a3c3c]/10 overflow-hidden"
      >
        {/* Banner */}
        <div className="bg-[#81b896]/10 p-10 text-center border-b border-[#5a3c3c]/5 flex flex-col items-center relative">
          <button
            onClick={() => {
              onClose();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="absolute top-6 right-6 p-3 bg-white hover:bg-[#5a3c3c]/5 text-[#5a3c3c] rounded-full transition-all border border-[#5a3c3c]/10 shadow-sm flex items-center justify-center cursor-pointer"
            title="Ir a la página principal"
          >
            <Home className="w-4 h-4" />
          </button>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-20 h-20 rounded-full bg-[#81b896] text-white flex items-center justify-center mb-6 shadow-lg shadow-[#81b896]/30"
          >
            <CheckCircle2 className="w-10 h-10" />
          </motion.div>
          <div className="mb-4 flex justify-center">
            <img 
              src="https://lh3.googleusercontent.com/d/1tSnV2r8aV8oKPOE6tgwpgppFXQhZCrri" 
              alt="Logo Decoasis" 
              className="h-40 md:h-48 w-auto object-contain"
            />
          </div>
          <h2 className="text-3xl font-serif text-[#5a3c3c] italic">¡Gracias por tu compra!</h2>
          <p className="text-xs text-[#5a3c3c]/70 mt-2 max-w-md mx-auto leading-relaxed">
            {paymentMethod !== "culqi" ? (
              "Hemos recibido tu pedido y pronto recibirás la confirmación. Estamos preparando tus plantas con todo el cuidado que se merecen."
            ) : (
              "Hemos recibido tu pedido y estamos preparando tus plantas con todo el cuidado que se merecen."
            )}
          </p>

          {simulated && (
            <div className="inline-block mt-4 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5 text-[10px] text-amber-700 font-semibold tracking-wider uppercase">
              ⚠️ Pago Simulado (Entorno de Demostración)
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-8 md:p-10 space-y-8">
          {/* Summary Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b border-[#5a3c3c]/5 text-left">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-[#5a3c3c]/50 block">Código</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="font-mono text-xs font-semibold text-[#5a3c3c] truncate max-w-[80px]">
                  {id}
                </span>
                <button
                  onClick={copyOrderId}
                  className="p-1 hover:bg-[#5a3c3c]/5 rounded text-[#5a3c3c]/50 transition-colors"
                  title="Copiar código"
                >
                  {copied ? <Check className="w-3 h-3 text-[#81b896]" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            <div>
              <span className="text-[9px] uppercase tracking-wider text-[#5a3c3c]/50 block">Fecha</span>
              <span className="text-xs font-semibold text-[#5a3c3c] block mt-1">{date}</span>
            </div>

            <div>
              <span className="text-[9px] uppercase tracking-wider text-[#5a3c3c]/50 block">Pago</span>
              <span className="text-xs font-semibold text-[#5a3c3c] block mt-1 truncate" title={getMethodLabel(paymentMethod)}>
                {paymentMethod === "culqi" ? "Tarjeta" : paymentMethod === "plin" ? "Plin" : "Transf."}
              </span>
            </div>

            <div>
              <span className="text-[9px] uppercase tracking-wider text-[#5a3c3c]/50 block">Inversión</span>
              <span className="text-sm font-semibold text-[#81b896] block mt-1">S/ {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Delivery & Billing details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left text-xs text-[#5a3c3c]/80">
            <div className="space-y-2 bg-[#5a3c3c]/5 p-5 rounded-2xl border border-[#5a3c3c]/5">
              <h4 className="font-serif italic font-semibold text-sm text-[#5a3c3c]">Detalles de Entrega</h4>
              <p>
                <strong>Método:</strong> {customerInfo.deliveryType === "delivery" ? "🛵 Delivery a Domicilio" : "🏪 Recojo en Tienda"}
              </p>
              {customerInfo.deliveryType === "delivery" && customerInfo.district && (
                <p>
                  <strong>Distrito:</strong> {customerInfo.district} (Envío: S/ {Number(customerInfo.shippingFee || 0).toFixed(2)})
                </p>
              )}
              <p>
                <strong>Nombre:</strong> {customerInfo.name}
              </p>
              <p>
                <strong>Celular:</strong> {customerInfo.phone}
              </p>
              <p>
                <strong>Dirección:</strong> {customerInfo.address}
              </p>
              {customerInfo.notes && (
                <p>
                  <strong>Notas:</strong> {customerInfo.notes}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="font-serif italic font-semibold text-sm text-[#5a3c3c]">Artículos Adquiridos</h4>
              <div className="max-h-[140px] overflow-y-auto custom-scrollbar space-y-3 pr-2">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-10 h-10 object-cover rounded-lg border border-[#5a3c3c]/10"
                    />
                    <div className="flex-grow min-w-0">
                      <div className="font-serif italic text-xs truncate">{item.name}</div>
                      <div className="text-[9px] text-[#5a3c3c]/60">Cant: {item.quantity}</div>
                    </div>
                    <span className="font-serif text-xs font-semibold">
                      S/ {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              onClick={sendWhatsAppUpdate}
              className="flex-1 bg-[#25D366] text-white py-5 rounded-full font-bold uppercase text-[10px] tracking-[0.3em] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <Send className="w-3.5 h-3.5" /> Coordinar por WhatsApp
            </button>

            <button
              onClick={() => {
                onClose();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="flex-1 border border-[#5a3c3c]/30 text-[#5a3c3c] py-5 rounded-full font-bold uppercase text-[10px] tracking-[0.3em] hover:bg-[#5a3c3c] hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" /> Volver al Inicio
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
