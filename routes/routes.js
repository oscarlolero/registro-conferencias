//DO NOT USE THESE ROUTES FOR PRODUCTION. HIGH VULNERABILITY
const admin = require("firebase-admin");
const serviceAccount = require("../config/firebase-key");
//LLAVE EXPUESTA EN GITHUB DEBIDO A QUE NO ES UN PROYECTO PRIVADO
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://registro-conferencias.firebaseio.com"
});
const db = admin.firestore();

module.exports = (app) => {
    app.post('/login', (req, res) => {
        console.log(req.body)
        if(req.body.name === 'admin' && req.body.password === '1234') {
            res.redirect('admin');
        } else {
            res.render('login', {
                error: 1
            });
        }

    });
    app.get('/admin', (req, res) => {
        res.render('landing');
    });
    app.get('/conferencias', async (req, res) => {
        const conferencias = await db.collection('conferencias').listDocuments();
        const data = await readConferences(db.collection('conferencias'), conferencias.map(e => e.id));
        let day1 = [], day2 = [];
        for(let i = 0; i < data.length; i++) {
            if(data[i][2] === '1') {
                day1.push([data[i][0],data[i][2]]);
            } else if(data[i][2] === '2') {
                day2.push([data[i][0],data[i][2]]);
            }
        }
        res.render('conferences', {
            data: {
                day1,
                day2
            }
        });
    });
    app.get('/participantes', async (req, res) => {
        const conferencias = await db.collection('conferencias').listDocuments();
        const data = await readConferences(db.collection('conferencias'), conferencias.map(e => e.id));
        res.render('participantes', {
            data
        });
    });
    app.get('/login', async (req, res) => {
        res.render('login', {
            error: 0
        });
    });
    app.get('/participante', async (req, res) => {
        res.render('landing2');
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
                await db.doc(`participantes/${req.body.email}`).set({
                    name: req.body.name,
                    age: req.body.age,
                    email: req.body.email
                });
                console.log(req.body.day1);
                console.log(req.body.day2);
                for(let i = 0; i < req.body.day1.length; i++) {
                    if(req.body.day1[i] !== '0') {
                        const actualParticipants = await db.doc(`conferencias/${req.body.day1[i]}`).get();
                        let finalParticipants = [];
                        if(actualParticipants.data().participants !== '') {
                            finalParticipants = actualParticipants.data().participants.split(',');
                        }
                        finalParticipants.push(req.body.name);
                        await db.doc(`conferencias/${req.body.day1[i]}`).update({participants: finalParticipants.toString()});
                    }
                }
                for(let i = 0; i < req.body.day2.length; i++) {
                    if(req.body.day2[i] !== '0') {
                        const actualParticipants = await db.doc(`conferencias/${req.body.day2[i]}`).get();
                        let finalParticipants = [];
                        if(actualParticipants.data().participants !== '') {
                            finalParticipants = actualParticipants.data().participants.split(',');
                        }
                        finalParticipants.push(req.body.name);
                        await db.doc(`conferencias/${req.body.day2[i]}`).update({participants: finalParticipants.toString()});
                    }
                }
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

    app.post('/edit-conference', async (req, res) => {
        const [type, conference] = [req.body.type, req.body.conference];
        if(type === 'delete') {
            await db.doc(`conferencias/${conference}`).delete();
            res.send('done');
        } else if(type === 'add') {
            await db.doc(`conferencias/${conference}`).set({
                day: `${req.body.day}`,
                participants: ""
            });
            res.send('done');
        }else if(type === 'edit') {
            const oldDoc = await db.doc(`conferencias/${req.body.old_name}`).get();
            db.doc(`conferencias/${req.body.old_name}`).delete();
            await db.doc(`conferencias/${req.body.new_name}`).set(oldDoc.data());
            res.send('done');
        }
    });
};

const readConferences = async (collection, ids) => {
  const reads = ids.map(id => collection.doc(id).get());
  const result = await Promise.all(reads);
  const finalList = [];
  result.forEach(v => {
    finalList.push([v.id, v.data().participants.split(','), v.data().day]);
  });
  return finalList;
};
