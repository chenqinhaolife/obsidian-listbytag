import { type App, type MarkdownPostProcessorContext, TFile } from 'obsidian';
import type { PluginSettings } from '../type';
import dayjs from 'dayjs';
import { Markdown } from '../component/Markdown';
import { ERROR_MESSAGE } from '../constant';
import { getI18n } from '../i18n';
import type ListByTagPlugin from '../main';
import { renderError } from '../util';

export class File {
  app: App;
  settings: PluginSettings;
  plugin: ListByTagPlugin;
  locale: string;
  constructor(app: App, settings: PluginSettings, plugin: ListByTagPlugin, locale: string) {
    this.app = app;
    this.settings = settings;
    this.plugin = plugin;
    this.locale = locale;
  }

  tags(filePath: string): string[] {
    const file = this.app.vault.getAbstractFileByPath(filePath);

    if (file instanceof TFile) {
      const { frontmatter } = this.app.metadataCache.getFileCache(file) || {
        frontmatter: {},
      };

      let tags = frontmatter?.tags;

      if (!tags) {
        return [];
      }

      if (typeof tags === 'string') {
        tags = [tags];
      }

      return tags.map((tag: string) => tag.replace(/^#(.*)$/, '$1'));
    }

    return [];
  }

  listByTag = async (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
    const filepath = ctx.sourcePath;
    const tags = this.tags(filepath);
    const div = el.createEl('div');
    const component = new Markdown(div);

    if (!tags.length) {
      return renderError(this.app, getI18n(this.locale)[`${ERROR_MESSAGE}NO_FRONT_MATTER_TAG`], div, filepath);
    }

    const dataview = await this.plugin.getDataviewAPI();

    // 构建 tags 的 where 条件
    // file.frontmatter.tags 只匹配 frontmatter 中的 tags
    const whereConditions = tags.map((tag: string, index: number) => {
      return `contains(lower(file.frontmatter.tags), "${tag.toLowerCase()}") ${index === tags.length - 1 ? '' : 'OR'}`;
    }).join(' ');

    // 使用 Dataview 查询，精确匹配 frontmatter.tags
    const result = await dataview.tryQuery(`
      TABLE file.link, file.ctime
      FROM ""
      WHERE ${whereConditions} AND file.path != "${filepath}"
      SORT file.ctime DESC
    `) as { values: any[] };

    // values 是数组的数组: [[fileObj, fileObj, dateStr], ...]
    const tableValues = result.values.map((row: any[]) => {
      const filePath = row[0]?.path || row[1]?.path || '';
      const dateStr = row[2] || '';
      return [
        `[[${filePath}]]`,
        dateStr ? dayjs(dateStr).format('YYYY-MM-DD') : '',
      ];
    });

    dataview.table(['File', 'Date'], tableValues, div, component, filepath);

    ctx.addChild(component);
  };
}
