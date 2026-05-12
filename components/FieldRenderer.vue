<template>
  <component
    :is="fieldComponent"
    :field="field"
    :value="value"
    :mode="mode"
    :system-id="systemId"
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
import FieldStatBlock from '~/components/fields/FieldStatBlock.vue'
import FieldAbilities from '~/components/fields/FieldAbilities.vue'
import FieldSpellSlots from '~/components/fields/FieldSpellSlots.vue'
import FieldConditions from '~/components/fields/FieldConditions.vue'
import FieldAttack from '~/components/fields/FieldAttack.vue'
import FieldSpeed from '~/components/fields/FieldSpeed.vue'
import FieldEntityLink from '~/components/fields/FieldEntityLink.vue'
import FieldDamageFormula from '~/components/fields/FieldDamageFormula.vue'
import FieldTraitPicker from '~/components/fields/FieldTraitPicker.vue'
import FieldScaling from '~/components/fields/FieldScaling.vue'
import FieldCurrency from '~/components/fields/FieldCurrency.vue'
import FieldProficiency from '~/components/fields/FieldProficiency.vue'
import FieldActionCost from '~/components/fields/FieldActionCost.vue'
import FieldAttackBlock from '~/components/fields/FieldAttackBlock.vue'

const props = defineProps<{
  field: FieldSchema
  value: any
  mode: 'view' | 'edit'
  systemId?: number
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
    case 'statblock':   return FieldStatBlock
    case 'abilities':   return FieldAbilities
    case 'spellslots':  return FieldSpellSlots
    case 'conditions':  return FieldConditions
    case 'attack':          return FieldAttack
    case 'speed':           return FieldSpeed
    case 'entity-link':     return FieldEntityLink
    case 'damage-formula':  return FieldDamageFormula
    case 'trait-picker':    return FieldTraitPicker
    case 'scaling':         return FieldScaling
    case 'currency':        return FieldCurrency
    case 'proficiency':     return FieldProficiency
    case 'action-cost':     return FieldActionCost
    case 'attack-block':    return FieldAttackBlock
    default:                return FieldText
  }
})
</script>
