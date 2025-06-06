// Importation des modules
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');

// Importation de la configuration
const config = require('./config.json');

// Initialisation d'Express
const app = express();

// Connexion à MongoDB
mongoose.connect(config.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connecté'))
.catch(err => console.error('Erreur de connexion MongoDB:', err));

// Configuration de EJS
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(session({
    secret: config.cookieSecret,
    resave: false,
    saveUninitialized: true
}));
app.use(flash());

// Middleware flash messages
app.use((req, res, next) => {
    res.locals.messages = {
        success: req.flash('success'),
        error: req.flash('error')
    };
    next();
});

// Variable globale pour le chemin actuel
app.use((req, res, next) => {
    res.locals.path = req.path;
    next();
});

// Importation des modèles
const ISO = require('./models/ISO');
const Comment = require('./models/Comment');

// Création du dossier d'upload s'il n'existe pas
if (!fs.existsSync(config.uploadDir)){
    fs.mkdirSync(config.uploadDir, { recursive: true });
}

// Configuration de Multer pour les uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, config.uploadDir);
    },
    filename: (req, file, cb) => {
        // Génération d'un nom de fichier unique
        const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Filtre pour n'accepter que les fichiers ISO
const fileFilter = (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (config.allowedExtensions.includes(extension)) {
        cb(null, true);
    } else {
        cb(new Error('Type de fichier non autorisé. Seuls les fichiers .iso sont acceptés.'), false);
    }
};

// Configuration des limites de taille
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: config.maxFileSize // 5GB
    }
});

// Middleware personnalisé pour gérer l'upload avec le type (fichier ou lien)
const handleUpload = (req, res, next) => {
    // Si c'est un lien externe, skip multer
    if (req.body.upload_type === 'link') {
        return next();
    }
    
    // Sinon, utiliser multer pour l'upload de fichier
    upload.single('iso')(req, res, next);
};

// Middleware pour vérifier l'authentification admin
const isAuthenticated = (req, res, next) => {
    if (req.session.isAdmin) {
        return next();
    }
    res.redirect('/admin');
};

// Routes principales

// Page d'accueil - Liste des ISO
app.get('/', async (req, res) => {
    try {
        const isos = await ISO.find().sort({ uploadDate: -1 });
        res.render('index', { isos });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Une erreur est survenue lors du chargement des fichiers ISO');
        res.render('index', { isos: [] });
    }
});

// Page d'upload
app.get('/upload', (req, res) => {
    res.render('upload');
});

// Traitement de l'upload
app.post('/upload', async (req, res, next) => {
    // Récupérer le content-type pour détecter si c'est un formulaire multipart
    const contentType = req.headers['content-type'] || '';
    const isMultipart = contentType.startsWith('multipart/form-data');
    
    // Pour les formulaires non-multipart (liens externes), traiter directement
    if (!isMultipart) {
        // Pour les liens, analyser le corps de la requête
        express.urlencoded({ extended: true })(req, res, () => {
            // Continuer le traitement
            next();
        });
    } else {
        // Pour les fichiers, utiliser multer
        upload.single('iso')(req, res, (err) => {
            if (err) {
                if (err instanceof multer.MulterError) {
                    if (err.code === 'LIMIT_FILE_SIZE') {
                        req.flash('error', 'Fichier trop volumineux. La taille maximale est de 5GB.');
                    } else {
                        req.flash('error', `Erreur d'upload: ${err.message}`);
                    }
                    return res.redirect('/upload');
                }
                return next(err);
            }
            next();
        });
    }
}, async (req, res) => {
    try {
        // Validation du nom d'utilisateur (pas de liens)
        const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
        if (urlRegex.test(req.body.username)) {
            if (req.file) {
                try {
                    // Supprimer le fichier si le nom d'utilisateur est invalide
                    fs.unlinkSync(path.join(config.uploadDir, req.file.filename));
                } catch (e) {
                    console.error('Erreur lors de la suppression du fichier temporaire:', e);
                }
            }
            req.flash('error', 'Les liens ne sont pas autorisés dans les noms d\'utilisateur');
            return res.redirect('/upload');
        }
        
        // Déterminer si c'est un fichier ou un lien externe
        const isExternalLink = req.body.upload_type === 'link';
        
        // Création d'un nouvel ISO dans la base de données
        let newISO;
        
        if (isExternalLink) {
            // Validation du lien
            const externalLink = req.body.externalLink;
            if (!externalLink || !/^https?:\/\//.test(externalLink)) {
                req.flash('error', 'Veuillez fournir un lien valide commençant par http:// ou https://');
                return res.redirect('/upload');
            }
            
            // Création d'un ISO avec lien externe
            newISO = new ISO({
                originalName: path.basename(externalLink) || 'ISO Externe',
                description: req.body.description,
                username: req.body.username,
                isExternalLink: true,
                externalLink: externalLink
            });
        } else {
            // Vérifier que le fichier a bien été envoyé
            if (!req.file) {
                req.flash('error', 'Veuillez sélectionner un fichier ISO à uploader');
                return res.redirect('/upload');
            }
            
            // Création d'un ISO avec fichier
            newISO = new ISO({
                fileName: req.file.filename,
                originalName: req.file.originalname,
                description: req.body.description,
                username: req.body.username,
                filePath: path.join(config.uploadDir, req.file.filename),
                fileSize: req.file.size
            });
        }
        
        await newISO.save();
        
        req.flash('success', isExternalLink 
            ? 'Votre lien ISO a été ajouté avec succès' 
            : 'Votre ISO a été uploadé avec succès');
        res.redirect('/');
    } catch (err) {
        // Si une erreur survient et qu'un fichier a été uploadé, le supprimer
        if (req.file) {
            try {
                fs.unlinkSync(path.join(config.uploadDir, req.file.filename));
            } catch (e) {
                console.error('Erreur lors de la suppression du fichier temporaire:', e);
            }
        }
        
        console.error('Erreur lors de l\'upload:', err);
        req.flash('error', 'Une erreur est survenue lors de l\'upload');
        res.redirect('/upload');
    }
});

