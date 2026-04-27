import type { App, MarkdownPostProcessorContext } from 'obsidian';
import type { TaskResult } from 'obsidian-dataview/lib/api/plugin-api';
import type { PluginSettings, TaskConditionType } from '../type';
import type { STask } from 'obsidian-dataview';
import { ERROR_MESSAGE } from '../constant';
import { TaskStatusType } from '../type';
import { Markdown } from '../component/Markdown';
import { getI18n } from '../i18n';
import type ListByTagPlugin from '../main';
import { File } from './File';
import { generateExcludeOperator, renderError } from '../util';
import dayjs from 'dayjs';

export class Task {
  app: App;
  plugin: ListByTagPlugin;
  settings: PluginSettings;
  locale: string;
  file: File;
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
    const where = tags
      .map((tag: string, index: number) => {
        return `contains(lower(tags), "#${tag.toLowerCase()}") ${index === tags.length - 1 ? '' : 'OR'}`;
      })
      .join(' ');

    const dataview = await this.plugin.getDataviewAPI();
    const { values: tasks } = (await dataview.tryQuery(`
TASK
FROM (${from}) ${generateExcludeOperator(this.settings)}
WHERE ${where} AND file.path != "${filepath}"
SORT status ASC
    `)) as TaskResult;

    dataview.taskList(tasks, false, div, component);

    ctx.addChild(component);
  };

  filter(
    task: STask,
    condition: TaskConditionType = {
      status: TaskStatusType.DONE,
    },
  ): boolean {
    const { status: date = TaskStatusType.DONE, from, to } = condition;

    if (!task) return false;

    if (!from && !to) return false;

    if (task?.section?.type === 'header' && task?.section?.subpath?.trim() === this.settings.habitHeader.trim()) {
      return false;
    }

    let dateText = '';

    if (date === TaskStatusType.DONE) {
      const ret = task?.text.match(/✅ (\d\d\d\d-\d\d-\d\d)/);

      if (!ret) return false;
      dateText = ret[1];
    } else if (date === TaskStatusType.RECORD) {
      const ret = task?.path.match(/\d\d\d\d-\d\d-\d\d/);

      if (!ret) return false;

      dateText = ret[0];
    }

    const targetDate = dayjs(dateText);

    if (!targetDate) return false;

    const isFromFullfil = from ? targetDate.isSame(dayjs(from)) || targetDate.isAfter(dayjs(from)) : true;
    const isToFullfil = to ? targetDate.isSame(dayjs(to)) || targetDate.isBefore(dayjs(to)) : true;

    const isFullfil =
      task.children.map((subtask: STask) => this.filter(subtask, condition)).includes(true) ||
      (task.text.length > 1 &&
        ((date === TaskStatusType.DONE && task.completed) || date === TaskStatusType.RECORD) &&
        isFromFullfil &&
        isToFullfil);

    return isFullfil;
  }
}
