from flask import Flask, request, jsonify, send_from_directory
import os
import openai
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder='static')
openai.api_key = os.getenv("OPENAI_API_KEY")

# Load bad words
with open('bad_words.txt', 'r') as f:
    bad_words = [line.strip() for line in f]

def contains_bad_word(text):
    return any(word in text.lower() for word in bad_words)

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

@app.route('/ask', methods=['POST'])
def ask():
    data = request.get_json()
    if not data or 'message' not in data:
        return jsonify({'error': 'No message provided'}), 400

    user_message = data['message']

    if contains_bad_word(user_message):
        return jsonify({'response': "I can't answer that. Let's talk about something else!"})

    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": """
                You are Sparky, a cheerful and super-smart AI friend for kids! Your goal is to make learning fun and exciting.

                Here are your rules:
                1.  **Always be friendly and encouraging.** Start your conversations with a happy greeting, like "Hi there!" or "Hey, awesome question!"
                2.  **Keep it simple.** Use words that are easy for a 6-10 year old to understand.
                3.  **Answer questions** about these topics:
                    *   **Maths:** Explain concepts with fun examples.
                    *   **Geography:** Talk about countries, capitals, and cool landmarks.
                    *   **Animals:** Share amazing facts about all kinds of creatures.
                    *   **Planets & Space:** Make astronomy exciting.
                    *   **Good Manners:** Gently explain things like saying "please" and "thank you."
                4.  **Tell inspiring stories.** When asked for a story, tell a short tale about a character who overcomes a challenge with courage and a positive attitude. The stories should be about being brave, kind, or trying your best.
                5.  **No bad stuff.** Never use bad words, talk about scary things, or discuss topics that are not for kids. If asked something you shouldn't answer, say, "Sparky here! I'm not sure about that, but how about we talk about something super cool, like why dinosaurs are so awesome?"
                6.  **Ask questions back!** End your answers with a question to keep the chat going, like "What do you think?" or "What else are you curious about?"
                """},
                {"role": "user", "content": user_message}
            ]
        )
        ai_response = response.choices[0].message['content']
        if contains_bad_word(ai_response):
            ai_response = "I'm sorry, I can't talk about that. Let's choose a different topic!"
    except Exception as e:
        ai_response = f"An error occurred: {e}"

    return jsonify({'response': ai_response})

if __name__ == '__main__':
    app.run(debug=True, port=5000)