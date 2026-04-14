import { isLang, type Lang, t } from "../../../lib/i18n";

// Localized privacy policy content per language
// en-us/en-uk reuse the English copy
const PRIVACY_BY_LANG = {
  en: {
    sections: [
      {
        title: "1. Data Controller",
        paragraphs: [
          "Controller: Camillo Kamil Kwapich, ul. Swierkowa 33b, 46-100 Namyslow, Poland.",
          "Contact via the form available in the Platform.",
        ],
      },
      {
        title: "2. Scope of Data",
        paragraphs: [
          "Account and billing data (name, email, address, tax ID, phone).",
          "Usage data (quotes generated, activity timestamps).",
          "Technical data (IP, device, browser) for security and diagnostics.",
        ],
      },
      {
        title: "3. Purpose and Legal Basis",
        paragraphs: [
          "Service delivery and billing (contract).",
          "Security, fraud prevention, diagnostics (legitimate interest).",
          "Marketing emails if subscribed (consent, can be withdrawn).",
        ],
      },
      {
        title: "4. Retention",
        paragraphs: [
          "Account data kept for the duration of the subscription and legal retention requirements (e.g., tax).",
          "Logs and diagnostics kept for up to 12 months unless needed for security/legal claims.",
        ],
      },
      {
        title: "5. Processors and Transfers",
        paragraphs: [
          "Payment processors (e.g., Stripe/PayPal) receive billing data.",
          "Infrastructure and email service providers receive data as needed to operate the service.",
          "Data may be transferred outside the EEA with safeguards (e.g., SCCs).",
        ],
      },
      {
        title: "6. User Rights",
        paragraphs: [
          "Access, rectification, erasure, restriction, portability, and objection (where applicable).",
          "Withdraw marketing consent at any time via email footer or support.",
          "Lodge a complaint with a supervisory authority.",
        ],
      },
      {
        title: "7. Security",
        paragraphs: [
          "Data encrypted in transit; access is role-based and audited.",
          "Regular backups and monitoring to mitigate incidents.",
        ],
      },
      {
        title: "8. Cookies and Tracking",
        paragraphs: [
          "Essential cookies for authentication and session continuity.",
          "Analytics cookies only if enabled in your consent preferences.",
        ],
      },
    ],
    lastUpdatedLabel: "Last updated",
    backLabel: "Back to home",
  },
  pl: {
    sections: [
      {
        title: "1. Administrator danych",
        paragraphs: [
          "Administrator: Camillo Kamil Kwapich, ul. Świerkowa 33b, 46-100 Namysłów, Polska.",
          "Kontakt przez formularz w Platformie.",
        ],
      },
      {
        title: "2. Zakres danych",
        paragraphs: [
          "Dane konta i rozliczeń (imię, nazwisko, email, adres, NIP, telefon).",
          "Dane o użyciu (liczba wycen, znaczniki czasu aktywności).",
          "Dane techniczne (IP, urządzenie, przeglądarka) dla bezpieczeństwa i diagnostyki.",
        ],
      },
      {
        title: "3. Cel i podstawa",
        paragraphs: [
          "Świadczenie usług i rozliczenia (umowa).",
          "Bezpieczeństwo, zapobieganie nadużyciom, diagnostyka (prawnie uzasadniony interes).",
          "Komunikacja marketingowa przy zgodzie (można wycofać w każdej chwili).",
        ],
      },
      {
        title: "4. Okres przechowywania",
        paragraphs: [
          "Dane konta przez czas trwania subskrypcji oraz wymagane przepisami (np. podatkowymi).",
          "Logi i dane diagnostyczne do 12 miesięcy, chyba że potrzebne do celów bezpieczeństwa lub roszczeń.",
        ],
      },
      {
        title: "5. Podmioty przetwarzające",
        paragraphs: [
          "Operatorzy płatności (np. Stripe/PayPal) otrzymują dane rozliczeniowe.",
          "Dostawcy infrastruktury i email otrzymują dane niezbędne do działania usługi.",
          "Dane mogą być przekazywane poza EOG z odpowiednimi zabezpieczeniami (np. SCC).",
        ],
      },
      {
        title: "6. Prawa użytkownika",
        paragraphs: [
          "Dostęp, sprostowanie, usunięcie, ograniczenie, przenoszenie i sprzeciw (w stosownych przypadkach).",
          "Wycofanie zgody marketingowej w dowolnym momencie (link w mailu lub kontakt).",
          "Skarga do organu nadzorczego.",
        ],
      },
      {
        title: "7. Bezpieczeństwo",
        paragraphs: [
          "Szyfrowanie transmisji; dostęp oparty na rolach i audytowany.",
          "Regularne kopie zapasowe i monitoring incydentów.",
        ],
      },
      {
        title: "8. Pliki cookies",
        paragraphs: [
          "Niezbędne cookies dla logowania i sesji.",
          "Analityczne cookies tylko, jeśli wyrazisz zgodę w preferencjach.",
        ],
      },
    ],
    lastUpdatedLabel: "Ostatnia aktualizacja",
    backLabel: "Powrót do strony głównej",
  },
  de: {
    sections: [
      { title: "1. Verantwortlicher", paragraphs: [
        "Verantwortlicher: Camillo Kamil Kwapich, ul. Swierkowa 33b, 46-100 Namyslow, Polen.",
        "Kontakt über das Formular in der Plattform.",
      ]},
      { title: "2. Umfang der Daten", paragraphs: [
        "Konto- und Abrechnungsdaten (Name, E-Mail, Adresse, USt-ID, Telefon).",
        "Nutzungsdaten (Angebotsanzahl, Zeitstempel).",
        "Technische Daten (IP, Gerät, Browser) für Sicherheit und Diagnose.",
      ]},
      { title: "3. Zweck und Rechtsgrundlage", paragraphs: [
        "Bereitstellung und Abrechnung des Dienstes (Vertrag).",
        "Sicherheit, Betrugsprävention, Diagnose (berechtigtes Interesse).",
        "Marketing-E-Mails bei Einwilligung (widerrufbar).",
      ]},
      { title: "4. Aufbewahrung", paragraphs: [
        "Kontodaten für die Dauer des Abos und gesetzliche Aufbewahrung (z.B. Steuer).",
        "Logs/Diagnose bis zu 12 Monate, außer bei Sicherheits-/Rechtsbedarf.",
      ]},
      { title: "5. Auftragsverarbeiter", paragraphs: [
        "Zahlungsanbieter (z.B. Stripe/PayPal) erhalten Abrechnungsdaten.",
        "Infra- und E-Mail-Dienstleister erhalten erforderliche Daten zur Bereitstellung.",
        "Datenübermittlungen außerhalb des EWR mit geeigneten Garantien (z.B. SCC).",
      ]},
      { title: "6. Betroffenenrechte", paragraphs: [
        "Auskunft, Berichtigung, Löschung, Einschränkung, Übertragbarkeit, Widerspruch (soweit anwendbar).",
        "Widerruf von Marketing-Einwilligungen jederzeit (Mail-Link oder Kontakt).",
        "Beschwerde bei einer Aufsichtsbehörde.",
      ]},
      { title: "7. Sicherheit", paragraphs: [
        "Verschlüsselte Übertragung; rollenbasierter, protokollierter Zugriff.",
        "Regelmäßige Backups und Monitoring.",
      ]},
      { title: "8. Cookies", paragraphs: [
        "Notwendige Cookies für Authentifizierung und Sitzungen.",
        "Analyse-Cookies nur, wenn in den Präferenzen zugestimmt.",
      ]},
    ],
    lastUpdatedLabel: "Letzte Aktualisierung",
    backLabel: "Zur Startseite",
  },
  es: {
    sections: [
      { title: "1. Responsable del tratamiento", paragraphs: [
        "Responsable: Camillo Kamil Kwapich, ul. Swierkowa 33b, 46-100 Namyslow, Polonia.",
        "Contacto mediante el formulario de la Plataforma.",
      ]},
      { title: "2. Datos tratados", paragraphs: [
        "Datos de cuenta y facturación (nombre, email, dirección, NIF, teléfono).",
        "Datos de uso (presupuestos generados, marcas temporales).",
        "Datos técnicos (IP, dispositivo, navegador) para seguridad y diagnóstico.",
      ]},
      { title: "3. Finalidad y base legal", paragraphs: [
        "Prestación del servicio y facturación (contrato).",
        "Seguridad, prevención de fraude, diagnóstico (interés legítimo).",
        "Emails de marketing con consentimiento (revocable).",
      ]},
      { title: "4. Conservación", paragraphs: [
        "Datos de cuenta mientras dure la suscripción y según obligaciones legales (p.ej. fiscales).",
        "Registros y diagnósticos hasta 12 meses salvo necesidad de seguridad o reclamaciones.",
      ]},
      { title: "5. Encargados y transferencias", paragraphs: [
        "Procesadores de pago (p.ej. Stripe/PayPal) reciben datos de facturación.",
        "Proveedores de infraestructura y correo reciben datos necesarios para operar.",
        "Posibles transferencias fuera del EEE con garantías (p.ej. SCC).",
      ]},
      { title: "6. Derechos", paragraphs: [
        "Acceso, rectificación, supresión, limitación, portabilidad y oposición (según proceda).",
        "Revocar el consentimiento de marketing en cualquier momento (enlace en correo o contacto).",
        "Reclamar ante la autoridad de control.",
      ]},
      { title: "7. Seguridad", paragraphs: [
        "Cifrado en tránsito; acceso por roles y auditado.",
        "Copias de seguridad y monitorización continuas.",
      ]},
      { title: "8. Cookies", paragraphs: [
        "Cookies esenciales para autenticación y sesión.",
        "Cookies analíticas solo si las aceptas en tus preferencias.",
      ]},
    ],
    lastUpdatedLabel: "Última actualización",
    backLabel: "Volver al inicio",
  },
  it: {
    sections: [
      { title: "1. Titolare del trattamento", paragraphs: [
        "Titolare: Camillo Kamil Kwapich, ul. Swierkowa 33b, 46-100 Namyslow, Polonia.",
        "Contatto tramite il modulo nella Piattaforma.",
      ]},
      { title: "2. Dati trattati", paragraphs: [
        "Dati di account e fatturazione (nome, email, indirizzo, P.IVA, telefono).",
        "Dati d'uso (preventivi generati, timestamp).",
        "Dati tecnici (IP, dispositivo, browser) per sicurezza e diagnostica.",
      ]},
      { title: "3. Finalità e base giuridica", paragraphs: [
        "Erogazione del servizio e fatturazione (contratto).",
        "Sicurezza, prevenzione frodi, diagnostica (legittimo interesse).",
        "Email marketing con consenso (revocabile).",
      ]},
      { title: "4. Conservazione", paragraphs: [
        "Dati account per la durata dell'abbonamento e obblighi di legge (es. fiscali).",
        "Log/diagnostica fino a 12 mesi salvo esigenze di sicurezza o legali.",
      ]},
      { title: "5. Responsabili e trasferimenti", paragraphs: [
        "Processor di pagamento (es. Stripe/PayPal) ricevono dati di fatturazione.",
        "Provider di infrastruttura/email ricevono i dati necessari al servizio.",
        "Trasferimenti fuori dallo SEE con garanzie adeguate (es. SCC).",
      ]},
      { title: "6. Diritti", paragraphs: [
        "Accesso, rettifica, cancellazione, limitazione, portabilità e opposizione (se applicabile).",
        "Revoca del consenso marketing in ogni momento (link email o contatto).",
        "Reclamo all'autorità di controllo.",
      ]},
      { title: "7. Sicurezza", paragraphs: [
        "Crittografia in transito; accessi basati su ruoli e tracciati.",
        "Backup regolari e monitoraggio continuo.",
      ]},
      { title: "8. Cookie", paragraphs: [
        "Cookie essenziali per autenticazione e sessione.",
        "Cookie analitici solo se abilitati nelle preferenze.",
      ]},
    ],
    lastUpdatedLabel: "Ultimo aggiornamento",
    backLabel: "Torna alla home",
  },
  fr: {
    sections: [
      { title: "1. Responsable du traitement", paragraphs: [
        "Responsable : Camillo Kamil Kwapich, ul. Swierkowa 33b, 46-100 Namyslow, Pologne.",
        "Contact via le formulaire disponible sur la Plateforme.",
      ]},
      { title: "2. Données traitées", paragraphs: [
        "Données de compte et de facturation (nom, email, adresse, TVA, téléphone).",
        "Données d'usage (devis générés, horodatages).",
        "Données techniques (IP, appareil, navigateur) pour sécurité et diagnostic.",
      ]},
      { title: "3. Finalités et base légale", paragraphs: [
        "Fourniture du service et facturation (contrat).",
        "Sécurité, prévention de fraude, diagnostic (intérêt légitime).",
        "Emails marketing avec consentement (révocable).",
      ]},
      { title: "4. Conservation", paragraphs: [
        "Données de compte pendant l'abonnement et obligations légales (ex. fiscales).",
        "Journaux/diagnostic jusqu'à 12 mois sauf besoin de sécurité ou réclamations.",
      ]},
      { title: "5. Sous-traitants et transferts", paragraphs: [
        "Prestataires de paiement (ex. Stripe/PayPal) reçoivent les données de facturation.",
        "Fournisseurs d'infrastructure et d'email reçoivent les données nécessaires au service.",
        "Transferts hors EEE avec garanties adéquates (ex. clauses contractuelles types).",
      ]},
      { title: "6. Droits", paragraphs: [
        "Accès, rectification, effacement, limitation, portabilité et opposition (selon le cas).",
        "Retrait du consentement marketing à tout moment (lien email ou contact).",
        "Plainte auprès d'une autorité de contrôle.",
      ]},
      { title: "7. Sécurité", paragraphs: [
        "Chiffrement en transit; accès basé sur les rôles et journalisé.",
        "Sauvegardes régulières et surveillance continue.",
      ]},
      { title: "8. Cookies", paragraphs: [
        "Cookies essentiels pour l'authentification et la session.",
        "Cookies d'analyse uniquement si vous les acceptez dans vos préférences.",
      ]},
    ],
    lastUpdatedLabel: "Dernière mise à jour",
    backLabel: "Retour à l'accueil",
  },
  "en-us": undefined as any,
  "en-uk": undefined as any,
} as const;

