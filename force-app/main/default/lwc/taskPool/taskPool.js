import { LightningElement, api } from 'lwc';

// Project rules: keep template simple; compute in JS only.
export default class TaskPool extends LightningElement {
    @api tasks = [];
    @api selectedTask; // forwarded from projectBoard

    // Filter tasks that have no completion date (undated tasks)
    get undatedTasks() {
        const items = Array.isArray(this.tasks) ? this.tasks : [];
        return items.filter((t) => !t.completionDate);
    }

    // Grouping by handler, ordered sections: Other, Internal, Customer
    get otherTasks() {
        return this.byHandler('Other');
    }
    get internalTasks() {
        return this.byHandler('Internal');
    }
    get customerTasks() {
        return this.byHandler('Customer');
    }

    // Section titles mapping (Other -> "None", Internal -> "OEM", Customer -> "Customer")
    get otherTitle() {
        return 'None';
    }
    get internalTitle() {
        return 'OEM';
    }
    get customerTitle() {
        return 'Customer';
    }

    byHandler(handler) {
        const items = Array.isArray(this.tasks) ? this.tasks : [];
        const key = handler;
        return items.filter((t) => t.completionDate && t.taskHandler && t.taskHandler.trim() === key);
    }

    // Relay child events upward so container can manage state
    relayDragStart(event) {
        event.stopPropagation();
        this.dispatchEvent(
            new CustomEvent('taskdragstart', {
                detail: { taskId: (event.detail && event.detail.taskId) || null },
                bubbles: true,
                composed: true
            })
        );
    }

    relaySelect(event) {
        event.stopPropagation();
        this.dispatchEvent(
            new CustomEvent('taskselect', {
                detail: { taskId: (event.detail && event.detail.taskId) || null },
                bubbles: true,
                composed: true
            })
        );
    }
}
