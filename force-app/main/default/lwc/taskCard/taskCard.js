import { LightningElement, api } from 'lwc';

const HANDLER_COLOR_CLASS = {
    Internal: 'handler-internal',
    Customer: 'handler-customer',
    Other: 'handler-other'
};

export default class TaskCard extends LightningElement {
    @api id;
    @api name;
    @api taskHandler; // Internal | Customer | Other
    @api taskStatus; // used for potential badges in future

    get clippedName() {
        return this.name || '';
    }

    get cardClass() {
        const base = 'task-card slds-p-around_x-small slds-m-vertical_xx-small';
        const handlerClass = HANDLER_COLOR_CLASS[this.taskHandler] || 'handler-other';
        return `${base} ${handlerClass}`;
    }

    handleDragStart(evt) {
        // Keep payload minimal; parent listens to custom event to follow .a4drules (no complex template logic)
        evt.stopPropagation();
        // announce via custom event instead of using dataTransfer to keep logic centralized in container/calendar
        this.dispatchEvent(new CustomEvent('taskdragstart', { detail: { taskId: this.id }, bubbles: true, composed: true }));
    }

    handleSelect() {
        this.dispatchEvent(new CustomEvent('taskselect', { detail: { taskId: this.id }, bubbles: true, composed: true }));
    }
}
