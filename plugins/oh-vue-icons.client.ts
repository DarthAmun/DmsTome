import { OhVueIcon, addIcons } from 'oh-vue-icons'
import * as GiIcons from 'oh-vue-icons/icons/gi'
import {
  MdArrowback, MdArrowforward,
  MdAdd, MdAddcircleoutline, MdDelete, MdDeleteOutlined, MdEdit, MdEditnote,
  MdClose, MdSort, MdMap,
  MdVisibility, MdVisibilityoff,
  MdCloud, MdSunny, MdAccesstime,
  MdShield, MdShieldOutlined,
  MdHistory, MdAutoawesome,
  MdDesktopmac, MdSettings,
  MdViewmodule, MdMenubook,
  MdDraghandle, MdArrowdropdown,
  MdChevronleft, MdChevronright,
  MdFiledownload, MdFileupload, MdWarningamber,
  MdBrightness4, MdAnimation, MdStorage,
  MdContentcopy, MdCheck, MdAutorenew,
  MdBookmark, MdBookmarkborder, MdBookmarkadded, MdOpeninnew, MdPushpin,
  MdLink, MdFitscreen, MdOpeninfull,
} from 'oh-vue-icons/icons/md'

import {
  FaEye, FaEyeSlash,
  FaSkull, FaSkullCrossbones,
  FaDesktop, FaSearch, FaFolderOpen,
  FaDragon, FaFeatherAlt, FaDice,
  FaDiceD20, FaShapes,
} from 'oh-vue-icons/icons/fa'

// Add all Game Icons (gi-*) in one shot
addIcons(...Object.values(GiIcons))

// Add MD and FA icons individually
addIcons(
  MdArrowback, MdArrowforward,
  MdAdd, MdAddcircleoutline, MdDelete, MdDeleteOutlined, MdEdit, MdEditnote,
  MdClose, MdSort, MdMap,
  MdVisibility, MdVisibilityoff,
  MdCloud, MdSunny, MdAccesstime,
  MdShield, MdShieldOutlined,
  MdHistory, MdAutoawesome,
  MdDesktopmac, MdSettings,
  MdViewmodule, MdMenubook,
  MdDraghandle, MdArrowdropdown,
  MdChevronleft, MdChevronright,
  MdFiledownload, MdFileupload, MdWarningamber,
  MdBrightness4, MdAnimation, MdStorage, MdContentcopy, MdCheck, MdAutorenew,
  MdBookmark, MdBookmarkborder, MdBookmarkadded, MdOpeninnew, MdPushpin,
  MdLink, MdFitscreen, MdOpeninfull,
  FaEye, FaEyeSlash,
  FaSkull, FaSkullCrossbones,
  FaDesktop, FaSearch, FaFolderOpen,
  FaDragon, FaFeatherAlt, FaDice,
  FaDiceD20, FaShapes,
)

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('OhVueIcon', OhVueIcon)
})

// Export the full GI icon name list for the icon picker
// Converts "GiFireworkExplosion" -> "gi-firework-explosion"
export const GI_ICON_NAMES: string[] = Object.keys(GiIcons)
  .filter(k => k.startsWith('Gi'))
  .map(k => k
    .replace(/^Gi/, 'gi-')
    .replace(/([A-Z])/g, (m, l, i) => i === 0 ? l.toLowerCase() : '-' + l.toLowerCase())
    .replace(/^gi--/, 'gi-')
  )
