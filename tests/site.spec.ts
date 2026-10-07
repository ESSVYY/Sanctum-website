import { test, expect } from '@playwright/test';
test('homepage navigation, calculator, assistant, FAQ and demo controls',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.locator('h1')).toContainText('BUILT BY');
 await expect(page.locator('main > section')).toHaveCount(16);
 await expect(page.locator('[data-roi-output="hours"]')).toHaveText('1,040');
 await expect(page.locator('[data-roi-output="cost"]')).toHaveText('NZ$36,400');
 await page.locator('[data-roi-index="0"]').evaluate((el:HTMLInputElement)=>{el.value='8';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await expect(page.locator('[data-roi-output="hours"]')).toHaveText('2,080');
 await expect(page.locator('[data-roi-output="cost"]')).toHaveText('NZ$72,800');
 await page.getByRole('button',{name:'Open assistant'}).click();
 await expect(page.getByRole('heading',{name:'SANCTUM AI ASSISTANT'})).toBeVisible();
 await page.getByRole('button',{name:'CRM Automation',exact:true}).click();
 await expect(page.locator('.chat-messages')).toContainText('local canned reply');
 await page.getByRole('textbox',{name:'Message the assistant'}).fill('Help with my business');
 await page.getByRole('button',{name:'Send message'}).click();
 await expect(page.locator('.chat-messages .user').last()).toHaveText('user: Help with my business');
 await page.getByRole('textbox',{name:'Message the assistant'}).press('Escape');
 await expect(page.locator('.chat-panel')).toBeHidden();
 await page.locator('#faq summary').first().click();
 await expect(page.locator('#faq .faq-answer').first()).toBeVisible();
 await expect(page.locator('#faq .faq-answer').first()).toContainText('Answer placeholder');
 await page.locator('.nav-links').getByRole('link',{name:'Solutions'}).click();
 await expect(page).toHaveURL(/#services/);
 await page.locator('.nav-actions').getByRole('link',{name:'Request Demo'}).click();
 await expect(page.getByRole('dialog')).toContainText('No request has been sent');
 await page.getByRole('button',{name:'Close',exact:true}).click();
 expect(errors).toEqual([]);
});
test('three admin views and return to website',async({page})=>{
 await page.goto('/admin');await expect(page.getByRole('heading',{name:'Overview',exact:true})).toBeVisible();
 await expect(page.locator('.admin-metrics')).toContainText('2,418');
 await page.getByRole('button',{name:'LEAD PROFILE',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Lead Profile',exact:true})).toBeVisible();
 await expect(page.locator('.lead-details')).toContainText('Sarah Mitchell');
 await expect(page.locator('.score strong')).toHaveText('87');
 await expect(page.locator('.journey li')).toHaveCount(8);
 await page.getByRole('button',{name:'AUTOMATION HEALTH',exact:true}).click();
 await expect(page.locator('.workflow-table tbody tr')).toHaveCount(5);
 await expect(page.locator('.workflow-status.paused')).toHaveText('PAUSED');
 await page.getByRole('button',{name:'GENERATE WIP REPORT',exact:true}).click();
 await expect(page.getByRole('dialog')).toContainText('sample summary');
 await page.getByRole('button',{name:'Close',exact:true}).click();
 await page.getByRole('link',{name:'← VIEW WEBSITE'}).click();await expect(page.locator('h1')).toContainText('BUILT BY');
});
for(const width of [375,768,1440]) test(`responsive ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto('/');await page.evaluate(()=>document.fonts.ready);
 await expect(page.locator('h1')).toBeVisible();
 const overflow=await page.evaluate(()=>Array.from(document.querySelectorAll('main section')).filter(e=>e.scrollWidth>e.clientWidth+2).map(e=>({id:e.id,scroll:e.scrollWidth,width:e.clientWidth})));
 expect(overflow).toEqual([]);
 if(width<900){await page.getByRole('button',{name:'Menu',exact:true}).click();await page.locator('#mobile-navigation').getByRole('link',{name:'Pricing'}).click();await expect(page).toHaveURL(/#pricing/);}
 await page.screenshot({path:`reference/home-${width}.png`,fullPage:true});
 if(width<900) for(const id of ['hero','transformation','roi','capabilities','pricing','faq','insights','contact','footer']) await page.locator('#'+id).screenshot({path:`reference/${id}-${width}.png`,animations:'disabled',style:'.site-nav,.skip-link,.mobile-menu-toggle,.assistant {visibility:hidden !important;}'});
 await page.goto('/admin');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2)).toBe(true);
 await page.screenshot({path:`reference/admin-${width}.png`,fullPage:true});
 for(const view of ['LEAD PROFILE','AUTOMATION HEALTH']) {await page.getByRole('button',{name:view,exact:true}).click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2)).toBe(true);await page.screenshot({path:`reference/admin-${view.toLowerCase().replaceAll(' ','-')}-${width}.png`,fullPage:true});}
});
test('capture supplied desktop views for visual review',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});await page.goto('/');await page.evaluate(()=>document.fonts.ready);
 for(const id of ['hero','problems','founder','transformation','services','workflows','analytics','roi','capabilities','pricing','case-studies','industries','process','faq','insights','contact']) await page.locator('#'+id).screenshot({path:`reference/section-${id}.png`,animations:'disabled',style:'.site-nav,.skip-link,.mobile-menu-toggle,.assistant {visibility:hidden !important;}'});
 await page.getByRole('button',{name:'Open assistant'}).click();await page.locator('.chat-panel').screenshot({path:'reference/assistant.png'});
 await page.goto('/admin');await page.getByRole('button',{name:'LEAD PROFILE',exact:true}).click();await page.screenshot({path:'reference/admin-lead.png',fullPage:true});
 await page.getByRole('button',{name:'AUTOMATION HEALTH',exact:true}).click();await page.screenshot({path:'reference/admin-health.png',fullPage:true});
});
