import { useEntityMarkdown } from '~/composables/useEntityMarkdown'
import { useEntities } from '~/composables/useEntities'

const TYPE_COLORS: Record<string, string> = {
  session:  '#6b9fe8',
  npc:      '#5db870',
  location: '#a87de8',
  faction:  '#e05555',
  quest:    '#e8924a',
  event:    '#4ab8e8',
  note:     '#7eaacc',
}

export function useWidgetMarkdown(campaignId: number) {
  const store = useEntities()
  const { renderMarkdown } = useEntityMarkdown()

  function entityLookup(type: string, name: string) {
    const ent = store.entities.find(
      e => e.campaignId === campaignId &&
           e.type === type &&
           e.name.toLowerCase() === name.toLowerCase()
    )
    if (!ent) return null
    const attrs = ent.attributes as any
    return {
      imageUrl: attrs?.portraitSource || attrs?.logoSource || attrs?.imageSource || undefined,
      color: TYPE_COLORS[ent.type] ?? '#888',
    }
  }

  function renderContent(text: string): string {
    if (!text) return ''
    return renderMarkdown(text, { rich: true, entityLookup })
  }

  return { renderContent }
}
