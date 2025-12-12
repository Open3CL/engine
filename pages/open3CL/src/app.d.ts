// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

import { JSONContent } from 'svelte-jsoneditor/types';

declare global {
  export type JsonEditorContent = JSONContent;
}

export {};
