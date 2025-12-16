## Brief overview
  - Project-specific guideline for Lightning Web Components (LWC): never concatenate strings or values inline within HTML templates. Build all display strings in JavaScript and bind them via identifiers to avoid template parsing errors and improve readability and testability.

## Communication style
  - Provide concise, actionable replacements when spotting inline concatenation.
  - Propose the exact JS getter/field name and the precise template substitution.

## Development workflow
  - Compose any user-facing text in the component JavaScript using getters (for computed, read-only values) or tracked fields (when values change via handlers).
  - Bind the composed string in HTML via a simple identifier (e.g., value={fullName}, title={formattedSubtitle}).
  - For dynamic updates triggered by events, compute once inside the handler and assign to a tracked property.

## Coding best practices
  - Do not use concatenation, template literals, or multiple nodes to hack together strings in templates:
    - Avoid: title="Hello, {firstName} {lastName}"
    - Avoid: <span>{greeting + ' ' + name}</span>
    - Avoid: <div data-id={"row-" + index}></div>
  - Prefer JS getters/fields that assemble strings:
    - Example getter: get fullName() { return [this.firstName, this.lastName].filter(Boolean).join(' '); }
    - Example field pattern (set in handler): this.subtitle = `${this.accountName} • ${this.region}`;
  - Keep template bindings as identifiers only; no inline arithmetic, concatenation, logical ops, or string interpolation.

## LWC-specific examples
  - Avoid: <lightning-badge label={"Qty: " + quantity}></lightning-badge>
    - Use: JS: get qtyLabel() { return `Qty: ${this.quantity ?? 0}`; } Template: <lightning-badge label={qtyLabel}></lightning-badge>
  - Avoid: <div class={"slds-text-" + size}></div>
    - Use: JS: get sizeClass() { return `slds-text-${this.size || 'body_regular'}`; } Template: <div class={sizeClass}></div>
  - Avoid: <a href={"/lightning/r/Account/" + recordId + "/view"}></a>
    - Use: JS: get recordUrl() { return `/lightning/r/Account/${this.recordId}/view`; } Template: <a href={recordUrl}></a>

## Naming conventions
  - Use descriptive, intent-revealing names:
    - formattedXxx for display-ready text (formattedAmount, formattedSubtitle).
    - xxxLabel for short labels (qtyLabel, statusLabel).
    - xxxClass/xxxStyle for CSS class or style outputs (sizeClass, pillStyle).
    - full/complete/summary for multi-part strings (fullName, completeTitle, summaryLine).

## Testing & validation
  - Unit test getters and formatting helpers by setting inputs and asserting outputs (no DOM required).
  - Include null/undefined/empty inputs and locale-sensitive cases (if applicable).
  - In template tests, verify that bound nodes render the composed identifier values.

## Error prevention
  - Safeguard against undefined inputs using nullish coalescing and filtering:
    - Example: get summaryLine() { const id = this.recordId ?? '—'; return `Record: ${id}`; }
    - Example: get fullName() { return [this.firstName, this.lastName].filter(Boolean).join(' '); }
  - Return safe defaults for attributes (e.g., empty string for label, '—' for missing text).

## Performance considerations
  - Use getters for cheap, deterministic concatenations based on reactive state.
  - For expensive compositions or frequent events, compute once in event handlers and store in a tracked property to avoid re-computation during rerenders.

## Code review checklist
  - No inline concatenation (e.g., +), template literals, or string assembly in HTML attributes or text nodes.
  - All display strings are composed in JS (getter or tracked field) and referenced by a single identifier in the template.
  - Computed properties have clear names, safe defaults, and minimal logic suitable for the view layer.
