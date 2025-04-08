// Chargement du fichier de configuration
import "dotenv/config";

// Importations
import { readFile } from "node:fs/promises";
import express, { json } from "express";
import helmet from "helmet";
import https from "node:https";
import compression from "compression";
import cors from "cors";
import session from "express-session";
import memorystore from "memorystore";
import passport from "passport";
import exphbs from "express-handlebars";
import {
  addToEchange,
  createEchange,
  deleteEchangeById,
  getEchangeById,
  getEchanges,
  getEchangesByUtilisateur,
  isExchangeValidById,
} from "./model/echange.js";
import { getBriques } from "./model/briques.js";
import {
  isEchangeValid,
  isIdValid,
  isNomEchangeValid,
  validateCourriel,
  validateMotDePasse,
  validateTexte,
} from "./validation.js";
import { createUtilisateur, getUtilisateurByCourriel } from "./model/utilisateur.js";
import "./authentification.js";
import {
  auth,
  userConnected,
  userNotConnected,
} from "./middleware/utilisateur.js";
import {
  acceptProposition,
  addToProposition,
  createProposition,
  getPropositionsByEchange,
  getProposotionById,
} from "./model/propostion.js";
// Création du serveur web
const app = express();

// Création de la base de données de session
const MemoryStore = memorystore(session);

// Ajout de l'engin de rendu
app.engine(
  "handlebars",
  exphbs.engine({
    helpers: {
      neq: function (a, b, options) {
        return a !== b;
      },
    },
  })
);
app.set("view engine", "handlebars");
app.set("views", "./views");

