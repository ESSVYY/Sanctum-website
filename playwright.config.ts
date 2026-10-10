import { defineConfig } from '@playwright/test';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const browserCache = join(process.env.LOCALAPPDATA || '', 'ms-playwright');
const cachedChromium = existsSync(browserCache) ? readdirSync(browserCache).filter(name => /^chromium-\d+$/.test(name)).sort((a,b)=>Number(b.split('-')[1])-Number(a.split('-')[1])).map(name=>join(browserCache,name,'chrome-win64','chrome.exe')).find(existsSync) : undefined;
const baseURL=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:3000';
export default defineConfig({testDir:'./tests',testMatch:'**/*.spec.ts',fullyParallel:false,use:{baseURL,launchOptions:{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || cachedChromium}},webServer:process.env.PLAYWRIGHT_BASE_URL?undefined:{command:'npm run start',env:{BLOG_PREVIEW_CONTENT:'true'},url:baseURL,reuseExistingServer:true,timeout:60000}});
