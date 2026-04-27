import type { App, MarkdownPostProcessorContext } from 'obsidian';
import type { Link, STask } from 'obsidian-dataview';
import type { PluginSettings } from '../type';
import { Markdown } from '../component/Markdown';
import { ERROR_MESSAGE } from '../constant';
import { getI18n } from '../i18n';
import type ListByTagPlugin from '../main';
import { File } from './File';
import { generateExcludeOperator, renderError } from '../util';

type Element = { text: string; link: Link };

export class Bullet {
  app: App;
  file: File;
  plugin: ListByTagPlugin;
  settings: PluginSettings;
  locale: string;
  constructor(app: App, settings: PluginSettings, plugin: ListByTagPlugin, locale: string) {
    this.app = app;
    this.settings = settings;
    this.plugin = plugin;
    this.locale = locale;
    this.file = new File(this.app, this.settings, plugin, locale);
  }

  listByTag = async (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
    const filepath = ctx.sourcePath;
    const tags = this.file.tags(filepath);
    const div = el.createEl('div');
    const component = new Markdown(div);

    if (!tags.length) {
      return renderError(this.app, getI18n(this.locale)[`${ERROR_MESSAGE}NO_FRONT_MATTER_TAG`], div, filepath);
    }

    const from = tags
      .map((tag: string, index: number) => {
        return `#${tag} ${index === tags.length - 1 ? '' : 'OR'}`;
      })
      .join(' ')
      .trim();
    const dataview = await this.plugin.getDataviewAPI();
    const excludeOp = generateExcludeOperator(this.settings);
    const query = excludeOp ? `(${from}) ${excludeOp}` : `(${from})`;
    const lists = await dataview.pages(query).file.lists;
    const result = lists.where((L: { task: STask; path: string; tags: string[] }) => {
      let includeTag = false;
      if (L.task || L.path === filepath) return false;
      const listTags = L.tags || [];
      for (const tag of tags) {
        includeTag = listTags.join(' ').toLowerCase().includes(`#${tag.toLowerCase()}`);
        if (includeTag) {
          break;
        }
      }
      return includeTag;
    });
    const groupResult = result.groupBy((elem: Element) => {
      return elem.link;
    });
    const sortResult = groupResult.sort((elem: { rows: Element }) => elem.rows.link, 'desc');
    const tableResult = sortResult.map((k: { rows: Element }) => [k.rows.text as string, k.rows.link as Link]);
    const tableValues = tableResult.array();

    dataview.table(['Bullet', 'Link'], tableValues, div, component, filepath);

    ctx.addChild(component);
  };
}
