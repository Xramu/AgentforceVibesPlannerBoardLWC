import { LightningElement, api } from 'lwc';

export default class WeekCell extends LightningElement {
    @api number;
    @api current = false;
    @api tasks = [];
    @api currentYear; // The year this week belongs to

    get cellClass() {
        const base = 'week-cell slds-p-around_x-small slds-m-around_xx-small';
        // Only highlight if this week is marked as current
        return this.current ? `${base} current-week` : base;
    }

    // Native DnD
    allowDrop(evt) {
        evt.preventDefault();
    }

    handleDrop(evt) {
        evt.preventDefault();
        const weekNumber = this.number;
        if (!weekNumber) return;
        // Emit custom event to parent (calendar) with week number
        this.dispatchEvent(
            new CustomEvent('taskdrop', {
                detail: { weekNumber },
                bubbles: true,
                composed: true
            })
        );
    }

    handleSelect(event) {
        // When a task card inside this week is clicked, we want to bubble that task's ID
        // The task card should already have bubbled its task ID, but if we're clicking on the week itself,
        // we can just bubble the week number for context (though this is less common)
        // For now, let's just bubble the week number for consistency with current behavior
        // The real issue is that when a task card is clicked, the event should bubble up with task ID
        // The task card component should be handling this properly
        
        // Since we don't have direct access to the task here, we'll bubble the week number
        // but the actual task selection should happen at the taskCard level
        this.dispatchEvent(
            new CustomEvent('taskselect', {
                detail: { weekNumber: this.number },
                bubbles: true,
                composed: true
            })
        );
    }

    // Relay child events upward
    relayDragStart(event) {
        event.stopPropagation();
        const detail = event.detail || {};
        this.dispatchEvent(
            new CustomEvent('taskdragstart', {
                detail,
                bubbles: true,
                composed: true
            })
        );
    }

    relaySelect(event) {
        event.stopPropagation();
        const detail = event.detail || {};
        this.dispatchEvent(
            new CustomEvent('taskselect', {
                detail,
                bubbles: true,
                composed: true
            })
        );
    }
}
