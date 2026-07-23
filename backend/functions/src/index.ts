import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Polar } from '@polar-sh/sdk';
import { validateEvent } from '@polar-sh/sdk/webhooks';

admin.initializeApp();
const db = admin.firestore();

// All secrets that need to be accessible by Cloud Functions
const ALL_SECRETS = [
  'POLAR_ACCESS_TOKEN',
  'POLAR_WEBHOOK_SECRET',
  'POLAR_CREDITS_S_PRODUCT_ID',
  'POLAR_CREDITS_M_PRODUCT_ID',
  'POLAR_CREDITS_L_PRODUCT_ID',
  'POLAR_PRO_MONTHLY_PRODUCT_ID',
  'POLAR_PRO_LIFETIME_PRODUCT_ID',
];

// Initialize Polar client
const POLAR_ACCESS_TOKEN = process.env.POLAR_ACCESS_TOKEN || 'mock_access_token';
const POLAR_SERVER = process.env.POLAR_SERVER === 'production' ? 'production' : 'sandbox';

const polar = new Polar({
  accessToken: POLAR_ACCESS_TOKEN,
  server: POLAR_SERVER,
});

// Helper to set CORS headers
const handleCors = (req: functions.Request, res: functions.Response): boolean => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return true;
  }
  return false;
};

/**
 * Validate a snap request (verifies user credits or guest device limits)
 */
export const validateSnap = functions.runWith({ secrets: ALL_SECRETS }).https.onRequest(async (req, res) => {
  if (handleCors(req, res)) return;

  try {
    const { snapType, fingerprint } = req.body;
    const isSvg = snapType === 'svg';
    const creditsToDeduct = isSvg ? 3 : 1;

    // Check if user is logged in by verifying Authorization Header
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      
      let decodedToken;
      try {
        decodedToken = await admin.auth().verifyIdToken(idToken);
      } catch (authErr: any) {
        res.status(401).json({ allowed: false, reason: 'invalid_auth_token', message: authErr.message });
        return;
      }

      const uid = decodedToken.uid;
      const userRef = db.collection('users').doc(uid);
      
      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists) {
          // New registered user starts with 10 free welcome credits
          transaction.set(userRef, {
            email: decodedToken.email || '',
            displayName: decodedToken.name || '',
            tier: 'free',
            credits: 10,
            createdAt: Date.now()
          });
          
          res.status(200).json({ 
            allowed: true, 
            tier: 'free', 
            remainingCredits: 10
          });
          return;
        }

        const userData = userDoc.data();
        if (!userData) {
          throw new Error('User data is empty');
        }

        if (userData.tier === 'pro') {
          // Pro users get unlimited snaps
          res.status(200).json({ allowed: true, tier: 'pro', remainingCredits: -1 });
          return;
        }

        // Free user, check credits
        const currentCredits = userData.credits || 0;
        if (currentCredits < creditsToDeduct) {
          res.status(403).json({ 
            allowed: false, 
            reason: 'out_of_credits', 
            message: `Requires ${creditsToDeduct} credit(s). You have ${currentCredits} credit(s).` 
          });
          return;
        }

        // Deduct credits
        const nextCredits = currentCredits - creditsToDeduct;
        transaction.update(userRef, { credits: nextCredits });
        
        res.status(200).json({ 
          allowed: true, 
          tier: 'free', 
          remainingCredits: nextCredits 
        });
      });
      
    } else {
      // Guest Mode (unauthenticated) - Tracked by fingerprint
      if (!fingerprint) {
        res.status(400).json({ allowed: false, reason: 'missing_fingerprint', message: 'Guest mode requires a device fingerprint.' });
        return;
      }

      const fingerprintRef = db.collection('device_fingerprints').doc(fingerprint);
      
      await db.runTransaction(async (transaction) => {
        const fingerprintDoc = await transaction.get(fingerprintRef);
        
        if (!fingerprintDoc.exists) {
          // New guest starts with 3 credits. Deduct the first one now.
          const maxGuestCredits = 3;
          if (maxGuestCredits < creditsToDeduct) {
            res.status(403).json({ 
              allowed: false, 
              reason: 'guest_limit_reached', 
              message: `Requires ${creditsToDeduct} credits, but guest limit is only 3.` 
            });
            return;
          }
          
          transaction.set(fingerprintRef, {
            creditsUsed: creditsToDeduct,
            firstSeen: Date.now()
          });

          res.status(200).json({ 
            allowed: true, 
            tier: 'guest', 
            remainingCredits: maxGuestCredits - creditsToDeduct 
          });
          return;
        }

        const fingerprintData = fingerprintDoc.data();
        if (!fingerprintData) {
          throw new Error('Fingerprint data is empty');
        }

        const creditsUsed = fingerprintData.creditsUsed || 0;
        const maxGuestCredits = 3;
        const remaining = maxGuestCredits - creditsUsed;

        if (remaining < creditsToDeduct) {
          res.status(403).json({ 
            allowed: false, 
            reason: 'guest_limit_reached', 
            message: 'You have exhausted your 3 guest credits. Please login and upgrade to continue.' 
          });
          return;
        }

        // Deduct credits
        const nextCreditsUsed = creditsUsed + creditsToDeduct;
        transaction.update(fingerprintRef, { creditsUsed: nextCreditsUsed });

        res.status(200).json({ 
          allowed: true, 
          tier: 'guest', 
          remainingCredits: maxGuestCredits - nextCreditsUsed 
        });
      });
    }

  } catch (error: any) {
    console.error('Error in validateSnap:', error);
    res.status(500).json({ allowed: false, error: error.message });
  }
});

