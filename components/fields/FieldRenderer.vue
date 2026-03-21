<template>
  <component
    :is="fieldComponent"
    :field="field"
    :value="value"
    :mode="mode"
    @update="v => $emit('update', v)"
  />
</template>

<script setup lang="ts">
import type { FieldSchema } from '~/types/entities'
import FieldText from './FieldText.vue'
import FieldMarkdown from './FieldMarkdown.vue'
import FieldNumber from './FieldNumber.vue'
import FieldSelect from './FieldSelect.vue'
import FieldMultiSelect from './FieldMultiSelect.vue'
import FieldToggle from './FieldToggle.vue'
import FieldImage from './FieldImage.vue'
import FieldTracker from './FieldTracker.vue'

const props = defineProps<{
  field: FieldSchema
  value: any
  mode: 'view' | 'edit'
}>()
defineEmits<{ update: [any] }>()

const fieldComponent = computed(() => {
  switch (props.field.component) {
    case 'text':        return FieldText
    case 'textarea':    return FieldMarkdown
    case 'number':      return FieldNumber
    case 'select':      return FieldSelect
    case 'multiselect': return FieldMultiSelect
    case 'toggle':      return FieldToggle
    case 'image':       return FieldImage
    case 'tracker':     return FieldTracker
    default:            return FieldText
  }
})
</script>
