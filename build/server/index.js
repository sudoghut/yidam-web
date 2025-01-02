import { jsx, jsxs } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@remix-run/node";
import { RemixServer, Outlet, Meta, Links, ScrollRestoration, Scripts, useSearchParams } from "@remix-run/react";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { useState, useRef, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
const ABORT_DELAY = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, remixContext, loadContext) {
  return isbot(request.headers.get("user-agent") || "") ? handleBotRequest(
    request,
    responseStatusCode,
    responseHeaders,
    remixContext
  ) : handleBrowserRequest(
    request,
    responseStatusCode,
    responseHeaders,
    remixContext
  );
}
function handleBotRequest(request, responseStatusCode, responseHeaders, remixContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(
        RemixServer,
        {
          context: remixContext,
          url: request.url,
          abortDelay: ABORT_DELAY
        }
      ),
      {
        onAllReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
function handleBrowserRequest(request, responseStatusCode, responseHeaders, remixContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(
        RemixServer,
        {
          context: remixContext,
          url: request.url,
          abortDelay: ABORT_DELAY
        }
      ),
      {
        onShellReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest
}, Symbol.toStringTag, { value: "Module" }));
const links = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous"
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
  }
];
function Layout({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsxs("head", { children: [
      /* @__PURE__ */ jsx("meta", { charSet: "utf-8" }),
      /* @__PURE__ */ jsx("meta", { name: "viewport", content: "width=device-width, initial-scale=1" }),
      /* @__PURE__ */ jsx(Meta, {}),
      /* @__PURE__ */ jsx(Links, {})
    ] }),
    /* @__PURE__ */ jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsx(ScrollRestoration, {}),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
function App() {
  return /* @__PURE__ */ jsx(Outlet, {});
}
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Layout,
  default: App,
  links
}, Symbol.toStringTag, { value: "Module" }));
function Index() {
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showChat, setShowChat] = useState(false);
  const chatRef = useRef(null);
  const wsRef = useRef(null);
  const isChat = searchParams.get("interface") === "chat";
  const ip = searchParams.get("ip");
  useEffect(() => {
    if (isChat) {
      setShowChat(true);
    }
    if (ip) {
      wsRef.current = new WebSocket(`ws://${ip}:3000/ws`);
      wsRef.current.onopen = () => {
        console.log("WebSocket connected");
      };
      wsRef.current.onmessage = (event) => {
        const data = event.data;
        if (data === "[START]") {
          setMessages((prev) => [...prev, { sender: "LLM", content: "" }]);
        } else if (data === "[END]") ;
        else {
          setMessages((prev) => {
            if (prev.length === 0) return prev;
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].content += data;
            return newMessages;
          });
        }
      };
      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
      wsRef.current.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
      };
    }
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [ip, isChat]);
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);
  const sendMessage = () => {
    var _a;
    if (input) {
      setMessages((prev) => [...prev, { sender: "You", content: input }]);
      (_a = wsRef.current) == null ? void 0 : _a.send(input);
      setInput("");
    }
  };
  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      sendMessage();
    }
  };
  const PORT = 3e3;
  return /* @__PURE__ */ jsxs("div", { className: "font-sans max-w-3xl mx-auto p-5", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold mb-4 text-center", children: "Yidam Chat" }),
    !showChat && /* @__PURE__ */ jsxs("div", { className: "text-center mb-5", children: [
      /* @__PURE__ */ jsx(
        QRCodeSVG,
        {
          value: `http://${ip}:${PORT}/if?ip=${ip}&interface=chat`,
          size: 256,
          className: "mx-auto mb-4"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setShowChat(true),
          className: "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded",
          children: "Simulate QR Code Scan"
        }
      )
    ] }),
    showChat && /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-[500px]", children: [
      /* @__PURE__ */ jsx("div", { ref: chatRef, className: "flex-grow overflow-y-auto border border-gray-300 p-3 mb-3", children: messages.map((message, index) => /* @__PURE__ */ jsxs("div", { className: "mb-2", children: [
        /* @__PURE__ */ jsxs("span", { className: "font-bold", children: [
          message.sender,
          ":"
        ] }),
        " ",
        message.content
      ] }, index)) }),
      /* @__PURE__ */ jsxs("div", { className: "flex", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: input,
            onChange: (e) => setInput(e.target.value),
            onKeyPress: handleKeyPress,
            placeholder: "Type your message...",
            className: "flex-grow border border-gray-300 p-2 mr-2"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: sendMessage,
            className: "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded",
            children: "Send"
          }
        )
      ] })
    ] })
  ] });
}
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Index
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-C_Vwcmig.js", "imports": ["/assets/index-CvkX--nN.js", "/assets/components-D3MmqGE2.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/root-gOgSmKS8.js", "imports": ["/assets/index-CvkX--nN.js", "/assets/components-D3MmqGE2.js"], "css": ["/assets/root-CqNqN3gH.css"] }, "routes/_index": { "id": "routes/_index", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/_index-CMOFHiqK.js", "imports": ["/assets/index-CvkX--nN.js"], "css": [] } }, "url": "/assets/manifest-b214d6c4.js", "version": "b214d6c4" };
const mode = "production";
const assetsBuildDirectory = "build\\client";
const basename = "/";
const future = { "v3_fetcherPersist": true, "v3_relativeSplatPath": true, "v3_throwAbortReason": true, "v3_routeConfig": false, "v3_singleFetch": true, "v3_lazyRouteDiscovery": true, "unstable_optimizeDeps": false };
const isSpaMode = false;
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/_index": {
    id: "routes/_index",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route1
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  mode,
  publicPath,
  routes
};
