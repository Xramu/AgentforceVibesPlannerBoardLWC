Create a project management table Lightning Web Component called `Project Management Table`. The code should follow standard Salesforce styling and development best practices and be deployable to a scratch or or sandbox. Keep it fun and readable.

- Ask questions until you're 95% sure you can complete this task.
- Do not create any new custom objects into the org, use the specified existing objects.
- Do not include any complex logic inside the HTML files, move it to the JavaScript files.

## Custom Object References

Project Object:
- `Project__c` is the project object's API name.
- `Name` field stores the project's name.
- `Project_Description__c` field stores the project's description.

Task Object:
- `Project_Task__c` is the task object's API name.
- `Name` field stores the task's name.
- `Task_Description__c` field stores the task's description
- `	Completion_Date__c` field is a Date value of the task's planned date of completion.
- `Task_Handler__c` field is a picklist field that determines the handler of the task.
    - Possible task handler picklist values are `Internal`, `Customer` and `Other`
- `Task_Status__c` field is a picklist field that determines the task's current status.
    - Possible task status picklist values are `Not Started`, `On Track`, `Late`, `On Hold`, `Completed` and `Closed, not Completed`

## Task Item Specifications

Task Item:
Whenever a task is shown inside any of the windows inside the project management table component, make sure it can be visually differentiated from the other tasks.
Show each task item as a box with its task name shown on a label.
If the task name is too long, clip it to stop it from overflowing outside of its box.
Color the task box based on the task's handler.
If the task is handled by `Internal` the color should be Green.
If the task is handled by `Customer` the color should be Blue.
If the task is handled by `Other` the color should be Yellow.

## Window Layout Specifications

Create each window in a modular way, creating their own component for each window. When communicating between the components, use Salesforce standards and best practices. Share common functionality like Apex classes for fetching data and reuse code where ever possible and acceptable to keep it readable.

Task Pool Window:
Located on the left side of the project management table component, a window for showing all the tasks records.
Each task is sorted into a column inside the Task Pool window based on their Task Status value.
Each possible task status has its own column inside the Task Pool window even if no tasks have that status.
Fit everything neatly inside the Task Pool window but keep it's width limited to 25% at most.

Task Calendar Window:
Located in the middle of the project management table component, a window showing a grid of boxes that correspond to each week of the year.
Each week's box should have the week number written inside them on the top left corner.
All the tasks that have their Completion Date set to that year should be shown inside the box of the week the date belongs to.

A navigation bar displaying the currently selected year is located at the top of the task calendar window.
The year to show should be the current year by default.
On the left side of the navigation bar should be an arrow button with the previous year as the label.
Pressing the previous year button inside the navigation bar should change the calendar view to show the previous year.
On the right side of the navigation bar should be an arrow button with the next year as the label.
Pressing the next year button inside the navigation bar should change the calendar view to show the next year.

## User Interface Requirements

Any changes made by the user should show in real time on the component, making the component feel responsive.