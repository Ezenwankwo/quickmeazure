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
      <h1 class="text-2xl font-bold">Add New Style</h1>
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
    alert('Style name is required');
    return;
  }
  
  isSaving.value = true;
  
  try {
    // Simulate API call to save style
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In a real app, this would upload the image and save to the database
    console.log('Style saved:', {
      name: style.value.name,
      description: style.value.description,
      imageFile: style.value.imageFile ? style.value.imageFile.name : null
    });
    
    // Navigate back to styles list
    navigateTo('/styles');
  } catch (error) {
    console.error('Error saving style:', error);
    alert('Failed to save style. Please try again.');
  } finally {
    isSaving.value = false;
  }
};
</script>