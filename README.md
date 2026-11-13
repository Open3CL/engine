<a id="readme-top"></a>

<div align="center">

<a href="https://open3cl.fr">
  <img src="images/logo.png" alt="Open3CL" width="260" height="80">
</a>

<sub>Développé et maintenu par</sub>
<br/>
<a href="https://redfroggy.fr" target="_blank">
<img src="images/redfroggy.png" alt="RedFroggy" width="120" height="120">
</a>

<br/><br/>

### Implémentation open source de la méthode de calcul 3CL-DPE

**Donnez-lui un DPE au format XML ou JSON, il vous rend les consommations, les émissions et les étiquettes.**

<br/>

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT license][license-shield]][license-url]

</div>

<br/>

---

## 🧭 Par où commencer ?

Trois façons d'utiliser Open3CL, de la plus rapide à la plus intégrée :

<table>
  <tr>
    <th width="33%">🏠 Voir un DPE en 3D</th>
    <th width="33%">⚡ Appeler l'API REST</th>
    <th width="33%">📦 Intégrer le moteur</th>
  </tr>
  <tr>
    <td>Chargez un DPE dans le navigateur et explorez la maquette 3D du logement et ses déperditions.</td>
    <td>Envoyez un DPE JSON ou XML à l'API hébergée par RedFroggy, recevez-le recalculé. Rien à installer.</td>
    <td>Ajoutez le paquet npm à votre application Node.js ou web et calculez localement, sans service externe.</td>
  </tr>
  <tr>
    <td><em>Pour découvrir, sans rien installer</em></td>
    <td><em>Pour un serveur, quel que soit le langage</em></td>
    <td><em>Pour un projet JavaScript</em></td>
  </tr>
  <tr>
    <td align="center"><a href="#-voir-un-dpe-en-3d"><strong>Voir la démo ↓</strong></a></td>
    <td align="center"><a href="#-utiliser-lapi-rest"><strong>Utiliser l'API ↓</strong></a></td>
    <td align="center"><a href="#-démarrage"><strong>Démarrer ↓</strong></a></td>
  </tr>
</table>

<div align="center">

