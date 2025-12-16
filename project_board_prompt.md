## Task Description

Create a project management board Lightning Web Component called `Project Management Board`. The code should follow standard Salesforce styling and development best practices and be deployable to a scratch or or sandbox. Keep it fun and readable.

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

## Related Colors

Task Handler Colors:
- `Internal` = Green
- `Customer` = Blue
- `Other` = Yellow

Task Status Colors:
- `Not Started` = Gray
- `On Track` = Light Green
- `Late` = Red
- `Completed` = Green
- `Closed, not Completed` = Yellow

## Task Item Specifications

Task Item:
Whenever a task is shown inside any of the windows inside the project management board component, make sure it can be visually differentiated from the other tasks.
Show each task item as a box with its task name shown on a label.
If the task name is too long, clip it to stop it from overflowing outside of its box.
Color the task box based on its handler value by following the specified related colors

## Window Layout Specifications

Create each window in a modular way, creating their own component for each window. When communicating between the components, use Salesforce standards and best practices. Share common functionality like Apex classes for fetching data and reuse code where ever possible and acceptable to keep it readable.

Task Pool Window:
Located on the left side of the project management board component, a window for showing all the tasks records.
Each task is sorted into a column inside the Task Pool window based on their Task Status value.
Each possible task status has its own column inside the Task Pool window even if no tasks have that status.
Fit everything neatly inside the Task Pool window but keep it's width limited to 25% at most.

Tasks inside the Task Pool Window can be dragged into the Task Calendar Window to assign the week for that task. If a previous date for the task does not exist, put the task completion date on that week's Monday 12pm.

Task Calendar Window:
Located in the middle of the project management board component, a window showing a grid of boxes that correspond to each week of the year.
The task calendar window should be the biggest window inside the project management board component, giving a quick visual representation of the year's tasks.
Each week's box should have the week number written inside them on the top left corner.
All the tasks that have their Completion Date set to that year should be shown inside the box of the week the date belongs to.
If there are multiple tasks inside a single week, stack them vertically inside the week's box.

Tasks inside the weeks are be able to be dragged and dropped into other weeks, keeping their time and day of the week same. Update the date on the record whenever dragged to a different week. Update the UI to show the change immideately.

Make sure that a task can be inside only one week in the UI no matter when dragged from week to week or from the Task Pool Window to a week while previously existing in a different week.

A navigation bar displaying the currently selected year is located at the top of the task calendar window.
The year to show should be the current year by default.
On the left side of the navigation bar should be an arrow button with the previous year as the label.
Pressing the previous year button inside the navigation bar should change the calendar view to show the previous year.
On the right side of the navigation bar should be an arrow button with the next year as the label.
Pressing the next year button inside the navigation bar should change the calendar view to show the next year.
Every time the year shown is changed, update the calendar boxes to show only that year's tasks.

Task Details Window:
Located on the right side of the project management board component, a window showing all the details of the currently selected Task Item.

The details window should have these fields in this order inside it:
- Task Name
- Task Description
- Task Completion Date
The field for name should be a single line height text field that shows the name of the task and lets the user change the name by overriding it.
The field for description should be a 5 line height text field that shows the task's description and lets the user edit it if needed.
The field for Completion Date should be a date picker field showing the completion date on it. The user can change the date.

Underneath the name, description and date field has a button row for each of these picklist fields:
- Task Handler
- Task Status
The row of buttons has a button for each possible value of the picklist field.
The picklist item currently assigned to the task's field is highlighted in the button row.
Clicking another button on the button row changes the task's picked value to that.
Color the row of buttons for the Task Handler and the Task Status based on their related colors

At the bottom of the Task Details Window should be two buttons:
- Button on the left labeled `Move Back` to move the currently selected task's completion date to be one week earlier.
- Button on the right labeled `Move Forward` to move the currently selected task's completion date to be one week later.
Update the Task Calendar Window to show the correct placement of the Task box placed in the new date's week.

If no task is selected, the Task Details Window will be empty.
Any changes done inside the Task Details Window will be saved to the Task object's record that is being shown.

## User Interface Requirements

Any changes to the task or project field values should be updated to the record file and be shown in real time on the project management board component.
The project management board component should feel responsive by shwoing changes in real time.

## Extra Specifications

- Ask questions until you're 95% sure you can complete this task.
- Query the objects using CLI if they are not exposed in the project.
- Do not create any new custom objects into the org, use the specified existing objects.
- Do not include any complex logic inside the HTML files, move it to the JavaScript files.
- Do not deploy the project to the org automatically, a human will deploy it manually.
- NEVER use window.prompt for taking input from the user.