import { LightningElement, api } from 'lwc';

export default class TaskCalendar extends LightningElement {
    @api year;
    @api weekCount = 52;
    @api datedTasks = [];
    @api currentWeek;

    get weeks() {
        const weeks = [];
        const count = this.weekCount || 52;
        for (let i = 1; i <= count; i++) {
            weeks.push({
                number: i,
                isCurrent: i === this.currentWeek,
                tasks: this.tasksForWeek(i)
            });
        }
        return weeks;
    }

    tasksForWeek(weekNumber) {
        const items = Array.isArray(this.datedTasks) ? this.datedTasks : [];
        return items.filter((t) => t.week === weekNumber);
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
