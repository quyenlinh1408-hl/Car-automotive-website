(function () {
    'use strict';

    const modal = document.getElementById('carModal');
    const closeBtn = document.querySelector('.close');
    const modalTitle = document.getElementById('modalTitle');
    const modalDesc = document.getElementById('modalDesc');
    const modalImg = document.getElementById('modalImg');
    const modalImgShell = document.getElementById('modalImgShell');
    const modalPaintPreview = document.getElementById('modalPaintPreview');
    const filterLine = document.getElementById('filterLine');
    const filterPrice = document.getElementById('filterPrice');
    const filterPurpose = document.getElementById('filterPurpose');
    const filterResult = document.getElementById('filterResult');
    const applyFilter = document.getElementById('applyFilter');
    const resetFilter = document.getElementById('resetFilter');
    const carGrid = document.querySelector('.car-grid');
    const carCards = Array.from(document.querySelectorAll('.car-card'));
    const carPriceInput = document.getElementById('carPriceInput');
    const downPaymentInput = document.getElementById('downPaymentInput');
    const interestInput = document.getElementById('interestInput');
    const termInput = document.getElementById('termInput');
    const calculateFinance = document.getElementById('calculateFinance');
    const resetFinance = document.getElementById('resetFinance');
    const loanAmount = document.getElementById('loanAmount');
    const monthlyPayment = document.getElementById('monthlyPayment');
    const totalInterest = document.getElementById('totalInterest');
    const totalRepayment = document.getElementById('totalRepayment');
    const servicesSection = document.getElementById('services');
    const serviceCarLine = document.getElementById('serviceCarLine');
    const serviceDate = document.getElementById('serviceDate');
    const servicePhone = document.getElementById('servicePhone');
    const selectedOfferCode = document.getElementById('selectedOfferCode');
    const selectedOfferPreview = document.getElementById('selectedOfferPreview');
    const serviceSelectedLine = document.getElementById('serviceSelectedLine');
    const maintenanceQuickForm = document.getElementById('maintenanceQuickForm');
    const maintenanceFormPanel = document.getElementById('maintenanceFormPanel');
    const moneyFormatter = new Intl.NumberFormat('vi-VN');
    const comparedCars = new Map();
    let compareDock = null;
    let compareSelectedList = null;
    let compareModal = null;
    let compareTableHead = null;
    let compareTableBody = null;
    let compareInfoBox = null;
    let compareHighlightBtn = null;
    let compareHighlightActive = false;
const carLineLabels = {
    mercedes: 'Mercedes',
    bmw: 'BMW',
    audi: 'Audi',
    porsche: 'Porsche',
    lexus: 'Lexus',
    ford: 'Ford',
    mazda: 'Mazda',
    lamborghini: 'Lamborghini', // Thêm mới để khớp với Huracan/Aventador
    ferrari: 'Ferrari',         // Thêm mới để khớp với Ferrari 458
    tesla: 'Tesla'              // Thêm mới để khớp với Tesla Model 3
};

const carCatalog = [
    { name: 'Mazda 2 Hatchback', image: 'mazda-2-hatchback.jpg', image_url: './images/cars/mazda-2-hatchback.jpg', category: 'Xe hạng B', price: '418.000.000đ', priceBand: 'under700', purpose: 'do-thi', line: 'mazda', cardClass: 'sedan' },
    { name: 'Lamborghini Huracan', image: 'lamborghini-huracan.jpg', image_url: './images/cars/lamborghini-huracan.jpg', category: 'Siêu xe thể thao', price: '21.500.000.000đ', priceBand: 'above1200', purpose: 'the-thao', line: 'lamborghini', cardClass: 'sport' },
    { name: 'Tesla Model 3', image: 'tesla-model-3.avif', image_url: './images/cars/tesla-model-3.avif', category: 'Xe điện cao cấp', price: '1.399.000.000đ', priceBand: 'above1200', purpose: 'cao-cap', line: 'tesla', cardClass: 'electric' },
    { name: 'Lamborghini Aventador', image: 'lamborghini-aventador.jpg', image_url: './images/cars/lamborghini-aventador.jpg', category: 'Siêu xe thể thao', price: '45.900.000.000đ', priceBand: 'above1200', purpose: 'the-thao', line: 'lamborghini', cardClass: 'sport' },
    { name: 'Ferrari 458 Italia', image: 'ferrari-458-italia.jpg', image_url: './images/cars/ferrari-458-italia.jpg', category: 'Siêu xe thể thao', price: '17.900.000.000đ', priceBand: 'above1200', purpose: 'the-thao', line: 'ferrari', cardClass: 'sport' },
    { name: 'Ford Mustang', image: 'ford-mustang.avif', image_url: './images/cars/ford-mustang.avif', category: 'Xe cơ bắp Mỹ', price: '2.490.000.000đ', priceBand: 'above1200', purpose: 'the-thao', line: 'ford', cardClass: 'sport' },
    { name: 'Ford Expedition', image: 'ford-expedition.webp', image_url: './images/cars/ford-expedition.webp', category: 'SUV hạng Full-size', price: '4.950.000.000đ', priceBand: 'above1200', purpose: 'gia-dinh', line: 'ford', cardClass: 'suv' },
    { name: 'Mercedes-Benz S-Class', image: 'mercedes-s-class.avif', image_url: './images/cars/mercedes-s-class.avif', category: 'Sedan hạng sang', price: '5.990.000.000đ', priceBand: 'above1200', purpose: 'cao-cap', line: 'mercedes', cardClass: 'sedan' },
    { name: 'BMW M8 Competition', image: 'bmw-m8-competition.avif', image_url: './images/cars/bmw-m8-competition.avif', category: 'Xe thể thao hạng sang', price: '9.250.000.000đ', priceBand: 'above1200', purpose: 'the-thao', line: 'bmw', cardClass: 'sport' },
    { name: 'Audi Q7', image: 'audi-q7.avif', image_url: './images/cars/audi-q7.avif', category: 'SUV hạng sang', price: '4.390.000.000đ', priceBand: 'above1200', purpose: 'gia-dinh', line: 'audi', cardClass: 'suv' }
];

    const paintPresets = [
        { name: 'Nguyên bản', color: 'transparent', opacity: '0' },
        { name: 'Đen bóng', color: '#17181a', opacity: '0.82' },
        { name: 'Đỏ ruby', color: '#b31f2f', opacity: '0.9' },
        { name: 'Xanh midnight', color: '#1d4f8a', opacity: '0.9' },
        { name: 'Bạc ánh kim', color: '#bcc4ce', opacity: '0.8' }
    ];
    const compareProfiles = {
        mercedes: {
            wheel: '20 inch AMG',
            lights: 'Digital LED',
            paint: 'Obsidian Black',
            design: 'Executive Luxury',
            seatMaterial: 'Da Nappa',
            centerScreen: '12.8 inch OLED',
            ac: '4 vùng độc lập',
            smartCabin: 'Có',
            adas: 'Cấp độ 2+',
            camera: '360° HD',
            airbags: '8',
            brakeAssist: 'ABS/EBD/BA'
        },
        bmw: {
            wheel: '20 inch M',
            lights: 'Adaptive LED',
            paint: 'Portimao Blue',
            design: 'M Sport Kit',
            seatMaterial: 'Da Merino',
            centerScreen: '14.9 inch Curved',
            ac: '3 vùng tự động',
            smartCabin: 'Có',
            adas: 'Cấp độ 2',
            camera: '360° Panorama',
            airbags: '6',
            brakeAssist: 'ABS/EBD/BA'
        },
        audi: {
            wheel: '21 inch Quattro',
            lights: 'Matrix LED',
            paint: 'Daytona Grey',
            design: 'S-line Exterior',
            seatMaterial: 'Da Valcona',
            centerScreen: '10.1 inch MMI',
            ac: '4 vùng độc lập',
            smartCabin: 'Có',
            adas: 'Cấp độ 2',
            camera: '360° 3D View',
            airbags: '7',
            brakeAssist: 'ABS/EBD/BA'
        },
        porsche: {
            wheel: '21 inch Sport',
            lights: 'PDLS Plus',
            paint: 'Carmine Red',
            design: 'Sport Design',
            seatMaterial: 'Da thể thao',
            centerScreen: '12.3 inch PCM',
            ac: '2 vùng tự động',
            smartCabin: 'Có',
            adas: 'Cấp độ 2',
            camera: '360° + cảm biến',
            airbags: '6',
            brakeAssist: 'ABS/PSM'
        },
        lexus: {
            wheel: '19 inch Premium',
            lights: 'Triple LED',
            paint: 'Graphite Black',
            design: 'Luxury Hybrid',
            seatMaterial: 'Da Semi-Aniline',
            centerScreen: '12.3 inch Touch',
            ac: '4 vùng độc lập',
            smartCabin: 'Có',
            adas: 'Lexus Safety System+',
            camera: '360° + giả lập gầm',
            airbags: '10',
            brakeAssist: 'ABS/EBD/BA'
        },
        ford: {
            wheel: '20 inch',
            lights: 'LED Projector',
            paint: 'Meteor Grey',
            design: 'SUV Touring',
            seatMaterial: 'Da tổng hợp cao cấp',
            centerScreen: '12 inch SYNC',
            ac: '2 vùng tự động',
            smartCabin: 'Có',
            adas: 'Cấp độ 2',
            camera: '360° HD',
            airbags: '7',
            brakeAssist: 'ABS/EBD/BA'
        },
        mazda: {
            wheel: '18 inch',
            lights: 'LED Signature',
            paint: 'Soul Red Crystal',
            design: 'Kodo Design',
            seatMaterial: 'Da cao cấp',
            centerScreen: '10.25 inch',
            ac: '2 vùng tự động',
            smartCabin: 'Có',
            adas: 'i-Activsense',
            camera: '360° View',
            airbags: '6',
            brakeAssist: 'ABS/EBD/BA'
        },
        lamborghini: {
            wheel: '20-21 inch forged',
            lights: 'LED Y-shape',
            paint: 'Giallo Orion',
            design: 'Aero Carbon Kit',
            seatMaterial: 'Alcantara + Carbon',
            centerScreen: '8.4 inch dual display',
            ac: '2 vùng tự động',
            smartCabin: 'Có',
            adas: 'Hiệu năng cao',
            camera: 'Camera lùi + cảm biến',
            airbags: '6',
            brakeAssist: 'ABS/ESC/Carbon Ceramic'
        },
        ferrari: {
            wheel: '20 inch forged',
            lights: 'Bi-Xenon/LED DRL',
            paint: 'Rosso Corsa',
            design: 'Berlinetta Sport',
            seatMaterial: 'Da thể thao',
            centerScreen: 'Dual TFT cluster',
            ac: '2 vùng tự động',
            smartCabin: 'Có',
            adas: 'Hiệu năng cao',
            camera: 'Camera lùi + cảm biến',
            airbags: '6',
            brakeAssist: 'ABS/ESC/Carbon Ceramic'
        },
        tesla: {
            wheel: '18-19 inch Aero',
            lights: 'LED Matrix',
            paint: 'Midnight Silver',
            design: 'Minimalist EV',
            seatMaterial: 'Vegan Leather',
            centerScreen: '15.4 inch touchscreen',
            ac: '2 vùng tự động',
            smartCabin: 'Có',
            adas: 'Autopilot',
            camera: 'Tesla Vision',
            airbags: '8',
            brakeAssist: 'ABS/EBD/BA'
        }
    };
    const paintMaskClasses = ['paint-mask-sedan', 'paint-mask-sport', 'paint-mask-suv', 'paint-mask-hybrid', 'paint-mask-electric'];

    function inferFuel(engineText) {
        const lower = (engineText || '').toLowerCase();
        if (lower.includes('diesel')) return 'Diesel';
        if (lower.includes('hybrid')) return 'Hybrid';
        if (lower.includes('điện') || lower.includes('electric')) return 'Điện';
        return 'Xăng';
    }

    function inferLineFromText(text) {
        const lower = (text || '').toLowerCase();
        if (lower.includes('mercedes')) return 'mercedes';
        if (lower.includes('bmw')) return 'bmw';
        if (lower.includes('audi')) return 'audi';
        if (lower.includes('lamborghini')) return 'lamborghini';
        if (lower.includes('ferrari')) return 'ferrari';
        if (lower.includes('tesla')) return 'tesla';
        if (lower.includes('porsche')) return 'porsche';
        if (lower.includes('lexus')) return 'lexus';
        if (lower.includes('ford')) return 'ford';
        return 'mazda';
    }

    function resolveMaskClassFromCard(card) {
        if (!card) return 'paint-mask-sedan';
        if (card.classList.contains('sport')) return 'paint-mask-sport';
        if (card.classList.contains('suv')) return 'paint-mask-suv';
        if (card.classList.contains('hybrid')) return 'paint-mask-hybrid';
        if (card.classList.contains('electric')) return 'paint-mask-electric';
        return 'paint-mask-sedan';
    }

    function applyMaskClass(target, className) {
        if (!target) return;
        target.classList.remove(...paintMaskClasses);
        if (className) {
            target.classList.add(className);
        }
    }

    function applyPaintLayer(targetLayer, preset) {
        targetLayer.style.setProperty('--paint-color', preset.color);
        targetLayer.style.setProperty('--paint-opacity', preset.opacity);
        targetLayer.dataset.selectedPaintColor = preset.color;
        targetLayer.dataset.selectedPaintOpacity = preset.opacity;
    }

    function createPaintControls(targetLayer, onApply) {
        const wrapper = document.createElement('div');
        wrapper.className = 'paint-preview';

        const label = document.createElement('span');
        label.className = 'paint-preview-label';
        label.innerText = 'Xem màu sơn 360°';
        wrapper.appendChild(label);

        const swatches = document.createElement('div');
        swatches.className = 'paint-swatches';
        wrapper.appendChild(swatches);

        const setActiveSwatch = (activeBtn) => {
            swatches.querySelectorAll('.paint-swatch').forEach((btn) => btn.classList.remove('is-active'));
            if (activeBtn) {
                activeBtn.classList.add('is-active');
            }
        };

        paintPresets.forEach((preset, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'paint-swatch';
            button.title = preset.name;
            button.style.background = preset.color;
            button.dataset.color = preset.color;
            if (preset.color === 'transparent') {
                button.style.background = 'linear-gradient(135deg,#f0f0f0,#c9c9c9)';
            }
            if (index === 0) {
                button.classList.add('is-active');
            }

            const applyPaint = () => {
                applyPaintLayer(targetLayer, preset);
                setActiveSwatch(button);
                if (onApply) {
                    onApply(preset);
                }
            };

            button.addEventListener('mouseenter', () => {
                targetLayer.style.setProperty('--paint-color', preset.color);
                targetLayer.style.setProperty('--paint-opacity', preset.opacity);
            });

            button.addEventListener('mouseleave', () => {
                const selectedColor = targetLayer.dataset.selectedPaintColor || 'transparent';
                const selectedOpacity = targetLayer.dataset.selectedPaintOpacity || '0';
                targetLayer.style.setProperty('--paint-color', selectedColor);
                targetLayer.style.setProperty('--paint-opacity', selectedOpacity);
            });

            button.addEventListener('focus', () => {
                targetLayer.style.setProperty('--paint-color', preset.color);
                targetLayer.style.setProperty('--paint-opacity', preset.opacity);
            });

            button.addEventListener('blur', () => {
                const selectedColor = targetLayer.dataset.selectedPaintColor || 'transparent';
                const selectedOpacity = targetLayer.dataset.selectedPaintOpacity || '0';
                targetLayer.style.setProperty('--paint-color', selectedColor);
                targetLayer.style.setProperty('--paint-opacity', selectedOpacity);
            });

            button.addEventListener('click', applyPaint);

            swatches.appendChild(button);
        });

        targetLayer.dataset.selectedPaintColor = 'transparent';
        targetLayer.dataset.selectedPaintOpacity = '0';
        targetLayer.style.setProperty('--paint-color', 'transparent');
        targetLayer.style.setProperty('--paint-opacity', '0');
        return wrapper;
    }

    function updateFilterResult(visibleCount) {
        if (!filterResult) return;
        filterResult.innerText = `Đang hiển thị ${visibleCount} mẫu xe`;
    }

    function filterCars() {
        if (!filterLine || !filterPrice || !filterPurpose) return;

        const selectedLine = filterLine.value;
        const selectedPrice = filterPrice.value;
        const selectedPurpose = filterPurpose.value;
        let visibleCount = 0;

        carCards.forEach((card) => {
            const matchesLine = selectedLine === 'all' || card.dataset.line === selectedLine;
            const matchesPrice = selectedPrice === 'all' || card.dataset.price === selectedPrice;
            const matchesPurpose = selectedPurpose === 'all' || card.dataset.purpose === selectedPurpose;
            const shouldShow = matchesLine && matchesPrice && matchesPurpose;
            const nextDisplay = shouldShow ? '' : 'none';

            if (card.style.display !== nextDisplay) {
                card.style.display = nextDisplay;
            }

            if (shouldShow) {
                visibleCount += 1;
            }
        });

        updateFilterResult(visibleCount);
    }

    function resetCars() {
        if (!filterLine || !filterPrice || !filterPurpose) return;

        filterLine.value = 'all';
        filterPrice.value = 'all';
        filterPurpose.value = 'all';
        carCards.forEach((card) => {
            if (card.style.display) {
                card.style.display = '';
            }
        });
        updateFilterResult(carCards.length);
    }

    function formatMoney(value) {
        return `${moneyFormatter.format(Math.round(value))}đ`;
    }

    function calculateFinanceResult() {
        if (!carPriceInput || !downPaymentInput || !interestInput || !termInput) return;
        if (!loanAmount || !monthlyPayment || !totalInterest || !totalRepayment) return;

        const carPrice = Math.max(Number(carPriceInput.value) || 0, 0) * 1000000;
        const downPayment = Math.max(Number(downPaymentInput.value) || 0, 0) * 1000000;
        const annualInterest = Math.max(Number(interestInput.value) || 0, 0) / 100;
        const termMonths = Math.max(Number(termInput.value) || 1, 1);
        const loanPrincipal = Math.max(carPrice - downPayment, 0);
        const monthlyRate = annualInterest / 12;

        let monthlyInstallment = 0;
        if (loanPrincipal > 0) {
            if (monthlyRate === 0) {
                monthlyInstallment = loanPrincipal / termMonths;
            } else {
                const compounded = Math.pow(1 + monthlyRate, termMonths);
                monthlyInstallment = loanPrincipal * (monthlyRate * compounded) / (compounded - 1);
            }
        }

        const totalPay = monthlyInstallment * termMonths;
        const totalInterestValue = Math.max(totalPay - loanPrincipal, 0);

        loanAmount.innerText = formatMoney(loanPrincipal);
        monthlyPayment.innerText = formatMoney(monthlyInstallment);
        totalInterest.innerText = formatMoney(totalInterestValue);
        totalRepayment.innerText = formatMoney(totalPay);
    }

    function resetFinanceFields() {
        if (!carPriceInput || !downPaymentInput || !interestInput || !termInput) return;
        carPriceInput.value = 900;
        downPaymentInput.value = 270;
        interestInput.value = 8.5;
        termInput.value = 60;
        calculateFinanceResult();
    }

    function scrollToSectionWithOffset(section, offset) {
        if (!section) return;
        const y = section.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
    }

    function updateSelectedServiceLine() {
        if (!serviceSelectedLine || !serviceCarLine) return;
        if (!serviceCarLine.value) {
            serviceSelectedLine.innerText = 'Đang chọn: Chưa chọn dòng xe';
            return;
        }

        const label = carLineLabels[serviceCarLine.value] || serviceCarLine.value;
        serviceSelectedLine.innerText = `Đang chọn: ${label}`;
    }

    function openServiceForLine(line) {
        if (serviceCarLine && line) {
            const hasOption = Array.from(serviceCarLine.options).some((option) => option.value === line);
            if (hasOption) {
                serviceCarLine.value = line;
                updateSelectedServiceLine();
            }
        }

        scrollToSectionWithOffset(servicesSection, 90);

        if (maintenanceFormPanel) {
            maintenanceFormPanel.classList.remove('focus-pulse');
            void maintenanceFormPanel.offsetWidth;
            maintenanceFormPanel.classList.add('focus-pulse');
        }
    }

    function renderServiceQuickLinks() {
        carCards.forEach((card) => {
            const carInfo = card.querySelector('.car-info');
            const priceElement = card.querySelector('.price');

            if (!carInfo || !priceElement || carInfo.querySelector('.service-quick-link')) return;

            const quickLinkBtn = document.createElement('button');
            quickLinkBtn.type = 'button';
            quickLinkBtn.className = 'service-quick-link';
            quickLinkBtn.dataset.serviceLine = card.dataset.line || '';
            quickLinkBtn.innerHTML = [
                '<span class="service-quick-icon" aria-hidden="true">🔧</span>',
                '<span class="service-quick-text">Đã sở hữu dòng xe này? Đặt lịch bảo dưỡng định kỳ tại đây</span>'
            ].join('');

            carInfo.insertBefore(quickLinkBtn, priceElement);
        });
    }

    function openCarModalFromCard(card) {
        if (!modal || !modalTitle || !modalDesc || !modalImg) return;
        if (!card) return;

        const titleEl = card.querySelector('h3');
        const priceEl = card.querySelector('.price span');
        const imgElement = card.querySelector('.car-img');
        if (!titleEl || !priceEl || !imgElement) return;

        const lazySrc = imgElement.dataset.bg || '';
        const backgroundImage = window.getComputedStyle(imgElement).backgroundImage;
        const imageMatch = backgroundImage.match(/url\(["']?(.*?)["']?\)/);
        const imgSrc = imageMatch ? imageMatch[1] : lazySrc;

        modalTitle.innerText = titleEl.innerText;
        modalDesc.innerText = `Giá ưu đãi: ${priceEl.innerText}. Liên hệ để biết thêm chi tiết về động cơ và nội thất.`;
        modalImg.src = imgSrc;
        const selectedColor = imgElement.dataset.selectedPaintColor || 'transparent';
        const selectedOpacity = imgElement.dataset.selectedPaintOpacity || '0';
        if (modalImgShell) {
            const maskClass = resolveMaskClassFromCard(card);
            applyMaskClass(modalImgShell, maskClass);
            modalImgShell.dataset.selectedPaintColor = selectedColor;
            modalImgShell.dataset.selectedPaintOpacity = selectedOpacity;
            modalImgShell.style.setProperty('--paint-color', selectedColor);
            modalImgShell.style.setProperty('--paint-opacity', selectedOpacity);
        }

        if (modalPaintPreview && modalImgShell) {
            modalPaintPreview.innerHTML = '';
            modalPaintPreview.appendChild(createPaintControls(modalImgShell));
        }

        modal.classList.add('active');
    }

    function extractCarData(card) {
        const title = card.querySelector('h3')?.innerText || 'Mẫu xe';
        const price = card.querySelector('.price span')?.innerText || 'Đang cập nhật';
        const type = card.querySelector('.car-tag')?.innerText || 'Đang cập nhật';
        const specs = Array.from(card.querySelectorAll('.car-specs span')).map((span) => span.innerText.trim());
        const engine = specs[1] || 'Đang cập nhật';
        const imgElement = card.querySelector('.car-img');
        const image = imgElement?.dataset.bg || '';
        return {
            key: title,
            title,
            price,
            type,
            line: card.dataset.line || inferLineFromText(`${title} ${type}`),
            image,
            seats: specs[0] || 'Đang cập nhật',
            engine,
            fuel: inferFuel(engine),
            gearbox: specs[2] || 'Đang cập nhật'
        };
    }

    function updateCompareButtons() {
        carCards.forEach((card) => {
            const btn = card.querySelector('.compare-toggle-btn');
            if (!btn) return;
            const carData = extractCarData(card);
            const selected = comparedCars.has(carData.key);
            btn.classList.toggle('is-selected', selected);
            btn.innerText = selected ? 'Đã chọn so sánh' : 'So sánh';
        });
    }

    function updateCompareDock() {
        if (!compareDock || !compareSelectedList) return;

        compareSelectedList.innerHTML = '';
        const selectedCars = Array.from(comparedCars.values());
        if (selectedCars.length === 0) {
            compareDock.classList.remove('active');
            return;
        }

        selectedCars.forEach((car) => {
            const chip = document.createElement('span');
            chip.className = 'compare-chip';
            chip.innerText = car.title;
            compareSelectedList.appendChild(chip);
        });

        compareDock.classList.add('active');
    }

    function setCompareInfo(message, isReady) {
        if (!compareInfoBox) return;
        compareInfoBox.innerText = message;
        compareInfoBox.classList.toggle('is-ready', !!isReady);
    }

    function getCompareProfile(line) {
        return compareProfiles[line] || compareProfiles.mazda;
    }

    function isDiffRow(firstValue, secondValue) {
        return String(firstValue).trim().toLowerCase() !== String(secondValue).trim().toLowerCase();
    }

    function buildDetailedCompareRows(first, second) {
        const firstProfile = getCompareProfile(first.line);
        const secondProfile = getCompareProfile(second.line);
        const groups = [
            {
                title: 'Vận hành',
                rows: [
                    ['Giá', first.price, second.price],
                    ['Động cơ', first.engine, second.engine],
                    ['Hộp số', first.gearbox, second.gearbox],
                    ['Nhiên liệu', first.fuel, second.fuel]
                ]
            },
            {
                title: 'Ngoại thất',
                rows: [
                    ['Mâm xe', firstProfile.wheel, secondProfile.wheel],
                    ['Đèn chiếu sáng', firstProfile.lights, secondProfile.lights],
                    ['Màu sơn nổi bật', firstProfile.paint, secondProfile.paint],
                    ['Gói thiết kế', firstProfile.design, secondProfile.design]
                ]
            },
            {
                title: 'Nội thất',
                rows: [
                    ['Chất liệu ghế', firstProfile.seatMaterial, secondProfile.seatMaterial],
                    ['Màn hình trung tâm', firstProfile.centerScreen, secondProfile.centerScreen],
                    ['Điều hòa', firstProfile.ac, secondProfile.ac],
                    ['Khoang lái thông minh', firstProfile.smartCabin, secondProfile.smartCabin]
                ]
            },
            {
                title: 'An toàn',
                rows: [
                    ['Hệ thống hỗ trợ lái', firstProfile.adas, secondProfile.adas],
                    ['Camera', firstProfile.camera, secondProfile.camera],
                    ['Túi khí', firstProfile.airbags, secondProfile.airbags],
                    ['Phanh', firstProfile.brakeAssist, secondProfile.brakeAssist]
                ]
            }
        ];

        return groups
            .map((group) => {
                const groupRows = group.rows
                    .map(([label, firstValue, secondValue]) => {
                        const diffClass = isDiffRow(firstValue, secondValue) ? ' is-diff' : '';
                        return `<tr class="compare-data-row${diffClass}"><td>${label}</td><td>${firstValue}</td><td>${secondValue}</td></tr>`;
                    })
                    .join('');
                return `<tr class="compare-group-row"><td colspan="3">${group.title}</td></tr>${groupRows}`;
            })
            .join('');
    }

    function setCompareHighlightState(active) {
        compareHighlightActive = !!active;
        const table = compareModal?.querySelector('.compare-table');
        if (table) {
            table.classList.toggle('compare-highlight-active', compareHighlightActive);
        }
        if (compareHighlightBtn) {
            compareHighlightBtn.classList.toggle('is-active', compareHighlightActive);
            compareHighlightBtn.innerText = compareHighlightActive ? 'Bỏ Highlight' : 'Highlight khác biệt';
        }
    }

    function renderCompareTable() {
        if (!compareTableBody || !compareTableHead) return;

        const selectedCars = Array.from(comparedCars.values());
        if (selectedCars.length < 2) {
            setCompareInfo('Vui lòng chọn 2 mẫu xe để so sánh.', false);
            compareTableHead.innerHTML = '';
            compareTableBody.innerHTML = '';
            setCompareHighlightState(false);
            return;
        }

        const [first, second] = selectedCars;
        setCompareInfo('Đã chọn đủ 2 mẫu xe. Bạn có thể đối chiếu thông số chi tiết bên dưới.', true);
        compareTableHead.innerHTML = `
            <tr>
                <th>Thông tin</th>
                <th>${first.title}</th>
                <th>${second.title}</th>
            </tr>
        `;
        compareTableBody.innerHTML = buildDetailedCompareRows(first, second);
        setCompareHighlightState(compareHighlightActive);
    }

    function openCompareModal() {
        if (!compareModal) return;
        renderCompareTable();
        compareModal.classList.add('active');
    }

    function createCompareUI() {
        compareDock = document.createElement('div');
        compareDock.className = 'compare-dock';
        compareDock.innerHTML = `
            <div class="compare-selected-list"></div>
            <div style="display:flex; gap:8px;">
                <button type="button" class="compare-clear-btn">Xóa chọn</button>
                <button type="button" class="compare-open-btn">So sánh ngay</button>
            </div>
        `;

        compareModal = document.createElement('div');
        compareModal.className = 'compare-modal';
        compareModal.innerHTML = `
            <div class="compare-modal-card">
                <div class="compare-modal-head">
                    <h3>Bảng so sánh xe</h3>
                    <button type="button" class="compare-close-btn" aria-label="Đóng">&times;</button>
                </div>
                <div class="compare-info-box">Vui lòng chọn 2 mẫu xe để so sánh.</div>
                <div class="compare-actions">
                    <button type="button" class="compare-highlight-btn">Highlight khác biệt</button>
                </div>
                <div class="compare-table-wrap">
                    <table class="compare-table">
                        <thead></thead>
                        <tbody></tbody>
                    </table>
                </div>
            </div>
        `;

        document.body.appendChild(compareDock);
        document.body.appendChild(compareModal);

        compareSelectedList = compareDock.querySelector('.compare-selected-list');
        compareTableHead = compareModal.querySelector('.compare-table thead');
        compareTableBody = compareModal.querySelector('.compare-table tbody');
        compareInfoBox = compareModal.querySelector('.compare-info-box');
        compareHighlightBtn = compareModal.querySelector('.compare-highlight-btn');

        compareDock.querySelector('.compare-open-btn').addEventListener('click', openCompareModal);

        compareDock.querySelector('.compare-clear-btn').addEventListener('click', () => {
            comparedCars.clear();
            updateCompareButtons();
            updateCompareDock();
        });

        compareModal.querySelector('.compare-close-btn').addEventListener('click', () => {
            compareModal.classList.remove('active');
        });

        compareHighlightBtn.addEventListener('click', () => {
            setCompareHighlightState(!compareHighlightActive);
        });

        compareModal.addEventListener('click', (event) => {
            if (event.target === compareModal) {
                compareModal.classList.remove('active');
            }
        });
    }

    function toggleCompare(card) {
        const carData = extractCarData(card);
        if (comparedCars.has(carData.key)) {
            comparedCars.delete(carData.key);
        } else {
            if (comparedCars.size >= 2) {
                alert('Bạn chỉ có thể chọn tối đa 2 xe để so sánh.');
                return;
            }
            comparedCars.set(carData.key, carData);
        }
        updateCompareButtons();
        updateCompareDock();
        openCompareModal();
    }

    function initLazyCarImages() {
        const lazyImages = Array.from(document.querySelectorAll('.car-img[data-bg]'));
        if (lazyImages.length === 0) return;

        const loadImage = (element) => {
            const src = element.dataset.bg;
            if (!src || element.dataset.loaded === 'true') return;
            element.classList.add('is-loading');

            const image = new Image();
            image.onload = () => {
                element.style.backgroundImage = `url('${src}')`;
                element.dataset.loaded = 'true';
                element.classList.remove('is-loading');
            };
            image.onerror = () => {
                element.classList.remove('is-loading');
            };
            image.src = src;
        };

        if (!('IntersectionObserver' in window)) {
            lazyImages.forEach(loadImage);
            return;
        }

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                loadImage(entry.target);
                obs.unobserve(entry.target);
            });
        }, { rootMargin: '220px 0px' });

        lazyImages.forEach((element) => observer.observe(element));
    }

    function renderPaintPreviewSwatches() {
        carCards.forEach((card) => {
            const img = card.querySelector('.car-img');
            const carInfo = card.querySelector('.car-info');
            const priceElement = card.querySelector('.price');
            if (!img || !carInfo || !priceElement) return;
            if (carInfo.querySelector('.paint-preview')) return;

            applyMaskClass(img, resolveMaskClassFromCard(card));

            const controls = createPaintControls(img);
            carInfo.insertBefore(controls, priceElement);
        });
    }

    function renderCompareButtons() {
        carCards.forEach((card) => {
            const carInfo = card.querySelector('.car-info');
            const priceElement = card.querySelector('.price');
            if (!carInfo || !priceElement) return;
            if (carInfo.querySelector('.compare-toggle-btn')) return;

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'compare-toggle-btn';
            button.innerText = 'So sánh';
            carInfo.insertBefore(button, priceElement);
        });
    }

    function syncCarCardsWithCatalog() {
        if (carCards.length === 0) return;

        carCards.forEach((card, index) => {
            const item = carCatalog[index];
            if (!item) return;

            const titleEl = card.querySelector('h3');
            const tagEl = card.querySelector('.car-tag');
            const imgEl = card.querySelector('.car-img');
            const priceEl = card.querySelector('.price span');

            if (titleEl) titleEl.innerText = item.name;
            if (tagEl) tagEl.innerText = item.category;
            if (imgEl) imgEl.dataset.bg = item.image_url;
            if (priceEl) priceEl.innerText = item.price;

            card.dataset.line = item.line;
            card.dataset.category = item.category;
            card.dataset.price = item.priceBand;
            card.dataset.purpose = item.purpose;

            card.classList.remove('sedan', 'sport', 'suv', 'hybrid', 'electric');
            card.classList.add(item.cardClass);
        });
    }

    if (filterLine) {
        filterLine.addEventListener('change', filterCars);
    }
    if (filterPrice) {
        filterPrice.addEventListener('change', filterCars);
    }
    if (filterPurpose) {
        filterPurpose.addEventListener('change', filterCars);
    }
    if (applyFilter) {
        applyFilter.addEventListener('click', filterCars);
    }
    if (resetFilter) {
        resetFilter.addEventListener('click', resetCars);
    }
    if (calculateFinance) {
        calculateFinance.addEventListener('click', calculateFinanceResult);
    }
    if (resetFinance) {
        resetFinance.addEventListener('click', resetFinanceFields);
    }

    [carPriceInput, downPaymentInput, interestInput, termInput].forEach((input) => {
        if (input) {
            input.addEventListener('input', calculateFinanceResult);
        }
    });

    if (serviceCarLine) {
        serviceCarLine.addEventListener('change', updateSelectedServiceLine);
    }

    if (maintenanceQuickForm && serviceCarLine) {
        maintenanceQuickForm.addEventListener('submit', (event) => {
            event.preventDefault();
            if (!serviceCarLine.value) {
                serviceCarLine.focus();
                return;
            }

            if (servicePhone) {
                const normalizedPhone = servicePhone.value.replace(/\D/g, '');
                const isValidPhone = /^0\d{9,10}$/.test(normalizedPhone);
                if (!isValidPhone) {
                    servicePhone.focus();
                    alert('Vui lòng nhập số điện thoại hợp lệ (bắt đầu bằng 0, 10-11 số).');
                    return;
                }
                servicePhone.value = normalizedPhone;
            }

            const offerCode = selectedOfferCode ? selectedOfferCode.value.trim() : '';

            maintenanceQuickForm.reset();
            updateSelectedServiceLine();
            if (selectedOfferCode) {
                selectedOfferCode.value = '';
            }
            if (selectedOfferPreview) {
                selectedOfferPreview.innerText = 'Ưu đãi đang áp dụng: Chưa chọn ưu đãi';
            }
            if (offerCode) {
                alert(`Cảm ơn bạn! Chúng tôi đã nhận lịch bảo dưỡng và áp dụng mã ${offerCode}.`);
                return;
            }

            alert('Cảm ơn bạn! Chúng tôi đã nhận lịch bảo dưỡng.');
        });
    }

    if (serviceDate) {
        serviceDate.min = new Date().toISOString().split('T')[0];
    }

    if (carGrid) {
        carGrid.addEventListener('click', (event) => {
            const compareBtn = event.target.closest('.compare-toggle-btn');
            if (compareBtn) {
                event.preventDefault();
                const card = compareBtn.closest('.car-card');
                toggleCompare(card);
                return;
            }

            const quickLink = event.target.closest('.service-quick-link');
            if (quickLink) {
                event.preventDefault();
                openServiceForLine(quickLink.dataset.serviceLine);
                return;
            }

            const detailBtn = event.target.closest('.btn-outline');
            if (!detailBtn) return;

            event.preventDefault();
            const card = detailBtn.closest('.car-card');
            openCarModalFromCard(card);
        });
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }

    if (modal) {
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.classList.remove('active');
            }
        });
    }

    syncCarCardsWithCatalog();
    renderServiceQuickLinks();
    renderPaintPreviewSwatches();
    renderCompareButtons();
    createCompareUI();
    initLazyCarImages();
    updateSelectedServiceLine();
    updateFilterResult(carCards.length);
    calculateFinanceResult();
}());