/**
 * Create a Polar.sh Checkout Session for subscription or credits
 */
export const createCheckoutSession = functions.runWith({ secrets: ALL_SECRETS }).https.onRequest(async (req, res) => {
  if (handleCors(req, res)) return;

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized. Please login first.' });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email || null;

    const { type } = req.body;

    const getSecret = (key: string): string => {
      const val = process.env[key];
      return val ? val.trim() : '';
    };

    // Product ID map from Secret Manager env vars
    const PRODUCT_MAP: Record<string, { id: string; credits?: number; label: string }> = {
      credits_s:   { id: getSecret('POLAR_CREDITS_S_PRODUCT_ID'),   credits: 25,  label: 'Credits Pack S (25 snaps)' },
      credits_m:   { id: getSecret('POLAR_CREDITS_M_PRODUCT_ID'),   credits: 75,  label: 'Credits Pack M (75 snaps)' },
      credits_l:   { id: getSecret('POLAR_CREDITS_L_PRODUCT_ID'),   credits: 200, label: 'Credits Pack L (200 snaps)' },
      pro_monthly: { id: getSecret('POLAR_PRO_MONTHLY_PRODUCT_ID'), label: 'Pro Monthly' },
      pro_yearly:  { id: getSecret('POLAR_PRO_YEARLY_PRODUCT_ID'),  label: 'Pro Yearly' },
      pro_lifetime: { id: getSecret('POLAR_PRO_LIFETIME_PRODUCT_ID'), label: 'Pro Lifetime' },
    };

    const product = PRODUCT_MAP[type];
    if (!product || !product.id) {
      const secretName = `POLAR_${type.toUpperCase()}_PRODUCT_ID`;
      res.status(400).json({ 
        error: `Invalid checkout type: '${type}'. Secret '${secretName}' is not set in Firebase Functions.` 
      });
      return;
    }

    const checkout = await polar.checkouts.create({
      products: [product.id],
      successUrl: 'https://canva-snapper-pro-9e1b3.web.app?checkout_id={CHECKOUT_ID}',
      customerEmail: email,
      metadata: {
        userId: uid,
        type: type,
        credits: product.credits ? String(product.credits) : '0',
      }
    });

    res.status(200).json({ url: checkout.url });

  } catch (error: any) {
    console.error('Error in createCheckoutSession:', error);
    res.status(500).json({ error: error.message });
  }
});


