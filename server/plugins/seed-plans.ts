import { defineNitroPlugin } from 'nitropack/runtime/plugin'
import { db } from '../database'
import { plans } from '../database/schema'

export default defineNitroPlugin(async () => {
  console.log('Checking for existing plans...')
  
  try {
    // Check if plans already exist
    const existingPlans = await db.select().from(plans)
    
    if (existingPlans.length > 0) {
      console.log(`Found ${existingPlans.length} existing plans`)
      return
    }
    
    console.log('No plans found. Seeding initial plans...')
    
    // Insert initial plans
    await db.insert(plans).values([
      {
        name: 'Free',
        description: 'Perfect for small tailoring businesses',
        price: 0,
        interval: 'month',
        features: ['Basic measurements', 'Payment tracking'],
        isActive: true,
        isFeatured: false,
        maxClients: 100,
        maxStyles: 10,
        maxStorage: 100
      },
      {
        name: 'Standard',
        description: 'For growing tailoring businesses',
        price: 5000,
        interval: 'month',
        features: ['Advanced measurements', 'Payment tracking', 'Style catalog', 'Email notifications'],
        isActive: true,
        isFeatured: true,
        maxClients: 500,
        maxStyles: 50,
        maxStorage: 500
      },
      {
        name: 'Premium',
        description: 'For established tailoring businesses',
        price: 10000,
        interval: 'month',
        features: ['Advanced measurements', 'Payment tracking', 'Style catalog', 'Email notifications', 'Analytics dashboard', 'Priority support'],
        isActive: true,
        isFeatured: false,
        maxClients: -1, // Unlimited
        maxStyles: -1, // Unlimited
        maxStorage: 2000
      }
    ])
    
    console.log('Plans seeded successfully')
  } catch (error) {
    console.error('Error seeding plans:', error)
  }
}) 