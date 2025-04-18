<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-6">Database Test Page</h1>
    
    <UCard class="mb-6">
      <UButton @click="testOrderCreation" :loading="isLoading" color="primary">
        Test Order Creation
      </UButton>
      
      <div v-if="result" class="mt-4">
        <h2 class="text-lg font-semibold mb-2">Result:</h2>
        <UCard class="bg-gray-50">
          <pre class="whitespace-pre-wrap">{{ JSON.stringify(result, null, 2) }}</pre>
        </UCard>
      </div>
      
      <div v-if="error" class="mt-4">
        <h2 class="text-lg font-semibold mb-2 text-red-600">Error:</h2>
        <UCard class="bg-red-50">
          <pre class="whitespace-pre-wrap text-red-600">{{ JSON.stringify(error, null, 2) }}</pre>
        </UCard>
      </div>
    </UCard>
    
    <UCard>
      <h2 class="text-lg font-semibold mb-2">Alternative Test Methods:</h2>
      <div class="space-y-4">
        <UButton @click="testRawSqlite" :loading="isLoading" color="blue">
          Test Raw SQLite
        </UButton>
        
        <UButton @click="testLibSql" :loading="isLoading" color="green" class="ml-4">
          Test LibSQL
        </UButton>
        
        <UButton @click="testDrizzle" :loading="isLoading" color="orange" class="ml-4">
          Test Drizzle
        </UButton>
        
        <UButton @click="testMinimal" :loading="isLoading" color="red" class="ml-4">
          Test Minimal
        </UButton>
      </div>
    </UCard>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuth } from '~/composables/useAuth';

// Status tracking
const isLoading = ref(false);
const result = ref(null);
const error = ref(null);

// Test order creation with our test endpoint
const testOrderCreation = async () => {
  isLoading.value = true;
  result.value = null;
  error.value = null;
  
  try {
    // Get auth token
    const auth = useAuth();
    const token = auth.token.value;
    
    if (!token) {
      error.value = 'Authentication required';
      return;
    }
    
    // Call the test endpoint
    const response = await $fetch('/api/orders/test', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    result.value = response;
  } catch (err) {
    console.error('Test failed:', err);
    error.value = err.message || 'Unknown error';
    
    if (err.response) {
      error.value = {
        status: err.response.status,
        statusText: err.response.statusText,
        data: err.response._data
      };
    }
  } finally {
    isLoading.value = false;
  }
};

// Test with raw SQLite
const testRawSqlite = async () => {
  isLoading.value = true;
  result.value = null;
  error.value = null;
  
  try {
    // Get auth token
    const auth = useAuth();
    const token = auth.token.value;
    
    if (!token) {
      error.value = 'Authentication required';
      return;
    }
    
    // Call a special endpoint that would use raw SQLite
    const response = await $fetch('/api/orders/test?method=sqlite', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    result.value = response;
  } catch (err) {
    console.error('Raw SQLite test failed:', err);
    error.value = err.message || 'Unknown error';
    
    if (err.response) {
      error.value = {
        status: err.response.status,
        statusText: err.response.statusText,
        data: err.response._data
      };
    }
  } finally {
    isLoading.value = false;
  }
};

// Test with LibSQL
const testLibSql = async () => {
  isLoading.value = true;
  result.value = null;
  error.value = null;
  
  try {
    // Get auth token
    const auth = useAuth();
    const token = auth.token.value;
    
    if (!token) {
      error.value = 'Authentication required';
      return;
    }
    
    // Call a special endpoint that would use LibSQL
    const response = await $fetch('/api/orders/test?method=libsql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    result.value = response;
  } catch (err) {
    console.error('LibSQL test failed:', err);
    error.value = err.message || 'Unknown error';
    
    if (err.response) {
      error.value = {
        status: err.response.status,
        statusText: err.response.statusText,
        data: err.response._data
      };
    }
  } finally {
    isLoading.value = false;
  }
};

// Test with Drizzle
const testDrizzle = async () => {
  isLoading.value = true;
  result.value = null;
  error.value = null;
  
  try {
    // Get auth token
    const auth = useAuth();
    const token = auth.token.value;
    
    if (!token) {
      error.value = 'Authentication required';
      return;
    }
    
    // Call a special endpoint that would use Drizzle
    const response = await $fetch('/api/orders/test?method=drizzle', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    result.value = response;
  } catch (err) {
    console.error('Drizzle test failed:', err);
    error.value = err.message || 'Unknown error';
    
    if (err.response) {
      error.value = {
        status: err.response.status,
        statusText: err.response.statusText,
        data: err.response._data
      };
    }
  } finally {
    isLoading.value = false;
  }
};

// Test with the minimal endpoint
const testMinimal = async () => {
  isLoading.value = true;
  result.value = null;
  error.value = null;
  
  try {
    // Get auth token
    const auth = useAuth();
    const token = auth.token.value;
    
    if (!token) {
      error.value = 'Authentication required';
      return;
    }
    
    // Call the minimal endpoint
    const response = await $fetch('/api/orders/minimal', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    result.value = response;
  } catch (err) {
    console.error('Minimal test failed:', err);
    error.value = err.message || 'Unknown error';
    
    if (err.response) {
      error.value = {
        status: err.response.status,
        statusText: err.response.statusText,
        data: err.response._data
      };
    }
  } finally {
    isLoading.value = false;
  }
};
</script> 