/**
 * Polar Webhook Handler to receive payment events
 */
export const polarWebhook = functions.runWith({ secrets: ALL_SECRETS }).https.onRequest(async (req, res) => {
  // Map headers to Record<string, string> for Polar SDK validator
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (value !== undefined) {
      headers[key] = Array.isArray(value) ? value[0] : value;
    }
  }

  const webhookSecret = process.env.POLAR_WEBHOOK_SECRET || 'whsec_mock';
  let event: any;

  try {
    if (process.env.POLAR_WEBHOOK_SECRET) {
      event = validateEvent(req.rawBody, headers, webhookSecret);
    } else {
      // Fallback for development/testing
      event = req.body;
    }
  } catch (err: any) {
    console.error(`Webhook Signature verification failed.`, err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  try {
    switch (event.type) {
      case 'order.created':
      case 'order.updated': {
        const order = event.data;
        const uid = order.metadata?.userId as string;
        const type = order.metadata?.type as string;
        const isCreditsType = type?.startsWith('credits_');
        const isLifetimeType = type === 'pro_lifetime';

        if (order.paid && uid) {
          if (isCreditsType) {
            const creditsToAdd = parseInt(order.metadata?.credits || '0', 10);
            if (creditsToAdd > 0) {
              const orderRef = db.collection('processed_orders').doc(order.id);
              const userRef = db.collection('users').doc(uid);
              
              await db.runTransaction(async (transaction) => {
                // 1. Perform all reads first
                const orderDoc = await transaction.get(orderRef);
                const userDoc = await transaction.get(userRef);

                // 2. Perform all writes second
                if (!orderDoc.exists) {
                  transaction.set(orderRef, { processedAt: Date.now() });
                  
                  if (userDoc.exists) {
                    transaction.update(userRef, {
                      credits: admin.firestore.FieldValue.increment(creditsToAdd)
                    });
                  } else {
                    transaction.set(userRef, {
                      tier: 'free',
                      credits: creditsToAdd,
                      createdAt: Date.now()
                    });
                  }
                  console.log(`Processed order ${order.id}: Added ${creditsToAdd} credits to user ${uid}`);
                }
              });
            }
          } else if (isLifetimeType) {
            const orderRef = db.collection('processed_orders').doc(order.id);
            const userRef = db.collection('users').doc(uid);
            
            await db.runTransaction(async (transaction) => {
              const orderDoc = await transaction.get(orderRef);
              if (!orderDoc.exists) {
                transaction.set(orderRef, { processedAt: Date.now() });
                transaction.set(userRef, {
                  tier: 'pro',
                  polarOrderId: order.id
                }, { merge: true });
                console.log(`Processed lifetime order ${order.id}: Set user ${uid} to PRO.`);
              }
            });
          }
        }
        break;
      }

      case 'subscription.created':
      case 'subscription.active':
      case 'subscription.updated': {
        const subscription = event.data;
        const uid = subscription.metadata?.userId as string;
        if (uid) {
          const userRef = db.collection('users').doc(uid);
          if (subscription.status === 'active') {
            await userRef.set({
              tier: 'pro',
              polarSubscriptionId: subscription.id
            }, { merge: true });
            console.log(`Webhook: Subscription ${subscription.id} active. User ${uid} set to PRO.`);
          } else {
            await userRef.set({
              tier: 'free'
            }, { merge: true });
            console.log(`Webhook: Subscription ${subscription.id} status is ${subscription.status}. User ${uid} set to FREE.`);
          }
        }
        break;
      }

      case 'subscription.revoked': {
        const subscription = event.data;
        const uid = subscription.metadata?.userId as string;
        if (uid) {
          const userRef = db.collection('users').doc(uid);
          await userRef.set({
            tier: 'free'
          }, { merge: true });
          console.log(`Webhook: Subscription ${subscription.id} revoked. User ${uid} set to FREE.`);
        }
        break;
      }

      default:
        console.log(`Webhook: Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Error handling webhook event:', error);
    res.status(500).send(`Webhook Error: ${error.message}`);
  }
});
