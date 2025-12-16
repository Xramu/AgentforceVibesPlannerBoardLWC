## Brief overview
  - Project-specific guideline for Lightning Web Components (LWC): avoid inline arithmetic or complex expressions inside HTML template attributes. Perform all computations in JavaScript and bind results to attributes to prevent template parsing errors and improve maintainability.

## Communication style
  - Keep guidance concise and actionable when reviewing or writing LWC templates.
  - When encountering inline math in HTML, suggest the exact JS property or getter to introduce, and the precise template replacement.

## Development workflow
  - Compute any derived values in the component's JavaScript (fields, getters, or small helper methods).
  - Bind the computed value in the HTML using a property reference (e.g., value={computedTotal}).
  - Prefer getters for values derived solely from other reactive state; prefer fields updated in handlers when performance or clarity requires caching.

## Coding best practices
  - Never place arithmetic or complex expressions in HTML attributes (e.g., value={a + b}, style="width:{percent * 100}%").
  - Create dedicated getters for presentation logic:
    - Example: get progressWidth() { return `${this.progress * 100}%`; }
  - Use clearly named properties for readability (e.g., computedTotal, formattedAmount, progressWidth).
  - Keep template bindings simple identifiers only; no concatenation, arithmetic, or logical operations inline.

## LWC-specific examples
  - Avoid: <lightning-input value={quantity * unitPrice}></lightning-input>
    - Use: JS: get computedTotal() { return this.quantity * this.unitPrice; } Template: <lightning-input value={computedTotal}></lightning-input>
  - Avoid: <div style="width:{progress * 100}%"></div>
    - Use: JS: get progressWidth() { return `${this.progress * 100}%`; } Template: <div style={progressWidth}></div>
  - Avoid: <span>{count + 1}</span>
    - Use: JS: get nextCount() { return this.count + 1; } Template: <span>{nextCount}</span>

## Naming conventions
  - Use descriptive, camelCase names for computed bindings:
    - computedXxx for generic math results (computedTotal, computedDiscount).
    - formattedXxx when returning UI-ready strings (formattedAmount, formattedDate).
    - xxxWidth/xxxHeight for style-related outputs (progressWidth, barHeight).
  - Keep getter names short and intent-revealing.

## Testing & validation
  - Unit test getters and helper methods in JS by setting inputs and asserting outputs.
  - In template-focused tests, verify the bound attribute reflects the computed property.
  - Include edge cases (zero, negative, null/undefined inputs) in unit tests for computed values.

## Error prevention
  - If a calculation depends on possibly undefined inputs, guard in JS:
    - Example: get computedTotal() { const q = this.quantity ?? 0; const p = this.unitPrice ?? 0; return q * p; }
  - Return safe defaults for style strings (e.g., '0%' instead of undefined).

## Performance considerations
  - Use getters for lightweight, deterministic calculations based on tracked or public fields.
  - If a computation is heavy or depends on frequent events, compute once in the handler and assign to a tracked field to avoid repeated recalculation during re-render.

## Code review checklist
  - No arithmetic or complex expressions appear in HTML attributes or text nodes.
  - All derived values are computed in JS (getter or field) and bound by identifier only.
  - Computed properties have clear names and safe defaults.
  - Style attributes use precomputed strings, not inline concatenation or math.
