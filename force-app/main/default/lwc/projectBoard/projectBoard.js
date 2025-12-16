import { LightningElement, wire, track } from 'lwc';
import getTasksByYear from '@salesforce/apex/ProjectBoardService.getTasksByYear';
import getAllProjects from '@salesforce/apex/ProjectBoardService.getAllProjects';
import shiftTaskByWeeks from '@salesforce/apex/ProjectBoardService.shiftTaskByWeeks';
import setTaskDateToWeekMonday from '@salesforce/apex/ProjectBoardService.setTaskDateToWeekMonday';

export default class ProjectBoard extends LightningElement {
    @track selectedYear = new Date().getFullYear();
    @track weekCount = 52;
    @track currentWeek = null;

    // Data model in-memory
    @track allTasks = []; // all tasks combined
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
        this.currentWeek = this.computeSundayBasedWeek(new Date());
    }

    // Wire fetch for tasks for selected year
    @wire(getTasksByYear, { year: '$selectedYear' })
    wiredTasks({ error, data }) {
        if (data) {
            this.weekCount = data.weekCount;
            // normalize DTOs for UI
            const allTasks = (data.datedTasks || []).concat(data.undatedTasks || []).map((t) => {
                const task = { ...t };
                if (task.completionDate) {
                    task.week = this.getWeekFromDateString(task.completionDate);
                }
                return task;
            });
            this.allTasks = allTasks;
        } else if (error) {
            // non-blocking for PoC; log and keep UI usable
            // eslint-disable-next-line no-console
            console.error('Failed to load tasks', error);
        }
    }

    // Wire fetch for projects
    @wire(getAllProjects)
    wiredProjects({ error, data }) {
        if (data) {
            // Transform data to match lightning-combobox format (label and value)
            const projectsWithLabels = data.map(project => ({
                label: project.name,
                value: project.id
            }));
            // Add "All Projects" option at the beginning
            this.projects = [{ label: 'All Projects', value: null }, ...projectsWithLabels];
        } else if (error) {
            // non-blocking for PoC; log and keep UI usable
            // eslint-disable-next-line no-console
            console.error('Failed to load projects', error);
        }
    }

    // Selected project tracking
    @track selectedProjectId = null;
    @track projects = [];
    
    // Get filtered tasks based on selected project
    get filteredTasks() {
        if (!this.selectedProjectId) {
            return this.allTasks;
        }
        return this.allTasks.filter(task => task.assignedProjectId === this.selectedProjectId);
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

    handleProjectChange(event) {
        this.selectedProjectId = event.detail.value;
    }

    // Child event handlers
    handleTaskDragStart(event) {
        const { taskId } = event.detail || {};
        this.dragTaskId = taskId;
        console.log(this.dragTaskId);
    }

    handleCalendarDrop(event) {
        const { weekNumber } = event.detail || {};
        if (!this.dragTaskId || !weekNumber) return;

        const task = this.findTaskById(this.dragTaskId);
        if (!task) return;

        // Optimistic UI
        const prevState = this.snapshotState();

        try {
            // from pool -> calendar: set Monday of week
            this.applyTaskMoveToWeek(task.id, weekNumber);
            setTaskDateToWeekMonday({ taskId: task.id, year: this.selectedYear, weekNumber })
                .then((updated) => this.mergeServerTask(updated))
                .catch((err) => {
                    this.restoreState(prevState);
                    // eslint-disable-next-line no-console
                    console.error('Failed to set date', err);
                });
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
            
            // Refresh button variants in task details when a task is selected
            const taskDetailsComponent = this.template.querySelector('c-task-details');
            if (taskDetailsComponent && typeof taskDetailsComponent.refreshButtonVariants === 'function') {
                taskDetailsComponent.refreshButtonVariants(foundTask);
            }
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
            allTasks: JSON.parse(JSON.stringify(this.allTasks)),
            selectedTaskId: this.selectedTask ? this.selectedTask.id : null
        };
    }

    restoreState(state) {
        this.allTasks = state.allTasks;
        this.selectedTask = state.selectedTaskId ? this.findTaskById(state.selectedTaskId) : null;
    }

    findTaskById(id) {
        return this.allTasks.find((t) => id.includes(t.id));
    }

    mergeServerTask(serverTask) {
        if (!serverTask || !serverTask.id) return;
        
        // Find the task in allTasks
        const taskIndex = this.allTasks.findIndex((t) => t.id === serverTask.id);
        
        // Update the task in-place if it exists
        if (taskIndex !== -1) {
            // Task exists, update it
            const updatedTask = { ...this.allTasks[taskIndex], ...serverTask };
            if (serverTask.completionDate) {
                updatedTask.week = this.getWeekFromDateString(serverTask.completionDate);
            }
            this.allTasks = [
                ...this.allTasks.slice(0, taskIndex),
                updatedTask,
                ...this.allTasks.slice(taskIndex + 1)
            ];
        } else {
            // Task doesn't exist, add it
            const taskToAdd = { ...serverTask };
            if (serverTask.completionDate) {
                taskToAdd.week = this.getWeekFromDateString(serverTask.completionDate);
            }
            this.allTasks = [...this.allTasks, taskToAdd];
        }

        // refresh selectedTask if it was the one
        if (this.selectedTask && this.selectedTask.id === serverTask.id) {
            this.selectedTask = this.findTaskById(serverTask.id);
        }
    }

    applyTaskMoveToWeek(taskId, weekNumber) {
        // Remove from allTasks and add to dated with synthetic date string of Sunday (visual placeholder)
        const task = this.allTasks.find((t) => t.id === taskId);
        if (!task) return;
        this.allTasks = this.allTasks.filter((t) => t.id !== taskId);
        const sunday = this.isoWeekSundayDate(this.selectedYear, weekNumber);
        const newTask = { ...task, completionDate: this.toDateString(sunday), week: weekNumber };
        this.allTasks = [...this.allTasks, newTask];
    }

    applyTaskReweek(taskId, dateString, newWeek) {
        const task = this.allTasks.find((t) => t.id === taskId);
        if (!task) return;
        // Replace with new week and placeholder date on Sunday; server will finalize
        const sunday = this.isoWeekSundayDate(this.selectedYear, newWeek);
        const updated = { ...task, completionDate: this.toDateString(sunday), week: newWeek };
        this.allTasks = [...this.allTasks.filter((t) => t.id !== taskId), updated];
        if (this.selectedTask && this.selectedTask.id === taskId) {
            this.selectedTask = updated;
        }
    }

    applyShiftWeeks(taskId, weeks) {
        const inDated = this.allTasks.find((t) => t.id === taskId);
        if (!inDated) return;
        const date = this.fromDateString(inDated.completionDate);
        const shifted = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7 * weeks);
        const newWeek = this.computeSundayBasedWeek(shifted);
        const updated = { ...inDated, completionDate: this.toDateString(shifted), week: newWeek };
        this.allTasks = [...this.allTasks.filter((t) => t.id !== taskId), updated];
        if (this.selectedTask && this.selectedTask.id === taskId) {
            this.selectedTask = updated;
        }
    }

    // Date helpers (Date-only field semantics)
    getWeekFromDateString(dateStr) {
        if (!dateStr) return null;
        const d = this.fromDateString(dateStr);
        return this.computeSundayBasedWeek(d);
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

    isoWeekSundayDate(year, weekNumber) {
        // Sunday of week1 = Sunday of week containing Jan 4th
        const jan4 = new Date(year, 0, 4);
        const week1Sunday = this.startOfWeekSunday(jan4);
        const sunday = new Date(week1Sunday.getFullYear(), week1Sunday.getMonth(), week1Sunday.getDate() + (weekNumber - 1) * 7);
        return sunday;
    }

    startOfWeekSunday(d) {
        const day = d.getDay(); // 0=Sun..6=Sat
        // compute Sunday offset
        const diff = (day === 0 ? 0 : 7 - day);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
    }

    computeSundayBasedWeek(d) {
        // Week starts Sunday; week 1 is week containing Jan 4th
        const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        // Set to nearest Thursday: current date + 4 - current day number (Sunday=0, Saturday=6)
        const dayNr = target.getUTCDay(); // 0..6 Sun..Sat
        target.setUTCDate(target.getUTCDate() - dayNr + 3);
        const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
        const firstThursdayDayNr = firstThursday.getUTCDay();
        firstThursday.setUTCDate(firstThursday.getUTCDate() - firstThursdayDayNr + 3);
        // Week number is number of weeks between the two Thursdays
        const weekNo = 1 + Math.round((target - firstThursday) / (7 * 24 * 3600 * 1000));
        return weekNo;
    }
}
