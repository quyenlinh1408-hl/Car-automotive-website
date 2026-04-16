(function () {
    'use strict';

    const feedbackForm = document.querySelector('.feedback-form');
    if (!feedbackForm) return;

    const stars = Array.from(document.querySelectorAll('.star'));
    const starRating = document.getElementById('star-rating');
    const ratingInput = document.getElementById('rating');
    const messageInput = document.getElementById('message');
    const nameInput = document.getElementById('name');
    const serviceSelect = document.getElementById('service');
    const submitBtn = document.querySelector('.btn-submit');
    const successMsg = document.getElementById('success-message');
    const errorMsg = document.getElementById('error-message');
    const requiredFields = Array.from(feedbackForm.querySelectorAll('[required]'));
    const feedbackTrack = document.querySelector('.feedback-track');
    const marqueeInner = document.querySelector('.testimonial-marquee-inner');
    const reviewStorageKey = 'fpt_auto_user_reviews';

    function getStoredReviews() {
        try {
            const raw = localStorage.getItem(reviewStorageKey);
            return raw ? JSON.parse(raw) : [];
        } catch (error) {
            return [];
        }
    }

    function setStoredReviews(reviews) {
        localStorage.setItem(reviewStorageKey, JSON.stringify(reviews));
    }

    function starsText(rating) {
        return '⭐'.repeat(Math.max(1, Math.min(5, Number(rating) || 5)));
    }

    function createReviewCard(review) {
        const card = document.createElement('div');
        card.className = 'feedback-item user-generated';

        const starsEl = document.createElement('div');
        starsEl.className = 'feedback-stars';
        starsEl.textContent = starsText(review.rating);

        const text = document.createElement('p');
        text.className = 'feedback-text';
        text.textContent = `"${review.message}"`;

        const author = document.createElement('div');
        author.className = 'feedback-author';

        const avatar = document.createElement('div');
        avatar.className = 'author-avatar';
        const avatarImg = document.createElement('img');
        avatarImg.src = review.avatar;
        avatarImg.alt = review.name;
        avatar.appendChild(avatarImg);

        const info = document.createElement('div');
        info.className = 'author-info';
        const name = document.createElement('h4');
        name.textContent = review.name;
        const role = document.createElement('span');
        role.textContent = review.role;

        info.appendChild(name);
        info.appendChild(role);
        author.appendChild(avatar);
        author.appendChild(info);

        card.appendChild(starsEl);
        card.appendChild(text);
        card.appendChild(author);
        return card;
    }

    function rebuildMarqueeClone() {
        if (!marqueeInner || !feedbackTrack) return;
        const oldClone = marqueeInner.querySelector('.feedback-track-clone');
        if (oldClone) {
            oldClone.remove();
        }
        const cloneTrack = feedbackTrack.cloneNode(true);
        cloneTrack.classList.remove('feedback-track');
        cloneTrack.classList.add('feedback-track-clone');
        marqueeInner.appendChild(cloneTrack);
    }

    function roleFromService() {
        if (!serviceSelect) return 'Khách hàng mới';
        const selected = serviceSelect.options[serviceSelect.selectedIndex];
        if (!selected || !selected.value) return 'Khách hàng mới';
        return selected.textContent.trim();
    }

    function hashName(name) {
        let hash = 0;
        for (let i = 0; i < name.length; i += 1) {
            hash += name.charCodeAt(i);
        }
        return hash;
    }

    function genderFromName(name) {
        const normalized = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const femaleHints = [' thi ', ' ngoc ', ' huong ', ' linh ', ' trang ', ' anh ', ' hanh ', ' mai ', ' ly '];
        const maleHints = [' van ', ' duc ', ' trong ', ' minh ', ' khoa ', ' huy ', ' long ', ' cong '];
        const padded = ` ${normalized} `;

        if (femaleHints.some((hint) => padded.includes(hint))) return 'women';
        if (maleHints.some((hint) => padded.includes(hint))) return 'men';
        return 'men';
    }

    function avatarFromName(name) {
        const gender = genderFromName(name);
        const photoId = (hashName(name) % 99) + 1;
        return `https://randomuser.me/api/portraits/${gender}/${photoId}.jpg`;
    }

    function renderStoredReviews() {
        if (!feedbackTrack) return;

        feedbackTrack.querySelectorAll('.user-generated').forEach((item) => item.remove());
        const reviews = getStoredReviews();
        reviews.forEach((review) => {
            feedbackTrack.insertBefore(createReviewCard(review), feedbackTrack.firstChild);
        });
        rebuildMarqueeClone();
    }

    function updateStars(rating, mode) {
        stars.forEach((star) => {
            const value = Number(star.dataset.rating);
            const active = value <= rating;
            star.classList.toggle('active', active);
            star.classList.toggle('preview', mode === 'preview' && active);
        });
    }

    function updateMessagePlaceholder(rating) {
        if (!messageInput) return;

        if (rating <= 2) {
            messageInput.placeholder = 'Điều gì chưa tốt hoặc lỗi nào bạn gặp phải? Chúng tôi sẽ hỗ trợ ngay.';
            return;
        }

        if (rating === 3) {
            messageInput.placeholder = 'Bạn thấy trải nghiệm ở mức nào và cần cải thiện thêm điều gì?';
            return;
        }

        messageInput.placeholder = 'Điều bạn thích nhất là gì? Hãy chia sẻ ưu điểm để chúng tôi phát huy hơn nữa.';
    }

    function setRating(rating) {
        if (!ratingInput) return;
        ratingInput.value = String(rating);
        updateStars(rating, 'active');
        updateMessagePlaceholder(rating);
    }

    stars.forEach((star) => {
        star.addEventListener('mouseenter', () => {
            updateStars(Number(star.dataset.rating), 'preview');
        });

        star.addEventListener('click', () => {
            const rating = Number(star.dataset.rating);
            setRating(rating);
            star.classList.remove('bounce');
            void star.offsetWidth;
            star.classList.add('bounce');
        });
    });

    if (starRating && ratingInput) {
        starRating.addEventListener('mouseleave', () => {
            updateStars(Number(ratingInput.value), 'active');
        });
    }

    function markInvalid(field) {
        field.classList.remove('invalid', 'shake');
        void field.offsetWidth;
        field.classList.add('invalid', 'shake');
    }

    function clearInvalid(field) {
        field.classList.remove('invalid', 'shake');
    }

    function validateField(field) {
        const value = field.value.trim();

        if (!value) {
            markInvalid(field);
            return false;
        }

        if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            markInvalid(field);
            return false;
        }

        if (field.id === 'message' && value.length < 10) {
            markInvalid(field);
            return false;
        }

        clearInvalid(field);
        return true;
    }

    requiredFields.forEach((field) => {
        field.addEventListener('blur', () => validateField(field));
        field.addEventListener('input', () => {
            if (field.classList.contains('invalid') && field.value.trim()) {
                validateField(field);
            }
        });
    });

    feedbackForm.addEventListener('submit', (event) => {
        event.preventDefault();

        if (!submitBtn || !successMsg || !errorMsg || !ratingInput || !messageInput || !nameInput) {
            return;
        }

        successMsg.style.display = 'none';
        errorMsg.style.display = 'none';

        const invalidFields = requiredFields.filter((field) => !validateField(field));
        if (invalidFields.length > 0) {
            errorMsg.innerHTML = '<strong>✗ Lỗi!</strong> Vui lòng kiểm tra các trường bắt buộc và thử lại.';
            errorMsg.style.display = 'block';
            invalidFields[0].focus();
            return;
        }

        submitBtn.classList.add('is-loading');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Đang gửi...';

        const reviewerName = nameInput.value.trim();
        const newReview = {
            name: reviewerName,
            message: messageInput.value.trim(),
            rating: Number(ratingInput.value),
            role: roleFromService(),
            avatar: avatarFromName(reviewerName)
        };

        setTimeout(() => {
            submitBtn.classList.remove('is-loading');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Gửi Ý Kiến';

            successMsg.style.display = 'block';
            successMsg.style.animation = 'slideIn 0.45s ease-out';

            const storedReviews = getStoredReviews();
            storedReviews.unshift(newReview);
            setStoredReviews(storedReviews.slice(0, 12));
            renderStoredReviews();

            feedbackForm.reset();
            setRating(5);

            setTimeout(() => {
                successMsg.style.display = 'none';
            }, 5000);
        }, 1600);
    });

    renderStoredReviews();

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', function (event) {
            const href = this.getAttribute('href');
            if (!href || href === '#') return;
            const target = document.querySelector(href);
            if (!target) return;
            event.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    setRating(5);
}());

