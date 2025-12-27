/**
 * SheerID Verification Service
 * 
 * Integrates with SheerID to verify student/faculty status
 * Documentation: https://developer.sheerid.com/
 */

// SheerID Program ID - Replace with your actual program ID from SheerID dashboard
const SHEERID_PROGRAM_ID = import.meta.env.VITE_SHEERID_PROGRAM_ID || 'YOUR_PROGRAM_ID';

// SheerID API base URL
const SHEERID_API_URL = 'https://services.sheerid.com/rest/v2';

/**
 * Initialize SheerID verification
 * Opens the SheerID verification modal/iframe
 */
export const initSheerIDVerification = (options = {}) => {
  return new Promise((resolve, reject) => {
    const {
      programId = SHEERID_PROGRAM_ID,
      segment = 'student', // 'student', 'teacher', 'military', etc.
      onSuccess,
      onError,
      onClose
    } = options;

    // Check if SheerID SDK is loaded
    if (typeof window.sheerId === 'undefined') {
      // Load SheerID SDK dynamically
      loadSheerIDSDK()
        .then(() => openVerification(programId, segment, resolve, reject, onSuccess, onError, onClose))
        .catch(reject);
    } else {
      openVerification(programId, segment, resolve, reject, onSuccess, onError, onClose);
    }
  });
};

/**
 * Load SheerID JavaScript SDK
 */
const loadSheerIDSDK = () => {
  return new Promise((resolve, reject) => {
    if (document.getElementById('sheerid-sdk')) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = 'sheerid-sdk';
    script.src = 'https://cdn.sheerid.com/js/sheerid.js';
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load SheerID SDK'));
    document.head.appendChild(script);
  });
};

/**
 * Open SheerID verification form
 */
const openVerification = (programId, segment, resolve, reject, onSuccess, onError, onClose) => {
  try {
    // For demo/testing without real SheerID account
    if (programId === 'YOUR_PROGRAM_ID' || programId === 'demo') {
      console.warn('SheerID: Running in demo mode. Set VITE_SHEERID_PROGRAM_ID for production.');
      // Simulate verification for demo
      simulateDemoVerification(resolve, reject, onSuccess, onError);
      return;
    }

    // Real SheerID integration
    window.sheerId.setOptions({
      programId: programId,
      segment: segment,
      container: '#sheerid-container',
      onSuccess: (response) => {
        console.log('SheerID verification successful:', response);
        if (onSuccess) onSuccess(response);
        resolve(response);
      },
      onError: (error) => {
        console.error('SheerID verification error:', error);
        if (onError) onError(error);
        reject(error);
      },
      onClose: () => {
        if (onClose) onClose();
      }
    });

    window.sheerId.open();
  } catch (error) {
    reject(error);
  }
};

/**
 * Demo verification simulation (for testing without SheerID account)
 */
const simulateDemoVerification = (resolve, reject, onSuccess, onError) => {
  // Create a demo modal
  const modal = document.createElement('div');
  modal.id = 'sheerid-demo-modal';
  modal.innerHTML = `
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
  
  document.body.appendChild(modal);
  
  const closeModal = () => {
    modal.remove();
  };
  
  document.getElementById('demo-cancel').onclick = () => {
    closeModal();
    reject(new Error('Verification cancelled'));
  };
  
  document.getElementById('demo-verify').onclick = () => {
    const email = document.getElementById('demo-email').value;
    const institution = document.getElementById('demo-institution').value;
    
    if (!email || !institution) {
      alert('Please fill in all fields');
      return;
    }
    
    // Simulate verification delay
    const btn = document.getElementById('demo-verify');
    btn.textContent = 'Verifying...';
    btn.disabled = true;
    
    setTimeout(() => {
      closeModal();
      
      const response = {
        verificationId: 'demo_' + Date.now(),
        status: 'approved',
        segment: 'student',
        email: email,
        organization: {
          name: institution,
          id: 'demo_org_' + Date.now()
        },
        verifiedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        demoMode: true
      };
      
      if (onSuccess) onSuccess(response);
      resolve(response);
    }, 1500);
  };
};

/**
 * Check verification status by verification ID
 */
export const checkVerificationStatus = async (verificationId) => {
  if (verificationId.startsWith('demo_')) {
    return {
      status: 'approved',
      demoMode: true
    };
  }

  try {
    const response = await fetch(`${SHEERID_API_URL}/verification/${verificationId}`, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SHEERID_API_KEY || ''}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to check verification status');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error checking verification status:', error);
    throw error;
  }
};

/**
 * Verify if a verification is still valid (not expired)
 */
export const isVerificationValid = (verification) => {
  if (!verification) return false;
  if (verification.status !== 'approved') return false;
  
  if (verification.expiresAt) {
    const expiryDate = new Date(verification.expiresAt);
    if (expiryDate < new Date()) {
      return false;
    }
  }
  
  return true;
};

export default {
  initSheerIDVerification,
  checkVerificationStatus,
  isVerificationValid
};
