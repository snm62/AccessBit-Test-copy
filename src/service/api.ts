const base_url = "https://accessibility-widget.web-8fb.workers.dev";
import { ScriptCategory, SaveCategoriesResponse, AppData } from '../types/types';
import { ScriptRegistrationRequest, CodeApplication } from "../types/types";


export const customCodeApi = {
  // Register a new script
  registerScript: async (params: ScriptRegistrationRequest, token: string) => {
    const response = await fetch(`${base_url}/api/custom-code/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });
    return response.json();
  },


  //blocking script registration
  registerAnalyticsBlockingScript: async (token: string) => {
    try {
      const response = await fetch(`${base_url}/api/custom-code/apply-custom-code`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          
          'Content-Type': 'application/json'
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, text: ${errorText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },

  getScripts: async (siteId: string, token: string) => {
    const response = await fetch(
      `${base_url}/api/custom-code/register?siteId=${siteId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.json();
  },

  // Apply script to site or page
  applyScript: async (params: CodeApplication, token: string) => {
    const response = await fetch(`${base_url}/api/custom-code/apply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });
    return response.json();
  },

};