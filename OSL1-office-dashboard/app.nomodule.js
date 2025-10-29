(function () {
  var React = window.React;

  function useInterval(callback, delay) {
    var savedRef = React.useRef(callback);
    React.useEffect(function () { savedRef.current = callback; }, [callback]);
    React.useEffect(function () {
      if (delay == null) return;
      var id = setInterval(function () { savedRef.current(); }, delay);
      return function () { clearInterval(id); };
    }, [delay]);
  }

  function Panel(props) {
    var panel = props.panel;
    var panelUrl = React.useMemo(function () {
      if (!panel || !panel.url) return null;
      try { return new URL(panel.url, window.location.href); }
      catch (err) { return null; }
    }, [panel && panel.url]);
    var isCrossOrigin = !!(panelUrl && panelUrl.origin !== window.location.origin);
    var isInsecureCrossOrigin = !!(panelUrl && panelUrl.protocol !== "https:" && isCrossOrigin);
    var panelTitle = panel && (panel.title || panel.label || panel.id);
    var panelClassName = "panel" + (isInsecureCrossOrigin ? " panel--blocked" : "");
    var _React$useState = React.useState(0),
        key = _React$useState[0],
        setKey = _React$useState[1];
    var iframeRef = React.useRef(null);
    var _React$useState2 = React.useState(false),
        needsStorageAccess = _React$useState2[0],
        setNeedsStorageAccess = _React$useState2[1];
    var externalWindowRef = React.useRef(null);
    var externalWatchRef = React.useRef(null);
    var _React$useState3 = React.useState(false),
        externalTabOpen = _React$useState3[0],
        setExternalTabOpen = _React$useState3[1];

    React.useEffect(function () {
      if (!panel || !panel.refreshMinutes) return;
      var ms = panel.refreshMinutes * 60 * 1000;
      var t = setInterval(function () { setKey(function (k) { return k + 1; }); }, ms);
      return function () { clearInterval(t); };
    }, [panel && panel.refreshMinutes]);

    React.useEffect(function () { setNeedsStorageAccess(false); }, [panel && panel.url, key]);

    React.useEffect(function () {
      if (!panelUrl || isInsecureCrossOrigin) return;
      var origin = panelUrl.origin;

      function onMessage(event) {
        if (event.origin !== origin) return;
        var data = event.data;
        if (!data || typeof data !== "object") return;
        if (data.type === "STORAGE_ACCESS_REQUIRED") setNeedsStorageAccess(true);
        if (data.type === "STORAGE_ACCESS_GRANTED" || data.type === "STORAGE_ACCESS_AVAILABLE") setNeedsStorageAccess(false);
      }

      window.addEventListener("message", onMessage);
      return function () { window.removeEventListener("message", onMessage); };
    }, [panelUrl && panelUrl.origin, isInsecureCrossOrigin]);

    React.useEffect(function () {
      return function () {
        if (externalWatchRef.current) {
          clearInterval(externalWatchRef.current);
          externalWatchRef.current = null;
        }
        externalWindowRef.current = null;
      };
    }, []);

    React.useEffect(function () {
      setExternalTabOpen(false);
      if (externalWatchRef.current) {
        clearInterval(externalWatchRef.current);
        externalWatchRef.current = null;
      }
      externalWindowRef.current = null;
    }, [panel && panel.url]);

    function getPanelOrigin() {
      if (!panelUrl) return null;
      return panelUrl.origin;
    }

    function postToIframe(message) {
      var frame = iframeRef.current;
      if (!frame || !frame.contentWindow) return;
      var origin = getPanelOrigin();
      frame.contentWindow.postMessage(message, origin || "*");
    }

    function handleIframeLoad() {
      setNeedsStorageAccess(false);
      postToIframe({ type: "CHECK_STORAGE_ACCESS" });
    }

    function requestStorageAccess() {
      postToIframe({ type: "REQUEST_STORAGE_ACCESS" });
    }

    function cleanupExternalWatch() {
      if (externalWatchRef.current) {
        clearInterval(externalWatchRef.current);
        externalWatchRef.current = null;
      }
      externalWindowRef.current = null;
    }

    function launchExternalTab() {
      if (!panelUrl) return;
      if (externalWindowRef.current && !externalWindowRef.current.closed) {
        try { externalWindowRef.current.close(); }
        catch (err) {}
      }
      cleanupExternalWatch();
      var child = window.open(panelUrl.href, "_blank");
      if (!child) {
        window.alert("Pop-up was blocked. Allow pop-ups for this dashboard and try again.");
        return;
      }
      setExternalTabOpen(true);
      externalWindowRef.current = child;
      if (externalWatchRef.current) {
        clearInterval(externalWatchRef.current);
      }
      externalWatchRef.current = setInterval(function () {
        var win = externalWindowRef.current;
        if (!win || win.closed) {
          cleanupExternalWatch();
          setExternalTabOpen(false);
          try { window.focus(); } catch (err) {}
        }
      }, 700);
    }

    if (!panel) return null;

    if (isInsecureCrossOrigin) {
      return React.createElement("div", { className: panelClassName },
        React.createElement("div", { className: "title" }, panelTitle),
        React.createElement("div", { className: "panelNotice" },
          React.createElement("button", {
            type: "button",
            className: "panelNoticePrimary",
            onClick: launchExternalTab
          }, externalTabOpen ? "Re-open Bullbat" : "Log in to Bullbat")
        )
      );
    }

    return React.createElement("div", { className: panelClassName },
      React.createElement("div", { className: "title" }, panelTitle),
      needsStorageAccess && React.createElement("div", { className: "storageAccessPrompt" },
        React.createElement("p", null, "We need permission to use cookies from ", React.createElement("strong", null, panel && panel.label || panel && panel.title || "this panel"), " to finish signing you in."),
        React.createElement("button", { onClick: requestStorageAccess }, "Allow cookie access")
      ),
      React.createElement("iframe", {
        key: key,
        title: panel.title || panel.label || panel.id,
        src: panel.url,
        allow: "fullscreen; clipboard-write; accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; storage-access",
        referrerPolicy: "no-referrer-when-downgrade",
        sandbox: "allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-storage-access-by-user-activation",
        ref: iframeRef,
        onLoad: handleIframeLoad
      })
    );
  }

  function App(props) {
    var title = props.title || "OSL1";
    var bullbat = props.bullbat || null;
    var rightPanels = props.rightPanels || [];
    var autoRotateRight = !!props.autoRotateRight;
    var rotateSeconds = props.rotateSeconds || 20;

    var _React$useState2 = React.useState(0),
        rightIndex = _React$useState2[0],
        setRightIndex = _React$useState2[1];

    var _React$useState3 = React.useState(autoRotateRight),
        rotateRight = _React$useState3[0],
        setRotateRight = _React$useState3[1];

    useInterval(function () {
      if (!rotateRight || rightPanels.length <= 1) return;
      setRightIndex(function (i) { return (i + 1) % rightPanels.length; });
    }, rotateRight ? rotateSeconds * 1000 : null);

    function pickRight(idx) { setRightIndex(idx); }

    return React.createElement(React.Fragment, null,
      React.createElement("div", { className: "header" },
        React.createElement("h1", null, title),
        React.createElement("div", { className: "controls" },
          React.createElement("span", null, "Right column:"),
          React.createElement("button", { onClick: function () { return setRotateRight(function (v) { return !v; }); } }, rotateRight ? "Pause" : "Auto-rotate"),
          React.createElement("span", { style: { color: "#9aa6b2", fontSize: 12 } }, "(Bullbat is always visible on the left)")
        )
      ),
      React.createElement("div", { className: "layout" },
        React.createElement(Panel, { panel: Object.assign({ title: "Bullbat" }, bullbat) }),
        React.createElement("div", { className: "rightColumn" },
          React.createElement("div", { id: "rightSwitcher" },
            rightPanels.map(function (p, i) {
              return React.createElement("button", {
                key: p.id || i,
                className: i === rightIndex ? "active" : "",
                onClick: function () { setRotateRight(false); pickRight(i); }
              }, p.label || p.title || ("Panel " + (i + 1)));
            })
          ),
          React.createElement(Panel, { panel: rightPanels[rightIndex] })
        )
      ),
      React.createElement("div", { className: "footer" }, "Tips: Use a signed-in browser profile for Google/Bullbat; set refreshMinutes per panel in config.js")
    );
  }

  window.App = App;
})();
