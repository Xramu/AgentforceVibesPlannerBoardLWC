import { LightningElement, wire, track } from 'lwc';
import getTasksByYear from '@salesforce/apex/ProjectBoardService.getTasksByYear';
import shiftTaskByWeeks from '@salesforce/apex/ProjectBoardService.shiftTaskByWeeks';
import setTaskDateToWeekMonday from '@salesforce/apex/ProjectBoardService.setTaskDateToWeekMonday';

export default class ProjectBoard extends LightningElement {
    @track selectedYear = new Date().getFullYear();
    @track weekCount = 52;
    @track currentWeek = null;

    // Data model in-memory
    @track datedTasks = []; // tasks having a date
    @track poolTasks = []; // tasks without a date
    @track selectedTask = null;

    // drag payload
    dragTaskId = null;

    connectedCallback() {
        this.updateCurrentWeek();
    }

    // Recalculate current week when year changes
    updated(changedProperties) {
        if (changedProperties.has('selectedYear')) {
            this.updateCurrentWeek();
        }
    }

    updateCurrentWeek() {
        this.currentWeek = this.computeIsoWeek(new Date());
    }

    // Wire fetch for tasks for selected year
    @wire(getTasksByYear, { year: '$selectedYear' })
    wiredTasks({ error, data }) {
        if (data) {
            this.weekCount = data.weekCount;
            // normalize DTOs for UI
            this.datedTasks = (data.datedTasks || []).map((t) => ({
                ...t,
                week: this.getWeekFromDateString(t.completionDate)
            }));
            // Combine both dated and undated tasks for the pool
            this.poolTasks = [...(data.undatedTasks || []), ...(data.datedTasks || [])];
        } else if (error) {
            // non-blocking for PoC; log and keep UI usable
            // eslint-disable-next-line no-console
            console.error('Failed to load tasks', error);
        }
    }

    // Year navigation labels
    get prevYearLabel() {
        return `${this.selectedYear - 1}`;
    }
    get nextYearLabel() {
        return `${this.selectedYear + 1}`;
    }

    handlePrevYear() {
        this.selectedYear = this.selectedYear - 1;
        this.selectedTask = null;
    }

    handleNextYear() {
        this.selectedYear = this.selectedYear + 1;
        this.selectedTask = null;
    }

    // Child event handlers
    handleTaskDragStart(event) {
        const { taskId } = event.detail || {};
        this.dragTaskId = taskId;
    }

    handleCalendarDrop(event) {
        const { weekNumber } = event.detail || {};
        if (!this.dragTaskId || !weekNumber) return;

        const task = this.findTaskById(this.dragTaskId);
        if (!task) return;

        // Optimistic UI
        const prevState = this.snapshotState();

        try {
            if (!task.completionDate) {
                // from pool -> calendar: set Monday of week
                this.applyTaskMoveToWeek(task.id, weekNumber);
                setTaskDateToWeekMonday({ taskId: task.id, year: this.selectedYear, weekNumber })
                    .then((updated) => this.mergeServerTask(updated))
                    .catch((err) => {
                        this.restoreState(prevState);
                        // eslint-disable-next-line no-console
                        console.error('Failed to set date', err);
                    });
            } else {
                // from week -> other week: keep same weekday if possible
                this.applyTaskReweek(task.id, task.completionDate, weekNumber);
                // server: compute Monday and preserve weekday delta from current date
                // To keep PoC simple and robust, set to Monday (per spec for new date default) if we cannot preserve weekday reliably
                setTaskDateToWeekMonday({ taskId: task.id, year: this.selectedYear, weekNumber })
                    .then((updated) => this.mergeServerTask(updated))
                    .catch((err) => {
                        this.restoreState(prevState);
                        // eslint-disable-next-line no-console
                        console.error('Failed to reweek date', err);
                    });
            }
        } finally {
            this.dragTaskId = null;
        }
    }

    handleTaskReweek(event) {
        // Optional alternative reweek handler if weeks emit a different event
        this.handleCalendarDrop(event);
    }

    handleTaskSelect(event) {
        const { taskId } = event.detail || {};
        if (taskId) {
            const foundTask = this.findTaskById(taskId);
            this.selectedTask = foundTask || null;
        }
    }

    handleTaskChange(event) {
        // Bubble from details after LDS saves; update local copy
        const updated = event.detail && event.detail.task;
        if (!updated || !updated.id) return;
        this.mergeServerTask(updated);
    }

    handleMoveBack() {
        if (!this.selectedTask || !this.selectedTask.completionDate) return;
        const prevState = this.snapshotState();
        // optimistic UI
        this.applyShiftWeeks(this.selectedTask.id, -1);
        shiftTaskByWeeks({ taskId: this.selectedTask.id, weeks: -1 })
            .then((serverTask) => this.mergeServerTask(serverTask))
            .catch((err) => {
                this.restoreState(prevState);
                // eslint-disable-next-line no-console
                console.error('Failed to move back', err);
            });
    }

    handleMoveForward() {
        if (!this.selectedTask || !this.selectedTask.completionDate) return;
        const prevState = this.snapshotState();
        // optimistic UI
        this.applyShiftWeeks(this.selectedTask.id, 1);
        shiftTaskByWeeks({ taskId: this.selectedTask.id, weeks: 1 })
            .then((serverTask) => this.mergeServerTask(serverTask))
            .catch((err) => {
                this.restoreState(prevState);
                // eslint-disable-next-line no-console
                console.error('Failed to move forward', err);
            });
    }

