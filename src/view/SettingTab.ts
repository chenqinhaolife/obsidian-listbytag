import { App, PluginSettingTab, Setting } from 'obsidian';
import type { PluginSettings } from '../type';
import type ListByTagPlugin from '../main';

export class SettingTab extends PluginSettingTab {
  plugin: ListByTagPlugin;
  settings: PluginSettings;

  constructor(app: App, settings: PluginSettings, plugin: ListByTagPlugin) {
    super(app, plugin);
    this.plugin = plugin;
    this.settings = settings;
  }

  display(): void {
    this.containerEl.empty();

    this.containerEl.createEl('h2', { text: 'ListByTag Settings' });

    const habitHeaderSetting = new Setting(this.containerEl);
    habitHeaderSetting.setName('Habit Header');
    habitHeaderSetting.setDesc('Header for habit tasks to exclude');
    habitHeaderSetting.addText((text) => {
      text.setValue(this.settings.habitHeader).onChange(async (value) => {
        this.settings.habitHeader = value;
        await this.plugin.saveSettings(this.settings);
      });
    });

    this.containerEl.createEl('h3', { text: 'Exclude Paths' });

    const excludeDesc = document.createDocumentFragment();
    excludeDesc.appendText('Paths to exclude from queries (one per line)');
    this.containerEl.createEl('p', {
      text: 'Example:',
      cls: 'setting-item-description'
    });
    this.containerEl.createEl('pre', {
      text: 'Templates\npath/to/ignore.md\nfolder/to/exclude',
      cls: 'setting-item-description'
    });

    const excludePathSetting = new Setting(this.containerEl);
    excludePathSetting.setName('Exclude Paths');
    excludePathSetting.setDesc('Paths to exclude from queries (one per line)');
    excludePathSetting.addTextArea((text) => {
      text.setValue(this.settings.excludePaths).onChange(async (value) => {
        this.settings.excludePaths = value;
        await this.plugin.saveSettings(this.settings);
      });
    });
  }
}
