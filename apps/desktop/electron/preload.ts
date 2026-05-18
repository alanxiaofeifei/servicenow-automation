import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("serviceNowAutomation", {
  appName: "ServiceNow Automation"
});