    // UI helpers and state mgmt

    snapshotState() {
        return {
            datedTasks: JSON.parse(JSON.stringify(this.datedTasks)),
            poolTasks: JSON.parse(JSON.stringify(this.poolTasks)),
            selectedTaskId: this.selectedTask ? this.selectedTask.id : null
        };
    }

    restoreState(state) {
        this.datedTasks = state.datedTasks;
        this.poolTasks = state.poolTasks;
        this.selectedTask = state.selectedTaskId ? this.findTaskById(state.selectedTaskId) : null;
    }

    findTaskById(id) {
        return (
            (this.datedTasks && this.datedTasks.find((t) => t.id === id)) ||
            (this.poolTasks && this.poolTasks.find((t) => t.id === id))
        );
    }

    mergeServerTask(serverTask) {
        if (!serverTask || !serverTask.id) return;
        // Remove from both lists, then reinsert based on completionDate
        this.datedTasks = (this.datedTasks || []).filter((t) => t.id !== serverTask.id);
        this.poolTasks = (this.poolTasks || []).filter((t) => t.id !== serverTask.id);

        if (serverTask.completionDate) {
            const week = this.getWeekFromDateString(serverTask.completionDate);
            this.datedTasks = [...this.datedTasks, { ...serverTask, week }];
        } else {
            this.poolTasks = [...this.poolTasks, { ...serverTask }];
        }

        // refresh selectedTask if it was the one
        if (this.selectedTask && this.selectedTask.id === serverTask.id) {
            this.selectedTask = this.findTaskById(serverTask.id);
        }
    }

    applyTaskMoveToWeek(taskId, weekNumber) {
        // Remove from pool and add to dated with synthetic date string of Monday (visual placeholder)
        const task = this.poolTasks.find((t) => t.id === taskId);
        if (!task) return;
        this.poolTasks = this.poolTasks.filter((t) => t.id !== taskId);
        const monday = this.isoWeekMondayDate(this.selectedYear, weekNumber);
        this.datedTasks = [...this.datedTasks, { ...task, completionDate: this.toDateString(monday), week: weekNumber }];
    }

    applyTaskReweek(taskId, dateString, newWeek) {
        const task = this.datedTasks.find((t) => t.id === taskId);
        if (!task) return;
        // Replace with new week and placeholder date on Monday; server will finalize
        const monday = this.isoWeekMondayDate(this.selectedYear, newWeek);
        const updated = { ...task, completionDate: this.toDateString(monday), week: newWeek };
        this.datedTasks = [...this.datedTasks.filter((t) => t.id !== taskId), updated];
        if (this.selectedTask && this.selectedTask.id === taskId) {
            this.selectedTask = updated;
        }
    }

    applyShiftWeeks(taskId, weeks) {
        const inDated = this.datedTasks.find((t) => t.id === taskId);
        if (!inDated) return;
        const date = this.fromDateString(inDated.completionDate);
        const shifted = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7 * weeks);
        const newWeek = this.computeIsoWeek(shifted);
        const updated = { ...inDated, completionDate: this.toDateString(shifted), week: newWeek };
        this.datedTasks = [...this.datedTasks.filter((t) => t.id !== taskId), updated];
        if (this.selectedTask && this.selectedTask.id === taskId) {
            this.selectedTask = updated;
        }
    }

    // Date helpers (Date-only field semantics)
    getWeekFromDateString(dateStr) {
        if (!dateStr) return null;
        const d = this.fromDateString(dateStr);
        return this.computeIsoWeek(d);
    }

    toDateString(d) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    fromDateString(dateStr) {
        // dateStr expected as 'YYYY-MM-DD'
        const [y, m, d] = dateStr.split('-').map((s) => parseInt(s, 10));
        return new Date(y, m - 1, d);
    }

    isoWeekMondayDate(year, weekNumber) {
        // Monday of ISO week1 = Monday of week containing Jan 4th
        const jan4 = new Date(year, 0, 4);
        const week1Monday = this.startOfWeekMonday(jan4);
        const monday = new Date(week1Monday.getFullYear(), week1Monday.getMonth(), week1Monday.getDate() + (weekNumber - 1) * 7);
        return monday;
    }

    startOfWeekMonday(d) {
        const day = d.getDay(); // 0=Sun..6=Sat
        // compute Monday offset
        const diff = (day === 0 ? -6 : 1 - day);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
    }

    computeIsoWeek(d) {
        // ISO: week starts Monday; week 1 is week containing Jan 4
        const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        // Set to nearest Thursday: current date + 4 - current day number (Monday=1, Sunday=7)
        const dayNr = (target.getUTCDay() + 6) % 7; // 0..6 Mon..Sun
        target.setUTCDate(target.getUTCDate() - dayNr + 3);
        const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
        const firstThursdayDayNr = (firstThursday.getUTCDay() + 6) % 7;
        firstThursday.setUTCDate(firstThursday.getUTCDate() - firstThursdayDayNr + 3);
        // Week number is number of weeks between the two Thursdays
        const weekNo = 1 + Math.round((target - firstThursday) / (7 * 24 * 3600 * 1000));
        return weekNo;
    }
}
