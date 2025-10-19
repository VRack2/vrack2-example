// Устройство имитирует обогреватель — реагирует на команды включения/выключения
const { Device, Port, Metric } = require("vrack2-core");

class HeaterSimulator extends Device {
    /**
     * Сюда приходит команда включения или выключения
     * */
    inputs() {
        return {
            'power': Port.standart().description('Включить/выключить обогреватель')
        };
    }

    /**
     * Регистрируем метрику состояния обогревателя
     * */
    metrics() {
        return {
            'heater.on': Metric.inS().retentions('1s:10m').description('Состояние обогревателя (0/1)')
        };
    }

    /**
     * Данные которые все видят в реальном времени
     * */
    shares = {
        isOn: false,
        status: 'Выключен'
    };

    /**
     * Запускается когда устройство включается
     * */
    process() {
        this.render();
        setInterval(() => {
            this.metric('heater.on', this.shares.isOn ? 1 : 0);
        }, 1000);
    }

    /**
     * Обработчик команды управления питанием
     * */
    inputPower(state) {
        this.shares.isOn = Boolean(state);
        this.shares.status = this.shares.isOn ? 'Включен' : 'Выключен';
        this.render();
        this.terminal(`Обогреватель: ${this.shares.status}`);
    }
}

module.exports = HeaterSimulator;