// Page de détail d'un ISO
app.get('/iso/:id', async (req, res) => {
    try {
        const iso = await ISO.findById(req.params.id);
        if (!iso) {
            req.flash('error', 'ISO non trouvé');
            return res.redirect('/');
        }
        
        // Récupération des commentaires
        const comments = await Comment.find({ isoId: iso._id }).sort({ date: -1 });
        
        // Récupération d'ISO similaires
        const relatedIsos = await ISO.find({ _id: { $ne: iso._id } }).limit(5);
        
        res.render('iso-detail', { iso, comments, relatedIsos });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Une erreur est survenue');
        res.redirect('/');
    }
});

// Téléchargement d'un ISO
app.get('/download/:id', async (req, res) => {
    try {
        const iso = await ISO.findById(req.params.id);
        if (!iso) {
            req.flash('error', 'ISO non trouvé');
            return res.redirect('/');
        }
        
        // Si c'est un lien externe, rediriger vers le lien
        if (iso.isExternalLink) {
            return res.redirect(iso.externalLink);
        }
        
        // Sinon télécharger le fichier
        res.download(iso.filePath, iso.originalName);
    } catch (err) {
        console.error(err);
        req.flash('error', 'Une erreur est survenue lors du téléchargement');
        res.redirect('/');
    }
});

// Ajout d'un commentaire
app.post('/comment/:id', async (req, res) => {
    try {
        const iso = await ISO.findById(req.params.id);
        if (!iso) {
            req.flash('error', 'ISO non trouvé');
            return res.redirect('/');
        }
        
        // Validation du nom d'utilisateur (pas de liens)
        const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
        if (urlRegex.test(req.body.username)) {
            req.flash('error', 'Les liens ne sont pas autorisés dans les noms d\'utilisateur');
            return res.redirect(`/iso/${req.params.id}`);
        }
        
        // Création d'un nouveau commentaire
        const newComment = new Comment({
            isoId: iso._id,
            username: req.body.username,
            content: req.body.content
        });
        
        await newComment.save();
        
        req.flash('success', 'Commentaire ajouté avec succès');
        res.redirect(`/iso/${req.params.id}`);
    } catch (err) {
        console.error(err);
        req.flash('error', 'Une erreur est survenue lors de l\'ajout du commentaire');
        res.redirect(`/iso/${req.params.id}`);
    }
});

// Signalement d'un ISO
app.post('/report/:id', async (req, res) => {
    try {
        const iso = await ISO.findById(req.params.id);
        if (!iso) {
            req.flash('error', 'ISO non trouvé');
            return res.redirect('/');
        }
        
        // Mise à jour de l'ISO pour le marquer comme signalé
        iso.reported = true;
        iso.reportReason = req.body.reason;
        await iso.save();
        
        req.flash('success', 'Merci pour votre signalement. Un administrateur l\'examinera bientôt.');
        res.redirect(`/iso/${req.params.id}`);
    } catch (err) {
        console.error(err);
        req.flash('error', 'Une erreur est survenue lors du signalement');
        res.redirect(`/iso/${req.params.id}`);
    }
});

