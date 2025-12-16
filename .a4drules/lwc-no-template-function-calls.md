## Brief overview
  Project-specific guideline for Lightning Web Components (LWC): avoid calling JavaScript functions with parameters directly inside HTML template expressions. Move all function calls and complex logic to JavaScript methods or getters to ensure proper rendering and maintainability.

## Communication style
  - Keep guidance concise and actionable when reviewing or writing templates.
  - When spotting function calls with parameters in HTML, suggest the exact JS method or getter to create and the precise template replacement.

## Development workflow
  - Identify any function calls with parameters in HTML template attributes or text nodes.
  - Create corresponding JavaScript methods or getters that perform the logic.
  - Replace the function call expressions in templates with simple property references.

## Coding best practices
  - Never call functions with parameters directly in HTML template expressions:
    - Avoid: class={getClassName(name)}
    - Avoid: style={getStyle(width, height)}
    - Avoid: label={formatLabel(title, suffix)}
  - Create dedicated JavaScript methods or getters with clear names:
    - Example getter: get className() { return this.getClassName(this.name); }
    - Example method: getFormattedLabel() { return `${this.title} ${this.suffix}`; }
  - Keep template bindings simple identifiers only; no function calls, inline math, concatenation, or logical operations.

## LWC-specific examples
  - Avoid: <lightning-button class={getButtonClass(isPrimary, disabled)} label={getLabel(title)}></lightning-button>
    - Use: JS: get buttonClass() { return this.getButtonClass(this.isPrimary, this.disabled); } get label() { return this.getLabel(this.title); } Template: <lightning-button class={buttonClass} label={label}></lightning-button>
  - Avoid: <div style={getProgressStyle(percent)}></div>
    - Use: JS: get progressStyle() { return this.getProgressStyle(this.percent); } Template: <div style={progressStyle}></div>

## Naming conventions
  - Use descriptive, camelCase names for computed properties:
    - xxxClass for CSS classes (buttonClass, cardClass)
    - xxxStyle for inline styles (progressStyle, containerStyle)
    - xxxLabel for formatted labels (formattedTitle, statusLabel)
    - xxxValue for computed values (computedTotal, formattedAmount)

## Testing & validation
  - Unit test JavaScript methods and getters by setting inputs and asserting outputs.
  - In template-focused tests, verify that bound attributes reflect the computed properties.
  - Include edge cases (null/undefined inputs) in unit tests for computed values.

## Error prevention
  - Guard against undefined inputs in JavaScript using nullish coalescing and optional chaining.
  - Return safe defaults for attributes and styles to prevent rendering issues.

## Performance considerations
  - Use getters for lightweight, deterministic computations based on tracked properties.
  - For expensive operations, compute once in event handlers and store in tracked fields to avoid repeated recalculation during re-renders.
