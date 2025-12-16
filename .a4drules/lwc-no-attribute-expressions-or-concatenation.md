## Brief overview
  - Project-specific guideline for Lightning Web Components (LWC): do not use arithmetic, logical operations, or string concatenation inside HTML template attributes or text nodes. Compute values in JavaScript and bind them via simple identifiers to improve readability, avoid template parsing issues, and ease unit testing.

## Communication style
  - Keep guidance concise and prescriptive when reviewing or writing templates.
  - When spotting inline expressions, suggest the exact JS property/getter to add and the precise template replacement.

## Development workflow
  - Compute any derived values (IDs, keys, labels, classes, styles, URLs) in the component’s JavaScript using getters for read-only derivations or tracked fields for event-driven updates.
  - Bind the computed value in HTML using a simple identifier (e.g., key={itemKey}, class={sizeClass}, label={qtyLabel}).
  - Prefer getters for values derived solely from other reactive state; use fields when values are computed in handlers or are performance sensitive.

## Coding best practices
  - Never place arithmetic or complex expressions in template attributes or text nodes:
    - Avoid: key={proj.id + '-' + st}
    - Avoid: data-id={"row-" + idx}
    - Avoid: <span>{count + 1}</span>
  - Never concatenate strings inline in HTML:
    - Avoid: class={"slds-text-" + size}
    - Avoid: label={"Qty: " + quantity}
  - Create dedicated getters/fields with clear names:
    - Example for key: get itemKey() { return `${this.proj?.id ?? ''}-${this.st ?? ''}`; }
    - Example for class: get sizeClass() { return `slds-text-${this.size || 'body_regular'}`; }
    - Example for label: get qtyLabel() { return `Qty: ${this.quantity ?? 0}`; }
  - Keep template bindings to identifiers only; no inline math, concatenation, ternaries, or logical ops.

## LWC-specific examples
  - Keys
    - Avoid: for:item="proj" key={proj.id + '-' + st}
    - Use: JS: get itemKey() { return `${this.proj?.id ?? ''}-${this.st ?? ''}`; } Template: key={itemKey}
  - Labels
    - Avoid: <lightning-badge label={"Qty: " + quantity}></lightning-badge>
    - Use: JS: get qtyLabel() { return `Qty: ${this.quantity ?? 0}`; } Template: label={qtyLabel}
  - Classes
    - Avoid: <div class={"slds-text-" + size}></div>
    - Use: JS: get sizeClass() { return `slds-text-${this.size || 'body_regular'}`; } Template: class={sizeClass}
  - Text nodes
    - Avoid: <span>{count + 1}</span>
    - Use: JS: get nextCount() { return (this.count ?? 0) + 1; } Template: <span>{nextCount}</span>

## Naming conventions
  - Use descriptive, camelCase names reflecting intent:
    - xxxKey / dataId for DOM keys and data attributes (itemKey, rowDataId)
    - xxxClass / xxxStyle for classes and styles (sizeClass, progressStyle)
    - formattedXxx / xxxLabel for display-ready strings (formattedAmount, statusLabel)
    - computedXxx for generic derived values (computedTotal, computedSuffix)

## Testing & validation
  - Unit test getters and helpers by setting inputs and asserting outputs without DOM.
  - In template-focused tests, verify that bound attributes/text reflect the computed properties.
  - Include edge cases (null/undefined, empty strings, zero) and ensure safe defaults are returned.

## Error prevention
  - Guard against undefined inputs in JS using nullish coalescing and optional chaining.
  - Return safe defaults (e.g., empty string for attributes, '—' for missing text).
  - Build stable keys that do not change across renders unnecessarily.

## Performance considerations
  - Use getters for cheap, deterministic computations; they run during render but are simple.
  - For expensive or frequently changing computations, compute once in event handlers and store in a tracked field to avoid repeated recalculation.
