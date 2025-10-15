document.addEventListener('DOMContentLoaded', () => {
    const speakBtn = document.getElementById('speak-btn');
    const stopBtn = document.getElementById('stop-btn');
    const transcriptDiv = document.getElementById('transcript');
    const statusP = document.getElementById('status');

    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        statusP.textContent = 'Sorry, your browser does not support speech recognition.';
        speakBtn.disabled = true;
        stopBtn.disabled = true;
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Stop listening after a pause
    recognition.lang = 'en-US';
    recognition.interimResults = false; // Get final results only
    recognition.maxAlternatives = 1;

    let isListening = false;

    speakBtn.addEventListener('click', () => {
        if (isListening) return;
        isListening = true;
        recognition.start();
        statusP.textContent = 'Status: Listening...';
        speakBtn.classList.add('listening');
        speakBtn.textContent = 'Listening...';
    });

    stopBtn.addEventListener('click', () => {
        if (isListening) {
            recognition.stop();
        } else if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
            statusP.textContent = 'Status: Idle';
        }
    });

    recognition.onresult = (event) => {
        const transcriptText = event.results[0][0].transcript;
        addMessageToTranscript('user', transcriptText);
        getAIResponse(transcriptText);
    };

    async function getAIResponse(userMessage) {
        statusP.textContent = 'Status: Thinking...';
        try {
            const res = await fetch('/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: userMessage }),
            });
            const data = await res.json();
            addMessageToTranscript('ai', data.response);
            speak(data.response);
        } catch (error) {
            const errorMessage = 'Oops! I had a little trouble thinking. Please try again!';
            addMessageToTranscript('ai', errorMessage);
            speak(errorMessage);
            console.error('Error fetching AI response:', error);
        }
    }

    function speak(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onstart = () => {
            statusP.textContent = 'Status: Speaking...';
        };
        utterance.onend = () => {
            statusP.textContent = 'Status: Idle';
        };
        speechSynthesis.speak(utterance);
    }

    function addMessageToTranscript(sender, message) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add(sender === 'user' ? 'user-message' : 'ai-message');
        messageDiv.textContent = message;
        transcriptDiv.appendChild(messageDiv);
        transcriptDiv.scrollTop = transcriptDiv.scrollHeight; // Scroll to the bottom
    }

    recognition.onerror = (event) => {
        statusP.textContent = `Error occurred in recognition: ${event.error}`;
        console.error('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
        isListening = false;
        statusP.textContent = 'Status: Idle';
        speakBtn.classList.remove('listening');
        speakBtn.textContent = 'Speak';
    };
});