import { OhVueIcon, addIcons } from 'oh-vue-icons'
import {
  MdArrowback, MdArrowforward,
  MdAdd, MdDelete, MdDeleteOutlined, MdEditnote,
  MdClose, MdSort, MdMap,
  MdVisibility, MdVisibilityoff,
  MdCloud, MdSunny, MdAccesstime,
  MdShield, MdShieldOutlined,
  MdHistory, MdAutoawesome,
  MdDesktopmac,
} from 'oh-vue-icons/icons/md'

import {
  FaEye, FaEyeSlash,
  FaSkull, FaSkullCrossbones,
  FaDesktop, FaSearch, FaFolderOpen,
} from 'oh-vue-icons/icons/fa'

import {
  GiScrollUnfurled,
  GiPerson,
  GiBroadsword,
  GiTreasureMap,
  GiOpenTreasureChest,
  GiAmericanShield,
  GiMagicPalm,
  GiNotebook,
  GiBookAura,
  GiMagicHat,
  GiHouseKeys,
  GiSandsOfTime,
  GiAllSeeingEye,
  GiCastle,
  GiCoins,
  GiHealthPotion,
  GiCandleSkull,
  GiBurningSkull,
  GiDeathNote,
  GiAnvilImpact,
  GiHolyGrail,
  GiLightningSword,
} from 'oh-vue-icons/icons/gi'

addIcons(
  MdArrowback, MdArrowforward,
  MdAdd, MdDelete, MdDeleteOutlined, MdEditnote,
  MdClose, MdSort, MdMap,
  MdVisibility, MdVisibilityoff,
  MdCloud, MdSunny, MdAccesstime,
  MdShield, MdShieldOutlined,
  MdHistory, MdAutoawesome,
  MdDesktopmac,
  FaEye, FaEyeSlash,
  FaSkull, FaSkullCrossbones,
  FaDesktop, FaSearch, FaFolderOpen,
  GiScrollUnfurled, GiPerson,
  GiBroadsword, GiTreasureMap,
  GiOpenTreasureChest, GiAmericanShield,
  GiMagicPalm, GiNotebook, GiBookAura,
  GiMagicHat, GiHouseKeys, GiSandsOfTime,
  GiAllSeeingEye, GiCastle, GiCoins,
  GiHealthPotion, GiCandleSkull, GiBurningSkull,
  GiDeathNote, GiAnvilImpact,
  GiHolyGrail, GiLightningSword,
)

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('OhVueIcon', OhVueIcon)
})
