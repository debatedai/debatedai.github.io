document.addEventListener('DOMContentLoaded', function() {
    console.log('Debaters script loaded');
    
    // Detailed logging and error handling
    try {
        const debaterProfiles = document.querySelectorAll('.debater-profile');
        console.log('Found debater profiles:', debaterProfiles.length);
        
        if (debaterProfiles.length === 0) {
            console.error('No debater profiles found on the page');
            return;
        }

        let activeInfo = null;

        function hideAllInfos() {
            const infoPanels = document.querySelectorAll('.debater-info');
            infoPanels.forEach(info => {
                if (info) {
                    info.classList.add('hidden');
                } else {
                    console.warn('Encountered null info panel during hideAllInfos');
                }
            });
            activeInfo = null;
        }

        // Initially hide all info panels
        hideAllInfos();

        debaterProfiles.forEach((profile, index) => {
            // Updated selector to handle nested structure
            const avatar = profile.querySelector('.debater-content .debater-avatar');
            const info = profile.querySelector('.debater-content .debater-info');
            
            if (!avatar) {
                console.error(`No avatar found for profile ${index}`, profile);
                return;
            }

            if (!info) {
                console.error(`No info panel found for profile ${index}`, profile);
                return;
            }

            // Explicit null check before adding event listener
            avatar.addEventListener('click', function(event) {
                console.log(`Avatar ${index} clicked`, { avatar, info });
                event.stopPropagation();
                
                // Explicit null checks
                if (!info) {
                    console.error(`Info panel is null for avatar ${index}`);
                    return;
                }

                if (info.classList.contains('hidden')) {
                    // Hide any active info panel
                    hideAllInfos();
                    // Show this info panel
                    info.classList.remove('hidden');
                    activeInfo = info;
                } else {
                    // If info is already visible, hide it
                    info.classList.add('hidden');
                    activeInfo = null;
                }
            });
        });

        // Close info panel when clicking outside
        document.addEventListener('click', function(event) {
            if (!event.target.closest('.debater-profile')) {
                hideAllInfos();
            }
        });

    } catch (error) {
        console.error('Critical error in debaters script:', error);
    }
});

// Utility function for debugging
function debugDOMStructure() {
    const profiles = document.querySelectorAll('.debater-profile');
    console.log('Debugging DOM Structure:');
    profiles.forEach((profile, index) => {
        console.log(`Profile ${index}:`, {
            profile: profile,
            avatarExists: !!profile.querySelector('.debater-content .debater-avatar'),
            infoExists: !!profile.querySelector('.debater-content .debater-info')
        });
    });
}

// Optional: Call debug function after a short delay to ensure DOM is fully loaded
setTimeout(debugDOMStructure, 500);