// Ajout de middlewares
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(json());
app.use(
  session({
    cookie: { maxAge: 3600000 },
    name: process.env.npm_package_name,
    store: new MemoryStore({ checkPeriod: 3600000 }),
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static("public"));

// Programmation des routes
app.get("/", async (request, response) => {
  response.render("echanges", {
    titre: "Liste des échanges | Brique Échange",
    styles: ["/css/echanges.css"],
    echanges: await getEchanges(),
    user: request.user,
  });
});

// connexion voir l'itinéraire
app.get("/seconnecter", userNotConnected, async (request, response) => {
  response.render("seconnector", {
    titre: "Se Connecter",
    styles: ["/css/utilisateur.css"],
    scripts: ["/js/seconnecter.js"],
  });
});

// s'inscrire voir l'itinéraire
app.get("/registre", userNotConnected, async (request, response) => {
  response.render("registre", {
    titre: "Registre",
    styles: ["/css/utilisateur.css"],
    scripts: ["/js/registre.js"],
  });
});

// itinéraire d'affichage du profil utilisateur
app.get("/utilisateur", auth, async (request, response) => {
  response.render("utilisateur", {
    titre: "Profil | Brique Échange",
    styles: ["/css/echanges.css"],
    scripts: ["/js/utilisateur.js"],
    user: request.user,
    echanges: await getEchangesByUtilisateur(request.user.id_utilisateur),
  });
});

// création d'une nouvelle page d'affichage des échanges avec passage des briques et des données utilisateurss
app.get("/echange", auth, async (request, response) => {
  response.render("new-echange", {
    titre: "Créer un échange | Brique Échange",
    styles: ["/css/new-echange.css", "/css/exchanges.css"],
    scripts: ["/js/new-echange.js"],
    briques: await getBriques(),
    user: request.user,
  });
});

// création d'une nouvelle proposition de page de visualisation d'échange avec transmission des briques, des données utilisateur et d'échange
app.get("/proposition/:id", auth, async (request, response) => {
  response.render("new-proposition", {
    titre: "Créer une proposition | Brique Proposition",
    styles: ["/css/new-echange.css"],
    scripts: ["/js/new-proposition.js"],
    briques: await getBriques(),
    echange: request.params.id,
    user: request.user,
  });
});

// voir la proposition d'échange
app.get("/voir-proposition/:id", auth, async (request, response) => {

  
  const echangeId = parseInt(request.params.id);
  if (!isIdValid(echangeId)) {
    return response.status(400).end();
  }

  // vérifier si l'identifiant d'échange est valide ou non
  const echange = await getEchangeById(echangeId);
  if (!echange) {
    return response.status(404).end();
  }

  response.render("propositions", {
    titre: "Liste des propositions | Brique Proposition",
    styles: ["/css/echanges.css"],
    propositions: await getPropositionsByEchange(echangeId),
    echange: echange,
    user: request.user,
  });
});

app.get("/echange-proposition/:id", auth, async (request, response) => {
  const propositionId = parseInt(request.params.id);
  if (!isIdValid(propositionId)) {
    return response.status(400).end();
  }

  // vérifier si l'identifiant de la proposition est valide ou non
  const proposition = await getProposotionById(propositionId);
  if (!proposition) {
    return response.status(404).end();
  }

  const echange = await getEchangeById(proposition.id_echange);

  response.render("proposition", {
    titre: "Échange | Brique Échange",
    styles: ["/css/echange.css","/css/echanges.css"],
    scripts: ["/js/proposition.js"],
    proposition: proposition,
    echange: echange,
    user: request.user,
  });
});

// obtenir le détail d'un seul échange
app.get("/echange/:id", auth, async (request, response) => {
  const echangeId = parseInt(request.params.id);
  if (!isIdValid(echangeId)) {
    return response.status(400).end();
  }

 // vérifier si l'identifiant d'échange est valide ou non
  const echange = await getEchangeById(echangeId);
  if (!echange) {
    return response.status(404).end();
  }

  response.render("echange", {
    titre: "Échange | Brique Échange",
    styles: ["/css/echange.css","/css/echanges.css"],
    echange: echange,
    user: request.user,
  });
});

// créer une API d'échange avec validation
app.post("/api/echange", userConnected, async (request, response) => {
  if (
    isNomEchangeValid(request.body.nom) &&
    isEchangeValid(request.body.briques)
  ) {
    const idEchange = await createEchange(
      request.user.id_utilisateur,
      request.body.nom
    );
    Promise.all(
      request.body.briques.map(({ id_brique, quantite }) =>
        addToEchange(idEchange, id_brique, quantite)
      )
    );
    response.status(201).end();
  } else {
    response.status(400).end();
  }
});

// créer une API de proposition avec validation
app.post("/api/proposition", userConnected, async (request, response) => {
  if (
    isIdValid(Number(request.body.echange)) &&
    isEchangeValid(request.body.briques)
  ) {
    const idProposition = await createProposition(
      request.user.id_utilisateur,
      request.body.echange
    );
    Promise.all(
      request.body.briques.map(({ id_brique, quantite }) =>
        addToProposition(idProposition, id_brique, quantite)
      )
    );
    response.status(201).end();
  } else {
    response.status(400).end();
  }
});

// accepter l'API de proposition
app.post(
  "/api/acceptor-proposition",
  userConnected,
  async (request, response, next) => {
    const propositionId = parseInt(request.body.propoositionId);
    if (!isIdValid(propositionId)) {
      return response.status(400).end();
    }

    const proposition = await getProposotionById(propositionId);
    if (!proposition) {
      return response.status(404).end();
    }

    await acceptProposition(proposition.id_echange);

    response.status(201).end();
  }
);

// enregistrer l'API utilisateur
app.post("/api/registre", userNotConnected, async (request, response) => {
  if (
    validateCourriel(request.body.courriel) &&
    validateTexte(request.body.pre_nom) &&
    validateTexte(request.body.nom_de_famille) &&
    validateMotDePasse(request.body.mot_de_passe)
  ) {
    try {

      // vérifier si l'e-mail existe actuellement
      const utilisateur = await getUtilisateurByCourriel(request.body.courriel);
      if(utilisateur){
        response.status(400).json({erreur: "Le compte existe déjà, veuillez utiliser un autre compte"}).end();
      }
      await createUtilisateur(request.body);

      response.status(201).end();
    } catch (erreur) {
      if (erreur.code === "SQLITE_CONSTRAINT") {
        response.status(409).end();
      } else {
        response.status(400).end();
      }
    }
  } else {
    response.status(400).json({erreur: "Veuillez entrer des valeurs valides dans les champs"}).end();
  }
});

// API de connexion avec passeport
app.post(
  "/api/seconnecter",
  userNotConnected,
  async (request, response, next) => {
    if (
      validateCourriel(request.body.courriel) &&
      validateMotDePasse(request.body.mot_de_passe)
    ) {
      passport.authenticate("local", (erreur, utilisateur, info) => {
        if (erreur) {
          next(erreur);
        } else if (!utilisateur) {
          response.status(401).json(info);
        } else {
          request.logIn(utilisateur, (erreur) => {
            if (erreur) {
              next(erreur);
            }

            response.status(200).end();
          });
        }
      })(request, response, next);
    } else {
      response.status(400).end();
    }
  }
);

// API de déconnexion avec la déconnexion du passeport
app.post("/api/deconnexion", userConnected, (request, response, next) => {
  request.logOut((erreur) => {
    if (erreur) {
      next(erreur);
    }

    response.redirect("/");
  });
});

// supprimer l'API d'échange
app.delete("/api/echange", async (request, response) => {
  if (
    isIdValid(request.body.echangeId) &&
    isExchangeValidById(request.body.echangeId)
  ) {
    deleteEchangeById(request.body.echangeId);
    response.status(200).end();
  } else {
    response.status(400).end();
  }
});

const credentials = {
  key: await readFile("./security/localhost.key"),
  cert: await readFile("./security/localhost.cert"),
};

console.log("Serveur démarré: ");
console.log("https://localhost:" + process.env.PORT);
https.createServer(credentials, app).listen(process.env.PORT);
