<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between mb-8">
      <div class="flex items-center">
        <UButton
          icon="i-heroicons-arrow-left"
          color="gray"
          variant="ghost"
          to="/styles"
          class="mr-2"
        />
        <h1 class="text-xl font-bold">Add New Style</h1>
      </div>
      
      <!-- Save Button at Top Right -->
      <UButton
        type="submit"
        color="primary"
        variant="solid"
        @click="saveStyle"
        class="px-6"
        :loading="isSaving"
        :disabled="!isFormValid"
      >
        Save Style
      </UButton>
    </div>
    
    <UCard class="bg-white">
      <form @submit.prevent="saveStyle" class="space-y-6">
        <!-- Style Information -->
        <div>
          <h2 class="text-lg font-medium mb-4">Style Information</h2>
          <div class="grid grid-cols-1 gap-6">
            <UFormField label="Style Name" name="name" required>
              <UInput
                v-model="style.name"
                placeholder="Enter style name"
                size="lg"
                class="w-full"
                required
              />
            </UFormField>
            
            <UFormField label="Description" name="description">
              <UTextarea
                v-model="style.description"
                placeholder="Describe the style"
                size="lg"
                class="w-full"
                :rows="4"
              />
            </UFormField>
            
            <UFormField label="Image" name="image" required>
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
            </UFormField>
          </div>
        </div>
        
        <!-- No action buttons here as we moved the save button to the top -->
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

// Computed property to check if form is valid
const isFormValid = computed(() => {
  return !!style.value.name && !!style.value.imageFile;
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
  // Validate form inputs
  if (!style.value.name) {
    useToast().add({
      title: 'Validation Error',
      description: 'Style name is required',
      color: 'red'
    });
    return;
  }
  
  if (!style.value.imageFile) {
    useToast().add({
      title: 'Validation Error',
      description: 'Image is required',
      color: 'red'
    });
    return;
  }
  
  isSaving.value = true;
  
  try {
    const { authFetch } = useApiAuth();
    
    // Handle image upload via FormData
    const formData = new FormData();
    formData.append('name', style.value.name);
    
    if (style.value.description) {
      formData.append('description', style.value.description);
    }
    
    // Add the file with both possible field names to ensure compatibility
    formData.append('file', style.value.imageFile);
    formData.append('image', style.value.imageFile);
    
    console.log('Submitting form with FormData:', {
      name: style.value.name,
      description: style.value.description,
      hasImage: !!style.value.imageFile,
      imageFileName: style.value.imageFile?.name,
      imageSize: style.value.imageFile?.size
    });
    
    // Send form data to the server for processing
    const { data: newStyle } = await authFetch('/api/styles', {
      method: 'POST',
      body: formData
    });
    
    console.log('Style created successfully:', newStyle.value);
    
    // Show success notification
    useToast().add({
      title: 'Style Created',
      description: 'Your style has been created successfully',
      color: 'green'
    });
    
    // Navigate to the style detail page
    navigateTo(`/styles/${newStyle.value.id}/detail`);
  } catch (error) {
    console.error('Error creating style:', error);
    if (error.data) {
      console.error('Server error details:', error.data);
    }
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
    
    // Enhanced error handling
    let errorMessage = 'Failed to create style. Please try again.';
    
    if (error.response) {
      const status = error.response.status;
      if (status === 413) {
        errorMessage = 'The image file is too large. Please use a smaller image.';
      } else if (status === 415) {
        errorMessage = 'The file format is not supported.';
      } else if (error.data?.statusMessage) {
        errorMessage = error.data.statusMessage;
      }
    }
    
    // Error notification (auth errors are handled by authFetch)
    if (!error.message?.includes('No authentication token')) {
      useToast().add({
        title: 'Error',
        description: errorMessage,
        color: 'red'
      });
    }
  } finally {
    isSaving.value = false;
  }
};
</script>