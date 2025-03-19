// Use the global Supabase instance
const supabase = window.supabase;

// Handle Google Sign In
async function signInWithGoogle() {
    try {
        console.log('Attempting to sign in with Google...');
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/dashboard`,
            },
        });
        if (error) throw error;
        console.log('Sign in successful:', data);
    } catch (error) {
        console.error('Error signing in with Google:', error);
        showError('Failed to sign in with Google');
    }
}

// Handle Sign Out
async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        window.location.href = '/';
    } catch (error) {
        console.error('Error signing out:', error);
        showError('Failed to sign out');
    }
}

// Get current session
async function getCurrentSession() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        return session;
    } catch (error) {
        console.error('Error getting session:', error);
        return null;
    }
}

// Update UI based on auth state
async function updateAuthUI() {
    const session = await getCurrentSession();
    const authButtons = document.querySelectorAll('[data-auth-action]');
    const userMenus = document.querySelectorAll('[data-user-menu]');
    
    console.log('Current session:', session);
    
    authButtons.forEach(button => {
        if (session) {
            if (button.dataset.authAction === 'sign-in') {
                button.style.display = 'none';
            } else {
                button.style.display = 'block';
            }
        } else {
            if (button.dataset.authAction === 'sign-in') {
                button.style.display = 'block';
            } else {
                button.style.display = 'none';
            }
        }
    });

    userMenus.forEach(menu => {
        if (session) {
            menu.style.display = 'block';
            const userEmail = menu.querySelector('[data-user-email]');
            if (userEmail) {
                userEmail.textContent = session.user.email;
            }
        } else {
            menu.style.display = 'none';
        }
    });
}

// Show error message
function showError(message) {
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
        setTimeout(() => {
            errorContainer.style.display = 'none';
        }, 5000);
    }
}

// Initialize auth functionality
function initAuth() {
    if (!window.supabase) {
        console.error('Supabase not initialized');
        return;
    }

    console.log('Auth script loaded');
    
    // Set up auth button listeners
    const authButtons = document.querySelectorAll('[data-auth-action]');
    console.log('Found auth buttons:', authButtons.length);

    authButtons.forEach(button => {
        button.addEventListener('click', () => {
            const action = button.dataset.authAction;
            console.log('Auth action clicked:', action);
            if (action === 'sign-in') {
                signInWithGoogle();
            } else if (action === 'sign-out') {
                signOut();
            }
        });
    });

    // Update UI on initial load
    updateAuthUI();

    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session);
        updateAuthUI();
        if (event === 'SIGNED_IN') {
            // Redirect to dashboard if not already there
            if (!window.location.pathname.includes('/dashboard')) {
                window.location.href = '/dashboard';
            }
        } else if (event === 'SIGNED_OUT') {
            // Redirect to home if on a protected page
            if (window.location.pathname.includes('/dashboard')) {
                window.location.href = '/';
            }
        }
    });
}

// Wait for both DOM and Supabase to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Small delay to ensure Supabase is initialized
        setTimeout(initAuth, 100);
    });
} else {
    setTimeout(initAuth, 100);
}