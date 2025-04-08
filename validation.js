export const isIdValid = (id) => typeof id === "number" && Number.isFinite(id);

export const isQuantityValid = (quantity) =>
  typeof quantity === "number" && quantity > 0;

export const isEchangeValid = (briques) =>
  Array.isArray(briques) &&
  briques.every(
    (brique) => isIdValid(brique.id_brique) && isQuantityValid(brique.quantite)
  );

export const isNomEchangeValid = (nom) =>
  typeof nom === "string" && nom.length >= 10 && nom.length <= 100;

/**
 * Valide si une variable texte reçu du client respecte ses critères.
 * @param {*} texte La variable de texte reçu du client.
 * @returns Vrai si le texte est une chaine de caractère qui réponds aux
 * critères du champ de texte.
 */
export const validateTexte = (texte) => {
  return (
    typeof texte === "string" &&
    texte &&
    texte.length >= 5 &&
    texte.length <= 200
  );
};

/**
 * Valide si une variable id reçu du client respecte ses critères.
 * @param {*} texte La variable de id reçu du client.
 * @returns Vrai si le id est un nombre positif valide.
 */
export const validateId = (id) => {
  return (
    typeof id === "number" && id > 0 && !Number.isNaN(id) && Number.isFinite(id)
  );
};

export const validateCourriel = (courriel) => {
  return (
    typeof courriel === "string" &&
    courriel &&
    courriel.match(
      /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/
    )
  );
};

export const validateMotDePasse = (motdepasse) => {
  return typeof motdepasse === "string" && motdepasse && motdepasse.length >= 4;
};
