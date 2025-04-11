<template>
  <div class="space-y-6">
    <div class="flex items-center">
      <UButton
        icon="i-heroicons-arrow-left"
        color="gray"
        variant="ghost"
        :to="`/styles/${$route.params.id}/detail`"
        class="mr-4"
      />
      <h1 class="text-2xl font-bold">Edit Style</h1>
    </div>
    
    <!-- Loading state -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400" />
    </div>
    
    <!-- Error state -->
    <UAlert v-else-if="error" color="red" icon="i-heroicons-exclamation-triangle">
      <p>{{ error }}</p>
      <UButton color="red" variant="link" to="/styles" class="mt-2">
        Return to Styles
      </UButton>
    </UAlert>
    
    <UCard v-else class="bg-white">
      <form @submit.prevent="updateStyle" class="space-y-6">
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
            :to="`/styles/${$route.params.id}/detail`"
          >
            Cancel
          </UButton>
          
          <UButton
            type="submit"
            color="primary"
            :loading="isSaving"
          >
            Update Style
          </UButton>
        </div>
      </form>
    </UCard>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';

// Set page metadata
useHead({
  title: 'Edit Style - QuickMeazure',
});

const route = useRoute();
const router = useRouter();
const toast = useToast();

// Style data
const style = ref({
  name: '',
  description: '',
  imageUrl: null,
  imageFile: null
});

// UI state
const isLoading = ref(true);
const isSaving = ref(false);
const error = ref(null);
const imagePreview = ref(null);
const fileInput = ref(null);

// Fetch style data
onMounted(async () => {
  try {
    const styleId = route.params.id;
    isLoading.value = true;
    
    const { authFetch } = useApiAuth();
    
    // Fetch style data from API with authentication
    const response = await authFetch(`/api/styles/${styleId}`);
    
    // Set style data
    style.value = {
      ...response.style,
      imageFile: null
    };
    
    // Set image preview if available
    if (style.value.imageUrl) {
      imagePreview.value = style.value.imageUrl;
    }
    
    isLoading.value = false;
  } catch (err) {
    console.error('Error loading style details:', err);
    
    // Show error only if not an auth error (those are handled by authFetch)
    if (!err.message?.includes('No authentication token')) {
      error.value = 'Failed to load style details. Please try again.';
    }
    isLoading.value = false;
  }
});

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
    toast.add({
      title: 'File Too Large',
      description: 'File is too large. Maximum size is 5MB.',
      color: 'red'
    });
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

// Update style
const updateStyle = async () => {
  if (!style.value.name) {
    toast.add({
      title: 'Validation Error',
      description: 'Style name is required',
      color: 'red'
    });
    return;
  }
  
  isSaving.value = true;
  
  try {
    const { authFetch } = useApiAuth();
    const styleId = route.params.id;
    
    // Handle image upload via FormData if we have an image file
    let updatedStyle;
    
    if (style.value.imageFile) {
      // Use FormData to send the file directly to the server
      const formData = new FormData();
      formData.append('name', style.value.name);
      
      if (style.value.description !== undefined) {
        formData.append('description', style.value.description || '');
      }
      
      formData.append('image', style.value.imageFile);
      
      // Send form data to the server for processing
      updatedStyle = await authFetch(`/api/styles/${styleId}`, {
        method: 'PUT',
        body: formData
      });
    } else {
      // If no image changed, just send JSON data
      const styleData = {
        name: style.value.name,
        description: style.value.description || null
      };
      
      updatedStyle = await authFetch(`/api/styles/${styleId}`, {
        method: 'PUT',
        body: styleData
      });
    }
    
    // Show success notification
    toast.add({
      title: 'Style Updated',
      description: 'Your style has been updated successfully',
      color: 'green'
    });
    
    // Navigate to the style detail page
    router.push(`/styles/${styleId}/detail`);
  } catch (err) {
    console.error('Error updating style:', err);
    
    // Show error only if not an auth error (those are handled by authFetch)
    if (!err.message?.includes('No authentication token')) {
      toast.add({
        title: 'Error',
        description: 'Failed to update style. Please try again.',
        color: 'red'
      });
    }
  } finally {
    isSaving.value = false;
  }
};
</script> 