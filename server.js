// server.js
import express from 'express';
import cors from 'cors';
import { exec } from 'child_process'; 
import { promises as fs } from 'fs'; // <-- НОВОЕ: Для работы с файлами
import path from 'path'; // <-- НОВОЕ: Для работы с путями

const app = express();
const PORT = 3002; 
const CACHE_FILE = 'events_cache.json'; // Имя файла кэша

app.use(cors());
app.use(express.json());

// =========================================================
// АПИ-МАРШРУТ ДЛЯ ЗАГРУЗКИ КЭША
// =========================================================
app.get('/api/events', async (req, res) => {
    // Получаем полный путь к файлу кэша
    const filePath = path.join(process.cwd(), CACHE_FILE);
    
    try {
        // Проверяем существование файла и читаем его
        await fs.access(filePath); // Проверяет, что файл существует
        const data = await fs.readFile(filePath, 'utf8');
        
        // Отправляем содержимое как JSON
        res.json(JSON.parse(data));
        
    } catch (error) {
        if (error.code === 'ENOENT') {
            // Файл не найден (первый запуск)
            console.warn(`[API/Events] Файл кэша ${CACHE_FILE} не найден. Возвращаем пустой массив.`);
            return res.json([]);
        }
        
        console.error(`[API/Events] Ошибка чтения/парсинга кэша: ${error.message}`);
        return res.status(500).json({ 
            success: false, 
            message: 'Ошибка сервера при чтении кэша.' 
        });
    }
});


// =========================================================
// АПИ-МАРШРУТ ДЛЯ ПАРСИНГА (БЕЗ ИЗМЕНЕНИЙ)
// =========================================================
app.get('/api/parse', (req, res) => {
    const pythonCommand = 'python parser.py'; 

    console.log(`Запуск парсера: ${pythonCommand}`);
    
    // Запускаем команду с явным указанием кодировки UTF-8
    exec(pythonCommand, { 
        maxBuffer: 1024 * 5000,
        encoding: 'utf8' // <-- Ключевое исправление
    }, (error, stdout, stderr) => {
        
        if (error) {
            console.error(`Ошибка выполнения Python скрипта: ${error.message}`);
            return res.status(500).json({ 
                success: false, 
                message: 'Ошибка на стороне сервера при выполнении парсера.',
                details: stderr.trim()
            });
        }
        
        if (stderr) {
            // Предупреждения или отладочный вывод в stderr (который не мешает JSON)
            console.warn(`Предупреждения Python (stderr): ${stderr.trim()}`);
        }

        try {
            const cleanStdout = stdout.trim();
            
            if (!cleanStdout.startsWith('[') && !cleanStdout.startsWith('{')) {
                console.error('Ошибка: Вывод Python не является валидным JSON-массивом/объектом.', cleanStdout);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Парсер вернул невалидные данные (не JSON). Проверьте логи Python.',
                    output: cleanStdout
                });
            }

            const events = JSON.parse(cleanStdout);
            res.json(events); 

        } catch (parseError) {
            console.error('Ошибка парсинга JSON из Python:', parseError);
            console.log('Неудачный вывод (stdout):', stdout);
            
            res.status(500).json({ 
                success: false, 
                message: 'Ошибка обработки данных парсера (некорректный JSON). Проверьте консоль Node.js.',
                output: stdout.trim()
            });
        }
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`✅ Сервер API запущен на http://localhost:${PORT}`);
    console.log(`Маршрут для кэша: http://localhost:${PORT}/api/events`); // <-- НОВЫЙ МАРШРУТ
    console.log(`Маршрут для парсинга: http://localhost:${PORT}/api/parse`);
});