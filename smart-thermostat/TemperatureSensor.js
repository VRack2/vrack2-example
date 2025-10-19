// Устройство имитирует датчик температуры — генерирует плавно меняющуюся температуру по синусоиде
const { Device, Port, Metric } = require("vrack2-core");

class TemperatureSensor extends Device {
    /**
     * Отсюда выходит текущая температура для других устройств
     * */
    outputs() {
        return {
            'temperature': Port.standart().description('Текущая температура в °C')
        };
    }

    /**
     * Регистрируем метрику температуры для записи в VRackDB
     * */
    metrics() {
        return {
            'temp.value': Metric.inS().retentions('1s:10m, 10s:1h').description('Текущая температура')
        };
    }

    /**
     * Данные которые все видят в реальном времени
     * */
    shares = { temp: 22.5 };

    /**
     * Запускается когда устройство включается
     * */
    process() {
        this.updateTemperature();
        setInterval(() => this.updateTemperature(), 2000);
    }

    /**
     * Генерирует температуру по синусоиде на основе текущего времени
     * */
    updateTemperature() {
        // Базовая температура и амплитуда колебаний
        const baseTemp = 22.5;   // среднее значение
        const amplitude = 3.5;   // ±3.5°C → диапазон 19–26°C

        // Используем текущее время в миллисекундах для плавного изменения
        const time = Date.now() / 1000; // секунды
        const period = 60; // период синусоиды — 60 секунд

        // Вычисляем синус: sin(2π * t / T)
        const sine = Math.sin((2 * Math.PI * time) / period);
        const temp = baseTemp + amplitude * sine;

        // Округляем до одного знака после запятой
        this.shares.temp = parseFloat(temp.toFixed(1));

        // Записываем метрику
        this.metric('temp.value', this.shares.temp);

        // Отправляем температуру на выход, если есть подключенные устройства
        if (this.ports.output.temperature.connected) {
            this.ports.output.temperature.push(this.shares.temp);
        }

        // Обновляем отображение в интерфейсе
        this.render();
    }
}

module.exports = TemperatureSensor;