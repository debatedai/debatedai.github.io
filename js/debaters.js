function toggleDebate(element) {
    const perspectives = element.nextElementSibling;
    const expandIcon = element.querySelector('.expand-icon');
    
    perspectives.classList.toggle('collapsed');
    expandIcon.classList.toggle('expanded');
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Debaters script loaded');
    
    const debaterProfiles = document.querySelectorAll('.debater-profile');
    console.log('Found debater profiles:', debaterProfiles.length);
    
    let activeInfo = null;

    function hideAllInfos() {
        document.querySelectorAll('.debater-info').forEach(info => {
            info.style.display = 'none';
        });
        activeInfo = null;
    }

    // Initially hide all info panels
    hideAllInfos();

    debaterProfiles.forEach(profile => {
        const avatar = profile.querySelector('.debater-avatar');
        const info = profile.querySelector('.debater-info');
        
        if (avatar && info) {
            // Set initial styles
            info.style.cssText = `
                position: absolute;
                top: 120px;
                left: 50%;
                transform: translateX(-50%);
                width: 280px;
                background: var(--entry);
                padding: 1.5rem;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                border: 1px solid var(--border);
                text-align: left;
                z-index: 100;
                display: none;
            `;

            avatar.addEventListener('click', function(event) {
                console.log('Avatar clicked');
                event.stopPropagation();
                
                if (info === activeInfo) {
                    // If clicking the active avatar, hide it
                    hideAllInfos();
                } else {
                    // Hide any active info panel
                    hideAllInfos();
                    // Show this info panel
                    info.style.display = 'block';
                    activeInfo = info;
                }
            });
        }
    });

    // Close info panel when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.debater-profile')) {
            hideAllInfos();
        }
    });
});