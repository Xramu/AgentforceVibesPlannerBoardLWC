import { LightningElement, api } from 'lwc';

export default class TaskCalendar extends LightningElement {
    @api year;
    @api weekCount = 52;
    @api datedTasks = [];
    @api currentWeek;
    @api selectedTask; // forwarded from projectBoard to week cells/cards

    get weeks() {
        const weeks = [];
        const count = this.weekCount || 52;
        // Only mark the current week of the currently displayed year as current
        // We need to compute what the current week is within this year
        const currentWeekInThisYear = this.getCurrentWeekInThisYear();
        for (let i = 1; i <= count; i++) {
            weeks.push({
                number: i,
                isCurrent: i === currentWeekInThisYear,
                tasks: this.tasksForWeek(i)
            });
        }
        return weeks;
    }

    getCurrentWeekInThisYear() {
        // If the current year we're viewing is the actual current year,
        // then use the real current week. Otherwise, return null or 0 to not highlight
        if (this.year === new Date().getFullYear()) {
            return this.currentWeek;
        }
        return null; // Don't highlight any week for non-current years
    }

    tasksForWeek(weekNumber) {
        const items = Array.isArray(this.datedTasks) ? this.datedTasks : [];
        return items.filter((t) => t.week === weekNumber && t.completionDate);
    }

    // Native DnD: allow drop on the calendar container (fallback if a week doesn't catch)
    allowDrop(evt) {
        evt.preventDefault();
    }

    handleDropOnCalendar(evt) {
        // no-op; real handling is at week level which emits 'taskdrop'
        evt.preventDefault();
    }

    // Relay events up to the container
    relayDrop(event) {
        event.stopPropagation();
        const detail = event.detail || {};
        this.dispatchEvent(
            new CustomEvent('taskdrop', {
                detail,
                bubbles: true,
                composed: true
            })
        );
    }

    relaySelect(event) {
        // Simply relay the event from week cells or task cards
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
}
