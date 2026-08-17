// Randonner VAR — découverte automatique des randonnées
// Lit randonnees.json (liste ordonnée de dossiers), puis un rando.json par dossier.
// Chaque rando.json : { "titre": "...", "vignette": "...", "visite": "...",
//                        "kml": "...", "gpx": "...", "distance": "...",
//                        "duree": "...", "denivele": "..." }
// distance / duree / denivele sont optionnels.

(async function () {
  const conteneur = document.getElementById('liste-randonnees');
  const etat = document.getElementById('etat-chargement');
  const tpl = document.getElementById('tpl-carte');

  function viderEtat() {
    if (etat && etat.parentNode) etat.remove();
  }

  function afficherMessage(texte, classe) {
    viderEtat();
    const p = document.createElement('p');
    p.className = classe;
    p.textContent = texte;
    conteneur.appendChild(p);
  }

  function construireMeta(rando) {
    const morceaux = [];
    if (rando.distance) morceaux.push(rando.distance);
    if (rando.duree) morceaux.push(rando.duree);
    if (rando.denivele) morceaux.push('D+ ' + rando.denivele);
    return morceaux.join('  ·  ');
  }

  function creerCarte(dossier, rando) {
    const noeud = tpl.content.cloneNode(true);
    const visiteHref = dossier + '/' + rando.visite;

    const lienImg = noeud.querySelector('[data-role="visite-lien"]');
    lienImg.href = visiteHref;
    lienImg.setAttribute('aria-label', 'Ouvrir la visite : ' + rando.titre);

    const img = noeud.querySelector('[data-role="vignette"]');
    img.src = dossier + '/' + rando.vignette;
    img.alt = rando.titre;

    noeud.querySelector('[data-role="titre"]').textContent = rando.titre;

    const meta = noeud.querySelector('[data-role="meta"]');
    const texteMeta = construireMeta(rando);
    if (texteMeta) {
      meta.textContent = texteMeta;
    } else {
      meta.remove();
    }

    const lienVisite = noeud.querySelector('[data-role="visite-lien-2"]');
    lienVisite.href = visiteHref;

    const lienKml = noeud.querySelector('[data-role="kml-lien"]');
    if (rando.kml) {
      lienKml.href = dossier + '/' + rando.kml;
    } else {
      lienKml.remove();
    }

    const lienGpx = noeud.querySelector('[data-role="gpx-lien"]');
    if (rando.gpx) {
      lienGpx.href = dossier + '/' + rando.gpx;
    } else {
      lienGpx.remove();
    }

    return noeud;
  }

  try {
    const reponseListe = await fetch('randonnees.json', { cache: 'no-store' });
    if (!reponseListe.ok) throw new Error('randonnees.json introuvable');
    const dossiers = await reponseListe.json();

    if (!Array.isArray(dossiers) || dossiers.length === 0) {
      afficherMessage('Aucune randonnée publiée pour le moment.', 'liste__vide');
      return;
    }

    const resultats = await Promise.all(
      dossiers.map(async (dossier) => {
        try {
          const rep = await fetch(dossier + '/rando.json', { cache: 'no-store' });
          if (!rep.ok) throw new Error('rando.json manquant pour ' + dossier);
          const rando = await rep.json();
          return { dossier, rando };
        } catch (err) {
          console.warn('Randonnée ignorée (' + dossier + ') :', err.message);
          return null;
        }
      })
    );

    viderEtat();

    const valides = resultats.filter(Boolean);
    if (valides.length === 0) {
      afficherMessage('Aucune randonnée publiée pour le moment.', 'liste__vide');
      return;
    }

    valides.forEach(({ dossier, rando }) => {
      conteneur.appendChild(creerCarte(dossier, rando));
    });
  } catch (erreur) {
    console.error(erreur);
    afficherMessage('Impossible de charger la liste des randonnées.', 'liste__erreur');
  }
})();
