document.addEventListener('DOMContentLoaded', function() {
    // Configuration
    const CONFIG = {
        animationDuration: 250, // ms
        transitionTimeout: 100  // ms pour réduire les lags
    };

    // Système de traduction
    const translator = {
        currentLang: 'fr',
        translations: {
            'fr': {}, // Langue par défaut, pas besoin de traduction
            'en': {
                'Accueil': 'Home',
                'Uploader': 'Upload',
                'Admin': 'Admin',
                'Windows ISO Uploader': 'Windows ISO Uploader',
                'Partagez vos ISO Windows personnalisés avec la communauté': 'Share your custom Windows ISOs with the community',
                'UPLOADER UN ISO': 'UPLOAD AN ISO',
                'ISO Windows disponibles': 'Available Windows ISOs',
                'Aucun ISO n\'a encore été téléchargé. Soyez le premier à contribuer!': 'No ISO has been uploaded yet. Be the first to contribute!',
                'Partagé par': 'Shared by',
                'le': 'on',
                'Télécharger': 'Download',
                'Voir les détails': 'View details',
                'Signaler cet ISO': 'Report this ISO',
                'Windows ISO Uploader est une plateforme pour partager vos ISO Windows personnalisés. Utilisez cette plateforme de manière responsable.': 'Windows ISO Uploader is a platform to share your custom Windows ISOs. Use this platform responsibly.'
            },
            'es': {
                'Accueil': 'Inicio',
                'Uploader': 'Subir',
                'Admin': 'Admin',
                'Windows ISO Uploader': 'Cargador de ISO de Windows',
                'Partagez vos ISO Windows personnalisés avec la communauté': 'Comparte tus ISO de Windows personalizados con la comunidad',
                'UPLOADER UN ISO': 'SUBIR UN ISO',
                'ISO Windows disponibles': 'ISO de Windows disponibles',
                'Aucun ISO n\'a encore été téléchargé. Soyez le premier à contribuer!': 'Aún no se ha subido ningún ISO. ¡Sé el primero en contribuir!',
                'Partagé par': 'Compartido por',
                'le': 'el',
                'Télécharger': 'Descargar',
                'Voir les détails': 'Ver detalles',
                'Signaler cet ISO': 'Reportar este ISO',
                'Windows ISO Uploader est une plateforme pour partager vos ISO Windows personnalisés. Utilisez cette plateforme de manière responsable.': 'Windows ISO Uploader es una plataforma para compartir tus ISO de Windows personalizados. Utiliza esta plataforma de manera responsable.'
            },
            'de': {
                'Accueil': 'Startseite',
                'Uploader': 'Hochladen',
                'Admin': 'Admin',
                'Windows ISO Uploader': 'Windows ISO Uploader',
                'Partagez vos ISO Windows personnalisés avec la communauté': 'Teilen Sie Ihre benutzerdefinierten Windows-ISOs mit der Community',
                'UPLOADER UN ISO': 'ISO HOCHLADEN',
                'ISO Windows disponibles': 'Verfügbare Windows-ISOs',
                'Aucun ISO n\'a encore été téléchargé. Soyez le premier à contribuer!': 'Es wurde noch kein ISO hochgeladen. Seien Sie der Erste, der einen Beitrag leistet!',
                'Partagé par': 'Geteilt von',
                'le': 'am',
                'Télécharger': 'Herunterladen',
                'Voir les détails': 'Details anzeigen',
                'Signaler cet ISO': 'ISO melden',
                'Windows ISO Uploader est une plateforme pour partager vos ISO Windows personnalisés. Utilisez cette plateforme de manière responsable.': 'Windows ISO Uploader ist eine Plattform zum Teilen Ihrer benutzerdefinierten Windows-ISOs. Verwenden Sie diese Plattform verantwortungsvoll.'
            },
            'it': {
                'Accueil': 'Home',
                'Uploader': 'Carica',
                'Admin': 'Admin',
                'Windows ISO Uploader': 'Windows ISO Uploader',
                'Partagez vos ISO Windows personnalisés avec la communauté': 'Condividi le tue ISO Windows personalizzate con la comunità',
                'UPLOADER UN ISO': 'CARICA UN ISO',
                'ISO Windows disponibles': 'ISO Windows disponibili',
                'Aucun ISO n\'a encore été téléchargé. Soyez le premier à contribuer!': 'Nessun ISO è stato ancora caricato. Sii il primo a contribuire!',
                'Partagé par': 'Condiviso da',
                'le': 'il',
                'Télécharger': 'Scarica',
                'Voir les détails': 'Visualizza dettagli',
                'Signaler cet ISO': 'Segnala questo ISO',
                'Windows ISO Uploader est une plateforme pour partager vos ISO Windows personnalisés. Utilisez cette plateforme de manière responsable.': 'Windows ISO Uploader è una piattaforma per condividere le tue ISO Windows personalizzate. Utilizza questa piattaforma in modo responsabile.'
            }
        },

        // Changer de langue
        changeLang: function(lang) {
            if (!this.translations[lang]) return;
            
            this.currentLang = lang;
            this.updatePageContent();
            
            // Mise à jour des classes active
            document.querySelectorAll('.language-option').forEach(el => {
                el.classList.remove('active');
            });
            
            const activeLang = document.querySelector(`.language-option[data-lang="${lang}"]`);
            if (activeLang) activeLang.classList.add('active');
            
            // Sauvegarder la préférence
            localStorage.setItem('preferred_lang', lang);
        },
        
        // Mettre à jour le contenu de la page
        updatePageContent: function() {
            const lang = this.currentLang;
            if (lang === 'fr') return; // Pas besoin de traduire le français (langue par défaut)
            
            const dictionary = this.translations[lang];
            
            // Trouver tous les éléments avec du texte et les traduire
            const textNodes = [];
            const walker = document.createTreeWalker(
                document.body, 
                NodeFilter.SHOW_TEXT, 
                null, 
                false
            );
            
            let node;
            while (node = walker.nextNode()) {
                if (node.nodeValue.trim()) {
                    textNodes.push(node);
                }
            }
            
            textNodes.forEach(node => {
                const text = node.nodeValue.trim();
                if (text && dictionary[text]) {
                    node.nodeValue = node.nodeValue.replace(text, dictionary[text]);
                }
            });
            
            // Traduire les attributs
            document.querySelectorAll('[placeholder], [alt], [title], [value]').forEach(el => {
                ['placeholder', 'alt', 'title', 'value'].forEach(attr => {
                    if (el.hasAttribute(attr)) {
                        const text = el.getAttribute(attr);
                        if (dictionary[text]) {
                            el.setAttribute(attr, dictionary[text]);
                        }
                    }
                });
            });
        }
    };

    // Initialisation du sélecteur de langue
    const initLanguageSelector = () => {
        const languageOptions = document.querySelectorAll('.language-option');
        if (!languageOptions.length) return;
        
        // Charger la langue préférée
        const savedLang = localStorage.getItem('preferred_lang');
        if (savedLang && translator.translations[savedLang]) {
            translator.changeLang(savedLang);
        }
        
        // Ajouter les gestionnaires d'événements aux options de langue
        languageOptions.forEach(option => {
            const lang = option.getAttribute('data-lang') || 'fr';
            option.addEventListener('click', (e) => {
                e.preventDefault();
                translator.changeLang(lang);
            });
        });
    };

    // Optimisation des animations
    const optimizeAnimations = () => {
        // Réduire la durée des transitions pour minimiser les lags
        document.documentElement.style.setProperty('--transition-fast', (CONFIG.animationDuration / 1000) + 's ease-out');
        document.documentElement.style.setProperty('--transition-medium', ((CONFIG.animationDuration * 1.5) / 1000) + 's ease-out');
        
        // Ajouter la classe 'optimized' au body pour activer les optimisations CSS
        document.body.classList.add('optimized-animations');
    };

    // Fermer les notifications après un délai
    const setupNotifications = () => {
        const notifications = document.querySelectorAll('.alert');
        notifications.forEach(notification => {
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => {
                    notification.style.display = 'none';
                }, CONFIG.animationDuration);
            }, 5000);
        });
    };

    // Initialisation
    initLanguageSelector();
    optimizeAnimations();
    setupNotifications();

    // Utiliser requestAnimationFrame pour optimiser les animations
    requestAnimationFrame(() => {
        // Animations lors du scroll avec IntersectionObserver
        animateOnScroll();
        
        // Animation des cartes (optimisée)
        initCardHoverEffects();
        
        // Notification lors du téléchargement
        setupDownloadNotifications();
        
        // Animations des badges
        animateBadges();
        
        // Animation du formulaire d'upload
        setupUploadForm();
    });
});

