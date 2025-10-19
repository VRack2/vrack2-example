const { Device, Port, Rule } = require("vrack2-core");
const http = require('http');

class HTTPServer extends Device {

    /**
     * Для удобаства определеним параметры из сервис файла
    */
    checkOptions() {
        return {
            port: Rule.number().integer().default(8090).min(1024).max(65535),
            host: Rule.string().default('0.0.0.0')
        }
    }

    /**
     * Определение выходов
     * Выход memory.request имеет тип Port.return() и используется для получение данных 
     * а не просто вызова события другого устройства
     * */
    outputs() {
        return {
            'memory.request': Port.return().description('Запрос к сборщику памяти')
        }
    }

    /**
     * Онлайн данные
    */
    shares = {
        requests: 0,
    }

    // Общие заголовки для всех ответов
    commonHeaders = {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    }

    /**
     * Метод запускается один раз при старте устройства 
    */
    process() {
        // Запуск сервера и первая отправка онлайн данных
        this.startHTTPServer();
        this.render();
    }


    /**
     * Динамический обработчик для GET /memory
     */
    async GETMemory(req) {
        const response = await this.ports.output['memory.request'].push({
            path: req.url,
            method: req.method,
            headers: req.headers
        });
        return response;
    }

  /**
     * Универсальный обработчик запросов
     */
    async handleRequest(req, res) {
        // Устанавливаем общие заголовки
        Object.entries(this.commonHeaders).forEach(([key, value]) => { res.setHeader(key, value); });
        // Обновляем онлайн данные и отправляем их
        this.shares.requests++
        this.render()
        try {
            const methodName = this.getMethodName(req.method, req.url)
            // Проверяем существование метода
            if (typeof this[methodName] === 'function') {
                const result = await this[methodName](req);
                res.statusCode = 200;
                res.end(JSON.stringify(result, null, 2));
            } else {
                // Метод не найден - 404
                res.statusCode = 404;
                res.end(JSON.stringify({ success: false, error: 'Endpoint not found', }));
            }
        } catch (error) {
            // Ошибка выполнения метода - 500
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: 'Internal server error', message: error.message }));
        }
    }

    /**
     * Запуск HTTP сервера
     */
    startHTTPServer() {
        // Создаем сервер
        this.server = http.createServer(async (req, res) => {
            // При запросе - запускаем универсальный обработчик запросов
            this.handleRequest(req, res)
        });
        // Начинаем слушать порт 
        this.server.listen(this.options.port, this.options.host, () => {});
        // Если сервер выдал ошибку - отправляем ее в error
        this.server.on('error', (error) => { this.error('HTTP Server error:', error); });
    }

    /**
     * Преобразует HTTP метод и URL в название локального метода
     * @param {string} method - HTTP метод (GET, POST, PUT, DELETE, etc.)
     * @param {string} url - URL путь (например: '/memory', '/cpu/stats')
     * @returns {string} - Название метода (например: 'GETMemory', 'POSTCpuStats')
     */
    getMethodName(method, url) {
        // Нормализуем метод (uppercase)
        const httpMethod = method.toUpperCase();

        // Обрабатываем корневой путь
        if (url === '/') return `${httpMethod}Root`;
        
        // Убираем начальный и конечный слеши, разбиваем на части
        const pathParts = url.replace(/^\/+|\/+$/g, '').split('/');

        // Преобразуем каждую часть в CamelCase
        const camelCasePath = pathParts.map(part => {
            // Если часть пустая (множественные слеши) - пропускаем
            if (!part) return '';

            // Преобразуем: some-path -> SomePath, cpu_stats -> CpuStats
            return part
                .split(/[-_]/) // Разбиваем по дефисам и подчеркиваниям
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
        }).join('');

        return `${httpMethod}${camelCasePath}`;
    }
}

module.exports = HTTPServer;