import { isLang, type Lang, t } from "../../../lib/i18n";

type Section = { title: string; paragraphs: string[] };
type ReturnsContent = { sections: Section[]; lastUpdatedLabel: string; backLabel: string };

const RETURNS_BY_LANG: Record<Lang, ReturnsContent> = {
  en: {
    sections: [
      {
        title: "1. Service Provider",
        paragraphs: [
          "Camillo Kamil Kwapich, ul. Swierkowa 33b, 46-100 Namyslow, Poland.",
          "Email: winqo@winqo.online.",
        ],
      },
      {
        title: "2. Scope and Definitions",
        paragraphs: [
          "This policy governs withdrawal, returns, and complaints for the digital SaaS service (the \"Service\").",
          "Service (SaaS) – online access to the application under a user account, including monthly or yearly subscriptions.",
          "User – any person using the Service.",
          "Consumer – a natural person contracting at a distance for purposes not primarily related to business or professional activity.",
        ],
      },
      {
        title: "3. Right of Withdrawal (Consumers) – 14 days",
        paragraphs: [
          "A Consumer who concluded a distance contract for the Service may withdraw within 14 days without stating a reason.",
          "The 14-day period runs from the date of contract conclusion.",
          "To exercise the right, submit a statement in any form, preferably by email to winqo@winqo.online.",
          "The provider may confirm receipt of the withdrawal by email.",
        ],
      },
      {
        title: "4. Starting the Service before 14 days – pro-rata settlement",
        paragraphs: [
          "If the Consumer requests the Service to start before the 14-day period and then withdraws, they must pay for the Service delivered until withdrawal.",
          "The amount is calculated proportionally to the extent/time of use in the billing period.",
          "Subscriptions: monthly – pro-rata by days used in the month; yearly – pro-rata by days used in the year, subject to mandatory law.",
        ],
      },
      {
        title: "5. Effect of Withdrawal and Refunds",
        paragraphs: [
          "Upon effective withdrawal, the contract is treated as not concluded for undelivered services, and the provider refunds payments no later than 14 days from receipt of the withdrawal.",
          "The provider may deduct the amount due for services delivered until withdrawal, as described in point 4.",
          "Refunds use the same payment method unless the Consumer agrees to another method.",
          "After withdrawal, the Consumer should stop using the Service.",
        ],
      },
      {
        title: "6. Subscription Auto-Renewal and Payments",
        paragraphs: [
          "The Service is provided on a monthly or yearly subscription basis, billed upfront unless stated otherwise.",
          "Subscriptions renew automatically for the next period unless the User disables renewal before the current period ends.",
          "Renewal can be disabled in the account panel; the Service then continues until the end of the paid period without renewal.",
          "If payment fails (e.g., insufficient funds, declined transaction), the provider may retry within a reasonable time and/or limit or suspend access until payment succeeds.",
          "Accounting documents (e.g., invoices) are issued per applicable law using User-provided data.",
          "Where plan changes are available, pricing or pro-rata rules (e.g., upgrades/downgrades) are shown at the time of change.",
          "Cancellation means disabling auto-renewal. Fees for a started billing period are generally non-refundable, except when: (a) the User effectively withdraws under this policy, or (b) a refund results from an accepted complaint / lack of conformity.",
        ],
      },
      {
        title: "7. Updates, Feature Changes, and Support (SaaS)",
        paragraphs: [
          "The provider may deploy updates, including security patches, bug fixes, and improvements.",
          "The User should use the Service in an environment meeting technical requirements (e.g., supported browsers/devices).",
          "Given the SaaS nature, the provider may adjust features, interface, or operation, provided changes do not remove essential characteristics or infringe Users' rights.",
          "If a change may significantly affect use, the provider may inform Users in the app or by email when feasible and justified.",
          "Support is provided via email: winqo@winqo.online.",
          "The provider strives for continuity, but maintenance or outages may occur; report issues with a description and account identifier.",
        ],
      },
      {
        title: "8. Complaints – Lack of Conformity",
        paragraphs: [
          "Independently of withdrawal, Consumers have rights when the Service lacks conformity (e.g., does not match the description, access fails, or significant errors occur).",
          "Submit complaints to winqo@winqo.online with at least: account email, purchase date/subscription period, and problem description.",
          "The provider will act to assess the complaint and restore conformity in line with applicable law.",
        ],
      },
      {
        title: "9. B2B Clients",
        paragraphs: [
          "The 14-day withdrawal right generally applies only to Consumers.",
          "For B2B relations, cancellation, settlements, and potential refunds follow the contract and mandatory law.",
        ],
      },
      {
        title: "10. Final Provisions",
        paragraphs: [
          "This policy applies to contracts with Users, including Consumers, unless mandatory law provides otherwise.",
          "Matters not regulated here are governed by applicable law.",
        ],
      },
    ],
    lastUpdatedLabel: "Last updated",
    backLabel: "Back to home",
  },
  pl: {
    sections: [
      {
        title: "1. Dane Usługodawcy",
        paragraphs: [
          "Camillo Kamil Kwapich",
          "ul. Świerkowa 33b, 46-100 Namysłów, Polska",
          "E-mail: winqo@winqo.online",
        ],
      },
      {
        title: "2. Zakres i definicje",
        paragraphs: [
          "Niniejszy regulamin określa zasady odstąpienia od umowy, zwrotów oraz reklamacji w zakresie korzystania z usługi cyfrowej w modelu SaaS (dalej: \"Usługa\").",
          "Usługa (SaaS) – usługa cyfrowa polegająca na zapewnieniu dostępu do aplikacji online w ramach konta użytkownika, w szczególności w formie subskrypcji miesięcznej lub rocznej.",
          "Użytkownik – osoba korzystająca z Usługi.",
          "Konsument – osoba fizyczna zawierająca umowę na odległość w celach niezwiązanych bezpośrednio z jej działalnością gospodarczą lub zawodową.",
        ],
      },
      {
        title: "3. Prawo odstąpienia od umowy (Konsumenci) – 14 dni",
        paragraphs: [
          "Konsument, który zawarł umowę na odległość o świadczenie Usługi, ma prawo odstąpić od umowy w terminie 14 dni bez podawania przyczyny.",
          "Termin 14 dni liczy się od dnia zawarcia umowy.",
          "Aby skorzystać z prawa odstąpienia, Konsument powinien złożyć oświadczenie w dowolnej formie, w szczególności poprzez wysłanie wiadomości e-mail na adres: winqo@winqo.online.",
          "Usługodawca może potwierdzić otrzymanie oświadczenia o odstąpieniu w wiadomości e-mail.",
        ],
      },
      {
        title: "4. Rozpoczęcie świadczenia Usługi przed upływem 14 dni – rozliczenie proporcjonalne",
        paragraphs: [
          "Jeżeli Konsument zażąda rozpoczęcia świadczenia Usługi przed upływem 14 dni od zawarcia umowy, a następnie odstąpi od umowy, Konsument jest zobowiązany do zapłaty za świadczenia spełnione do chwili odstąpienia.",
          "Kwota do zapłaty jest obliczana proporcjonalnie do zakresu spełnionego świadczenia, w szczególności proporcjonalnie do czasu korzystania z Usługi w danym okresie rozliczeniowym.",
          "W przypadku subskrypcji: miesięcznej – rozliczenie proporcjonalne do liczby dni korzystania w danym miesiącu, rocznej – proporcjonalnie do liczby dni korzystania w danym roku, z zastrzeżeniem przepisów bezwzględnie obowiązujących.",
        ],
      },
      {
        title: "5. Skutek odstąpienia i zwrot płatności",
        paragraphs: [
          "W razie skutecznego odstąpienia od umowy, umowę uważa się za niezawartą w zakresie świadczeń nieukończonych, a Usługodawca zwraca Konsumentowi otrzymane płatności nie później niż w terminie 14 dni od dnia otrzymania oświadczenia o odstąpieniu.",
          "Usługodawca może pomniejszyć kwotę zwrotu o należność za świadczenia spełnione do chwili odstąpienia, zgodnie z zasadami opisanymi w pkt 4.",
          "Zwrot płatności następuje przy użyciu takiego samego sposobu płatności, jaki został użyty przez Konsumenta, chyba że Konsument wyraźnie zgodził się na inny sposób zwrotu.",
          "Po odstąpieniu Konsument powinien zaprzestać korzystania z Usługi.",
        ],
      },
      {
        title: "6. Auto-odnowienie subskrypcji i płatności",
        paragraphs: [
          "Usługa jest świadczona w modelu subskrypcyjnym w planie miesięcznym lub rocznym, zgodnie z wyborem Użytkownika. Opłata jest pobierana z góry za wybrany okres rozliczeniowy, chyba że oferta wskazuje inaczej.",
          "Subskrypcja jest odnawiana automatycznie na kolejny okres rozliczeniowy, o ile Użytkownik nie wyłączy odnowienia przed zakończeniem bieżącego okresu.",
          "Wyłączenie odnowienia jest możliwe w panelu konta i powoduje, że subskrypcja nie przedłuży się na kolejny okres, a dostęp do Usługi trwa do końca opłaconego okresu.",
          "W przypadku nieudanej płatności (np. brak środków, odrzucona transakcja) Usługodawca może ponowić próbę pobrania płatności w rozsądnym terminie oraz/lub ograniczyć albo zawiesić dostęp do Usługi do czasu skutecznego opłacenia subskrypcji.",
          "Dokumenty księgowe (np. faktury) są wystawiane zgodnie z obowiązującymi przepisami i danymi podanymi przez Użytkownika.",
          "Jeżeli w panelu konta dostępna jest zmiana planu (np. miesięczny ↔ roczny), zasady naliczeń związane ze zmianą (np. dopłata lub rozliczenie proporcjonalne) są prezentowane Użytkownikowi w momencie dokonywania zmiany.",
          "Rezygnacja z subskrypcji oznacza wyłączenie auto-odnowienia. Opłata za rozpoczęty okres rozliczeniowy co do zasady nie podlega zwrotowi, z wyjątkiem przypadków, gdy Użytkownik skutecznie skorzysta z prawa odstąpienia na zasadach niniejszego regulaminu lub zwrot wynika z uznanej reklamacji / braku zgodności Usługi z umową.",
        ],
      },
      {
        title: "7. Aktualizacje, zmiany funkcjonalności i wsparcie (SaaS)",
        paragraphs: [
          "Usługodawca może wdrażać aktualizacje Usługi, w tym aktualizacje bezpieczeństwa, poprawki błędów oraz usprawnienia.",
          "Użytkownik powinien korzystać z Usługi w środowisku spełniającym wymagania techniczne (np. wspierane przeglądarki/urządzenia).",
          "Z uwagi na charakter Usługi SaaS, Usługodawca może wprowadzać zmiany w funkcjonalnościach, interfejsie lub sposobie działania Usługi, o ile zmiany te nie pozbawiają Usługi jej zasadniczych cech oraz nie naruszają uprawnień Użytkowników wynikających z przepisów.",
          "Jeżeli zmiana może istotnie wpływać na korzystanie z Usługi, Usługodawca może poinformować o niej Użytkowników w aplikacji lub e-mailem (jeżeli jest to możliwe i uzasadnione).",
          "Wsparcie techniczne jest świadczone poprzez e-mail: winqo@winqo.online.",
          "Usługodawca dokłada starań, aby Usługa działała w sposób ciągły, jednak mogą wystąpić przerwy techniczne (konserwacja, aktualizacje, awarie). Zgłoszenia dotyczące niedostępności lub błędów należy kierować na wskazany adres e-mail wraz z opisem problemu i identyfikatorem konta.",
        ],
      },
      {
        title: "8. Reklamacje – niezgodność Usługi z umową",
        paragraphs: [
          "Niezależnie od prawa odstąpienia, Konsumentowi przysługują uprawnienia w przypadku braku zgodności Usługi z umową, w szczególności gdy Usługa nie działa zgodnie z opisem, nie zapewnia dostępu lub posiada istotne błędy.",
          "Reklamacje należy zgłaszać na adres e-mail: winqo@winqo.online, podając co najmniej: e-mail konta, datę zakupu/okres subskrypcji oraz opis problemu.",
          "Usługodawca podejmie działania w celu rozpatrzenia reklamacji i przywrócenia zgodności Usługi z umową zgodnie z przepisami.",
        ],
      },
      {
        title: "9. Klienci B2B",
        paragraphs: [
          "Prawo odstąpienia w terminie 14 dni dotyczy co do zasady wyłącznie Konsumentów.",
          "W relacjach B2B zasady rezygnacji, rozliczeń i ewentualnych zwrotów wynikają z umowy i regulaminu, z uwzględnieniem przepisów bezwzględnie obowiązujących.",
        ],
      },
      {
        title: "10. Postanowienia końcowe",
        paragraphs: [
          "Niniejszy regulamin ma zastosowanie do umów zawieranych z Użytkownikami, w tym Konsumentami, w zakresie, w jakim przepisy bezwzględnie obowiązujące nie stanowią inaczej.",
          "W sprawach nieuregulowanych niniejszym regulaminem zastosowanie mają właściwe przepisy prawa.",
        ],
      },
    ],
    lastUpdatedLabel: "Ostatnia aktualizacja",
    backLabel: "Powrót do strony głównej",
  },
  de: {
    sections: [
      {
        title: "1. Angaben zum Diensteanbieter",
        paragraphs: [
          "Camillo Kamil Kwapich, ul. Swierkowa 33b, 46-100 Namyslow, Polen.",
          "E-Mail: winqo@winqo.online.",
        ],
      },
      {
        title: "2. Umfang und Definitionen",
        paragraphs: [
          "Diese Richtlinie regelt Widerruf, Rückerstattungen und Reklamationen für den digitalen SaaS-Dienst (nachfolgend: der \"Dienst\").",
          "Dienst (SaaS) – Online-Zugang zur Anwendung über ein Nutzerkonto, insbesondere als monatliches oder jährliches Abonnement.",
          "Nutzer – jede Person, die den Dienst nutzt.",
          "Verbraucher – natürliche Person, die einen Fernabsatzvertrag zu Zwecken abschließt, die überwiegend weder ihrer gewerblichen noch ihrer selbständigen beruflichen Tätigkeit zugerechnet werden können.",
        ],
      },
      {
        title: "3. Widerrufsrecht (Verbraucher) – 14 Tage",
        paragraphs: [
          "Ein Verbraucher, der einen Fernabsatzvertrag über den Dienst abgeschlossen hat, kann binnen 14 Tagen ohne Angabe von Gründen widerrufen.",
          "Die Frist beginnt am Tag des Vertragsabschlusses.",
          "Zur Ausübung genügt eine Erklärung, vorzugsweise per E-Mail an winqo@winqo.online.",
          "Der Anbieter kann den Eingang der Widerrufserklärung per E-Mail bestätigen.",
        ],
      },
      {
        title: "4. Beginn der Leistung vor 14 Tagen – anteilige Abrechnung",
        paragraphs: [
          "Verlangt der Verbraucher den Leistungsbeginn vor Ablauf von 14 Tagen und widerruft anschließend, hat er den Wert der bis zum Widerruf erbrachten Leistung zu zahlen.",
          "Die Zahlung wird anteilig nach Umfang/Zeit der Nutzung im Abrechnungszeitraum berechnet.",
          "Abonnements: monatlich – anteilig nach Nutzungstagen im Monat; jährlich – anteilig nach Nutzungstagen im Jahr, vorbehaltlich zwingender Vorschriften.",
        ],
      },
      {
        title: "5. Wirkung des Widerrufs und Erstattungen",
        paragraphs: [
          "Mit wirksamem Widerruf gilt der Vertrag hinsichtlich nicht erbrachter Leistungen als nicht geschlossen; der Anbieter erstattet erhaltene Zahlungen spätestens binnen 14 Tagen nach Eingang des Widerrufs.",
          "Der Anbieter kann den Erstattungsbetrag um den Wert der bis zum Widerruf erbrachten Leistung kürzen (vgl. Punkt 4).",
          "Die Erstattung erfolgt über dasselbe Zahlungsmittel, sofern der Verbraucher nicht ausdrücklich eine andere Methode wünscht.",
          "Nach dem Widerruf soll der Verbraucher die Nutzung des Dienstes einstellen.",
        ],
      },
      {
        title: "6. Automatische Verlängerung und Zahlungen",
        paragraphs: [
          "Der Dienst wird als monatliches oder jährliches Abonnement erbracht und im Voraus berechnet, sofern nicht anders angegeben.",
          "Das Abonnement verlängert sich automatisch, sofern der Nutzer die Verlängerung nicht vor Ende der aktuellen Periode deaktiviert.",
          "Die Deaktivierung ist im Konto möglich; der Zugang bleibt bis zum Ende der bereits bezahlten Periode bestehen, ohne Verlängerung.",
          "Bei fehlgeschlagener Zahlung (z. B. unzureichende Mittel, abgelehnte Transaktion) kann der Anbieter die Belastung in angemessenem Rahmen wiederholen und/oder den Zugang bis zur erfolgreichen Zahlung einschränken oder aussetzen.",
          "Rechnungen oder andere Belege werden gemäß geltendem Recht auf Basis der vom Nutzer angegebenen Daten ausgestellt.",
          "Soweit Tarifwechsel möglich sind, werden etwaige Preis- oder Anteilsregeln (z. B. Upgrade/Downgrade) zum Zeitpunkt der Änderung angezeigt.",
          "Kündigung bedeutet das Abschalten der automatischen Verlängerung. Entgelte für eine begonnene Abrechnungsperiode sind grundsätzlich nicht erstattungsfähig, außer (a) bei wirksamem Widerruf nach dieser Richtlinie oder (b) wenn eine Erstattung aus anerkannter Reklamation / mangelnder Vertragskonformität resultiert.",
        ],
      },
      {
        title: "7. Updates, Funktionsänderungen und Support (SaaS)",
        paragraphs: [
          "Der Anbieter kann Updates bereitstellen, einschließlich Sicherheits-Patches, Fehlerbehebungen und Verbesserungen.",
          "Der Nutzer sollte eine unterstützte Umgebung nutzen (z. B. kompatible Browser/Geräte).",
          "Aufgrund des SaaS-Charakters kann der Anbieter Funktionen, Oberfläche oder Funktionsweise anpassen, sofern wesentliche Merkmale nicht entzogen und Nutzerrechte nicht verletzt werden.",
          "Bei Änderungen mit wesentlichem Einfluss kann der Anbieter Nutzer in der Anwendung oder per E-Mail informieren, sofern möglich und angemessen.",
          "Support wird per E-Mail unter winqo@winqo.online erbracht.",
          "Der Anbieter strebt hohe Verfügbarkeit an, dennoch kann es zu Wartung oder Ausfällen kommen; Probleme bitte mit Beschreibung und Konto-ID melden.",
        ],
      },
      {
        title: "8. Reklamationen – Vertragswidrigkeit",
        paragraphs: [
          "Unabhängig vom Widerruf stehen Verbrauchern Rechte bei mangelnder Vertragskonformität des Dienstes zu (z. B. fehlender Zugriff, erhebliche Fehler).",
          "Reklamationen bitte an winqo@winqo.online mit mindestens: Konto-E-Mail, Kaufdatum/Abonnementzeitraum und Problembeschreibung.",
          "Der Anbieter prüft die Reklamation und stellt die Vertragskonformität gemäß geltendem Recht wieder her.",
        ],
      },
      {
        title: "9. B2B-Kunden",
        paragraphs: [
          "Das 14-tägige Widerrufsrecht gilt grundsätzlich nur für Verbraucher.",
          "Im B2B-Bereich richten sich Kündigung, Abrechnung und etwaige Erstattungen nach Vertrag und zwingendem Recht.",
        ],
      },
      {
        title: "10. Schlussbestimmungen",
        paragraphs: [
          "Diese Richtlinie gilt für Verträge mit Nutzern, einschließlich Verbrauchern, soweit zwingendes Recht nichts anderes bestimmt.",
          "Nicht geregelte Angelegenheiten unterliegen dem anwendbaren Recht.",
        ],
      },
    ],
    lastUpdatedLabel: "Letzte Aktualisierung",
    backLabel: "Zur Startseite",
  },
  es: {
    sections: [
      {
        title: "1. Datos del proveedor",
        paragraphs: [
          "Camillo Kamil Kwapich, ul. Swierkowa 33b, 46-100 Namyslow, Polonia.",
          "Email: winqo@winqo.online.",
        ],
      },
      {
        title: "2. Alcance y definiciones",
        paragraphs: [
          "Esta política regula el desistimiento, devoluciones y reclamaciones del servicio digital SaaS (el \"Servicio\").",
          "Servicio (SaaS): acceso en línea a la aplicación mediante cuenta de usuario, incluida la suscripción mensual o anual.",
          "Usuario: cualquier persona que utiliza el Servicio.",
          "Consumidor: persona física que celebra un contrato a distancia con fines ajenos principalmente a su actividad empresarial o profesional.",
        ],
      },
      {
        title: "3. Derecho de desistimiento (Consumidores) – 14 días",
        paragraphs: [
          "El Consumidor puede desistir del contrato a distancia del Servicio en 14 días sin indicar motivo.",
          "El plazo de 14 días se cuenta desde la celebración del contrato.",
          "Para ejercerlo, envíe una declaración por cualquier medio, preferiblemente por email a winqo@winqo.online.",
          "El proveedor puede confirmar la recepción del desistimiento por email.",
        ],
      },
      {
        title: "4. Inicio del Servicio antes de 14 días – prorrateo",
        paragraphs: [
          "Si el Consumidor solicita iniciar el Servicio antes de 14 días y luego desiste, debe pagar por el Servicio prestado hasta el desistimiento.",
          "El importe se calcula de forma proporcional al uso/tiempo dentro del periodo de facturación.",
          "Suscripciones: mensual – prorrateo por días usados del mes; anual – prorrateo por días usados del año, sujeto a la normativa imperativa.",
        ],
      },
      {
        title: "5. Efectos del desistimiento y reembolsos",
        paragraphs: [
          "Tras un desistimiento efectivo, el contrato se considera no celebrado respecto a las prestaciones no completadas y el proveedor reembolsa los pagos en un máximo de 14 días desde la recepción.",
          "El proveedor puede deducir el importe correspondiente al servicio prestado hasta el desistimiento (punto 4).",
          "El reembolso se realiza por el mismo medio de pago salvo acuerdo expreso del Consumidor para otro método.",
          "Después del desistimiento, el Consumidor debe dejar de usar el Servicio.",
        ],
      },
      {
        title: "6. Renovación automática y pagos",
        paragraphs: [
          "El Servicio se ofrece por suscripción mensual o anual, cobrada por adelantado salvo indicación contraria.",
          "La suscripción se renueva automáticamente salvo que el Usuario desactive la renovación antes de finalizar el periodo en curso.",
          "La desactivación puede hacerse en el panel de cuenta; el acceso continúa hasta el fin del periodo pagado, sin renovarse.",
          "Si el pago falla (fondos insuficientes, transacción rechazada), el proveedor puede reintentar en un plazo razonable y/o limitar o suspender el acceso hasta el pago satisfactorio.",
          "Los documentos contables (p. ej., facturas) se emiten conforme a la ley y a los datos facilitados por el Usuario.",
          "Si se permite cambiar de plan, las reglas de cargos o prorrateos (upgrade/downgrade) se muestran al momento del cambio.",
          "La cancelación implica desactivar la renovación automática. La tarifa del periodo iniciado no es reembolsable, salvo (a) desistimiento válido según esta política, o (b) reembolso derivado de reclamación aceptada / falta de conformidad.",
        ],
      },
      {
        title: "7. Actualizaciones, cambios de funcionalidades y soporte (SaaS)",
        paragraphs: [
          "El proveedor puede desplegar actualizaciones, incluidas de seguridad, correcciones y mejoras.",
          "El Usuario debe usar el Servicio en un entorno compatible (navegadores/dispositivos soportados).",
          "Por la naturaleza SaaS, el proveedor puede modificar funcionalidades, interfaz o modo de operación, siempre que no se eliminen características esenciales ni se vulneren derechos de los Usuarios.",
          "Si un cambio puede impactar de forma relevante, el proveedor puede informar en la aplicación o por email cuando sea factible y justificado.",
          "El soporte se brinda por email: winqo@winqo.online.",
          "Se busca la continuidad del Servicio, pero pueden existir mantenimientos o caídas; reporte problemas con descripción e ID de cuenta.",
        ],
      },
      {
        title: "8. Reclamaciones – falta de conformidad",
        paragraphs: [
          "Al margen del desistimiento, el Consumidor tiene derechos cuando el Servicio carece de conformidad (no coincide con la descripción, no permite acceso o tiene fallos graves).",
          "Envía reclamaciones a winqo@winqo.online indicando al menos: email de la cuenta, fecha de compra/periodo de suscripción y descripción del problema.",
          "El proveedor tomará medidas para evaluar y restablecer la conformidad conforme a la ley.",
        ],
      },
      {
        title: "9. Clientes B2B",
        paragraphs: [
          "El derecho de desistimiento de 14 días aplica, por regla general, solo a Consumidores.",
          "En relaciones B2B, las reglas de baja, liquidaciones y posibles reembolsos se rigen por el contrato y la normativa imperativa.",
        ],
      },
      {
        title: "10. Disposiciones finales",
        paragraphs: [
          "Esta política aplica a los contratos con Usuarios, incluidos Consumidores, salvo que la ley imperativa disponga lo contrario.",
          "Los asuntos no regulados se rigen por la legislación aplicable.",
        ],
      },
    ],
    lastUpdatedLabel: "Última actualización",
    backLabel: "Volver al inicio",
  },
  it: {
    sections: [
      {
        title: "1. Dati del fornitore",
        paragraphs: [
          "Camillo Kamil Kwapich, ul. Swierkowa 33b, 46-100 Namyslow, Polonia.",
          "Email: winqo@winqo.online.",
        ],
      },
      {
        title: "2. Ambito e definizioni",
        paragraphs: [
          "La presente policy disciplina recesso, rimborsi e reclami per il servizio digitale SaaS (il \"Servizio\").",
          "Servizio (SaaS): accesso online all'applicazione tramite account utente, anche in abbonamento mensile o annuale.",
          "Utente: chiunque utilizzi il Servizio.",
          "Consumatore: persona fisica che conclude un contratto a distanza per fini non prevalentemente professionali o imprenditoriali.",
        ],
      },
      {
        title: "3. Diritto di recesso (Consumatori) – 14 giorni",
        paragraphs: [
          "Il Consumatore può recedere dal contratto a distanza entro 14 giorni senza motivazione.",
          "Il termine decorre dalla data di conclusione del contratto.",
          "Per esercitare il recesso, inviare una dichiarazione con qualsiasi mezzo, preferibilmente via email a winqo@winqo.online.",
          "Il fornitore può confermare la ricezione del recesso via email.",
        ],
      },
      {
        title: "4. Avvio del Servizio prima di 14 giorni – ripartizione pro-rata",
        paragraphs: [
          "Se il Consumatore chiede l'avvio del Servizio prima di 14 giorni e poi recede, deve pagare il valore del Servizio prestato fino al recesso.",
          "L'importo è calcolato proporzionalmente all'uso/tempo all'interno del periodo di fatturazione.",
          "Abbonamenti: mensile – pro-rata per i giorni utilizzati nel mese; annuale – pro-rata per i giorni utilizzati nell'anno, salvo norme imperative.",
        ],
      },
      {
        title: "5. Effetti del recesso e rimborsi",
        paragraphs: [
          "In caso di recesso efficace, il contratto si considera non concluso per le prestazioni non erogate e il fornitore rimborsa i pagamenti entro 14 giorni dalla ricezione del recesso.",
          "Il fornitore può dedurre l'importo dovuto per le prestazioni rese fino al recesso (punto 4).",
          "Il rimborso avviene con lo stesso mezzo di pagamento, salvo diverso consenso del Consumatore.",
          "Dopo il recesso il Consumatore deve interrompere l'uso del Servizio.",
        ],
      },
      {
        title: "6. Rinnovo automatico e pagamenti",
        paragraphs: [
          "Il Servizio è erogato in abbonamento mensile o annuale, addebitato anticipatamente salvo diversa indicazione.",
          "L'abbonamento si rinnova automaticamente salvo disattivazione da parte dell'Utente prima della fine del periodo in corso.",
          "La disattivazione è possibile dal pannello account; l'accesso continua fino al termine del periodo pagato, senza rinnovo.",
          "In caso di pagamento non riuscito (fondi insufficienti, transazione rifiutata), il fornitore può riprovare entro un termine ragionevole e/o limitare o sospendere l'accesso finché il pagamento non va a buon fine.",
          "I documenti contabili (es. fatture) sono emessi secondo la legge applicabile usando i dati forniti dall'Utente.",
          "Se è disponibile il cambio piano, le regole di addebito o pro-rata (upgrade/downgrade) vengono mostrate al momento della modifica.",
          "La cancellazione equivale a disattivare il rinnovo automatico. Il corrispettivo del periodo iniziato non è rimborsabile, salvo (a) recesso valido ai sensi della presente policy, oppure (b) rimborso dovuto a reclamo accolto / mancanza di conformità.",
        ],
      },
      {
        title: "7. Aggiornamenti, variazioni funzionali e supporto (SaaS)",
        paragraphs: [
          "Il fornitore può distribuire aggiornamenti, incluse patch di sicurezza, bugfix e miglioramenti.",
          "L'Utente deve usare il Servizio in un ambiente supportato (browser/dispositivi compatibili).",
          "Per la natura SaaS, il fornitore può modificare funzionalità, interfaccia o modalità operativa, purché non vengano meno le caratteristiche essenziali né siano violati i diritti degli Utenti.",
          "Se una modifica può incidere in modo rilevante sull'uso, il fornitore può informare gli Utenti nell'app o via email quando fattibile e giustificato.",
          "Il supporto è fornito via email: winqo@winqo.online.",
          "Il fornitore punta alla continuità, ma possono verificarsi manutenzioni o disservizi; segnalare problemi con descrizione e ID account.",
        ],
      },
      {
        title: "8. Reclami – mancanza di conformità",
        paragraphs: [
          "Indipendentemente dal recesso, il Consumatore ha diritti in caso di mancanza di conformità del Servizio (es. mancato accesso o errori gravi).",
          "Inviare reclami a winqo@winqo.online indicando almeno: email dell'account, data di acquisto/periodo di abbonamento e descrizione del problema.",
          "Il fornitore valuterà e ripristinerà la conformità in linea con la legge applicabile.",
        ],
      },
      {
        title: "9. Clienti B2B",
        paragraphs: [
          "Il diritto di recesso di 14 giorni si applica di norma solo ai Consumatori.",
          "Nelle relazioni B2B, recesso, conteggi e rimborsi seguono il contratto e la normativa inderogabile.",
        ],
      },
      {
        title: "10. Disposizioni finali",
        paragraphs: [
          "La presente policy si applica ai contratti con gli Utenti, inclusi i Consumatori, salvo diversa previsione di legge imperativa.",
          "Per quanto non previsto, si applica la legge vigente.",
        ],
      },
    ],
    lastUpdatedLabel: "Ultimo aggiornamento",
    backLabel: "Torna alla home",
  },
  fr: {
    sections: [
      {
        title: "1. Données du prestataire",
        paragraphs: [
          "Camillo Kamil Kwapich, ul. Swierkowa 33b, 46-100 Namyslow, Pologne.",
          "E-mail : winqo@winqo.online.",
        ],
      },
      {
        title: "2. Champ d'application et définitions",
        paragraphs: [
          "Cette politique régit le droit de rétractation, les remboursements et réclamations pour le service SaaS numérique (le \"Service\").",
          "Service (SaaS) : accès en ligne à l'application via un compte utilisateur, y compris abonnement mensuel ou annuel.",
          "Utilisateur : toute personne utilisant le Service.",
          "Consommateur : personne physique concluant un contrat à distance à des fins non principalement professionnelles ou commerciales.",
        ],
      },
      {
        title: "3. Droit de rétractation (Consommateurs) – 14 jours",
        paragraphs: [
          "Le Consommateur peut se rétracter du contrat à distance dans un délai de 14 jours sans motif.",
          "Le délai court à compter de la conclusion du contrat.",
          "Pour exercer ce droit, envoyer une déclaration par tout moyen, de préférence par e-mail à winqo@winqo.online.",
          "Le prestataire peut confirmer la réception de la rétractation par e-mail.",
        ],
      },
      {
        title: "4. Démarrage du Service avant 14 jours – facturation au prorata",
        paragraphs: [
          "Si le Consommateur demande le début du Service avant 14 jours puis se rétracte, il doit payer la partie du Service fournie jusqu'à la rétractation.",
          "Le montant est calculé proportionnellement à l'utilisation/au temps dans la période de facturation.",
          "Abonnements : mensuel – prorata des jours utilisés du mois ; annuel – prorata des jours utilisés de l'année, sous réserve des règles impératives.",
        ],
      },
      {
        title: "5. Effets de la rétractation et remboursements",
        paragraphs: [
          "En cas de rétractation effective, le contrat est réputé non conclu pour les prestations non fournies et le prestataire rembourse les paiements dans les 14 jours suivant la réception.",
          "Le prestataire peut déduire la valeur des prestations fournies jusqu'à la rétractation (point 4).",
          "Le remboursement s'effectue via le même moyen de paiement, sauf accord exprès du Consommateur pour un autre mode.",
          "Après rétractation, le Consommateur doit cesser d'utiliser le Service.",
        ],
      },
      {
        title: "6. Renouvellement automatique et paiements",
        paragraphs: [
          "Le Service est proposé par abonnement mensuel ou annuel, facturé d'avance sauf indication contraire.",
          "L'abonnement se renouvelle automatiquement sauf désactivation par l'Utilisateur avant la fin de la période en cours.",
          "La désactivation peut être effectuée depuis le compte ; l'accès continue jusqu'à la fin de la période payée, sans renouvellement.",
          "En cas d'échec de paiement (fonds insuffisants, transaction refusée), le prestataire peut réessayer dans un délai raisonnable et/ou limiter ou suspendre l'accès jusqu'au paiement réussi.",
          "Les documents comptables (ex. factures) sont émis conformément au droit applicable et aux données fournies par l'Utilisateur.",
          "Si un changement de plan est disponible, les règles de facturation ou de prorata (upgrade/downgrade) sont affichées au moment du changement.",
          "La résiliation signifie la désactivation du renouvellement automatique. Les frais de la période commencée ne sont en principe pas remboursables, sauf (a) rétractation valable selon la présente politique ou (b) remboursement issu d'une réclamation acceptée / défaut de conformité.",
        ],
      },
      {
        title: "7. Mises à jour, évolutions fonctionnelles et support (SaaS)",
        paragraphs: [
          "Le prestataire peut déployer des mises à jour, y compris correctifs de sécurité, corrections et améliorations.",
          "L'Utilisateur doit utiliser le Service dans un environnement supporté (navigateurs/appareils compatibles).",
          "En raison de la nature SaaS, le prestataire peut modifier fonctionnalités, interface ou fonctionnement, à condition de ne pas supprimer les caractéristiques essentielles ni porter atteinte aux droits des Utilisateurs.",
          "Si une modification peut impacter significativement l'usage, le prestataire peut en informer les Utilisateurs dans l'application ou par e-mail lorsque cela est possible et justifié.",
          "Le support est assuré par e-mail : winqo@winqo.online.",
          "Le prestataire vise la continuité du Service, mais des maintenances ou interruptions peuvent survenir ; signaler les problèmes avec description et identifiant de compte.",
        ],
      },
      {
        title: "8. Réclamations – défaut de conformité",
        paragraphs: [
          "Indépendamment de la rétractation, le Consommateur dispose de droits en cas de défaut de conformité du Service (ex. accès impossible ou erreurs majeures).",
          "Adressez les réclamations à winqo@winqo.online en indiquant au moins : email du compte, date d'achat/période d'abonnement et description du problème.",
          "Le prestataire analysera la réclamation et rétablira la conformité conformément au droit applicable.",
        ],
      },
      {
        title: "9. Clients B2B",
        paragraphs: [
          "Le droit de rétractation de 14 jours concerne en principe uniquement les Consommateurs.",
          "Pour les relations B2B, la résiliation, les décomptes et éventuels remboursements découlent du contrat et des règles impératives applicables.",
        ],
      },
      {
        title: "10. Dispositions finales",
        paragraphs: [
          "La présente politique s'applique aux contrats conclus avec les Utilisateurs, y compris les Consommateurs, sauf disposition impérative contraire.",
          "Les points non prévus sont régis par le droit applicable.",
        ],
      },
    ],
    lastUpdatedLabel: "Dernière mise à jour",
    backLabel: "Retour à l'accueil",
  },
  "en-us": undefined as unknown as ReturnsContent,
  "en-uk": undefined as unknown as ReturnsContent,
};

RETURNS_BY_LANG["en-us"] = RETURNS_BY_LANG.en;
RETURNS_BY_LANG["en-uk"] = RETURNS_BY_LANG.en;

export default function Returns({ params }: { params: { lang: string } }) {
  const lang = (isLang(params.lang) ? params.lang : "en") as Lang;
  const content = RETURNS_BY_LANG[lang] || RETURNS_BY_LANG.en;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 px-4 py-14">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl bg-gradient-to-br from-white to-blue-50 p-8 glow-card border border-blue-100">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-8">
            {t(lang, "returns_title")}
          </h1>

          <div className="prose prose-blue max-w-none space-y-6 text-gray-700">
            {content.sections.map((section, idx) => (
              <section key={idx}>
                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">{section.title}</h2>
                {section.paragraphs.map((p, i) => (
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
