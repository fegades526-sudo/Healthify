const form = document.querySelector('#chat-form');
const question = document.querySelector('#question');
const conversation = document.querySelector('#conversation');
const themeToggle = document.querySelector('#theme-toggle');
const GEMINI_API_KEY = 'AQ.Ab8RN6LBh1ArCsGfvgfYAneY5xSuaYvduyamVf22iiplwJc0qA';
const GEMINI_MODELS = [
	'gemini-2.0-flash',
	'gemini-3.1-flash-lite',
	'gemini-3.8-flash',
];
const LANGUAGE_NAMES = {
	en: 'English',
	hi: 'Hindi',
	bn: 'Bangla',
	ta: 'Tamil',
	te: 'Telugu',
	mr: 'Marathi',
	gu: 'Gujarati',
	kn: 'Kannada'
};

const buildHealthPrompt = (text, language) => `You are Healtify, a health awareness assistant. Respond in ${LANGUAGE_NAMES[language]} only. Give concise, general educational information. Do not diagnose, prescribe, or handle emergencies. Encourage a qualified healthcare professional when appropriate. You are only meant to provide information about healthcare and physical fitness. If the user asks for medical advice, remind them to consult a healthcare professional. If the user asks anything unrelated to healthcare or fitness, politely say that you can only help with healthcare and fitness related questions. User question: ${text}`;

const extractTextFromResponse = (data) => data?.candidates?.map((candidate) => candidate?.content?.parts?.map((part) => part?.text || '').join('') || '').join('')?.trim() || '';

async function callGeminiModel(modelName, promptText) {
	const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			contents: [{
				parts: [{ text: promptText }]
			}]
		})
	});

	if (!response.ok) {
		const errorPayload = await response.json().catch(() => ({}));
		const message = errorPayload?.error?.message || `request failed with status ${response.status}.`;
		throw new Error(`${modelName}: ${message}`);
	}

	const data = await response.json();
	const text = extractTextFromResponse(data);
	if (!text) {
		throw new Error(`${modelName}: model returned an empty response.`);
	}

	return text;
}

async function getAIResponse(text, selectedLanguage) {
	const promptText = buildHealthPrompt(text, selectedLanguage);
	const errors = [];

	for (const modelName of GEMINI_MODELS) {
		try {
			return await callGeminiModel(modelName, promptText);
		} catch (error) {
			const modelError = error instanceof Error ? error.message : String(error);
			errors.push(modelError);
			console.warn(`AI model ${modelName} failed, trying next model.`, modelError);
		}
	}

	throw new Error(errors.join(' | ') || 'All configured AI models failed.');
}

const getSelectedLanguage = () => {
	const saved = localStorage.getItem('healtify-lang') || 'en';
	return LANGUAGE_NAMES[saved] ? saved : 'en';
};

if (localStorage.getItem('healtify-theme') === 'dark') {
	document.body.classList.add('dark-mode');
}

if (themeToggle) {
	const updateThemeLabel = () => {
		const isDark = document.body.classList.contains('dark-mode');
		themeToggle.textContent = isDark ? 'Light mode' : 'Dark mode';
		themeToggle.setAttribute('aria-pressed', String(isDark));
	};

	themeToggle.addEventListener('click', () => {
		document.body.classList.toggle('dark-mode');
		localStorage.setItem('healtify-theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
		updateThemeLabel();
	});
	updateThemeLabel();
}

if (form) {
	form.addEventListener('submit', async (event) => {
		event.preventDefault();
		const text = question.value.trim();
		if (!text) return;

		conversation.insertAdjacentHTML('beforeend', `<div class="message user"></div>`);
		conversation.lastElementChild.textContent = text;
		question.value = '';
		question.disabled = true;
		form.querySelector('button[type="submit"]').disabled = true;
		conversation.insertAdjacentHTML('beforeend', '<div class="message assistant">Thinking...</div>');
		const responseMessage = conversation.lastElementChild;

		try {
			const selectedLanguage = getSelectedLanguage();
			const answer = await getAIResponse(text, selectedLanguage);
			responseMessage.textContent = answer;
		} catch (error) {
			responseMessage.textContent = GEMINI_API_KEY
				? 'The assistant is unavailable right now because all configured AI models failed. Please try again in a moment.'
				: 'The assistant needs a secure API backend before it can be used on this public site.';
			console.error(error);
		}

		question.disabled = false;
		form.querySelector('button[type="submit"]').disabled = false;
		question.focus();
	});
}
