import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("serviceNowAutomation", {
  appName: "Service Now Automation"
});
