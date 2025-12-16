/**
 * ProjectBoardService
 * Proof-of-concept service for Project Management Board LWC
 *
 * NOTE: Per user direction, this PoC runs without WITH SECURITY_ENFORCED and without USER_MODE DML.
 * Structure and patterns allow easy hardening later.
 *
 * Responsibilities:
 * - Fetch tasks for a given year (all projects)
 * - Fetch tasks with no Completion_Date__c (Task Pool)
 * - Update single task fields
 * - Shift task date by whole weeks (7 * weeks)
 *
 * Conventions:
 * - with sharing to respect org sharing for PoC; remove if you want fully system mode
 * - Return Early pattern and exceptions with messages suitable for toast display
 */
public with sharing class ProjectBoardService {
    public class TaskDTO {
        @AuraEnabled public Id id;
        @AuraEnabled public String name;
        @AuraEnabled public String taskDescription;
        @AuraEnabled public Date completionDate;
        @AuraEnabled public Id assignedProjectId;
        @AuraEnabled public String taskHandler;
        @AuraEnabled public String taskStatus;
        @AuraEnabled public Decimal estimatedCost;
        @AuraEnabled public String currencyIsoCode;
    }

    public class FetchResponse {
        @AuraEnabled public Integer year;
        @AuraEnabled public List<TaskDTO> datedTasks;
        @AuraEnabled public List<TaskDTO> undatedTasks;
        @AuraEnabled public Integer weekCount; // 52 or 53
    }
    
    /**
     * Updates a task's estimated cost field
     */
    @AuraEnabled
    public static TaskDTO updateTaskEstimatedCost(Id taskId, Decimal estimatedCost) {
        if (taskId == null) {
            throw new AuraHandledException('Task id is required.');
        }
        Project_Task__c record = new Project_Task__c(Id = taskId, Estimated_Cost__c = estimatedCost);
        try {
            update record;
        } catch (DmlException e) {
            throw new AuraHandledException('Failed to update estimated cost: ' + e.getMessage());
        }
        Project_Task__c refreshed = [
            SELECT Id, Name, Task_Description__c, Completion_Date__c, Assigned_Project__c,
                   Task_Handler__c, Task_Status__c, Estimated_Cost__c, CurrencyIsoCode
            FROM Project_Task__c
            WHERE Id = :record.Id
            LIMIT 1
        ];
        return toDTO(refreshed);
    }

    @AuraEnabled(cacheable=true)
    public static FetchResponse getTasksByYear(Integer year) {
        if (year == null) {
            year = Date.today().year();
        }
        Date yearStart = Date.newInstance(year, 1, 1);
        Date yearEnd = Date.newInstance(year, 12, 31);

        List<Project_Task__c> dated = [
            SELECT Id, Name, Task_Description__c, Completion_Date__c, Assigned_Project__c,
                   Task_Handler__c, Task_Status__c, Estimated_Cost__c, CurrencyIsoCode
            FROM Project_Task__c
            WHERE Completion_Date__c != NULL
            AND Completion_Date__c >= :yearStart
            AND Completion_Date__c <= :yearEnd
            ORDER BY Completion_Date__c ASC, Name ASC
        ];

        List<Project_Task__c> undated = [
            SELECT Id, Name, Task_Description__c, Completion_Date__c, Assigned_Project__c,
                   Task_Handler__c, Task_Status__c, Estimated_Cost__c, CurrencyIsoCode
            FROM Project_Task__c
            WHERE Completion_Date__c = NULL
            ORDER BY Name ASC
        ];

        FetchResponse resp = new FetchResponse();
        resp.year = year;
        resp.datedTasks = toDTOs(dated);
        resp.undatedTasks = toDTOs(undated);
        resp.weekCount = calcWeekCount(year);
        return resp;
    }

    /**
     * Updates a task's name field
     */
    @AuraEnabled
    public static TaskDTO updateTaskName(Id taskId, String name) {
        if (taskId == null) {
            throw new AuraHandledException('Task id is required.');
        }
        if (name == null) {
            throw new AuraHandledException('Name is required.');
        }
        Project_Task__c record = new Project_Task__c(Id = taskId, Name = name);
        try {
            update record;
        } catch (DmlException e) {
            throw new AuraHandledException('Failed to update task name: ' + e.getMessage());
        }

        Project_Task__c refreshed = [
            SELECT Id, Name, Task_Description__c, Completion_Date__c, Assigned_Project__c,
                   Task_Handler__c, Task_Status__c, Estimated_Cost__c, CurrencyIsoCode
            FROM Project_Task__c
            WHERE Id = :record.Id
            LIMIT 1
        ];
        return toDTO(refreshed);
    }

    /**
     * Updates a task's description field
     */
    @AuraEnabled
    public static TaskDTO updateTaskDescription(Id taskId, String description) {
        if (taskId == null) {
            throw new AuraHandledException('Task id is required.');
        }
        Project_Task__c record = new Project_Task__c(Id = taskId, Task_Description__c = description);
        try {
            update record;
        } catch (DmlException e) {
            throw new AuraHandledException('Failed to update task description: ' + e.getMessage());
        }

        Project_Task__c refreshed = [
            SELECT Id, Name, Task_Description__c, Completion_Date__c, Assigned_Project__c,
                   Task_Handler__c, Task_Status__c, Estimated_Cost__c, CurrencyIsoCode
            FROM Project_Task__c
            WHERE Id = :record.Id
            LIMIT 1
        ];
        return toDTO(refreshed);
    }

    /**
     * Updates a task's completion date field
     */
    @AuraEnabled
    public static TaskDTO updateTaskCompletionDate(Id taskId, Date completionDate) {
        if (taskId == null) {
            throw new AuraHandledException('Task id is required.');
        }
        Project_Task__c record = new Project_Task__c(Id = taskId, Completion_Date__c = completionDate);
        try {
            update record;
        } catch (DmlException e) {
            throw new AuraHandledException('Failed to update task completion date: ' + e.getMessage());
        }

        Project_Task__c refreshed = [
            SELECT Id, Name, Task_Description__c, Completion_Date__c, Assigned_Project__c,
                   Task_Handler__c, Task_Status__c, Estimated_Cost__c, CurrencyIsoCode
            FROM Project_Task__c
            WHERE Id = :record.Id
            LIMIT 1
        ];
        return toDTO(refreshed);
    }

    /**
     * Updates a task's handler field
     */
    @AuraEnabled
    public static TaskDTO updateTaskHandler(Id taskId, String handler) {
        if (taskId == null) {
            throw new AuraHandledException('Task id is required.');
        }
        Project_Task__c record = new Project_Task__c(Id = taskId, Task_Handler__c = handler);
        try {
            update record;
        } catch (DmlException e) {
            throw new AuraHandledException('Failed to update task handler: ' + e.getMessage());
        }

        Project_Task__c refreshed = [
            SELECT Id, Name, Task_Description__c, Completion_Date__c, Assigned_Project__c,
                   Task_Handler__c, Task_Status__c, Estimated_Cost__c, CurrencyIsoCode
            FROM Project_Task__c
            WHERE Id = :record.Id
            LIMIT 1
        ];
        return toDTO(refreshed);
    }

    /**
     * Updates a task's status field
     */
    @AuraEnabled
    public static TaskDTO updateTaskStatus(Id taskId, String status) {
        if (taskId == null) {
            throw new AuraHandledException('Task id is required.');
        }
        Project_Task__c record = new Project_Task__c(Id = taskId, Task_Status__c = status);
        try {
            update record;
        } catch (DmlException e) {
            throw new AuraHandledException('Failed to update task status: ' + e.getMessage());
        }

        Project_Task__c refreshed = [
            SELECT Id, Name, Task_Description__c, Completion_Date__c, Assigned_Project__c,
                   Task_Handler__c, Task_Status__c, Estimated_Cost__c, CurrencyIsoCode
            FROM Project_Task__c
            WHERE Id = :record.Id
            LIMIT 1
        ];
        return toDTO(refreshed);
    }

    /**
     * Updates a task's assigned project field
     */
    @AuraEnabled
    public static TaskDTO updateTaskAssignedProject(Id taskId, Id assignedProjectId) {
        if (taskId == null) {
            throw new AuraHandledException('Task id is required.');
        }
        Project_Task__c record = new Project_Task__c(Id = taskId, Assigned_Project__c = assignedProjectId);
        try {
            update record;
        } catch (DmlException e) {
            throw new AuraHandledException('Failed to update task assigned project: ' + e.getMessage());
        }

        Project_Task__c refreshed = [
            SELECT Id, Name, Task_Description__c, Completion_Date__c, Assigned_Project__c,
                   Task_Handler__c, Task_Status__c
            FROM Project_Task__c
            WHERE Id = :record.Id
            LIMIT 1
        ];
        return toDTO(refreshed);
    }

    @AuraEnabled
    public static TaskDTO shiftTaskByWeeks(Id taskId, Integer weeks) {
        if (taskId == null) {
            throw new AuraHandledException('Task id is required.');
        }
        if (weeks == null) {
            weeks = 0;
        }
        Project_Task__c t = [
            SELECT Id, Completion_Date__c
            FROM Project_Task__c
            WHERE Id = :taskId
            LIMIT 1
        ];
        if (t.Completion_Date__c == null) {
            throw new AuraHandledException('Task has no date to shift.');
        }
        // shift by N weeks (7 days per week)
        t.Completion_Date__c = t.Completion_Date__c.addDays(7 * weeks);
        try {
            update t;
        } catch (DmlException e) {
            throw new AuraHandledException('Failed to shift task: ' + e.getMessage());
        }

        Project_Task__c refreshed = [
            SELECT Id, Name, Task_Description__c, Completion_Date__c, Assigned_Project__c,
                   Task_Handler__c, Task_Status__c
            FROM Project_Task__c
            WHERE Id = :taskId
            LIMIT 1
        ];
        return toDTO(refreshed);
    }

    @AuraEnabled
    public static TaskDTO setTaskDateToWeekMonday(Id taskId, Integer year, Integer weekNumber) {
        if (taskId == null) {
            throw new AuraHandledException('Task id is required.');
        }
        if (year == null || weekNumber == null) {
            throw new AuraHandledException('Target year and week number are required.');
        }
        Date monday = getMondayOfIsoWeek(year, weekNumber);
        Project_Task__c t = new Project_Task__c(Id = taskId, Completion_Date__c = monday);
        try {
            update t;
        } catch (DmlException e) {
            throw new AuraHandledException('Failed to set task date: ' + e.getMessage());
        }
        Project_Task__c refreshed = [
            SELECT Id, Name, Task_Description__c, Completion_Date__c, Assigned_Project__c,
                   Task_Handler__c, Task_Status__c
            FROM Project_Task__c
            WHERE Id = :taskId
            LIMIT 1
        ];
        return toDTO(refreshed);
    }

    // Helpers

    private static List<TaskDTO> toDTOs(List<Project_Task__c> rows) {
        List<TaskDTO> out = new List<TaskDTO>();
        for (Project_Task__c r : rows) {
            out.add(toDTO(r));
        }
        return out;
        }

    private static TaskDTO toDTO(Project_Task__c r) {
        TaskDTO d = new TaskDTO();
        d.id = r.Id;
        d.name = r.Name;
        d.taskDescription = r.Task_Description__c;
        d.completionDate = r.Completion_Date__c;
        d.assignedProjectId = r.Assigned_Project__c;
        d.taskHandler = r.Task_Handler__c;
        d.taskStatus = r.Task_Status__c;
        d.estimatedCost = r.Estimated_Cost__c;
        d.currencyIsoCode = r.CurrencyIsoCode;
        return d;
    }

    // Week/Date utilities

    @AuraEnabled(cacheable=true)
    public static Integer calcWeekCount(Integer year) {
        // ISO week count: last week of year is the week containing Dec 28
        Date dec28 = Date.newInstance(year, 12, 28);
        return getIsoWeekNumber(dec28);
    }

    @AuraEnabled(cacheable=true)
    public static Integer getIsoWeekNumber(Date d) {
        if (d == null) return null;
        // ISO week starts Monday; week 1 is the week containing Jan 4
        // Algorithm: shift to Thursday of current week then compute week difference from first Thursday of year
        Integer dayOfWeek = d.toStartOfWeek().daysBetween(d) + 1; // 1..7 relative to Monday
        Date thursday = d.addDays(4 - Math.mod( (dayOfWeek + 6), 7 ));
        Integer isoYear = thursday.year();
        Date firstThursday = Date.newInstance(isoYear, 1, 4);
        Date firstWeekStart = firstThursday.toStartOfWeek(); // Monday of week 1
        Integer weekNo = (firstWeekStart.daysBetween(d.toStartOfWeek()) / 7) + 1;
        return weekNo;
    }

    @AuraEnabled(cacheable=true)
    public static Date getMondayOfIsoWeek(Integer year, Integer weekNumber) {
        if (year == null || weekNumber == null) return null;
        Date jan4 = Date.newInstance(year, 1, 4);
        Date week1Monday = jan4.toStartOfWeek(); // Monday of ISO week 1
        return week1Monday.addDays((weekNumber - 1) * 7);
    }
}
