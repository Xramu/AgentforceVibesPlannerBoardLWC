import { LightningElement, api } from 'lwc';

// Project rules: keep template simple; compute in JS only.
export default class TaskPool extends LightningElement {
    @api tasks = [];

    get notStarted() {
        return this.byStatus('Not Started');
    }
    get onTrack() {
        return this.byStatus('On Track');
    }
    get late() {
        return this.byStatus('Late');
    }
    get onHold() {
        return this.byStatus('On Hold');
    }
    get completed() {
        return this.byStatus('Completed');
    }
    get closedNotCompleted() {
        return this.byStatus('Closed, not Completed');
    }

    byStatus(status) {
        const items = Array.isArray(this.tasks) ? this.tasks : [];
        return items.filter((t) => t.taskStatus === status);
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
