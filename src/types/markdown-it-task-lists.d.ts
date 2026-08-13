declare module 'markdown-it-task-lists' {
  import type MarkdownIt from 'markdown-it';

  interface TaskListsOptions {
    readonly enabled?: boolean;
    readonly label?: boolean;
    readonly labelAfter?: boolean;
  }

  const taskLists: MarkdownIt.PluginWithOptions<TaskListsOptions>;
  export default taskLists;
}
