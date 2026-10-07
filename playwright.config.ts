import { defineConfig } from '@playwright/test';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const browserCache = join(process.env.LOCALAPPDATA || '', 'ms-playwright');
const cachedChromium = existsSync(browserCache) ? readdirSync(browserCache).filter(name => /^chromium-\d+$/.test(name)).sort((a,b)=>Number(b.split('-')[1])-Number(a.split('-')[1])).map(name=>join(browserCache,name,'chrome-win64','chrome.exe')).find(existsSync) : undefined;
export default defineConfig({testDir:'./tests',fullyParallel:false,use:{baseURL:'http://127.0.0.1:3000',launchOptions:{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || cachedChromium}},webServer:{command:'npm run start',url:'http://127.0.0.1:3000',reuseExistingServer:true,timeout:60000}});
