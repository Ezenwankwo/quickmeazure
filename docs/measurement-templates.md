# Measurement Templates

This feature allows tailors to create and manage custom measurement templates for their clients. Templates can be created for different genders and include custom measurement fields.

## Features

- Create, edit, archive, and delete measurement templates
- Add custom measurement fields with units (inches or centimeters)
- Set default measurement units for your account
- Archive templates to hide them without deleting them
- Reset to default templates if needed

## Database Schema

### `measurement_templates`
- `id` - Unique identifier
- `userId` - Reference to the user who owns this template
- `name` - Name of the template (e.g., "Standard Male", "Custom Fit")
- `gender` - Gender the template is for (male/female/unisex)
- `isDefault` - Whether this is a default template
- `isArchived` - Whether the template is archived
- `createdAt` - When the template was created
- `updatedAt` - When the template was last updated

### `measurement_fields`
- `id` - Unique identifier
- `templateId` - Reference to the parent template
- `name` - Name of the measurement field (e.g., "Chest", "Waist")
- `unit` - Unit of measurement (in/cm)
- `isRequired` - Whether this field is required
- `displayOrder` - Order in which to display the field
- `isDefault` - Whether this is a default field
- `createdAt` - When the field was created
- `updatedAt` - When the field was last updated

### `user_measurement_settings`
- `userId` - Reference to the user
- `defaultUnit` - Default unit of measurement (in/cm)
- `updatedAt` - When the settings were last updated

## API Endpoints

### Measurement Templates
- `GET /api/measurement-templates` - Get all templates for the current user
- `POST /api/measurement-templates` - Create a new template
- `PUT /api/measurement-templates/[id]` - Update a template
- `POST /api/measurement-templates/[id]/archive` - Archive a template
- `POST /api/measurement-templates/[id]/unarchive` - Unarchive a template
- `DELETE /api/measurement-templates/[id]` - Delete a template
- `POST /api/measurement-templates/reset` - Reset to default templates

### User Measurement Settings
- `GET /api/user/measurement-settings` - Get user's measurement settings
- `PUT /api/user/measurement-settings` - Update user's measurement settings

## Components

### `MeasurementTemplateList`
Displays a list of measurement templates with options to create, edit, archive, and delete templates.

### `MeasurementTemplateCard`
Displays a single measurement template with its fields and actions.

### `MeasurementTemplateForm`
A form for creating and editing measurement templates.

### `MeasurementSettings`
Allows users to configure their measurement preferences.

## Usage

### Creating a New Template
1. Navigate to "Measurements" in the sidebar
2. Click "New Template"
3. Enter a name and select a gender
4. Add measurement fields with names and units
5. Click "Create Template"

### Editing a Template
1. Click the edit (pencil) icon on the template card
2. Make your changes
3. Click "Update Template"

### Archiving a Template
1. Click the archive (box) icon on the template card
2. Confirm the action

### Setting Default Units
1. Go to the "Settings" tab in the Measurements section
2. Select your preferred default unit (inches or centimeters)
3. Click "Save Changes"

## Best Practices

1. **Use Descriptive Names**: Name your templates and fields clearly to make them easy to identify.
2. **Keep It Simple**: Only include the measurements you actually need for your work.
3. **Use Default Templates**: Start with the default templates and customize them as needed.
4. **Archive Instead of Delete**: Archive templates you're not currently using instead of deleting them, in case you need them later.
5. **Set Default Units**: Configure your preferred units in the settings to save time when creating new templates.
