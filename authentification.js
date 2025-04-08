import { compare } from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import {
  getUtilisateurByCourriel,
  getUtilisateurById,
} from "./model/utilisateur.js";

const config = {
  usernameField: "courriel",
  passwordField: "mot_de_passe",
};

// Fonction de stratégie de passeport pour obtenir le jeton et vérifier l'identité
passport.use(
  new Strategy(config, async (courriel, motdepasse, done) => {
    try {
      const utilisateur = await getUtilisateurByCourriel(courriel);

      if (!utilisateur) {
        return done(null, false, { erreur: "mauvais_courriel" });
      }

      const valide = await compare(motdepasse, utilisateur.mot_de_passe);

      if (!valide) {
        return done(null, false, { erreur: "mauvais_motdepasse" });
      }

      return done(null, utilisateur);
    } catch (erreur) {
      return done(erreur);
    }
  })
);

passport.serializeUser((utilisateur, done) => {
  done(null, utilisateur.id_utilisateur);
});

passport.deserializeUser(async (idUtilisateur, done) => {
  try {
    const utilisateur = await getUtilisateurById(idUtilisateur);
    done(null, utilisateur);
  } catch (erreur) {
    done(erreur);
  }
});
