"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Bell01, Key01, Monitor01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { LandingNav } from "@/components/marketing/landing-nav";
import { Grid } from "@/components/shared-assets/background-patterns/grid";
import { useRouter } from "@/i18n/navigation";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const features = [
    { icon: Key01, titleKey: "featureAuthTitle", descriptionKey: "featureAuthDescription" },
    { icon: Monitor01, titleKey: "featureDevicesTitle", descriptionKey: "featureDevicesDescription" },
    { icon: Bell01, titleKey: "featureNotificationsTitle", descriptionKey: "featureNotificationsDescription" },
] as const;

export function LandingPage() {
    const t = useTranslations("home");
    const tApp = useTranslations("app");
    const router = useRouter();
    const rootRef = useRef<HTMLDivElement>(null);

    useGSAP(
        () => {
            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

            if (reduced) {
                gsap.set("[data-animate]", { clearProps: "all", opacity: 1, y: 0 });
                gsap.set("[data-hero-grid]", { opacity: 0.35, scale: 1.25 });
                return;
            }

            gsap.set("[data-animate]", { opacity: 0, y: 28 });

            const hero = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.85 } });
            hero.to("[data-animate='nav']", { opacity: 1, y: 0, duration: 0.6 })
                .to("[data-animate='hero-brand']", { opacity: 1, y: 0 }, "-=0.25")
                .to("[data-animate='hero-title']", { opacity: 1, y: 0 }, "-=0.55")
                .to("[data-animate='hero-subtitle']", { opacity: 1, y: 0 }, "-=0.55")
                .to("[data-animate='hero-cta']", { opacity: 1, y: 0 }, "-=0.5");

            gsap.fromTo(
                "[data-hero-grid]",
                { opacity: 0, scale: 1.06 },
                { opacity: 0.35, scale: 1.25, duration: 1.4, ease: "power2.out", delay: 0.1 },
            );

            gsap.timeline({
                defaults: { ease: "power3.out", duration: 0.75 },
                scrollTrigger: {
                    trigger: "[data-section='features']",
                    start: "top 78%",
                    once: true,
                },
            })
                .to("[data-animate='features-intro']", { opacity: 1, y: 0, stagger: 0.1 })
                .to("[data-animate='feature-item']", { opacity: 1, y: 0, stagger: 0.12 }, "-=0.35");

            gsap.to("[data-animate='final-cta']", {
                opacity: 1,
                y: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: "[data-section='final-cta']",
                    start: "top 80%",
                    once: true,
                },
            });
        },
        { scope: rootRef },
    );

    return (
        <div ref={rootRef} className="min-h-dvh bg-primary text-primary">
            <div data-animate="nav">
                <LandingNav />
            </div>

            <section className="relative isolate min-h-[calc(100dvh-4rem)] overflow-hidden">
                <div
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,color-mix(in_oklab,var(--color-bg-brand-primary)_55%,transparent),transparent_55%),radial-gradient(ellipse_at_90%_20%,color-mix(in_oklab,var(--color-bg-secondary)_90%,transparent),transparent_50%),linear-gradient(180deg,var(--color-bg-secondary),var(--color-bg-primary)_72%)]"
                    aria-hidden
                />
                <div
                    data-hero-grid
                    className="pointer-events-none absolute inset-0 text-fg-quaternary opacity-0"
                    aria-hidden
                    suppressHydrationWarning
                >
                    <Grid size="md" className="h-full w-full" />
                </div>

                <div className="relative mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-6xl flex-col justify-center px-4 py-16 sm:px-6 sm:py-20">
                    <p
                        data-animate="hero-brand"
                        className="text-display-sm font-semibold tracking-tight text-primary opacity-0 sm:text-display-md"
                    >
                        {tApp("name")}
                    </p>
                    <h1
                        data-animate="hero-title"
                        className="mt-4 max-w-3xl text-display-md font-semibold tracking-tight text-primary opacity-0 sm:text-display-lg"
                    >
                        {t("heroTitle")}
                    </h1>
                    <p
                        data-animate="hero-subtitle"
                        className="mt-5 max-w-xl text-lg text-tertiary opacity-0 sm:text-xl"
                    >
                        {t("heroSubtitle")}
                    </p>
                    <div data-animate="hero-cta" className="mt-10 flex flex-wrap items-center gap-3 opacity-0">
                        <Button size="xl" onPress={() => router.push("/register")}>
                            {t("ctaPrimary")}
                        </Button>
                        <Button color="secondary" size="xl" onPress={() => router.push("/login")}>
                            {t("ctaSecondary")}
                        </Button>
                    </div>
                </div>
            </section>

            <section data-section="features" className="border-t border-secondary bg-secondary">
                <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
                    <p
                        data-animate="features-intro"
                        className="text-sm font-semibold tracking-wide text-brand-tertiary uppercase opacity-0"
                    >
                        {t("featuresEyebrow")}
                    </p>
                    <h2
                        data-animate="features-intro"
                        className="mt-3 max-w-2xl text-display-xs font-semibold text-primary opacity-0 sm:text-display-sm"
                    >
                        {t("featuresTitle")}
                    </h2>
                    <p
                        data-animate="features-intro"
                        className="mt-4 max-w-2xl text-md text-tertiary opacity-0 sm:text-lg"
                    >
                        {t("featuresSubtitle")}
                    </p>

                    <ul className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
                        {features.map(({ icon: Icon, titleKey, descriptionKey }) => (
                            <li key={titleKey} data-animate="feature-item" className="opacity-0">
                                <Icon className="size-6 text-fg-brand-primary" />
                                <h3 className="mt-4 text-lg font-semibold text-primary">{t(titleKey)}</h3>
                                <p className="mt-2 text-md text-tertiary">{t(descriptionKey)}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            <section data-section="final-cta" className="border-t border-secondary bg-primary">
                <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-4 py-20 sm:px-6 sm:py-24">
                    <h2
                        data-animate="final-cta"
                        className="max-w-2xl text-display-xs font-semibold text-primary opacity-0 sm:text-display-sm"
                    >
                        {t("finalCtaTitle")}
                    </h2>
                    <p data-animate="final-cta" className="max-w-xl text-md text-tertiary opacity-0 sm:text-lg">
                        {t("finalCtaSubtitle")}
                    </p>
                    <div data-animate="final-cta" className="flex flex-wrap items-center gap-3 opacity-0">
                        <Button size="xl" onPress={() => router.push("/register")}>
                            {t("ctaPrimary")}
                        </Button>
                        <Button color="secondary" size="xl" onPress={() => router.push("/login")}>
                            {t("ctaSecondary")}
                        </Button>
                    </div>
                </div>
            </section>

            <footer className="border-t border-secondary bg-secondary">
                <div className="mx-auto flex w-full max-w-6xl items-center px-4 py-8 sm:px-6">
                    <p className="text-sm font-semibold text-tertiary">{t("footerBrand")}</p>
                </div>
            </footer>
        </div>
    );
}
