// Links to the published legal texts (docs/06-business/legal, served by apps/web/api/legal.js). Spec: SC-070.
import * as WebBrowser from "expo-web-browser";
import { SITE_URL } from "./config";

export const PRIVACY_URL = `${SITE_URL}/privacy`;
export const TERMS_URL = `${SITE_URL}/terms`;

export const openLegal = (url: string) =>
  WebBrowser.openBrowserAsync(url, { presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET });
