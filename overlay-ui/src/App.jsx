import React, { useState, useRef, useEffect } from "react";

export default function App() {
  const [url, setUrl] = useState("https://google.com");
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isWebviewReady, setIsWebviewReady] = useState(false); 
  const webviewRef = useRef(null);

  const updateNavState = () => {
    const webview = webviewRef.current;
    if (!webview) return;
    setCanGoBack(webview.canGoBack());
    setCanGoForward(webview.canGoForward());
  };

  const onNavigate = (e) => {
    e.preventDefault();
    if (webviewRef.current && isWebviewReady) {
      webviewRef.current.loadURL(url);
    }
  };

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const handleDidNavigate = () => {
      if (!webview) return;
      setUrl(webview.getURL());
      updateNavState();
    };

    const handleDomReady = () => {
      setIsWebviewReady(true); 
      
      // THIS IS THE IMPORTANT LINE I ADDED FOR YOU
      webview.openDevTools();
      
      webview.loadURL(url);
      webview.addEventListener("did-navigate", handleDidNavigate);
      webview.addEventListener("did-navigate-in-page", handleDidNavigate);
      webview.addEventListener("did-finish-load", updateNavState);
    };

    webview.addEventListener("dom-ready", handleDomReady);

    return () => {
      webview.removeEventListener("dom-ready", handleDomReady);
      webview.removeEventListener("did-navigate", handleDidNavigate);
      webview.removeEventListener("did-navigate-in-page", handleDidNavigate);
      webview.removeEventListener("did-finish-load", updateNavState);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <fieldset disabled={!isWebviewReady} style={{ border: 'none', padding: 0 }}>
        <form onSubmit={onNavigate} style={{ display: "flex", padding: 8 }}>
          <button type="button" onClick={() => webviewRef.current?.goBack()} disabled={!canGoBack}>
            ◀ Back
          </button>
          <button type="button" onClick={() => webviewRef.current?.goForward()} disabled={!canGoForward}>
            Forward ▶
          </button>
          <button type="button" onClick={() => webviewRef.current?.reload()}>
            🔄 Reload
          </button>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={{ flexGrow: 1, marginLeft: 8, padding: 4 }}
          />
          <button type="submit" style={{ marginLeft: 8 }}>Go</button>
        </form>
      </fieldset>
      
      <webview
        ref={webviewRef}
        style={{ flexGrow: 1, width: "100%" }}
        partition="persist:webview"
        allowpopups="true"
        src={url} 
        webpreferences="contextIsolation=yes,sandbox=yes,webSecurity=yes" 
      />
    </div>
  );
}