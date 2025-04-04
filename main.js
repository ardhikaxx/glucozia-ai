import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import MarkdownIt from 'markdown-it';
import './style.css';

let API_KEY = 'AIzaSyA8pXYAck0TNfpxPg6_N7oMgOG6OYZjCiY';

let form = document.querySelector('form');
let promptTextarea = document.querySelector('textarea[name="prompt"]');
let chatOutput = document.querySelector('#chat-output');
let submitButton = document.getElementById('submit-button');

// State variables
let isGenerating = false;
let stopGeneration = false;
let currentTypingResponse = null;

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

let chat = model.startChat({
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

window.onload = () => {
  const responseText = getRandomResponse();
  const responseBubble = addChatBubble('', 'ai', true);
  currentTypingResponse = typeResponse(responseBubble, responseText, null, 0);
};

form.onsubmit = async (ev) => {
  ev.preventDefault();

  const prompt = promptTextarea.value.trim();
  if (!prompt || isGenerating) return;

  addChatBubble(prompt, 'user');
  promptTextarea.value = '';

  // Change button to Stop
  setButtonToStop();

  if (
    prompt.toLowerCase().includes('siapa yang membuat kamu') || 
    prompt.toLowerCase().includes('siapa yang menciptakan kamu') || 
    prompt.toLowerCase().includes('siapa yang mengembangkan kamu') || 
    prompt.toLowerCase().includes('siapa developer kamu')
  ) {
    const responseText = `Saya dibuat oleh tim GlucoWise.`;
    const responseBubble = addChatBubble('', 'ai', true);
    currentTypingResponse = typeResponse(responseBubble, responseText, null, 0, () => {
      setButtonToSubmit();
    });
  } else if (
    prompt.toLowerCase().includes('siapa kamu') || 
    prompt.toLowerCase().includes('kamu siapa') || 
    prompt.toLowerCase().includes('siapa Glucozia AI')
  ) {
    const responseText = getRandomResponse();
    const responseBubble = addChatBubble('', 'ai', true);
    currentTypingResponse = typeResponse(responseBubble, responseText, null, 0, () => {
      setButtonToSubmit();
    });
  } else {
    const loadingBubble = addChatBubble('Typing<i class="fa-solid fa-spinner fa-spin-pulse ml-2"></i>', 'ai', true);
    isGenerating = true;
    stopGeneration = false;

    try {
      const result = await chat.sendMessageStream(prompt);

      let buffer = [];
      let md = new MarkdownIt();

      for await (let response of result.stream) {
        if (stopGeneration) break;
        buffer.push(response.text());
      }

      loadingBubble.innerHTML = '';

      const fullResponse = stopGeneration ? 
        "Response dihentikan oleh pengguna." : 
        buffer.join('');
      
      currentTypingResponse = typeResponse(loadingBubble, fullResponse, md, 0, () => {
        if (!stopGeneration) {
          chat = model.startChat({
            history: [
              ...chat.history,
              {
                role: "user",
                parts: [{ text: prompt }],
              },
              {
                role: "model",
                parts: [{ text: fullResponse }],
              },
            ],
            generationConfig: {
              maxOutputTokens: 1000,
              temperature: 0.8,
            }
          });
        }
        setButtonToSubmit();
      });

    } catch (e) {
      loadingBubble.innerHTML = '<hr>' + e;
      loadingBubble.classList.remove('normal', 'text-gray-100');
      setButtonToSubmit();
    } finally {
      isGenerating = false;
    }
  }
};

function setButtonToStop() {
  submitButton.innerHTML = 'Stop <i class="fas fa-stop ml-1"></i>';
  submitButton.classList.remove('bg-[#1A998E]', 'hover:bg-[#137a72]');
  submitButton.classList.add('bg-red-500', 'hover:bg-red-600');
  submitButton.onclick = function(e) {
    e.preventDefault();
    stopGeneration = true;
    if (currentTypingResponse) {
      clearTimeout(currentTypingResponse);
    }
    isGenerating = false;
    setButtonToSubmit();
  };
}

function setButtonToSubmit() {
  submitButton.innerHTML = 'Kirim <i class="fa-regular fa-paper-plane fa-bounce ml-1"></i>';
  submitButton.classList.remove('bg-red-500', 'hover:bg-red-600');
  submitButton.classList.add('bg-[#1A998E]', 'hover:bg-[#137a72]');
  submitButton.onclick = null;
}

function getRandomResponse() {
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
}

function typeResponse(element, text, md, index = 0, callback) {
  if (index < text.length && !stopGeneration) {
    element.innerHTML = md ? md.render(text.slice(0, index + 1)) : text.slice(0, index + 1);
    return setTimeout(() => {
      return typeResponse(element, text, md, index + 1, callback);
    }, 25);
  } else {
    element.classList.remove('normal', 'text-gray-100');
    if (callback) callback();
    return null;
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
    bubbleInner.innerHTML = text;
  }
  
  bubble.appendChild(bubbleInner);
  chatOutput.appendChild(bubble);

  // Auto-scroll to bottom
  chatOutput.scrollTop = chatOutput.scrollHeight;

  return bubbleInner;
}