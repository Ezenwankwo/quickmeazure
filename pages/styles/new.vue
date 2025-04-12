<template>
  <div class="space-y-6">
    <div class="flex items-center">
      <UButton
        icon="i-heroicons-arrow-left"
        color="gray"
        variant="ghost"
        to="/styles"
        class="mr-4"
      />
      <h1 class="text-xl font-bold">Add New Style</h1>
    </div>
    
    <UCard class="bg-white">
      <form @submit.prevent="saveStyle" class="space-y-6">
        <!-- Style Information -->
        <div>
          <h2 class="text-lg font-medium mb-4">Style Information</h2>
          <div class="grid grid-cols-1 gap-6">
            <UFormGroup label="Style Name" name="name" required>
              <UInput
                v-model="style.name"
                placeholder="Enter style name"
                required
              />
            </UFormGroup>
            
            <UFormGroup label="Description" name="description">
              <UTextarea
                v-model="style.description"
                placeholder="Describe the style"
                rows="4"
              />
            </UFormGroup>
            
            <UFormGroup label="Image" name="image">
              <div class="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div v-if="imagePreview" class="mb-4">
                  <img :src="imagePreview" alt="Preview" class="max-h-64 mx-auto rounded" />
                </div>
                
                <div class="text-center">
                  <UButton
                    type="button"
                    color="gray"
                    variant="outline"
                    @click="triggerFileInput"
                  >
                    <template #leading>
                      <UIcon name="i-heroicons-photo" />
                    </template>
                    {{ imagePreview ? 'Change Image' : 'Upload Image' }}
                  </UButton>
                  
                  <input
                    ref="fileInput"
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="handleImageUpload"
                  />
                  
                  <p class="text-sm text-gray-500 mt-2">
                    Recommended: JPG, PNG or GIF. Max 5MB.
                  </p>
                </div>
              </div>
            </UFormGroup>
          </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="flex justify-end space-x-4">
          <UButton
            type="button"
            color="gray"
            variant="outline"
            to="/styles"
          >
            Cancel
          </UButton>
          
          <UButton
            type="submit"
            color="primary"
            :loading="isSaving"
          >
            Save Style
          </UButton>
        </div>
      </form>
    </UCard>
  </div>
</template>

<script setup>
// Set page metadata
useHead({
  title: 'Add New Style - QuickMeazure',
});

// Style data
const style = ref({
  name: '',
  description: '',
  imageFile: null
});

// UI state
const isSaving = ref(false);
const imagePreview = ref(null);
const fileInput = ref(null);

// Trigger file input click
const triggerFileInput = () => {
  fileInput.value.click();
};

// Handle image upload
const handleImageUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  // Check file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    alert('File is too large. Maximum size is 5MB.');
    return;
  }
  
  style.value.imageFile = file;
  
  // Create preview
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.value = e.target.result;
  };
  reader.readAsDataURL(file);
};

// Save style
const saveStyle = async () => {
  if (!style.value.name) {
    useToast().add({
      title: 'Validation Error',
      description: 'Style name is required',
      color: 'red'
    });
    return;
  }
  
  isSaving.value = true;
  
  try {
    const { authFetch } = useApiAuth();
    
    // Handle image upload via FormData if we have an image file
    let newStyle;
    
    if (style.value.imageFile) {
      // Use FormData to send the file directly to the server
      const formData = new FormData();
      formData.append('name', style.value.name);
      
      if (style.value.description) {
        formData.append('description', style.value.description);
      }
      
      formData.append('image', style.value.imageFile);
      
      // Send form data to the server for processing
      newStyle = await authFetch('/api/styles', {
        method: 'POST',
        body: formData
      });
    } else {
      // If no image, just send JSON data
      const styleData = {
        name: style.value.name,
        description: style.value.description || null
      };
      
      newStyle = await authFetch('/api/styles', {
        method: 'POST',
        body: styleData
      });
    }
    
    // Show success notification
    useToast().add({
      title: 'Style Created',
      description: 'Your style has been created successfully',
      color: 'green'
    });
    
    // Navigate to the style detail page
    navigateTo(`/styles/${newStyle.id}/detail`);
  } catch (error) {
    console.error('Error creating style:', error);
    
    // Error notification (auth errors are handled by authFetch)
    if (!error.message?.includes('No authentication token')) {
      useToast().add({
        title: 'Error',
        description: 'Failed to create style. Please try again.',
        color: 'red'
      });
    }
  } finally {
    isSaving.value = false;
  }
};
</script>