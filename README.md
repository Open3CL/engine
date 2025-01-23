# Open3CL

Open3CL est une librairie JavaScript open source, spécialement conçue pour faciliter le calcul des Diagnostics de Performance Énergétique (DPE). Elle implémente la norme définie dans [l'annexe 1 de l'arrêté du 31 mars 2021](https://rt-re-batiment.developpement-durable.gouv.fr/IMG/pdf/consolide_annexe_1_arrete_du_31_03_2021_relatif_aux_methodes_et_procedures_applicables.pdf). Elle est destinée aux développeurs qui souhaitent intégrer des calculs énergétiques précis et conformes à la réglementation dans leurs applications.

## Fonctionnalités principales

- **Calculs énergétiques** : Supporte les différentes méthodologies définies par la réglementation.
- **Conformité** : Implémente la norme définie dans [l'annexe 1 de l'arrêté du 31 mars 2021](https://rt-re-batiment.developpement-durable.gouv.fr/IMG/pdf/consolide_annexe_1_arrete_du_31_03_2021_relatif_aux_methodes_et_procedures_applicables.pdf).
- **Performance** : Optimisée pour des calculs rapides sur de grands ensembles de données.

## Installation

```bash
npm install open3cl
```

## Exemple d'utilisation

Voici un exemple basique montrant comment utiliser Open3CL pour calculer un DPE :

```javascript
import { calcul_3cl } from 'open3cl';

// Exemple d'objet JSON issu d'un fichier XML DPE
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

const result = calcul_3cl(dpeData);
```

## Documentation

Vous pouvez consulter la documentation complète sur [l'annexe 1 de l'arrêté du 31 mars 2021](https://rt-re-batiment.developpement-durable.gouv.fr/IMG/pdf/consolide_annexe_1_arrete_du_31_03_2021_relatif_aux_methodes_et_procedures_applicables.pdf) pour obtenir plus de détails sur l'utilisation des différents modules et fonctions.

## Ressources

- [PDF Méthode 3CL v1.3](https://rt-re-batiment.developpement-durable.gouv.fr/IMG/pdf/consolide_annexe_1_arrete_du_31_03_2021_relatif_aux_methodes_et_procedures_applicables.pdf)
- [Gitlab Observatoire DPE](https://gitlab.com/observatoire-dpe/observatoire-dpe/-/blob/master/README.md)
- [Légifrance 13/04/2021 ajout d'indicateur de confort thermique dans la sortie du DPE](https://www.legifrance.gouv.fr/download/pdf?id=doxMrRr0wbfJVvtWjfDP4qE7zNsiFZL-4wqNyqoY-CA=)
- [Légifrance 13/04/2021 valeurs GES](https://www.legifrance.gouv.fr/download/pdf?id=doxMrRr0wbfJVvtWjfDP4gHzzERt1iX0PtobthCE6A0=)
- [CSTB Procédure de certification](https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=&cad=rja&uact=8&ved=2ahUKEwjH-fG2-s7_AhXLaqQEHTP8CwMQFnoECA4QAQ&url=https%3A%2F%2Frt-re-batiment.developpement-durable.gouv.fr%2FIMG%2Fpdf%2Freglement_evaluation_logiciel_dpe_2021_-_audit_energetique-13122022_v2.pdf&usg=AOvVaw3SWv8drhqbgMMT8K9m6a2C&opi=89978449)
- [Valeurs des étiquettes énergétiques](https://docs.google.com/spreadsheets/d/1QVXUOLP8aJukA-PLBGyVB0ZJTWmLEE1WbflXUfsT_jU/edit#gid=0)

## Quelques DPE intéressants

En travaillant sur les DPE je suis tombé sur quelques cas de DPE intéressants

- `2307E3075089A` chaudiere a condensation + climatiseur
- `2344E2258429L` DPE generé a partir des données immeuble
- `2362E3036179P` poele a charbon
- `2369E2991011Q` 1 radiateur à gaz + fenetres avec masques lointains
- `2387E0402213E` methode_application 'maison_individuelle' mais les portes sont saisie depuis une étude rt2012/rt2020
- `2387E0576340J` 2 gen ch
- `2387E0888781I` inertie lourde + paroi anciennes (tableaux de valeurs différents)
- `2387E1742056P` 2 emetteur ch
- `2387E2058698D` ventil hybride
- `2387E2603968B` inertie lourde + parois ancienne (différentes periode de chauffe)
- `2387E2899635W` 2 installation_ch
- `2387E2923777K` pas d’ECS, pas de portes
- `2387E3074987E` bouclage ECS
- `2387E3092820B` pas de pancher_haut
- `2387E3103131Q` Analysimmo 4.1.1 incohérence ventil calculée comme si presence_joint_menuiserie=1 alors qu’aucune menuiserie n’a de joints
- `2387E3103505A` Analysimmo 4.1.1 incohérence pont thermique, PB considéré pont ITI+ITE ??
- `2187E1039187C` toiture terrasse
- `2387E0291550X` probleme ubat/uph comble amenagés
- `2287E1724516Y` pour un meme generateur, position_volume_chauffe = 0 ou 1 selon si c'est le gen_ecs ou le gen_ch
- `2387E3092820B`, `2287E1043883T` et plein d'autres dpe. Le diagnostiqueur override la valeur forfaitaire de pveil pour le mettre a 0 car il n'y a pas de veilleuse sur la chaudiere, or pour le moteur il n'y a aucun moyen de savoir si donnee_intermediaire.pveil a ete saisi ou s'il faut aller chercher une valeur dans le tableau.

## Contribution

Nous accueillons les contributions avec plaisir ! Si vous souhaitez améliorer Open3CL, veuillez :

1. Forker le dépôt.
2. Créer une branche pour vos modifications.
3. Soumettre une pull request avec une description claire des changements apportés.

Consultez le fichier `CONTRIBUTING.md` pour plus de détails.

## License

Ce projet est sous licence [MIT](LICENSE).

## Contact

Pour toute question ou suggestion, veuillez contacter l'équipe de développement
