import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dns from "dns";

// Force IPv4 first to prevent ENETUNREACH errors on environments without IPv6 support (e.g., Render, Cloud Run)
dns.setDefaultResultOrder("ipv4first");

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json());

// Helper function to send email notification to the merchant and CC the customer
async function sendOrderEmail(orderId: string, paymentMethod: string, amount: number, items: any[], customerInfo: any) {
  const emailUser = process.env.EMAIL_USER || "gpasachet@gmail.com";
  const emailPass = process.env.EMAIL_PASS;

  console.log(`[Email] Preparando correo de notificación para ${emailUser} del pedido ${orderId}...`);

  const itemsHtml = items.map(item => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 10px 0; font-family: sans-serif; font-size: 14px; color: #333;">${item.name}</td>
      <td style="padding: 10px 0; text-align: center; font-family: sans-serif; font-size: 14px; color: #333;">${item.quantity}</td>
      <td style="padding: 10px 0; text-align: right; font-family: sans-serif; font-size: 14px; color: #333; font-weight: bold;">S/ ${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join("");

  const deliveryTypeLabel = customerInfo.deliveryType === "delivery" ? "🛵 Delivery a Domicilio" : "🏪 Recojo en Tienda";
  const shippingFeeText = customerInfo.deliveryType === "delivery" ? `S/ ${Number(customerInfo.shippingFee || 0).toFixed(2)}` : "Gratis";
  const districtText = customerInfo.district ? customerInfo.district : "N/A";

  const htmlContent = `
    <div style="background-color: #fcfbf7; padding: 40px 20px; font-family: 'Georgia', serif; color: #5a3c3c; line-height: 1.6;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; border: 1px solid rgba(90,60,60,0.1); box-shadow: 0 10px 30px rgba(90,60,60,0.05); overflow: hidden;">
        <!-- Header -->
        <div style="background-color: #81b896; padding: 40px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: normal; font-style: italic; font-family: 'Georgia', serif;">Decoasis Perú</h1>
          <p style="color: rgba(255,255,255,0.8); font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin: 10px 0 0 0; font-family: sans-serif;">NUEVO PEDIDO RECIBIDO</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px;">
          <p style="font-size: 16px; margin-top: 0; font-family: 'Georgia', serif; color: #5a3c3c;">¡Hola Decoasis! Has recibido un nuevo pedido a través del portal de compras.</p>
          
          <!-- Order Badge -->
          <div style="background-color: #f4f8f5; border-left: 4px solid #81b896; padding: 15px 20px; border-radius: 4px 12px 12px 4px; margin: 25px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="font-family: sans-serif; font-size: 11px; color: rgba(90,60,60,0.6); text-transform: uppercase; letter-spacing: 1px; padding: 2px 0;">Código de Pedido</td>
                <td style="font-family: sans-serif; font-size: 11px; color: rgba(90,60,60,0.6); text-transform: uppercase; letter-spacing: 1px; padding: 2px 0; text-align: right;">Método de Pago</td>
              </tr>
              <tr>
                <td style="font-family: monospace; font-size: 16px; font-weight: bold; color: #5a3c3c; padding: 2px 0;">${orderId}</td>
                <td style="font-family: sans-serif; font-size: 14px; font-weight: bold; color: #5a3c3c; padding: 2px 0; text-align: right; text-transform: uppercase;">${paymentMethod === 'culqi' ? 'TARJETA/YAPE (CULQI)' : paymentMethod === 'plin' ? 'PLIN' : 'TRANSFERENCIA'}</td>
              </tr>
            </table>
          </div>

          <!-- Products Table -->
          <h3 style="font-family: 'Georgia', serif; font-style: italic; border-bottom: 2px solid rgba(90,60,60,0.1); padding-bottom: 8px; margin-top: 30px; font-size: 18px; color: #5a3c3c;">Artículos Adquiridos</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
              <tr style="border-bottom: 2px solid #eee;">
                <th style="text-align: left; padding: 10px 0; font-family: sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: rgba(90,60,60,0.6);">Producto</th>
                <th style="text-align: center; padding: 10px 0; font-family: sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: rgba(90,60,60,0.6); width: 60px;">Cant</th>
                <th style="text-align: right; padding: 10px 0; font-family: sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: rgba(90,60,60,0.6); width: 100px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Totals -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 35px; background-color: rgba(90,60,60,0.03); border-radius: 12px; padding: 15px;">
            <tr>
              <td style="padding: 12px 15px; font-family: sans-serif; font-size: 13px; color: rgba(90,60,60,0.6);">Subtotal de Productos:</td>
              <td style="padding: 12px 15px; text-align: right; font-family: sans-serif; font-size: 13px; color: #333; font-weight: 500;">S/ ${(amount - Number(customerInfo.shippingFee || 0)).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 15px; font-family: sans-serif; font-size: 13px; color: rgba(90,60,60,0.6);">Método de Entrega:</td>
              <td style="padding: 6px 15px; text-align: right; font-family: sans-serif; font-size: 13px; color: #333; font-weight: bold;">${deliveryTypeLabel}</td>
            </tr>
            ${customerInfo.deliveryType === "delivery" ? `
            <tr>
              <td style="padding: 6px 15px; font-family: sans-serif; font-size: 13px; color: rgba(90,60,60,0.6);">Distrito de Envío:</td>
              <td style="padding: 6px 15px; text-align: right; font-family: sans-serif; font-size: 13px; color: #333;">${districtText}</td>
            </tr>
            <tr>
              <td style="padding: 6px 15px; font-family: sans-serif; font-size: 13px; color: rgba(90,60,60,0.6);">Costo de Envío:</td>
              <td style="padding: 6px 15px; text-align: right; font-family: sans-serif; font-size: 13px; color: #333;">S/ ${Number(customerInfo.shippingFee || 0).toFixed(2)}</td>
            </tr>
            ` : ""}
            <tr style="border-top: 1px dashed rgba(90,60,60,0.15);">
              <td style="padding: 15px 15px; font-family: sans-serif; font-size: 14px; font-weight: bold; color: #5a3c3c;">Total del Pedido:</td>
              <td style="padding: 15px 15px; text-align: right; font-family: sans-serif; font-size: 18px; font-weight: bold; color: #81b896;">S/ ${amount.toFixed(2)}</td>
            </tr>
          </table>

          <!-- Customer Details -->
          <h3 style="font-family: 'Georgia', serif; font-style: italic; border-bottom: 2px solid rgba(90,60,60,0.1); padding-bottom: 8px; margin-top: 30px; font-size: 18px; color: #5a3c3c;">Datos del Cliente</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 6px 0; font-family: sans-serif; font-size: 13px; color: rgba(90,60,60,0.6); width: 120px; font-weight: bold;">Nombre:</td>
              <td style="padding: 6px 0; font-family: sans-serif; font-size: 13px; color: #333;">${customerInfo.name}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-family: sans-serif; font-size: 13px; color: rgba(90,60,60,0.6); font-weight: bold;">Teléfono:</td>
              <td style="padding: 6px 0; font-family: sans-serif; font-size: 13px; color: #333;">
                <a href="tel:${customerInfo.phone}" style="color: #81b896; text-decoration: none; font-weight: bold;">${customerInfo.phone}</a>
                &nbsp;|&nbsp;
                <a href="https://wa.me/51${customerInfo.phone.replace(/\D/g, '')}" style="color: #25D366; text-decoration: none; font-weight: bold; font-family: sans-serif; font-size: 12px;">Chat WhatsApp 💬</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-family: sans-serif; font-size: 13px; color: rgba(90,60,60,0.6); font-weight: bold;">Email:</td>
              <td style="padding: 6px 0; font-family: sans-serif; font-size: 13px; color: #333;"><a href="mailto:${customerInfo.email}" style="color: #5a3c3c; text-decoration: none;">${customerInfo.email}</a></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-family: sans-serif; font-size: 13px; color: rgba(90,60,60,0.6); font-weight: bold;">Dirección:</td>
              <td style="padding: 6px 0; font-family: sans-serif; font-size: 13px; color: #333;">${customerInfo.address}</td>
            </tr>
            ${customerInfo.notes ? `
            <tr>
              <td style="padding: 6px 0; font-family: sans-serif; font-size: 13px; color: rgba(90,60,60,0.6); font-weight: bold;">Notas de Entrega:</td>
              <td style="padding: 6px 0; font-family: sans-serif; font-size: 13px; color: #333; font-style: italic;">"${customerInfo.notes}"</td>
            </tr>
            ` : ""}
          </table>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #5a3c3c; padding: 25px; text-align: center; font-family: sans-serif; font-size: 11px; color: rgba(255,255,255,0.7); line-height: 1.5;">
          Este es un correo de notificación automática enviado desde el Portal de Ventas de Decoasis Perú.<br />
          Usa el enlace de WhatsApp arriba o llama para coordinar directamente la entrega con el cliente.
        </div>
      </div>
    </div>
  `;

  if (!emailPass) {
    console.warn("[Email Simulation] EMAIL_PASS no está configurada en las variables de entorno (.env). No se puede enviar el correo de producción.");
    console.log(`[Email Simulation] DETALLES DEL CORREO SIMULADO:`);
    console.log(`- De: "Decoasis Perú" <${emailUser}>`);
    console.log(`- Para: ${emailUser}`);
    console.log(`- CC: ${customerInfo.email}`);
    console.log(`- Asunto: 🌿 Nuevo Pedido [${orderId}] - ${deliveryTypeLabel} - total S/ ${amount.toFixed(2)}`);
    return { sent: true, simulated: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      family: 4,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    } as any);

    await transporter.sendMail({
      from: `"Decoasis Perú" <${emailUser}>`,
      to: emailUser,
      cc: customerInfo.email,
      subject: `🌿 Nuevo Pedido [${orderId}] - ${deliveryTypeLabel} - total S/ ${amount.toFixed(2)}`,
      html: htmlContent,
    });

    console.log(`[Email] Correo enviado exitosamente a ${emailUser} y CC a ${customerInfo.email}`);
    return { sent: true, simulated: false };
  } catch (err: any) {
    console.error("[Email] Error al enviar correo de notificación:", err);
    return { sent: false, error: err.message };
  }
}


// Helper function to send confirmation email directly to the customer when payment is confirmed (paid)
async function sendPaidConfirmationEmail(orderId: string, total: number, items: any[], customerInfo: any) {
  const emailUser = process.env.EMAIL_USER || "gpasachet@gmail.com";
  const emailPass = process.env.EMAIL_PASS;

  console.log(`[Email] Preparando correo de confirmación de pago para el cliente ${customerInfo.email} del pedido ${orderId}...`);

  const itemsHtml = items.map(item => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 10px 0; font-family: sans-serif; font-size: 14px; color: #333;">${item.name}</td>
      <td style="padding: 10px 0; text-align: center; font-family: sans-serif; font-size: 14px; color: #333;">${item.quantity}</td>
      <td style="padding: 10px 0; text-align: right; font-family: sans-serif; font-size: 14px; color: #333; font-weight: bold;">S/ ${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join("");

  const deliveryTypeLabel = customerInfo.deliveryType === "delivery" ? "🛵 Delivery a Domicilio" : "🏪 Recojo en Tienda";
  const shippingFeeText = customerInfo.deliveryType === "delivery" ? `S/ ${Number(customerInfo.shippingFee || 0).toFixed(2)}` : "Gratis";
  const districtText = customerInfo.district ? customerInfo.district : "N/A";

  const htmlContent = `
    <div style="background-color: #fcfbf7; padding: 40px 20px; font-family: 'Georgia', serif; color: #5a3c3c; line-height: 1.6;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; border: 1px solid rgba(90,60,60,0.1); box-shadow: 0 10px 30px rgba(90,60,60,0.05); overflow: hidden;">
        <!-- Header -->
        <div style="background-color: #81b896; padding: 40px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: normal; font-style: italic; font-family: 'Georgia', serif;">Decoasis Perú</h1>
          <p style="color: rgba(255,255,255,0.8); font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin: 10px 0 0 0; font-family: sans-serif;">PAGO CONFIRMADO</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px;">
          <p style="font-size: 18px; font-weight: bold; margin-top: 0; color: #81b896; font-family: 'Georgia', serif;">¡Hola, ${customerInfo.name}!</p>
          <p style="font-size: 15px; font-family: 'Georgia', serif; color: #5a3c3c; line-height: 1.7;">
            Te confirmamos que hemos recibido tu pago correctamente. Tu pedido con código <strong>${orderId}</strong> ahora está en estado <strong>PAGADO</strong> y su compra ha sido confirmada con éxito.
          </p>
          <p style="font-size: 15px; font-family: 'Georgia', serif; color: #5a3c3c; line-height: 1.7; font-style: italic;">
            ${customerInfo.deliveryType === "delivery" 
              ? "Estamos preparando tus plantas con todo el cariño y cuidado que se merecen para que te lleguen en perfectas condiciones. ¡Pronto estará en camino!"
              : "Estamos preparando tus plantas con todo el cariño y cuidado que se merecen para que te esperen en perfectas condiciones. ¡Te esperaremos listos para que recojas tu pedido a partir de mañana!"
            }
          </p>
          
          <!-- Order Badge -->
          <div style="background-color: #f4f8f5; border-left: 4px solid #81b896; padding: 15px 20px; border-radius: 4px 12px 12px 4px; margin: 25px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="font-family: sans-serif; font-size: 11px; color: rgba(90,60,60,0.6); text-transform: uppercase; letter-spacing: 1px; padding: 2px 0;">Código de Pedido</td>
                <td style="font-family: sans-serif; font-size: 11px; color: rgba(90,60,60,0.6); text-transform: uppercase; letter-spacing: 1px; padding: 2px 0; text-align: right;">Estado de Pedido</td>
              </tr>
              <tr>
                <td style="font-family: monospace; font-size: 16px; font-weight: bold; color: #5a3c3c; padding: 2px 0;">${orderId}</td>
                <td style="font-family: sans-serif; font-size: 14px; font-weight: bold; color: #81b896; padding: 2px 0; text-align: right; text-transform: uppercase;">PAGADO / CONFIRMADO</td>
              </tr>
            </table>
          </div>

          <!-- Products Table -->
          <h3 style="font-family: 'Georgia', serif; font-style: italic; border-bottom: 2px solid rgba(90,60,60,0.1); padding-bottom: 8px; margin-top: 30px; font-size: 18px; color: #5a3c3c;">Artículos en tu Pedido</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
              <tr style="border-bottom: 2px solid #eee;">
                <th style="text-align: left; padding: 10px 0; font-family: sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: rgba(90,60,60,0.6);">Producto</th>
                <th style="text-align: center; padding: 10px 0; font-family: sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: rgba(90,60,60,0.6); width: 60px;">Cant</th>
                <th style="text-align: right; padding: 10px 0; font-family: sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: rgba(90,60,60,0.6); width: 100px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
 
          <!-- Totals -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 35px; background-color: rgba(90,60,60,0.03); border-radius: 12px; padding: 15px;">
            <tr>
              <td style="padding: 12px 15px; font-family: sans-serif; font-size: 13px; color: rgba(90,60,60,0.6);">Subtotal de Productos:</td>
              <td style="padding: 12px 15px; text-align: right; font-family: sans-serif; font-size: 13px; color: #333; font-weight: 500;">S/ ${(total - Number(customerInfo.shippingFee || 0)).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 15px; font-family: sans-serif; font-size: 13px; color: rgba(90,60,60,0.6);">Método de Entrega:</td>
              <td style="padding: 6px 15px; text-align: right; font-family: sans-serif; font-size: 13px; color: #333; font-weight: bold;">${deliveryTypeLabel}</td>
            </tr>
            ${customerInfo.deliveryType === "delivery" ? `
            <tr>
              <td style="padding: 6px 15px; font-family: sans-serif; font-size: 13px; color: rgba(90,60,60,0.6);">Distrito de Envío:</td>
              <td style="padding: 6px 15px; text-align: right; font-family: sans-serif; font-size: 13px; color: #333;">${districtText}</td>
            </tr>
            <tr>
              <td style="padding: 6px 15px; font-family: sans-serif; font-size: 13px; color: rgba(90,60,60,0.6);">Costo de Envío:</td>
              <td style="padding: 6px 15px; text-align: right; font-family: sans-serif; font-size: 13px; color: #333;">S/ ${Number(customerInfo.shippingFee || 0).toFixed(2)}</td>
            </tr>
            ` : ""}
            <tr style="border-top: 1px dashed rgba(90,60,60,0.15);">
              <td style="padding: 15px 15px; font-family: sans-serif; font-size: 14px; font-weight: bold; color: #5a3c3c;">Total Invertido:</td>
              <td style="padding: 15px 15px; text-align: right; font-family: sans-serif; font-size: 18px; font-weight: bold; color: #81b896;">S/ ${total.toFixed(2)}</td>
            </tr>
          </table>

          <!-- Delivery Details -->
          <h3 style="font-family: 'Georgia', serif; font-style: italic; border-bottom: 2px solid rgba(90,60,60,0.1); padding-bottom: 8px; margin-top: 30px; font-size: 18px; color: #5a3c3c;">Detalles del Envío</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 6px 0; font-family: sans-serif; font-size: 13px; color: rgba(90,60,60,0.6); width: 120px; font-weight: bold;">Dirección:</td>
              <td style="padding: 6px 0; font-family: sans-serif; font-size: 13px; color: #333;">${customerInfo.address}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-family: sans-serif; font-size: 13px; color: rgba(90,60,60,0.6); font-weight: bold;">Destinatario:</td>
              <td style="padding: 6px 0; font-family: sans-serif; font-size: 13px; color: #333;">${customerInfo.name}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-family: sans-serif; font-size: 13px; color: rgba(90,60,60,0.6); font-weight: bold;">Teléfono:</td>
              <td style="padding: 6px 0; font-family: sans-serif; font-size: 13px; color: #333;">${customerInfo.phone}</td>
            </tr>
          </table>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #5a3c3c; padding: 25px; text-align: center; font-family: sans-serif; font-size: 11px; color: rgba(255,255,255,0.7); line-height: 1.5;">
          Gracias por confiar en Decoasis Perú. Cultivando amor, tranquilidad y vida en tu hogar. 🌿✨<br />
          Para cualquier consulta adicional, puedes responder directamente a este correo o <a href="https://wa.me/51933836011" target="_blank" style="color: #81b896; text-decoration: underline; font-weight: bold;">escribirnos por WhatsApp</a>.
        </div>
      </div>
    </div>
  `;

  if (!emailPass) {
    console.warn("[Email Simulation] EMAIL_PASS no está configurada en las variables de entorno (.env). No se puede enviar el correo de producción.");
    console.log(`[Email Simulation] DETALLES DEL CORREO DE CONFIRMACIÓN AL CLIENTE:`);
    console.log(`- De: "Decoasis Perú" <${emailUser}>`);
    console.log(`- Para: ${customerInfo.email}`);
    console.log(`- Asunto: 🌿 ¡Tu compra en Decoasis Perú está confirmada! [Pedido: ${orderId}]`);
    return { sent: true, simulated: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      family: 4,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    } as any);

    await transporter.sendMail({
      from: `"Decoasis Perú" <${emailUser}>`,
      to: customerInfo.email,
      subject: `🌿 ¡Tu compra en Decoasis Perú está confirmada! [Pedido: ${orderId}]`,
      html: htmlContent,
    });

    console.log(`[Email] Correo de confirmación enviado exitosamente al cliente: ${customerInfo.email}`);
    return { sent: true, simulated: false };
  } catch (err: any) {
    console.error("[Email] Error al enviar correo de confirmación al cliente:", err);
    return { sent: false, error: err.message };
  }
}


// API endpoint to send confirmation email when status is set to paid (PAGADO) from Dashboard
app.post("/api/send-paid-email", async (req, res) => {
  try {
    const { orderId, total, items, customerInfo } = req.body;

    if (!orderId || !customerInfo || !customerInfo.email) {
      return res.status(400).json({ error: "Datos del pedido o correo del cliente faltantes." });
    }

    console.log(`[API] Solicitud para enviar correo de pago confirmado del pedido ${orderId}...`);
    const result = await sendPaidConfirmationEmail(orderId, total, items, customerInfo);

    return res.json({
      success: true,
      simulated: result.simulated,
      message: "Correo de confirmación de pago procesado correctamente."
    });
  } catch (error: any) {
    console.error("Error al enviar el correo de confirmación de pago:", error);
    return res.status(500).json({ error: error.message || "Error interno al enviar el correo de confirmación de pago." });
  }
});


// API endpoint to create a Culqi Charge
app.post("/api/create-culqi-charge", async (req, res) => {
  try {
    const { token, email, amount, items, customerInfo } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No se enviaron artículos en el carrito." });
    }

    const culqiKey = process.env.CULQI_SECRET_KEY;
    const isRealToken = token && !token.startsWith("tkn_sim_");
    
    // Check for simulated errors if using a simulated token
    if (!isRealToken) {
      const emailLower = (email || "").toLowerCase();
      const nameLower = (customerInfo?.name || "").toLowerCase();
      if (emailLower.includes("error") || emailLower.includes("decline") || emailLower.includes("rechazo") || nameLower.includes("error") || nameLower.includes("decline")) {
        console.warn("Simulating a payment decline error (Modo Demo).");
        return res.status(402).json({
          error: "Simulación de Pago Fallido: La tarjeta fue rechazada por fondos insuficientes o código de seguridad incorrecto (Modo Demo)."
        });
      }
    }

    // Lazy check to see if Culqi credentials are empty/placeholder
    if (!culqiKey || culqiKey === "sk_test_..." || culqiKey.trim() === "") {
      if (isRealToken) {
        console.error("Se recibió un token real de Culqi pero CULQI_SECRET_KEY no está configurada.");
        return res.status(400).json({
          error: "Error de configuración: Se recibió un token real de pago, pero la clave secreta (CULQI_SECRET_KEY) no está configurada en el backend."
        });
      }

      console.warn("CULQI_SECRET_KEY is not defined. Using simulated payment session.");
      const simulatedChargeId = "sim_" + Math.random().toString(36).substring(2, 11);
      
      // Enviar notificación de correo en segundo plano para el pedido simulado
      sendOrderEmail(simulatedChargeId, "culqi", amount / 100, items, customerInfo).catch(err => {
        console.error("Error al enviar correo de notificación de Culqi simulado:", err);
      });
      
      return res.json({
        success: true,
        chargeId: simulatedChargeId,
        simulated: true,
        message: "Simulación de cargo en Culqi exitosa (modo demo)."
      });
    }

    // Call the real Culqi API to charge the tokenized card
    const response = await fetch("https://api.culqi.com/v2/charges", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${culqiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(amount), // Amount in cents
        currency_code: "PEN",
        email: email,
        source_id: token,
        description: `Compra en Decoasis Perú por ${customerInfo.name || 'Cliente'}`,
        metadata: {
          customer_name: customerInfo.name,
          customer_phone: customerInfo.phone,
          customer_address: customerInfo.address,
          order_items: JSON.stringify(items.map((i: any) => `${i.name} x${i.quantity}`))
        }
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      // If keys are invalid or unauthorized (API returned 401/unauthorized), report it clearly instead of pretending it succeeded
      if (data.type === "authentication_error" || response.status === 401) {
        console.warn("Advertencia de autenticación de Culqi: Tu CULQI_SECRET_KEY es inválida o no está autorizada.");
        return res.status(401).json({
          error: "Error de Autenticación de Culqi: Tu clave secreta (CULQI_SECRET_KEY) es inválida o no está autorizada. Por favor, verifica tus credenciales en tus variables de entorno (.env)."
        });
      }

      console.warn("Información de error devuelto por la API de Culqi (esperado en declines/errores):", data);
      return res.status(response.status).json({ 
        error: data.user_message || data.merchant_message || data.message || "Error al procesar el cargo con Culqi." 
      });
    }

    // Enviar notificación de correo en segundo plano para el pedido real
    sendOrderEmail(data.id, "culqi", amount / 100, items, customerInfo).catch(err => {
      console.error("Error al enviar correo de notificación de Culqi real:", err);
    });

    return res.json({ 
      success: true, 
      chargeId: data.id, 
      simulated: false,
      message: "Cargo procesado exitosamente en Culqi." 
    });
  } catch (error: any) {
    console.error("Error al procesar el cargo de Culqi:", error);
    return res.status(500).json({ error: error.message || "Error interno del servidor al procesar el pago con Culqi." });
  }
});

// API endpoint for manual order recording (Yape / Plin / Bank Transfer)
app.post("/api/submit-manual-payment", async (req, res) => {
  try {
    const { items, method, transactionCode, customerInfo } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No se enviaron artículos en el carrito." });
    }
    
    console.log("Nuevo pedido registrado con método manual:", { method, transactionCode, customerInfo, items });
    
    const orderId = "DEC-" + Math.floor(100000 + Math.random() * 900000);
    
    // Calcular el total del pedido manual
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const shippingFee = Number(customerInfo?.shippingFee || 0);
    const totalAmount = subtotal + shippingFee;

    // Enviar notificación de correo en segundo plano para el pedido manual
    sendOrderEmail(orderId, method, totalAmount, items, customerInfo).catch(err => {
      console.error("Error al enviar correo de notificación de pago manual:", err);
    });

    return res.json({
      success: true,
      orderId,
      message: `¡Pedido ${orderId} registrado exitosamente! Valida tu transferencia enviando la constancia.`,
    });
  } catch (error: any) {
    console.error("Error al registrar pedido manual:", error);
    return res.status(500).json({ error: "Error interno del servidor al procesar tu pedido manual." });
  }
});

// Setup Vite Dev Server / Static Asset serving
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();
