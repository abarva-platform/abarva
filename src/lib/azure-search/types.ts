export type SearchDocument = Record<string, unknown> & {
  readonly '@search.action'?: 'upload' | 'merge' | 'mergeOrUpload' | 'delete';
  readonly id: string;
};
