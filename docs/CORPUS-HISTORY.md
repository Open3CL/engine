# Historique des résultats de corpus

Une section par génération, la plus récente en premier. Ce fichier est alimenté
automatiquement par `npm run reports:readme`.

## 1.6.2 — 2026-09-11 (`main`)

> **Version `1.6.2`** · branche `main` · généré le 2026-09-11
> Seuil de tolérance **5%**

<table>
<tr>
<td align="center"><strong>9</strong><br/><sub>corpus</sub></td>
<td align="center"><strong>89 996</strong><br/><sub>DPE analysés</sub></td>
<td align="center"><strong>59 497</strong><br/><sub>DPE conformes</sub></td>
<td align="center"><strong>66,11 %</strong><br/><sub>réussite globale</sub></td>
</tr>
</table>

|     | Corpus                                                                                                                  |    Réussite |                        |  DPE conformes |
| :-: | :---------------------------------------------------------------------------------------------------------------------- | ----------: | :--------------------- | -------------: |
| 🔴  | **Généraliste**<br/><sub>`corpus_dpe.csv`</sub>                                                                         | **45,97 %** | `█████████░░░░░░░░░░░` | 4 597 / 10 000 |
| 🟢  | **Appartement · chauffage individuel (2025)**<br/><sub>`dpe_appartement_individuel_chauffage_individuel_2025.csv`</sub> | **91,55 %** | `██████████████████░░` | 9 155 / 10 000 |
| 🟢  | **Logement individuel (2025)**<br/><sub>`dpe_logement_individuel_2025.csv`</sub>                                        | **88,14 %** | `██████████████████░░` |  8 812 / 9 998 |
| 🟢  | **Maison individuelle (2025)**<br/><sub>`dpe_maison_individuelle_2025.csv`</sub>                                        | **87,93 %** | `██████████████████░░` | 8 793 / 10 000 |
| 🟡  | **Immeuble · chauffage individuel**<br/><sub>`dpe_immeuble_chauffage_individuel.csv`</sub>                              | **73,76 %** | `███████████████░░░░░` |  7 375 / 9 999 |
| 🟡  | **Appartement · chauffage collectif (2025)**<br/><sub>`dpe_appartement_individuel_chauffage_collectif_2025.csv`</sub>   | **69,47 %** | `██████████████░░░░░░` | 6 947 / 10 000 |
| 🟡  | **Immeuble · chauffage collectif**<br/><sub>`dpe_immeuble_chauffage_collectif.csv`</sub>                                | **62,27 %** | `████████████░░░░░░░░` |  6 226 / 9 999 |
| 🔴  | **Immeuble · chauffage mixte**<br/><sub>`dpe_immeuble_chauffage_mixte.csv`</sub>                                        | **48,37 %** | `██████████░░░░░░░░░░` | 4 837 / 10 000 |
| 🔴  | **Individuel généré depuis l'immeuble (2026)**<br/><sub>`dpe_individuel_a_partir_dpe_immeuble_2026.csv`</sub>           | **27,55 %** | `██████░░░░░░░░░░░░░░` | 2 755 / 10 000 |

<sub>🟢 ≥ 85 % · 🟡 ≥ 60 % · 🔴 < 60 %</sub>

## Historique antérieur (1.2.3 → 1.6.1)

Résultats saisis manuellement dans le README avant l'automatisation de cette page.
Le format diffère : « Nb en dessous du taux d'erreur » correspond à la colonne « DPE conformes » ci-dessus.

<details>
<summary>Déplier le tableau complet (versions 1.2.3 à 1.5.1)</summary>

