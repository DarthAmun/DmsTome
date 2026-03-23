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
import FieldText from '~/components/fields/FieldText.vue'
import FieldMarkdown from '~/components/fields/FieldMarkdown.vue'
import FieldNumber from '~/components/fields/FieldNumber.vue'
import FieldSelect from '~/components/fields/FieldSelect.vue'
import FieldMultiSelect from '~/components/fields/FieldMultiSelect.vue'
import FieldToggle from '~/components/fields/FieldToggle.vue'
import FieldImage from '~/components/fields/FieldImage.vue'
import FieldTracker from '~/components/fields/FieldTracker.vue'
import FieldDice from '~/components/fields/FieldDice.vue'
import FieldClock from '~/components/fields/FieldClock.vue'
import FieldRating from '~/components/fields/FieldRating.vue'
import FieldTags from '~/components/fields/FieldTags.vue'
import FieldChecklist from '~/components/fields/FieldChecklist.vue'

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
    case 'dice':        return FieldDice
    case 'clock':       return FieldClock
    case 'rating':      return FieldRating
    case 'tags':        return FieldTags
    case 'checklist':   return FieldChecklist
    default:            return FieldText
  }
})
</script>
