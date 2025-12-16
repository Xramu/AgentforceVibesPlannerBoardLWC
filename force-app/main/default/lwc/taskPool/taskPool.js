import { LightningElement, api } from 'lwc';

// Project rules: keep template simple; compute in JS only.
export default class TaskPool extends LightningElement {
    @api tasks = [];
    @api selectedTask; // forwarded from projectBoard

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
        return 'Not Assigned';
    }
    get internalTitle() {
        return 'OEM Assigned';
    }
    get customerTitle() {
        return 'Customer Assigned';
    }

    byHandler(handler) {
        const items = Array.isArray(this.tasks) ? this.tasks : [];
        const key = handler;
        return items.filter((t) => t.taskHandler && t.taskHandler.trim() === key);
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