// Animer les éléments quand ils deviennent visibles lors du scroll
function animateOnScroll() {
    const elements = document.querySelectorAll('.card, .jumbotron, .upload-section, .comment-section, .stat-card');
    
    // Utilisation d'IntersectionObserver pour de meilleures performances
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Ajouter une classe pour l'animation
                entry.target.classList.add('fade-in-up');
                // Arrêter d'observer l'élément une fois animé
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    elements.forEach(element => {
        observer.observe(element);
    });
}

// Effets 3D sur les cartes au survol (optimisés)
function initCardHoverEffects() {
    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
        // Utiliser une variable pour stocker l'ID de l'animation
        let animationId = null;
        
        card.addEventListener('mousemove', function(e) {
            // Annuler l'animation précédente si elle existe
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
            
            // Utiliser requestAnimationFrame pour l'animation
            animationId = requestAnimationFrame(() => {
                const rect = this.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                // Effet réduit pour moins de lag
                const angleY = (x - centerX) / 30;
                const angleX = (centerY - y) / 30;
                
                this.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) scale3d(1.03, 1.03, 1.03)`;
            });
        });
        
        card.addEventListener('mouseleave', function() {
            // Annuler l'animation en cours
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
            
            // Réinitialiser la transformation avec une transition douce
            this.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        });
    });
}

// Notification lors du téléchargement
function setupDownloadNotifications() {
    const downloadButtons = document.querySelectorAll('a[href^="/download/"]');
    
    // Créer le style uniquement si des boutons existent
    if (downloadButtons.length > 0) {
        // Ajouter le style CSS pour la notification
        addNotificationStyles();
        
        downloadButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                // Animation du bouton lors du clic
                this.classList.add('downloading');
                
                // Créer une notification
                const notification = document.createElement('div');
                notification.classList.add('download-notification');
                notification.innerHTML = `
                    <div class="notification-content">
                        <i class="bi bi-download"></i>
                        <p>Téléchargement démarré...</p>
                    </div>
                `;
                
                document.body.appendChild(notification);
                
                // Animer l'apparition avec requestAnimationFrame
                requestAnimationFrame(() => {
                    notification.classList.add('show');
                });
                
                // Supprimer après un délai
                setTimeout(() => {
                    notification.classList.remove('show');
                    setTimeout(() => {
                        notification.remove();
                    }, 300);
                }, 3000);
            });
        });
    }
}

// Ajouter les styles de notification une seule fois
function addNotificationStyles() {
    // S'assurer que les styles ne sont pas ajoutés plusieurs fois
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .download-notification {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: var(--primary);
                color: white;
                padding: 15px 20px;
                border-radius: 10px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                transform: translateY(100px);
                opacity: 0;
                transition: all 0.3s ease;
                z-index: 9999;
                will-change: transform, opacity;
            }
            
            .download-notification.show {
                transform: translateY(0);
                opacity: 1;
            }
            
            .notification-content {
                display: flex;
                align-items: center;
            }
            
            .notification-content i {
                font-size: 1.5rem;
                margin-right: 10px;
                animation: bounce 1.5s infinite;
                will-change: transform;
            }
            
            @keyframes bounce {
                0%, 20%, 50%, 80%, 100% {
                    transform: translateY(0);
                }
                40% {
                    transform: translateY(-10px);
                }
                60% {
                    transform: translateY(-5px);
                }
            }
            
            .downloading {
                animation: pulse 1s infinite;
                will-change: transform;
            }
            
            @keyframes pulse {
                0% {
                    transform: scale(1);
                }
                50% {
                    transform: scale(1.05);
                }
                100% {
                    transform: scale(1);
                }
            }
        `;
        
        document.head.appendChild(style);
    }
}

// Animation des badges
function animateBadges() {
    // Vérifier s'il y a des badges avant d'ajouter les styles
    const badges = document.querySelectorAll('.badge');
    
    if (badges.length > 0) {
        badges.forEach(badge => {
            badge.classList.add('badge-animated');
        });
        
        // Ajouter le style CSS pour l'animation des badges
        if (!document.getElementById('badge-styles')) {
            const style = document.createElement('style');
            style.id = 'badge-styles';
            style.textContent = `
                .badge-animated {
                    position: relative;
                    overflow: hidden;
                }
                
                .badge-animated::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                    animation: badgeShine 3s infinite;
                    will-change: transform;
                }
                
                @keyframes badgeShine {
                    0% {
                        left: -100%;
                    }
                    20% {
                        left: 100%;
                    }
                    100% {
                        left: 100%;
                    }
                }
            `;
            
            document.head.appendChild(style);
        }
    }
}

// Animation du formulaire d'upload
function setupUploadForm() {
    const uploadForm = document.querySelector('form[action="/upload"]');
    
    if (uploadForm) {
        const inputs = uploadForm.querySelectorAll('input, textarea');
        
        // Animation séquentielle des éléments du formulaire
        inputs.forEach((input, index) => {
            // Animation d'entrée des champs du formulaire
            input.style.opacity = "0";
            input.style.transform = "translateY(20px)";
            
            setTimeout(() => {
                requestAnimationFrame(() => {
                    input.style.transition = "all 0.4s ease";
                    input.style.opacity = "1";
                    input.style.transform = "translateY(0)";
                });
            }, 50 * (index + 1)); // Délai réduit et échelonné
            
            // Effet de focus
            input.addEventListener('focus', function() {
                this.parentElement.classList.add('input-focused');
            });
            
            input.addEventListener('blur', function() {
                this.parentElement.classList.remove('input-focused');
            });
        });
        
        // Ajouter le style CSS pour l'animation du focus
        if (!document.getElementById('form-styles')) {
            const style = document.createElement('style');
            style.id = 'form-styles';
            style.textContent = `
                .input-focused {
                    transform: translateX(5px);
                }
                
                .input-focused label {
                    color: var(--primary);
                    font-weight: bold;
                }
            `;
            
            document.head.appendChild(style);
        }
    }
} 