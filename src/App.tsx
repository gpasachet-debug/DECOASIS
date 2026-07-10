import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShoppingBag, 
  MapPin, 
  Instagram, 
  Facebook, 
  Phone, 
  Clock, 
  Compass, 
  ChevronRight, 
  Plus, 
  Minus, 
  Trash2, 
  Star,
  Check,
  CreditCard,
  Lock,
  BookOpen
} from "lucide-react";
import { PLANTS } from "./data";
import { CartItem, OrderDetails, Plant } from "./types";
import CheckoutPortal from "./components/CheckoutPortal";
import OrderSuccessPortal from "./components/OrderSuccessPortal";
import AdminDashboard from "./components/AdminDashboard";
import { TermsModal, PrivacyModal, RefundModal, ComplaintsBookModal } from "./components/LegalDocs";
import { saveOrderToFirestore, subscribeToInventory, deductOrderStock } from "./firebase";

export default function App() {
  // State managers
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("decoasis_cart");
    return saved ? JSON.parse(saved) : [];
  });
  const [filter, setFilter] = useState<"todos" | "interior" | "tropical">("todos");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [successfulOrder, setSuccessfulOrder] = useState<any | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [copyrightClicks, setCopyrightClicks] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [inventory, setInventory] = useState<{ [key: number]: number }>({});

  // Subscribe to inventory in real-time
  useEffect(() => {
    const unsubscribe = subscribeToInventory((updatedInventory) => {
      setInventory(updatedInventory);
    });
    return () => unsubscribe();
  }, []);

  const getPlantStock = (plantId: number): number => {
    return inventory[plantId] !== undefined ? inventory[plantId] : 10;
  };

  // Legal Modals state
  const [showTermsApp, setShowTermsApp] = useState(false);
  const [showPrivacyApp, setShowPrivacyApp] = useState(false);
  const [showRefundApp, setShowRefundApp] = useState(false);
  const [showComplaintsApp, setShowComplaintsApp] = useState(false);

  // Sync cart to localStorage
  useEffect(() => {
    localStorage.setItem("decoasis_cart", JSON.stringify(cart));
  }, [cart]);

  // Clear toast message after 3 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Check for Stripe / Simulated Redirect Success / Admin toggle on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const isSimulated = params.get("simulated") === "true";
    const itemsParam = params.get("items");
    const infoParam = params.get("info");
    const adminParam = params.get("admin");

    if (adminParam !== null) {
      setIsAdminOpen(true);
      // Clean up the ?admin URL parameter from the browser bar
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (sessionId && itemsParam) {
      try {
        const decodedItems = JSON.parse(decodeURIComponent(itemsParam));
        const decodedInfo = JSON.parse(decodeURIComponent(infoParam || "{}"));
        
        // Calculate total
        const calcTotal = decodedItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

        const orderId = sessionId.startsWith("sim_") ? sessionId : `CUL-${sessionId.substring(8, 16).toUpperCase()}`;
        const newOrder = {
          id: orderId,
          items: decodedItems,
          customerInfo: decodedInfo,
          paymentMethod: "culqi" as const,
          total: calcTotal,
          date: `${new Date().toLocaleDateString("es-PE")} ${new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: true })}`,
          simulated: isSimulated,
          status: "paid" as const
        };

        setSuccessfulOrder(newOrder);

        // Guardar en Firestore de forma asíncrona para no bloquear
        saveOrderToFirestore(newOrder)
          .then(() => {
            deductOrderStock(newOrder.id, newOrder.items);
          })
          .catch((err) => {
            console.error("[Firebase] Error al guardar pedido desde redirección:", err);
            deductOrderStock(newOrder.id, newOrder.items);
          });

        // Clear cart since order succeeded!
        setCart([]);
        localStorage.removeItem("decoasis_cart");
      } catch (err) {
        console.error("Error decoding success URL parameters:", err);
      }
    }
  }, []);

  // Cart operations
  const addToCart = (plant: Plant) => {
    const stock = getPlantStock(plant.id);
    const existingInCart = cart.find(item => item.id === plant.id);
    const currentQty = existingInCart ? existingInCart.quantity : 0;
    
    if (stock <= 0) {
      setToastMessage(`¡Lo sentimos! ${plant.name} está agotado. 🌿`);
      return;
    }
    
    if (currentQty + 1 > stock) {
      setToastMessage(`¡Solo quedan ${stock} unidades de ${plant.name} en stock! 🌿`);
      return;
    }

    setCart((prev) => {
      const exists = prev.find((item) => item.id === plant.id);
      if (exists) {
        return prev.map((item) => 
          item.id === plant.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...plant, quantity: 1 }];
    });
    setToastMessage(`¡${plant.name} agregado! 🌿`);
  };

  const updateQuantity = (id: number, amount: number) => {
    const stock = getPlantStock(id);
    const item = cart.find(i => i.id === id);
    if (!item) return;

    if (amount > 0 && item.quantity + amount > stock) {
      setToastMessage(`¡Solo quedan ${stock} unidades disponibles! 🌿`);
      return;
    }

    setCart((prev) => 
      prev.map((item) => {
        if (item.id === id) {
          const newQty = item.quantity + amount;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      }).filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Quick fallback checkout directly to WhatsApp (preserves original checkout option)
  const legacyWhatsAppCheckout = () => {
    const phone = "51933836011";
    let message = "¡Hola DECOASIS! 🌿 Quisiera consultar sobre el siguiente pedido para coordinar pago y entrega:%0A%0A";
    cart.forEach(item => { 
      message += `▪️ ${item.name} (Cant: ${item.quantity} - S/ ${(item.price * item.quantity).toFixed(2)})%0A`; 
    });
    message += `%0A*Monto Total: S/ ${cartTotal.toFixed(2)}*`;
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  };

  // Handle successful manual checkout completion
  const handleCheckoutSuccess = (orderDetails: any) => {
    setSuccessfulOrder(orderDetails);
    
    // Guardar en Firestore de forma asíncrona para no bloquear al cliente
    saveOrderToFirestore(orderDetails)
      .then(() => {
        // Solo reducir stock de inmediato si el método de pago es culqi o si el estado es pagado
        if (orderDetails.paymentMethod === "culqi" || orderDetails.status === "paid") {
          deductOrderStock(orderDetails.id, orderDetails.items);
        }
      })
      .catch((err) => {
        console.error("[Firebase] Error al guardar el pedido en Firestore:", err);
        if (orderDetails.paymentMethod === "culqi" || orderDetails.status === "paid") {
          deductOrderStock(orderDetails.id, orderDetails.items);
        }
      });

    // Automatically send confirmation email to the customer if payment method is culqi
    if (orderDetails.paymentMethod === "culqi") {
      console.log(`[Checkout] Solicitando envío de correo de pago confirmado automático (Culqi) para el pedido ${orderDetails.id} a ${orderDetails.customerInfo?.email}...`);
      fetch("/api/send-paid-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: orderDetails.id,
          total: orderDetails.total,
          items: orderDetails.items,
          customerInfo: orderDetails.customerInfo,
        }),
      })
        .then(res => res.json())
        .then(data => {
          console.log("[Checkout] Correo automático de confirmación de Culqi procesado:", data);
        })
        .catch(err => {
          console.error("[Checkout] Error al enviar correo automático de confirmación de Culqi:", err);
        });
    }

    setShowCheckout(false);
    setCart([]);
    localStorage.removeItem("decoasis_cart");
  };

  const handleCloseSuccess = () => {
    setSuccessfulOrder(null);
    // Clear URL parameters elegantly
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const handleCopyrightClick = () => {
    setCopyrightClicks((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        setIsAdminOpen(true);
        return 0;
      }
      return next;
    });
  };

  // Filter products
  const filteredPlants = filter === "todos" 
    ? PLANTS 
    : PLANTS.filter((p) => p.category === filter);

  // Render successful checkout state as a full screen layout
  if (successfulOrder) {
    return (
      <OrderSuccessPortal 
        orderDetails={successfulOrder} 
        onClose={handleCloseSuccess} 
      />
    );
  }

  // Render Admin Dashboard
  if (isAdminOpen) {
    return (
      <AdminDashboard 
        onClose={() => setIsAdminOpen(false)} 
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcf8] selection:bg-[#f2a8a4]/30 relative overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-[#fdfcf8]/90 backdrop-blur-md border-b border-[#5a3c3c]/5 transition-all duration-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 md:h-24 flex items-center justify-between">
          <div className="font-serif text-2xl tracking-[0.2em] font-medium text-[#5a3c3c] flex items-center gap-2">
            DECOASIS
          </div>
          
          <div className="hidden md:flex space-x-12 uppercase text-[10px] tracking-[0.3em] font-semibold text-[#5a3c3c]/80">
            <a href="#home" className="hover:text-[#81b896] transition-colors">Inicio</a>
            <a href="#catalogo" className="hover:text-[#81b896] transition-colors">Colección</a>
            <a href="#contacto" className="hover:text-[#81b896] transition-colors">Contacto</a>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            <button 
              onClick={() => setIsCartOpen(true)} 
              className="relative p-2.5 rounded-full hover:bg-[#5a3c3c]/5 group transition-all"
              title="Ver Bolsa de Compras"
            >
              <ShoppingBag className="w-5 h-5 group-hover:text-[#81b896] text-[#5a3c3c] transition-colors stroke-[1.3]" />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 bg-[#f2a8a4] text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-sm"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <header id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1491147334573-44cbb4602074?q=80&w=2000&auto=format&fit=crop" 
            className="w-full h-full object-cover opacity-10 scale-105" 
            alt="Fondo Botánico"
          />
        </div>
        <div className="relative z-10 text-center px-6 max-w-4xl flex flex-col items-center">
          {/* Logo / Branding */}
          <div className="mb-4">
            <img 
              src="https://lh3.googleusercontent.com/d/1tSnV2r8aV8oKPOE6tgwpgppFXQhZCrri" 
              alt="DECOASIS Perú Logo" 
              className="h-64 md:h-[380px] w-auto object-contain transition-transform hover:scale-105 duration-700"
            />
          </div>

          {/* Location Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#81b896]/10 text-[#81b896] text-[10px] uppercase tracking-widest font-bold mb-6">
            <MapPin className="w-3 h-3" />
            <span>Punta Hermosa, Lima</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#81b896]"></span>
          </div>
          
          <p className="font-script text-5xl md:text-7xl text-[#81b896] lowercase mb-6">Cultivando Vida</p>
          
          <p className="font-sans font-light text-sm md:text-base text-[#5a3c3c]/80 mb-10 max-w-xl mx-auto leading-relaxed">
            Disfruta de la perfecta armonía entre plantas excepcionales, diseño botánico, macetas artesanales y decoración única junto al mar.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#catalogo" 
              className="px-10 py-4 bg-[#5a3c3c] text-white rounded-full hover:bg-[#81b896] transition-all duration-500 uppercase text-[10px] tracking-[0.3em] shadow-xl hover:scale-105 transform cursor-pointer"
            >
              Explorar Plantas
            </a>
            <a 
              href="#contacto" 
              className="px-10 py-4 border border-[#5a3c3c]/30 text-[#5a3c3c] rounded-full hover:bg-[#5a3c3c] hover:text-white transition-all duration-500 uppercase text-[10px] tracking-[0.3em] hover:scale-105 transform cursor-pointer"
            >
              Visítanos
            </a>
          </div>
        </div>
      </header>

      {/* Catalog Section */}
      <section id="catalogo" className="py-32 px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
          <div className="max-w-xl text-left">
            <span className="font-script text-5xl text-[#f2a8a4] block mb-2 leading-none">Colección</span>
            <h2 className="text-4xl md:text-5xl font-serif text-[#5a3c3c] leading-tight italic">Para tu espacio</h2>
          </div>
          
          {/* Filter tabs */}
          <div className="flex flex-wrap gap-3">
            {(["todos", "interior", "tropical"] as const).map((cat) => (
              <button 
                key={cat}
                onClick={() => setFilter(cat)} 
                className={`px-8 py-3 rounded-full border border-[#5a3c3c]/10 text-[10px] uppercase tracking-widest transition-all cursor-pointer font-bold ${
                  filter === cat 
                    ? "bg-[#5a3c3c] text-white shadow-md" 
                    : "bg-white text-[#5a3c3c] hover:border-[#81b896] hover:text-[#81b896]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Plant Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-20">
          <AnimatePresence mode="popLayout">
            {filteredPlants.map((plant, idx) => {
              const stock = getPlantStock(plant.id);
              const isAgotado = stock <= 0;
              return (
                <motion.div 
                  layout
                  key={plant.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, delay: idx * 0.05 }}
                  className="group flex flex-col text-left"
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[3rem] bg-[#fdfcf8] mb-8 shadow-sm border border-[#5a3c3c]/5">
                    <img 
                      src={plant.image} 
                      className={`w-full h-full object-cover transition-transform duration-[2s] ease-out group-hover:scale-105 ${isAgotado ? "grayscale opacity-75" : ""}`} 
                      alt={plant.name}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors duration-700"></div>
                    
                    {/* Agotado Badge overlay */}
                    {isAgotado && (
                      <div className="absolute top-6 left-6 bg-[#e06666] text-white text-[9px] font-sans font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-full shadow-md z-10">
                        Agotado
                      </div>
                    )}
                    
                    {/* Hover Add to Bag button */}
                    <button 
                      onClick={() => !isAgotado && addToCart(plant)}
                      disabled={isAgotado}
                      className={`absolute bottom-8 left-8 right-8 py-5 rounded-full shadow-xl font-sans font-bold text-[9px] tracking-[0.3em] uppercase transition-all duration-500 translate-y-0 opacity-100 md:translate-y-8 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 ${
                        isAgotado 
                          ? "bg-gray-200/90 text-gray-400 cursor-not-allowed" 
                          : "bg-[#fdfcf8]/95 backdrop-blur-md text-[#5a3c3c] hover:text-[#81b896] cursor-pointer"
                      }`}
                    >
                      {isAgotado ? "Agotado" : "Añadir a Bolsa"}
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-start px-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.4em] text-[#81b896] font-bold mb-2 block">{plant.category}</span>
                      <h3 className="text-2xl font-serif text-[#5a3c3c] italic leading-tight">{plant.name}</h3>
                      <p className="text-xs text-[#5a3c3c]/60 mt-3 font-light max-w-[240px] leading-relaxed">{plant.desc}</p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="font-serif text-xl text-[#5a3c3c] mt-1 font-semibold whitespace-nowrap">S/ {plant.price.toFixed(2)}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </section>

      {/* Footer / Store info */}
      <footer id="contacto" className="bg-[#5a3c3c] text-[#fdfcf8] py-28 px-6 md:px-12 relative overflow-hidden mt-auto">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute -right-32 -bottom-32 w-96 h-96 rounded-full bg-[#81b896]/5 filter blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16 relative z-10 text-left">
          {/* Column 1: Logo & About */}
          <div>
            <img 
              src="https://lh3.googleusercontent.com/d/1tSnV2r8aV8oKPOE6tgwpgppFXQhZCrri" 
              alt="Logo Decoasis" 
              className="w-48 mb-6 object-contain"
            />
            {/* Reviews badge */}
            <div className="flex items-center gap-2.5 mb-6">
              <div className="flex text-amber-400 text-sm">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 stroke-none" />)}
              </div>
              <span className="text-xs font-semibold text-white">5.0</span>
              <span className="text-[10px] text-[#fdfcf8]/60">(3 opiniones en Google Maps)</span>
            </div>

            <p className="font-sans font-light text-xs text-[#fdfcf8]/70 max-w-sm leading-relaxed mb-6">
              Elevando tus espacios a través del diseño botánico artesanal y piezas únicas de decoración frente al mar de Punta Hermosa.
            </p>
            
            {/* Social Icons */}
            <div className="flex space-x-4">
              <a href="https://www.instagram.com/decoasisperu/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 border border-white/10 hover:border-[#81b896] hover:bg-[#81b896] text-white hover:scale-110 transition-all rounded-full flex items-center justify-center" title="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://www.facebook.com/DecoasisPeru" target="_blank" rel="noopener noreferrer" className="w-10 h-10 border border-white/10 hover:border-[#81b896] hover:bg-[#81b896] text-white hover:scale-110 transition-all rounded-full flex items-center justify-center" title="Facebook">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://wa.me/51933836011" target="_blank" rel="noopener noreferrer" className="w-10 h-10 border border-white/10 hover:border-[#81b896] hover:bg-[#81b896] text-white hover:scale-110 transition-all rounded-full flex items-center justify-center" title="WhatsApp">
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>
          
          {/* Column 2: Encuéntranos & Datos de Comercio */}
          <div>
            <h4 className="font-serif text-xl text-white mb-6 italic">Encuéntranos</h4>
            <ul className="space-y-4 font-sans text-xs font-light text-[#fdfcf8]/70 mb-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#81b896] mt-0.5 flex-shrink-0" />
                <span>Av. García Rada,<br />Punta Hermosa 15846, Lima</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#81b896] flex-shrink-0" />
                <a href="tel:+51933836011" className="hover:text-white transition-colors">+51 933 836 011</a>
              </li>
            </ul>

            <div className="border-t border-white/10 pt-4 mt-4 font-sans text-[11px] text-[#fdfcf8]/60 space-y-1">
              <p className="font-bold text-white uppercase text-[9px] tracking-wider mb-2">Datos del Comercio</p>
              <p><strong>Razón Social:</strong> DECOASIS PERÚ S.A.C.</p>
              <p><strong>RUC:</strong> 20608543210</p>
              <p><strong>Dirección:</strong> Av. García Rada, Punta Hermosa</p>
            </div>
          </div>

          {/* Column 3: Servicios & Horario */}
          <div>
            <h4 className="font-serif text-xl text-white mb-6 italic">Servicios & Horario</h4>
            <div className="space-y-6 text-xs font-light text-[#fdfcf8]/70">
              <div>
                <p className="flex items-center gap-2 mb-1.5">
                  <Clock className="w-4 h-4 text-[#81b896]" /> Abierto de Lunes a Sábado:
                </p>
                <p className="font-sans text-sm font-semibold text-[#81b896]">10:00 AM — 8:00 PM</p>
              </div>
              
              <div className="border-t border-white/10 pt-4">
                <span className="block text-[9px] uppercase tracking-widest text-[#81b896] font-bold mb-3">Opciones de Servicio</span>
                <ul className="space-y-2 text-xs">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#81b896]" /> Compra en tienda (Punta Hermosa)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#81b896]" /> Delivery express en Lima
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Column 4: Información Legal (Culqi Compliance) */}
          <div>
            <h4 className="font-serif text-xl text-white mb-6 italic">Información Legal</h4>
            <div className="flex flex-col space-y-3 text-xs font-light text-[#fdfcf8]/70">
              <button 
                onClick={() => setShowTermsApp(true)}
                className="text-left hover:text-white transition-colors flex items-center gap-2 cursor-pointer w-fit"
              >
                <Check className="w-3.5 h-3.5 text-[#81b896]" /> Términos y Condiciones
              </button>
              <button 
                onClick={() => setShowPrivacyApp(true)}
                className="text-left hover:text-white transition-colors flex items-center gap-2 cursor-pointer w-fit"
              >
                <Check className="w-3.5 h-3.5 text-[#81b896]" /> Políticas de Privacidad
              </button>
              <button 
                onClick={() => setShowRefundApp(true)}
                className="text-left hover:text-white transition-colors flex items-center gap-2 cursor-pointer w-fit"
              >
                <Check className="w-3.5 h-3.5 text-[#81b896]" /> Devolución y Reembolso
              </button>
              
              {/* Libro de Reclamaciones Link (INDECOPI) */}
              <div className="border-t border-white/10 pt-4 mt-2">
                <button 
                  onClick={() => setShowComplaintsApp(true)}
                  className="bg-[#fdfcf8] text-[#5a3c3c] hover:bg-[#81b896] hover:text-white transition-all font-semibold rounded-2xl py-3 px-4 flex items-center justify-center gap-2.5 w-full shadow-md text-xs cursor-pointer text-center"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Libro de Reclamaciones</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Accepted Payment Logos (Culqi Compliance Requirement) */}
        <div className="max-w-4xl mx-auto mt-16 pt-8 border-t border-white/10 flex flex-col items-center gap-6 relative z-10">
          <p className="text-[10px] uppercase tracking-widest text-[#fdfcf8]/40 font-bold">
            Medios de pago 100% seguros procesados por Culqi
          </p>
          <div className="w-full bg-[#fcfbfa] border border-[#5a3c3c]/10 py-5 px-8 rounded-2xl flex flex-wrap items-center justify-center gap-x-12 gap-y-6 shadow-md">
            {/* Visa (High-Fidelity Vector SVG) */}
            <div className="h-4 md:h-5 hover:scale-105 transition-transform duration-300 select-none flex items-center cursor-pointer" title="Visa">
              <svg viewBox="50 180 412 150" className="h-full w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M229 323h-32l20-133h33l-21 133Zm117-129c-6-3-16-6-29-6-31 0-54 18-54 44 0 19 16 30 28 36 13 6 17 11 17 16 0 9-10 13-19 13-13 0-20-2-31-7l-4-2-4 30c7 4 21 7 36 7 33 0 55-18 56-45 0-15-9-27-27-36-12-6-19-11-19-17 1-5 6-11 19-11 11 0 18 2 24 5l3 1 4-28Zm43 82 13-37 4-13 3 12 7 38h-27Zm40-86h-25c-8 0-13 3-17 11l-48 122h34l7-20h41l4 20h30l-26-133Zm-259 0-31 91-4-19c-6-21-24-44-44-55l29 116h34l50-133h-34Z M109 190H58l-1 3c40 11 67 38 78 70l-11-61c-2-9-8-11-15-12Z" fill="#1A1F71" />
              </svg>
            </div>
            {/* Mastercard (High-Fidelity Vector SVG) */}
            <div className="h-6 md:h-7 hover:scale-105 transition-transform duration-300 select-none flex items-center cursor-pointer" title="Mastercard">
              <svg viewBox="50 126 412 260" className="h-full w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="180" cy="256" fill="#EB001B" r="120" />
                <circle cx="332" cy="256" fill="#F79E1B" r="120" />
                <path d="M256 349a120 120 0 0 1 0-186m0 0a120 120 180 0 1 0 186" fill="#FF5A00" />
              </svg>
            </div>
            {/* Diners Club (High-Fidelity Vector SVG) */}
            <div className="h-5 md:h-6 hover:scale-105 transition-transform duration-300 select-none flex items-center cursor-pointer" title="Diners Club">
              <svg viewBox="0 0 100 32" className="h-full w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="14" cy="16" rx="8" ry="11" stroke="#0079C1" strokeWidth="1.8" />
                <ellipse cx="20" cy="16" rx="8" ry="11" stroke="#0079C1" strokeWidth="1.8" />
                <text x="33" y="20" fill="#0079C1" fontSize="10" fontWeight="900" fontFamily="sans-serif" letterSpacing="-0.03em" style={{ fontStyle: 'italic' }}>Diners Club</text>
              </svg>
            </div>
            {/* American Express (High-Fidelity Vector SVG) */}
            <div className="h-6 md:h-7 hover:scale-105 transition-transform duration-300 select-none flex items-center cursor-pointer" title="American Express">
              <svg viewBox="0 0 100 32" className="h-full w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="100" height="32" rx="6" fill="#0170c2" />
                <text x="50" y="14" fill="#ffffff" fontSize="6.5" fontWeight="900" textAnchor="middle" fontFamily="sans-serif" letterSpacing="0.08em">AMERICAN</text>
                <text x="50" y="24" fill="#ffffff" fontSize="6.5" fontWeight="900" textAnchor="middle" fontFamily="sans-serif" letterSpacing="0.08em">EXPRESS</text>
              </svg>
            </div>
            {/* Yape (High-Fidelity Vector SVG) */}
            <div className="h-7 md:h-8 hover:scale-105 transition-transform duration-300 select-none flex items-center cursor-pointer" title="Yape">
              <svg viewBox="0 0 100 32" className="h-full w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 24 L7 28 L9 22 Z" fill="#00dcb4" />
                <circle cx="16" cy="15" r="11" fill="#00dcb4" />
                <text x="16" y="19" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">S/</text>
                <text x="32" y="21" fill="#742274" fontSize="18" fontWeight="900" fontFamily="sans-serif" style={{ fontStyle: 'italic', letterSpacing: '-0.04em' }}>yape</text>
              </svg>
            </div>
            {/* Plin (High-Fidelity Vector SVG) */}
            <div className="h-7 md:h-8 hover:scale-105 transition-transform duration-300 select-none flex items-center cursor-pointer" title="Plin">
              <svg viewBox="0 0 100 32" className="h-full w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="plinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00e5ff" />
                    <stop offset="100%" stopColor="#00b0ff" />
                  </linearGradient>
                </defs>
                <rect x="2" y="2" width="96" height="28" rx="14" fill="url(#plinGrad)" />
                <path d="M18 28 L14 31 L18 26 Z" fill="url(#plinGrad)" />
                <text x="50" y="21" fill="#ffffff" fontSize="15" fontWeight="900" textAnchor="middle" fontFamily="sans-serif" style={{ letterSpacing: '-0.02em' }}>plin</text>
                <circle cx="53.8" cy="12.2" r="2.2" fill="#ff007a" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
          <p 
            onClick={handleCopyrightClick}
            className="text-[9px] uppercase tracking-widest text-[#fdfcf8]/30 cursor-pointer select-none"
            title="Decoasis Perú"
          >
            © 2026 DECOASIS PERÚ. Todos los derechos reservados.
          </p>
          {localStorage.getItem("decoasis_admin_auth") === "true" && (
            <button 
              onClick={() => setIsAdminOpen(true)}
              className="text-[9px] uppercase tracking-widest text-[#fdfcf8]/40 hover:text-[#81b896] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Lock className="w-2.5 h-2.5" /> Acceso Administrador
            </button>
          )}
        </div>
      </footer>

      {/* Shopping Cart Sidebar Overlay */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop blur overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-[#5a3c3c]/60 backdrop-blur-sm z-[1000]"
            />

            {/* Sidebar panel */}
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.4 }}
              className="fixed inset-y-0 right-0 w-full md:w-[460px] bg-[#fdfcf8] shadow-2xl z-[1005] flex flex-col p-8 md:p-12 text-left"
            >
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h3 className="text-3xl font-serif italic text-[#5a3c3c]">Tu Selección</h3>
                  <p className="text-[10px] uppercase tracking-widest text-[#5a3c3c]/50 mt-1">Boutique Decoasis</p>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)} 
                  className="p-3 hover:bg-[#5a3c3c]/5 rounded-full transition-colors border border-[#5a3c3c]/10 text-[#5a3c3c]"
                >
                  ✕
                </button>
              </div>
              
              {/* Cart List */}
              <div className="flex-grow overflow-y-auto custom-scrollbar space-y-6 pr-2">
                {cart.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-[#5a3c3c]/40 gap-3">
                    <Compass className="w-8 h-8 animate-spin text-[#81b896]" style={{ animationDuration: '6s' }} />
                    <p className="font-serif text-lg italic text-center">Tu bolsa de compras está vacía</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-5 border-b border-[#5a3c3c]/5 pb-4 last:border-0">
                      <div className="w-16 h-20 rounded-2xl overflow-hidden bg-[#5a3c3c]/5 flex-shrink-0">
                        <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className="text-sm font-serif italic text-[#5a3c3c] truncate">{item.name}</h4>
                        <p className="text-[10px] uppercase text-[#5a3c3c]/50 mt-1">S/ {item.price.toFixed(2)} c/u</p>
                        
                        {/* Quantity adjusters */}
                        <div className="flex items-center gap-3 mt-3 bg-[#5a3c3c]/5 w-fit rounded-lg px-2 py-1">
                          <button 
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 hover:text-[#81b896] transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-semibold select-none w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 hover:text-[#81b896] transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 hover:bg-red-50 text-red-400 rounded-xl transition-colors self-center flex-shrink-0"
                        title="Eliminar artículo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
              
              {/* Cart Footer */}
              {cart.length > 0 && (
                <div className="border-t border-[#5a3c3c]/10 pt-8 mt-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="uppercase text-[9px] tracking-[0.3em] font-bold text-[#5a3c3c]/50">Inversión Total</span>
                    <span className="text-3xl font-serif text-[#5a3c3c] font-semibold">S/ {cartTotal.toFixed(2)}</span>
                  </div>
                  
                  {/* Option A: Secure Checkout Portal */}
                  <button 
                    onClick={() => {
                      setIsCartOpen(false);
                      setShowCheckout(true);
                    }}
                    className="w-full bg-[#5a3c3c] text-white py-5 rounded-full font-bold uppercase text-[10px] tracking-[0.3em] hover:bg-[#81b896] transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" /> Proceder al Pago Seguro
                  </button>

                  {/* Option B: Legacy WhatsApp Order (Direct query) */}
                  <button 
                    onClick={legacyWhatsAppCheckout}
                    className="w-full border border-[#5a3c3c]/20 text-[#5a3c3c] py-4 rounded-full font-bold uppercase text-[9px] tracking-[0.3em] hover:bg-[#5a3c3c]/5 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Consultar por WhatsApp
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Checkout Portal Modal */}
      <AnimatePresence>
        {showCheckout && (
          <CheckoutPortal 
            cart={cart}
            total={cartTotal}
            onClose={() => setShowCheckout(false)}
            onSuccess={handleCheckoutSuccess}
          />
        )}
      </AnimatePresence>

      {/* Legal Modals (Culqi Compliance) */}
      <TermsModal isOpen={showTermsApp} onClose={() => setShowTermsApp(false)} />
      <PrivacyModal isOpen={showPrivacyApp} onClose={() => setShowPrivacyApp(false)} />
      <RefundModal isOpen={showRefundApp} onClose={() => setShowRefundApp(false)} />
      <ComplaintsBookModal isOpen={showComplaintsApp} onClose={() => setShowComplaintsApp(false)} />

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 left-6 right-6 sm:left-auto sm:right-6 sm:w-auto max-w-sm z-[1200] bg-[#5a3c3c] text-white py-4 px-6 rounded-2xl shadow-2xl flex items-center justify-between gap-4 border border-white/10 font-sans text-xs uppercase tracking-wider font-semibold"
          >
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#81b896] animate-pulse flex-shrink-0"></span>
              <span className="truncate">{toastMessage}</span>
            </div>
            <button 
              onClick={() => setIsCartOpen(true)} 
              className="bg-white/15 hover:bg-white/25 text-white text-[9px] uppercase tracking-widest font-bold py-1.5 px-3 rounded-full transition-all flex-shrink-0"
            >
              Ver Bolsa
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
