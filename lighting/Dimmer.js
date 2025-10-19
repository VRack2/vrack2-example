// Создаем регулятор яркости - как поворотная ручка на лампе
const { Device, Port, Action, Rule } = require("vrack2-core");

class Dimmer extends Device {
    
    /**
     * Сюда можно присылать команды изменения яркости
     * */ 
    inputs() {
        return {
            'set.level': Port.standart().description('Поставь сюда конкретную яркость (0-100)'),
            'adjust': Port.standart().description('Добавь или убавь яркость (± число)')
        }
    }

    /**
     * Отсюда выходит текущая яркость для других устройств
     * */
    outputs() {
        return { 'level': Port.standart().description('Текущий уровень яркости') }
    }


    /**
     *  Кнопки управления которые появятся в интерфейсе
     * */
    actions() {
        return {
            'set.brightness': Action.global().requirements({ 
                level: Rule.number().min(0).max(100).description("Число уровня яркости 0-100")
            }).description('Установить яркость'),
            'get.brightness': Action.global()
                .description('Узнать текущую яркость')
        }
    }

    /**
     *  Настройки которые можно менять в файле сервиса
     * */
    checkOptions() {
        return {
            initialLevel: Rule.number().default(50).min(0).max(100).description('Начальная яркость при включении')
        }
    }

    /**
     * Данные которые все видят в реальном времени
     * */ 
    shares = {
        brightness: 50,        // Текущая яркость (0-100)
        percentage: '50%'      // Красивая надпись с процентом
    }

    /**
     * Запускается когда устройство включается
     * */ 
    process() {
        // Ставим начальную яркость из настроек
        this.shares.brightness = this.options.initialLevel;
        this.updatePercentage();
        this.render();
    }

    /**
     * Обработчик кнопки установки яркости
     * */
    async actionSetBrightness(data) {
        this.setBrightness(data.level);
        return {
            success: true,
            brightness: this.shares.brightness,
            message: `Яркость установлена на ${this.shares.percentage}`
        };
    }

    /**
     *  Обработчик кнопки проверки яркости
     * */
    async actionGetBrightness() {
        return {
            brightness: this.shares.brightness,
            percentage: this.shares.percentage,
            timestamp: Date.now()
        };
    }

    /**
     *  Установить конкретную яркость (сигнал от другого устройства)
     * */
    inputSetLevel(data) {
        const level = Math.max(0, Math.min(100, Number(data)));
        this.setBrightness(level);
    }

    /**
     *  Изменить яркость относительно текущей (сигнал от другого устройства)
     * */
    inputAdjust(data) {
        const adjustment = Number(data);
        this.setBrightness(this.shares.brightness + adjustment);
    }

    /**
     *  Внутренняя магия установки яркости
     * */
    setBrightness(level) {
        const newLevel = Math.max(0, Math.min(100, level));
        this.shares.brightness = newLevel;
        this.updatePercentage();
        
        // Если кто-то подключен к выходу - отправляем новую яркость
        if (this.ports.output.level.connected) {
            this.ports.output.level.push(newLevel);
        }
        
        this.render();
        this.terminal(`Яркость изменена: ${newLevel}%`);
    }

    /**
     * Обновляем красивую надпись с процентом
     * */ 
    updatePercentage() {
        this.shares.percentage = `${this.shares.brightness}%`;
    }
}

module.exports = Dimmer;