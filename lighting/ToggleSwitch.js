// Подключаем базовые инструменты VRack2 для создания устройств
const { Device, Port, Action, Rule } = require("vrack2-core");

/**
 *  Создаем класс кнопки-переключателя
 * */
class ToggleSwitch extends Device {
    
    /**
     *  Определяем ВХОДЫ устройства - куда можно подавать сигналы и данные
     * */ 
    inputs() {
        return {
            'toggle': Port.standart().description('Сюда можно послать сигнал чтобы переключить кнопку')
        }
    }

    /**
     *  Определяем ВЫХОДЫ устройства - куда оно само может отправлять сигналы и данные
     * */
    outputs() {
        return {
            'state': Port.standart().description('Отсюда выходит текущее состояние кнопки (вкл/выкл)')
        }
    }

    /**
     * Регистрируем КНОПКИ-ДЕЙСТВИЯ которые можно нажимать извне
     * */
    actions() {
        return {
            'toggle': Action.global()
                .description('Отправьте экшен что бы переключить кнопку'),
            'get.state': Action.global().returns({
                isOn: Rule.boolean().description('Состояние кнопки'),
                label: Rule.string().description('Текстовое состояние кнопки')
            }).description('Узнать текущее состояние кнопки')
        }
    }

    /**
     * Данные которые видны всем в реальном времени
     * */ 
    shares = {
        isOn: false,           // Текущее состояние
        label: 'Выключен'      // Текст для красоты
    }

    /**
     * Этот метод запускается когда устройство включается
     *  */ 
    process() {
        this.render(); // Показываем начальное состояние
    }

    /**
     * Обработчик кнопки "toggle" - вызывается когда кто-то нажимает экшен
     * */
    async actionToggle() {
        this.toggleState(); // Переключаем состояние
        return { 
            success: true, 
            state: this.shares.isOn,
            message: this.shares.label 
        };
    }

    /**
     * Обработчик кнопки "get.state" - просто возвращает текущее состояние
     * */ 
    async actionGetState() {
        return this.shares
    }

    /**
     * Обработчик входящего сигнала на порт "toggle"
     * */
    inputToggle() {
        this.toggleState(); // Тоже переключаем, но уже по сигналу а не по кнопке
    }

    /**
     * Магия переключения состояния!
     * */
    toggleState() {
        // Меняем состояние на противоположное
        this.shares.isOn = !this.shares.isOn;
        this.shares.label = this.shares.isOn ? 'Включен' : 'Выключен';
        
        // Если кто-то подключен к выходу "state" - отправляем ему новое состояние
        if (this.ports.output.state.connected) {
            this.ports.output.state.push(this.shares.isOn);
        }
        
        // Обновляем данные для всех кто смотрит
        this.render();
        // Отправляем уведомление о переключении
        this.notify(`Переключено: ${this.shares.label}`);
    }
}
module.exports = ToggleSwitch;