// Routes d'administration

// Page de connexion admin
app.get('/admin', (req, res) => {
    // Si déjà connecté, rediriger vers le dashboard
    if (req.session.isAdmin) {
        return res.redirect('/admin/dashboard');
    }
    res.render('admin/login', { layout: false });
});

// Authentification admin
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    // Vérification des identifiants
    if (username === config.admin.username && password === config.admin.password) {
        req.session.isAdmin = true;
        req.flash('success', 'Connexion réussie');
        res.redirect('/admin/dashboard');
    } else {
        res.render('admin/login', { 
            layout: false, 
            error: 'Identifiants incorrects'
        });
    }
});

// Tableau de bord admin
app.get('/admin/dashboard', isAuthenticated, async (req, res) => {
    try {
        // Statistiques
        const totalIsos = await ISO.countDocuments();
        const totalReports = await ISO.countDocuments({ reported: true });
        const totalComments = await Comment.countDocuments();
        
        // Pour simplifier, on n'a pas de compteur de téléchargements
        // Dans une vraie application, on pourrait ajouter un champ pour cela
        const totalDownloads = 0;
        
        // Récupération des ISO récents
        const recentIsos = await ISO.find().sort({ uploadDate: -1 }).limit(5);
        
        res.render('admin/dashboard', {
            layout: false,
            admin: config.admin.username,
            stats: {
                totalIsos,
                totalReports,
                totalComments,
                totalDownloads
            },
            recentIsos,
            reportCount: totalReports
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Une erreur est survenue');
        res.redirect('/admin');
    }
});

// Page des signalements
app.get('/admin/reports', isAuthenticated, async (req, res) => {
    try {
        // Récupération des ISO signalés
        const reports = await ISO.find({ reported: true }).sort({ uploadDate: -1 });
        const reportCount = reports.length;
        
        res.render('admin/reports', {
            layout: false,
            admin: config.admin.username,
            reports,
            reportCount
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Une erreur est survenue');
        res.redirect('/admin/dashboard');
    }
});

// Supprimer un ISO (admin)
app.post('/admin/delete/:id', isAuthenticated, async (req, res) => {
    try {
        const iso = await ISO.findById(req.params.id);
        if (!iso) {
            req.flash('error', 'ISO non trouvé');
            return res.redirect('/admin/dashboard');
        }
        
        // Supprimer le fichier physique seulement s'il ne s'agit pas d'un lien externe
        if (!iso.isExternalLink && iso.filePath) {
            try {
                fs.unlinkSync(iso.filePath);
            } catch (err) {
                console.error('Erreur lors de la suppression du fichier:', err);
                // Continuer même si le fichier ne peut pas être supprimé
            }
        }
        
        // Supprimer les commentaires associés
        await Comment.deleteMany({ isoId: iso._id });
        
        // Supprimer l'ISO de la base de données
        await ISO.findByIdAndDelete(req.params.id);
        
        req.flash('success', 'ISO supprimé avec succès');
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Une erreur est survenue lors de la suppression');
        res.redirect('/admin/dashboard');
    }
});

// Ignorer un signalement
app.post('/admin/dismiss-report/:id', isAuthenticated, async (req, res) => {
    try {
        const iso = await ISO.findById(req.params.id);
        if (!iso) {
            req.flash('error', 'ISO non trouvé');
            return res.redirect('/admin/reports');
        }
        
        // Mettre à jour l'ISO pour enlever le signalement
        iso.reported = false;
        iso.reportReason = '';
        await iso.save();
        
        req.flash('success', 'Signalement ignoré avec succès');
        res.redirect('/admin/reports');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Une erreur est survenue');
        res.redirect('/admin/reports');
    }
});

// Tous les ISO (admin)
app.get('/admin/isos', isAuthenticated, async (req, res) => {
    try {
        const isos = await ISO.find().sort({ uploadDate: -1 });
        const reportCount = await ISO.countDocuments({ reported: true });
        
        res.render('admin/isos', {
            layout: false,
            admin: config.admin.username,
            isos,
            reportCount
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Une erreur est survenue');
        res.redirect('/admin/dashboard');
    }
});

// Déconnexion admin
app.get('/admin/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/admin');
    });
});

// Middleware 404
app.use((req, res) => {
    res.status(404).render('404');
});

// Démarrage du serveur
const PORT = process.env.PORT || config.port;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
