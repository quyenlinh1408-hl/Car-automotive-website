import React, { useLayoutEffect, useRef } from 'https://esm.sh/react@18.2.0';
import { createRoot } from 'https://esm.sh/react-dom@18.2.0/client';
import { gsap } from 'https://esm.sh/gsap@3.12.5';
import { MotionPathPlugin } from 'https://esm.sh/gsap@3.12.5/MotionPathPlugin';
import { ScrollTrigger } from 'https://esm.sh/gsap@3.12.5/ScrollTrigger';

gsap.registerPlugin(MotionPathPlugin, ScrollTrigger);

function ScrollJourney() {
    const sectionRef = useRef(null);
    const pathRef = useRef(null);
    const neonSoftRef = useRef(null);
    const neonCoreRef = useRef(null);
    const carRef = useRef(null);
    const loopCarRef = useRef(null);
    const glowRef = useRef(null);
    const burstOuterRef = useRef(null);
    const burstInnerRef = useRef(null);
    const textRef = useRef(null);
    const textPathRef = useRef(null);

    useLayoutEffect(() => {
        const section = sectionRef.current;
        const path = pathRef.current;
        const car = carRef.current;
        const loopCar = loopCarRef.current;
        const glow = glowRef.current;
        const neonSoft = neonSoftRef.current;
        const neonCore = neonCoreRef.current;
        const burstOuter = burstOuterRef.current;
        const burstInner = burstInnerRef.current;
        const textEl = textRef.current;
        const textPathEl = textPathRef.current;
        if (!section || !path || !car) return undefined;

        const BASE_SCROLL_VH = 130;
        const SMOOTH_ALPHA = 0.08;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const panel = document.getElementById('maintenanceFormPanel');
        let panelVisible = false;
        let burstPlayed = false;
        let loopPlaying = false;
        let loopTween = null;
        let targetProgress = 0;
        let smoothProgress = 0;

        const stopLoopCar = () => {
            if (!loopPlaying) return;
            loopPlaying = false;
            if (loopTween) {
                loopTween.kill();
                loopTween = null;
            }
            if (loopCar) {
                gsap.set(loopCar, { autoAlpha: 0 });
            }
            gsap.set(car, { autoAlpha: 1 });
        };

        const startLoopCar = () => {
            if (reduceMotion) return;
            if (!loopCar || loopPlaying) return;
            loopPlaying = true;
            gsap.set(car, { autoAlpha: 0 });
            gsap.set(loopCar, { autoAlpha: 1 });

            loopTween = gsap.timeline({ repeat: -1 });
            loopTween
                .to(loopCar, {
                    duration: 3.9,
                    ease: 'sine.inOut',
                    motionPath: {
                        path,
                        align: path,
                        alignOrigin: [0.5, 0.5],
                        autoRotate: true,
                        start: 0,
                        end: 0.29
                    }
                })
                .to(loopCar, {
                    duration: 2.4,
                    ease: 'none',
                    motionPath: {
                        path,
                        align: path,
                        alignOrigin: [0.5, 0.5],
                        autoRotate: true,
                        start: 0.29,
                        end: 0.55
                    }
                })
                .to(loopCar, {
                    duration: 4.3,
                    ease: 'sine.inOut',
                    motionPath: {
                        path,
                        align: path,
                        alignOrigin: [0.5, 0.5],
                        autoRotate: true,
                        start: 0.55,
                        end: 0.82
                    }
                })
                .to(loopCar, {
                    duration: 3.1,
                    ease: 'none',
                    motionPath: {
                        path,
                        align: path,
                        alignOrigin: [0.5, 0.5],
                        autoRotate: true,
                        start: 0.82,
                        end: 1
                    }
                });
        };

        const playEndpointBurst = () => {
            if (reduceMotion) return;
            if (!burstOuter || !burstInner || !glow) return;

            const burstTl = gsap.timeline();
            burstTl
                .set([burstOuter, burstInner], { opacity: 0.9, scale: 0.35 })
                .to(
                    burstOuter,
                    {
                        scale: 2.4,
                        opacity: 0,
                        duration: 0.55,
                        ease: 'power2.out'
                    },
                    0
                )
                .to(
                    burstInner,
                    {
                        scale: 1.65,
                        opacity: 0,
                        duration: 0.45,
                        ease: 'power2.out'
                    },
                    0.05
                )
                .to(
                    glow,
                    {
                        opacity: 1,
                        scale: 1.15,
                        duration: 0.3,
                        yoyo: true,
                        repeat: 1,
                        ease: 'power1.out'
                    },
                    0
                );
        };

        const setPanelVisibility = (visible) => {
            if (!panel || visible === panelVisible) return;
            panelVisible = visible;
            gsap.to(panel, {
                autoAlpha: visible ? 1 : 0,
                y: visible ? 0 : 20,
                duration: 0.45,
                ease: 'power2.out',
                overwrite: true,
                onStart: () => {
                    panel.style.pointerEvents = visible ? 'auto' : 'none';
                }
            });
        };

        if (panel) {
            gsap.set(panel, { autoAlpha: 0, y: 20, pointerEvents: 'none' });
        }

        const pathLength = path.getTotalLength();
        const drawLayers = [path, neonCore, neonSoft].filter(Boolean);
        drawLayers.forEach((layer) => {
            gsap.set(layer, {
                strokeDasharray: pathLength,
                strokeDashoffset: pathLength
            });
        });

        if (textEl) {
            gsap.set(textEl, { opacity: 0 });
        }
        if (textPathEl) {
            gsap.set(textPathEl, { attr: { startOffset: '12%' } });
        }
        if (burstOuter && burstInner) {
            gsap.set([burstOuter, burstInner], { opacity: 0, scale: 0.2 });
        }

        gsap.set(car, {
            motionPath: {
                path,
                align: path,
                alignOrigin: [0.5, 0.5],
                autoRotate: true,
                start: 0,
                end: 0
            }
        });

        if (loopCar) {
            gsap.set(loopCar, {
                autoAlpha: 0,
                motionPath: {
                    path,
                    align: path,
                    alignOrigin: [0.5, 0.5],
                    autoRotate: true,
                    start: 0,
                    end: 0
                }
            });
        }

        const renderByProgress = (progressValue) => {
            const progress = gsap.utils.clamp(0, 1, progressValue);
            const done = progress >= 0.985;

            drawLayers.forEach((layer) => {
                layer.style.strokeDashoffset = `${pathLength * (1 - progress)}`;
            });

            if (progress < 0.985) {
                gsap.set(car, { autoAlpha: 1 });
                if (loopCar) {
                    gsap.set(loopCar, { autoAlpha: 0 });
                }
            }

            gsap.set(car, {
                motionPath: {
                    path,
                    align: path,
                    alignOrigin: [0.5, 0.5],
                    autoRotate: true,
                    start: 0,
                    end: progress
                }
            });

            if (textEl) {
                const textReveal = gsap.utils.clamp(0, 1, progress / 0.33);
                textEl.style.opacity = String(textReveal);
            }

            if (textPathEl) {
                const offsetValue = 12 - progress * 10;
                textPathEl.setAttribute('startOffset', `${offsetValue.toFixed(2)}%`);
            }

            if (glow) {
                const glowOpacity = gsap.utils.clamp(0, 1, (progress - 0.76) / 0.2);
                const glowScale = 0.5 + glowOpacity * 0.5;
                gsap.set(glow, { opacity: glowOpacity, scale: glowScale });
            }

            if (done && !burstPlayed) {
                burstPlayed = true;
                playEndpointBurst();
            }
            if (!done && burstPlayed) {
                burstPlayed = false;
                if (burstOuter && burstInner) {
                    gsap.set([burstOuter, burstInner], { opacity: 0, scale: 0.2 });
                }
            }

            if (done && !loopPlaying) {
                startLoopCar();
            }

            if (!done && loopPlaying) {
                stopLoopCar();
            }

            setPanelVisibility(done);
        };

        const scrollDistancePx = window.innerHeight * (BASE_SCROLL_VH / 100);
        const trigger = ScrollTrigger.create({
            trigger: section,
            start: 'top top',
            end: `+=${scrollDistancePx}`,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
                targetProgress = self.progress;
            },
            onLeaveBack: () => {
                stopLoopCar();
                setPanelVisibility(false);
            }
        });

        const tick = () => {
            if (reduceMotion) {
                smoothProgress = targetProgress;
            } else {
                smoothProgress += (targetProgress - smoothProgress) * SMOOTH_ALPHA;
            }
            renderByProgress(smoothProgress);
        };

        gsap.ticker.add(tick);
        renderByProgress(0);

        return () => {
            stopLoopCar();
            gsap.ticker.remove(tick);
            trigger.kill();
        };
    }, []);

    return React.createElement(
        'section',
        {
            ref: sectionRef,
            className:
                'relative min-h-[130vh] overflow-hidden bg-[radial-gradient(circle_at_20%_20%,#2a0b0b_0%,#120a0a_35%,#0b0b0d_100%)] px-4 pb-0 pt-8 sm:px-6 lg:px-10'
        },
        React.createElement('div', {
            className:
                'pointer-events-none absolute -left-28 top-12 h-56 w-56 rounded-full bg-red-500/20 blur-3xl'
        }),
        React.createElement('div', {
            className:
                'pointer-events-none absolute -right-24 bottom-6 h-56 w-56 rounded-full bg-orange-400/20 blur-3xl'
        }),
        React.createElement(
            'div',
            { className: 'sticky top-12 mx-auto max-w-6xl py-0' },
            React.createElement(
                'div',
                { className: 'mb-8 text-center' },
                React.createElement(
                    'p',
                    {
                        className:
                            'inline-block rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-200'
                    },
                    'Journey Motion'
                ),
                React.createElement(
                    'h2',
                    {
                        className:
                            'mt-4 text-3xl font-semibold leading-tight text-white sm:text-4xl'
                    },
                    'Từ bán xe đến bảo dưỡng: một hành trình liền mạch'
                )
            ),
            React.createElement(
                'div',
                { className: 'relative mx-auto w-full max-w-5xl' },
                React.createElement(
                    'svg',
                    {
                        viewBox: '0 0 960 360',
                        role: 'img',
                        'aria-label': 'Duong hanh trinh hinh chu S',
                        className: 'h-auto w-full'
                    },
                    React.createElement(
                        'defs',
                        null,
                        React.createElement(
                            'linearGradient',
                            {
                                id: 'journeyGradient',
                                x1: '0%',
                                y1: '0%',
                                x2: '100%',
                                y2: '100%'
                            },
                            React.createElement('stop', { offset: '0%', stopColor: '#ef4444' }),
                            React.createElement('stop', { offset: '55%', stopColor: '#f97316' }),
                            React.createElement('stop', { offset: '100%', stopColor: '#fb923c' })
                        ),
                        React.createElement(
                            'filter',
                            { id: 'journeyGlow', x: '-30%', y: '-30%', width: '160%', height: '160%' },
                            React.createElement('feGaussianBlur', {
                                stdDeviation: '12',
                                result: 'blur'
                            }),
                            React.createElement('feMerge', null, [
                                React.createElement('feMergeNode', { in: 'blur', key: 'blur' }),
                                React.createElement('feMergeNode', { in: 'SourceGraphic', key: 'source' })
                            ])
                        )
                    ),
                    React.createElement('path', {
                        d: 'M90 54 C 760 48, 172 164, 690 196 C 840 210, 796 302, 528 306 C 284 310, 248 294, 330 268',
                        fill: 'none',
                        stroke: 'rgba(255,255,255,0.15)',
                        strokeWidth: '8',
                        strokeLinecap: 'round'
                    }),
                    React.createElement('path', {
                        ref: neonSoftRef,
                        d: 'M90 54 C 760 48, 172 164, 690 196 C 840 210, 796 302, 528 306 C 284 310, 248 294, 330 268',
                        fill: 'none',
                        stroke: 'url(#journeyGradient)',
                        strokeWidth: '18',
                        strokeLinecap: 'round',
                        opacity: '0.35',
                        filter: 'url(#journeyGlow)'
                    }),
                    React.createElement('path', {
                        ref: neonCoreRef,
                        d: 'M90 54 C 760 48, 172 164, 690 196 C 840 210, 796 302, 528 306 C 284 310, 248 294, 330 268',
                        fill: 'none',
                        stroke: 'url(#journeyGradient)',
                        strokeWidth: '11',
                        strokeLinecap: 'round',
                        opacity: '0.6',
                        filter: 'url(#journeyGlow)'
                    }),
                    React.createElement('path', {
                        id: 'journeySPath',
                        ref: pathRef,
                        d: 'M90 54 C 760 48, 172 164, 690 196 C 840 210, 796 302, 528 306 C 284 310, 248 294, 330 268',
                        fill: 'none',
                        stroke: 'url(#journeyGradient)',
                        strokeWidth: '8',
                        strokeLinecap: 'round',
                        filter: 'url(#journeyGlow)'
                    }),
                    React.createElement(
                        'text',
                        {
                            ref: textRef,
                            className: 'fill-orange-100 text-[18px] font-semibold tracking-wide'
                        },
                        React.createElement(
                            'textPath',
                            { ref: textPathRef, href: '#journeySPath', startOffset: '12%' },
                            'Mua xe là khởi đầu - Chăm sóc là trọn đời'
                        )
                    ),
                    React.createElement('circle', {
                        cx: '330',
                        cy: '268',
                        r: '11',
                        fill: '#fb923c'
                    }),
                    React.createElement('circle', {
                        ref: glowRef,
                        cx: '330',
                        cy: '268',
                        r: '18',
                        fill: 'rgba(251,146,60,0.35)',
                        style: { opacity: 0, transformOrigin: '330px 268px', scale: 0.5 }
                    }),
                    React.createElement('circle', {
                        ref: burstOuterRef,
                        cx: '330',
                        cy: '268',
                        r: '14',
                        fill: 'none',
                        stroke: '#fdba74',
                        strokeWidth: '4',
                        style: { opacity: 0, transformOrigin: '330px 268px', scale: 0.2 }
                    }),
                    React.createElement('circle', {
                        ref: burstInnerRef,
                        cx: '330',
                        cy: '268',
                        r: '9',
                        fill: 'none',
                        stroke: '#fb923c',
                        strokeWidth: '4',
                        style: { opacity: 0, transformOrigin: '330px 268px', scale: 0.2 }
                    })
                ),
                React.createElement(
                    'div',
                    {
                        ref: carRef,
                        className:
                            'pointer-events-none absolute left-0 top-0 grid h-12 w-12 place-items-center rounded-full border border-white/30 bg-zinc-900/90 text-xl shadow-[0_0_24px_rgba(249,115,22,0.5)]'
                    },
                    React.createElement('span', { role: 'img', 'aria-label': 'Car icon' }, '🚗')
                ),
                React.createElement(
                    'div',
                    {
                        ref: loopCarRef,
                        'aria-hidden': 'true',
                        className:
                            'pointer-events-none absolute left-0 top-0 grid h-12 w-12 place-items-center rounded-full border border-white/30 bg-zinc-900/90 text-xl shadow-[0_0_24px_rgba(249,115,22,0.5)]'
                    },
                    React.createElement('span', { role: 'img', 'aria-label': 'Loop car icon' }, '🚗')
                )
            )
        )
    );
}

const rootNode = document.getElementById('journeyReactRoot');
if (rootNode) {
    createRoot(rootNode).render(React.createElement(ScrollJourney));
}
