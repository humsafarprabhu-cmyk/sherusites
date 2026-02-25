/**
 * Razorpay Payment Integration for SheruSites
 * - Create orders
 * - Verify payments
 * - Generate payment page HTML
 */

import Razorpay from 'razorpay';
import crypto from 'crypto';
import { getSiteData, saveSiteData, createPaymentRecord, verifyPaymentRecord } from './db.ts';

let _razorpay: Razorpay | null = null;

function getRazorpay(): Razorpay {
  if (!_razorpay) {
    const keyId = process.env.RAZORPAY_KEY_ID || '';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
    if (!keyId || !keySecret) throw new Error('Razorpay keys not configured');
    _razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return _razorpay;
}

// ─── CREATE ORDER ────────────────────────────────────────────────────────────

export async function createOrder(slug: string): Promise<{ orderId: string; amount: number } | null> {
  const site = getSiteData(slug);
  if (!site) return null;

  // Use pending plan price from DB, fallback to ₹1,499
  const amount = ((site as any).pendingPlanPrice || 1499) * 100; // paise

  const order = await getRazorpay().orders.create({
    amount,
    currency: 'INR',
    receipt: `ss_${slug.substring(0, 20)}_${Date.now().toString(36)}`,
    notes: {
      slug,
      business: site.businessName,
      phone: site.phone,
      domain: (site as any).pendingDomain || '',
    },
  });

  // Record in DB
  createPaymentRecord(slug, site.phone, order.id, amount);

  return { orderId: order.id, amount };
}

// ─── VERIFY PAYMENT ──────────────────────────────────────────────────────────

export function verifyPayment(orderId: string, paymentId: string, signature: string): boolean {
  const body = orderId + '|' + paymentId;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
    .update(body)
    .digest('hex');
  return expected === signature;
}

// ─── MARK PAID ───────────────────────────────────────────────────────────────

export function markPaid(slug: string, orderId: string, paymentId: string, signature: string): boolean {
  const site = getSiteData(slug);
  if (!site) return false;
  site.plan = 'premium';
  site.paymentId = paymentId;
  site.paidAt = new Date().toISOString();
  saveSiteData(site);
  // Update payment record
  verifyPaymentRecord(orderId, paymentId, signature);
  return true;
}

// ─── PAYMENT PAGE HTML ──────────────────────────────────────────────────────

export function getPaymentPageHTML(slug: string, orderId: string, amount: number): string {
  const site = getSiteData(slug);
  const businessName = site?.businessName || slug;
  const phone = site?.phone || '';
  const pendingDomain = (site as any)?.pendingDomain || '';
  const displayPrice = `₹${(amount / 100).toLocaleString()}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Upgrade to Premium — ${businessName} | SheruSites</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      padding: 20px;
    }
    .card {
      background: rgba(255,255,255,0.05);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 24px;
      padding: 40px;
      max-width: 480px;
      width: 100%;
      text-align: center;
    }
    .logo { font-size: 48px; margin-bottom: 8px; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
    .subtitle { color: #a0a0c0; font-size: 14px; margin-bottom: 32px; }
    .business-name {
      font-size: 20px;
      font-weight: 600;
      color: #818cf8;
      margin-bottom: 24px;
    }
    .features {
      text-align: left;
      margin-bottom: 32px;
    }
    .feature {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      font-size: 15px;
    }
    .feature:last-child { border-bottom: none; }
    .check { color: #34d399; font-size: 18px; }
    .price-box {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .price { font-size: 42px; font-weight: 800; }
    .price-sub { color: rgba(255,255,255,0.7); font-size: 14px; margin-top: 4px; }
    .pay-btn {
      width: 100%;
      padding: 16px;
      font-size: 18px;
      font-weight: 700;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: #fff;
      transition: all 0.3s;
      box-shadow: 0 4px 20px rgba(34,197,94,0.3);
    }
    .pay-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 30px rgba(34,197,94,0.4); }
    .pay-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .secure { color: #6b7280; font-size: 12px; margin-top: 16px; }
    .success-box {
      display: none;
      background: rgba(34,197,94,0.1);
      border: 1px solid rgba(34,197,94,0.3);
      border-radius: 16px;
      padding: 32px;
      margin-top: 24px;
    }
    .success-box.show { display: block; }
    .success-icon { font-size: 56px; margin-bottom: 12px; }
    .error-msg { color: #f87171; font-size: 14px; margin-top: 12px; display: none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">🦁</div>
    <h1>SheruSites Premium</h1>
    <div class="subtitle">Professional website for your business</div>
    <div class="business-name">${businessName}</div>

    <div class="features">
      <div class="feature"><span class="check">✓</span> Custom domain${pendingDomain ? `: <strong>${pendingDomain}</strong>` : ''}</div>
      <div class="feature"><span class="check">✓</span> No SheruSites branding</div>
      <div class="feature"><span class="check">✓</span> Priority support</div>
      <div class="feature"><span class="check">✓</span> Google Business setup</div>
      <div class="feature"><span class="check">✓</span> SSL certificate included</div>
      <div class="feature"><span class="check">✓</span> 1 year validity</div>
    </div>

    <div class="price-box">
      <div class="price">₹999</div>
      <div class="price-sub">per year • Custom domain included</div>
    </div>

    <button class="pay-btn" id="payBtn" onclick="startPayment()">
      💳 Pay ₹999 — Go Premium
    </button>
    <div class="error-msg" id="errorMsg"></div>
    <div class="secure">🔒 Secured by Razorpay • 100% safe payment</div>

    <div class="success-box" id="successBox">
      <div class="success-icon">🎉</div>
      <h2 style="margin-bottom:8px">Payment Successful!</h2>
      <p style="color:#a0a0c0;font-size:14px;">
        Your premium plan is now active.<br>
        Custom domain will be live within 30 minutes!
      </p>
      <p style="margin-top:16px;font-size:13px;color:#6b7280;" id="paymentRef"></p>
    </div>
  </div>

  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <script>
    const ORDER_ID = "${orderId}";
    const SLUG = "${slug}";
    const KEY_ID = "${process.env.RAZORPAY_KEY_ID || ''}";

    function startPayment() {
      const btn = document.getElementById('payBtn');
      btn.disabled = true;
      btn.textContent = 'Opening payment...';
      document.getElementById('errorMsg').style.display = 'none';

      const options = {
        key: KEY_ID,
        amount: ${amount},
        currency: "INR",
        name: "SheruSites",
        description: "Premium Plan — " + "${businessName}",
        order_id: ORDER_ID,
        prefill: {
          contact: "${phone}",
        },
        theme: {
          color: "#6366f1"
        },
        handler: async function(response) {
          btn.textContent = 'Verifying payment...';
          try {
            const res = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                slug: SLUG,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const data = await res.json();
            if (data.success) {
              btn.style.display = 'none';
              document.getElementById('successBox').classList.add('show');
              document.getElementById('paymentRef').textContent = 'Payment ID: ' + response.razorpay_payment_id;
            } else {
              showError('Verification failed. Contact support.');
            }
          } catch(e) {
            showError('Network error. Your payment is safe — contact support.');
          }
        },
        modal: {
          ondismiss: function() {
            btn.disabled = false;
            btn.textContent = '💳 Pay ₹999 — Go Premium';
          }
        }
      };

      const rzp = new Razorpay(options);
      rzp.on('payment.failed', function(response) {
        showError(response.error.description || 'Payment failed. Please try again.');
      });
      rzp.open();
    }

    function showError(msg) {
      const btn = document.getElementById('payBtn');
      btn.disabled = false;
      btn.textContent = '💳 Pay ₹999 — Go Premium';
      const err = document.getElementById('errorMsg');
      err.textContent = msg;
      err.style.display = 'block';
    }
  </script>
</body>
</html>`;
}
