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

    updateButtonVariants(task) {
        console.log("Updating button variants.");
        console.log("Task:", this.task);

        this.task ??= task;
        if (!this.task) return;
        
        // Highlight selected handler
        this.handlerOptions = this.handlerOptions.map((opt) => {
            const isSelected = opt.value === this.task.taskHandler;
            let className = 'custom-button';
            
            // Add handler-specific class
            if (opt.value === 'Internal') {
                className += ' handler-btn-internal';
            } else if (opt.value === 'Customer') {
                className += ' handler-btn-customer';
            } else if (opt.value === 'Other') {
                className += ' handler-btn-other';
            }
            
            // Add selected state
            if (isSelected) {
                className += ' slds-button_brand';
            }

            console.log(className);
            
            return {
                ...opt,
                class: className
            };
        });
        
        // Highlight selected status
        this.statusOptions = this.statusOptions.map((opt) => {
            const isSelected = opt.value === this.task.taskStatus;
            let className = 'custom-button';
            
            // Add status-specific class
            if (opt.value === 'Not Started') {
                className += ' status-btn-not-started';
            } else if (opt.value === 'On Track') {
                className += ' status-btn-on-track';
            } else if (opt.value === 'Late') {
                className += ' status-btn-late';
            } else if (opt.value === 'On Hold') {
                className += ' status-btn-on-hold';
            } else if (opt.value === 'Completed') {
                className += ' status-btn-completed';
            } else if (opt.value === 'Closed, not Completed') {
                className += ' status-btn-closed-not-completed';
            }
            
            // Add selected state
            if (isSelected) {
                className += ' slds-button_brand';
            }
            
            return {
                ...opt,
                class: className
            };
        });
    }

    get noDate() {
        return !this.task || !this.task.completionDate;
    }

    handleChangeName(event) {
        const newName = event.target.value;
        this.updateTaskLocally('name', newName);
    }

    handleChangeDescription(event) {
        // lightning-input-rich-text also surfaces its content as event.target.value (HTML string)
        const newDescHtml = event.target.value;
        this.updateTaskLocally('taskDescription', newDescHtml);
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
        console.log("Updated called with properties:", Array.from(changedProperties.keys()));
        if (changedProperties.has('task')) {
            console.log("Task property changed, updating button variants");
            this.updateButtonVariants();
        }
    }

    // Ensure task details are updated when task property changes
    rendered() {
        // Force update button variants when component is rendered
        // This acts as a fallback mechanism
        console.log("Rendered - checking if we need to update button variants");
        if (this.task) {
            this.updateButtonVariants();
        }
    }
    
    // Expose a method to manually trigger button variant updates
    // This can be called from parent components when needed
    @api refreshButtonVariants(task) {
        console.log("Manually refreshing button variants");
        this.updateButtonVariants(task);
    }
}
