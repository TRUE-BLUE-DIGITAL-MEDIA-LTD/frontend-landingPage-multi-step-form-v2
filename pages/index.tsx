import { CreateEmailService, ValidateEmail } from "@/services/email";
import {
  GetLandingPageService,
  ResponseGetLandingPageService,
} from "@/services/landingPage";
import { DirectLinkService } from "@/services/merchant";
import { PrismaClient } from "@prisma/client";
import * as crypto from "crypto";
import { JSDOM } from "jsdom";
import { GetServerSideProps } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { event, GoogleAnalytics } from "nextjs-google-analytics";
import { useEffect, useRef } from "react";
import requestIp from "request-ip";
import Swal from "sweetalert2";
import { Language } from "../interfaces";
import { initLanderTracking, LanderTracker } from "@/services/tracking";
import { isMainTarget } from "@/services/main-target";

function Index({
  landingPage,
  errorMessage,
  country,
  updatedHTML,
  finalLanguage,
  trackSessionId,
}: {
  landingPage: ResponseGetLandingPageService;
  errorMessage?: string;
  country: string;
  updatedHTML: string;
  finalLanguage: Language;
  trackSessionId: string | null;
}) {
  const router = useRouter();
  const mainLink = landingPage?.mainButton;

  const preventDefaultForSubmitButtons = () => {
    const submitButtons = document.querySelectorAll('button[type="submit"]');

    const emailInput: HTMLInputElement = document.querySelector(
      'input[type="email"][name="email"]',
    );

    const buttons = document.querySelectorAll("button");
    const multipleFormButtons = Array.from(buttons).filter((button) =>
      Array.from(button.classList).some((className) =>
        className.includes("form"),
      ),
    );
    if (multipleFormButtons.length > 0) {
      multipleFormButtons.forEach((button) => {
        const classId = button.classList;
        const text = button.textContent;
        button.addEventListener("click", function (e) {
          event(classId[0], {
            category: "multiple-form-step",
            label: text,
          });
          const formSteps = document.getElementsByClassName("form_step");
          const ownStep = button.closest(".form_step");
          trackerRef.current?.trackStep(ownStep?.id || classId[0], text);
          // Runtime redirects to the offer on the last form_step's button — the conversion.
          if (formSteps.length > 0 && ownStep === formSteps[formSteps.length - 1]) {
            let url: string | undefined;
            try { url = (JSON.parse(button.getAttribute("value") ?? "{}") as { url?: string }).url; } catch { /* value attr is runtime-owned; absence is fine */ }
            trackerRef.current?.trackClick(url || mainLink);
          }
          e.preventDefault();
        });
      });
    }

    const anchorTags = document.querySelectorAll("a");
    anchorTags.forEach((button) => {
      let href = button.href;

      if (href === window.location.href) {
        href = mainLink;
      }
      button.addEventListener("click", function (e) {
        event("click", {
          category: "button-click",
          label: href,
        });
        if (isMainTarget(href, mainLink)) {
          trackerRef.current?.trackClick(href);
        } else {
          trackerRef.current?.trackLink(href);
        }
        router.push(href);
        e.preventDefault();
      });
    });

    submitButtons.forEach((button: HTMLButtonElement) => {
      button.addEventListener("click", async function (e) {
        e.preventDefault();
        // preventDefault() cancels the native submission, which is the only
        // point the browser runs constraint validation — so re-run it here or
        // required checkboxes/selects are silently skipped.
        const form = button.closest("form");
        if (form && !form.reportValidity()) {
          return;
        }
        if (emailInput) {
          emailInput.reportValidity();
          if (emailInput.value) {
            button.textContent = "Loading..";
            const validate = await ValidateEmail({
              email: emailInput.value,
            }).catch(async (error) => {
              const email = emailInput.value;
              await handleSumitEmail({ email });
            });
            if (validate === true) {
              const email = emailInput.value;
              await handleSumitEmail({ email });
            } else if (validate === false) {
              emailInput.focus();
              button.textContent = "Please Enter Valid Email";
            }
          }
        } else {
          await handleSumitEmail({});
        }
      });
    });
  };

  useEffect(() => {
    preventDefaultForSubmitButtons();
  }, []);

  const trackerRef = useRef<LanderTracker | null>(null);
  useEffect(() => {
    if (!trackSessionId || !landingPage?.id) return;
    const tracker = initLanderTracking({ sessionId: trackSessionId });
    trackerRef.current = tracker;
    return () => {
      tracker.destroy();
      trackerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Quiz runtime contract — see clients/dashboard/public/unlayer-custom/
    // script-quiz.ts. "oxy-quiz:complete" is cancelable: preventDefault()
    // claims it, otherwise the runtime falls back to its own redirect.
    const onQuizStep = (e: Event) => {
      const d = (e as CustomEvent).detail as
        | { stepId?: string; value?: string; label?: string }
        | undefined;
      event(d?.stepId ?? "quiz_step", {
        category: "quiz-step",
        label: d?.label ?? d?.value ?? "",
      });
      trackerRef.current?.trackStep(d?.stepId ?? "quiz_step", d?.label ?? d?.value ?? null);
    };
    const onQuizComplete = (e: Event) => {
      e.preventDefault();
      const d = (e as CustomEvent).detail as
        | { answers?: Record<string, string>; email?: string; redirectUrl?: string; appendAnswers?: boolean }
        | undefined;
      void handleQuizComplete(d ?? {});
    };
    document.addEventListener("oxy-quiz:step", onQuizStep);
    document.addEventListener("oxy-quiz:complete", onQuizComplete);
    return () => {
      document.removeEventListener("oxy-quiz:step", onQuizStep);
      document.removeEventListener("oxy-quiz:complete", onQuizComplete);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = finalLanguage;
    }
  }, [finalLanguage]);

  const handleSumitEmail = async ({
    email,
  }: {
    email?: string | undefined;
  }) => {
    try {
      event("click", {
        category: "button-click",
        label: mainLink,
      });
      trackerRef.current?.trackClick(mainLink);
      Swal.fire({
        title: "Thanks For Joining us",
        html: "Loading....",
        allowEscapeKey: false,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      if (landingPage.directLink) {
        const [directLink, collectEmail] = await Promise.allSettled([
          DirectLinkService({
            email: email,
            url: landingPage.directLink,
          }),
          CreateEmailService({
            email: email,
            landingPageId: landingPage?.id,
          }),
        ]);
        Swal.fire({
          title: "Success",
          text: "You have been successfully registered",
          icon: "success",
        });

        if (directLink.status === "rejected") {
          window.open(mainLink, "_self");
        } else if (directLink.value.status === "success") {
          router.push(directLink.value.location);
        }
        return;
      } else {
        if (email) {
          await CreateEmailService({
            email: email,
            landingPageId: landingPage?.id,
          });
          const encode_email = btoa(email);
          const url = new URL(mainLink);
          url.searchParams.set("sub3", encode_email);
          const newLink = url.toString();
          window.open(newLink, "_self");
        } else {
          window.open(mainLink, "_self");
        }
      }
    } catch (err) {
      (window.open(mainLink), "_self");
    }
  };
  const appendQuizParams = (
    url: string,
    answers?: Record<string, string>,
    email?: string,
    appendAnswers = true,
  ) => {
    try {
      const u = new URL(url);
      if (appendAnswers) {
        Object.entries(answers ?? {}).forEach(([key, value]) =>
          u.searchParams.set(key, value),
        );
      }
      if (email) u.searchParams.set("sub3", btoa(email));
      return u.toString();
    } catch {
      return url;
    }
  };

  const handleQuizComplete = async ({
    answers,
    email,
    redirectUrl,
    appendAnswers,
  }: {
    answers?: Record<string, string>;
    email?: string;
    redirectUrl?: string;
    appendAnswers?: boolean;
  }) => {
    const base = redirectUrl && redirectUrl !== "" ? redirectUrl : mainLink;
    try {
      event("click", { category: "quiz-complete", label: base });
      trackerRef.current?.trackClick(base);
      Swal.fire({
        title: "Finding your matches",
        html: "Loading....",
        allowEscapeKey: false,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      if (email) {
        await CreateEmailService({
          email,
          landingPageId: landingPage?.id,
        }).catch(() => undefined);
      }
      if (landingPage.directLink) {
        const direct = await DirectLinkService({
          email,
          url: landingPage.directLink,
        }).catch(() => null);
        if (direct?.status === "success") {
          router.push(direct.location);
          return;
        }
      }
      window.open(appendQuizParams(base, answers, email, appendAnswers !== false), "_self");
    } catch (err) {
      window.open(base, "_self");
    }
  };

  if (errorMessage) {
    return (
      <div className="w-screen h-screen bg-black font-Anuphan">
        <div className="flex p-10 justify-center text-center  text-white items-center w-full h-full">
          <h1 className="text-base lg:text-3xl font-bold">{errorMessage}</h1>
        </div>
      </div>
    );
  }

  if (country === "Thailand") {
    return (
      <div
        className="w-screen h-screen bg-black font-semibold text-center
        font-Poppins text-white flex justify-center items-center text-lg md:text-2xl"
      >
        Our service is not available in your country.
      </div>
    );
  }
  if (!landingPage.id) {
    return (
      <>
        <Head>
          {/* facebook sharing link */}
          <meta property="og:title" content={landingPage.domain.name} />
          <meta
            property="og:site_name"
            content={landingPage.domain.name.split(".")[0]}
          />
          <meta property="og:type" content="website" />
          <meta
            property="og:url"
            content={`https://${landingPage.domain.name}`}
          />
          <meta
            name="viewport"
            content="initial-scale=1.0, width=device-width"
          />
        </Head>
        <div className="w-screen h-screen bg-black font-Anuphan">
          <div className="flex p-10 justify-center text-center  text-white items-center w-full h-full">
            <h1 className="text-base lg:text-3xl font-bold">
              This domain {landingPage.domain.name} has no landing page
            </h1>
          </div>
        </div>
      </>
    );
  }

  const primaryLang = (landingPage.primaryLanguage ??
    landingPage.language) as Language;
  const t =
    landingPage.translations?.[finalLanguage] ??
    landingPage.translations?.[primaryLang];
  const pageTitle = t?.title || landingPage.title;
  const pageDescription = t?.description || landingPage.description;

  return (
    <>
      {landingPage.domain.googleAnalyticsId && (
        <GoogleAnalytics
          trackPageViews
          nonce={crypto.randomBytes(16).toString("base64")}
          gaMeasurementId={landingPage.domain.googleAnalyticsId}
        />
      )}

      <Head>
        <meta name="description" content={pageDescription} />
        {/* facebook sharing link */}
        <meta property="og:title" content={pageTitle} />
        <meta
          property="og:site_name"
          content={landingPage.domain.name.split(".")[0]}
        />
        <meta property="og:type" content="website" />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={landingPage.backgroundImage} />
        <meta
          property="og:url"
          content={`https://${landingPage.domain.name}`}
        />

        {/* tweeter sharing link */}
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:type" content="website" />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={landingPage.backgroundImage} />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <link rel="shortcut icon" href={landingPage.icon} />
        <title>{pageTitle}</title>
      </Head>
      <main dangerouslySetInnerHTML={{ __html: `${updatedHTML}` }} />
    </>
  );
}
const prisma = new PrismaClient();

export default Index;
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  let host = ctx.req.headers.host;
  let country = "United States";
  try {
    const userIP = requestIp.getClientIp(ctx.req);
    const countryResponse = await fetch(`http://ip-api.com/json/${userIP}`);
    const response = await countryResponse?.json();
    if (response?.country) {
      country = response?.country;
    }
  } catch (error) {
    console.log("error", error);
  }

  if (process.env.NEXT_PUBLIC_NODE_ENV === "development") {
    host = "localhost:8181";
  } else {
    host = ctx.req.headers.host;
  }
  const acceptLanguage = ctx.req.headers["accept-language"];
  // Initial language guess from Accept-Language; refined below once we know
  // which languages the matched lander actually supports.
  const initialGuess = ((acceptLanguage ?? "en")
    .split(",")[0]
    ?.split(";")[0]
    ?.split("-")[0]
    ?.toLowerCase() || "en") as Language;

  try {
    const landingPage = await GetLandingPageService({
      domain: host,
      language: initialGuess,
      prisma,
    });

    const { pickLanguage } = await import("../server/render/pick-language");
    const supported = (
      landingPage.supportedLanguages?.length
        ? landingPage.supportedLanguages
        : [landingPage.language]
    ) as Language[];
    const primary = (landingPage.primaryLanguage ??
      landingPage.language) as Language;
    const finalLanguage = pickLanguage(acceptLanguage, supported, primary);

    const { resolveVisitor, buildVisitorCookie, VISITOR_COOKIE } = await import(
      "../server/analytics/visitor-cookie"
    );
    const visitor = resolveVisitor(ctx.req.cookies?.[VISITOR_COOKIE]);
    if (!visitor.isReturning) {
      try {
        ctx.res.setHeader(
          "Set-Cookie",
          buildVisitorCookie(
            visitor.visitorId,
            process.env.NEXT_PUBLIC_NODE_ENV !== "development",
          ),
        );
      } catch {
        /* cookie failure must not break the lander */
      }
    }

    const { recordLanderView } = await import(
      "../server/analytics/record-view"
    );
    const trackSessionId =
      landingPage?.id && country !== "Thailand"
        ? await recordLanderView({
            prisma,
            landingPageId: landingPage.id,
            domainId: landingPage.domain?.id ?? null,
            country,
            userAgent: ctx.req.headers["user-agent"],
            referrer: ctx.req.headers.referer,
            query: ctx.query,
            visitorId: visitor.visitorId,
            isReturning: visitor.isReturning,
          })
        : null;

    const dom = new JSDOM(landingPage.html);

    const { stripParityScripts } = await import(
      "../server/render/strip-parity-scripts"
    );
    stripParityScripts(dom.window.document, host);

    // NEW: i18n substitution
    const { applyI18nSubstitution } =
      await import("../server/render/substitute-i18n");
    applyI18nSubstitution(
      dom.window.document,
      landingPage.translations ?? null,
      finalLanguage,
      primary,
    );

    // Serialize ONCE at the end
    const updatedHTML: string = dom.serialize();

    return {
      props: {
        updatedHTML: updatedHTML ?? null,
        landingPage: landingPage ?? null,
        country,
        finalLanguage,
        trackSessionId: trackSessionId ?? null,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      props: {
        errorMessage: error.message,
      },
    };
  }
};
