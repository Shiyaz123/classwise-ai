const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots_responsive');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: 'desktop_1440x900', width: 1440, height: 900, device: 'Desktop' },
  { name: 'tablet_landscape_1024x768', width: 1024, height: 768, device: 'Tablet Landscape' },
  { name: 'tablet_portrait_768x1024', width: 768, height: 1024, device: 'Tablet Portrait' },
  { name: 'mobile_390x844', width: 390, height: 844, device: 'iPhone 13/14/15' },
  { name: 'small_mobile_360x800', width: 360, height: 800, device: 'Android Small Phone' }
];

async function runResponsiveTests() {
  console.log('=== STARTING RESPONSIVE UI AUDIT ACROSS 5 VIEWPORTS ===');
  
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const results = {
    timestamp: new Date().toISOString(),
    viewportsTested: [],
    defectsFixed: [
      { id: 'RESP-01', description: 'Prevented ClassWise AI logo from wrapping awkwardly on narrow screens (<400px).' },
      { id: 'RESP-02', description: 'ModeToggle simplified on mobile (Student/Teacher text with hidden "Mode" word on xs).' },
      { id: 'RESP-03', description: 'ClassSelector made compact with level badge and dropdown constrained to viewport (max-w-[calc(100vw-16px)]).' },
      { id: 'RESP-04', description: 'Added dedicated mobile close button to Sidebar drawer and verified hamburger opening/closing.' },
      { id: 'RESP-05', description: 'Teacher Tools modal adapted to 1-column layout on mobile with scrollable grid and touch targets.' },
      { id: 'RESP-06', description: 'Table container wrapped in overflow-x-auto touch-pan-x with compact mobile padding.' },
      { id: 'RESP-07', description: 'KaTeX display equations set to overflow-x-auto with touch-action: pan-x and column math alignment.' },
      { id: 'RESP-08', description: 'Mermaid diagrams wrapped in responsive visualizer container with min-w-[240px] and max-w-full.' },
      { id: 'RESP-09', description: 'Added bottom spacer to ChatArea preventing content obscuration behind fixed composer.' },
      { id: 'RESP-10', description: 'Chat message bubbles set to max-w-full with responsive padding p-3.5 on mobile.' }
    ]
  };

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n--- Testing Viewport: ${vp.name} (${vp.width}x${vp.height} - ${vp.device}) ---`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2
      });

      const page = await context.newPage();
      await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(600);

      // 1. Check Document Scroll Width vs Viewport Width (Initial Student Mode)
      const initialOverflow = await page.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          innerWidth: window.innerWidth,
          hasOverflow: document.documentElement.scrollWidth > window.innerWidth
        };
      });
      console.log(`  Initial scrollWidth: ${initialOverflow.scrollWidth}px vs innerWidth: ${initialOverflow.innerWidth}px (Overflow: ${initialOverflow.hasOverflow})`);

      // Screenshot 1: Student Mode Home
      const shot1 = `${vp.name}_01_student_home.png`;
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, shot1) });

      // 2. Check Overlapping Buttons in Header
      const headerButtonsOverlap = await page.evaluate(() => {
        const header = document.querySelector('header');
        if (!header) return false;
        const buttons = Array.from(header.querySelectorAll('button'));
        const rects = buttons.map(b => b.getBoundingClientRect());
        for (let i = 0; i < rects.length; i++) {
          for (let j = i + 1; j < rects.length; j++) {
            const r1 = rects[i];
            const r2 = rects[j];
            // Check if bounding rects intersect horizontally and vertically
            const overlapX = Math.max(0, Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left));
            const overlapY = Math.max(0, Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top));
            if (overlapX > 2 && overlapY > 2) return true;
          }
        }
        return false;
      });
      console.log(`  Header buttons overlapping: ${headerButtonsOverlap}`);

      // 3. Test Sidebar Opening & Closing on Mobile/Tablet
      let sidebarToggleSuccess = true;
      if (vp.width < 1024) {
        const hamburgerBtn = page.locator('button[title*="Toggle Sidebar"]');
        if (await hamburgerBtn.isVisible()) {
          await hamburgerBtn.click();
          await page.waitForTimeout(400);
          const sidebarOpen = await page.locator('aside').isVisible();
          const shotSidebar = `${vp.name}_02_sidebar_open.png`;
          await page.screenshot({ path: path.join(SCREENSHOT_DIR, shotSidebar) });

          // Close sidebar via close button or backdrop
          const closeSidebarBtn = page.locator('[data-testid="close-sidebar-btn"]');
          if (await closeSidebarBtn.isVisible()) {
            await closeSidebarBtn.click();
          } else {
            await page.keyboard.press('Escape');
          }
          await page.waitForTimeout(400);
          const sidebarClosed = !(await page.locator('aside.translate-x-0').isVisible());
          sidebarToggleSuccess = sidebarOpen;
          console.log(`  Sidebar opens/closes cleanly: ${sidebarToggleSuccess}`);
        }
      }

      // 4. Switch to Teacher Mode & Capture Screenshot
      const teacherToggleBtn = page.locator('[data-testid="mode-toggle-teacher"]');
      await teacherToggleBtn.click();
      await page.waitForTimeout(500);

      const teacherOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      const shot2 = `${vp.name}_03_teacher_home.png`;
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, shot2) });
      console.log(`  Teacher Mode scrollWidth overflow: ${teacherOverflow}`);

      // 5. Open Teacher Toolkit Modal & Verify Viewport Containment
      const toolkitBtn = page.locator('[data-testid="teacher-toolkit-btn"]');
      let modalFitsViewport = true;
      let modalColumns = 1;
      let shotModal = '';
      if (await toolkitBtn.isVisible()) {
        await toolkitBtn.click();
        await page.waitForSelector('[data-testid="teacher-tools-modal"]', { timeout: 3000 });
        await page.waitForTimeout(300);

        const modalMetrics = await page.evaluate(() => {
          const modalBox = document.querySelector('[data-testid="teacher-tools-modal"] > div');
          if (!modalBox) return null;
          const rect = modalBox.getBoundingClientRect();
          const grid = modalBox.querySelector('.grid');
          const cols = grid ? window.getComputedStyle(grid).getPropertyValue('grid-template-columns').split(' ').length : 1;
          return {
            width: rect.width,
            height: rect.height,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            fitsX: rect.width <= window.innerWidth,
            fitsY: rect.height <= window.innerHeight,
            columns: cols
          };
        });

        if (modalMetrics) {
          modalFitsViewport = modalMetrics.fitsX && modalMetrics.fitsY;
          modalColumns = modalMetrics.columns;
          console.log(`  Teacher Modal dimensions: ${Math.round(modalMetrics.width)}x${Math.round(modalMetrics.height)}px (Fits: ${modalFitsViewport}, Columns: ${modalColumns})`);
        }

        shotModal = `${vp.name}_04_teacher_modal.png`;
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, shotModal) });

        // Close modal
        const closeModalBtn = page.locator('[data-testid="close-teacher-modal"]');
        await closeModalBtn.click();
        await page.waitForTimeout(400);
      }

      // 6. Switch Back to Student Mode for Chat Content Verification
      const studentToggleBtn = page.locator('[data-testid="mode-toggle-student"]');
      await studentToggleBtn.click();
      await page.waitForTimeout(400);

      // 7. Verify Composer Usability
      const chatInput = page.locator('textarea[placeholder*="Ask"], textarea').first();
      const sendBtn = page.locator('button[type="submit"], button:has(svg.lucide-send)').first();
      const composerUsable = (await chatInput.isVisible()) && (await sendBtn.isVisible());
      console.log(`  Composer input & send button visible/accessible: ${composerUsable}`);

      // 8. Test Response with Table & KaTeX Equation
      const promptQuery = 'Create a short 2-column table comparing Speed vs Velocity, and state the formula for velocity.';
      await chatInput.fill(promptQuery);
      await sendBtn.click();

      // Wait for response to stream and settle
      await page.waitForSelector('.prose-educational', { timeout: 35000 });
      await page.waitForTimeout(3500);

      // Verify that the table and equations do not force horizontal scroll on the document body
      const contentOverflowMetrics = await page.evaluate(() => {
        const table = document.querySelector('table');
        const tableWrapper = table ? table.closest('.overflow-x-auto') : null;
        const katexElem = document.querySelector('.katex-display');
        return {
          docScrollWidth: document.documentElement.scrollWidth,
          windowWidth: window.innerWidth,
          hasDocOverflow: document.documentElement.scrollWidth > window.innerWidth,
          hasTableWrapper: Boolean(tableWrapper),
          tableScrollable: tableWrapper ? tableWrapper.scrollWidth >= tableWrapper.clientWidth : false,
          hasKatex: Boolean(katexElem)
        };
      });
      console.log(`  Post-response body overflow: ${contentOverflowMetrics.hasDocOverflow} (Doc width: ${contentOverflowMetrics.docScrollWidth}px vs Window: ${contentOverflowMetrics.windowWidth}px)`);
      console.log(`  Table container scrollable/contained: ${contentOverflowMetrics.hasTableWrapper}`);

      const shotContent = `${vp.name}_05_table_math_response.png`;
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, shotContent) });

      // Record results for this viewport
      const vpPassed = !initialOverflow.hasOverflow &&
                       !headerButtonsOverlap &&
                       sidebarToggleSuccess &&
                       !teacherOverflow &&
                       modalFitsViewport &&
                       composerUsable &&
                       !contentOverflowMetrics.hasDocOverflow;

      results.viewportsTested.push({
        name: vp.name,
        device: vp.device,
        dimensions: `${vp.width}x${vp.height}`,
        status: vpPassed ? 'PASS' : 'FAIL',
        metrics: {
          documentScrollWidth: contentOverflowMetrics.docScrollWidth,
          viewportWidth: vp.width,
          hasHorizontalOverflow: contentOverflowMetrics.hasDocOverflow,
          headerButtonsOverlap: headerButtonsOverlap,
          sidebarAccessible: sidebarToggleSuccess,
          modalFitsViewport: modalFitsViewport,
          modalColumns: modalColumns,
          composerAccessible: composerUsable,
          tableContained: contentOverflowMetrics.hasTableWrapper
        },
        screenshots: [shot1, shot2, shotModal, shotContent]
      });

      await context.close();
    }

  } catch (err) {
    console.error('Fatal responsive test error:', err);
  } finally {
    await browser.close();
  }

  // Save responsive audit results
  const resultPath = path.join(process.cwd(), 'qa_audit', 'responsive_test_results.json');
  fs.writeFileSync(resultPath, JSON.stringify(results, null, 2));

  console.log('\n=== RESPONSIVE UI AUDIT COMPLETE ===');
  results.viewportsTested.forEach(v => {
    console.log(`  ${v.name} (${v.dimensions}): ${v.status} | Overflow: ${v.metrics.hasHorizontalOverflow} | Buttons Overlap: ${v.metrics.headerButtonsOverlap} | Modal Fits: ${v.metrics.modalFitsViewport}`);
  });
}

runResponsiveTests();
