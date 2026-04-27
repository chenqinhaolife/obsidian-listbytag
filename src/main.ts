import { Notice, Plugin, type App, type MarkdownPostProcessorContext, type PluginSettingTab, type PluginManifest } from 'obsidian';
import { type DataviewApi, getAPI, isPluginEnabled } from 'obsidian-dataview';

import { ERROR_MESSAGE } from './constant';
import { Bullet } from './list/Bullet';
import { File } from './list/File';
import { Task } from './list/Task';
import { getI18n } from './i18n';
import { DEFAULT_SETTINGS, type PluginSettings } from './type';
import { renderError } from './util';
import { SettingTab } from './view/SettingTab';

const locale = window.localStorage.getItem('language') || 'en';

export default class ListByTagPlugin extends Plugin {
  settings!: PluginSettings;
  bullet!: Bullet;
  task!: Task;
  file!: File;
  dataview: DataviewApi | null = null;
  views!: Record<string, (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => void>;

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);

    this.registerEvent(
      this.app.metadataCache.on('dataview:index-ready' as 'changed', () => {
        this.dataview = getAPI(this.app);
      }),
    );

    if (!isPluginEnabled(app)) {
      new Notice(getI18n(locale)[`${ERROR_MESSAGE}NO_DATAVIEW_INSTALL`]);
      return;
    }

    this.dataview = getAPI(app);
  }

  getDataviewAPI(): Promise<DataviewApi> {
    return new Promise((resolve) => {
      if (this.dataview) {
        resolve(this.dataview);
        return;
      }

      const eventRef = this.app.metadataCache.on('dataview:index-ready' as 'changed', () => {
        this.app.metadataCache.offref(eventRef);
        resolve(getAPI(this.app));
      });

      setTimeout(() => {
        resolve(getAPI(this.app));
      }, 15 * 1000);
    });
  }

  async onload() {
    await this.loadSettings();
    this.loadHelpers();
    this.loadViews();

    this.registerMarkdownCodeBlockProcessor('ListByTag', this.markdownCodeBlockProcessor);

    this.addSettingTab(new SettingTab(this.app, this.settings, this));
  }

  loadHelpers() {
    this.file = new File(this.app, this.settings, this, locale);
    this.task = new Task(this.app, this.settings, this, locale);
    this.bullet = new Bullet(this.app, this.settings, this, locale);
  }

  loadViews() {
    this.views = {
      BulletListByTag: this.bullet.listByTag,
      TaskListByTag: this.task.listByTag,
      FileListByTag: this.file.listByTag,
    };
  }

  markdownCodeBlockProcessor = (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
    const view = source.trim();

    if (!view) {
      return renderError(
        this.app,
        getI18n(locale)[`${ERROR_MESSAGE}NO_VIEW_PROVIDED`],
        el.createEl('div'),
        ctx.sourcePath,
      );
    }

    if (!Object.keys(this.views).includes(view)) {
      return renderError(
        this.app,
        `${getI18n(locale)[`${ERROR_MESSAGE}NO_VIEW_EXISTED`]}: ${view}`,
        el.createEl('div'),
        ctx.sourcePath,
      );
    }

    const callback = this.views[view as keyof typeof this.views];

    return callback(view, el, ctx);
  };

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(settings: PluginSettings) {
    await this.saveData(settings);
    this.settings = settings;
    this.loadHelpers();
    this.loadViews();
  }
}
