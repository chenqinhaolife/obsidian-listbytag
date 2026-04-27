import { ERROR_MESSAGE } from './constant';

const EN = {
  [`${ERROR_MESSAGE}NO_FRONT_MATTER_TAG`]: 'Please add the tags field for properties !',
  [`${ERROR_MESSAGE}NO_DATAVIEW_INSTALL`]: 'You need to install dataview first!',
  [`${ERROR_MESSAGE}NO_VIEW_PROVIDED`]: 'Please provide the name of the view you want to query!',
  [`${ERROR_MESSAGE}NO_VIEW_EXISTED`]: 'There is no this view in ListByTag plugin',
};

const ZH = {
  [`${ERROR_MESSAGE}NO_FRONT_MATTER_TAG`]: '请为 Properties 加 tags 字段！',
  [`${ERROR_MESSAGE}NO_DATAVIEW_INSTALL`]: '请先安装 dataview！',
  [`${ERROR_MESSAGE}NO_VIEW_PROVIDED`]: '请提供所需要查询的视图名！',
  [`${ERROR_MESSAGE}NO_VIEW_EXISTED`]: 'ListByTag 插件中不存在此视图',
};

const I18N_MAP: Record<string, Record<string, string>> = {
  'en-us': EN,
  en: EN,
  'zh-cn': ZH,
  zh: ZH,
};

export function getI18n(lang: string) {
  return I18N_MAP[lang] || EN;
}
