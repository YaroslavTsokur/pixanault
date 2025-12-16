import { MOCK_EVENTS } from './mockData';

let chatHistory: any[] = [];
// ВАЖНО: Используйте токен с правами "Inference"
const HF_API_KEY = "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"; 
const MODEL_ID = "Qwen/Qwen2.5-72B-Instruct";

export const api = {
  chat: {
    init: async (): Promise<void> => {
      try {
        let actualEvents = [];
        try {
          const res = await fetch('/events_cache.json');
          actualEvents = res.ok ? await res.json() : MOCK_EVENTS;
        } catch (e) {
          actualEvents = MOCK_EVENTS;
        }

        const systemInstruction = `Ты Pixana AI, аналитик металлопроката. 
        Данные для анализа: ${JSON.stringify(actualEvents)}. 
        Сегодня 16.12.2025. Отвечай кратко, профессионально и только на русском языке.`;

        // Очищаем историю и задаем системную роль
        chatHistory = [{ role: "system", content: systemInstruction }];
        console.log("AI Аналитик Pixana готов к работе - api.ts:26");
      } catch (error) {
        console.error("Ошибка инициализации: - api.ts:28", error);
      }
    },

    sendMessage: async (message: string): Promise<string> => {
      // Инициализация, если история пуста
      if (chatHistory.length <= 1) {
         await api.chat.init();
      }

      // Добавляем сообщение пользователя
      chatHistory.push({ role: "user", content: message });

      try {
        const response = await fetch(`/hf-api/v1/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${HF_API_KEY}`
          },
          body: JSON.stringify({
            model: MODEL_ID,
            messages: chatHistory,
            max_tokens: 800,
            temperature: 0.7,
            stream: false
          })
        });

        // Если ответ не OK, пробуем прочитать текст ошибки
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Детали ошибки сервера: - api.ts:60", errorText);
          throw new Error(`Ошибка ${response.status}: ${errorText.slice(0, 100)}`);
        }

        const data = await response.json();
        
        // Извлекаем текст ответа по стандарту OpenAI
        if (!data.choices || !data.choices[0]) {
            throw new Error("Неверный формат ответа от API");
        }

        const aiText = data.choices[0].message.content.trim();

        // Добавляем ответ нейросети в историю для памяти
        chatHistory.push({ role: "assistant", content: aiText });
        
        return aiText;

      } catch (error: any) {
        console.error("Ошибка при отправке сообщения: - api.ts:79", error);
        
        // Удаляем последнее сообщение пользователя, чтобы можно было повторить запрос
        chatHistory.pop();

        if (error.message.includes("503") || error.message.includes("loading")) {
          return "Модель подгружается на сервере. Пожалуйста, подождите 20 секунд и попробуйте снова.";
        }
        
        return `Ошибка: ${error.message}`;
      }
    }
  }
};