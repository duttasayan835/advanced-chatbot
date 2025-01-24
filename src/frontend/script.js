document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const fileUploadBtn = document.getElementById('file-upload-btn');
    const fileUploadInput = document.getElementById('file-upload');
    const typingIndicator = document.querySelector('.typing-indicator');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const searchBtn = document.getElementById('search-btn');

    let currentMode = 'chat';

    let attachments = [];

    function updateAttachmentCount() {
        const existingBadge = fileUploadBtn.querySelector('.attachment-badge');
        if (attachments.length > 0) {
            if (existingBadge) {
                existingBadge.textContent = attachments.length;
            } else {
                const badge = document.createElement('span');
                badge.className = 'attachment-badge';
                badge.textContent = attachments.length;
                fileUploadBtn.appendChild(badge);
            }
        } else if (existingBadge) {
            existingBadge.remove();
        }
    }

    function showTypingIndicator() {
        typingIndicator.classList.remove('hidden');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function hideTypingIndicator() {
        typingIndicator.classList.add('hidden');
    }

    async function handleFileUpload(file) {
        if (file) {
            const fileData = await convertFileToBase64(file);
            attachments.push({
                name: file.name,
                type: file.type,
                data: fileData.data
            });
            updateAttachmentCount();
            addMessage(`Attached: ${file.name}`, 'user', { isFile: true });
        }
    }

    function clearAttachments() {
        attachments = [];
        updateAttachmentCount();
        fileUploadInput.value = '';
    }

    function toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const icon = themeToggleBtn.querySelector('.material-icons');
        icon.textContent = document.body.classList.contains('dark-mode') ? 'light_mode' : 'dark_mode';
        localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    }

    function initializeTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggleBtn.querySelector('.material-icons').textContent = 'light_mode';
        }
    }

    function toggleSearchMode() {
        currentMode = currentMode === 'chat' ? 'search' : 'chat';
        searchBtn.classList.toggle('active');
        userInput.placeholder = currentMode === 'search' ? 
            '🔍 Search the web...' : 'Type your message...';
        
        // Visual feedback for search mode
        if (currentMode === 'search') {
            searchBtn.style.background = 'linear-gradient(45deg, var(--neon-accent), var(--neon-primary))';
        } else {
            searchBtn.style.background = '';
        }
    }

    function setupUI() {
        themeToggleBtn.addEventListener('click', toggleTheme);
        searchBtn.addEventListener('click', toggleSearchMode);
        initializeTheme();
    }

    function typeWriter(element, text, speed = 30) {
        return new Promise((resolve) => {
            let i = 0;
            element.textContent = '';
            element.classList.add('typing');

            function type() {
                if (i < text.length) {
                    element.textContent += text.charAt(i);
                    i++;
                    const nextChar = text.charAt(i);
                    const delay = ['.', '!', '?', ','].includes(nextChar) ? 
                        speed * 3 : speed + Math.random() * 20;
                    setTimeout(type, delay);
                } else {
                    element.classList.remove('typing');
                    resolve();
                }
            }
            type();
        });
    }

    async function addMessage(content, type, options = {}) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${type}-message`);
        
        if (type === 'bot') {
            const textSpan = document.createElement('span');
            
            // Handle image analysis results
            if (options.isImageAnalysis) {
                messageElement.classList.add('image-analysis');
                const sections = content.split('\n').filter(line => line.trim());
                
                // Create structured content for image analysis
                const structuredContent = sections.map(section => {
                    if (section.includes(':')) {
                        const [title, desc] = section.split(':');
                        return `<strong>${title}:</strong> ${desc}`;
                    }
                    return section;
                }).join('<br>');
                
                textSpan.innerHTML = structuredContent;
            } else {
                await typeWriter(textSpan, content);
            }
            
            // Display uploaded image if available
            if (options.image) {
                const imgContainer = document.createElement('div');
                imgContainer.className = 'image-container';
                
                const imgElement = document.createElement('img');
                imgElement.src = options.image;
                imgElement.classList.add('message-image');
                
                imgContainer.appendChild(imgElement);
                messageElement.appendChild(imgContainer);
            }
            
            messageElement.appendChild(textSpan);
        } else {
            if (options.isFile) {
                const fileIcon = document.createElement('span');
                fileIcon.className = 'material-icons file-icon';
                fileIcon.textContent = 'image';
                messageElement.appendChild(fileIcon);
            }
            
            const textSpan = document.createElement('span');
            textSpan.textContent = content;
            messageElement.appendChild(textSpan);
            
            if (options.isFile) messageElement.classList.add('file-message');
            if (options.isSearch) messageElement.classList.add('search-result');
        }
        
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function sendMessageWithFile() {
        const input = userInput.value.trim();
        if (!input && attachments.length === 0) return;

        // Show uploaded image in chat
        if (attachments.length > 0) {
            const file = attachments[0];
            if (file.type.startsWith('image/')) {
                addMessage(`Analyzing image: ${file.name}`, 'user', { 
                    isFile: true,
                    image: `data:${file.type};base64,${file.data}`
                });
            }
        }

        if (input) {
            addMessage(input, 'user');
        }
        
        userInput.value = '';
        showTypingIndicator();

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    prompt: input,
                    file: attachments
                })
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            hideTypingIndicator();
            
            if (data.response) {
                addMessage(data.response, 'bot', { 
                    isImageAnalysis: attachments.length > 0 && attachments[0].type.startsWith('image/')
                });
            } else {
                addMessage('Sorry, something went wrong.', 'bot');
            }
        } catch (error) {
            hideTypingIndicator();
            addMessage('Connection lost. Please try again.', 'bot');
        }

        clearAttachments();
    }

    async function performWebSearch(query) {
        if (!query.trim()) return;

        addMessage(query, 'user', { isSearch: true });
        showTypingIndicator();

        try {
            const response = await fetch('/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            
            hideTypingIndicator();
            if (data.results && data.results.length > 0) {
                data.results.forEach(result => 
                    addMessage(result, 'bot', { isSearch: true }));
            } else {
                addMessage('No results found for your search.', 'bot', { isSearch: true });
            }
        } catch (error) {
            hideTypingIndicator();
            addMessage('Error performing search. Please try again.', 'bot', { isSearch: true });
        }
        
        userInput.value = '';
    }

    function convertFileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve({
                name: file.name,
                type: file.type,
                data: reader.result.split(',')[1]
            });
            reader.onerror = reject;
        });
    }

    fileUploadInput.addEventListener('change', (event) => {
        Array.from(event.target.files).forEach(handleFileUpload);
    });

    sendBtn.addEventListener('click', sendMessageWithFile);
    
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (currentMode === 'search') {
                performWebSearch(userInput.value.trim());
            } else {
                sendMessageWithFile();
            }
        }
    });

    fileUploadBtn.addEventListener('click', () => fileUploadInput.click());
    
    setupUI();
});
