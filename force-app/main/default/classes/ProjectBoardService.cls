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
    }

    public class FetchResponse {
        @AuraEnabled public Integer year;
        @AuraEnabled public List<TaskDTO> datedTasks;
        @AuraEnabled public List<TaskDTO> undatedTasks;
        @AuraEnabled public Integer weekCount; // 52 or 53
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
                   Task_Handler__c, Task_Status__c
            FROM Project_Task__c
            WHERE Completion_Date__c != NULL
            AND Completion_Date__c >= :yearStart
            AND Completion_Date__c <= :yearEnd
            ORDER BY Completion_Date__c ASC, Name ASC
        ];

        List<Project_Task__c> undated = [
            SELECT Id, Name, Task_Description__c, Completion_Date__c, Assigned_Project__c,
                   Task_Handler__c, Task_Status__c
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

    @AuraEnabled
    public static TaskDTO updateTask(TaskDTO input) {
        if (input == null || input.id == null) {
            throw new AuraHandledException('Task id is required.');
        }
        Project_Task__c record = new Project_Task__c(Id = input.id);
        // Only set fields provided (null values clear fields)
        record.Name = input.name;
        record.Task_Description__c = input.taskDescription;
        record.Completion_Date__c = input.completionDate;
        record.Assigned_Project__c = input.assignedProjectId;
        record.Task_Handler__c = input.taskHandler;
        record.Task_Status__c = input.taskStatus;

        try {
            update record;
        } catch (DmlException e) {
            throw new AuraHandledException('Failed to update task: ' + e.getMessage());
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
