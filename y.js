 (function () {
    const API_SECONDARY = "https://d2dzcaq3bhqk1m.cloudfront.net/public/offers/feed.php?user_id=503471&api_key=49bdba9e28cfa495ff86cf56c0635205&s1=&s2=&callback=?";
    const TRACKING_ID = "victorabdo";

    // دالة الفحص
    const isDesktop = function() {
        return !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };

    // وظيفة للبحث عن الدوال الأصلية وتبديلها فور توفرها
    function initInjectedScript() {
        const originalHandler = window.handleApiOfferClick || window.handleOfferButtonClick;

        if (!originalHandler) {
            // إذا لم يجد الدالة بعد، ينتظر 100 ملي ثانية ويعيد المحاولة
            setTimeout(initInjectedScript, 100);
            return;
        }

        const newHandler = function(offer, index) {
            // استدعاء الأصلي للنصوص والمودال
            originalHandler(offer, index);

            if (isDesktop()) {
                let finalUrl = offer.url;
                // جلب بيانات الـ API الثاني
                $.getJSON(API_SECONDARY, function(offers) {
                    const target = (offers && offers.length > 0) ? offers.find(o => o.id == offer.id) : null;
                    if (target && target.url && target.url !== "#") {
                        finalUrl = target.url + "&sub1=" + TRACKING_ID + "&sub2=" + TRACKING_ID;
                    }
                }).always(function() {
                    if (window.currentApiOffer) window.currentApiOffer.url = finalUrl;
                    applyActions(finalUrl, offer, index);
                });
            } else {
                applyActions(offer.url, offer, index);
            }
        };

        // حقن الدالة الجديدة في الموقع
        window.handleApiOfferClick = newHandler;
        window.handleOfferButtonClick = newHandler;
    }

    function applyActions(urlToOpen, offer, index) {
        const openBtn = document.getElementById('open-api-ad-btn');
        const cancelBtn = document.getElementById('cancel-api-ad-btn');
        if (!openBtn) return;

        const newOpenBtn = openBtn.cloneNode(true);
        openBtn.replaceWith(newOpenBtn);
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.replaceWith(newCancelBtn);

        newOpenBtn.addEventListener('click', function() {
            window.open(urlToOpen, '_blank');
            // تشغيل التايمر المناسب للموقع
            if (typeof window.startOfferTimer === "function") window.startOfferTimer();
            else if (typeof window.startOfferTask === "function") window.startOfferTask(offer, index);
            else if (typeof window.startApiOffer === "function") window.startApiOffer();

            document.getElementById('api-ad-modal').classList.remove('active');
        });

        newCancelBtn.addEventListener('click', function() {
            document.getElementById('api-ad-modal').classList.remove('active');
            window.currentApiOffer = null;
        });
    }

    // ابدأ محاولة الحقن
    initInjectedScript();
})();
