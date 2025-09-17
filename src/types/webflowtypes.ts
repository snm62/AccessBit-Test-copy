// Define a Webflow API interface
export interface WebflowAPI {
  getSiteInfo: () => Promise<{
    siteId: string;
    siteName: string;
    shortName: string;
    url:string;
  }>;
  getIdToken: () => Promise<string>;
  publishSite: (options?: { 
    customDomains?: string[];
    publishToWebflowSubdomain?: boolean;
  }) => Promise<{
    customDomains: Array<{
      id: string;
      url: string;
      lastPublished: string;
    }>;
    publishToWebflowSubdomain: boolean;
  }>;
  setCustomCode: (options: {
    location: 'head' | 'footer';
    code: string;
  }) => Promise<void>;
  upsertPageCustomCode: (options: {
    location: 'head' | 'footer';
    code: string;
  }) => Promise<void>;
}
