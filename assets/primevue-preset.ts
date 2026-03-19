/**
 * PrimeVue unstyled passthrough preset.
 * All components styled via CSS variables from main.css.
 */
export default {
  inputtext: {
    root: ({ props }: any) => ({
      class: ['pv-input', { 'pv-input--disabled': props.disabled }],
    }),
  },
  textarea: {
    root: () => ({ class: 'pv-input pv-textarea' }),
  },
  select: {
    root: ({ props }: any) => ({
      class: ['pv-select', { 'pv-select--disabled': props.disabled }],
    }),
    label: ({ props }: any) => ({
      class: ['pv-select-label', { 'pv-select-placeholder': !props.modelValue && !props.value }],
    }),
    dropdown: () => ({ class: 'pv-select-chevron' }),
    overlay: () => ({ class: 'pv-dropdown' }),
    listcontainer: () => ({ class: 'pv-dropdown-list' }),
    option: ({ context }: any) => ({
      class: ['pv-option', { 'pv-option--selected': context.selected, 'pv-option--focused': context.focused }],
    }),
    optionlabel: () => ({ class: 'pv-option-label' }),
  },
  button: {
    root: ({ props }: any) => ({
      class: [
        'pv-btn',
        props.severity === 'danger' ? 'pv-btn--danger' :
          props.severity === 'secondary' ? 'pv-btn--ghost' :
            props.text ? 'pv-btn--ghost' :
              'pv-btn--primary',
        props.size === 'small' ? 'pv-btn--sm' : '',
        props.outlined ? 'pv-btn--ghost' : '',
      ].filter(Boolean),
    }),
    label: () => ({ class: 'pv-btn-label' }),
    icon: () => ({ class: 'pv-btn-icon' }),
    loadingIcon: () => ({ class: 'pv-btn-icon' }),
  },
  dialog: {
    mask: () => ({ class: 'pv-dialog-mask' }),
    root: () => ({ class: 'pv-dialog' }),
    header: () => ({ class: 'pv-dialog-header' }),
    title: () => ({ class: 'pv-dialog-title' }),
    content: () => ({ class: 'pv-dialog-content' }),
    footer: () => ({ class: 'pv-dialog-footer' }),
    closeButton: () => ({ class: 'pv-dialog-close' }),
    closeIcon: () => ({ class: 'pv-dialog-close-icon' }),
  },
  togglebutton: {
    root: ({ props }: any) => ({
      class: ['pv-toggle', { 'pv-toggle--on': props.modelValue }],
    }),
    content: () => ({ class: 'pv-toggle-content' }),
    label: () => ({ class: 'pv-toggle-label' }),
  },
  slider: {
    root: () => ({ class: 'pv-slider' }),
    range: () => ({ class: 'pv-slider-range' }),
    handle: () => ({ class: 'pv-slider-handle' }),
  },
  autocomplete: {
    root: () => ({ class: 'pv-autocomplete' }),
    input: () => ({ class: 'pv-input' }),
    overlay: () => ({ class: 'pv-dropdown' }),
    list: () => ({ class: 'pv-dropdown-list' }),
    option: ({ context }: any) => ({
      class: ['pv-option', { 'pv-option--selected': context.selected, 'pv-option--focused': context.focused }],
    }),
  },
}
