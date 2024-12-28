// Student verification integration using SheerID identity platform
// Provides academic status validation for students, faculty, and staff
// Includes demo mode for testing without live SheerID credentials
// Reference: https://developer.sheerid.com/

// Environment variable based program configuration
const SHEERID_PROGRAM_ID = import.meta.env.VITE_SHEERID_PROGRAM_ID || 'YOUR_PROGRAM_ID';
const SHEERID_API_BASE = 'https://services.sheerid.com/rest/v2';

// Entry point for SheerID verification workflow
// Returns promise that resolves with verification response
// Time complexity: O(1) for initialization, user-dependent for completion
export const initSheerIDVerification = (verificationOptions = {}) => {
  return new Promise((resolve, reject) => {
    const {
      programId = SHEERID_PROGRAM_ID,
      segment = 'student',
      onSuccess,
      onError,
      onClose
    } = verificationOptions;

    // Load SheerID SDK if not already present in DOM
    if (typeof window.sheerId === 'undefined') {
      loadSheerIDSDK()
        .then(() => openVerification(programId, segment, resolve, reject, onSuccess, onError, onClose))
        .catch(reject);
    } else {
      openVerification(programId, segment, resolve, reject, onSuccess, onError, onClose);
    }
  });
};

// Dynamic SDK loader - injects SheerID script into document head
// Time complexity: O(1)
const loadSheerIDSDK = () => {
  return new Promise((resolve, reject) => {
    if (document.getElementById('sheerid-sdk')) {
      resolve();
      return;
    }

    const sdkScript = document.createElement('script');
    sdkScript.id = 'sheerid-sdk';
    sdkScript.src = 'https://cdn.sheerid.com/js/sheerid.js';
    sdkScript.async = true;
    sdkScript.onload = resolve;
    sdkScript.onerror = () => reject(new Error('SheerID SDK failed to load'));
    document.head.appendChild(sdkScript);
  });
};

// Launch verification modal with configured options
// Handles both real SDK and demo mode fallback
const openVerification = (programId, segment, resolve, reject, onSuccess, onError, onClose) => {
  try {
    // Check for demo mode when no real program ID configured
    if (programId === 'YOUR_PROGRAM_ID' || programId === 'demo') {
      console.warn('SheerID running in demo mode - configure VITE_SHEERID_PROGRAM_ID for production');
      simulateDemoVerification(resolve, reject, onSuccess, onError);
      return;
    }

    // Initialize real SheerID verification flow
    window.sheerId.setOptions({
      programId: programId,
      segment: segment,
      container: '#sheerid-container',
      onSuccess: (verificationResponse) => {
        console.log('Verification completed successfully:', verificationResponse);
        if (onSuccess) onSuccess(verificationResponse);
        resolve(verificationResponse);
      },
      onError: (verificationError) => {
        console.error('Verification failed:', verificationError);
        if (onError) onError(verificationError);
        reject(verificationError);
      },
      onClose: () => {
        if (onClose) onClose();
      }
    });

    window.sheerId.open();
  } catch (err) {
    reject(err);
  }
};

