import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { APP_VERSION, VERSION_LABEL } from "@/lib/version";
import appCss from "../styles.css?url";
import twCss from "../styles.css?inline";

const APP_NAME = `TechWorks ${VERSION_LABEL}`;

/** Same host guard the injector uses for og:image — no loopback, no Vercel system hosts. */
function publicShareHost(): string {
  const raw = String(
    typeof process !== "undefined" ? process.env?.VITE_PUBLIC_HOSTNAME ?? "" : "",
  )
    .split(",")[0]
    .trim()
    .split(":")[0]
    .toLowerCase();
  if (!raw || !/^[a-z0-9.-]+$/.test(raw) || !raw.includes(".")) return "";
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(raw)) return "";
  if (raw === "vercel.app" || raw.endsWith(".vercel.app") || raw === "vercel.com" || raw.endsWith(".vercel.com")) {
    return "";
  }
  return raw;
}

export const Route = createRootRoute({
  head: () => {
    const host = publicShareHost();
    const xBanner = host ? `https://${host}/x-banner.jpg` : "";
    return {
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content" },
      { title: APP_NAME },
      { name: "theme-color", content: "#06122B" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      {
        name: "description",
        content: "TechWorks classroom economy — projector, week wall, and desk tap pad.",
      },
      ...(xBanner ? [{ property: "x:game:image", content: xBanner }] : []),
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: `/tw.css?v=${APP_VERSION}` },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap",
      },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/mark-180.png" },
    ],
  };
  },
  component: () => (
    <html lang="en" suppressHydrationWarning data-theme="solvay" data-kind="dark" data-layout="web" style={{ background: "#06122B", color: "#F7F9FF" }}>
      <head>
        <HeadContent />
        <style id="tw-css" dangerouslySetInnerHTML={{ __html: twCss }} />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(window.parent&&window.parent!==window){window.parent.postMessage({channel:"grok-preview-bridge",version:1,type:"ready",path:location.pathname||"/"},"*");}}catch(e){}try{var t=localStorage.getItem("techworks-theme-v4")||localStorage.getItem("techworks-theme-v3");if(t)document.documentElement.setAttribute("data-theme",t);else document.documentElement.setAttribute("data-theme","solvay");var light={daylight:1,snowday:1,manila:1,peach:1,lemon:1,seafoam:1,lilac:1,rosewater:1,sky:1,linen:1,honey:1,polar:1,projector:1,mintice:1,cottonday:1,wrapping:1,frostday:1,valentine:1,pumpkin:1,cloverday:1,patriotday:1};var th=document.documentElement.getAttribute("data-theme");document.documentElement.setAttribute("data-kind",light[th]?"light":"dark");var q=location.search;var hold="";try{hold=sessionStorage.getItem("techworks-layout-hold")||""}catch(e){}var ua=navigator.userAgent||"";var phoneUa=/Android.+Mobile|iPhone|iPod|webOS|IEMobile/i.test(ua);var sw=Math.min(screen.width||9999,screen.height||9999);var phone=phoneUa||sw<=520;var coarse=window.matchMedia&&window.matchMedia("(pointer:coarse)").matches;var w=(window.visualViewport&&window.visualViewport.width)||window.innerWidth||900;var auto=phone||w<=900||(coarse&&w<=1180)?"mobile":"web";var layout="web";if(/[?&]layout=mobile/.test(q)||/[?&]portal=1/.test(q))layout="mobile";else if(/[?&]layout=web/.test(q))layout="web";else if(phone)layout="mobile";else if(hold==="web"||hold==="mobile")layout=hold;else layout=auto;document.documentElement.setAttribute("data-layout",layout);}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <PreviewHostBridge />
        <Outlet />
        <Scripts />
      </body>
    </html>
  ),
});
