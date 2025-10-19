const { Device, Port, Metric } = require("vrack2-core");

/**
 *  Создаем умную лампочку которая светит и показывает свое состояние
 * */
class SmartBulb extends Device {
    
    /**
     * Сюда приходят сигналы управления
     * */ 
    inputs() {
        return {
            'power': Port.standart().description('Включить или выключить лампу (true/false)'),
            'brightness': Port.standart().description('Установить яркость (0-100)')
        }
    }

    /**
     * Регистрируем наши метрики
    */
    metrics () {
        return {
            'brightness': Metric.inS().retentions('1s:5m, 5s:30m, 1m:1d').description('Яркость'),
            'consumption': Metric.inS().retentions('1s:5m, 5s:30m, 1m:1d').description('Потребление')
        }
    }

    /**
     * Данные которые все видят в реальном времени
     * */ 
    shares = {
        isOn: false,            // Включена ли лампа
        brightness: 0,          // Текущая яркость
        status: 'Выключена',    // Текстовый статус
        powerConsumption: 0  // Потребление энергии
    }

    /**
     * Выполняется когда устройство запускается 
     **/
    process() {
        this.render(); // Показываем начальное состояние
        // Раз в секунду отправляем метрики потребления/яркости
        setInterval(()=>{
            this.metric('brightness', this.shares.brightness)
            this.metric('consumption', this.shares.powerConsumption)
        }, 1000)
    }

    /**
     *  Включение/выключение по сигналу от другого устройства
     * */
    inputPower(data) {
        this.shares.isOn = Boolean(data);
        this.updateStatus();
        this.updatePowerConsumption();
        this.render();
        this.notify(`Лампа ${this.shares.isOn ? 'включена' : 'выключена'}`);
    }

    /**
     *  Изменение яркости по сигналу от другого устройства
     * */
    inputBrightness(data) {
        const level = Math.max(0, Math.min(100, Number(data)));
        this.shares.brightness = level;
        this.updatePowerConsumption();
        this.updateStatus();
        this.render();
        this.terminal(`Яркость лампы: ${level}%`);
    }

    /**
     * Расчет потребления энергии
     * */ 
    updatePowerConsumption() {
        if (!this.shares.isOn) {
            this.shares.powerConsumption = 0;
        } else {
            // Пример: 4W на полную яркость
            this.shares.powerConsumption = Math.round((this.shares.brightness / 100) * 4);
        }
    }

    /**
     * Обновление текстового статуса
    */
    updateStatus() {
        if (!this.shares.isOn) this.shares.status = 'Выключена';
        else this.shares.status = `Включена (${this.shares.brightness}%)`;
    }
}

module.exports = SmartBulb;