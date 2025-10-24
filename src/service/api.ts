const base_url = "https://accessbit-test-worker.web-8fb.workers.dev";
import { ScriptCategory, SaveCategoriesResponse, AppData } from '../types/types';
import { ScriptRegistrationRequest, CodeApplication } from "../types/types";


export const customCodeApi = {
  // Health check
  healthCheck: async () => {
    const response = await fetch(`${base_url}/api/health`);
    return response.json();
  },

  // Store data in KV
  storeData: async (key: string, value: any) => {
    const response = await fetch(`${base_url}/api/data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ key, value }),
    });
    return response.json();
  },

  // Get data from KV
  getData: async (key: string) => {
    const response = await fetch(`${base_url}/api/data/${key}`);
    return response.json();
  },

  // Get all data from KV
  getAllData: async () => {
    const response = await fetch(`${base_url}/api/data`);
    return response.json();
  },

  // Update data in KV
  updateData: async (key: string, value: any) => {
    const response = await fetch(`${base_url}/api/data/${key}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ value }),
    });
    return response.json();
  },

  // Delete data from KV
  deleteData: async (key: string) => {
    const response = await fetch(`${base_url}/api/data/${key}`, {
      method: "DELETE",
    });
    return response.json();
  },

  // Legacy methods for compatibility (mapped to new worker)
  registerScript: async (params: ScriptRegistrationRequest, token: string) => {
    const key = `script_${params.siteId || 'default'}`;
    const value = { ...params, token, timestamp: new Date().toISOString() };
    return await customCodeApi.storeData(key, value);
  },

  registerAnalyticsBlockingScript: async (token: string) => {
    const key = `analytics_blocking_${Date.now()}`;
    const value = { token, type: 'analytics_blocking', timestamp: new Date().toISOString() };
    return await customCodeApi.storeData(key, value);
  },

  getScripts: async (siteId: string, token: string) => {
    try {
      const allData = await customCodeApi.getAllData();
      const scripts = Object.values(allData.data || {}).filter((item: any) => 
        item.siteId === siteId || item.token === token
      );
      return { success: true, scripts };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  applyScript: async (params: CodeApplication, token: string) => {
    const key = `applied_script_${params.targetId || 'default'}`;
    const value = { ...params, token, timestamp: new Date().toISOString() };
    return await customCodeApi.storeData(key, value);
  },
};