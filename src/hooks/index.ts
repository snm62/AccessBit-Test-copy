
import { useState } from "react";
import { customCodeApi } from "../service/api"
import { CustomCode, ScriptRegistrationRequest } from "../types/types";

/**
 * Hook for managing script registration in Webflow
 * @param sessionToken - The user's authentication token
 * @param siteId - The target Webflow site ID
 * @returns {Object} Object containing:
 *   - registerScript: Function to register a new script
 *   - isRegistering: Loading state for registration
 */
export function useScriptRegistration(sessionToken: string, siteId: string) {
  // Track registration state
  const [isRegistering, setIsRegistering] = useState(false);

  /**
   * Register a new script with Webflow
   * @param code - The script content or URL
   * @param isHosted - Whether this is a hosted script (URL) or inline code
   * @returns {Promise<CustomCode>} The registered script result from Webflow
   */
  const registerScript = async (
    code: string,
    isHosted: boolean
  ): Promise<CustomCode | undefined> => {
    if (!sessionToken || !siteId) return;

    setIsRegistering(true);
    try {
      const scriptData: CustomCode = {
        displayName: `Boilerplate Script ${Date.now()}`,
        version: "1.0.0",
        ...(isHosted ? { hostedLocation: code } : { sourceCode: code }),
      };

      const request: ScriptRegistrationRequest = {
        siteId,
        isHosted,
        scriptData,
      };

      const { result } = await customCodeApi.registerScript(
        request,
        sessionToken
      );
      return result;
    } catch (error) {
      throw error;
    } finally {
      setIsRegistering(false);
    }
  };

  return {
    registerScript,
    isRegistering,
  };
}
