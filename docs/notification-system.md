# QuickMeazure Notification System

This document provides an overview of the notification system implemented in QuickMeazure, which handles payment reminders, subscription expiration alerts, and usage limit warnings.

## Overview

The notification system is designed to enhance user experience by providing timely alerts about important events related to their account, including:

- **Payment Reminders**: Alerts users when their subscription payment is due soon
- **Subscription Expiration Alerts**: Notifies users when their subscription is about to expire
- **Usage Limit Warnings**: Warns users when they're approaching the limits of their current plan

## Architecture

The notification system consists of the following components:

### 1. Database Schema

Notifications are stored in the `notifications` table with the following structure:

- `id`: Unique identifier for the notification
- `userId`: ID of the user the notification belongs to
- `type`: Type of notification (payment, subscription, usage, system)
- `severity`: Importance level (info, warning, critical)
- `title`: Short title of the notification
- `message`: Detailed message content
- `read`: Boolean indicating if the notification has been read
- `actionUrl`: Optional URL for the user to take action
- `actionText`: Optional text for the action button
- `expiresAt`: Optional expiration date for the notification
- `metadata`: Additional JSON data related to the notification
- `createdAt`: Timestamp when the notification was created
- `updatedAt`: Timestamp when the notification was last updated

### 2. Server-Side Components

- **Notification Service**: Core service that handles creating and managing notifications
- **Scheduled Tasks**: Automated tasks that generate notifications based on user data
- **API Endpoints**: RESTful endpoints for fetching, marking as read, and deleting notifications

### 3. Client-Side Components

- **Notification Store**: Pinia store for managing notification state
- **NotificationCenter**: UI component for displaying notifications in the header
- **NotificationItem**: Reusable component for rendering individual notifications
- **Notification Drawer**: Integration with the existing notification drawer UI

## API Endpoints

The following API endpoints are available for interacting with notifications:

- `GET /api/notifications`: Fetch all notifications for the authenticated user
- `POST /api/notifications/{id}/read`: Mark a specific notification as read
- `POST /api/notifications/read-all`: Mark all notifications as read
- `DELETE /api/notifications/{id}`: Delete a specific notification
- `POST /api/admin/generate-notifications`: Admin-only endpoint to manually trigger notification generation

## Notification Types

### Payment Reminders

Generated when:

- A subscription payment is due within the next 7 days
- Severity increases as the payment date approaches

### Subscription Expiration Alerts

Generated when:

- A subscription is set to expire within the next 14 days
- Severity increases as the expiration date approaches
- Also applies to trial periods that are ending

### Usage Limit Warnings

Generated when:

- A user approaches 80% of their plan limits (clients, measurements, etc.)
- Severity increases as usage approaches 90% of the limit

## Implementation Details

### Scheduled Tasks

The system includes a scheduled task (`generateNotifications.ts`) that runs daily to:

1. Clean up expired notifications
2. Generate payment reminders
3. Generate subscription expiration alerts
4. Generate usage limit warnings

### Client-Side Checks

In addition to server-generated notifications, the client-side also performs checks to generate local notifications for:

- Subscription status changes
- Payment due dates
- Usage limits

## Installation and Setup

1. Run the standard database migration to create the notifications table:

   ```
   npm run migrate
   ```

   or

   ```
   npx drizzle-kit push:pg
   ```

2. Restart the application to apply the changes

3. The notification system will automatically start generating notifications based on user data

## Testing

To test the notification system:

1. As an admin, visit `/admin/generate-notifications` to manually trigger notification generation
2. Check the notifications bell icon in the header to see generated notifications
3. Open the notifications drawer to view all notifications

## Extending the System

To add new notification types:

1. Add the new type to the `NOTIFICATION_TYPES` constant in `notificationService.ts`
2. Create a new generation function in the notification service
3. Add the new function to the scheduled task
4. Update the client-side notification store to handle the new type
