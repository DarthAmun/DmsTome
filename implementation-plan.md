Make new components for the system builder. The components are discribed below. Please have the following things in mind when implementing them:
- Make them as generic as possible
- The ones that can not be made generic should be put in a section of components labeld for pathfinder 2e. So we need sections for the components. Maybe show the generic ones on top and after that try to filter by name for the once that could match the best?
- Try to use and verify oh vue icons or ascii symbols.
- If you find a component that is already there that can easily be enhanced to support the functionality written below do so.

1. Proficiency rank field
PF2e uses Untrained / Trained / Expert / Master / Legendary everywhere — saves, skills, attacks, defenses. Currently modelled as select which works but is purely cosmetic. There's no way to compute the actual bonus (proficiency rank + level + ability mod). A dedicated proficiency component could show the rank visually as pips and auto-calculate the bonus if the character's level and ability scores are set. This is the most impactful missing component.
2. Action cost field
PF2e actions use iconic symbols: ◆ (1 action), ◆◆ (2 actions), ◆◆◆ (3 actions), ◇ (free), ↺ (reaction). Currently stored as plain text. A dedicated actioncost component would render the proper symbols and be selectable from a clean picker. Feats, spells, and creature abilities all need this.
3. Damage formula field
The dice component handles a single expression (1d6). PF2e damage often has multiple components — 1d8+4 piercing plus 1d6 fire from a flaming weapon. A multi-dice field where you can add multiple rows each with dice expression, damage type, and optional condition (e.g. "on a critical hit") would serve weapons, spells, and creature attacks properly.
4. Trait field with reference linking
Traits in PF2e carry mechanical meaning — a trait tag is not just a label but a term defined in the system (Agile, Finesse, Magical, etc). Currently traits are just tags (plain strings). A traitpicker component backed by the trait records (there's a traits data file in Pf2eTools) would let you select traits from a predefined list and have them link to their definitions. This would make the condition field on creatures and spells actually useful.
5. Creature attack block
The existing attack component is very basic. A full PF2e creature attack has: attack bonus (with MAP progression), damage formula (multi-component), damage type, traits, and range. A structured attackblock component with all these fields in one unit would be far better than the current single attack field combined with a damage textarea.
6. Heighten/level scaling field
Spells and some feats scale with level/heightening. Currently stored as a textarea (the heightening field). A structured scaling component — a list of rows, each with a trigger (level, heighten +N) and effect description — would make this data queryable and visually clean. Important for the spell library.
7. Price field with denomination
Items have prices in CP/SP/GP/PP. Currently text ("5 gp"). A dedicated currency component with number input and denomination selector would make item prices sortable and consistent across the library.
