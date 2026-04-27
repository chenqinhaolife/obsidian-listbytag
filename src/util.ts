import { Component, MarkdownRenderer } from 'obsidian';
import type { App } from 'obsidian';
import type { PluginSettings } from './type';

export function renderError(app: App, msg: string, containerEl: HTMLElement, sourcePath: string) {
  const component = new Component();

  return MarkdownRenderer.render(app, msg, containerEl, sourcePath, component);
}

export function generateExcludeOperator(settings: PluginSettings) {
  const { excludePaths } = settings;

  if (!excludePaths || !excludePaths.trim()) {
    return '';
  }

  // 支持多路径，换行分隔
  const paths = excludePaths.split('\n').map(p => p.trim()).filter(p => p);

  return paths.map((path) => `AND -"${path}"`).join(' ');
}

export function isInTemplateNote(path: string, settings: PluginSettings) {
  const { excludePaths } = settings;

  if (!excludePaths || !excludePaths.trim()) {
    return false;
  }

  const paths = excludePaths.split('\n').map(p => p.trim()).filter(p => p);

  return paths.some((template) => path.includes(template));
}
