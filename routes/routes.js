const admin = require("firebase-admin");
const serviceAccount = require("../config/firebase-key");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://registro-conferencias.firebaseio.com"
});
const db = admin.firestore();

module.exports = (app) => {
    app.get('/', (req, res) => {
        res.render('landing');
    });
    app.get('/participantes', async (req, res) => {
        const conferencias = await db.collection('conferencias').listDocuments();
        const data = await readConferences(db.collection('conferencias'), conferencias.map(e => e.id));
        console.log(data);
        res.render('participantes', {
            data
        });
    });
    app.get('/registrar-participantes', async (req, res) => {
        const dia1 = await db.collection('conferencias').where('day', '==', '1').get();
        let day1 = dia1.docs.map(e => {
            return e.id;
        });
        const dia2 = await db.collection('conferencias').where('day', '==', '2').get();
        let day2 =  dia2.docs.map(e => {
            return e.id;
        });
        res.render('registrar-participantes', {
            conferencias: {day1, day2},
            registerMsg: req.flash('registerMsg'),
            registerMsgType: req.flash('registerMsgType')
        });
    });
    app.post('/registrar-participantes', async (req, res) => {
        try {
            const userData = await db.doc(`participantes/${req.body.email}`).get();
            if (userData.exists) {
                req.flash('registerMsg', 'El participante ya está registrado.');
                req.flash('registerMsgType', '1');
                return res.redirect('/registrar-participantes');
            } else {
                db.doc(`participantes/${req.body.email}`).set(req.body);
                req.flash('registerMsg', 'Participante registrado.');
                req.flash('registerMsgType', '2');
                return res.redirect('/registrar-participantes');
            }
        } catch (e) {
            req.flash('registerMsg', 'Hubo un error.');
            req.flash('registerMsgType', '1');
            console.log(e);
            return res.redirect('/registrar-participantes');
        }
    });
};

const readConferences = async (collection, ids) => {
  const reads = ids.map(id => collection.doc(id).get());
  const result = await Promise.all(reads);
  const finalList = [];
  result.forEach(v => {
    finalList.push([v.id, v.data().participants.split(',')]);
  });
  return finalList;
};