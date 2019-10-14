const LocalStrategy = require('passport-local').Strategy;
const dbConfig = require('../config/db');
const db = dbConfig.db;
module.exports = (passport) => {
    passport.serializeUser((user, done) => {
        done(null, user);
    });

    passport.deserializeUser((user, done) => {
        done(null, user);
    });

    passport.use('local-login', new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true
    }, function(req, username, inPassword, done) {
        db.doc(`admins/${username}`).get().then((userData) => {
            if(userData.exists) {
                if(userData.data().password === inPassword) {
                    console.log('Contraseña correcta')
                } else {
                    return done(null, false, req.flash('loginMessage', 'Contraseña incorrecta.'));
                }
            } else {
                return done(null, false, req.flash('loginMessage', 'El usuario no existe.'));
            }
            done(null, userData.data().name);
        });
    }));
};