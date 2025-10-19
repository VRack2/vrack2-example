// Устройство умного термостата — управляет обогревом на основе заданной температуры
const { Device, Port, Action, Rule } = require("vrack2-core");

class SmartThermostat extends Device {
    /**
     * Сюда приходят данные от датчика температуры и команды на установку цели
     * */
    inputs() {
        return {
            'input.temperature': Port.standart().description('Текущая температура от датчика'),
            'set.target': Port.standart().description('Установить целевую температуру')
        };
    }

    /**
     * Отсюда выходит команда управления обогревателем
     * */
    outputs() {
        return {
            'heater.control': Port.standart().description('Сигнал управления обогревателем (true/false)')
        };
    }

    /**
     * Кнопки управления которые появятся в интерфейсе
     * */
    actions() {
        return {
            'set.target': Action.global().requirements({
                target: Rule.number().min(10).max(35).description('Целевая температура, °C')
            }).description('Установить целевую температуру'),
            'get.status': Action.global().description('Получить текущий статус термостата')
        };
    }

    /**
     * Данные которые сохраняются между перезапусками
     * */
    storage = {
        targetTemp: 23.0
    };

    /**
     * Данные которые все видят в реальном времени
     * */
    shares = {
        currentTemp: null,
        targetTemp: 23.0,
        heaterOn: false,
        status: 'Ожидание данных'
    };

    /**
     * Запускается когда устройство включается
     * */
    process() {
        if (this.storage.targetTemp !== undefined) this.shares.targetTemp = this.storage.targetTemp;
        this.render();
    }

    /**
     * Обработчик входящей температуры от датчика
     * */
    inputInputTemperature(temp) {
        this.shares.currentTemp = parseFloat(temp);
        this.evaluateHeater();
        this.render();
    }

    /**
     * Обработчик команды установки целевой температуры через порт
     * */
    inputSetTarget(target) {
        this.setTargetTemperature(parseFloat(target));
    }

    /**
     * Обработчик кнопки установки целевой температуры
     * */
    async actionSetTarget(data) {
        this.setTargetTemperature(data.target);
        return { success: true, target: this.shares.targetTemp };
    }

    /**
     * Обработчик кнопки получения статуса
     * */
    async actionGetStatus() {
        return this.shares;
    }

    /**
     * Устанавливает новую целевую температуру и сохраняет её
     * */
    setTargetTemperature(temp) {
        this.storage.targetTemp = temp;
        this.shares.targetTemp = temp;
        this.save();
        this.evaluateHeater();
        this.notify(`Целевая температура установлена: ${temp}°C`);
        this.render();
    }

    /**
     * Оценивает необходимость включения/выключения обогрева
     * */
    evaluateHeater() {
        if (this.shares.currentTemp === null) return;

        const diff = this.shares.targetTemp - this.shares.currentTemp;
        const newHeaterState = diff > 0.5; // гистерезис ±0.5°C

        if (newHeaterState !== this.shares.heaterOn) {
            this.shares.heaterOn = newHeaterState;
            this.shares.status = newHeaterState ? 'Обогрев ВКЛ' : 'Обогрев ВЫКЛ';
            if (this.ports.output['heater.control'].connected) {
                this.ports.output['heater.control'].push(newHeaterState);
            }
            this.notify(this.shares.status);
        }

        // Критические уведомления
        if (this.shares.currentTemp < 10 || this.shares.currentTemp > 40) {
            this.alert(`КРИТИЧЕСКАЯ ТЕМПЕРАТУРА: ${this.shares.currentTemp}°C!`);
        }
    }
}

module.exports = SmartThermostat;