| Version librairie    | corpus                                                   | Nb en dessous du taux d'erreur | Taux de réussite        | Description                                       |
| :------------------- | -------------------------------------------------------- | ------------------------------ | ----------------------- | ------------------------------------------------- |
| <ins>**1.2.3**<ins>  | <ins>**corpus_dpe.csv**<ins>                             | <ins>**4489**<ins>             | <ins>**45%**<ins>       |                                                   |
| 1.2.3                | dpe_immeuble_chauffage_individuel.csv                    | 3257                           | 32%                     |                                                   |
| 1.2.3                | dpe_immeuble_chauffage_collectif.csv                     | 5279                           | 53%                     |                                                   |
| 1.2.3                | dpe_immeuble_chauffage_mixte.csv                         | 2728                           | 27%                     |                                                   |
| <ins>**1.2.8**<ins>  | <ins>**corpus_dpe.csv**<ins>                             | <ins>**489**<ins>              | <ins>**45%**<ins>       |                                                   |
| 1.2.8                | dpe_immeuble_chauffage_individuel.csv                    | 5275 (+2018)                   | 53% (+21%)              |                                                   |
| 1.2.8                | dpe_immeuble_chauffage_collectif.csv                     | 5747 (+468)                    | 57% (+4%)               |                                                   |
| 1.2.8                | dpe_immeuble_chauffage_mixte.csv                         | 3142 (+414)                    | 31% (+4%)               |                                                   |
| <ins>**1.3.1**<ins>  | <ins>**corpus_dpe.csv**<ins>                             | <ins>**4508 (+19)**<ins>       | <ins>**45%**<ins>       |                                                   |
| 1.3.1                | dpe_immeuble_chauffage_individuel.csv                    | 5459 (+184)                    | 55% (+2%)               |                                                   |
| 1.3.1                | dpe_immeuble_chauffage_collectif.csv                     | 5848 (+101)                    | 58% (+1%)               |                                                   |
| 1.3.1                | dpe_immeuble_chauffage_mixte.csv                         | 4018 (+876)                    | 40% (+9%)               |                                                   |
| <ins>**1.3.2**<ins>  | <ins>**corpus_dpe.csv**<ins>                             | <ins>**4519 (+11)**<ins>       | <ins>**45%**<ins>       |                                                   |
| 1.3.2                | dpe_immeuble_chauffage_individuel.csv                    | 5476 (+17)                     | 55%                     |                                                   |
| 1.3.2                | dpe_immeuble_chauffage_collectif.csv                     | 5869 (+21)                     | 58%                     |                                                   |
| 1.3.2                | dpe_immeuble_chauffage_mixte.csv                         | 4040 (+22)                     | 40%                     |                                                   |
| <ins>**1.3.5**<ins>  | <ins>**corpus_dpe.csv**<ins>                             | <ins>**4522 (+3)**<ins>        | <ins>**45%**<ins>       |                                                   |
| 1.3.5                | dpe_immeuble_chauffage_individuel.csv                    | 5488 (+12)                     | 55%                     |                                                   |
| 1.3.5                | dpe_immeuble_chauffage_collectif.csv                     | 5869                           | 58%                     |                                                   |
| 1.3.5                | dpe_immeuble_chauffage_mixte.csv                         | 4082 (+42)                     | 40%                     |                                                   |
| <ins>**1.3.6**<ins>  | <ins>**corpus_dpe.csv**<ins>                             | <ins>**4522**<ins>             | <ins>**45%**<ins>       |                                                   |
| 1.3.6                | dpe_immeuble_chauffage_individuel.csv                    | 5650 (+162)                    | 56%                     |                                                   |
| 1.3.6                | dpe_immeuble_chauffage_collectif.csv                     | 5894 (+25)                     | 59% (+1%)               |                                                   |
| 1.3.6                | dpe_immeuble_chauffage_mixte.csv                         | 4141 (+59)                     | 41% (+1%)               |                                                   |
| <ins>**1.3.7**<ins>  | <ins>**corpus_dpe.csv**<ins>                             | <ins>**4522**<ins>             | <ins>**45%**<ins>       |                                                   |
| 1.3.7                | dpe_immeuble_chauffage_individuel.csv                    | 6960 (+1310)                   | 69% (+13%)              |                                                   |
| 1.3.7                | dpe_immeuble_chauffage_collectif.csv                     | 6106 (+212)                    | 61% (+2%)               |                                                   |
| 1.3.7                | dpe_immeuble_chauffage_mixte.csv                         | 4730 (+589)                    | 47% (+6%)               |                                                   |
| <ins>**1.3.8**<ins>  | <ins>**corpus_dpe.csv**<ins>                             | <ins>**4522**<ins>             | <ins>**45%**<ins>       |                                                   |
| 1.3.8                | dpe_immeuble_chauffage_individuel.csv                    | 6965 (+5)                      | 69%                     |                                                   |
| 1.3.8                | dpe_immeuble_chauffage_collectif.csv                     | 6110 (+4)                      | 61%                     |                                                   |
| 1.3.8                | dpe_immeuble_chauffage_mixte.csv                         | 4735 (+5)                      | 47%                     |                                                   |
| <ins>**1.3.9**<ins>  | <ins>**corpus_dpe.csv**<ins>                             | <ins>**4460**<ins> (-62)       | <ins>**44% (-1%)**<ins> | Pertes liés au fix bug tribu zone 2hd valeur dh19 |
| 1.3.9                | dpe_immeuble_chauffage_individuel.csv                    | 6901 (-64)                     | 69%                     | Pertes liés au fix bug tribu zone 2hd valeur dh19 |
| 1.3.9                | dpe_immeuble_chauffage_collectif.csv                     | 6058 (-58)                     | 60% (-1%)               | Pertes liés au fix bug tribu zone 2hd valeur dh19 |
| 1.3.9                | dpe_immeuble_chauffage_mixte.csv                         | 4728 (-7)                      | 47%                     | Pertes liés au fix bug tribu zone 2hd valeur dh19 |
| <ins>**1.3.11**<ins> | <ins>**corpus_dpe.csv**<ins>                             | <ins>**4468**<ins> (+8)        | <ins>**44%**<ins>       |                                                   |
| 1.3.11               | dpe_immeuble_chauffage_individuel.csv                    | 6901                           | 69%                     |                                                   |
| 1.3.11               | dpe_immeuble_chauffage_collectif.csv                     | 6058                           | 60%                     |                                                   |
| 1.3.11               | dpe_immeuble_chauffage_mixte.csv                         | 4727 (-1)                      | 47%                     | Dpes erronés sur le calcul volume ballon ecs      |
| <ins>**1.3.12**<ins> | <ins>**corpus_dpe.csv**<ins>                             | <ins>**4467**<ins> (-1)        | <ins>**44%**<ins>       | Dpe erroné avec surface chauffée invalide         |
| 1.3.12               | dpe_logement_individuel_2025.csv                         | 8429                           | 84%                     |                                                   |
| 1.3.12               | dpe_immeuble_chauffage_individuel.csv                    | 6900 (-1)                      | 69%                     | Dpe erroné avec surface chauffée invalide         |
| 1.3.12               | dpe_immeuble_chauffage_collectif.csv                     | 6058                           | 60%                     |                                                   |
| 1.3.12               | dpe_immeuble_chauffage_mixte.csv                         | 4725 (-2)                      | 47%                     | Dpe erroné avec surface chauffée invalide         |
| <ins>**1.3.15**<ins> | <ins>**corpus_dpe.csv**<ins>                             | <ins>**4481**<ins> (+14)       | <ins>**45 (+1%)**<ins>  |                                                   |
| 1.3.15               | dpe_logement_individuel_2025.csv                         | 8453                           | 84%                     |                                                   |
| 1.3.15               | dpe_immeuble_chauffage_individuel.csv                    | 7106 (+205)                    | 71% (+2%)               |                                                   |
| 1.3.15               | dpe_immeuble_chauffage_collectif.csv                     | 6083 (+25)                     | 61% (+1%)               |                                                   |
| 1.3.15               | dpe_immeuble_chauffage_mixte.csv                         | 4751 (+24)                     | 47%                     |                                                   |
| <ins>**1.3.20**<ins> | <ins>**corpus_dpe.csv**<ins>                             | <ins>**4500**<ins> (+19)       | <ins>**45%**<ins>       |                                                   |
| 1.3.20               | dpe_logement_individuel_2025.csv                         | 8459 (+6)                      | 84%                     |                                                   |
| 1.3.20               | dpe_maison_individuelle_2025.csv                         | 8638                           | 86%                     |                                                   |
| 1.3.20               | dpe_appartement_individuel_chauffage_individuel_2025.csv | 8561                           | 86%                     |                                                   |
| 1.3.20               | dpe_immeuble_chauffage_individuel.csv                    | 7106                           | 71%                     |                                                   |
| 1.3.20               | dpe_immeuble_chauffage_collectif.csv                     | 6083                           | 61%                     |                                                   |
| 1.3.20               | dpe_immeuble_chauffage_mixte.csv                         | 4751                           | 47%                     |                                                   |
| <ins>**1.3.21**<ins> | <ins>**corpus_dpe.csv**<ins>                             | <ins>**4502**<ins> (+2)        | <ins>**45%**<ins>       |                                                   |
| 1.3.21               | dpe_logement_individuel_2025.csv                         | 8504 (+45)                     | 85% (+1%)               |                                                   |
| 1.3.21               | dpe_maison_individuelle_2025.csv                         | 8652 (+14)                     | 86%                     |                                                   |
| 1.3.21               | dpe_appartement_individuel_chauffage_individuel_2025.csv | 8578 (+17)                     | 86%                     |                                                   |
| 1.3.21               | dpe_appartement_individuel_chauffage_collectif_2025.csv  | 6681                           | 67%                     |                                                   |
| 1.3.21               | dpe_immeuble_chauffage_individuel.csv                    | 7144 (+38)                     | 71%                     |                                                   |
| 1.3.21               | dpe_immeuble_chauffage_collectif.csv                     | 6144 (+61)                     | 61%                     |                                                   |
| 1.3.21               | dpe_immeuble_chauffage_mixte.csv                         | 4760 (+9)                      | 47%                     |                                                   |
| 1.3.25               | dpe_logement_individuel_2025.csv                         | 8512 (+8)                      | 85%                     |                                                   |
| 1.3.25               | dpe_maison_individuelle_2025.csv                         | 8674 (+22)                     | 87% (+1%)               |                                                   |
| 1.3.25               | dpe_appartement_individuel_chauffage_individuel_2025.csv | 8581 (+3)                      | 86%                     |                                                   |
| 1.3.25               | dpe_appartement_individuel_chauffage_collectif_2025.csv  | 6680 (-1)                      | 67%                     | Dpe erronés enlevés du corpus                     |
| 1.3.25               | dpe_immeuble_chauffage_individuel.csv                    | 7142 (-2)                      | 71%                     | Dpe erronés enlevés du corpus                     |
| 1.3.25               | dpe_immeuble_chauffage_collectif.csv                     | 6144                           | 61%                     |                                                   |
| 1.3.25               | dpe_immeuble_chauffage_mixte.csv                         | 4758 (-2)                      | 47%                     | Dpe erronés enlevés du corpus                     |
| <ins>**1.4.0**<ins>  | <ins>**corpus_dpe.csv**<ins>                             | <ins>**4515**<ins>             | <ins>**45%**<ins>       | Maj coeff electricité (janvier 2026)              |
| 1.4.0                | dpe_logement_individuel_2025.csv                         | 8512                           | 85%                     | Maj coeff electricité (janvier 2026)              |
| 1.4.0                | dpe_maison_individuelle_2025.csv                         | 8674                           | 87%                     | Maj coeff electricité (janvier 2026)              |
| 1.4.0                | dpe_appartement_individuel_chauffage_individuel_2025.csv | 8581                           | 86%                     | Maj coeff electricité (janvier 2026)              |
| 1.4.0                | dpe_appartement_individuel_chauffage_collectif_2025.csv  | 6680                           | 67%                     | Maj coeff electricité (janvier 2026)              |
| 1.4.0                | dpe_immeuble_chauffage_individuel.csv                    | 7142                           | 71%                     | Maj coeff electricité (janvier 2026)              |
| 1.4.0                | dpe_immeuble_chauffage_collectif.csv                     | 6144                           | 61%                     | Maj coeff electricité (janvier 2026)              |
| 1.4.0                | dpe_immeuble_chauffage_mixte.csv                         | 4758                           | 47%                     | Maj coeff electricité (janvier 2026)              |
| <ins>**1.4.2**<ins>  | <ins>**corpus_dpe.csv**<ins>                             | <ins>**4515**<ins>             | <ins>**45%**<ins>       |                                                   |
| 1.4.2                | dpe_logement_individuel_2025.csv                         | 8512                           | 85%                     |                                                   |
| 1.4.2                | dpe_maison_individuelle_2025.csv                         | 8674                           | 87%                     |                                                   |
| 1.4.2                | dpe_appartement_individuel_chauffage_individuel_2025.csv | 8581                           | 86%                     |                                                   |
| 1.4.2                | dpe_appartement_individuel_chauffage_collectif_2025.csv  | 6680                           | 67%                     |                                                   |
| 1.4.2                | dpe_immeuble_chauffage_individuel.csv                    | 7143                           | 71%                     |                                                   |
| 1.4.2                | dpe_immeuble_chauffage_collectif.csv                     | 6144                           | 61%                     |                                                   |
| 1.4.2                | dpe_immeuble_chauffage_mixte.csv                         | 4758                           | 47%                     |                                                   |
| 1.4.2                | dpe_individuel_a_partir_dpe_immeuble_2026.csv            | 2757                           | 27%                     |                                                   |
| <ins>**1.4.3**<ins>  | <ins>**corpus_dpe.csv**<ins>                             | <ins>**4556**<ins>             | <ins>**45%**<ins>       |                                                   |
| 1.4.3                | dpe_logement_individuel_2025.csv                         | 8716                           | 87%                     |                                                   |
| 1.4.3                | dpe_maison_individuelle_2025.csv                         | 8715                           | 87%                     |                                                   |
| 1.4.3                | dpe_appartement_individuel_chauffage_individuel_2025.csv | 9070                           | 91%                     |                                                   |
| 1.4.3                | dpe_appartement_individuel_chauffage_collectif_2025.csv  | 6804                           | 68%                     |                                                   |
| 1.4.3                | dpe_immeuble_chauffage_individuel.csv                    | 7320                           | 73%                     |                                                   |
| 1.4.3                | dpe_immeuble_chauffage_collectif.csv                     | 6149                           | 61%                     |                                                   |
| 1.4.3                | dpe_immeuble_chauffage_mixte.csv                         | 4805                           | 48%                     |                                                   |
| 1.4.3                | dpe_individuel_a_partir_dpe_immeuble_2026.csv            | 2755                           | 27%                     |                                                   |
| <ins>**1.4.4**<ins>  | <ins>**corpus_dpe.csv**<ins>                             | <ins>**4560 (+4)**<ins>        | <ins>**45%**<ins>       |                                                   |
| 1.4.4                | dpe_logement_individuel_2025.csv                         | 8719 (+3)                      | 87% (+2%)               |                                                   |
| 1.4.4                | dpe_maison_individuelle_2025.csv                         | 8715                           | 87%                     |                                                   |
| 1.4.4                | dpe_appartement_individuel_chauffage_individuel_2025.csv | 9070                           | 91%                     |                                                   |
| 1.4.4                | dpe_appartement_individuel_chauffage_collectif_2025.csv  | 6803 (-1)                      | 68%                     |                                                   |
| 1.4.4                | dpe_immeuble_chauffage_individuel.csv                    | 7320                           | 73%                     |                                                   |
| 1.4.4                | dpe_immeuble_chauffage_collectif.csv                     | 6149                           | 61%                     |                                                   |
| 1.4.4                | dpe_immeuble_chauffage_mixte.csv                         | 4805                           | 48%                     |                                                   |
| 1.4.4                | dpe_individuel_a_partir_dpe_immeuble_2026.csv            | 2755                           | 27%                     |                                                   |
| <ins>**1.4.5**<ins>  | <ins>**corpus_dpe.csv**<ins>                             | <ins>**4582 (+22)**<ins>       | <ins>**46% (+1%)**<ins> |                                                   |
| 1.4.5                | dpe_logement_individuel_2025.csv                         | 8790 (+71)                     | 88% (+1%)               |                                                   |
| 1.4.5                | dpe_maison_individuelle_2025.csv                         | 8791 (+76)                     | 88% (+1%)               |                                                   |
| 1.4.5                | dpe_appartement_individuel_chauffage_individuel_2025.csv | 9143 (+73)                     | 91%                     |                                                   |
| 1.4.5                | dpe_appartement_individuel_chauffage_collectif_2025.csv  | 6836 (+33)                     | 68%                     |                                                   |
| 1.4.5                | dpe_immeuble_chauffage_individuel.csv                    | 7371 (+51)                     | 74% (+1%)               |                                                   |
| 1.4.5                | dpe_immeuble_chauffage_collectif.csv                     | 6155 (+6)                      | 61%                     |                                                   |
| 1.4.5                | dpe_immeuble_chauffage_mixte.csv                         | 4816 (+11S)                    | 48%                     |                                                   |
| 1.4.5                | dpe_individuel_a_partir_dpe_immeuble_2026.csv            | 2755                           | 27%                     |                                                   |
| <ins>**1.5.1 **<ins> | <ins>**corpus_dpe.csv**<ins>                             | <ins>**4582**<ins>             | <ins>**46%**<ins>       |                                                   |
| 1.5.1                | dpe_logement_individuel_2025.csv                         | 8790                           | 88%                     |                                                   |
| 1.5.1                | dpe_maison_individuelle_2025.csv                         | 8791                           | 88%                     |                                                   |
| 1.5.1                | dpe_appartement_individuel_chauffage_individuel_2025.csv | 9143                           | 91%                     |                                                   |
| 1.5.1                | dpe_appartement_individuel_chauffage_collectif_2025.csv  | 6836                           | 68%                     |                                                   |
| 1.5.1                | dpe_immeuble_chauffage_individuel.csv                    | 7371                           | 74%                     |                                                   |
| 1.5.1                | dpe_immeuble_chauffage_collectif.csv                     | 6155                           | 61%                     |                                                   |
| 1.5.1                | dpe_immeuble_chauffage_mixte.csv                         | 4816                           | 48%                     |                                                   |
| 1.5.1                | dpe_individuel_a_partir_dpe_immeuble_2026.csv            | 2755                           | 27%                     |                                                   |

