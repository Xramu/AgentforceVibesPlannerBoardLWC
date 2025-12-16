import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import updateTaskName from '@salesforce/apex/ProjectBoardService.updateTaskName';
import updateTaskDescription from '@salesforce/apex/ProjectBoardService.updateTaskDescription';
import updateTaskCompletionDate from '@salesforce/apex/ProjectBoardService.updateTaskCompletionDate';
import updateTaskHandler from '@salesforce/apex/ProjectBoardService.updateTaskHandler';
import updateTaskStatus from '@salesforce/apex/ProjectBoardService.updateTaskStatus';
import updateTaskAssignedProject from '@salesforce/apex/ProjectBoardService.updateTaskAssignedProject';

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
    @track isSaving = false;
    @track saveButtonLabel = 'Save Changes';
    @track _pendingChanges = {};

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
        this.setPendingChange('name', newName);
    }

    handleChangeDescription(event) {
        // lightning-input-rich-text surfaces its content as event.target.value (HTML string)
        const newDescHtml = event.target.value;
        this.updateTaskLocally('taskDescription', newDescHtml);
        this.setPendingChange('taskDescription', newDescHtml);
    }

    handleChangeCompletionDate(event) {
        const newDate = event.target.value;
        this.updateTaskLocally('completionDate', newDate);
        this.setPendingChange('completionDate', newDate);
    }

    handleHandlerChange(event) {
        const newHandler = event.target.dataset.value;
        this.updateTaskLocally('taskHandler', newHandler);
        this.setPendingChange('taskHandler', newHandler);
    }

    handleStatusChange(event) {
        const newStatus = event.target.dataset.value;
        this.updateTaskLocally('taskStatus', newStatus);
        this.setPendingChange('taskStatus', newStatus);
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
        // Parent (projectBoard.js) merges authoritative server task in mergeServerTask
        // Here we only notify parent; server sync handled in persistField()
    }

    setPendingChange(field, value) {
        // Store pending changes to be saved later
        this._pendingChanges = { ...this._pendingChanges, [field]: value };
    }

    // Save all pending changes to the server
    async handleSave() {
        if (!this.task || !this.task.id || Object.keys(this._pendingChanges).length === 0) {
            return;
        }

        this.isSaving = true;
        this.saveButtonLabel = 'Saving...';

        try {
            // Collect all pending changes
            const changes = { ...this._pendingChanges };
            
            // Reset pending changes
            this._pendingChanges = {};
            
            // Process each change
            const promises = [];
            for (const [fieldName, value] of Object.entries(changes)) {
                const promise = this.persistField(fieldName, value);
                promises.push(promise);
            }
            
            // Wait for all saves to complete
            await Promise.all(promises);
            
            // Show success message
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Task changes saved successfully.',
                    variant: 'success'
                })
            );
        } catch (error) {
            // Show error message
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Save failed',
                    message: (error && error.body && error.body.message) ? error.body.message : 'Unable to save task changes.',
                    variant: 'error'
                })
            );
        } finally {
            this.isSaving = false;
            this.saveButtonLabel = 'Save Changes';
        }
    }

    // Persist a single field to server using Apex, debounce rapid changes for rich text
    persistField(fieldName, value) {
        if (!this.task || !this.task.id) {
            return Promise.resolve();
        }

        // Debounce map per-field to avoid flooding server for rich text typing
        this._debouncers ??= {};
        const key = fieldName;
        if (this._debouncers[key]) {
            clearTimeout(this._debouncers[key]);
        }

        const commit = () => {
            let apexMethod;
            let params;
            
            // Select the appropriate Apex method based on the field being updated
            switch(fieldName) {
                case 'name':
                    apexMethod = updateTaskName;
                    params = { taskId: this.task.id, name: value };
                    break;
                case 'taskDescription':
                    apexMethod = updateTaskDescription;
                    params = { taskId: this.task.id, description: value };
                    break;
                case 'completionDate':
                    apexMethod = updateTaskCompletionDate;
                    params = { taskId: this.task.id, completionDate: value };
                    break;
                case 'taskHandler':
                    apexMethod = updateTaskHandler;
                    params = { taskId: this.task.id, handler: value };
                    break;
                case 'taskStatus':
                    apexMethod = updateTaskStatus;
                    params = { taskId: this.task.id, status: value };
                    break;
                case 'assignedProjectId':
                    apexMethod = updateTaskAssignedProject;
                    params = { taskId: this.task.id, assignedProjectId: value };
                    break;
                default:
                    // If we don't recognize the field, fall back to the old behavior
                    // This shouldn't happen in our current implementation
                    const payload = {
                        id: this.task.id,
                        name: fieldName === 'name' ? value : this.task.name,
                        taskDescription: fieldName === 'taskDescription' ? value : this.task.taskDescription,
                        completionDate: fieldName === 'completionDate' ? value : this.task.completionDate,
                        assignedProjectId: this.task.assignedProjectId,
                        taskHandler: fieldName === 'taskHandler' ? value : this.task.taskHandler,
                        taskStatus: fieldName === 'taskStatus' ? value : this.task.taskStatus
                    };
                    apexMethod = updateTask;
                    params = payload;
            }
            
            return apexMethod(params)
                .then((serverTask) => {
                    // Let parent reconcile canonical server state
                    this.dispatchEvent(
                        new CustomEvent('taskchange', {
                            detail: { task: serverTask },
                            bubbles: true,
                            composed: true
                        })
                    );
                })
                .catch((error) => {
                    // Show toast and revert optimistic change for the field
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Save failed',
                            message: (error && error.body && error.body.message) ? error.body.message : 'Unable to save task changes.',
                            variant: 'error'
                        })
                    );
                    throw error;
                });
        };

        // Debounce 500ms for rich text, immediate for others
        const delay = fieldName === 'taskDescription' ? 500 : 0;
        this._debouncers[key] = setTimeout(commit, delay);
        
        // Return a promise that resolves when the commit is executed
        return new Promise((resolve, reject) => {
            if (delay === 0) {
                // Immediate execution
                const promise = commit();
                promise.then(resolve).catch(reject);
            } else {
                // For debounced execution, we can't easily return a promise here
                // The commit function will handle the promise internally
                // We'll resolve immediately to prevent blocking
                resolve();
            }
        });
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
