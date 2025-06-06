const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  isoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ISO',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// Vérification que le nom d'utilisateur ne contient pas de liens
CommentSchema.path('username').validate(function(username) {
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
  return !urlRegex.test(username);
}, 'Les liens ne sont pas autorisés dans les noms d\'utilisateur');

module.exports = mongoose.model('Comment', CommentSchema); 