import React, { useMemo, useState } from 'https://esm.sh/react@18.3.1';
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client';
import { AnimatePresence, motion } from 'https://esm.sh/framer-motion@11.2.10';

const offerData = [
    {
        id: 'offer-1',
        badge: 'Ưu đãi VIP',
        title: 'Giảm 20% công bảo dưỡng',
        desc: 'Áp dụng cho gói bảo dưỡng định kỳ toàn diện và miễn phí kiểm tra 12 hạng mục.',
        code: 'CARAUTO20'
    },
    {
        id: 'offer-2',
        badge: 'Combo tiết kiệm',
        title: 'Giảm 1.200.000đ gói Premium',
        desc: 'Tặng vệ sinh khoang máy và cân bằng động 4 bánh cho xe hạng C trở lên.',
        code: 'PREMIUM12'
    },
    {
        id: 'offer-3',
        badge: 'Quà tặng nhanh',
        title: 'Tặng thay lọc gió điều hòa',
        desc: 'Nhận ưu đãi khi đặt lịch trước 48 giờ, ưu tiên khung giờ cuối tuần.',
        code: 'FILTERFREE'
    }
];

function OffersSection() {
    const [copiedCode, setCopiedCode] = useState('');
    const [hoveredCardId, setHoveredCardId] = useState('');

    const copyToClipboard = async (code) => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(code);
            } else {
                const tempInput = document.createElement('input');
                tempInput.value = code;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand('copy');
                document.body.removeChild(tempInput);
            }
            setCopiedCode(code);
            window.setTimeout(() => setCopiedCode(''), 1400);
        } catch (error) {
            setCopiedCode('');
        }
    };

    const applyOffer = (code) => {
        const hiddenOfferInput = document.getElementById('selectedOfferCode');
        const offerPreview = document.getElementById('selectedOfferPreview');
        const panel = document.getElementById('maintenanceFormPanel');

        if (hiddenOfferInput) {
            hiddenOfferInput.value = code;
        }

        if (offerPreview) {
            offerPreview.innerText = `Ưu đãi đang áp dụng: ${code}`;
        }

        if (panel) {
            panel.classList.remove('focus-pulse');
            void panel.offsetWidth;
            panel.classList.add('focus-pulse');
            panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const cards = useMemo(() => offerData, []);

    return React.createElement(
        'section',
        { className: 'maintenance-offers', 'aria-label': 'Ưu đãi bảo dưỡng độc quyền' },
        React.createElement(
            'div',
            { className: 'maintenance-offers-head' },
            React.createElement('h3', null, 'Ưu đãi bảo dưỡng độc quyền'),
            React.createElement('p', null, 'Chọn mã phù hợp, sao chép nhanh và áp dụng ngay khi đặt lịch để nhận quyền lợi cao nhất.')
        ),
        React.createElement(
            'div',
            { className: 'maintenance-offers-grid' },
            cards.map((offer) => {
                const isHovered = hoveredCardId === offer.id;
                const isCopied = copiedCode === offer.code;

                return React.createElement(
                    motion.article,
                    {
                        key: offer.id,
                        className: 'offer-glass-card',
                        whileHover: { scale: 1.03, y: -6 },
                        transition: { type: 'spring', stiffness: 220, damping: 20 },
                        onHoverStart: () => setHoveredCardId(offer.id),
                        onHoverEnd: () => setHoveredCardId('')
                    },
                    React.createElement('div', { className: 'offer-border-frame', 'aria-hidden': 'true' }),
                    React.createElement(motion.div, {
                        className: 'offer-border-beam',
                        'aria-hidden': 'true',
                        initial: false,
                        animate: isHovered
                            ? { x: ['-150%', '230%'], opacity: [0, 1, 1, 0] }
                            : { x: '-150%', opacity: 0 },
                        transition: isHovered
                            ? { duration: 1.45, ease: 'linear', repeat: Infinity }
                            : { duration: 0.25 }
                    }),
                    React.createElement('span', { className: 'offer-chip' }, offer.badge),
                    React.createElement('h4', { className: 'offer-title' }, offer.title),
                    React.createElement('p', { className: 'offer-desc' }, offer.desc),
                    React.createElement(
                        'button',
                        {
                            type: 'button',
                            className: 'offer-code-btn',
                            onClick: () => copyToClipboard(offer.code),
                            'aria-label': `Sao chép mã ${offer.code}`
                        },
                        offer.code
                    ),
                    React.createElement(
                        AnimatePresence,
                        null,
                        isCopied
                            ? React.createElement(
                                  motion.div,
                                  {
                                      className: 'offer-copied-label',
                                      initial: { opacity: 0, y: -4 },
                                      animate: { opacity: 1, y: 0 },
                                      exit: { opacity: 0, y: -4 }
                                  },
                                  'Đã sao chép!'
                              )
                            : null
                    ),
                    React.createElement(
                        'button',
                        {
                            type: 'button',
                            className: 'offer-cta-btn',
                            onClick: () => applyOffer(offer.code)
                        },
                        'Nhận ưu đãi ngay'
                    )
                );
            })
        )
    );
}

const rootNode = document.getElementById('maintenanceOffersRoot');
if (rootNode) {
    createRoot(rootNode).render(React.createElement(OffersSection));
}
