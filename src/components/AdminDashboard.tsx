import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Lock, 
  Unlock, 
  ArrowLeft, 
  Copy, 
  Check, 
  Eye, 
  Trash2,
  Phone,
  Mail,
  MapPin,
  ClipboardList,
  AlertCircle,
  FileImage,
  BookOpen
} from "lucide-react";
import { 
  subscribeToOrders, 
  updateOrderStatus, 
  deleteOrderFromFirestore, 
  subscribeToClaims, 
  updateClaimStatus, 
  deleteClaimFromFirestore, 
  Order, 
  Claim 
} from "../firebase";

interface AdminDashboardProps {
  onClose: () => void;
}

export default function AdminDashboard({ onClose }: AdminDashboardProps) {
  const [passcode, setPasscode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("decoasis_admin_auth") === "true";
  });
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Tab control
  const [activeTab, setActiveTab] = useState<"orders" | "claims">("orders");

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deliveryFilter, setDeliveryFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showScreenshotModal, setShowScreenshotModal] = useState<string | null>(null);

  // Claims State
  const [claims, setClaims] = useState<Claim[]>([]);
  const [claimSearchQuery, setClaimSearchQuery] = useState("");
  const [claimTypeFilter, setClaimTypeFilter] = useState<string>("all");
  const [claimStatusFilter, setClaimStatusFilter] = useState<string>("all");
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [confirmDeleteClaimId, setConfirmDeleteClaimId] = useState<string | null>(null);
  const [isUpdatingClaim, setIsUpdatingClaim] = useState(false);

  // Subscribe to real-time orders and claims on mount if authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    
    console.log("[Admin] Suscribiéndose a pedidos en Firestore...");
    const unsubscribeOrders = subscribeToOrders((updatedOrders) => {
      setOrders(updatedOrders);
    });

    console.log("[Admin] Suscribiéndose a reclamos en Firestore...");
    const unsubscribeClaims = subscribeToClaims((updatedClaims) => {
      setClaims(updatedClaims);
    });
    
    return () => {
      unsubscribeOrders();
      unsubscribeClaims();
    };
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === "decoasis2026") {
      setIsAuthenticated(true);
      localStorage.setItem("decoasis_admin_auth", "true");
      setAuthError(null);
    } else {
      setAuthError("Contraseña incorrecta. Por favor, intenta de nuevo.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("decoasis_admin_auth");
    onClose();
  };

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStatusChange = async (orderId: string, newStatus: Order["status"]) => {
    setIsUpdating(true);
    try {
      await updateOrderStatus(orderId, newStatus);
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }

      // Automatically send confirmation email to the customer if status changed to PAID
      if (newStatus === "paid") {
        const orderObj = orders.find(o => o.id === orderId);
        if (orderObj && orderObj.customerInfo?.email) {
          console.log(`[Admin] Solicitando envío de correo de pago confirmado para el pedido ${orderId} a ${orderObj.customerInfo.email}...`);
          fetch("/api/send-paid-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              orderId: orderObj.id,
              total: orderObj.total,
              items: orderObj.items,
              customerInfo: orderObj.customerInfo,
            }),
          })
            .then(res => res.json())
            .then(data => {
              console.log("[Admin] Correo de confirmación de pago procesado:", data);
            })
            .catch(err => {
              console.error("[Admin] Error al llamar a la API de correo de confirmación:", err);
            });
        }
      }
    } catch (err) {
      alert("Error al actualizar el estado del pedido.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteOrderFromFirestore(orderId);
      setConfirmDeleteId(null);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
    } catch (err) {
      alert("Error al eliminar el pedido.");
    }
  };

  // Claim action handlers
  const handleClaimStatusChange = async (claimId: string, newStatus: Claim["status"]) => {
    setIsUpdatingClaim(true);
    try {
      await updateClaimStatus(claimId, newStatus);
      if (selectedClaim && selectedClaim.id === claimId) {
        setSelectedClaim(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      alert("Error al actualizar el estado del reclamo.");
    } finally {
      setIsUpdatingClaim(false);
    }
  };

  const handleDeleteClaim = async (claimId: string) => {
    try {
      await deleteClaimFromFirestore(claimId);
      setConfirmDeleteClaimId(null);
      if (selectedClaim?.id === claimId) {
        setSelectedClaim(null);
      }
    } catch (err) {
      alert("Error al eliminar el reclamo.");
    }
  };

  // Filter claims based on queries
  const filteredClaims = claims.filter((claim) => {
    const matchesSearch = 
      (claim.id || "").toLowerCase().includes(claimSearchQuery.toLowerCase()) ||
      (claim.name || "").toLowerCase().includes(claimSearchQuery.toLowerCase()) ||
      (claim.dni || "").toLowerCase().includes(claimSearchQuery.toLowerCase()) ||
      (claim.phone || "").toLowerCase().includes(claimSearchQuery.toLowerCase()) ||
      (claim.email || "").toLowerCase().includes(claimSearchQuery.toLowerCase());
      
    const matchesType = claimTypeFilter === "all" || claim.claimType === claimTypeFilter;
    const matchesStatus = claimStatusFilter === "all" || claim.status === claimStatusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Filter orders based on queries
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      (order.id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.customerInfo?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.customerInfo?.phone || "").includes(searchQuery) ||
      (order.customerInfo?.email || "").toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesDelivery = deliveryFilter === "all" || order.customerInfo?.deliveryType === deliveryFilter;
    
    return matchesSearch && matchesStatus && matchesDelivery;
  });

  // Calculate statistics
  const validOrders = orders.filter(o => o.status !== "cancelled");
  const totalSales = validOrders.reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const inPreparation = orders.filter(o => o.status === "preparing" || o.status === "shipped").length;
  const completedOrders = orders.filter(o => o.status === "delivered").length;

  // Calculate claims statistics
  const totalClaims = claims.length;
  const pendingClaims = claims.filter(c => c.status === "pendiente").length;
  const resolvedClaims = claims.filter(c => c.status === "atendido").length;

  const getStatusLabelAndColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return { label: "Por Confirmar", bg: "bg-amber-100 text-amber-800 border-amber-200" };
      case "paid":
        return { label: "Pagado", bg: "bg-emerald-100 text-emerald-800 border-emerald-200" };
      case "preparing":
        return { label: "En Preparación", bg: "bg-blue-100 text-blue-800 border-blue-200" };
      case "shipped":
        return { label: "Enviado", bg: "bg-indigo-100 text-indigo-800 border-indigo-200" };
      case "delivered":
        return { label: "Entregado", bg: "bg-teal-100 text-teal-800 border-teal-200" };
      case "cancelled":
        return { label: "Cancelado", bg: "bg-rose-100 text-rose-800 border-rose-200" };
      default:
        return { label: "Desconocido", bg: "bg-gray-100 text-gray-800 border-gray-200" };
    }
  };

  const getMethodBadge = (method: Order["paymentMethod"]) => {
    switch (method) {
      case "culqi":
        return "bg-purple-100 text-purple-800 font-bold uppercase text-[9px] px-2 py-0.5 rounded-full border border-purple-200";
      case "plin":
        return "bg-sky-100 text-sky-800 font-bold uppercase text-[9px] px-2 py-0.5 rounded-full border border-sky-200";
      case "transfer":
        return "bg-orange-100 text-orange-800 font-bold uppercase text-[9px] px-2 py-0.5 rounded-full border border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 font-bold uppercase text-[9px] px-2 py-0.5 rounded-full border border-gray-200";
    }
  };

  const getMethodName = (method: Order["paymentMethod"]) => {
    switch (method) {
      case "culqi": return "Tarjetas / Yape (Culqi)";
      case "plin": return "Plin";
      case "transfer": return "Transferencia";
      default: return method;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-[#5a3c3c]/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-md bg-[#fdfcf8] rounded-3xl p-8 shadow-2xl text-center border border-[#5a3c3c]/10"
        >
          <div className="w-16 h-16 bg-[#5a3c3c]/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#5a3c3c]/10">
            <Lock className="w-6 h-6 text-[#5a3c3c]" />
          </div>
          
          <h2 className="text-2xl font-serif italic text-[#5a3c3c] mb-2">Acceso Administrativo</h2>
          <p className="text-xs text-[#5a3c3c]/60 mb-6 uppercase tracking-wider">Decoasis Perú — Gestión de Pedidos</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="text-left">
              <label className="block text-[9px] uppercase tracking-widest font-bold text-[#5a3c3c]/60 mb-2">Contraseña de Administrador</label>
              <input 
                type="password" 
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Ingresa la contraseña"
                className="w-full bg-[#5a3c3c]/5 border border-[#5a3c3c]/10 rounded-2xl px-5 py-4 text-center font-sans focus:outline-none focus:ring-2 focus:ring-[#81b896] transition-all"
                required
              />
            </div>
            
            {authError && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-200/50 rounded-xl p-3 flex items-center gap-2 justify-center">
                <AlertCircle className="w-4 h-4" /> {authError}
              </p>
            )}
            
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 rounded-full text-xs font-bold uppercase tracking-widest transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-1/2 bg-[#5a3c3c] hover:bg-[#81b896] text-white py-4 rounded-full text-xs font-bold uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Unlock className="w-4 h-4" /> Entrar
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#fdfcf8] z-[1999] overflow-y-auto flex flex-col text-left">
      {/* Admin Nav */}
      <header className="bg-white border-b border-[#5a3c3c]/5 px-6 py-5 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="p-3 hover:bg-gray-100 rounded-full transition-colors border border-gray-200 text-[#5a3c3c]"
              title="Volver a la tienda"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${activeTab === "orders" ? "bg-emerald-500" : "bg-purple-500"}`}></span>
                <h1 className="text-xl font-serif italic text-[#5a3c3c] font-semibold">
                  {activeTab === "orders" ? "Bandeja de Pedidos" : "Libro de Reclamaciones"}
                </h1>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-[#5a3c3c]/60 mt-0.5">Decoasis Perú — Panel de Operaciones</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-100 px-3 py-1.5 rounded-full font-medium">
              Conexión Firestore en Tiempo Real Activa ⚡
            </span>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-all"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* Tab Switcher */}
        <div className="flex border-b border-[#5a3c3c]/10 gap-2 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab("orders")}
            className={`py-3 px-6 font-serif italic text-sm transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === "orders" 
                ? "border-[#5a3c3c] text-[#5a3c3c] font-bold" 
                : "border-transparent text-[#5a3c3c]/50 hover:text-[#5a3c3c]"
            }`}
          >
            <ClipboardList className="w-4 h-4" /> Pedidos ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab("claims")}
            className={`py-3 px-6 font-serif italic text-sm transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === "claims" 
                ? "border-[#5a3c3c] text-[#5a3c3c] font-bold" 
                : "border-transparent text-[#5a3c3c]/50 hover:text-[#5a3c3c]"
            }`}
          >
            <BookOpen className="w-4 h-4" /> Libro de Reclamaciones ({claims.length})
            {claims.filter(c => c.status === "pendiente").length > 0 && (
              <span className="bg-red-500 text-white text-[9px] font-bold font-sans rounded-full px-1.5 py-0.5 animate-pulse">
                {claims.filter(c => c.status === "pendiente").length}
              </span>
            )}
          </button>
        </div>

        {activeTab === "orders" ? (
          <>
            {/* Statistics Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-[#5a3c3c]/5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#5a3c3c]/50 font-bold">Ventas Totales</p>
              <h3 className="text-2xl font-serif font-bold text-[#5a3c3c] mt-2">S/ {totalSales.toFixed(2)}</h3>
              <p className="text-[10px] text-[#81b896] mt-1 font-semibold">Excluye pedidos cancelados</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#81b896]">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#5a3c3c]/5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#5a3c3c]/50 font-bold">Por Confirmar</p>
              <h3 className="text-2xl font-serif font-bold text-amber-600 mt-2">{pendingOrders}</h3>
              <p className="text-[10px] text-amber-500 mt-1 font-semibold">Pagos manuales pendientes</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
              <ClipboardList className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#5a3c3c]/5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#5a3c3c]/50 font-bold">En Preparación / Ruta</p>
              <h3 className="text-2xl font-serif font-bold text-blue-600 mt-2">{inPreparation}</h3>
              <p className="text-[10px] text-blue-500 mt-1 font-semibold">Pedidos listos por despachar</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <Truck className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#5a3c3c]/5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#5a3c3c]/50 font-bold">Entregados</p>
              <h3 className="text-2xl font-serif font-bold text-teal-600 mt-2">{completedOrders}</h3>
              <p className="text-[10px] text-teal-500 mt-1 font-semibold">Entregas completadas</p>
            </div>
            <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filters and Search Panel */}
        <div className="bg-white p-6 rounded-3xl border border-[#5a3c3c]/5 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
            {/* Search Input */}
            <div className="relative flex-grow max-w-md">
              <Search className="w-4 h-4 text-[#5a3c3c]/40 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por cliente, pedido, celular o email..."
                className="w-full bg-[#5a3c3c]/5 border border-[#5a3c3c]/10 rounded-2xl pl-11 pr-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#81b896] focus:bg-white transition-all text-[#5a3c3c]"
              />
            </div>

            {/* Filter selectors */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-[#5a3c3c]/5 px-3 py-2 rounded-xl border border-[#5a3c3c]/10">
                <Filter className="w-3.5 h-3.5 text-[#5a3c3c]/60" />
                <span className="text-[10px] uppercase font-bold text-[#5a3c3c]/60">Estado:</span>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer text-[#5a3c3c]"
                >
                  <option value="all">Todos los estados</option>
                  <option value="pending">Por Confirmar (Pendientes)</option>
                  <option value="paid">Pagados</option>
                  <option value="preparing">En Preparación</option>
                  <option value="shipped">Enviados (En Ruta)</option>
                  <option value="delivered">Entregados</option>
                  <option value="cancelled">Cancelados</option>
                </select>
              </div>

              <div className="flex items-center gap-2 bg-[#5a3c3c]/5 px-3 py-2 rounded-xl border border-[#5a3c3c]/10">
                <Truck className="w-3.5 h-3.5 text-[#5a3c3c]/60" />
                <span className="text-[10px] uppercase font-bold text-[#5a3c3c]/60">Entrega:</span>
                <select 
                  value={deliveryFilter}
                  onChange={(e) => setDeliveryFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer text-[#5a3c3c]"
                >
                  <option value="all">Todas las entregas</option>
                  <option value="delivery">Delivery a domicilio</option>
                  <option value="pickup">Recojo en Tienda</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-3xl border border-[#5a3c3c]/5 shadow-sm overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="p-16 text-center text-[#5a3c3c]/40 space-y-3">
              <Package className="w-12 h-12 text-[#81b896] mx-auto animate-bounce" />
              <p className="font-serif italic text-lg text-[#5a3c3c]">No se encontraron pedidos en esta categoría</p>
              <p className="text-xs text-gray-400">Intenta cambiar los filtros o realizar otra búsqueda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#5a3c3c]/5 border-b border-[#5a3c3c]/5 text-[10px] uppercase tracking-widest text-[#5a3c3c]/60 font-bold">
                    <th className="px-6 py-4 text-left">Pedido</th>
                    <th className="px-6 py-4 text-left">Fecha</th>
                    <th className="px-6 py-4 text-left">Cliente</th>
                    <th className="px-6 py-4 text-left">Entrega</th>
                    <th className="px-6 py-4 text-left">Método Pago</th>
                    <th className="px-6 py-4 text-right">Inversión</th>
                    <th className="px-6 py-4 text-center">Estado</th>
                    <th className="px-6 py-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#5a3c3c]/5 text-sm text-[#5a3c3c]">
                  {filteredOrders.map((order) => {
                    const statusConfig = getStatusLabelAndColor(order.status);
                    return (
                      <tr 
                        key={order.id}
                        className="hover:bg-[#5a3c3c]/2 transition-colors cursor-pointer group"
                        onClick={() => setSelectedOrder(order)}
                      >
                        {/* ID */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-gray-900 group-hover:text-[#81b896] transition-colors">{order.id}</span>
                            <button 
                              onClick={(e) => handleCopyId(order.id, e)}
                              className="p-1 text-gray-400 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-all"
                              title="Copiar ID"
                            >
                              {copiedId === order.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                          {order.simulated && (
                            <span className="text-[9px] uppercase tracking-wider font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-md border border-amber-200 mt-1 inline-block">
                              Modo Demo
                            </span>
                          )}
                        </td>
                        
                        {/* Date */}
                        <td className="px-6 py-4 text-xs font-medium text-gray-500 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            {order.date}
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900 leading-tight">{order.customerInfo?.name || "Cliente Sin Nombre"}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{order.customerInfo?.phone || "Sin teléfono"}</div>
                        </td>

                        {/* Delivery */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {order.customerInfo?.deliveryType === "delivery" ? (
                            <div>
                              <span className="text-xs font-semibold bg-green-50 text-green-800 border border-green-200 rounded-full px-2.5 py-1 flex items-center gap-1 w-fit">
                                🛵 Delivery
                              </span>
                              <div className="text-[10px] text-gray-500 mt-1 font-semibold pl-1">{order.customerInfo?.district || "No especificado"}</div>
                            </div>
                          ) : (
                            <span className="text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 rounded-full px-2.5 py-1 flex items-center gap-1 w-fit">
                              🏪 Recojo
                            </span>
                          )}
                        </td>

                        {/* Payment Method */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className={getMethodBadge(order.paymentMethod)}>
                              {getMethodName(order.paymentMethod)}
                            </span>
                            {order.transactionCode && (
                              <span className="text-[10px] font-mono text-gray-400">Cod: {order.transactionCode}</span>
                            )}
                          </div>
                        </td>

                        {/* Total Investment */}
                        <td className="px-6 py-4 text-right font-serif font-bold text-gray-900 whitespace-nowrap">
                          S/ {order.total.toFixed(2)}
                        </td>

                        {/* Status badge */}
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.bg}`}>
                            {statusConfig.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => setSelectedOrder(order)}
                              className="p-2 hover:bg-gray-100 text-gray-600 hover:text-gray-900 rounded-lg transition-colors border border-gray-200"
                              title="Ver detalles completos"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setConfirmDeleteId(order.id)}
                              className="p-2 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition-colors border border-red-100"
                              title="Eliminar pedido"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </>
        ) : (
          <>
            {/* Claims Statistics Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-[#5a3c3c]/5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#5a3c3c]/50 font-bold">Total Reclamaciones</p>
                  <h3 className="text-2xl font-serif font-bold text-[#5a3c3c] mt-2">{totalClaims}</h3>
                  <p className="text-[10px] text-[#81b896] mt-1 font-semibold">Registros recibidos en total</p>
                </div>
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#81b896]">
                  <BookOpen className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-[#5a3c3c]/5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#5a3c3c]/50 font-bold">Pendientes</p>
                  <h3 className="text-2xl font-serif font-bold text-amber-600 mt-2">{pendingClaims}</h3>
                  <p className="text-[10px] text-amber-500 mt-1 font-semibold">Requieren atención urgente</p>
                </div>
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                  <AlertCircle className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-[#5a3c3c]/5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#5a3c3c]/50 font-bold">Atendidos</p>
                  <h3 className="text-2xl font-serif font-bold text-teal-600 mt-2">{resolvedClaims}</h3>
                  <p className="text-[10px] text-teal-500 mt-1 font-semibold">Cerrados formalmente</p>
                </div>
                <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600">
                  <CheckCircle className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Claims Filters and Search Panel */}
            <div className="bg-white p-6 rounded-3xl border border-[#5a3c3c]/5 shadow-sm space-y-4">
              <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
                {/* Search Input */}
                <div className="relative flex-grow max-w-md">
                  <Search className="w-4 h-4 text-[#5a3c3c]/40 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text"
                    value={claimSearchQuery}
                    onChange={(e) => setClaimSearchQuery(e.target.value)}
                    placeholder="Buscar por cliente, documento, celular o ID de reclamo..."
                    className="w-full bg-[#5a3c3c]/5 border border-[#5a3c3c]/10 rounded-2xl pl-11 pr-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#81b896] focus:bg-white transition-all text-[#5a3c3c]"
                  />
                </div>

                {/* Filter selectors */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-[#5a3c3c]/5 px-3 py-2 rounded-xl border border-[#5a3c3c]/10">
                    <Filter className="w-3.5 h-3.5 text-[#5a3c3c]/60" />
                    <span className="text-[10px] uppercase font-bold text-[#5a3c3c]/60">Tipo:</span>
                    <select 
                      value={claimTypeFilter}
                      onChange={(e) => setClaimTypeFilter(e.target.value)}
                      className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer text-[#5a3c3c]"
                    >
                      <option value="all">Todos los tipos</option>
                      <option value="reclamo">Reclamo</option>
                      <option value="queja">Queja</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 bg-[#5a3c3c]/5 px-3 py-2 rounded-xl border border-[#5a3c3c]/10">
                    <CheckCircle className="w-3.5 h-3.5 text-[#5a3c3c]/60" />
                    <span className="text-[10px] uppercase font-bold text-[#5a3c3c]/60">Estado:</span>
                    <select 
                      value={claimStatusFilter}
                      onChange={(e) => setClaimStatusFilter(e.target.value)}
                      className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer text-[#5a3c3c]"
                    >
                      <option value="all">Todos los estados</option>
                      <option value="pendiente">Pendientes</option>
                      <option value="atendido">Atendidos</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Claims Table */}
            <div className="bg-white rounded-3xl border border-[#5a3c3c]/5 shadow-sm overflow-hidden">
              {filteredClaims.length === 0 ? (
                <div className="p-16 text-center text-[#5a3c3c]/40 space-y-3">
                  <BookOpen className="w-12 h-12 text-[#81b896] mx-auto animate-bounce" />
                  <p className="font-serif italic text-lg text-[#5a3c3c]">No se encontraron reclamaciones</p>
                  <p className="text-xs text-gray-400">No hay reclamos que coincidan con los filtros aplicados.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#5a3c3c]/5 border-b border-[#5a3c3c]/5 text-[10px] uppercase tracking-widest text-[#5a3c3c]/60 font-bold">
                        <th className="px-6 py-4 text-left">Código Reclamo</th>
                        <th className="px-6 py-4 text-left">Fecha</th>
                        <th className="px-6 py-4 text-left">Consumidor</th>
                        <th className="px-6 py-4 text-left">Tipo</th>
                        <th className="px-6 py-4 text-left">Bien Contratado</th>
                        <th className="px-6 py-4 text-center">Estado</th>
                        <th className="px-6 py-4 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#5a3c3c]/5 text-sm text-[#5a3c3c]">
                      {filteredClaims.map((claim) => {
                        return (
                          <tr 
                            key={claim.id}
                            className="hover:bg-[#5a3c3c]/2 transition-colors cursor-pointer group"
                            onClick={() => setSelectedClaim(claim)}
                          >
                            {/* ID */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-gray-900 group-hover:text-[#81b896] transition-colors">{claim.id}</span>
                                <button 
                                  onClick={(e) => handleCopyId(claim.id, e)}
                                  className="p-1 text-gray-400 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-all"
                                  title="Copiar ID"
                                >
                                  {copiedId === claim.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </td>
                            
                            {/* Date */}
                            <td className="px-6 py-4 text-xs font-medium text-gray-500 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3 h-3" />
                                {claim.date}
                              </div>
                            </td>

                            {/* Claimant */}
                            <td className="px-6 py-4">
                              <div className="font-semibold text-gray-900 leading-tight">{claim.name}</div>
                              <div className="text-xs text-gray-500 mt-0.5">DNI: {claim.dni}</div>
                            </td>

                            {/* Type */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              {claim.claimType === "reclamo" ? (
                                <span className="text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 rounded-full px-2.5 py-1">
                                  📙 Reclamo
                                </span>
                              ) : (
                                <span className="text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200 rounded-full px-2.5 py-1">
                                  📘 Queja
                                </span>
                              )}
                            </td>

                            {/* Contracted Item */}
                            <td className="px-6 py-4 max-w-xs truncate">
                              <div className="font-medium text-gray-900 truncate">{claim.itemDescription}</div>
                              <div className="text-[10px] text-gray-400 mt-0.5 capitalize">{claim.itemType} {claim.itemAmount ? `• S/ ${parseFloat(claim.itemAmount).toFixed(2)}` : ""}</div>
                            </td>

                            {/* Status badge */}
                            <td className="px-6 py-4 text-center whitespace-nowrap">
                              {claim.status === "atendido" ? (
                                <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-emerald-100 text-emerald-800 border-emerald-200">
                                  Atendido
                                </span>
                              ) : (
                                <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-amber-100 text-amber-800 border-amber-200">
                                  Pendiente
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-2">
                                <button 
                                  onClick={() => setSelectedClaim(claim)}
                                  className="p-2 hover:bg-gray-100 text-gray-600 hover:text-gray-900 rounded-lg transition-colors border border-gray-200"
                                  title="Ver reclamo completo"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => setConfirmDeleteClaimId(claim.id)}
                                  className="p-2 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition-colors border border-red-100"
                                  title="Eliminar reclamo"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Delete Confirmation Overlay */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-gray-100 text-center space-y-6"
            >
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-100">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-serif text-lg font-bold text-gray-900">¿Eliminar este pedido?</h4>
                <p className="text-xs text-gray-500 mt-2">Esta acción es irreversible y borrará permanentemente los datos del pedido <strong>{confirmDeleteId}</strong> de la base de datos de Firestore.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmDeleteId(null)}
                  className="w-1/2 bg-gray-100 text-gray-700 font-bold uppercase tracking-wider text-[10px] py-4 rounded-full hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => handleDeleteOrder(confirmDeleteId)}
                  className="w-1/2 bg-red-600 text-white font-bold uppercase tracking-wider text-[10px] py-4 rounded-full hover:bg-red-700 transition-colors shadow-md"
                >
                  Confirmar Borrado
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Screenshot Expandable Modal */}
      <AnimatePresence>
        {showScreenshotModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[2200] flex items-center justify-center p-4" onClick={() => setShowScreenshotModal(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-2xl w-full rounded-2xl overflow-hidden bg-white shadow-2xl p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowScreenshotModal(null)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/90 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg transition-colors cursor-pointer z-10"
              >
                ✕
              </button>
              <img 
                src={showScreenshotModal} 
                className="w-full h-auto max-h-[80vh] object-contain rounded-xl bg-gray-50"
                alt="Constancia de Pago Ampliada" 
              />
              <div className="p-4 bg-white text-center">
                <p className="text-xs font-semibold text-gray-700">Constancia de Transferencia / Yape / Plin provista por el cliente</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Order Details Modal Overlay */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2100] flex items-center justify-end p-0">
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.4 }}
              className="bg-[#fdfcf8] w-full max-w-xl h-full shadow-2xl flex flex-col p-8 md:p-10 text-left overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-gray-200 pb-6 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-serif italic text-[#5a3c3c] font-semibold">{selectedOrder.id}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusLabelAndColor(selectedOrder.status).bg}`}>
                      {getStatusLabelAndColor(selectedOrder.status).label}
                    </span>
                  </div>
                  <p className="text-[10px] uppercase tracking-widest text-[#5a3c3c]/50 mt-1">Registrado el {selectedOrder.date}</p>
                </div>
                
                <button 
                  onClick={() => setSelectedOrder(null)} 
                  className="p-2.5 hover:bg-gray-100 rounded-full transition-colors border border-gray-200 text-gray-500"
                >
                  ✕
                </button>
              </div>

              {/* Order content */}
              <div className="flex-grow space-y-8 pb-10">
                {/* Change Status Controls */}
                <div className="bg-white p-5 rounded-2xl border border-[#5a3c3c]/10 shadow-sm space-y-3">
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5a3c3c]/60">Gestionar Estado de Pedido</label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button 
                      onClick={() => handleStatusChange(selectedOrder.id, "pending")}
                      disabled={isUpdating}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${selectedOrder.status === "pending" ? "bg-amber-600 text-white border-amber-600 shadow-sm" : "bg-white hover:bg-amber-50 text-amber-700 border-amber-200"}`}
                    >
                      Por Confirmar
                    </button>
                    <button 
                      onClick={() => handleStatusChange(selectedOrder.id, "paid")}
                      disabled={isUpdating}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${selectedOrder.status === "paid" ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" : "bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-200"}`}
                    >
                      Pagado
                    </button>
                    <button 
                      onClick={() => handleStatusChange(selectedOrder.id, "preparing")}
                      disabled={isUpdating}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${selectedOrder.status === "preparing" ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white hover:bg-blue-50 text-blue-700 border-blue-200"}`}
                    >
                      En Preparación
                    </button>
                    <button 
                      onClick={() => handleStatusChange(selectedOrder.id, "shipped")}
                      disabled={isUpdating}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${selectedOrder.status === "shipped" ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : "bg-white hover:bg-indigo-50 text-indigo-700 border-indigo-200"}`}
                    >
                      Enviado (Ruta)
                    </button>
                    <button 
                      onClick={() => handleStatusChange(selectedOrder.id, "delivered")}
                      disabled={isUpdating}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${selectedOrder.status === "delivered" ? "bg-teal-600 text-white border-teal-600 shadow-sm" : "bg-white hover:bg-teal-50 text-teal-700 border-teal-200"}`}
                    >
                      Entregado
                    </button>
                    <button 
                      onClick={() => handleStatusChange(selectedOrder.id, "cancelled")}
                      disabled={isUpdating}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${selectedOrder.status === "cancelled" ? "bg-rose-600 text-white border-rose-600 shadow-sm" : "bg-white hover:bg-rose-50 text-rose-700 border-rose-200"}`}
                    >
                      Cancelado
                    </button>
                  </div>
                </div>

                {/* Customer info card */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                  <h4 className="font-serif italic font-bold text-base text-[#5a3c3c] border-b border-gray-100 pb-2">Información del Cliente</h4>
                  
                  <div className="space-y-3.5 text-xs text-gray-700">
                    <div className="flex items-start gap-3">
                      <Eye className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-[10px] uppercase font-bold text-gray-400">Nombre Completo</div>
                        <div className="font-semibold text-gray-900 mt-0.5">{selectedOrder.customerInfo?.name || "No proporcionado"}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-[10px] uppercase font-bold text-gray-400">Teléfono celular</div>
                        <div className="font-semibold text-gray-900 mt-0.5 flex items-center gap-3">
                          {selectedOrder.customerInfo?.phone || "No proporcionado"}
                          {selectedOrder.customerInfo?.phone && (
                            <a 
                              href={`https://wa.me/51${selectedOrder.customerInfo.phone.replace(/\D/g, "")}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 font-sans text-[10px] transition-all"
                            >
                              WhatsApp Chat 💬
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Mail className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-[10px] uppercase font-bold text-gray-400">Email</div>
                        <div className="font-semibold text-gray-900 mt-0.5">
                          {selectedOrder.customerInfo?.email ? (
                            <a href={`mailto:${selectedOrder.customerInfo.email}`} className="hover:underline text-[#81b896]">{selectedOrder.customerInfo.email}</a>
                          ) : (
                            "No proporcionado"
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-[10px] uppercase font-bold text-gray-400">Dirección de Entrega</div>
                        <div className="font-semibold text-gray-900 mt-0.5">{selectedOrder.customerInfo?.address || "No proporcionada"}</div>
                      </div>
                    </div>

                    {selectedOrder.customerInfo?.notes && (
                      <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/50">
                        <span className="block text-[10px] uppercase font-bold text-amber-600 mb-1">Notas de Coordinación / Dirección:</span>
                        <p className="font-sans italic text-amber-950 font-medium">"{selectedOrder.customerInfo.notes}"</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items and Financial Breakdown */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                  <h4 className="font-serif italic font-bold text-base text-[#5a3c3c] border-b border-gray-100 pb-2">Artículos del Pedido</h4>
                  
                  <div className="divide-y divide-gray-100">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-12 bg-gray-50 border border-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-xs">{item.name}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">S/ {item.price.toFixed(2)} c/u</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-semibold text-gray-500">x{item.quantity}</div>
                          <div className="text-xs font-bold text-gray-900 mt-0.5">S/ {(item.price * item.quantity).toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-dashed border-gray-200 pt-4 space-y-2 text-xs">
                    <div className="flex justify-between text-gray-500">
                      <span>Costo de Envío ({selectedOrder.customerInfo?.deliveryType === "delivery" ? selectedOrder.customerInfo?.district || "Delivery" : "Recojo en Tienda"}):</span>
                      <span className="font-semibold">{selectedOrder.customerInfo?.deliveryType === "delivery" ? `S/ ${Number(selectedOrder.customerInfo?.shippingFee || 0).toFixed(2)}` : "Gratis"}</span>
                    </div>
                    <div className="flex justify-between text-[#5a3c3c] font-bold text-base border-t border-gray-100 pt-3">
                      <span>Inversión Total:</span>
                      <span className="font-serif text-lg">S/ {selectedOrder.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Proof of Payment Screenshot */}
                {selectedOrder.paymentMethod !== "culqi" && (
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                      <h4 className="font-serif italic font-bold text-base text-[#5a3c3c]">Constancia de Pago (Manual)</h4>
                      <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                        {selectedOrder.paymentMethod}
                      </span>
                    </div>

                    {selectedOrder.screenshot ? (
                      <div className="space-y-3">
                        <div 
                          onClick={() => setShowScreenshotModal(selectedOrder.screenshot || null)}
                          className="relative h-48 border border-gray-200 rounded-xl overflow-hidden cursor-zoom-in group bg-gray-50"
                        >
                          <img src={selectedOrder.screenshot} className="w-full h-full object-cover" alt="Constancia de pago" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                            <Eye className="w-4 h-4" /> Ampliar Constancia
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-400 text-center">Haz clic en la imagen para ampliarla y auditar la transferencia.</p>
                      </div>
                    ) : (
                      <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-400 space-y-2">
                        <FileImage className="w-8 h-8 mx-auto" />
                        <p className="text-xs font-medium">No se cargó ninguna constancia visual para este pedido.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Claim Confirmation Overlay */}
      <AnimatePresence>
        {confirmDeleteClaimId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-gray-100 text-center space-y-6"
            >
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-100">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-serif text-lg font-bold text-gray-900">¿Eliminar esta reclamación?</h4>
                <p className="text-xs text-gray-500 mt-2">Esta acción es irreversible y borrará permanentemente los datos del registro <strong>{confirmDeleteClaimId}</strong> de la base de datos de Firestore.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmDeleteClaimId(null)}
                  className="w-1/2 bg-gray-100 text-gray-700 font-bold uppercase tracking-wider text-[10px] py-4 rounded-full hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => handleDeleteClaim(confirmDeleteClaimId)}
                  className="w-1/2 bg-red-600 text-white font-bold uppercase tracking-wider text-[10px] py-4 rounded-full hover:bg-red-700 transition-colors shadow-md"
                >
                  Confirmar Borrado
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Claim Details Modal Overlay */}
      <AnimatePresence>
        {selectedClaim && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex justify-end">
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-[#fdfcf8] w-full max-w-2xl h-full shadow-2xl flex flex-col overflow-hidden text-left border-l border-gray-100"
            >
              {/* Header */}
              <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-gray-400">Reclamación ID</span>
                    <span className="bg-[#5a3c3c]/5 text-[#5a3c3c] font-mono text-sm font-bold px-3 py-1 rounded-lg">
                      {selectedClaim.id}
                    </span>
                    {selectedClaim.claimType === "reclamo" ? (
                      <span className="text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 rounded-full px-2.5 py-0.5">
                        📙 Reclamo
                      </span>
                    ) : (
                      <span className="text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200 rounded-full px-2.5 py-0.5">
                        📘 Queja
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Registrado el {selectedClaim.date}</p>
                </div>
                <button 
                  onClick={() => setSelectedClaim(null)}
                  className="p-2.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition-colors border border-gray-200"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Action Buttons Bar */}
              <div className="bg-[#5a3c3c]/2 px-6 py-4 border-b border-[#5a3c3c]/5 flex flex-wrap gap-3 items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 font-semibold">Estado de la reclamación:</span>
                  <select 
                    value={selectedClaim.status}
                    onChange={(e) => handleClaimStatusChange(selectedClaim.id, e.target.value as Claim["status"])}
                    disabled={isUpdatingClaim}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold border focus:outline-none cursor-pointer ${
                      selectedClaim.status === "atendido" 
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200" 
                        : "bg-amber-100 text-amber-800 border-amber-200"
                    }`}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="atendido">Atendido</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  {/* WhatsApp contact link */}
                  <a 
                    href={`https://wa.me/51${selectedClaim.phone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#25d366] hover:bg-[#128c7e] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    <Phone className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                  <button 
                    onClick={() => setConfirmDeleteClaimId(selectedClaim.id)}
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-rose-200/40 rounded-xl transition-all"
                    title="Eliminar registro"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Main Content Areas */}
              <div className="flex-grow overflow-y-auto p-6 space-y-6">
                
                {/* Section 1: Customer (Consumidor) Details */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                  <h4 className="font-serif italic font-bold text-base text-[#5a3c3c] border-b border-gray-100 pb-2">
                    1. Identificación del Consumidor Reclamante
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-gray-400 font-semibold uppercase tracking-wider text-[9px]">Nombre Completo / Razón Social</p>
                      <p className="font-bold text-gray-900 mt-1">{selectedClaim.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-semibold uppercase tracking-wider text-[9px]">Documento de Identidad (DNI/CE)</p>
                      <p className="font-bold text-gray-900 mt-1">{selectedClaim.dni}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-semibold uppercase tracking-wider text-[9px]">Teléfono Celular</p>
                      <p className="font-bold text-gray-900 mt-1 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#5a3c3c]/40" /> {selectedClaim.phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-semibold uppercase tracking-wider text-[9px]">Correo Electrónico</p>
                      <p className="font-bold text-gray-900 mt-1 flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-[#5a3c3c]/40" /> {selectedClaim.email}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-gray-400 font-semibold uppercase tracking-wider text-[9px]">Domicilio</p>
                      <p className="font-bold text-gray-900 mt-1 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#5a3c3c]/40" /> {selectedClaim.address}
                      </p>
                    </div>
                    {selectedClaim.isMinor && (
                      <div className="sm:col-span-2 bg-amber-50/50 p-3 rounded-xl border border-amber-100 space-y-2">
                        <p className="text-amber-800 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                          ⚠️ Consumidor Menor de Edad
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#5a3c3c]">
                          <div>
                            <span className="font-semibold text-gray-500">Nombre del Padre/Madre o Tutor:</span>
                            <p className="font-bold">{selectedClaim.parentName}</p>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-500">DNI del Tutor:</span>
                            <p className="font-bold">{selectedClaim.parentDni}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 2: Contracted Item (Bien Contratado) */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                  <h4 className="font-serif italic font-bold text-base text-[#5a3c3c] border-b border-gray-100 pb-2">
                    2. Detalle del Bien Contratado
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-gray-400 font-semibold uppercase tracking-wider text-[9px]">Tipo de Bien</p>
                      <p className="font-bold text-gray-900 mt-1 capitalize">{selectedClaim.itemType === "producto" ? "📦 Producto (Muebles / Espejos)" : "🛠️ Servicio"}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-semibold uppercase tracking-wider text-[9px]">Monto Reclamado</p>
                      <p className="font-serif font-bold text-gray-900 mt-1 text-sm">
                        {selectedClaim.itemAmount ? `S/ ${parseFloat(selectedClaim.itemAmount).toFixed(2)}` : "No especificado"}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-gray-400 font-semibold uppercase tracking-wider text-[9px]">Descripción Breve del Producto/Servicio</p>
                      <p className="font-medium text-gray-700 mt-1 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        {selectedClaim.itemDescription}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 3: Claim/Complaint details (Detalle de Reclamación) */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                  <h4 className="font-serif italic font-bold text-base text-[#5a3c3c] border-b border-gray-100 pb-2">
                    3. Detalle de la Reclamación y Pedido del Consumidor
                  </h4>
                  <div className="space-y-4 text-xs">
                    <div>
                      <p className="text-gray-400 font-semibold uppercase tracking-wider text-[9px]">Hechos expuestos por el consumidor</p>
                      <p className="font-medium text-gray-700 mt-1.5 whitespace-pre-line bg-gray-50 p-4 rounded-xl border border-gray-100 leading-relaxed">
                        {selectedClaim.details}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-semibold uppercase tracking-wider text-[9px]">Pedido Concreto (Acción solicitada por el cliente)</p>
                      <p className="font-medium text-gray-700 mt-1.5 whitespace-pre-line bg-emerald-50/20 p-4 rounded-xl border border-emerald-100/40 leading-relaxed text-[#5a3c3c]">
                        {selectedClaim.requestedAction}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
