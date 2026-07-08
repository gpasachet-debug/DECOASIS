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
  serverTimestamp 
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
  status: "pending" | "paid" | "preparing" | "shipped" | "delivered" | "cancelled";
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
export async function updateOrderStatus(orderId: string, status: Order["status"]) {
  try {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, {
      status,
      updatedAt: serverTimestamp()
    });
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

