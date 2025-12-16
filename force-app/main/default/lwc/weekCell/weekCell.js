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

    handleSelect() {
        console.log("Select Fired!");
        // Select this week's tasks (or just the week?)
        // For now, we'll just bubble the click to the calendar
        // If we want to select a specific task within the week, we'd need to adjust
        // For now, clicking a week is a no-op unless we want to select the week itself
        // Let's just bubble the click to the calendar for consistency with task selection
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
