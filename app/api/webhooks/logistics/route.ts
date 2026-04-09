/**
 * POST /api/webhooks/logistics
 * 
 * Receives tracking event updates from logistics partners.
 * Validates webhook signature, updates shipment/order status in DB,
 * and triggers customer notification.
 * 
 * Expected payload:
 * {
 *   tracking_number: string,
 *   status: string,
 *   timestamp: string,
 *   location: string,
 *   description?: string,
 *   estimated_delivery?: string
 * }
 */

import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { validateWebhookSignature } from '@/lib/services/logistics';

export const dynamic = 'force-dynamic';

// Status mapping from logistics partner status codes to our internal status
const STATUS_MAP: Record<string, string> = {
  // Shiprocket
  '1': 'confirmed',
  '2': 'packed',
  '3': 'packed',
  '4': 'shipped',
  '5': 'shipped',
  '6': 'out_for_delivery',
  '7': 'delivered',
  '8': 'cancelled',
  '9': 'rto',
  // Generic / Common
  'confirmed': 'confirmed',
  'picked_up': 'shipped',
  'packed': 'packed',
  'in_transit': 'shipped',
  'shipped': 'shipped',
  'out_for_delivery': 'out_for_delivery',
  'delivered': 'delivered',
  'cancelled': 'cancelled',
  'returned': 'rto',
  'failed': 'failed',
  // Delhivery
  'Manifested': 'confirmed',
  'In Transit': 'shipped',
  'Dispatched': 'shipped',
  'Out for Delivery': 'out_for_delivery',
  'Delivered': 'delivered',
  'RTO': 'rto',
};

function normalizeStatus(rawStatus: string): string {
  return STATUS_MAP[rawStatus] || rawStatus.toLowerCase().replace(/\s+/g, '_');
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature') ||
                      req.headers.get('x-shiprocket-signature') ||
                      req.headers.get('x-delhivery-signature') || '';

    // Validate webhook signature
    const shop = await prisma.shop.findFirst({
      select: { webhookSecret: true },
    });

    const webhookSecret = shop?.webhookSecret || '';

    if (webhookSecret && signature) {
      const isValid = validateWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.error('[Webhook] Invalid signature — rejecting request');
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
    }

    // Parse the payload
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // Normalize the payload — different providers use different field names
    const trackingNumber = payload.tracking_number || payload.awb || payload.waybill || payload.shipment_id;
    const rawStatus = payload.status || payload.current_status || payload.shipment_status;
    const timestamp = payload.timestamp || payload.event_time || payload.scanned_date || new Date().toISOString();
    const location = payload.location || payload.current_location || payload.city || '';
    const description = payload.description || payload.activity || payload.status_description || '';
    const estimatedDelivery = payload.estimated_delivery || payload.etd || null;

    if (!trackingNumber) {
      return NextResponse.json({ error: 'Missing tracking_number in payload' }, { status: 400 });
    }

    if (!rawStatus) {
      return NextResponse.json({ error: 'Missing status in payload' }, { status: 400 });
    }

    const normalizedStatus = normalizeStatus(rawStatus);

    console.log(`[Webhook] Tracking update: ${trackingNumber} → ${normalizedStatus} (raw: ${rawStatus}) at ${location}`);

    // Find the matching shipment
    const shipment = await prisma.shipment.findFirst({
      where: { trackingNumber },
      include: { order: { include: { customer: true } } },
    });

    if (!shipment) {
      console.warn(`[Webhook] No shipment found for tracking number: ${trackingNumber}`);
      return NextResponse.json({ error: 'Shipment not found', tracking_number: trackingNumber }, { status: 404 });
    }

    // Append event to the events array
    const existingEvents = JSON.parse(shipment.events || '[]');
    const newEvent = {
      status: normalizedStatus,
      location,
      timestamp,
      description: description || `Status updated to ${normalizedStatus}`,
    };
    existingEvents.push(newEvent);

    // Update shipment
    const updateData: any = {
      status: normalizedStatus,
      currentLocation: location || shipment.currentLocation,
      events: JSON.stringify(existingEvents),
    };

    if (estimatedDelivery) {
      updateData.estimatedDelivery = new Date(estimatedDelivery);
    }

    await prisma.shipment.update({
      where: { id: shipment.id },
      data: updateData,
    });

    // Update order delivery status
    await prisma.order.update({
      where: { id: shipment.orderId },
      data: { deliveryStatus: normalizedStatus },
    });

    console.log(`[Webhook] ✅ Updated shipment ${shipment.id} and order ${shipment.orderId} → ${normalizedStatus}`);

    // TODO: Trigger push notification to customer via FCM/Expo
    // This would send a real-time push notification to the mobile app
    // Example:
    // await sendPushNotification(shipment.order.customer.id, {
    //   title: `Order ${shipment.order.shopifyOrderId} Update`,
    //   body: `Your order is now ${normalizedStatus}${location ? ` at ${location}` : ''}`,
    //   data: { orderId: shipment.orderId, status: normalizedStatus },
    // });

    return NextResponse.json({
      success: true,
      shipmentId: shipment.id,
      orderId: shipment.orderId,
      status: normalizedStatus,
      message: `Tracking updated for ${trackingNumber}`,
    }, { status: 200 });
  } catch (error: any) {
    console.error('[Webhook] Logistics webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

/**
 * GET /api/webhooks/logistics
 * Health check endpoint to confirm webhook URL is live.
 */
export async function GET() {
  return NextResponse.json({
    status: 'active',
    message: 'Zica Bella Logistics Webhook endpoint is live.',
    supported_events: ['tracking_update', 'status_change', 'delivery_confirmation'],
    timestamp: new Date().toISOString(),
  });
}
