// Helper function to clean title text
function cleanTitle(title) {
    return title
        .trim()
        .replace(/[*_`#]/g, '') // Remove markdown characters
        .replace(/^\s*[-•]\s*/, '') // Remove leading bullet points
        .trim();
}

// Wait for Supabase to be initialized
function initDashboard() {
    if (!window.supabase) {
        console.error('Supabase not initialized');
        return;
    }

    const supabase = window.supabase;
    console.log('Dashboard initialized with Supabase');

    // Load user stats
    async function loadStats() {
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) {
                console.error('No session found');
                return;
            }

            const userId = session.user.id;
            console.log('Loading stats for user:', userId);

            // Get bot count
            const { data: bots, error: botsError } = await supabase
                .from('bots')
                .select('id')
                .eq('user_id', userId);
            
            if (!botsError) {
                const botCount = document.querySelector('[data-stat="bot-count"]');
                if (botCount) {
                    botCount.textContent = bots.length;
                }
            }

            // Get topics count
            const { data: topics, error: topicsError } = await supabase
                .from('debate_topics')
                .select('id')
                .eq('user_id', userId);
            
            if (!topicsError) {
                const topicCount = document.querySelector('[data-stat="topic-count"]');
                if (topicCount) {
                    topicCount.textContent = topics.length;
                }
            }

            // Get debates count
            const { data: debates, error: debatesError } = await supabase
                .from('debate_actions')
                .select(`
                    id,
                    bots!inner(user_id)
                `)
                .eq('bots.user_id', userId);
            
            if (!debatesError) {
                const debateCount = document.querySelector('[data-stat="debate-count"]');
                if (debateCount) {
                    debateCount.textContent = debates.length;
                }
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    // Bot Management
    async function loadBots() {
        const botsGrid = document.querySelector('[data-bots-grid]');
        if (!botsGrid) return;

        try {
            const { data: bots, error } = await supabase
                .from('bots')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Create bot section container
            botsGrid.innerHTML = `
                <div class="bots-section">
                    <div class="bots-header">
                        <h2>Your Debate Bots</h2>
                        <button onclick="showBotForm()" class="create-bot-btn">Create New Bot</button>
                    </div>
                    <div class="bots-grid">
                        ${!bots.length ? '<p>No bots created yet. Create your first bot!</p>' :
                            bots.map(bot => `
                                <div class="bot-card">
                                    <div class="bot-header">
                                        <h3>${bot.name}</h3>
                                        <div class="bot-actions">
                                            <button onclick="deleteBot('${bot.id}')" class="action-btn delete-btn" title="Delete Bot">🗑️</button>
                                        </div>
                                    </div>
                                    <p class="bot-role">${bot.role}</p>
                                    <p class="bot-personality">${bot.personality}</p>
                                    <div class="bot-beliefs">
                                        ${bot.beliefs.map(belief => `<span class="belief-tag">${belief}</span>`).join('')}
                                    </div>
                                    <button onclick="showJoinDebateModal('${bot.id}')" class="debate-btn">Join Debate</button>
                                </div>
                            `).join('')
                        }
                    </div>
                </div>
            `;

            // Add styles
            const style = document.createElement('style');
            style.textContent = `
                .bots-section {
                    padding: 20px;
                }

                .bots-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .create-bot-btn {
                    padding: 8px 16px;
                    background: var(--primary);
                    color: var(--theme);
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }

                .bots-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 20px;
                }

                .bot-card {
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    padding: 16px;
                    background: var(--theme);
                }

                .bot-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 12px;
                }

                .bot-actions {
                    display: flex;
                    gap: 8px;
                }

                .delete-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                }

                .delete-btn:hover {
                    background: var(--border);
                }

                .bot-role, .bot-personality {
                    margin: 8px 0;
                    color: var(--secondary);
                }

                .bot-beliefs {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin: 12px 0;
                }

                .belief-tag {
                    background: var(--border);
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 0.9em;
                }

                .debate-btn {
                    width: 100%;
                    padding: 8px;
                    background: var(--primary);
                    color: var(--theme);
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-top: 12px;
                }

                .debate-btn:hover {
                    opacity: 0.9;
                }

                /* Join Debate Modal */
                .join-debate-modal {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 1000;
                    align-items: center;
                    justify-content: center;
                }

                .join-debate-content {
                    background: var(--theme);
                    padding: 2rem;
                    border-radius: var(--radius);
                    max-width: 600px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                }

                .topic-list {
                    margin: 1rem 0;
                }

                .topic-item {
                    padding: 1rem;
                    border: 1px solid var(--border);
                    border-radius: var(--radius);
                    margin-bottom: 1rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .topic-item:hover {
                    border-color: var(--primary);
                    transform: translateY(-2px);
                }

                .topic-item h3 {
                    margin: 0 0 0.5rem 0;
                    color: var(--primary);
                }

                .topic-item p {
                    margin: 0;
                    color: var(--secondary);
                }

                .modal-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                    margin-top: 1rem;
                }

                .modal-actions button {
                    padding: 0.5rem 1rem;
                    border-radius: var(--radius);
                    cursor: pointer;
                }

                .modal-actions .cancel-btn {
                    background: var(--border);
                    color: var(--primary);
                    border: none;
                }

                .modal-actions .join-btn {
                    background: var(--primary);
                    color: var(--theme);
                    border: none;
                }
            `;
            document.head.appendChild(style);
        } catch (error) {
            console.error('Error loading bots:', error);
            botsGrid.innerHTML = '<p class="error">Failed to load bots</p>';
        }
    }

    // Topic Management
    async function loadTopics() {
        const topicsList = document.querySelector('[data-topics-list]');
        if (!topicsList) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;

            const { data: topics, error } = await supabase
                .from('debate_topics')
                .select(`
                    *,
                    topic_votes!topic_votes_topic_id_fkey (
                        topic_id,
                        user_id
                    )
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error loading topics:', error);
                throw error;
            }

            if (!topics.length) {
                topicsList.innerHTML = '<p>No topics submitted yet. Submit your first topic!</p>';
                return;
            }

            topicsList.innerHTML = topics.map(topic => `
                <div class="topic-card">
                    <h3>${cleanTitle(topic.title)}</h3>
                    <p>${topic.content}</p>
                    <div class="topic-stats">
                        <span>${topic.votes || 0} votes</span>
                        <span>Status: ${topic.status || 'New'}</span>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading topics:', error);
            topicsList.innerHTML = '<p class="error">Failed to load topics</p>';
        }
    }

    // Load voteable topics
    async function loadVoteableTopics() {
        const topicsList = document.querySelector('[data-voteable-topics-list]');
        if (!topicsList) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;

            const { data: topics, error } = await supabase
                .from('debate_topics')
                .select(`
                    *,
                    topic_votes!topic_votes_topic_id_fkey (
                        topic_id,
                        user_id
                    )
                `)
                .not('status', 'eq', 'completed')
                .order('votes', { ascending: false });

            if (error) {
                console.error('Error loading voteable topics:', error);
                throw error;
            }

            if (!topics.length) {
                topicsList.innerHTML = '<p>No topics available for voting.</p>';
                return;
            }

            topicsList.innerHTML = topics.map(topic => `
                <div class="topic-card">
                    <h3>${cleanTitle(topic.title)}</h3>
                    <p>${topic.content}</p>
                    <div class="topic-stats">
                        <span>${topic.votes || 0} votes</span>
                        <span>Status: ${topic.status || 'New'}</span>
                    </div>
                    <div class="topic-actions">
                        ${topic.topic_votes && topic.topic_votes.some(vote => vote.user_id === userId)
                            ? `<button onclick="unvoteTopic('${topic.id}')" class="vote-btn">Remove Vote</button>`
                            : `<button onclick="voteTopic('${topic.id}')" class="vote-btn">Vote</button>`
                        }
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading voteable topics:', error);
            topicsList.innerHTML = '<p class="error">Failed to load topics</p>';
        }
    }

    // Join Debate Modal
    async function showJoinDebateModal(botId) {
        try {
            // First get the topic IDs that the bot is already debating
            const { data: existingActions, error: actionsError } = await supabase
                .from('debate_actions')
                .select('topic_id')
                .eq('bot_id', botId)
                .in('status', ['pending', 'in_progress']);

            if (actionsError) throw actionsError;

            // Get the topic IDs to exclude
            const excludeTopicIds = existingActions.map(action => action.topic_id);

            // Get completed topics that the bot hasn't already debated
            const { data: topics, error: topicsError } = await supabase
                .from('debate_topics')
                .select('id, title, content, created_at, user_id, votes, status')
                .eq('status', 'completed')
                .not('id', 'in', excludeTopicIds.length > 0 ? `(${excludeTopicIds.join(',')})` : '(00000000-0000-0000-0000-000000000000)');

            if (topicsError) throw topicsError;

            // Create modal
            const modal = document.createElement('div');
            modal.className = 'join-debate-modal';
            modal.style.display = 'flex';
            modal.innerHTML = `
                <div class="join-debate-content">
                    <h2>Select a Topic to Join</h2>
                    <div class="topic-list">
                        ${topics.length === 0 ? '<p>No available topics to join.</p>' :
                            topics.map(topic => `
                                <div class="topic-item" onclick="joinDebate('${botId}', '${topic.id}')">
                                    <h3>${cleanTitle(topic.title)}</h3>
                                    <p>${topic.content}</p>
                                    <small>${topic.votes || 0} votes</small>
                                </div>
                            `).join('')
                        }
                    </div>
                    <div class="modal-actions">
                        <button class="cancel-btn" onclick="closeJoinDebateModal()">Cancel</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Close on background click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeJoinDebateModal();
                }
            });
        } catch (error) {
            console.error('Error showing join debate modal:', error);
            showError('Failed to load available topics');
        }
    }

    function closeJoinDebateModal() {
        const modal = document.querySelector('.join-debate-modal');
        if (modal) {
            modal.remove();
        }
    }

    async function joinDebate(botId, topicId) {
        try {
            const { error } = await supabase
                .from('debate_actions')
                .insert({
                    bot_id: botId,
                    topic_id: topicId,
                    status: 'pending'
                });

            if (error) throw error;

            closeJoinDebateModal();
            showSuccess('Successfully joined debate');
            loadBots(); // Refresh the bots list
        } catch (error) {
            console.error('Error joining debate:', error);
            showError('Failed to join debate');
        }
    }

    // Form Handlers
    async function handleBotSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);

        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) {
                throw new Error('No session found');
            }

            const botData = {
                name: formData.get('name'),
                role: formData.get('role'),
                personality: formData.get('personality'),
                beliefs: Array.from(formData.getAll('beliefs[]')).filter(belief => belief),
                user_id: session.user.id
            };

            const { error } = await supabase
                .from('bots')
                .insert(botData);

            if (error) throw error;

            hideBotForm();
            loadBots();
            showSuccess('Bot created successfully');
        } catch (error) {
            console.error('Error creating bot:', error);
            showError('Failed to create bot');
        }
    }

    async function handleTopicSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);

        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) {
                throw new Error('No session found');
            }

            const topicData = {
                title: cleanTitle(formData.get('title')),
                content: formData.get('content'),
                user_id: session.user.id
            };

            const { error } = await supabase
                .from('debate_topics')
                .insert(topicData);

            if (error) throw error;

            hideTopicForm();
            loadTopics();
            showSuccess('Topic submitted successfully');
        } catch (error) {
            console.error('Error submitting topic:', error);
            showError('Failed to submit topic');
        }
    }

    // Voting Functions
    async function voteTopic(topicId) {
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) {
                throw new Error('No session found');
            }

            const { error } = await supabase
                .from('topic_votes')
                .insert({
                    topic_id: topicId,
                    user_id: session.user.id
                });

            if (error) throw error;
            loadVoteableTopics();
        } catch (error) {
            console.error('Error voting for topic:', error);
            showError('Failed to vote for topic');
        }
    }

    async function unvoteTopic(topicId) {
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) {
                throw new Error('No session found');
            }

            // Delete using composite key
            const { error: deleteError } = await supabase
                .from('topic_votes')
                .delete()
                .eq('topic_id', topicId)
                .eq('user_id', session.user.id);

            if (deleteError) throw deleteError;
            loadVoteableTopics();
            showSuccess('Vote removed successfully');
        } catch (error) {
            console.error('Error removing vote:', error);
            showError('Failed to remove vote: ' + error.message);
        }
    }

    // Delete bot function
    async function deleteBot(botId) {
        if (!confirm('Are you sure you want to delete this bot?')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('bots')
                .delete()
                .eq('id', botId);

            if (error) throw error;

            loadBots();
            showSuccess('Bot deleted successfully');
        } catch (error) {
            console.error('Error deleting bot:', error);
            showError('Failed to delete bot');
        }
    }

    // UI Helpers
    function showBotForm() {
        document.getElementById('bot-form').style.display = 'block';
    }

    function hideBotForm() {
        document.getElementById('bot-form').style.display = 'none';
    }

    function showTopicForm() {
        document.getElementById('topic-form').style.display = 'block';
    }

    function hideTopicForm() {
        document.getElementById('topic-form').style.display = 'none';
    }

    function addBeliefInput() {
        const container = document.getElementById('beliefs-container');
        const inputs = container.querySelectorAll('input[name="beliefs[]"]');
        
        if (inputs.length >= 5) {
            showError('Maximum 5 beliefs allowed');
            return;
        }

        const div = document.createElement('div');
        div.className = 'belief-input';
        div.innerHTML = `
            <input type="text" name="beliefs[]" required>
            <button type="button" onclick="this.parentElement.remove()">-</button>
        `;
        container.appendChild(div);
    }

    function showSuccess(message) {
        const container = document.getElementById('error-container');
        container.textContent = message;
        container.style.display = 'block';
        container.className = 'success-message';
        setTimeout(() => {
            container.style.display = 'none';
        }, 3000);
    }

    function showError(message) {
        const container = document.getElementById('error-container');
        container.textContent = message;
        container.style.display = 'block';
        container.className = 'error-message';
        setTimeout(() => {
            container.style.display = 'none';
        }, 3000);
    }

    // Initialize dashboard
    loadStats();
    loadBots();
    loadTopics();
    loadVoteableTopics();

    // Export functions to window for global access
    window.showBotForm = showBotForm;
    window.hideBotForm = hideBotForm;
    window.showTopicForm = showTopicForm;
    window.hideTopicForm = hideTopicForm;
    window.handleBotSubmit = handleBotSubmit;
    window.handleTopicSubmit = handleTopicSubmit;
    window.addBeliefInput = addBeliefInput;
    window.voteTopic = voteTopic;
    window.unvoteTopic = unvoteTopic;
    window.deleteBot = deleteBot;
    window.showJoinDebateModal = showJoinDebateModal;
    window.closeJoinDebateModal = closeJoinDebateModal;
    window.joinDebate = joinDebate;
}

// Wait for both DOM and Supabase to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Small delay to ensure Supabase is initialized
        setTimeout(initDashboard, 100);
    });
} else {
    setTimeout(initDashboard, 100);
}