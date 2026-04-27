export type PluginSettings = {
  habitHeader: string;
  excludePaths: string;  // 支持多路径，换行分隔
};

export type TaskConditionType = {
  status?: TaskStatusType;
  from?: string;
  to?: string;
};

export enum TaskStatusType {
  DONE = 'DONE',
  RECORD = 'RECORD',
}

export const DEFAULT_SETTINGS: PluginSettings = {
  habitHeader: 'Habit',
  excludePaths: '',
};
