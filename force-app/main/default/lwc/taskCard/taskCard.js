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

    // Selected task provided by parent (e.g., projectBoard)
    @api selectedTask; // may be null

    get clippedName() {
        return this.name || '';
    }

    // Avoid inline expressions in template; compute classes here
    get cardClass() {
        const base = 'task-card slds-p-around_x-small slds-m-vertical_xx-small';
        const handlerClass = HANDLER_COLOR_CLASS[this.taskHandler] || 'handler-other';
        const selectedClass = this.isSelected ? 'is-selected' : '';
        return `${base} ${handlerClass} ${selectedClass}`.trim();
    }

    // Determine if this card is the currently selected one; guard for nulls
    get isSelected() {
        const sel = this.selectedTask;
        if (!sel || !sel.id) return false;
        return this.id.includes(sel.id);
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
