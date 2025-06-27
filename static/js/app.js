document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const chatBox = document.getElementById('chat-box');
    const sourceText = document.getElementById('sourceText');
    const videoUrlInput = document.getElementById('videoUrl');
    const generateNotesTextBtn = document.getElementById('generateNotesText');
    const generateNotesImageBtn = document.getElementById('generateNotesImage');
    const generateNotesVideoBtn = document.getElementById('generateNotesVideo');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const styleBtns = document.querySelectorAll('.style-btn');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const imageUpload = document.getElementById('imageUpload');
    const imageUploadArea = document.getElementById('imageUploadArea');
    const imagePreview = document.getElementById('imagePreview');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const removeImagePreviewBtn = document.getElementById('removeImagePreview');
    const exampleVideoLinks = document.querySelectorAll('.example-video-link');
    
    // State
    let currentStyle = 'concise'; // Default style
    let currentTheme = localStorage.getItem('theme') || 'light';
    let selectedFile = null;
    
    // Initialize theme
    function initializeTheme() {
        if (currentTheme === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
            themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
        } else {
            document.body.removeAttribute('data-theme');
            themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
        }
    }
    initializeTheme();
    
    // Auto-resize textarea
    function autoResizeTextarea() {
        sourceText.style.height = 'auto';
        sourceText.style.height = (sourceText.scrollHeight) + 'px';
    }
    
    // Add a user message to the chat
    function addUserMessage(text, type = 'text') {
        const userMessage = document.createElement('div');
        userMessage.classList.add('message', 'user-message');
        
        let content = '';
        
        switch (type) {
            case 'image':
                content = `<p>Generated notes from this image:</p>
                          <div class="image-preview">
                            <img src="${text}" alt="Uploaded content" class="uploaded-image">
                          </div>`;
                break;
            case 'video':
                content = `<p>Generated notes from this video: <a href="${text}" target="_blank" rel="noopener noreferrer">${text}</a></p>`;
                break;
            default:
                content = `<p>${text}</p>`;
        }
        
        userMessage.innerHTML = `
            <div class="avatar">
                <i class="fa-solid fa-user"></i>
            </div>
            <div class="message-content">
                ${content}
            </div>
        `;
        chatBox.appendChild(userMessage);
        scrollToBottom();
    }
    
    // Add a bot message to the chat
    function addBotMessage(content, isError = false) {
        const botMessage = document.createElement('div');
        botMessage.classList.add('message', 'bot-message');
        
        let messageContent;
        if (isError) {
            messageContent = `<p class="error-message">Error: ${content}</p>`;
        } else {
            // Convert markdown-like syntax to HTML
            const formattedContent = content
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
                .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
                .replace(/\n/g, '<br>') // Line breaks
                .replace(/```([^`]+)```/g, '<pre>$1</pre>'); // Code blocks
            
            messageContent = `<div class="notes-content">${formattedContent}</div>`;
        }
        
        botMessage.innerHTML = `
            <div class="avatar">
                <i class="fa-solid fa-robot"></i>
            </div>
            <div class="message-content">
                ${messageContent}
            </div>
        `;
        chatBox.appendChild(botMessage);
        scrollToBottom();
    }
    
    // Add a loading animation
    function addLoadingAnimation() {
        const loadingMessage = document.createElement('div');
        loadingMessage.classList.add('message', 'bot-message', 'loading');
        loadingMessage.id = 'loading-message';
        loadingMessage.innerHTML = `
            <div class="avatar">
                <i class="fa-solid fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        chatBox.appendChild(loadingMessage);
        scrollToBottom();
    }
    
    // Remove loading animation
    function removeLoadingAnimation() {
        const loadingMessage = document.getElementById('loading-message');
        if (loadingMessage) {
            loadingMessage.remove();
        }
    }
    
    // Scroll chat to bottom
    function scrollToBottom() {
        chatBox.scrollTop = chatBox.scrollHeight;
    }
    
    // Generate notes from text
    async function generateNotesFromText() {
        const text = sourceText.value.trim();
        
        if (!text) {
            sourceText.classList.add('empty-shake');
            setTimeout(() => {
                sourceText.classList.remove('empty-shake');
            }, 500);
            return;
        }
        
        generateNotesTextBtn.disabled = true;
        addUserMessage(text);
        sourceText.value = '';
        sourceText.style.height = '48px';
        addLoadingAnimation();
        
        try {
            const response = await fetch('/generate-notes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text,
                    style: currentStyle,
                    type: 'text'
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            removeLoadingAnimation();
            
            if (data.error) {
                addBotMessage(data.error, true);
            } else {
                addBotMessage(data.notes);
            }
        } catch (error) {
            console.error('Error:', error);
            removeLoadingAnimation();
            addBotMessage('Sorry, something went wrong while generating notes. Please try again.', true);
        } finally {
            generateNotesTextBtn.disabled = false;
        }
    }
    
    // Generate notes from image
    async function generateNotesFromImage() {
        if (!selectedFile) {
            imageUploadArea.classList.add('empty-shake');
            setTimeout(() => {
                imageUploadArea.classList.remove('empty-shake');
            }, 500);
            return;
        }
        
        generateNotesImageBtn.disabled = true;
        const imageUrl = URL.createObjectURL(selectedFile);
        addUserMessage(imageUrl, 'image');
        addLoadingAnimation();
        
        try {
            const formData = new FormData();
            formData.append('image', selectedFile);
            formData.append('style', currentStyle);
            
            const response = await fetch('/generate-notes-from-image', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            removeLoadingAnimation();
            
            if (data.error) {
                addBotMessage(data.error, true);
            } else {
                addBotMessage(data.notes);
            }
        } catch (error) {
            console.error('Error:', error);
            removeLoadingAnimation();
            addBotMessage('Sorry, something went wrong while processing the image. Please try again.', true);
        } finally {
            generateNotesImageBtn.disabled = false;
            resetImageUpload();
        }
    }
    
    // Generate notes from video
    async function generateNotesFromVideo(videoUrl = '') {
        const url = videoUrl || videoUrlInput.value.trim();
        
        if (!url) {
            videoUrlInput.classList.add('empty-shake');
            setTimeout(() => {
                videoUrlInput.classList.remove('empty-shake');
            }, 500);
            return;
        }
        
        if (!isValidYoutubeUrl(url)) {
            addBotMessage('Please enter a valid YouTube URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID).', true);
            return;
        }
        
        generateNotesVideoBtn.disabled = true;
        addUserMessage(url, 'video');
        if (!videoUrl) videoUrlInput.value = '';
        addLoadingAnimation();
        
        try {
            const response = await fetch('/generate-notes-from-video', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    videoUrl: url,
                    style: currentStyle
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            removeLoadingAnimation();
            
            if (data.error) {
                handleVideoError(data.error);
            } else {
                addBotMessage(data.notes);
            }
        } catch (error) {
            console.error('Error:', error);
            removeLoadingAnimation();
            handleVideoError(error.message);
        } finally {
            generateNotesVideoBtn.disabled = false;
        }
    }
    
    // Handle video errors
    function handleVideoError(error) {
        let userMessage = 'Sorry, something went wrong while processing the video.';
        
        if (error.includes('No captions available')) {
            userMessage = 'This video has no captions. Notes were generated from title/description only.';
        } else if (error.includes('Invalid URL')) {
            userMessage = 'Please check the YouTube URL and try again.';
        } else if (error.includes('Video too long')) {
            userMessage = 'For videos longer than 15 minutes, please provide timestamps.';
        }
        
        addBotMessage(userMessage, true);
    }
    
    // Validate YouTube URL
    function isValidYoutubeUrl(url) {
        const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(\S*)?$/;
        return pattern.test(url);
    }
    
    // Reset image upload
    function resetImageUpload() {
        if (selectedFile) {
            URL.revokeObjectURL(selectedFile);
        }
        selectedFile = null;
        imageUpload.value = '';
        imagePreviewContainer.style.display = 'none';
        imageUploadArea.style.display = 'block';
        generateNotesImageBtn.disabled = true;
    }
    
    // Handle image upload
    function handleImageUpload(file) {
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            addBotMessage('Please upload an image file (JPEG, PNG, etc.).', true);
            return;
        }
        
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            addBotMessage('Image size should be less than 5MB.', true);
            return;
        }
        
        selectedFile = file;
        const reader = new FileReader();
        
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            imagePreviewContainer.style.display = 'block';
            imageUploadArea.style.display = 'none';
            generateNotesImageBtn.disabled = false;
        };
        
        reader.onerror = function() {
            addBotMessage('Error reading the image file. Please try another file.', true);
        };
        
        reader.readAsDataURL(file);
    }
    
    // Toggle dark/light theme
    function toggleTheme() {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', currentTheme);
        initializeTheme();
    }
    
    // Set active style
    function setActiveStyle(style) {
        currentStyle = style;
        styleBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.style === style);
        });
    }
    
    // Switch tabs
    function switchTab(tabId) {
        tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        
        tabPanes.forEach(pane => {
            pane.classList.toggle('active', pane.id === `${tabId}-tab`);
        });
    }
    
    // Event Listeners
    sourceText.addEventListener('input', autoResizeTextarea);
    
    generateNotesTextBtn.addEventListener('click', generateNotesFromText);
    generateNotesImageBtn.addEventListener('click', generateNotesFromImage);
    generateNotesVideoBtn.addEventListener('click', () => generateNotesFromVideo());
    
    sourceText.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            generateNotesFromText();
        }
    });
    
    videoUrlInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            generateNotesFromVideo();
        }
    });
    
    themeToggleBtn.addEventListener('click', toggleTheme);
    
    styleBtns.forEach(btn => {
        btn.addEventListener('click', () => setActiveStyle(btn.dataset.style));
    });
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Image upload
    imageUpload.addEventListener('change', function(e) {
        if (this.files?.[0]) {
            handleImageUpload(this.files[0]);
        }
    });
    
    imageUploadArea.addEventListener('click', () => imageUpload.click());
    
    // Drag and drop
    imageUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        imageUploadArea.classList.add('drag-over');
    });
    
    imageUploadArea.addEventListener('dragleave', () => {
        imageUploadArea.classList.remove('drag-over');
    });
    
    imageUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        imageUploadArea.classList.remove('drag-over');
        if (e.dataTransfer.files?.[0]) {
            handleImageUpload(e.dataTransfer.files[0]);
        }
    });
    
    removeImagePreviewBtn.addEventListener('click', resetImageUpload);
    
    // Example video links
    exampleVideoLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            videoUrlInput.value = link.dataset.url;
            generateNotesFromVideo(link.dataset.url);
        });
    });
    
    // Copy functionality
    chatBox.addEventListener('dblclick', (e) => {
        const messageContent = e.target.closest('.bot-message .message-content');
        if (messageContent) {
            const textToCopy = messageContent.textContent.trim();
            navigator.clipboard.writeText(textToCopy)
                .then(() => {
                    const copyFeedback = document.createElement('div');
                    copyFeedback.className = 'copy-feedback';
                    copyFeedback.textContent = 'Copied!';
                    messageContent.appendChild(copyFeedback);
                    
                    setTimeout(() => {
                        copyFeedback.remove();
                    }, 1500);
                })
                .catch(err => {
                    console.error('Failed to copy text:', err);
                });
        }
    });
});