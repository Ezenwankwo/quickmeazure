/**
 * Paystack payment integration utility
 * This file handles Paystack payment popup functionality
 */

interface PaystackConfig {
  key: string
  email: string
  amount: number
  currency?: string
  ref?: string
  callback?: (response: PaystackResponse) => void
  onClose?: () => void
  metadata?: Record<string, any>
}

interface PaystackResponse {
  reference: string
  status: string
  trans: string
  transaction: string
  message: string
  trxref: string
}

/**
 * Initialize Paystack payment popup
 * @param config Payment configuration
 */
export const initializePaystackPayment = (config: PaystackConfig): void => {
  // Ensure the Paystack script is loaded
  if (!document.getElementById('paystack-script')) {
    const script = document.createElement('script')
    script.id = 'paystack-script'
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true

    script.onload = () => {
      // Once script is loaded, initialize payment
      openPaystackPopup(config)
    }

    document.head.appendChild(script)
  } else {
    // Script already loaded, initialize payment
    openPaystackPopup(config)
  }
}

/**
 * Open Paystack payment popup
 * @param config Payment configuration
 */
const openPaystackPopup = (config: PaystackConfig): void => {
  const paystack = (window as any).PaystackPop

  if (!paystack) {
    console.error('Paystack script not loaded properly')
    return
  }

  // Generate a reference if not provided
  if (!config.ref) {
    config.ref = `QM-${Date.now()}-${Math.floor(Math.random() * 1000000)}`
  }

  // Set default currency if not provided
  if (!config.currency) {
    config.currency = 'NGN'
  }

  // Convert amount to kobo (Paystack requires amount in the smallest currency unit)
  config.amount = config.amount * 100

  const handler = paystack.setup({
    key: config.key,
    email: config.email,
    amount: config.amount,
    currency: config.currency,
    ref: config.ref,
    metadata: config.metadata || {},
    callback: (response: PaystackResponse) => {
      if (config.callback) {
        config.callback(response)
      }
    },
    onClose: () => {
      if (config.onClose) {
        config.onClose()
      }
    },
  })

  handler.openIframe()
}
