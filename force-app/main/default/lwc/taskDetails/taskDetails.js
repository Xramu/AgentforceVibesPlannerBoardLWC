import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import updateTask from '@salesforce/apex/ProjectBoardService.updateTask';

const HANDLER_OPTIONS = [
    { value: 'Internal', label: 'Internal', variant: 'neutral' },
    { value: 'Customer', label: 'Customer', variant: 'neutral' },
    { value: 'Other', label: 'Other', variant: 'neutral' }
];

const STATUS_OPTIONS = [
    { value: 'Not Started', label: 'Not Started', variant: 'neutral' },
    { value: 'On Track', label: 'On Track', variant: 'neutral' },
    { value: 'Late', label: 'Late', variant: 'neutral' },
    { value: 'On Hold', label: 'On Hold', variant: 'neutral' },
    { value: 'Completed', label: 'Completed', variant: 'neutral' },
    { value: 'Closed, not Completed', label: 'Closed', variant: 'neutral' }
];

export default class TaskDetails extends LightningElement {
    @api task;

    @track handlerOptions = HANDLER_OPTIONS.map((opt) => ({ ...opt }));
    @track statusOptions = STATUS_OPTIONS.map((opt) => ({ ...opt }));

    updateButtonVariants() {
        if (!this.task) return;
        // Highlight selected handler
        this.handlerOptions = this.handlerOptions.map((opt) => ({
            ...opt,
            variant: opt.value === this.task.taskHandler ? 'brand' : 'neutral'
        }));
        // Highlight selected status
        this.statusOptions = this.statusOptions.map((opt) => ({
            ...opt,
            variant: opt.value === this.task.taskStatus ? 'brand' : 'neutral'
        }));
    }

    get noDate() {
        return !this.task || !this.task.completionDate;
    }

    handleChangeName(event) {
        const newName = event.target.value;
        this.updateTaskLocally('name', newName);
    }

    handleChangeDescription(event) {
        const newDesc = event.target.value;
        this.updateTaskLocally('taskDescription', newDesc);
    }

    handleChangeCompletionDate(event) {
        const newDate = event.target.value;
        this.updateTaskLocally('completionDate', newDate);
    }

    handleHandlerChange(event) {
        const newHandler = event.target.dataset.value;
        this.updateTaskLocally('taskHandler', newHandler);
    }

    handleStatusChange(event) {
        const newStatus = event.target.dataset.value;
        this.updateTaskLocally('taskStatus', newStatus);
    }

    handleMoveBack() {
        this.dispatchEvent(new CustomEvent('moveback'));
    }

    handleMoveForward() {
        this.dispatchEvent(new CustomEvent('moveforward'));
    }

    updateTaskLocally(field, value) {
        if (!this.task) return;
        const updated = { ...this.task, [field]: value };
        this.task = updated;
        // Notify parent (projectBoard) of change
        this.dispatchEvent(
            new CustomEvent('taskchange', {
                detail: { task: updated },
                bubbles: true,
                composed: true
            })
        );
        // Optimistically update on UI
        this.applyOptimisticUpdate(updated);
    }

    applyOptimisticUpdate(updatedTask) {
        // This is handled by parent (projectBoard.js) in mergeServerTask
        // We just notify the parent
    }

    // Override to update variants when task changes externally
    updated(changedProperties) {
        if (changedProperties.has('task')) {
            this.updateButtonVariants();
        }
    }

    // Ensure task details are updated when task property changes
    rendered() {
        // This will be called after every render, but we only want to update button variants
        // when the task actually changes, which is handled by the updated() method
    }
}
