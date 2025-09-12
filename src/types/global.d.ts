import { WebflowAPI } from './webflowtypes';

declare global {
  interface Window {
    webflow: WebflowAPI;
  }
  var webflow: WebflowAPI;
}

export interface ColorVariable {
  id: string;
  name: string;
  value: string;
} 