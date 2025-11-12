/**
 * Firebase Connection Test
 * Run this in browser console to verify Firebase is working
 */

import { storage, db } from './config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export async function testFirebaseConnection() {
  console.log('🧪 Testing Firebase connection...');
  const results = [];
  
  try {
    // Test 1: Storage Write
    console.log('📤 Test 1: Uploading to Firebase Storage...');
    const testBlob = new Blob(['Hello Firebase! Test from ' + new Date().toISOString()], { 
      type: 'text/plain' 
    });
    const storageRef = ref(storage, 'test/connection_test.txt');
    await uploadBytes(storageRef, testBlob);
    results.push('✅ Storage write successful');
    console.log('✅ Storage write successful');
    
    // Test 2: Storage Read
    console.log('📥 Test 2: Reading from Firebase Storage...');
    const url = await getDownloadURL(storageRef);
    results.push('✅ Storage read successful');
    results.push(`   URL: ${url}`);
    console.log('✅ Storage read successful');
    console.log('   URL:', url);
    
    // Test 3: Firestore Write
    console.log('💾 Test 3: Writing to Firestore...');
    const testDoc = doc(db, 'test', 'connection_test');
    await setDoc(testDoc, {
      message: 'Hello Firestore!',
      timestamp: new Date().toISOString(),
      testRun: Date.now()
    });
    results.push('✅ Firestore write successful');
    console.log('✅ Firestore write successful');
    
    // Test 4: Firestore Read
    console.log('📖 Test 4: Reading from Firestore...');
    const docSnap = await getDoc(testDoc);
    if (docSnap.exists()) {
      results.push('✅ Firestore read successful');
      results.push(`   Data: ${JSON.stringify(docSnap.data(), null, 2)}`);
      console.log('✅ Firestore read successful');
      console.log('   Data:', docSnap.data());
    } else {
      throw new Error('Document not found after write');
    }
    
    // All tests passed!
    console.log('\n🎉 All Firebase tests passed!');
    console.log('Your Firebase integration is working correctly.');
    
    return {
      success: true,
      message: 'All Firebase tests passed!',
      details: results
    };
    
  } catch (error) {
    console.error('\n❌ Firebase test failed:', error);
    console.error('Please check:');
    console.error('1. Firebase project is created');
    console.error('2. Storage and Firestore are enabled');
    console.error('3. .env file has correct credentials');
    console.error('4. Dev server was restarted after adding .env');
    
    return {
      success: false,
      error: error.message,
      details: results
    };
  }
}

// Auto-run test when in development
if (import.meta.env.DEV) {
  console.log('🔧 Firebase test utility loaded');
  console.log('Run testFirebaseConnection() to verify Firebase setup');
}

export default testFirebaseConnection;
