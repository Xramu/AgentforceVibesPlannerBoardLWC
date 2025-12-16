## Task Description

Modify the ProjectBoardService.cls, projectBoard and taskDetails to include a new field that the Project_Task__c object has.

## New Field Info

`Project_Task__c` custom object has a new field named `Estimated_Cost__c` of type Currency.

Use the picklist field `CurrencyIsoCode` to get the currency type of the estimated cost.

## Specifications

- Make sure the estimated cost field can be read and written with the Apex class like the other fields.
- Add it to the Task Details window underneath the task name field.
- Add the currency type to the title of the estimated cost field inside the task details window.