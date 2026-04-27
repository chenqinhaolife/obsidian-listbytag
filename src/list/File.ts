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

    const from = tags
      .map((tag: string, index: number) => {
        return `#${tag} ${index === tags.length - 1 ? '' : 'OR'}`;
      })
      .join(' ')
      .trim();

    const dataview = await this.plugin.getDataviewAPI();
    dataview.table(
      ['File', 'Date'],
      dataview
        .pages(from)
        .filter((b: { file: TFile }) => b.file.path !== filepath)
        .sort((b: { file: { ctime: { ts: number } } }) => b.file.ctime.ts, 'desc')
        .map((b: { file: { link: string; ctime: { ts: number } } }) => [
          b.file.link,
          `[[${dayjs(b.file.ctime.ts).format('YYYY-MM-DD')}]]`,
        ]),
      div,
      component,
      filepath,
    );

    ctx.addChild(component);
  };
}