🐛 [Signaler un bug](https://github.com/Open3CL/engine/issues/new?labels=bug&template=bug-report---.md)
&nbsp;·&nbsp;
💡 [Proposer une fonctionnalité](https://github.com/Open3CL/engine/issues/new?labels=enhancement&template=feature-request---.md)
&nbsp;·&nbsp;
📊 [Rapports de corpus](https://open3cl.redfroggy.io/reports/corpus/)
&nbsp;·&nbsp;
🌐 [open3cl.fr](https://open3cl.fr)

</div>

<br/>

---

## 🏠 Voir un DPE en 3D

**[➡️ Ouvrir la démo 3D en ligne](https://open3cl.redfroggy.io)**

Chargez le DPE d'un logement : Open3CL le recalcule dans le navigateur et en reconstruit la maquette 3D.
Chaque paroi, fenêtre et équipement s'affiche avec ses déperditions, consultables et modifiables en direct.

<div align="center">
<a href="images/open3cl_3D_screencast.mp4">
  <img src="images/open3cl_3D_screencast.gif" alt="Démo Open3CL 3D : maquette d'un logement et ses déperditions" width="900">
</a>
</div>

<p align="right">(<a href="#readme-top">Retour en haut</a>)</p>

---

## ⚡ Utiliser l'API REST

Pas envie d'intégrer le moteur ? Appelez l'API Open3CL hébergée par RedFroggy, depuis n'importe quel langage.

|                      |                                                                         |
| :------------------- | :---------------------------------------------------------------------- |
| **URL**              | `POST https://3cl.redfroggy.io/`                                        |
| **Entrée**           | un DPE en JSON (`application/json`) ou en XML ADEME (`application/xml`) |
| **Sortie**           | le DPE recalculé, dans le même format que l'entrée                      |
| **Authentification** | clé d'API dans l'en-tête `X-Auth-Token`                                 |

```bash
curl -X POST https://3cl.redfroggy.io/ \
  -H "X-Auth-Token: $OPEN3CL_API_KEY" \
  -H 'Content-Type: application/xml' \
  --data-binary @dpe.xml
```

> [!IMPORTANT]
> L'API est **privée**. Pour obtenir une clé d'API, écrivez à **[contact@redfroggy.fr](mailto:contact@redfroggy.fr)**.

**[📖 Guide complet de l'API : exemples curl, JavaScript, Java, Python, PHP, C#, Go](https://github.com/Open3CL/engine/wiki/Api-rest-Open3Cl)**

<p align="right">(<a href="#readme-top">Retour en haut</a>)</p>

---

<details>
  <summary>📚 Sommaire</summary>
  <ol>
    <li><a href="#-par-où-commencer-">Par où commencer ?</a></li>
    <li><a href="#-voir-un-dpe-en-3d">Voir un DPE en 3D</a></li>
    <li><a href="#-utiliser-lapi-rest">Utiliser l'API REST</a></li>
    <li><a href="#-à-propos-du-projet">À propos du projet</a>
      <ul>
        <li><a href="#ce-que-fait-le-moteur">Ce que fait le moteur</a></li>
        <li><a href="#périmètre-couvert">Périmètre couvert</a></li>
        <li><a href="#lécosystème-open3cl">L'écosystème Open3CL</a></li>
      </ul>
    </li>
    <li><a href="#-démarrage">Démarrage</a>
      <ul>
        <li><a href="#pré-requis">Pré-requis</a></li>
        <li><a href="#installation">Installation</a></li>
        <li><a href="#en-30-secondes">En 30 secondes</a></li>
      </ul>
    </li>
    <li><a href="#-utilisation">Utilisation</a>
      <ul>
        <li><a href="#api-publique">API publique</a></li>
        <li><a href="#options-de-calcul">Options de calcul</a></li>
        <li><a href="#lire-le-résultat">Lire le résultat</a></li>
      </ul>
    </li>
    <li><a href="#-tests-de-corpus">Tests de corpus</a>
      <ul>
        <li><a href="#le-rapport-interactif">Le rapport interactif</a></li>
        <li><a href="#lancer-un-corpus">Lancer un corpus</a></li>
        <li><a href="#résultats-corpus">Résultats corpus</a></li>
      </ul>
    </li>
    <li><a href="#-roadmap">Roadmap</a></li>
    <li><a href="#-contribuer">Contribuer</a></li>
    <li><a href="#-licence">Licence</a></li>
    <li><a href="#-contact">Contact</a></li>
    <li><a href="#-remerciements">Remerciements</a></li>
  </ol>
</details>

---

## 🌍 À propos du projet

**Open3CL** est une librairie JavaScript open source qui calcule un **Diagnostic de Performance Énergétique (DPE)**.
Elle implémente la méthode **3CL-DPE 2021** définie dans
[l'annexe 1 de l'arrêté du 31 mars 2021](https://rt-re-batiment.developpement-durable.gouv.fr/IMG/pdf/consolide_annexe_1_arrete_du_31_03_2021_relatif_aux_methodes_et_procedures_applicables.pdf),
la même méthode que celle utilisée par les logiciels certifiés du marché.

Concrètement : vous lui fournissez les **données d'entrée** d'un DPE (l'enveloppe du bâtiment, les systèmes de
chauffage,
d'ECS, de ventilation, de climatisation) et elle recalcule **l'intégralité des sorties** — déperditions, besoins,
consommations, émissions de gaz à effet de serre, coûts et étiquettes.

|                         |                                                                                                            |
| :---------------------- | :--------------------------------------------------------------------------------------------------------- |
| 🎯 **Conforme**         | Implémente la méthode réglementaire 3CL-DPE 2021, article par article                                      |
| 🔍 **Vérifiable**       | ~90 000 DPE réels rejoués à chaque version, résultats publiés (voir [Résultats corpus](#résultats-corpus)) |
| 🧩 **Sans dépendance**  | Pure JavaScript (ESM), aucun service externe, fonctionne en Node.js comme dans un navigateur               |
| 📦 **Prête à intégrer** | Entrée XML ADEME ou objet JSON, sortie JSON complète                                                       |
| 🆓 **Libre**            | Licence MIT, développée au grand jour                                                                      |

### Ce que fait le moteur

```mermaid
flowchart LR
    A["📄 DPE<br/>XML ou JSON"] --> B["🧹 Sanitisation<br/>normalisation des entrées"]
    B --> C["🧱 Enveloppe<br/>déperditions, inertie,<br/>ponts thermiques"]
    C --> D["🌡️ Besoins<br/>chauffage, ECS,<br/>refroidissement"]
    D --> E["⚙️ Systèmes<br/>générateurs, émetteurs,<br/>auxiliaires"]
    E --> F["🔌 Consommations<br/>EF, EP, GES, coûts"]
    F --> G["🏷️ Étiquettes<br/>DPE & climat"]
```

<details>
<summary><strong>Le détail des étapes de calcul</strong></summary>

| Étape                 | Ce qui est calculé                                                                                    |
| :-------------------- | :---------------------------------------------------------------------------------------------------- |
| **Sanitisation**      | Normalisation et correction des données d'entrée incohérentes (optionnelle)                           |
| **Enveloppe**         | Déperditions des murs, planchers, baies, portes, ponts thermiques, renouvellement d'air, perméabilité |
| **Inertie & confort** | Classe d'inertie, confort d'été, qualité d'isolation                                                  |
| **Besoins**           | Besoins de chauffage et d'ECS mensuels, apports solaires et internes, besoin de refroidissement       |
| **Systèmes**          | Rendements de génération / distribution / émission / stockage, pertes, intermittence                  |
| **Auxiliaires**       | Consommations des auxiliaires de génération et de distribution (chauffage et ECS)                     |
| **Consommations**     | Énergie finale, énergie primaire, émissions de GES, coûts par usage et par énergie                    |
| **Étiquettes**        | Classe énergie et classe climat, y compris la projection avec le coefficient EP 1,7                   |

</details>

### Périmètre couvert

| Type de DPE                                   | Statut                       |
| :-------------------------------------------- | :--------------------------- |
| Maison individuelle                           | ✅ Supporté                  |
| Appartement (chauffage individuel)            | ✅ Supporté                  |
| Appartement (chauffage collectif ou mixte)    | ✅ Supporté                  |
| Immeuble collectif                            | ✅ Supporté                  |
| Appartement généré à partir d'un DPE immeuble | 🚧 En cours de fiabilisation |
| Photovoltaïque                                | 🚧 En cours                  |

> [!NOTE]
> Le moteur vise la **reproduction fidèle** des sorties des logiciels certifiés, y compris certains de leurs écarts à la
> méthode.
đAPI
### L'écosystème Open3CL

| Ressource                                                          | Description                                                                |
| :----------------------------------------------------------------- | :------------------------------------------------------------------------- |
| [Démo 3D](https://open3cl.redfroggy.io)                            | Visualisation 3D des déperditions d'un DPE, recalculées dans le navigateur |
| [Rapports de corpus](https://open3cl.redfroggy.io/reports/corpus/) | Rapport HTML sur les corpus DPE                                            |
| [API REST](https://github.com/Open3CL/engine/wiki/Api-rest-Open3Cl)        | Le moteur hébergé par RedFroggy, en JSON ou XML (clé d'API sur demande)    |
| [open3cl.fr](https://open3cl.fr)                                   | Le site du projet                                                          |
| [@open3cl/engine](https://www.npmjs.com/package/@open3cl/engine)   | Le paquet npm                                                              |

<p align="right">(<a href="#readme-top">Retour sommaire</a>)</p>

---

## 🚀 Démarrage

### Pré-requis

| Outil       | Version   |
| :---------- | :-------- |
| **Node.js** | ≥ 24.14.1 |
| **npm**     | ≥ 11.11.0 |

La version exacte utilisée en développement et en CI est fixée dans [`.nvmrc`](.nvmrc) (`nvm use`).

### Installation

```sh
npm install @open3cl/engine
```

<details>
<summary>Avec un autre gestionnaire de paquets</summary>

```sh
yarn add @open3cl/engine
pnpm add @open3cl/engine
```

</details>

### En 30 secondes

```javascript
import { calcul_3cl_xml } from '@open3cl/engine';
import { readFileSync } from 'node:fs';

const dpe = calcul_3cl_xml(readFileSync('./mon-dpe.xml', 'utf8'));

const { ep_conso, emission_ges } = dpe.logement.sortie;

console.log(`Étiquette énergie : ${ep_conso.classe_bilan_dpe}`);
console.log(`Consommation      : ${ep_conso.ep_conso_5_usages_m2} kWh/m²/an`);
console.log(`Étiquette climat  : ${emission_ges.classe_emission_ges}`);
console.log(`Émissions         : ${emission_ges.emission_ges_5_usages_m2} kgCO₂/m²/an`);
```

```text
Étiquette énergie : D
Consommation      : 174 kWh/m²/an
Étiquette climat  : C
Émissions         : 30 kgCO₂/m²/an
```

> [!TIP]
> Les fichiers XML de n'importe quel DPE publié sont téléchargeables depuis
> [l'observatoire de l'ADEME](https://observatoire-dpe-audit.ademe.fr/). C'est le moyen le plus simple de tester le
> moteur sur un cas réel.

<p align="right">(<a href="#readme-top">Retour sommaire</a>)</p>

---

## 🛠️ Utilisation

### API publique

| Fonction                        | Entrée      | Description                                                |
| :------------------------------ | :---------- | :--------------------------------------------------------- |
| `calcul_3cl(dpe, options?)`     | Objet JSON  | Calcule un DPE et renvoie l'objet enrichi de ses sorties   |
| `calcul_3cl_xml(xml, options?)` | Chaîne XML  | Parse le XML puis appelle `calcul_3cl`                     |
| `get_classe_ges_dpe(dpe)`       | DPE calculé | Recalcule les étiquettes énergie et climat                 |
| `get_conso_coeff_1_7_2027(dpe)` | DPE calculé | Projette la consommation avec le coefficient EP 1,7 (2027) |
| `getVersion()`                  | –           | Version du moteur utilisée                                 |

### Options de calcul

```javascript
import { calcul_3cl, calcul_3cl_xml } from '@open3cl/engine';

// Depuis un objet JSON — sanitisation activée par défaut
const a = calcul_3cl(dpeData);
const b = calcul_3cl(dpeData, { sanitize: true }); // équivalent

// Sans pré-transformation : les données d'entrée sont utilisées telles quelles
const c = calcul_3cl(dpeData, { sanitize: false });

// Depuis un XML ADEME
const d = calcul_3cl_xml(xmlString);
const e = calcul_3cl_xml(xmlString, { sanitize: false });

// Analyse du corpus ADEME uniquement : reproduire les choix du logiciel de saisie
const f = calcul_3cl(dpeData, { sanitize: true, compat_for_corpus_analysis: true });
```

| Option                       | Défaut  | Effet                                                                                                                                                                                                                                                                                                                                        |
| :--------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sanitize`                   | `true`  | Normalise et corrige les incohérences du DPE d'entrée avant calcul. Désactivez-le pour un calcul brut.                                                                                                                                                                                                                                       |
| `compat_for_corpus_analysis` | `false` | Reprend la ligne `q4pa_conv` choisie par le logiciel de saisie même si elle contredit l'isolation des parois ou les joints déclarés, pour reproduire les DPE du corpus ADEME. À n'utiliser que pour l'analyse de corpus. Désactivé, le moteur recalcule `q4pa_conv` selon la méthode (contrôle de cohérence d'un DPE, scénarios de travaux). |

> Dès qu'un objet `options` est passé, `sanitize` vaut `false` s'il n'est pas précisé : indiquez
> `sanitize: true` avec `compat_for_corpus_analysis`.

<details>
<summary><strong>Exemple d'objet JSON d'entrée (partiel)</strong></summary>

```javascript
const dpeData = {
  numero_dpe: '2113E1018248X',
  statut: 'ACTIF',
  logement: {
    caracteristique_generale: {
      annee_construction: 1948,
      surface_habitable_logement: 49.96
    },
    installation_chauffage_collection: {
      installation_chauffage: [
        {
          description: 'Chaudière individuelle gaz standard',
          surface_chauffee: 49.96,
          generateur_chauffage_collection: {
            generateur_chauffage: [{ description: '...' }]
          }
        }
      ]
    }
  }
};
```

La structure attendue est celle du **XML DPE de l'ADEME**, converti en JSON. Les types complets sont décrits dans
[`types.d.ts`](types.d.ts).

</details>

### Lire le résultat

Le DPE renvoyé est l'objet d'entrée, enrichi de `logement.sortie` :

| Chemin                                     | Contenu                                                |
| :----------------------------------------- | :----------------------------------------------------- |
| `sortie.deperdition`                       | Déperditions par paroi et déperdition d'enveloppe (GV) |
| `sortie.apport_et_besoin`                  | Besoins de chauffage et d'ECS, apports, `nadeq`        |
| `sortie.ef_conso`                          | Consommations en énergie finale, par usage             |
| `sortie.ep_conso`                          | Énergie primaire, `classe_bilan_dpe`, projection 2027  |
| `sortie.emission_ges`                      | Émissions de GES et `classe_emission_ges`              |
| `sortie.cout`                              | Coûts annuels par usage                                |
| `sortie.confort_ete` / `qualite_isolation` | Indicateurs de confort d'été et de qualité d'isolation |
| `sortie.production_electricite`            | Production photovoltaïque                              |

## 🧪 Tests de corpus

> Un corpus, c'est une liste de numéros de DPE réels. Le moteur les rejoue **tous**, compare ses sorties à celles du
> DPE publié, et en tire un taux de conformité. C'est le principal indicateur de qualité du projet.

```mermaid
flowchart LR
    A["📋 Liste de<br/>numéros DPE"] --> B["⬇️ Téléchargement<br/>API ADEME<br/><sub>ou cache local</sub>"]
    B --> C["⚙️ Calcul<br/>Open3CL"]
    C --> D["📐 Comparaison<br/><sub>écart ≤ 5 %</sub>"]
    D --> E["📊 Rapports<br/>JSON · CSV · HTML"]
```

**22 grandeurs** sont comparées pour chaque DPE. Quatre d'entre elles sont **bloquantes** : un DPE n'est déclaré
conforme
que si **toutes** restent sous le seuil de tolérance de **5 %**.

| Contrôle bloquant                                      | Ce que c'est                        |
| :----------------------------------------------------- | :---------------------------------- |
| `sortie.ef_conso.conso_ecs`                            | Consommation d'eau chaude sanitaire |
| `sortie.ef_conso.conso_ch`                             | Consommation de chauffage           |
| `sortie.ep_conso.ep_conso_5_usages` (ou `_m2`)         | Consommation en énergie primaire    |
| `sortie.emission_ges.emission_ges_5_usages` (ou `_m2`) | Émissions de gaz à effet de serre   |

📖 **Guide complet** : [docs/CORPUS.md](docs/CORPUS.md) — liste des corpus, contrôles informatifs, variables
d'environnement, quotas de l'API ADEME, structure des rapports.

### Le rapport interactif

Chaque exécution produit un tableau de bord HTML : jauge de réussite, ratio par contrôle, liste des DPE au-dessus du
seuil avec le **détail des propriétés en écart**, et comparaison entre deux branches. Il est écrit dans
`dist/reports/corpus` et se consulte en local :

```sh
npm run reports:preview   # sert dist/reports/corpus et ouvre le navigateur
```

Les chiffres de la dernière exécution sont repris ci-dessous, dans [Résultats corpus](#résultats-corpus).

### Lancer un corpus

```sh
# Tous les corpus, puis mise à jour automatique des résultats dans ce README
npm run test:corpus:all

# Un seul corpus
npm run test:corpus

# Un corpus précis
npm run test:corpus -- corpus-file-path=corpus.csv

# Un seul DPE, pour investiguer
npm run test:corpus -- dpes-code=2592E1233185X
```

| Argument                  | Description                                                                      |
| :------------------------ | :------------------------------------------------------------------------------- |
| `corpus-file-path=<path>` | Fichier de corpus à analyser (défaut : tous les fichiers de `test/corpus/files`) |
| `dpes-folder-path=<path>` | Dossier de cache des DPE. Un DPE déjà présent n'est pas retéléchargé             |
| `dpes-code=<code>`        | Ne rejoue qu'un seul DPE                                                         |

> [!TIP]
> Définissez `DPE_FOLDER_PATH` une fois pour toutes plutôt que de répéter `dpes-folder-path`. Les DPE absents du cache
> sont téléchargés depuis l'API de l'ADEME — pensez aux [quotas](docs/CORPUS.md#quotas-de-lapi-ademe).

### Résultats corpus

Ces résultats sont **générés automatiquement** à la fin de `npm run test:corpus:all` par
[`scripts/generate_corpus_readme.js`](scripts/generate_corpus_readme.js). Ne les modifiez pas à la main.

<!-- CORPUS:START -->

> **Version `1.11.6`** · branche `main` · généré le 2026-11-12
> Seuil de tolérance **5%**

<table>
<tr>
<td align="center"><strong>9</strong><br/><sub>corpus</sub></td>
<td align="center"><strong>88 475</strong><br/><sub>DPE analysés</sub></td>
<td align="center"><strong>76 029</strong><br/><sub>DPE conformes</sub></td>
<td align="center"><strong>85,93 %</strong><br/><sub>réussite globale</sub></td>
</tr>
</table>

|     | Corpus                                                                                                                  |    Réussite |                        |  DPE conformes |
| :-: | :---------------------------------------------------------------------------------------------------------------------- | ----------: | :--------------------- | -------------: |
| 🟢  | **Appartement · chauffage individuel (2025)**<br/><sub>`dpe_appartement_individuel_chauffage_individuel_2025.csv`</sub> | **95,49 %** | `███████████████████░` |  9 447 / 9 893 |
| 🟢  | **Appartement · chauffage collectif (2025)**<br/><sub>`dpe_appartement_individuel_chauffage_collectif_2025.csv`</sub>   | **94,59 %** | `███████████████████░` |  9 389 / 9 926 |
| 🟢  | **Logement individuel (2025)**<br/><sub>`dpe_logement_individuel_2025.csv`</sub>                                        | **93,46 %** | `███████████████████░` |  9 190 / 9 833 |
| 🟢  | **Maison individuelle (2025)**<br/><sub>`dpe_maison_individuelle_2025.csv`</sub>                                        | **92,28 %** | `██████████████████░░` |  9 017 / 9 771 |
| 🟢  | **Maison individuelle (2026)**<br/><sub>`dpe_maison_individuelle_2026.csv`</sub>                                        | **90,51 %** | `██████████████████░░` | 9 051 / 10 000 |
| 🟢  | **Immeuble · chauffage collectif**<br/><sub>`dpe_immeuble_chauffage_collectif.csv`</sub>                                | **89,29 %** | `██████████████████░░` |  8 696 / 9 739 |
| 🟢  | **Immeuble · chauffage individuel**<br/><sub>`dpe_immeuble_chauffage_individuel.csv`</sub>                              | **86,37 %** | `█████████████████░░░` |  8 571 / 9 924 |
| 🟡  | **Immeuble · chauffage mixte**<br/><sub>`dpe_immeuble_chauffage_mixte.csv`</sub>                                        | **73,03 %** | `███████████████░░░░░` |  6 990 / 9 571 |
| 🔴  | **Individuel généré depuis l'immeuble (2026)**<br/><sub>`dpe_individuel_a_partir_dpe_immeuble_2026.csv`</sub>           | **57,83 %** | `████████████░░░░░░░░` |  5 678 / 9 818 |

<sub>🟢 ≥ 85 % · 🟡 ≥ 60 % · 🔴 < 60 %</sub>

#### Temps d’exécution

> Durée de l’appel à `calcul_3cl` par DPE, sur 88 460 calculs.
> La copie défensive de l’entrée et la lecture du fichier sont exclues de la mesure.

<table>
<tr>
<td align="center"><strong>5,34 ms</strong><br/><sub>moyenne</sub></td>
<td align="center"><strong>4,62 ms</strong><br/><sub>médiane</sub></td>
<td align="center"><strong>0,11 ms</strong><br/><sub>min</sub></td>
<td align="center"><strong>808,6 ms</strong><br/><sub>max</sub></td>
</tr>
</table>

| Corpus                                         | Moyenne | Médiane |     Min |      Max |     p95 |     p99 |
| :--------------------------------------------- | ------: | ------: | ------: | -------: | ------: | ------: |
| **Appartement · chauffage individuel (2025)**  | 3,93 ms | 3,56 ms | 1,53 ms |  34,5 ms | 6,76 ms | 8,91 ms |
| **Appartement · chauffage collectif (2025)**   | 4,43 ms | 3,96 ms | 1,64 ms |  34,4 ms | 7,41 ms | 9,73 ms |
| **Logement individuel (2025)**                 | 4,93 ms | 4,36 ms | 1,64 ms |  57,7 ms | 9,09 ms | 12,7 ms |
| **Maison individuelle (2025)**                 | 5,81 ms | 5,20 ms | 2,04 ms |  50,5 ms | 10,4 ms | 14,2 ms |
| **Maison individuelle (2026)**                 | 6,14 ms | 5,46 ms | 2,06 ms |  49,4 ms | 11,1 ms | 15,1 ms |
| **Immeuble · chauffage collectif**             | 5,40 ms | 4,58 ms | 0,14 ms | 129,3 ms | 10,1 ms | 15,8 ms |
| **Immeuble · chauffage individuel**            | 6,25 ms | 5,32 ms | 0,11 ms | 115,8 ms | 12,7 ms | 20,2 ms |
| **Immeuble · chauffage mixte**                 | 5,32 ms | 4,30 ms | 0,19 ms | 808,6 ms | 10,9 ms | 17,7 ms |
| **Individuel généré depuis l'immeuble (2026)** | 5,84 ms | 4,87 ms | 1,86 ms |  63,7 ms | 11,1 ms | 18,5 ms |

<sub>La moyenne est tirée vers le haut par les DPE collectifs, dont le coût atteint plusieurs
dizaines de fois la médiane : c’est la médiane qui décrit le cas courant, et p95/p99 le cas
défavorable réel.</sub>

<!-- CORPUS:END -->

📈 Historique complet des versions : [docs/CORPUS-HISTORY.md](docs/CORPUS-HISTORY.md)

<p align="right">(<a href="#readme-top">Retour sommaire</a>)</p>

---

## 🗺️ Roadmap

```mermaid
flowchart TD
    subgraph fait ["✅ Fait"]
        A1["Site Open3CL"]
        A2["Rapports de corpus interactifs"]
        A3["Démo 3D en ligne"]
    end
    subgraph cours ["🚧 En cours"]
        B1["Refonte technique"]
        B2["DPE à l'immeuble"]
        B3["Certification ADEME"]
    end
    fait --> cours
```

| Étape               | Statut      | Détail                                                                                      |
| :------------------ | :---------- | :------------------------------------------------------------------------------------------ |
| Site Open3CL        | ✅ Terminé  | [open3cl.fr](https://open3cl.fr)                                                            |
| Démo 3D en ligne    | ✅ Terminé  | [Visualisation 3D des déperditions](https://open3cl.redfroggy.io), publiée sur GitHub Pages |
| Rapports de tests   | ✅ Terminé  | Tableau de bord interactif généré à chaque exécution                                        |
| Refonte technique   | 🚧 En cours | Découpage par article de la méthode, couverture de tests à 100 %                            |
| DPE à l'immeuble    | 🚧 En cours | Fiabilisation des appartements générés depuis un DPE immeuble                               |
| Certification ADEME | 🚧 En cours | Objectif de long terme                                                                      |

Le détail complet des bugs et fonctionnalités en cours est dans les
[issues](https://github.com/Open3CL/engine/issues).

<p align="right">(<a href="#readme-top">Retour sommaire</a>)</p>

---

## 🤝 Contribuer

Toutes les contributions sont les bienvenues : correction d'un écart de calcul, ajout de tests, documentation, ou
simplement le signalement d'un DPE qui ne passe pas.

```sh
git clone https://github.com/Open3CL/engine.git
cd engine
npm ci
npm run test:unit     # tests unitaires
npm run qa:lint       # analyse statique
npm run qa:format     # formatage
```

| Vous voulez…                   | Allez voir                                                                                                           |
| :----------------------------- | :------------------------------------------------------------------------------------------------------------------- |
| Signaler un bug                | [Ouvrir un bug](https://github.com/Open3CL/engine/issues/new?labels=bug&template=bug-report---.md)                   |
| Proposer une fonctionnalité    | [Ouvrir une feature](https://github.com/Open3CL/engine/issues/new?labels=enhancement&template=feature-request---.md) |
| Soumettre du code              | [CONTRIBUTING.md](CONTRIBUTING.md)                                                                                   |
| Comprendre les tests de corpus | [docs/CORPUS.md](docs/CORPUS.md)                                                                                     |

📖 Le guide de contribution détaillé — conventions de commit, règles de code, cycle d'une pull request, méthode de
debug d'un écart de calcul — est dans **[CONTRIBUTING.fr.md](CONTRIBUTING.fr.md)**.

<p align="right">(<a href="#readme-top">Retour sommaire</a>)</p>

---

## 📄 Licence

Distribué sous licence **MIT**. Voir le fichier [`LICENSE`](LICENSE) pour plus d'informations.

<p align="right">(<a href="#readme-top">Retour sommaire</a>)</p>

---

## 📬 Contact

Pour toute question : **open3cl@redfroggy.fr**

Pour obtenir une clé d'API REST : **contact@redfroggy.fr**

<p align="right">(<a href="#readme-top">Retour sommaire</a>)</p>

---

## 🙏 Remerciements

### Les contributeurs

Merci à toutes les personnes qui ont écrit, testé, relu ou corrigé une ligne de ce moteur.

<a href="https://github.com/Open3CL/engine/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Open3CL/engine" alt="Contributeurs Open3CL" />
</a>

### Les organisations qui soutiennent le projet

<table>
  <tr>
    <td align="center" width="33%">
      <a href="https://redfroggy.fr/"><strong>RedFroggy</strong></a>
      <br/><br/>
      <sub>À l'initiative du projet et de sa maintenance. Studio de développement web et mobile.</sub>
    </td>
    <td align="center" width="33%">
      <a href="https://kardino.fr"><strong>Kardino</strong></a>
      <br/><br/>
      <sub>Accompagnement à la rénovation énergétique des logements.</sub>
    </td>
    <td align="center" width="33%">
      <a href="https://checkdpe.fr/"><strong>Check DPE</strong></a>
      <br/><br/>
      <sub>Vérification et analyse de DPE en ligne.</sub>
    </td>
  </tr>
</table>

### Les ressources

- L'[ADEME](https://www.ademe.fr/) pour la publication de la méthode 3CL-DPE 2021 et l'ouverture des données DPE
- L'[observatoire DPE-Audit](https://observatoire-dpe-audit.ademe.fr/) qui rend possible les tests de corpus

<p align="right">(<a href="#readme-top">Retour sommaire</a>)</p>

[contributors-shield]: https://img.shields.io/github/contributors/Open3CL/engine.svg?style=for-the-badge
[contributors-url]: https://github.com/Open3CL/engine/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/Open3CL/engine.svg?style=for-the-badge
[forks-url]: https://github.com/Open3CL/network/members
[stars-shield]: https://img.shields.io/github/stars/Open3CL/engine.svg?style=for-the-badge
[stars-url]: https://github.com/Open3CL/stargazers
[issues-shield]: https://img.shields.io/github/issues/Open3CL/engine.svg?style=for-the-badge
[issues-url]: https://github.com/Open3CL/issues
[license-shield]: https://img.shields.io/github/license/Open3CL/engine.svg?style=for-the-badge
[license-url]: https://github.com/Open3CL/engine/blob/main/LICENSE
[product-screenshot]: images/screenshot.png
[Javascript]: https://img.shields.io/badge/javascript-000000?style=for-the-badge&logo=javascript&logoColor=white
