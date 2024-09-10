chrome.runtime.onInstalled.addListener(() => {
  const sites = [
    { id: "PageSpeed", title: "PageSpeed" },
    { id: "BuiltWith", title: "BuiltWith" },
    { id: "Cloudinary", title: "Cloudinary Web Speed Test" },
  ];

  for (const site of sites) {
    chrome.contextMenus.create({
      id: site.id,
      title: site.title,
      contexts: ["all"],
    });
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const siteUrls = {
    PageSpeed: `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(
      tab.url
    )}`,
    BuiltWith: `https://builtwith.com/?${encodeURIComponent(tab.url)}`,
    Cloudinary: `https://webspeedtest-api.cloudinary.com/test/run`,
  };

  if (info.menuItemId === "Cloudinary") {
    async function sendPostRequest(url) {
      try {
        const response = await fetch(siteUrls.Cloudinary, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url }),
        });

        const data = await response.json();
        const analysisId = data.data.testId;
        const analysisUrl = `https://webspeedtest.cloudinary.com/results/${analysisId}`;

        chrome.tabs.create({ url: analysisUrl });
      } catch (error) {
        console.error(
          "Erro ao enviar URL para Cloudinary Web Speed Test:",
          error
        );
      }
    }

    sendPostRequest(tab.url);
  } else if (siteUrls[info.menuItemId]) {
    chrome.tabs.create({ url: siteUrls[info.menuItemId] });
  }
});
