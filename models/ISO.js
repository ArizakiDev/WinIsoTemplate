const mongoose = require('mongoose');

const ISOSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: function() { return !this.isExternalLink; }
  },
  originalName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: function() { return !this.isExternalLink; }
  },
  fileSize: {
    type: Number,
    required: function() { return !this.isExternalLink; }
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  reported: {
    type: Boolean,
    default: false
  },
  reportReason: {
    type: String,
    default: ''
  },
  isExternalLink: {
    type: Boolean,
    default: false
  },
  externalLink: {
    type: String,
    required: function() { return this.isExternalLink; },
    validate: {
      validator: function(value) {
        if (!this.isExternalLink) return true;
        const urlRegex = /^(https?:\/\/)([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/;
        return urlRegex.test(value);
      },
      message: 'Veuillez fournir un lien valide (commençant par http:// ou https://)'
    }
  }
});

// Vérification que le nom d'utilisateur ne contient pas de liens
ISOSchema.path('username').validate(function(username) {
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
  return !urlRegex.test(username);
}, 'Les liens ne sont pas autorisés dans les noms d\'utilisateur');

module.exports = mongoose.model('ISO', ISOSchema); 