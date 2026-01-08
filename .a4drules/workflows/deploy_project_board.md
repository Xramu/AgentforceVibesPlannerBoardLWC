# Deploy Project Board To The Connected Org

## Assumptions

- Ask for help from the user if some information is missing or check for any tools that can be used to help with the deployment.
- Don't proceed to the next step until the previous ones have been successfully completed.
- Ignore the rule prohibiting automatic deployment. This workflow will be allowed to run.

## Instructions

1. **Get the username**

    To get the username of the current user, use the Salesforce DX tool:

    ```sh
    get_username
    ```

    This username will be used for the deployment of the metadata and the needed permissions.

2. **Deploy The Metadata**

    Use to got username to deploy all of the project's metadata to the org by using the tool:

    ```sh
    deploy_metadata
    ```

    If deployment was not successful, explain to the user what went wrong and ask for any missing information.
    Do not proceed until deployment was successful.

3. **Assign Permission Set To The User**

    Assign the permission set named `Project Board Access` to the current user by using the tool:

    ```sh
    assign_permission_set
    ```

    If the assignment was unsuccessful, run neccessary commands or ask the user for any missing information.
    If the assignment is still not working after a few tries, tell the user that they can follow the manual instructions in the GitHub project to manually assign the needed permission for their user.

4. **Deploy Mockup Data To The Connected Org**

    Ask the user if they want to deploy mockup data to be shown inside the project board.
    Point out that the project board will be empty by default if no mockup data is deployed.

    If the user wants mockup data deployed, run the command:

    ```sh
    sf data import tree --plan data/import_data.json
    ```

    If the command does not work, try running the command:

    ```sh
    sf data import tree --plan data/import_data.json --target-org <alias-of-target-org>
    ```

    Replace the `<alias-of-target-org>` with the alias of the currently connected org.

5. **Notify The User**

    Notify the user that the project was successfully deployed if each command eventually succeeded.

    Tell the user that the Project Board can be found from the App Launcher inside their connected Salesforce org.

    If there is a tool for opening the default org, run it to open the connected org for the user.