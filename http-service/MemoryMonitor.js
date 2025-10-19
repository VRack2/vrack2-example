const { Device, Port, Action, Rule } = require("vrack2-core");

class MemoryMonitor extends Device {

    inputs() {
        return {
            'get.memory': Port.return().description('Запрос данных о памяти')
        }
    }

    shares = {
        memory: {}
    }

    process() {
        // Обновляем данные раз в 1 сек
        setInterval(this.updateMemoryInfo.bind(this), 1000)
        this.render();
    }

    /**
     * Обработчик порта et.memory
     */
    async inputGetMemory() {
        // Возвращаем память
        return this.shares.memory;
    }

    /**
     * Получение информации о памяти и отправляем shares данные
     */
    updateMemoryInfo() {
        const memoryUsage = process.memoryUsage();
        this.shares.memory = {
            rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
            external: Math.round(memoryUsage.external / 1024 / 1024), // MB
            arrayBuffers: Math.round(memoryUsage.arrayBuffers / 1024 / 1024), // MB
            
            // Процент использования
            usagePercent: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
            
            // Статус системы
            uptime: Math.round(process.uptime())
        };
        this.render();
    }
}

module.exports = MemoryMonitor;