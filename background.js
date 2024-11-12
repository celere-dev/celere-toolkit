chrome.runtime.onInstalled.addListener(() => {
  const sites = [
    { id: "PageSpeed", title: "PageSpeed" },
    { id: "BuiltWith", title: "BuiltWith" },
    { id: "Yellow", title: "Yellow Lab Tools" },
    { id: "InspectWP", title: "InspectWP" },
    { id: "Siteliner", title: "Siteliner" },
    { id: "Cloudinary", title: "Image Analysis Tool by Cloudinary" },
    { id: "W3C", title: "W3C Markup Validation Service" },
    { id: "All", title: "Abrir todas as ferramentas" },
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
    Yellow: "https://yellowlab.tools/api/runs",
    InspectWP: "https://inspectwp.com/en",
    Siteliner: "https://www.siteliner.com/",
    Cloudinary: "https://webspeedtest-api.cloudinary.com/test/run",
    W3C: `https://validator.w3.org/nu/?doc=${encodeURIComponent(tab.url)}`,
  };

  if (info.menuItemId === "All") {
    sendPostRequestCloudinary(tab.url);
    sendPostRequestYellow(tab.url);
    openInspectWP();
    openSiteliner();

    {
      for (const [id, url] of Object.entries(siteUrls)) {
        if (
          id !== "Cloudinary" &&
          id !== "Yellow" &&
          id !== "InspectWP" &&
          id !== "Siteliner"
        ) {
          chrome.tabs.create({ url });
        }
      }
    }
  } else if (info.menuItemId === "Cloudinary") {
    sendPostRequestCloudinary(tab.url);
  } else if (info.menuItemId === "Yellow") {
    sendPostRequestYellow(tab.url);
  } else if (info.menuItemId === "InspectWP") {
    openInspectWP();
  } else if (info.menuItemId === "Siteliner") {
    openSiteliner();
  } else if (siteUrls[info.menuItemId]) {
    chrome.tabs.create({ url: siteUrls[info.menuItemId] });
  }

  async function sendPostRequestCloudinary(url) {
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
      logging("Image Analysis Tool by Cloudinary", error);
    }
  }

  async function sendPostRequestYellow(url) {
    try {
      const request = {
        url: url,
        waitForResponse: false,
        screenshot: true,
        device: "phone",
      };

      const response = await fetch(siteUrls.Yellow, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();
      const runId = data.runId;
      const runUrl = `https://yellowlab.tools/queue/${runId}`;

      chrome.tabs.create({ url: runUrl });
    } catch (error) {
      logging("Yellow Lab Tools", error);
    }
  }

  function openInspectWP() {
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        const activeTabUrl = activeTab.url;

        chrome.tabs.create({ url: siteUrls.InspectWP }, (newTab) => {
          chrome.tabs.onUpdated.addListener(function onUpdated(
            tabId,
            changeInfo
          ) {
            if (tabId === newTab.id && changeInfo.status === "complete") {
              chrome.scripting.executeScript({
                target: { tabId: newTab.id },
                func: (url) => {
                  document.getElementById(
                    "inspectwp-checker-form-url-input"
                  ).value = url;
                  document.querySelector("div.input-group button").click();
                },
                args: [activeTabUrl],
              });
              chrome.tabs.onUpdated.removeListener(onUpdated);
            }
          });
        });
      });
    } catch (error) {
      logging("InspectWP", error);
    }
  }

  function openSiteliner() {
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        const activeTabUrl = activeTab.url;

        chrome.tabs.create({ url: siteUrls.Siteliner }, (newTab) => {
          chrome.tabs.onUpdated.addListener(function onUpdated(
            tabId,
            changeInfo
          ) {
            if (tabId === newTab.id && changeInfo.status === "complete") {
              chrome.scripting.executeScript({
                target: { tabId: newTab.id },
                func: (url) => {
                  document.getElementById("field-domain").value = url;
                  document.getElementById("button-check-new").click();
                },
                args: [activeTabUrl],
              });
              chrome.tabs.onUpdated.removeListener(onUpdated);
            }
          });
        });
      });
    } catch (error) {
      logging("Siteliner", error);
    }
  }

  function logging(toolName, error) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: (errorMessage) => {
          alert(errorMessage);
        },
        args: [`Erro ao enviar URL para ${toolName}: ` + error],
      });
    });
  }
});
