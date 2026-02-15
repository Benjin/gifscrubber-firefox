(() => {
  if (window.top !== window) {
    return;
  }

  if ((window as Window & { __gifScrubberInjected?: boolean }).__gifScrubberInjected) {
    return;
  }
  (window as Window & { __gifScrubberInjected?: boolean }).__gifScrubberInjected = true;

  const runtime = (globalThis as { browser?: { runtime?: { getURL?: (path: string) => string } }; chrome?: { runtime?: { getURL?: (path: string) => string } } });
  const pageUrl =
    runtime.browser?.runtime?.getURL?.("page.js") ??
    runtime.chrome?.runtime?.getURL?.("page.js");
  if (!pageUrl) {
    return;
  }

  const script = document.createElement("script");
  script.src = pageUrl;
  script.type = "text/javascript";
  script.dataset.gifScrubber = "true";
  script.onload = () => {
    script.remove();
  };
  (document.head || document.documentElement).appendChild(script);
})();