(PRIVACY_BY_LANG as any)["en-us"] = PRIVACY_BY_LANG.en;
(PRIVACY_BY_LANG as any)["en-uk"] = PRIVACY_BY_LANG.en;

export default function Privacy({ params }: { params: { lang: string } }) {
  const lang = (isLang(params.lang) ? params.lang : "en") as Lang;
  const content = (PRIVACY_BY_LANG as any)[lang] || PRIVACY_BY_LANG.en;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 px-4 py-14">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl bg-gradient-to-br from-white to-blue-50 p-8 glow-card border border-blue-100">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-8">
            {t(lang, "privacy_title")}
          </h1>

          <div className="prose prose-blue max-w-none space-y-6 text-gray-700">
            {content.sections.map((section: any, idx: number) => (
              <section key={idx}>
                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">{section.title}</h2>
                {section.paragraphs.map((p: string, i: number) => (
                  <p key={i} className={i === 0 ? undefined : "mt-2"}>{p}</p>
                ))}
              </section>
            ))}

            <div className="mt-12 pt-6 border-t border-gray-200 text-sm text-gray-600">
              <p>{content.lastUpdatedLabel}: {new Date().toLocaleDateString(lang === "pl" ? "pl-PL" : "en-US")}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a
            href={`/${lang}`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            ← {content.backLabel}
          </a>
        </div>
      </div>
    </main>
  );
}
