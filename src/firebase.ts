import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit,
  serverTimestamp,
  runTransaction 
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");

export { db };

export interface Order {
  id: string;
  items: any[];
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
    notes?: string;
    deliveryType: "pickup" | "delivery";
    district?: string;
    shippingFee?: number;
  };
  paymentMethod: "culqi" | "plin" | "transfer";
  transactionCode?: string;
  screenshot?: string | null;
  total: number;
  date: string;
  timestamp: any;
  status: "pending" | "paid" | "preparing" | "shipped" | "delivered" | "cancelled" | "rejected";
  rejectionReason?: string;
  simulated?: boolean;
}

// Helper recursively removing undefined values from object for Firestore compatibility
function sanitizeForFirestore(obj: any): any {
  if (obj === undefined) {
    return null;
  }
  if (obj === null) {
    return null;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore);
  }
  if (typeof obj === "object") {
    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (val !== undefined) {
          sanitized[key] = sanitizeForFirestore(val);
        }
      }
    }
    return sanitized;
  }
  return obj;
}

// Save or overwrite an order in Firestore
export async function saveOrderToFirestore(orderData: any) {
  try {
    const orderId = orderData.id;
    const orderRef = doc(db, "orders", orderId);
    
    // Map status nicely if not defined or completed
    let initialStatus = orderData.status;
    if (initialStatus === "completed") {
      initialStatus = "paid";
    }
    if (!initialStatus) {
      initialStatus = orderData.paymentMethod === "culqi" ? "paid" : "pending";
    }

    const docData = sanitizeForFirestore({
      ...orderData,
      status: initialStatus,
      timestamp: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log(`[Firebase] Guardando pedido ${orderId} en Firestore...`);
    await setDoc(orderRef, docData, { merge: true });
    console.log(`[Firebase] Pedido ${orderId} guardado exitosamente.`);
    return { success: true };
  } catch (error) {
    console.error("[Firebase] Error al guardar el pedido:", error);
    throw error;
  }
}

// Update the status of an order
export async function updateOrderStatus(orderId: string, status: Order["status"], rejectionReason?: string) {
  try {
    const orderRef = doc(db, "orders", orderId);
    const updates: any = {
      status,
      updatedAt: serverTimestamp()
    };
    if (rejectionReason !== undefined) {
      updates.rejectionReason = rejectionReason;
    }
    await updateDoc(orderRef, updates);
    console.log(`[Firebase] Estado del pedido ${orderId} actualizado a: ${status}`);
    return { success: true };
  } catch (error) {
    console.error("[Firebase] Error al actualizar estado del pedido:", error);
    throw error;
  }
}

// Delete an order (Admin only)
export async function deleteOrderFromFirestore(orderId: string) {
  try {
    const orderRef = doc(db, "orders", orderId);
    await deleteDoc(orderRef);
    console.log(`[Firebase] Pedido ${orderId} eliminado de Firestore.`);
    return { success: true };
  } catch (error) {
    console.error("[Firebase] Error al eliminar el pedido:", error);
    throw error;
  }
}

// Subscribe to orders in real-time
export function subscribeToOrders(onUpdate: (orders: Order[]) => void) {
  const ordersCollection = collection(db, "orders");
  const q = query(ordersCollection, orderBy("timestamp", "desc"), limit(100));
  
  return onSnapshot(q, (snapshot) => {
    const ordersList: Order[] = [];
    snapshot.forEach((doc) => {
      ordersList.push({ id: doc.id, ...doc.data() } as Order);
    });
    onUpdate(ordersList);
  }, (error) => {
    console.error("[Firebase] Error al escuchar pedidos en tiempo real:", error);
  });
}

export interface Claim {
  id: string;
  name: string;
  dni: string;
  phone: string;
  email: string;
  address: string;
  isMinor: boolean;
  parentName?: string;
  parentDni?: string;
  itemType: "producto" | "servicio";
  itemDescription: string;
  itemAmount?: string;
  claimType: "reclamo" | "queja";
  claimDetails: string;
  claimRequest: string;
  details?: string;
  requestedAction?: string;
  timestamp: any;
  date: string;
  status: "pendiente" | "atendido";
}

// Subscribe to claims in real-time
export function subscribeToClaims(onUpdate: (claims: Claim[]) => void) {
  const claimsCollection = collection(db, "claims");
  const q = query(claimsCollection, orderBy("timestamp", "desc"), limit(100));
  
  return onSnapshot(q, (snapshot) => {
    const claimsList: Claim[] = [];
    snapshot.forEach((doc) => {
      claimsList.push({ id: doc.id, ...doc.data() } as Claim);
    });
    onUpdate(claimsList);
  }, (error) => {
    console.error("[Firebase] Error al escuchar reclamos en tiempo real:", error);
  });
}

// Update the status of a claim
export async function updateClaimStatus(claimId: string, status: Claim["status"]) {
  try {
    const claimRef = doc(db, "claims", claimId);
    await updateDoc(claimRef, {
      status,
      updatedAt: serverTimestamp()
    });
    console.log(`[Firebase] Estado del reclamo ${claimId} actualizado a: ${status}`);
    return { success: true };
  } catch (error) {
    console.error("[Firebase] Error al actualizar estado del reclamo:", error);
    throw error;
  }
}

// Delete a claim from Firestore (Admin only)
export async function deleteClaimFromFirestore(claimId: string) {
  try {
    const claimRef = doc(db, "claims", claimId);
    await deleteDoc(claimRef);
    console.log(`[Firebase] Reclamo ${claimId} eliminado de Firestore.`);
    return { success: true };
  } catch (error) {
    console.error("[Firebase] Error al eliminar el reclamo:", error);
    throw error;
  }
}

// Update stock in Firestore
export async function updateProductStock(productId: number, stock: number) {
  try {
    const stockRef = doc(db, "inventory", String(productId));
    await setDoc(stockRef, { stock }, { merge: true });
    console.log(`[Firebase] Stock para producto ${productId} actualizado a: ${stock}`);
    return { success: true };
  } catch (error) {
    console.error("[Firebase] Error al actualizar stock:", error);
    throw error;
  }
}

// Subscribe to inventory in real-time
export function subscribeToInventory(onUpdate: (inventory: { [key: number]: number }) => void) {
  const inventoryCollection = collection(db, "inventory");
  
  return onSnapshot(inventoryCollection, (snapshot) => {
    const stockMap: { [key: number]: number } = {};
    snapshot.forEach((doc) => {
      const id = Number(doc.id);
      if (!isNaN(id)) {
        stockMap[id] = doc.data().stock ?? 0;
      }
    });
    onUpdate(stockMap);
  }, (error) => {
    console.error("[Firebase] Error al escuchar inventario en tiempo real:", error);
  });
}

// Deduct stock for items in a completed order
export async function deductOrderStock(orderId: string, items: any[]) {
  try {
    const orderRef = doc(db, "orders", orderId);
    const orderDoc = await getDoc(orderRef);
    
    if (orderDoc.exists() && orderDoc.data().stockDeducted === true) {
      console.log(`[Firebase] El stock para el pedido ${orderId} ya fue deducido previamente.`);
      return { success: true };
    }

    console.log(`[Firebase] Deduciendo stock para los artículos del pedido ${orderId}...`);
    for (const item of items) {
      const productId = item.id;
      const quantity = item.quantity;
      const stockRef = doc(db, "inventory", String(productId));
      
      await runTransaction(db, async (transaction) => {
        const stockDoc = await transaction.get(stockRef);
        if (stockDoc.exists()) {
          const currentStock = stockDoc.data().stock ?? 0;
          const newStock = Math.max(0, currentStock - quantity);
          transaction.update(stockRef, { stock: newStock });
          console.log(`[Firebase] Stock de producto ${productId} actualizado de ${currentStock} a ${newStock}`);
        } else {
          const defaultStart = 10;
          const newStock = Math.max(0, defaultStart - quantity);
          transaction.set(stockRef, { stock: newStock });
          console.log(`[Firebase] No se encontró doc de stock para ${productId}. Iniciado con ${defaultStart} y reducido a ${newStock}`);
        }
      });
    }

    await updateDoc(orderRef, { stockDeducted: true });
    console.log(`[Firebase] Pedido ${orderId} marcado como stockDeducted: true.`);
    return { success: true };
  } catch (error) {
    console.error("[Firebase] Error al deducir stock para el pedido:", error);
  }
}

