import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import MarkdownIt from 'markdown-it';
import './style.css';

let API_KEY = 'AIzaSyA8pXYAck0TNfpxPg6_N7oMgOG6OYZjCiY';

let form = document.querySelector('form');
let promptTextarea = document.querySelector('textarea[name="prompt"]');
let chatOutput = document.querySelector('#chat-output');

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
  ],
});

const chat = model.startChat({
  history: [],
  generationConfig: {
    maxOutputTokens: 1000,
    temperature: 0.8,
  }
});

const responses = [
  "Saya adalah Glucozia AI, asisten edukasi interaktif yang dirancang untuk membantu Anda belajar dan mengeksplorasi topik-topik tentang diabetes. Bagaimana saya bisa membantu Anda hari ini?",
  "Halo! Saya adalah Glucozia AI, asisten edukasi interaktif di sini! Saya siap membantu Anda dengan berbagai pertanyaan dan informasi yang Anda butuhkan.",
  "Hai! Saya adalah Glucozia AI, dan saya di sini untuk memandu Anda melalui berbagai topik terkait diabetes. Ada yang bisa saya bantu?",
  "Selamat datang! Saya adalah Glucozia AI, asisten virtual Anda. Apakah Anda membutuhkan bantuan atau informasi tentang topik diabetes?"
];

form.onsubmit = async (ev) => {
  ev.preventDefault();

  const prompt = promptTextarea.value.trim().toLowerCase();
  addChatBubble(prompt, 'user');
  promptTextarea.value = '';

  if (
    prompt.includes('siapa yang membuat kamu') || 
    prompt.includes('siapa yang menciptakan kamu') || 
    prompt.includes('siapa yang mengembangkan kamu') || 
    prompt.includes('siapa developer kamu')
  ) {
    const responseText = `Saya dibuat oleh tim Glucozia AI.`;
    const responseBubble = addChatBubble('', 'ai', true);
    typeResponse(responseBubble, responseText, null, 0,);
  } else if (prompt.includes('siapa kamu') || prompt.includes('kamu siapa') || prompt.includes('siapa omeo')) {
    const responseText = getRandomResponse();
    const responseBubble = addChatBubble('', 'ai', true);
    typeResponse(responseBubble, responseText, null, 0, );
  } else {
    const loadingBubble = addChatBubble('Typing<i class="fa-solid fa-spinner fa-spin-pulse ml-2"></i>', 'ai', true);

    try {
      const result = await chat.sendMessageStream(prompt);

      let buffer = [];
      let md = new MarkdownIt();

      for await (let response of result.stream) {
        buffer.push(response.text());
      }

      loadingBubble.innerHTML = '';

      const fullResponse = buffer.join('');
      typeResponse(loadingBubble, fullResponse, md, 0,); // Kembali ke gambar awal

    } catch (e) {
      loadingBubble.innerHTML = '<hr>' + e;
      loadingBubble.classList.remove('normal', 'text-gray-100');
    }
  }
};

function getRandomResponse() {
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
}

function typeResponse(element, text, md, index = 0, callback) {
  if (index < text.length) {
    element.innerHTML = md ? md.render(text.slice(0, index + 1)) : text.slice(0, index + 1);
    setTimeout(() => typeResponse(element, text, md, index + 1, callback), 25);
  } else {
    element.classList.remove('normal', 'text-gray-100');
    if (callback) callback();
  }
}

function addChatBubble(text, sender, isLoading = false) {
  const bubble = document.createElement('div');
  bubble.classList.add('bubble', sender === 'user' ? 'bubble-user' : 'bubble-ai');
  
  const bubbleInner = document.createElement('div');
  bubbleInner.classList.add('bubble-inner');
  
  if (isLoading) {
    bubbleInner.innerHTML = `
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;
  } else {
    bubbleInner.textContent = text;
  }
  
  bubble.appendChild(bubbleInner);
  chatOutput.appendChild(bubble);

  // Auto-scroll to bottom
  chatOutput.scrollTop = chatOutput.scrollHeight;

  return bubbleInner;
}