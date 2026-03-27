#!/usr/bin/env python3
"""Primary UI smoke test for screenshot and interaction verification.

Usage:
  python3 scripts/primary_ui_smoke.py \
    --url http://127.0.0.1:4173/ \
    --settings tests/primary-ui-smoke-settings.json \
    --screenshot artifacts/primary-ui-smoke.png
"""

from __future__ import annotations

import argparse
import asyncio
from pathlib import Path

from playwright.async_api import async_playwright


async def run(url: str, settings_path: Path, screenshot_path: Path) -> None:
    if not settings_path.exists():
        raise FileNotFoundError(f"Settings file not found: {settings_path}")

    screenshot_path.parent.mkdir(parents=True, exist_ok=True)

    async with async_playwright() as p:
        browser = await p.firefox.launch()
        context = await browser.new_context(accept_downloads=True)
        page = await context.new_page()
        page_errors: list[str] = []
        page.on("pageerror", lambda exc: page_errors.append(str(exc)))

        await page.goto(url, wait_until="domcontentloaded")

        chooser_task = asyncio.create_task(page.wait_for_event("filechooser", timeout=10000))
        await page.click("#import-settings")
        chooser = await chooser_task
        await chooser.set_files(str(settings_path.resolve()))

        await page.click("#recalculate")
        await page.wait_for_selector(".pricing-card table tbody tr td", timeout=10000)

        async with page.expect_download(timeout=10000):
            await page.click("#export-settings")

        await page.click("#reset-saved-inputs")
        await page.click("#clear-all-app-data")
        await page.wait_for_timeout(900)

        await page.screenshot(path=str(screenshot_path), full_page=True)

        cell_count = await page.locator(".pricing-card table tbody tr td").count()

        print(f"SMOKE_TABLE_CELLS={cell_count}")
        print(f"SMOKE_PAGE_ERRORS={page_errors}")
        print(f"SMOKE_SCREENSHOT={screenshot_path}")

        await context.close()
        await browser.close()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://127.0.0.1:4173/")
    parser.add_argument("--settings", default="tests/primary-ui-smoke-settings.json")
    parser.add_argument("--screenshot", default="artifacts/primary-ui-smoke.png")
    args = parser.parse_args()

    asyncio.run(run(args.url, Path(args.settings), Path(args.screenshot)))


if __name__ == "__main__":
    main()
