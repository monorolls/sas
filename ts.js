

window.apiOffersData = [];
window.currentApiOffer = null;
window.pendingTimerOffers = {};
const OFFER_TIMER_DURATION = 210000;

window.userData = window.userData || {
    completedApiOffers: [],
    apiOffersEarnings: 0,
    totalOffersAttempted: 0
};

window.initCoreEngine = function(offers) {
    window.apiOffersData = window.processApiOffers(offers.slice(0, 9));
    window.renderApiOffers();
};

window.processApiOffers = function(offers) {
    const robuxValues = [32, 30, 24, 19, 13, 13, 17, 12, 12, 10];
    return offers.map((offer, index) => {
        const robux = robuxValues[index] || 50;
        return {
            id: offer.id,
            anchor: (offer.anchor || offer.name || `Offer ${index + 1}`).replace(/&nbsp;/g, ' ').replace(/<[^>]*>/g, '').trim().substring(0, 100),
            conversion: offer.conversion || "Complete the task to earn Sweeps Coins",
            url: offer.url || "#",
            robux: robux,
            thumbnail: offer.network_icon || offer.thumbnail || offer.icon || "https://via.placeholder.com/100/6A11CB/FFFFFF?text=Offer"
        };
    });
};

window.renderApiOffers = function() {
    const container = document.getElementById('api-offers-container');
    if (!container) return;
    container.innerHTML = '';
    
    window.apiOffersData.forEach((offer, index) => {
        const isCompleted = window.userData.completedApiOffers.includes(offer.id);
        const hasPendingTimer = window.pendingTimerOffers[offer.id] && window.pendingTimerOffers[offer.id] > Date.now();
        
        const card = document.createElement('div');
        card.className = `offer-card will-change ${index < 3 ? 'highlight' : ''}`;
        
        card.innerHTML = `
            <div class="offer-header">
                <div class="offer-image">
                    <img src="${offer.thumbnail}" onerror="this.src='https://via.placeholder.com/100/6A11CB/FFFFFF?text=Offer';">
                </div>
                <div class="offer-content">
                    <div class="offer-title">${offer.anchor}</div>
                    <div class="offer-info">
                        <div class="offer-points">
                            <img src="https://cdn.jsdelivr.net/gh/lib-devtools/crown@main/s.webp" alt="sc" style="width:20px; height:20px;"> ${offer.robux}
                        </div>
                    </div>
                </div>
            </div>
            <div class="offer-description">${offer.conversion}</div>
            <button class="btn-offer ${isCompleted ? 'btn-disabled' : (hasPendingTimer ? 'processing' : '')}" ${isCompleted ? 'disabled' : ''}>
                <i class="fas fa-${isCompleted ? 'check' : (hasPendingTimer ? 'clock' : 'play')}"></i>
                ${isCompleted ? 'Completed' : (hasPendingTimer ? 'Processing...' : 'Start Task')}
            </button>`;
        
        const btn = card.querySelector('.btn-offer');
        
        if (!isCompleted) {
            btn.addEventListener('click', function() {
                if (window.pendingTimerOffers[offer.id] && window.pendingTimerOffers[offer.id] > Date.now()) {
                    window.open(offer.url, '_blank');
                } else {
                    window.handleApiOfferClick(offer);
                }
            });
        }
        
        container.appendChild(card);
    });
    window.updateApiOffersStatus();
};

window.handleApiOfferClick = function(offer) {
    window.currentApiOffer = offer;
    document.getElementById('api-ad-description').textContent = `Complete this task to earn ${offer.robux} Sweeps Coins: ${offer.conversion}`;
    document.getElementById('api-ad-modal').classList.add('active');
};

window.startOfferTimer = function() {
    if (!window.currentApiOffer) return;
    const offer = window.currentApiOffer;
    
    window.userData.totalOffersAttempted = (window.userData.totalOffersAttempted || 0) + 1;
    window.pendingTimerOffers[offer.id] = Date.now() + OFFER_TIMER_DURATION;
    
    if (offer.url) window.open(offer.url, '_blank');
    
    window.renderApiOffers();
    document.getElementById('api-ad-modal').classList.remove('active');
    
    if (typeof showToast === "function") showToast(`Offer started! Sweeps Coins will be added to your account in 3 minutes.`, 'success', 5000);
    if (typeof saveUserToLocalStorage === "function") saveUserToLocalStorage();
    
    setTimeout(function() {
        if (!window.userData.completedApiOffers.includes(offer.id)) {
            const earned = typeof addPoints === "function" ? addPoints(offer.robux, "api") : offer.robux;
            window.userData.apiOffersEarnings += offer.robux;
            window.userData.completedApiOffers.push(offer.id);
            delete window.pendingTimerOffers[offer.id];
            
            if (typeof saveUserToLocalStorage === "function") saveUserToLocalStorage();
            if (typeof updateAllDisplays === "function") updateAllDisplays();
            window.renderApiOffers();
        }
    }, OFFER_TIMER_DURATION);
    window.currentApiOffer = null;
};

window.updateApiOffersStatus = function() {
    const completed = window.userData.completedApiOffers.length;
    const progress = window.apiOffersData.length > 0 ? (completed / window.apiOffersData.length) * 100 : 0;
    
    const countEl = document.getElementById('completed-offers-count');
    const earningsEl = document.getElementById('api-total-earnings');
    const progressEl = document.getElementById('progress-fill');
    const statusEl = document.getElementById('offer-status');

    if (countEl) countEl.textContent = completed;
    if (earningsEl) earningsEl.textContent = window.userData.apiOffersEarnings;
    if (progressEl) progressEl.style.width = progress + "%";
    if (statusEl) statusEl.style.display = completed > 0 ? 'block' : 'none';
};
