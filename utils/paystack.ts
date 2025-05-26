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
      // Store the response directly in localStorage for later use
      try {
        console.log('Paystack payment successful:', response)

        // Store the response in localStorage
        // We'll use mock card details since we can't access the real ones without a secret key
        const cardDetails = {
          reference: response.reference,
          last4: '1234', // Mock last 4 digits
          exp_month: '12', // Mock expiry month
          exp_year: '2025', // Mock expiry year
          card_type: 'Visa', // Mock card type
          authorization_code: response.trans || response.transaction || '', // Use transaction ID as authorization code
          status: response.status,
          message: response.message,
        }

        localStorage.setItem('lastPaystackResponse', JSON.stringify(cardDetails))
        console.log('Stored payment response in localStorage:', cardDetails)
      } catch (error) {
        console.error('Error storing payment response:', error)
        // Store basic response if there's an error
        localStorage.setItem(
          'lastPaystackResponse',
          JSON.stringify({
            reference: response.reference,
            status: response.status,
            message: response.message,
          })
        )
      }

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