// Demo verification UI for testing without live SheerID credentials
// Creates styled modal with form inputs for simulated verification
const simulateDemoVerification = (resolve, reject, onSuccess, onError) => {
  const demoModalElement = document.createElement('div');
  demoModalElement.id = 'sheerid-demo-modal';
  demoModalElement.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    ">
      <div style="
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        padding: 32px;
        border-radius: 16px;
        max-width: 400px;
        width: 90%;
        border: 1px solid rgba(255,255,255,0.1);
        color: white;
      ">
        <h2 style="margin: 0 0 8px 0; font-size: 1.5rem;">🎓 Student Verification</h2>
        <p style="color: #888; margin-bottom: 24px; font-size: 0.9rem;">
          Demo Mode - In production, this would use SheerID's verification form.
        </p>
        
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 6px; font-size: 0.85rem; color: #aaa;">
            School Email (.edu)
          </label>
          <input 
            type="email" 
            id="demo-email"
            placeholder="student@university.edu"
            style="
              width: 100%;
              padding: 12px;
              background: rgba(255,255,255,0.05);
              border: 1px solid rgba(255,255,255,0.1);
              border-radius: 8px;
              color: white;
              font-size: 1rem;
              box-sizing: border-box;
            "
          />
        </div>
        
        <div style="margin-bottom: 24px;">
          <label style="display: block; margin-bottom: 6px; font-size: 0.85rem; color: #aaa;">
            Institution Name
          </label>
          <input 
            type="text" 
            id="demo-institution"
            placeholder="University Name"
            style="
              width: 100%;
              padding: 12px;
              background: rgba(255,255,255,0.05);
              border: 1px solid rgba(255,255,255,0.1);
              border-radius: 8px;
              color: white;
              font-size: 1rem;
              box-sizing: border-box;
            "
          />
        </div>
        
        <div style="display: flex; gap: 12px;">
          <button 
            id="demo-cancel"
            style="
              flex: 1;
              padding: 12px;
              background: transparent;
              border: 1px solid rgba(255,255,255,0.2);
              border-radius: 8px;
              color: white;
              cursor: pointer;
              font-size: 0.95rem;
            "
          >
            Cancel
          </button>
          <button 
            id="demo-verify"
            style="
              flex: 1;
              padding: 12px;
              background: linear-gradient(135deg, #6366f1, #8b5cf6);
              border: none;
              border-radius: 8px;
              color: white;
              cursor: pointer;
              font-weight: 600;
              font-size: 0.95rem;
            "
          >
            Verify
          </button>
        </div>
        
        <p style="margin-top: 16px; font-size: 0.75rem; color: #666; text-align: center;">
          Powered by SheerID • Demo Mode
        </p>
      </div>
    </div>
  `;
  
  document.body.appendChild(demoModalElement);
  
  const dismissModal = () => {
    demoModalElement.remove();
  };
  
  document.getElementById('demo-cancel').onclick = () => {
    dismissModal();
    reject(new Error('Verification cancelled by user'));
  };
  
  document.getElementById('demo-verify').onclick = () => {
    const userEmail = document.getElementById('demo-email').value;
    const institutionName = document.getElementById('demo-institution').value;
    
    if (!userEmail || !institutionName) {
      alert('Please complete all required fields');
      return;
    }
    
    // Show loading state
    const verifyBtn = document.getElementById('demo-verify');
    verifyBtn.textContent = 'Verifying...';
    verifyBtn.disabled = true;
    
    // Simulate network latency for realism
    setTimeout(() => {
      dismissModal();
      
      const verificationResult = {
        verificationId: 'demo_' + Date.now(),
        status: 'approved',
        segment: 'student',
        email: userEmail,
        organization: {
          name: institutionName,
          id: 'demo_org_' + Date.now()
        },
        verifiedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        demoMode: true
      };
      
      if (onSuccess) onSuccess(verificationResult);
      resolve(verificationResult);
    }, 1500);
  };
};

/**
 / Query verification status from SheerID API
// Time complexity: O(1) API call
export const checkVerificationStatus = async (verificationId) => {
  // Handle demo mode identifiers
  if (verificationId.startsWith('demo_')) {
    return {
      status: 'approved',
      demoMode: true
    };
  }

  try {
    const apiResponse = await fetch(`${SHEERID_API_BASE}/verification/${verificationId}`, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SHEERID_API_KEY || ''}`
      }
    });
    
    if (!apiResponse.ok) {
      throw new Error('Verification status lookup failed');
    }
    
    return await apiResponse.json();
  } catch (err) {
    console.error('Error retrieving verification status:', err);
    throw err;
  }
};

// Validate verification has not expired and is approved
// Time complexity: O(1)
export const isVerificationValid = (verificationData) => {
  if (!verificationData) return false;
  if (verificationData.status !== 'approved') return false;
  
  // Check expiration date if present
  if (verificationData.expiresAt) {
    const expirationTimestamp = new Date(verificationData.expiresAt);
    const currentTimestamp = new Date();
    
    if (expirationTimestamp < currentTimestamp
    }
  }
  
  return true;
};

export default {
  initSheerIDVerification,
  checkVerificationStatus,
  isVerificationValid
};