</details>

| Version librairie    | corpus                                                   | Nb en dessous du taux d'erreur | Taux de réussite  | Description |
| :------------------- | -------------------------------------------------------- | ------------------------------ | ----------------- | ----------- |
| <ins>**1.6.1 **<ins> | <ins>**corpus_dpe.csv**<ins>                             | <ins>**4591 (+3)**<ins>        | <ins>**46%**<ins> |             |
| 1.6.1                | dpe_logement_individuel_2025.csv                         | 8791 (+1)                      | 88%               |             |
| 1.6.1                | dpe_maison_individuelle_2025.csv                         | 8793 (+2)                      | 88%               |             |
| 1.6.1                | dpe_appartement_individuel_chauffage_individuel_2025.csv | 9146 (+3)                      | 91%               |             |
| 1.6.1                | dpe_appartement_individuel_chauffage_collectif_2025.csv  | 6837 (+1)                      | 68%               |             |
| 1.6.1                | dpe_immeuble_chauffage_individuel.csv                    | 7371                           | 74%               |             |
| 1.6.1                | dpe_immeuble_chauffage_collectif.csv                     | 6155                           | 61%               |             |
| 1.6.1                | dpe_immeuble_chauffage_mixte.csv                         | 4819 (+3)                      | 48%               |             |
| 1.6.1                | dpe_individuel_a_partir_dpe_immeuble_2026.csv            | 2755                           | 27%               |             |
