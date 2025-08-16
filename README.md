# RD Leitfaden (PWA)
Offline-fähige App für **ÄLRD-Handlungsempfehlungen** & **2c-Algorithmen**. 
Einsetzbar als Web-App (PWA) mit Update-Mechanismus über eine zentrale Registry.

## Schnellstart
1. Ordner entpacken
2. Lokalen Server starten (Beispiel):  
   ```bash
   python -m http.server 8000
   ```
3. Im Browser öffnen: http://localhost:8000  
4. Über „Installieren“ als App hinzufügen

## Inhalte (Beispiele, Stand beim Build)
- Bayern – 2c-Delegationsalgorithmen (01.04.2024), Quelle: ÄLRD Bayern
- Schleswig-Holstein – Handlungsempfehlungen (14.02.2023)
- Rheinland-Pfalz – Algorithmen NotSan (2023)
- NRW – Behandlungspfade/Standardarbeitsanweisungen (2023)
- Hessen – Anlage 2c (2014)

## Updates „immer aktuell“
- Die App prüft beim Start **content/registry.json** und optional eine zentrale **Registry-URL** (Einstellungen).
- Legt eure eigene **registry.json** auf GitHub/GitLab/SharePoint ab und tragt die URL ein – neue/aktualisierte Dokumente erscheinen sofort.
- Einzelne PDFs können per „Für offline speichern“ in den Cache geladen werden (funktioniert i.d.R. auch bei `no-cors`).

### Registry-Format (Beispiel)
```json
{
  "version": 2,
  "generated": "2025-08-16T00:00:00Z",
  "sources": [
    {
      "id": "bayern-2c-2025",
      "title": "Bayern – 2c-Delegationsalgorithmen (01.06.2025)",
      "type": "2c",
      "state": "Bayern",
      "publisher": "ÄLRD Bayern",
      "url": "https://…/Delegationsalgorithmen-2c_250601.pdf",
      "updated": "2025-06-01",
      "offline": false,
      "notes": "Changelog …"
    }
  ]
}
```

## Rechtliches & Qualität
- Regionale Gültigkeit: Inhalte gelten je nach **Bundesland/ÄLRD** unterschiedlich.
- Medizinische Verantwortung/Delegation verbleibt bei der zuständigen ÄLRD.
- Bitte die Quellen **prüfen** und nur **offizielle** Dokumente einbinden. 

## Quellen (Auswahl)
- Bayern 2c (01.04.2024): https://www.aelrd-bayern.de/images/Delegationsalgorithmen-2c_240401.pdf
- SH Handlungsempfehlungen (14.02.2023): https://www.sh-landkreistag.de/fileadmin/download/Aktuelles/Rettungsdienst/Algorithmen_fuer_den_Rettungsdienst_in_Schleswig-Holstein_2023_v9.0.1.pdf
- RLP Algorithmen (2023): https://mastd.rlp.de/fileadmin/06/02_Arbeit/Arbeit_Dokumente/Anlage_Algorithmen_NotSan_2023.pdf
- NRW Behandlungspfade (2023): https://www.mags.nrw/system/files/media/document/file/bpr_saa_hinweise.pdf
- Hessen Anlage 2c (2014): https://www.skverlag.de/fileadmin/files_content/Gesetze_und_Verordnungen/Hessen_Rahmenlehrplan_NotSan_Anlage_2c.pdf

© 2025
