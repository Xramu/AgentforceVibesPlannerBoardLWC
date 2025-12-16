## Brief overview
  - Project-specific rule: All deployments to Salesforce orgs must be initiated manually by the user. Agentforce must not deploy or trigger deployment workflows unless explicitly instructed.

## Communication style
  - Be explicit when a change is ready for deployment and state that deployment is user-managed.
  - Provide short, actionable deployment instructions or commands as reference without executing them.
  - Clearly label any command snippets as "Do not run automatically" and "For user to run manually".

## Development workflow
  - Prepare local changes, metadata, tests, and documentation without invoking any deployment tools.
  - When work is complete: summarize affected files and recommended deploy scope (source paths or manifest).
  - If a validation step is helpful, include the exact command(s) but do not execute them.
  - Never auto-run MCP tools that deploy, retrieve, or assign in orgs. Only use them when the user explicitly authorizes.

## Coding best practices
  - Keep metadata changes isolated and traceable to minimize deploy risk.
  - Maintain a manifest (e.g., manifest/package.xml) or list specific source paths for targeted deploys.
  - Include notes about Apex test levels appropriate for the change, but do not trigger tests in org.

## Salesforce CLI and MCP usage
  - Do not call sf CLI or MCP deploy/retrieve/assign tools without explicit user instruction.
  - When asked for commands, provide examples only, clearly marked for manual execution:
    - Example (reference only): sf project deploy start --source-dir force-app
    - Example (reference only): sf project deploy start --manifest manifest/package.xml --test-level RunLocalTests
  - Prefer MCP guidance tools (non-mutating) for design help; avoid any MCP tools that make org changes unless the user directs it.

## Testing and validation
  - Run local/unit tests and static analysis in the repo only.
  - Provide suggested org-side validation commands as references, not to be executed automatically.
  - Document any prerequisites the user should validate in the org before deploying (perms, FLS, feature flags).

## Safety and confirmation gates
  - Before presenting any deploy snippet, add a clear disclaimer: "User will deploy manually. Do not run automatically."
  - If the user requests deployment, ask for explicit confirmation of target org/alias and desired scope (source paths or manifest) before invoking tools.
  - Default to no-action if deployment intent is ambiguous.

## Project context
  - This repository contains Salesforce metadata and LWC; treat all deployment-related steps as user-owned.
  - Keep instructions compatible with sf CLI; avoid deprecated sfdx commands.

## Example handoff format
  - Change summary: bullet list of modified files and components.
  - Suggested deploy scope: source dirs or manifest path.
  - Suggested test level: rationale and options.
  - Reference commands (not executed):
    - sf project deploy start --manifest manifest/package.xml --test-level RunLocalTests
    - sf apex run test --synchronous --result-format human --code-coverage --tests ClassOneTest,ClassTwoTest
