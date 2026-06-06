import { contextBridge, ipcRenderer } from "electron";

const sdaOperator = {
  launchQaBrowser: (request: unknown) => ipcRenderer.invoke("sda:launch-qa-browser", request),
  verifyCurrentIncident: (request: unknown) => ipcRenderer.invoke("sda:verify-current-incident", request),
  autofillCurrentIncidentDefaults: (request: unknown) => ipcRenderer.invoke("sda:autofill-current-incident-defaults", request),
  autofillCurrentIncidentTextFields: (request: unknown) => ipcRenderer.invoke("sda:text-field-autofill-current-incident", request),
  provisionChromiumRuntime: () => ipcRenderer.invoke("sda:provision-chromium-runtime"),
  onProvisionProgress: (callback: (_event: unknown, update: unknown) => void) => {
    ipcRenderer.on("sda:provision-progress", callback);
  },
  offProvisionProgress: (callback: (_event: unknown, update: unknown) => void) => {
    ipcRenderer.removeListener("sda:provision-progress", callback);
  },
};

contextBridge.exposeInMainWorld("sdaOperator", sdaOperator);
contextBridge.exposeInMainWorld("serviceNowAutomation", {
  version: "0.1.0",
  mode: "desktop",
});
